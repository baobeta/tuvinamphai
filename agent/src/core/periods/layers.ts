import { daysInLunarMonth, julianDayFromSolar, lunarToSolar } from "../calendar/lunar.js";
import { branchName, dayStemBranch, mod, hourStemBranch, monthStemBranch, stemName, yearStemBranch, type StemBranch } from "../calendar/stem-branch.js";
import { finding, type Certainty, type Finding } from "../analysis/finding.js";
import { firstMonthPalace, flowingStars, yearView, type FlowingStar } from "../chart/periods.js";
import type { Chart } from "../chart/types.js";
import { err, ok, type Result } from "../result.js";
import {
  agePalace,
  dipperGroupOf,
  emphasisDipper,
  favourableDipper,
  fixedMonthPalace,
  FLOWING_MAJOR_LAST_STEP_IN_BOOK,
  flowingDayPalace,
  flowingHourPalace,
  flowingMajorPeriodPalace,
  flowingMonthPalace,
  isAgeYearReturn,
  COINCIDENCE_MIN_AGE,
  layerRoles,
  largestPeriodSideStep,
  BUREAU_AVOIDANCE_UNCERTAIN,
  BUREAU_AVOIDED_BRANCHES,
  tabooRow,
  transformationsForStem,
  transformationVariants,
  type DipperGroup,
  type PalaceAssignment,
  type StemTransformation,
} from "./rules.js";

export interface PeriodView {
  readonly year: number;
  readonly month?: number;
  readonly day?: number;
  readonly hourBranch?: number;
}

export type FirstMonthStart = "view-year-branch" | "minor-period-palace";
export type MinorLayerStems = "calendar" | "omit";
export type FlowingMajorThirdStep = "against-direction" | "toward-largest-period";

export interface PeriodOptions {
  readonly firstMonthStart: FirstMonthStart;
  readonly minorLayerStems: MinorLayerStems;
  readonly flowingMajorThirdStep: FlowingMajorThirdStep;
}

export const DEFAULT_PERIOD_OPTIONS: PeriodOptions = {
  firstMonthStart: "view-year-branch",
  minorLayerStems: "calendar",
  flowingMajorThirdStep: "against-direction",
};

export type LayerName =
  | "Đại hạn"
  | "Lưu đại hạn"
  | "Đồng hạn"
  | "Tiểu hạn"
  | "Lưu niên"
  | "Tháng cố định"
  | "Lưu nguyệt"
  | "Lưu nhật"
  | "Lưu thời";

export interface TimeLayer {
  readonly name: LayerName;
  readonly palace: number;
  readonly roles: readonly PalaceAssignment[] | null;
  readonly certainty: Certainty;
  readonly assumptions: readonly string[];
  readonly variants: readonly string[];
  readonly source: string;
}

export interface LayerTransformationSet {
  readonly stemSource: string;
  readonly stem: number;
  readonly primary: boolean;
  readonly scope: string;
  readonly stars: readonly StemTransformation[];
  readonly certainty: Certainty;
  readonly assumptions: readonly string[];
  readonly variants: readonly string[];
  readonly source: string;
}

export interface MajorPeriodSpan {
  readonly palace: number;
  readonly fromAge: number;
  readonly toAge: number;
}

export interface Coincidence {
  readonly majorMinor: boolean;
  readonly majorFlowingYear: boolean;
}

export interface AgeYearStatus {
  readonly agePalace: number;
  readonly minorAtAgePalace: boolean;
  readonly majorAtAgePalace: boolean;
}

export interface TabooHit {
  readonly tabooYearBranches: readonly number[];
  readonly yearHit: boolean;
  readonly periodPalaceHits: readonly { readonly layer: "Đại hạn" | "Tiểu hạn"; readonly palace: number }[];
  readonly starHits: readonly { readonly star: string; readonly layer: "Đại hạn" | "Tiểu hạn"; readonly palace: number; readonly flowing: boolean }[];
}

export interface DipperStatus {
  readonly favourable: "Nam đẩu" | "Bắc đẩu";
  readonly emphasis: "Nam đẩu" | "Bắc đẩu";
  readonly stepInDecade: number;
  readonly halfFromAge: number;
  readonly halfToAge: number;
  readonly stars: readonly { readonly star: string; readonly group: DipperGroup; readonly np1Only: boolean }[];
}

export interface PeriodLayers {
  readonly view: PeriodView;
  readonly age: number;
  readonly viewYear: StemBranch;
  readonly majorPeriod: MajorPeriodSpan | null;
  readonly layers: readonly TimeLayer[];
  readonly transformations: readonly LayerTransformationSet[];
  readonly coincidence: Coincidence;
  readonly ageYear: AgeYearStatus;
  readonly taboo: TabooHit;
  readonly dipper: DipperStatus | null;
  readonly bureauAvoidance: BureauAvoidance;
  readonly flowingStars: readonly FlowingStar[];
  readonly findings: readonly Finding[];
}

const KB = "10_Van-han";
const LEAP_ASSUMPTION = "Tháng xem coi là tháng thường; sách không nêu cách tính tháng nhuận (A-LEAP).";
const DERIVED_FROM_MONTH_ASSUMPTION = "Đếm từ cung lưu nguyệt, nên theo cùng cách hiểu về cung tháng Giêng của lưu nguyệt.";

const firstMonthAssumption = (start: FirstMonthStart): string =>
  start === "view-year-branch"
    ? "Tháng Giêng khởi từ cung Lưu niên (chi năm xem) theo MLTC tr.845. TVTH tr.137 viết \"lấy năm Tiểu hạn làm tháng Giêng\" có thể đọc là cung tiểu hạn, nhưng ví dụ của chính TVTH tr.137 (năm xem Tuất, tháng 4 giờ Sửu → Thân) chỉ tính được theo chi năm xem."
    : "Tháng Giêng khởi từ cung tiểu hạn (đọc chữ \"năm Tiểu hạn\" của TVTH tr.137); MLTC tr.845 và ví dụ TVTH tr.137 ủng hộ cung chi năm xem.";

const MINOR_STEMS_ASSUMPTION =
  "Kho chưa có cách xác định can Lưu Nguyệt, Lưu Nhật, Lưu Thời; đang dùng can tháng theo Ngũ hổ độn, can ngày theo lịch, can giờ theo Ngũ thử độn (kiến thức phổ thông ngoài kho, A-LUU-STEMS).";

const isIntegerIn = (value: number, min: number, max: number): boolean => Number.isInteger(value) && value >= min && value <= max;

function validateView(view: PeriodView): Result<PeriodView> {
  if (view.day !== undefined && view.month === undefined) return err("Muốn xem lưu nhật phải cho tháng xem.");
  if (view.hourBranch !== undefined && view.day === undefined) return err("Muốn xem lưu thời phải cho ngày xem.");
  if (view.month !== undefined && !isIntegerIn(view.month, 1, 12)) return err(`Tháng âm phải từ 1 đến 12; nhận được ${view.month}`);
  if (view.hourBranch !== undefined && !isIntegerIn(view.hourBranch, 0, 11)) return err(`Chi giờ phải từ 0 (Tý) đến 11 (Hợi); nhận được ${view.hourBranch}`);
  if (view.day !== undefined) {
    if (!isIntegerIn(view.day, 1, 30)) return err(`Ngày âm phải từ 1 đến 30; nhận được ${view.day}`);
    const length = daysInLunarMonth(view.year, view.month!, false);
    if (!length.ok) return length;
    if (view.day > length.value) return err(`Tháng ${view.month} năm âm ${view.year} chỉ có ${length.value} ngày; nhận được ngày ${view.day}`);
  }
  return ok(view);
}

function dayStem(view: PeriodView): Result<StemBranch> {
  const solar = lunarToSolar({ year: view.year, month: view.month!, day: view.day!, isLeapMonth: false });
  return solar.ok ? ok(dayStemBranch(julianDayFromSolar(solar.value))) : solar;
}

const BOOK_EXAMPLE_LAST_STEP = FLOWING_MAJOR_LAST_STEP_IN_BOOK;
const BOOK_EXAMPLE_START_AGE = 32;
const LARGEST_DRAWN_PERIOD_OFFSET = 70;

const isBookExampleDecade = (chart: Chart, major: MajorPeriodSpan): boolean =>
  !chart.parameters.forward &&
  chart.parameters.bureau.number === 2 &&
  chart.parameters.lifePalace === 2 &&
  major.fromAge === BOOK_EXAMPLE_START_AGE;

function flowingMajorLayer(chart: Chart, major: MajorPeriodSpan, age: number, thirdStep: FlowingMajorThirdStep): TimeLayer | null {
  const forward = chart.parameters.forward;
  const geometric = flowingMajorPeriodPalace(major.palace, major.fromAge, forward, age);
  if (geometric === null) return null;
  const step = age - major.fromAge;
  const largestPeriod = chart.palaces.find((palace) => palace.majorPeriodStartAge === chart.parameters.bureau.number + LARGEST_DRAWN_PERIOD_OFFSET)!;
  const literal = step === 2 ? largestPeriodSideStep(mod(major.palace + 6, 12), largestPeriod.branch, forward) : geometric;
  const palace = thirdStep === "toward-largest-period" ? literal : geometric;
  const alternative = thirdStep === "toward-largest-period" ? geometric : literal;
  const verified = step <= 1 || (isBookExampleDecade(chart, major) && step <= BOOK_EXAMPLE_LAST_STEP);
  const readingText =
    thirdStep === "toward-largest-period"
      ? `bước tuổi thứ ba đọc theo chữ "đếm về phía đại hạn lớn": đi sang cung cạnh cung xung chiếu gần cung đại hạn ${largestPeriod.majorPeriodStartAge} (${branchName(largestPeriod.branch)}) hơn`
      : "bước tuổi thứ ba đọc theo hình học của ví dụ: đi một cung ngược chiều đại hạn từ cung xung chiếu";
  return {
    name: "Lưu đại hạn",
    palace,
    roles: null,
    certainty: verified ? "exact" : "interpretive",
    assumptions: verified
      ? []
      : [
          `Ngoài ví dụ duy nhất của sách (Dương Nữ Thủy nhị cục Mệnh Dần, 32 → 39): ${readingText}; sau đó trở về cung xung chiếu rồi đi theo chiều đại hạn. Bản kho là OCR của sơ đồ nên số trên hình có thể lẫn.`,
          ...(forward && step >= 2 ? ["Lá số đi thuận: chiều suy theo đối xứng từ ví dụ đi nghịch (A-LDH-DIR)."] : []),
          ...(step > BOOK_EXAMPLE_LAST_STEP ? ["Sách chỉ ghi đến tuổi thứ tám của đại hạn; các tuổi sau được ngoại suy theo cùng quy tắc."] : []),
        ],
    variants: [
      ...(alternative !== palace
        ? [
            thirdStep === "toward-largest-period"
              ? `Đọc theo hình học của ví dụ (một cung ngược chiều đại hạn): ${branchName(alternative)}.`
              : `Đọc theo chữ "đếm về phía đại hạn lớn" (phía cung đại hạn ${largestPeriod.majorPeriodStartAge}, ${branchName(largestPeriod.branch)}): ${branchName(alternative)}.`,
          ]
        : []),
      "MLTC không có lưu đại hạn; MLTC dùng cung Lưu niên là cung chi năm xem. Kho giữ cả hai, không phân xử.",
    ],
    source: "TVTH tr.141",
  };
}

function rolesLayer(name: LayerName, palace: number, source: string, extra: Partial<TimeLayer> = {}): TimeLayer {
  return { name, palace, roles: layerRoles(palace), certainty: "exact", assumptions: [], variants: [], source, ...extra };
}

function transformationSet(
  chart: Chart,
  stemSource: string,
  stem: number,
  scope: string,
  source: string,
  extra: Partial<LayerTransformationSet> = {},
): LayerTransformationSet {
  return {
    stemSource,
    stem,
    primary: true,
    scope,
    stars: transformationsForStem(chart, stem),
    certainty: "exact",
    assumptions: [],
    variants: transformationVariants(stem, chart),
    source,
    ...extra,
  };
}

function layerPalaceStemSets(
  chart: Chart,
  entries: readonly { readonly name: "Lưu nguyệt" | "Lưu nhật" | "Lưu thời"; readonly palace: number | null; readonly scope: string }[],
): readonly LayerTransformationSet[] {
  return entries.flatMap(({ name, palace, scope }) => {
    if (palace === null) return [];
    const stem = chart.palaces[palace]!.stem;
    const monthLayer = name === "Lưu nguyệt";
    return [
      transformationSet(chart, `Can cung ${name} (${stemName(stem)} ${branchName(palace)})`, stem, scope, "MLTC tr.862-864", {
        certainty: "interpretive",
        assumptions: [
          ...(monthLayer ? ["MLTC chỉ nêu can cung cho cung Lưu Nhật và Lưu Thời; áp dụng tương tự cho cung Lưu Nguyệt."] : []),
          "Cung này phụ thuộc cách hiểu về cung tháng Giêng của lưu nguyệt; MLTC không nêu thứ tự ưu tiên giữa can lưu và can cung.",
        ],
      }),
    ];
  });
}

export interface BureauAvoidance {
  readonly avoidedBranches: readonly number[];
  readonly hits: readonly { readonly layer: "Đại hạn" | "Tiểu hạn"; readonly palace: number }[];
}

function bureauAvoidance(chart: Chart, majorPalace: number | null, minorPalace: number): BureauAvoidance {
  const avoidedBranches = BUREAU_AVOIDED_BRANCHES[chart.parameters.bureau.number] ?? [];
  const hanPalaces = [
    ...(majorPalace === null ? [] : [{ layer: "Đại hạn" as const, palace: majorPalace }]),
    { layer: "Tiểu hạn" as const, palace: minorPalace },
  ];
  return { avoidedBranches, hits: hanPalaces.filter((han) => avoidedBranches.includes(han.palace)) };
}

function tabooStatus(chart: Chart, viewBranch: number, majorPalace: number | null, minorPalace: number, flowing: readonly FlowingStar[]): TabooHit {
  const table = tabooRow(chart.parameters.year.branch);
  const hanPalaces = [
    ...(majorPalace === null ? [] : [{ layer: "Đại hạn" as const, palace: majorPalace }]),
    { layer: "Tiểu hạn" as const, palace: minorPalace },
  ];
  return {
    tabooYearBranches: table.years,
    yearHit: table.years.includes(viewBranch),
    periodPalaceHits: hanPalaces.filter((han) => table.periodPalaces.includes(han.palace)),
    starHits: hanPalaces.flatMap((han) => [
      ...table.stars
        .filter((star) => chart.palaces[han.palace]!.stars.some((placed) => placed.name === star))
        .map((star) => ({ star, layer: han.layer, palace: han.palace, flowing: false })),
      ...table.stars
        .filter((star) => flowing.some((placed) => placed.name === `L. ${star}` && placed.palace === han.palace))
        .map((star) => ({ star: `L. ${star}`, layer: han.layer, palace: han.palace, flowing: true })),
    ]),
  };
}

function dipperStatus(chart: Chart, major: MajorPeriodSpan, age: number): DipperStatus {
  const step = age - major.fromAge;
  const emphasis = emphasisDipper(step);
  const stars = chart.palaces[major.palace]!.stars.flatMap((placed) => {
    const group = dipperGroupOf(placed.name);
    return group ? [{ star: placed.name, ...group }] : [];
  });
  return {
    favourable: favourableDipper(chart),
    emphasis,
    stepInDecade: step,
    halfFromAge: emphasis === "Bắc đẩu" ? major.fromAge : major.fromAge + 5,
    halfToAge: emphasis === "Bắc đẩu" ? major.fromAge + 4 : major.toAge,
    stars,
  };
}

const palaceText = (chart: Chart, branch: number): string => `${chart.palaces[branch]!.role} (${branchName(branch)})`;

function layerFindings(
  chart: Chart,
  age: number,
  layers: readonly TimeLayer[],
  major: MajorPeriodSpan | null,
  coincidence: Coincidence,
  ageYear: AgeYearStatus,
  taboo: TabooHit,
  dipper: DipperStatus | null,
): readonly Finding[] {
  const flowingMajor = layers.find((layer) => layer.name === "Lưu đại hạn");
  const childhood = layers.find((layer) => layer.name === "Đồng hạn");
  const birthBranch = chart.parameters.year.branch;
  const table = tabooRow(birthBranch);
  return [
    ...(major === null
      ? [
          finding({
            id: "PH-CHUA-VAO-DAI-HAN",
            name: "Chưa vào đại hạn",
            polarity: "trung tính",
            certainty: "exact",
            summary: `Tuổi ${age} chưa tới đại hạn đầu (khởi ${chart.parameters.bureau.number} tuổi theo ${chart.parameters.bureau.name}); xem đồng hạn.`,
            source: "TVTH tr.22; NP2 tr.10-12",
            kbFile: `${KB}/02_Tieu-han/01_An-tieu-han-va-dong-han.md`,
          }),
        ]
      : []),
    ...(childhood && major !== null
      ? [
          finding({
            id: "PH-DONG-HAN-TRUNG-DAI-HAN",
            name: "Đồng hạn trùng thời gian đại hạn đầu",
            polarity: "trung tính",
            certainty: "interpretive",
            summary: `Tuổi ${age}: đồng hạn ở ${palaceText(chart, childhood.palace)}, đồng thời đã vào đại hạn ${palaceText(chart, major.palace)}.`,
            assumptions: ["Sách nói dưới 13 tuổi xem đồng hạn nhưng không nói đại hạn trong các tuổi này; trả cả hai (A-DONGHAN-OVERLAP)."],
            source: "NP2 tr.10-12",
            kbFile: `${KB}/02_Tieu-han/01_An-tieu-han-va-dong-han.md`,
          }),
        ]
      : []),
    ...(flowingMajor
      ? [
          finding({
            id: "PH-LUU-DAI-HAN",
            name: "Lưu đại hạn",
            polarity: "trung tính",
            certainty: flowingMajor.certainty,
            summary: `Tuổi ${age}: lưu niên đại hạn ở ${palaceText(chart, flowingMajor.palace)}; dùng phối với tiểu hạn.`,
            assumptions: flowingMajor.assumptions,
            variants: flowingMajor.variants,
            source: "TVTH tr.141",
            kbFile: `${KB}/01_Dai-van/04_Cach-luu-dai-han-theo-nam.md`,
          }),
        ]
      : []),
    ...(coincidence.majorMinor
      ? [
          finding({
            id: "PH-TRUNG-PHUNG",
            name: "Đại tiểu hạn trùng phùng",
            polarity: "trung tính",
            certainty: "exact",
            summary: `Đại hạn và tiểu hạn cùng ở ${palaceText(chart, major!.palace)}: "tốt hay xấu cùng gia tăng kinh khủng".`,
            satisfied: [`tuổi ${age} ≥ ${COINCIDENCE_MIN_AGE}`, "cung đại hạn = cung tiểu hạn"],
            source: "TVTH tr.143",
            kbFile: `${KB}/03_Trung-phung/01_Dai-tieu-han-trung-phung.md`,
          }),
        ]
      : []),
    ...(coincidence.majorFlowingYear
      ? [
          finding({
            id: "PH-DAI-HAN-LUU-NIEN-TRUNG",
            name: "Đại hạn trùng cung Lưu niên",
            polarity: "trung tính",
            certainty: "interpretive",
            summary: `Cung đại hạn là cung chi năm xem (${branchName(major!.palace)}). MLTC chỉ đoán tai họa khi đó là cung yếu nhất (chính tinh hãm, sát tinh, đối cung Hóa Kỵ xung); phần đó chưa xét.`,
            assumptions: ["Chỉ báo sự trùng cung, không xét điều kiện cung yếu."],
            source: "MLTC tr.862-864",
            kbFile: `${KB}/04_Luu-nien/08_Lap-12-cung-luu-nien-va-chon-can.md`,
          }),
        ]
      : []),
    ...(ageYear.minorAtAgePalace || ageYear.majorAtAgePalace
      ? [
          finding({
            id: "PH-CUNG-TUOI",
            name: "Hạn đến cung tuổi",
            polarity: "trung tính",
            certainty: "interpretive",
            summary: [
              ageYear.minorAtAgePalace ? `tiểu hạn về cung tuổi ${branchName(ageYear.agePalace)}` : "",
              ageYear.majorAtAgePalace ? `đại hạn ở cung tuổi ${branchName(ageYear.agePalace)}` : "",
              coincidence.majorMinor ? "lại trùng phùng: tốt xấu cùng gia tăng kinh khủng" : "",
            ]
              .filter(Boolean)
              .join("; ")
              .concat(". Cát tinh hội thì hơn năm tốt khác, ác tinh thì xấu hơn năm xấu khác."),
            assumptions: ["Cung tuổi lấy là cung tiểu hạn 1 tuổi; cách đặt Thiên bàn chưa vẽ trong kho (A-THIENBAN)."],
            source: "TVTH tr.143; NP2 tr.281-284",
            kbFile: `${KB}/03_Trung-phung/02_Han-gap-cung-tuoi.md`,
          }),
        ]
      : []),
    ...(taboo.yearHit || taboo.periodPalaceHits.length || taboo.starHits.length
      ? [
          finding({
            id: "PH-TUOI-KY-NAM",
            name: "Tuổi kỵ năm",
            polarity: "xấu",
            certainty: table.jointRow || taboo.periodPalaceHits.length || taboo.starHits.length ? "interpretive" : "exact",
            summary: "Tuổi gặp năm kỵ thì nên phòng những tai ương vặt; nếu tiểu hạn lại xấu nữa thì rất đáng ngại.",
            satisfied: [
              ...(taboo.yearHit ? [`tuổi ${branchName(birthBranch)} kỵ năm ${taboo.tabooYearBranches.map(branchName).join(", ")}`] : []),
              ...taboo.periodPalaceHits.map((hit) => `${hit.layer} đến cung ${branchName(hit.palace)}`),
              ...taboo.starHits.map((hit) => `${hit.layer} (${branchName(hit.palace)}) có ${hit.star}`),
            ],
            assumptions: [
              ...(table.jointRow ? ["Sách ghi chung một dòng cho hai tuổi; tách máy móc."] : []),
              ...(taboo.periodPalaceHits.length ? ["Sách không nói \"hạn\" là đại hay tiểu hạn; xét cả hai."] : []),
              ...(taboo.starHits.length
                ? ["\"Gặp\" sao kỵ: chỉ xét sao cùng cung hạn, cả sao gốc lẫn sao lưu; sách không phân loại rõ (A-GAP-SCOPE)."]
                : []),
            ],
            source: "TVTH tr.142-143",
            kbFile: `${KB}/02_Tieu-han/03_Tuoi-ky-nam-ky.md`,
          }),
        ]
      : []),
    ...(dipper
      ? [
          finding({
            id: "PH-NAM-BAC-DAU",
            name: "Nam đẩu / Bắc đẩu trong đại hạn",
            polarity: "trung tính",
            certainty: "interpretive",
            summary: `${chart.polarityLabel}: hạn gặp ${dipper.favourable} tinh thì tốt. Tuổi ${age} thuộc nửa ${dipper.emphasis} ứng mạnh (tuổi ${dipper.halfFromAge}–${dipper.halfToAge}).`,
            satisfied: dipper.stars.map((star) => `${star.star}: ${star.group}${star.np1Only ? " (chỉ NP1)" : ""}`),
            assumptions: [
              "5 năm đầu = tuổi thứ 1–5 của đại hạn; sách không nêu mốc cụ thể.",
              ...(dipper.stars.some((star) => star.group === "chưa phân loại") ? ["Thiên Phủ, Thiên Lương, Thất Sát chưa được phân loại trong kho."] : []),
            ],
            source: "TVTH tr.137",
            kbFile: `${KB}/01_Dai-van/03_Nam-dau-Bac-dau-va-5-nam-dau-sau.md`,
          }),
        ]
      : []),
  ];
}

function bureauAvoidanceFindings(chart: Chart, avoidance: BureauAvoidance): readonly Finding[] {
  if (!avoidance.hits.length) return [];
  const uncertain = BUREAU_AVOIDANCE_UNCERTAIN.includes(chart.parameters.bureau.number);
  return [
    finding({
      id: "PH-CUC-KY-HANH",
      name: "Hạn vào cung cục kỵ hành",
      polarity: "xấu",
      certainty: uncertain ? "interpretive" : "exact",
      summary: `${chart.parameters.bureau.name} kỵ hành tới ${avoidance.avoidedBranches.map(branchName).join(", ")}; ${avoidance.hits
        .map((hit) => `${hit.layer} đang ở ${branchName(hit.palace)}`)
        .join(", ")}.`,
      satisfied: avoidance.hits.map((hit) => `${hit.layer} ở ${branchName(hit.palace)}`),
      assumptions: uncertain ? ["MLTC ghi chú lời giải theo quẻ cho Kim tứ cục và Mộc tam cục chưa thật khớp, \"cần nghiên cứu kỹ hơn\"."] : [],
      source: "MLTC tr.5-6",
      kbFile: "01_Du-lieu-lap-la-so/04_Cuc/01_Xac-dinh-cuc.md",
    }),
  ];
}

export function periodLayers(chart: Chart, view: PeriodView, overrides: Partial<PeriodOptions> = {}): Result<PeriodLayers> {
  const options: PeriodOptions = { ...DEFAULT_PERIOD_OPTIONS, ...overrides };
  const year = yearView(chart, view.year);
  if (!year.ok) return year;
  const valid = validateView(view);
  if (!valid.ok) return valid;
  const { age, viewYearStemBranch } = year.value;
  const params = chart.parameters;
  const viewBranch = viewYearStemBranch.branch;
  const major: MajorPeriodSpan | null = year.value.majorPeriod
    ? { palace: year.value.majorPeriod.palace.branch, fromAge: year.value.majorPeriod.fromAge, toAge: year.value.majorPeriod.toAge }
    : null;
  const minorPalace = year.value.minorPeriodPalace.branch;
  const childhood = year.value.childhoodPeriodPalace;
  const flowing = flowingStars(view.year);

  const viewYearFirstMonth = firstMonthPalace(viewBranch, params.month, params.hour);
  const minorFirstMonth = firstMonthPalace(minorPalace, params.month, params.hour);
  const firstMonth = options.firstMonthStart === "view-year-branch" ? viewYearFirstMonth : minorFirstMonth;
  const monthPalace = view.month === undefined ? null : flowingMonthPalace(firstMonth, view.month);
  const dayPalace = monthPalace === null || view.day === undefined ? null : flowingDayPalace(monthPalace, view.day);
  const hourPalace = dayPalace === null || view.hourBranch === undefined ? null : flowingHourPalace(dayPalace, view.hourBranch);
  const flowingMajor = major ? flowingMajorLayer(chart, major, age, options.flowingMajorThirdStep) : null;

  const firstMonthVariant =
    view.month === undefined
      ? ""
      : options.firstMonthStart === "view-year-branch"
        ? `TVTH đọc "lấy năm Tiểu hạn làm tháng Giêng" là cung tiểu hạn: tháng Giêng ở ${branchName(minorFirstMonth)}, tháng ${view.month} ở ${branchName(flowingMonthPalace(minorFirstMonth, view.month))}.`
        : `MLTC tr.845: tháng Giêng tính từ cung Lưu niên (${branchName(viewYearFirstMonth)}), tháng ${view.month} ở ${branchName(flowingMonthPalace(viewYearFirstMonth, view.month))}.`;
  const layers: readonly TimeLayer[] = [
    ...(major ? [rolesLayer("Đại hạn", major.palace, "TVTH tr.22; MLTC tr.862-864; NP2 tr.148-154")] : []),
    ...(flowingMajor ? [flowingMajor] : []),
    ...(childhood ? [{ ...rolesLayer("Đồng hạn", childhood.branch, "NP2 tr.10-12"), roles: null }] : []),
    { ...rolesLayer("Tiểu hạn", minorPalace, "TVTH tr.22"), roles: null },
    rolesLayer("Lưu niên", viewBranch, "MLTC tr.862-864; TVTH tr.136"),
    ...(view.month === undefined ? [] : [{ ...rolesLayer("Tháng cố định", fixedMonthPalace(view.month), "TVTH tr.136"), roles: null }]),
    ...(monthPalace === null
      ? []
      : [
          rolesLayer("Lưu nguyệt", monthPalace, "MLTC tr.845; TVTH tr.137", {
            certainty: "interpretive",
            assumptions: [firstMonthAssumption(options.firstMonthStart), LEAP_ASSUMPTION],
            variants: [firstMonthVariant],
          }),
        ]),
    ...(dayPalace === null
      ? []
      : [
          rolesLayer("Lưu nhật", dayPalace, "MLTC tr.845; TVTH tr.137", {
            certainty: "interpretive",
            assumptions: [DERIVED_FROM_MONTH_ASSUMPTION],
            variants: [firstMonthVariant],
          }),
        ]),
    ...(hourPalace === null
      ? []
      : [
          rolesLayer("Lưu thời", hourPalace, "MLTC tr.845", {
            certainty: "interpretive",
            assumptions: [DERIVED_FROM_MONTH_ASSUMPTION],
            variants: [firstMonthVariant],
          }),
        ]),
  ];

  const minorStemsOn = options.minorLayerStems === "calendar";
  const minorStemExtra: Partial<LayerTransformationSet> = { certainty: "interpretive", assumptions: [MINOR_STEMS_ASSUMPTION] };
  const monthStem = view.month === undefined ? null : monthStemBranch(viewYearStemBranch.stem, view.month).stem;
  const dayStemResult = view.day === undefined ? null : dayStem(view);
  if (dayStemResult && !dayStemResult.ok) return dayStemResult;
  const dayStemValue = dayStemResult?.value.stem ?? null;
  const hourStem = dayStemValue === null || view.hourBranch === undefined ? null : hourStemBranch(dayStemValue, view.hourBranch).stem;

  const transformations: readonly LayerTransformationSet[] = [
    transformationSet(chart, "Can năm sinh", params.year.stem, "tuyệt đối: Đại Tiểu Hạn, Lưu Niên, Lưu Nguyệt, Lưu Nhật, Lưu Thời", "MLTC tr.846-847"),
    ...(major
      ? [
          transformationSet(
            chart,
            `Can cung Đại hạn (${stemName(chart.palaces[major.palace]!.stem)} ${branchName(major.palace)})`,
            chart.palaces[major.palace]!.stem,
            "lớn: Đại Hạn, Lưu Niên; nhỏ: Lưu Nguyệt, Lưu Nhật",
            "MLTC tr.846-847",
          ),
        ]
      : []),
    transformationSet(chart, "Can Lưu niên (can năm xem)", viewYearStemBranch.stem, "Lưu Niên, Lưu Nguyệt, Lưu Nhật", "MLTC tr.846-847, tr.862-864"),
    transformationSet(
      chart,
      `Can cung Lưu niên (${stemName(chart.palaces[viewBranch]!.stem)} ${branchName(viewBranch)})`,
      chart.palaces[viewBranch]!.stem,
      "Lưu Niên (phụ)",
      "MLTC tr.862-864",
      { primary: false, assumptions: ["MLTC: dùng can Lưu Niên và can cung của cung Lưu Niên, nhưng chủ yếu là can Lưu Niên."] },
    ),
    ...(minorStemsOn && monthStem !== null
      ? [transformationSet(chart, `Can Lưu nguyệt (tháng ${view.month})`, monthStem, "Lưu Nguyệt, Lưu Nhật", "MLTC tr.846-847", minorStemExtra)]
      : []),
    ...(minorStemsOn && dayStemValue !== null
      ? [transformationSet(chart, `Can Lưu nhật (ngày ${view.day})`, dayStemValue, "Lưu Nhật, Lưu Thời", "MLTC tr.846-847", minorStemExtra)]
      : []),
    ...(minorStemsOn && hourStem !== null
      ? [transformationSet(chart, `Can Lưu thời (giờ ${branchName(view.hourBranch!)})`, hourStem, "Lưu Thời", "MLTC tr.846-847", minorStemExtra)]
      : []),
    ...layerPalaceStemSets(chart, [
      { name: "Lưu nguyệt", palace: monthPalace, scope: "Lưu Nguyệt, Lưu Nhật" },
      { name: "Lưu nhật", palace: dayPalace, scope: "Lưu Nhật, Lưu Thời" },
      { name: "Lưu thời", palace: hourPalace, scope: "Lưu Thời" },
    ]),
  ];

  const coincidence: Coincidence = {
    majorMinor: age >= COINCIDENCE_MIN_AGE && major !== null && major.palace === minorPalace,
    majorFlowingYear: major !== null && major.palace === viewBranch,
  };
  const ageYearPalace = agePalace(chart);
  const ageYear: AgeYearStatus = {
    agePalace: ageYearPalace,
    minorAtAgePalace: isAgeYearReturn(age),
    majorAtAgePalace: major !== null && major.palace === ageYearPalace,
  };
  const taboo = tabooStatus(chart, viewBranch, major?.palace ?? null, minorPalace, flowing);
  const dipper = major ? dipperStatus(chart, major, age) : null;
  const avoidance = bureauAvoidance(chart, major?.palace ?? null, minorPalace);

  return ok({
    view,
    age,
    viewYear: yearStemBranch(view.year),
    majorPeriod: major,
    layers,
    transformations,
    coincidence,
    ageYear,
    taboo,
    dipper,
    bureauAvoidance: avoidance,
    flowingStars: flowing,
    findings: [...layerFindings(chart, age, layers, major, coincidence, ageYear, taboo, dipper), ...bureauAvoidanceFindings(chart, avoidance)],
  });
}
