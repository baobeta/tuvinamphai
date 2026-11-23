import { branchElement, elementRelation, generatedBy, type Element, type ElementRelation } from "../calendar/five-elements.js";
import type { Bureau, Nayin } from "../calendar/nayin.js";
import { sixCombinationPartner, sixHarmPartner } from "../calendar/relations.js";
import {
  branchName,
  branchPolarity,
  decadeLeaderBranch,
  mod,
  stemBranchName,
  stemName,
  stemPolarity,
  type BranchName,
} from "../calendar/stem-branch.js";
import { palaceOfRole, type PalaceRole } from "../chart/palaces.js";
import type { Chart, Palace } from "../chart/types.js";
import { DEFAULT_ANALYSIS_OPTIONS, type AnalysisOptions } from "./analysis-options.js";
import { branchIn, branchIndex, formatSummary, hasAny, isStrong, mainNames, mainSummaries, oppositeOf, palaceTag, presentIn, presentInAny, type StarSummary } from "./analysis-helpers.js";
import { bodyPalace, hasStarIn, isVoidOfMainStars, lifePalace, palaceAt, palacesOfStar, threeSidesOf } from "./chart-query.js";
import { finding, renderFinding, type Certainty, type Finding, type Polarity } from "./finding.js";
import {
  BIRTH_MONTH_MLTC,
  BODY_LORD_BY_YEAR_BRANCH,
  BODY_RESIDENCE_BY_HOUR,
  BUREAU_AVOIDED_BRANCHES,
  DAY_HOURS,
  EARTH_LIFE_STAGES_NP2,
  FAVORABLE_HOURS_BY_SEASON,
  FOUR_BIRTH,
  FOUR_PEAK,
  FOUR_TOMB,
  LIFE_LORD_BY_LIFE_BRANCH,
  LIFE_PARTNER_ROLES,
  LIFE_STAGES_TVTH,
  SEASON_OF_MONTH,
  SEASON_STRENGTH,
  SICKNESS_VERSUS_LIFE,
  THAI_TUE_GROUPS,
  THAI_TUE_IN_LIFE_BY_ELEMENT,
  TRIET_BY_STEM_PAIR,
  TUAN_BY_DECADE,
  VOID_ARCHETYPES_MLTC,
  YEAR_HOUR_CLASHES,
  type LifeStageLabel,
  type LifeStageRow,
  type Season,
  type SeasonStrength,
  type ThaiTueGroup,
} from "./natal-tables.js";
import { AUSPICIOUS_STARS, SAT_KY_STARS, SIX_MALEFIC, THREE_VOIDS_TVTH } from "./palace-tables.js";
import { starElement } from "./star-elements.js";

export type NatalOptions = AnalysisOptions;
export const DEFAULT_NATAL_OPTIONS: NatalOptions = DEFAULT_ANALYSIS_OPTIONS;

const KB = {
  meaning: "02_Ban-menh/01_Menh-va-Than/01_Y-nghia-Menh-va-Than.md",
  sameHouse: "02_Ban-menh/01_Menh-va-Than/02_Than-cu-Menh.md",
  residence: "02_Ban-menh/01_Menh-va-Than/02..07",
  lords: "02_Ban-menh/01_Menh-va-Than/08_Sao-chu-Menh-chu-Than.md",
  bureau: "02_Ban-menh/02_Ngu-hanh-ban-menh/01_Cuc-sinh-khac-ban-menh.md",
  palaceNatal: "02_Ban-menh/02_Ngu-hanh-ban-menh/02_Hanh-cung-Menh-voi-ban-menh.md",
  lifeStages: "02_Ban-menh/02_Ngu-hanh-ban-menh/03_Sinh-vuong-bai-tuyet-dia.md",
  yinYang: "02_Ban-menh/03_Am-duong-ly/01_Am-duong-thuan-ly-nghich-ly.md",
  season: "02_Ban-menh/03_Am-duong-ly/02_Mua-sinh-gio-sinh-thuan-nghich.md",
  monthMLTC: "02_Ban-menh/03_Am-duong-ly/03_Luan-menh-theo-thang-sinh-MLTC.md",
  avoided: "08_Quan-he-giua-cac-cung/05_Ngu-hanh-sao-voi-ban-menh.md",
  partners: "08_Quan-he-giua-cac-cung/06_Nhi-hop-luc-xung-va-am-hop.md",
  thaiTueGroups: "06_Cac-vong-sao/01_Vong-Thai-Tue/02_Bon-bo-tam-hop-trong-vong-Thai-Tue.md",
  thaiTueTimely: "06_Cac-vong-sao/01_Vong-Thai-Tue/03_Menh-trong-vong-Thai-Tue-va-duoc-thoi.md",
  tuanTrietNature: "07_Tuan-Triet/01_Ban-chat-Tuan-Triet.md",
  tuanTrietLife: "07_Tuan-Triet/03_Tuan-Triet-o-Menh-va-cung-chieu.md",
  voidRules: "04_Chinh-tinh/15_Menh-vo-chinh-dieu/01_Nguyen-tac-xem-VCD.md",
  voidThreeVoids: "04_Chinh-tinh/15_Menh-vo-chinh-dieu/02_Dac-tam-khong.md",
} as const;

export interface PalaceRef {
  readonly branch: number;
  readonly role: string;
}

export interface LordStar {
  readonly star: string;
  readonly palace?: PalaceRef;
}

export interface BodyResidence {
  readonly role: string;
  readonly expectedRole: PalaceRole;
  readonly label: string;
  readonly consistent: boolean;
}

export type BureauVerdict = "Cục sinh Mệnh — thượng cách" | "Mệnh, Cục tương khắc" | null;

export interface BureauVersusNatal {
  readonly bureau: Bureau;
  readonly nayin: Nayin;
  readonly relation: ElementRelation;
  readonly verdict: BureauVerdict;
}

export interface AvoidedBranches {
  readonly branches: readonly number[];
  readonly life: boolean;
  readonly body: boolean;
}

export interface LifeStageReading {
  readonly source: string;
  readonly life: LifeStageLabel | null;
  readonly body: LifeStageLabel | null;
}

export interface LifeStages extends LifeStageReading {
  readonly element: Element;
  readonly variants: readonly LifeStageReading[];
}

export interface SeasonInfo {
  readonly lunarMonth: number;
  readonly isLeapMonth: boolean;
  readonly season: Season;
  readonly strength: SeasonStrength | null;
  readonly favorableHour: boolean;
}

export type YinYangVerdict = "thuận lý" | "nghịch lý" | "chưa xác định";

export interface YinYangMethod {
  readonly id: "gio_vs_cung_menh" | "nam_vs_cung_menh" | "phuc_am_phuc_duong";
  readonly name: string;
  readonly verdict: YinYangVerdict;
  readonly detail: string;
  readonly source: string;
}

export interface ThaiTuePosition {
  readonly branch: number;
  readonly ringStar: string;
  readonly group: ThaiTueGroup;
}

export interface ThaiTueInfo {
  readonly life: ThaiTuePosition;
  readonly body: ThaiTuePosition;
  readonly sameGroup: boolean;
  readonly thaiTueInLife: boolean;
  readonly tuePha: PalaceRef;
}

export interface TuanTrietCoverage {
  readonly tuan: readonly number[];
  readonly triet: readonly number[];
  readonly expectedTuan: readonly number[];
  readonly expectedTriet: readonly number[];
  readonly matchesTables: boolean;
  readonly lifeTuan: boolean;
  readonly lifeTriet: boolean;
  readonly bodyTuan: boolean;
  readonly bodyTriet: boolean;
}

export interface VoidCoverage {
  readonly isVoid: boolean;
  readonly borrowedFrom: PalaceRef;
  readonly borrowedStars: readonly StarSummary[];
}

export interface NatalProfile {
  readonly yearName: string;
  readonly polarityLabel: string;
  readonly life: PalaceRef;
  readonly body: PalaceRef;
  readonly bodyResidence: BodyResidence;
  readonly lifeLord: LordStar;
  readonly bodyLord: LordStar;
  readonly bureauVersusNatal: BureauVersusNatal;
  readonly avoidedBranches: AvoidedBranches;
  readonly lifeStages: LifeStages;
  readonly season: SeasonInfo;
  readonly dayNight: "ngày" | "đêm";
  readonly yinYang: readonly YinYangMethod[];
  readonly birthMonthMLTC: { readonly conception: string; readonly solarTerm: string };
  readonly thaiTue: ThaiTueInfo;
  readonly tuanTriet: TuanTrietCoverage;
  readonly lifeVoid: VoidCoverage;
  readonly bodyVoid: VoidCoverage;
  readonly options: NatalOptions;
  readonly findings: readonly Finding[];
}

const ref = (palace: Palace): PalaceRef => ({ branch: palace.branch, role: palace.role });

const lordOf = (chart: Chart, star: string): LordStar => {
  const branches = palacesOfStar(chart, star);
  const found = branches[0];
  return found === undefined ? { star } : { star, palace: ref(palaceAt(chart, found)) };
};

const stageAt = (row: LifeStageRow, branch: number): LifeStageLabel | null => {
  const name = branchName(branch);
  if (row.sinh === name) return "Sinh địa";
  if (row.vuong === name) return "Vượng địa";
  if (row.bai === name) return "Bại địa";
  if (row.tuyet === name) return "Tuyệt địa";
  return null;
};

export const lifeStageAt = (element: Element, branch: number, earthSource: NatalOptions["earthLifeStages"] = "TVTH"): LifeStageLabel | null =>
  stageAt(element === "Thổ" && earthSource === "NP2" ? EARTH_LIFE_STAGES_NP2 : LIFE_STAGES_TVTH[element], branch);

function lifeStagesOf(element: Element, life: number, body: number, options: NatalOptions): LifeStages {
  const tvth: LifeStageReading = { source: "TVTH tr.94", life: stageAt(LIFE_STAGES_TVTH[element], life), body: stageAt(LIFE_STAGES_TVTH[element], body) };
  const np2: LifeStageReading = { source: "NP2 tr.8–10 (OCR)", life: stageAt(EARTH_LIFE_STAGES_NP2, life), body: stageAt(EARTH_LIFE_STAGES_NP2, body) };
  if (element !== "Thổ") return { element, ...tvth, variants: [] };
  const [chosen, other] = options.earthLifeStages === "TVTH" ? [tvth, np2] : [np2, tvth];
  return { element, ...chosen, variants: [other] };
}

const groupOf = (chart: Chart, branch: number): ThaiTuePosition => {
  const offset = mod(branch - chart.parameters.year.branch, 12);
  const ringStar = palaceAt(chart, branch).stars.find((star) => star.group === "vòng Thái Tuế")?.name ?? "";
  return { branch, ringStar, group: THAI_TUE_GROUPS[mod(offset, 4) as 0 | 1 | 2 | 3] };
};

const voidCoverage = (chart: Chart, palace: Palace): VoidCoverage => {
  const opposite = oppositeOf(chart, palace.branch);
  return { isVoid: isVoidOfMainStars(palace), borrowedFrom: ref(opposite), borrowedStars: isVoidOfMainStars(palace) ? mainSummaries(opposite) : [] };
};

interface Context {
  readonly chart: Chart;
  readonly options: NatalOptions;
  readonly life: Palace;
  readonly body: Palace;
  readonly sameHouse: boolean;
  readonly yearBranch: BranchName;
  readonly hourBranch: BranchName;
  readonly nayinElement: Element;
  readonly coverage: TuanTrietCoverage;
  readonly lifeVoid: boolean;
}

function residenceFindings(ctx: Context, residence: BodyResidence): readonly Finding[] {
  return [
    finding({
      id: "than_cu_cung",
      name: residence.label,
      polarity: "trung tính",
      certainty: "exact",
      summary: `Giờ ${ctx.hourBranch}: Thân an ở ${palaceTag(ctx.body)}${residence.consistent ? "" : `; bảng theo giờ cho ${residence.expectedRole}, lá số an sai`}.`,
      ...(residence.consistent ? {} : { breakers: ["vai trò cung Thân trên lá số khác bảng tra theo giờ sinh"] }),
      source: "MLTC tr.32–54 mục 3.1–3.6; TVTH tr.22",
      kbFile: KB.residence,
    }),
  ];
}

function lordFindings(ctx: Context, lifeLord: LordStar, bodyLord: LordStar): readonly Finding[] {
  const lowWeight = "MLTC: 'tranh luận vẫn chưa có hồi kết', nhiều người không dùng chủ Mệnh/chủ Thân — trọng số thấp";
  const where = (lord: LordStar) => (lord.palace ? `ở ${lord.palace.role} (${branchName(lord.palace.branch)})` : "không có trên lá số");
  const isThamLang = lifeLord.star === "Tham Lang";
  const thamLangKy = isThamLang && hasStarIn(ctx.life, "Địa Kiếp") && hasStarIn(ctx.life, "Hồng Loan") && palacesOfStar(ctx.chart, "Tham Lang").some((branch) => palaceAt(ctx.chart, branch).stars.some((star) => star.name === "Tham Lang" && star.transformation === "Hóa Kỵ"));
  return [
    finding({
      id: "chu_menh",
      name: `Chủ Mệnh ${lifeLord.star}`,
      polarity: isThamLang ? "xấu" : "trung tính",
      certainty: "interpretive",
      summary: `Mệnh ở ${branchName(ctx.life.branch)}: sao chủ Mệnh là ${lifeLord.star}, ${where(lifeLord)}.${isThamLang ? " MLTC: chủ Mệnh Tham Lang là dấu hiệu 'vô cùng không may mắn', nam nữ đều có mệnh tái hôn." : ""}${thamLangKy ? " Thêm Địa Kiếp, Hồng Loan ở Mệnh và Tham Lang Hóa Kỵ: MLTC 'có khả năng bị nạn cướp bóc'." : ""}`,
      assumptions: [lowWeight],
      variants: ["NP2 tr.14–15 có bảng theo tuổi nhưng cột OCR lộn xộn; KB khuyên không dùng"],
      source: "MLTC tr.8–24 bảng 22, tr.7",
      kbFile: KB.lords,
    }),
    finding({
      id: "chu_than",
      name: `Chủ Thân ${bodyLord.star}`,
      polarity: "trung tính",
      certainty: "interpretive",
      summary: `Tuổi ${ctx.yearBranch}: sao chủ Thân là ${bodyLord.star}, ${where(bodyLord)}.`,
      assumptions: [lowWeight],
      source: "MLTC bảng 23",
      kbFile: KB.lords,
    }),
  ];
}

function sameHouseFindings(ctx: Context): readonly Finding[] {
  const { life, sameHouse, lifeVoid, coverage } = ctx;
  if (!sameHouse || !lifeVoid) return [];
  const results: Finding[] = [];
  if (branchIn(life.branch, FOUR_TOMB) && !coverage.lifeTuan && !coverage.lifeTriet) {
    results.push(
      finding({
        id: "menh_than_dong_cung_tu_mo_vcd",
        name: "Thân Mệnh đồng cung tứ mộ vô chính diệu",
        polarity: "xấu",
        certainty: "interpretive",
        summary: "TVTH: chắc cùng khổ và yểu — chỉ khi thêm 'thiếu trung tinh hội'.",
        satisfied: ["Thân Mệnh đồng cung", `Mệnh ở ${branchName(life.branch)} (tứ mộ)`, "vô chính diệu", "không có Tuần/Triệt"],
        missing: ["'thiếu trung tinh hội' sách không định nghĩa: cần người luận xét"],
        source: "TVTH tr.94",
        kbFile: KB.sameHouse,
      }),
    );
  }
  if (branchIn(life.branch, ["Tý", "Ngọ"])) {
    const hasLoc = hasStarIn(life, "Hóa Lộc");
    results.push(
      finding({
        id: "menh_than_dong_cung_ty_ngo_vcd",
        name: "Thân Mệnh đồng cung Tý/Ngọ vô chính diệu",
        polarity: "trung tính",
        certainty: "interpretive",
        summary: hasLoc ? "TVTH: giàu nhưng giảm thọ (Hóa Lộc tọa Mệnh)." : "TVTH: nghèo mà thọ (Mệnh không có Hóa Lộc).",
        assumptions: ["01_Y-nghia §5.2 không nói rõ điều kiện Thân Mệnh đồng cung; đang áp dụng theo 02_Than-cu-Menh"],
        source: "TVTH tr.94",
        kbFile: KB.sameHouse,
      }),
    );
  }
  return results;
}

const COUPLED_STARS = ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"] as const;

function lifeBodyCaseFindings(ctx: Context): readonly Finding[] {
  const { chart, life, body, coverage, lifeVoid } = ctx;
  const results: Finding[] = [];
  const gender = chart.parameters.gender;
  if (gender === "nam" && ["Ngọ", "Mùi"].includes(ctx.yearBranch) && branchIn(life.branch, ["Tý", "Sửu"])) {
    results.push(
      finding({ id: "nam_ngo_mui_menh_ty_suu", name: "Nam tuổi Ngọ/Mùi, Mệnh Tý/Sửu", polarity: "xấu", certainty: "exact", summary: "TVTH: trọn đời gặp việc bất toại ý.", source: "TVTH tr.94–95", kbFile: KB.meaning }),
    );
  }
  if (coverage.lifeTuan && !coverage.lifeTriet && coverage.bodyTriet && !coverage.bodyTuan) {
    const mains = [...mainSummaries(life), ...mainSummaries(body)];
    const satisfied = mains.length > 0 && mains.every((star) => (COUPLED_STARS as readonly string[]).includes(star.name) && isStrong(star));
    results.push(
      finding({
        id: "menh_tuan_than_triet",
        name: "Mệnh Tuần, Thân Triệt",
        polarity: satisfied ? "tốt" : "xấu",
        certainty: "interpretive",
        summary: `TVTH: rất cần Cơ Nguyệt Đồng Lương sáng sủa — ${satisfied ? "có" : "không có"} (${mains.map(formatSummary).join(", ") || "Mệnh Thân vô chính diệu"}).`,
        assumptions: ["'sáng sủa' hiểu là Miếu/Vượng/Đắc", "'không ngược lại' hiểu là Mệnh chỉ có Tuần, Thân chỉ có Triệt"],
        source: "TVTH tr.94–95",
        kbFile: KB.meaning,
      }),
    );
  }
  if (coverage.lifeTriet && !coverage.lifeTuan && coverage.bodyTuan && !coverage.bodyTriet) {
    const bothVoid = lifeVoid && isVoidOfMainStars(body);
    results.push(
      finding({
        id: "menh_triet_than_tuan_TVTH",
        name: "Mệnh Triệt, Thân Tuần",
        polarity: bothVoid ? "tốt" : "xấu",
        certainty: "interpretive",
        assumptions: ["'án ngữ' hiểu là chi cung nằm trong cặp Tuần/Triệt", "hiểu là Mệnh chỉ có Triệt, Thân chỉ có Tuần (như trường hợp ngược lại)"],
        summary: `TVTH: Mệnh Thân rất cần Vô Chính Diệu mới toại ý — ${bothVoid ? "cả hai vô chính diệu" : "chưa đủ, Mệnh hoặc Thân có chính tinh"}.`,
        source: "TVTH tr.94–95",
        kbFile: KB.meaning,
      }),
    );
  }
  if (!ctx.sameHouse && hasStarIn(life, "Địa Không") && hasStarIn(body, "Địa Kiếp")) {
    const group = threeSidesOf(chart, life.branch);
    const bothHao = presentInAny(group.all, ["Đại Hao", "Tiểu Hao"]).length === 2;
    const fragile = presentInAny([life, body], ["Thiên Đồng", "Thiên Lương", "Phá Quân"]);
    results.push(
      finding({
        id: "menh_khong_than_kiep",
        name: "Mệnh Không, Thân Kiếp",
        polarity: "xấu",
        certainty: "interpretive",
        summary: [
          "TVTH: khôn ngoan sắc sảo nhưng vui ít buồn nhiều, thành bại thất thường.",
          lifeVoid && bothHao ? "Mệnh VCD hội Song Hao: tuy ít học nhưng đạt công danh." : "",
          lifeVoid && bothHao && fragile.length ? `Có ${fragile.join(", ")} ở Mệnh/Thân: không sống lâu.` : "",
        ]
          .filter(Boolean)
          .join(" "),
        assumptions: [
          "'Không' hiểu là Địa Không (có thể gồm Thiên Không)", "chỉ xét khi Mệnh và Thân khác cung",
          "mệnh đề Đồng/Lương/Phá chỉ áp dụng trong trường hợp VCD hội Song Hao",
        ],
        source: "TVTH tr.94–95",
        kbFile: KB.meaning,
      }),
    );
  }
  if (gender === "nữ") {
    const label = branchIn(life.branch, FOUR_TOMB) ? "khôn ngoan" : branchIn(life.branch, ["Dậu"]) ? "ra ngoài nhiều người mến" : branchIn(life.branch, ["Tý", "Ngọ"]) ? "trọn đời thanh nhàn" : undefined;
    if (label) {
      results.push(finding({ id: "nu_menh_branch", name: `Nữ Mệnh ở ${branchName(life.branch)}`, polarity: "tốt", certainty: "exact", summary: `TVTH: ${label}.`, source: "TVTH tr.94–95", kbFile: KB.meaning }));
    }
  }
  const bodyRole = body.role;
  if (["Tài Bạch", "Quan Lộc", "Thiên Di"].includes(bodyRole)) {
    results.push(
      finding({
        id: "menh_than_phoi_hop",
        name: "Phối hợp Mệnh – Thân (MLTC)",
        polarity: "trung tính",
        certainty: "interpretive",
        summary: `Thân cư ${bodyRole}, thuộc ba cung MLTC áp dụng bảng: Mệnh tốt Thân tốt → phú quý vẹn toàn; Mệnh tốt Thân không tốt → trẻ hanh thông nhưng ít tài nguyên, hư danh vô thực, về già không tốt; Mệnh không tốt Thân tốt → trẻ gian nan, trung và vãn niên thuận lợi; cả hai không tốt → không gặp may, nghèo khổ tới cuối đời.`,
        missing: ["sách không định nghĩa 'Mệnh tốt', 'Thân tốt': người luận phải tự xét"],
        source: "MLTC tr.32–54",
        kbFile: KB.meaning,
      }),
    );
  }
  return results;
}

function bureauFindings(ctx: Context, versus: BureauVersusNatal, avoided: AvoidedBranches): readonly Finding[] {
  const results: Finding[] = [];
  if (versus.verdict === "Cục sinh Mệnh — thượng cách") {
    results.push(
      finding({ id: "cuc_sinh_menh", name: "Cục sinh Mệnh", polarity: "tốt", certainty: "exact", summary: `${versus.bureau.name} sinh bản mệnh ${versus.nayin.name}: thượng cách.`, source: "NP1 tr.111–142; NP2 tr.231–237, tr.169–178", kbFile: KB.bureau }),
    );
  }
  if (versus.verdict === "Mệnh, Cục tương khắc") {
    results.push(
      finding({
        id: "menh_cuc_tuong_khac",
        name: "Mệnh, Cục tương khắc",
        polarity: "xấu",
        certainty: "interpretive",
        summary: `${versus.relation.description} (cục ${versus.bureau.element}, bản mệnh ${versus.nayin.element}). TVTH xếp vào trung cách khi đi kèm âm dương nghịch lý và chính diệu lạc hãm.`,
        assumptions: ["'Mệnh' hiểu là bản mệnh nạp âm năm sinh; sách không định nghĩa rõ", "không phân biệt cục khắc Mệnh hay Mệnh khắc cục"],
        variants: ["Lã Thái Hậu (TVTH tr.159): sách đọc 'mệnh cục' là cung + sao với cục, không phải bản mệnh với cục"],
        source: "TVTH tr.97–100",
        kbFile: KB.bureau,
      }),
    );
  }
  if (avoided.life || avoided.body) {
    const where = [avoided.life ? `Mệnh (${branchName(ctx.life.branch)})` : "", avoided.body && !ctx.sameHouse ? `Thân (${branchName(ctx.body.branch)})` : ""].filter(Boolean).join(", ");
    results.push(
      finding({
        id: "cuc_ky_hanh",
        name: "Cung kỵ hành của cục",
        polarity: "xấu",
        certainty: "interpretive",
        summary: `${versus.bureau.name} kỵ hành ${avoided.branches.map(branchName).join(", ")}; ${where} rơi vào đó.`,
        assumptions: ["sách nói cho vận hạn đi qua; áp vào Mệnh/Thân gốc là mở rộng"],
        variants: ["MLTC: Kim tứ cục và Mộc tam cục là ngoại lệ 'cần nghiên cứu kĩ hơn'"],
        source: "MLTC tr.5–6; TVTH tr.104",
        kbFile: KB.avoided,
      }),
    );
  }
  return results;
}

function lifeStageFindings(ctx: Context, stages: LifeStages): readonly Finding[] {
  const { chart, life, nayinElement } = ctx;
  const results: Finding[] = [];
  const isEarth = stages.element === "Thổ";
  const variants = stages.variants.map((variant) => `${variant.source}: Mệnh ${variant.life ?? "không thuộc bốn địa"}, Thân ${variant.body ?? "không thuộc bốn địa"}`);
  if (stages.life) {
    results.push(
      finding({
        id: "sinh_vuong_bai_tuyet_menh",
        name: `Mệnh ở ${stages.life} của hành ${stages.element}`,
        polarity: stages.life === "Sinh địa" || stages.life === "Vượng địa" ? "tốt" : "xấu",
        certainty: isEarth ? "interpretive" : "exact",
        summary: `Bản mệnh ${stages.element}, Mệnh ở ${branchName(life.branch)}: ${stages.life} (${stages.source}).`,
        ...(isEarth ? { assumptions: [`hành Thổ: đang dùng bảng ${stages.source}`], variants } : {}),
        source: stages.source,
        kbFile: KB.lifeStages,
      }),
    );
  }
  if (stages.body && !ctx.sameHouse) {
    results.push(
      finding({
        id: "sinh_vuong_bai_tuyet_than",
        name: `Thân ở ${stages.body} của hành ${stages.element}`,
        polarity: stages.body === "Sinh địa" || stages.body === "Vượng địa" ? "tốt" : "xấu",
        certainty: "interpretive",
        summary: `Thân ở ${branchName(ctx.body.branch)}: ${stages.body}.`,
        assumptions: ["sách nói cho cung Mệnh; xét cho Thân là mở rộng (ví dụ KB có xét)"],
        variants: isEarth ? variants : [],
        source: stages.source,
        kbFile: KB.lifeStages,
      }),
    );
  }
  if (stages.life === "Bại địa" || stages.life === "Tuyệt địa") {
    const group = threeSidesOf(chart, life.branch);
    const transformations = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa"];
    const tamHoa = transformations.every((name) => group.all.some((palace) => hasStarIn(palace, name)));
    const helpers = mainNames(life).filter((name) => {
      const element = starElement(name, ctx.options);
      return element !== undefined && generatedBy(element.element) === nayinElement;
    });
    const rescued = tamHoa || helpers.length > 0;
    const contested = helpers.some((name) => starElement(name, ctx.options)?.contested);
    results.push(
      finding({
        id: rescued ? "tuyet_xu_phung_sinh" : "bai_tuyet_khong_cuu",
        name: rescued ? "Tuyệt xứ phùng sinh" : `${stages.life} không được cứu`,
        polarity: rescued ? "tốt" : "xấu",
        certainty: "interpretive",
        summary: rescued
          ? `Mệnh ở ${stages.life} nhưng ${[tamHoa ? "Tam Hóa hội" : "", helpers.length ? `${helpers.join(", ")} sinh bản mệnh ${nayinElement}` : ""].filter(Boolean).join("; ")}.`
          : "Cuộc đời thăng trầm đáng ngại (chìm nổi vô thường).",
        satisfied: [...(tamHoa ? ["Hóa Lộc, Quyền, Khoa đều trong tam phương tứ chính Mệnh"] : []), ...helpers.map((name) => `${name} sinh ${nayinElement}`)],
        missing: rescued ? [] : ["không có Tam Hóa hội và không có chính tinh tại Mệnh sinh bản mệnh"],
        assumptions: ["'Tam Hóa hội' hiểu là đủ Lộc, Quyền, Khoa trong tam phương tứ chính Mệnh", "'chính diệu' hiểu là 14 chính tinh", ...(contested ? ["hành của sao có dị bản, kết quả đổi theo lựa chọn"] : [])],
        source: "TVTH tr.94",
        kbFile: KB.lifeStages,
      }),
    );
  }
  return results;
}

function seasonFindings(season: SeasonInfo, element: Element, hourBranch: BranchName): readonly Finding[] {
  const assumptions = ["tháng 1–3 Xuân, 4–6 Hạ, 7–9 Thu, 10–12 Đông (cách hiểu phổ thông, sách không ghi)", ...(season.isLeapMonth ? ["tháng nhuận: dùng tháng đã quy đổi khi an sao; sách không nói"] : [])];
  return [
    ...(season.strength
      ? [
          finding({
            id: "thuan_mua_sinh",
            name: `${season.strength} — thuận mùa sinh`,
            polarity: "tốt",
            certainty: "interpretive",
            summary: `Bản mệnh ${element} sinh mùa ${season.season} (tháng ${season.lunarMonth}): ${season.strength}, độ số gia tăng.`,
            assumptions,
            source: "TVTH tr.96 mục 1",
            kbFile: KB.season,
          }),
        ]
      : []),
    ...(season.favorableHour
      ? [
          finding({
            id: "thuan_gio_sinh",
            name: "Thuận giờ sinh",
            polarity: "tốt",
            certainty: "interpretive",
            summary: `Mùa ${season.season} sinh giờ ${hourBranch}: thuận giờ sinh — độ số gia tăng.`,
            assumptions,
            source: "TVTH tr.96 mục 2",
            kbFile: KB.season,
          }),
        ]
      : []),
  ];
}

function yinYangFindings(methods: readonly YinYangMethod[]): readonly Finding[] {
  const verdictText: Readonly<Record<string, { thuan: string; nghich: string }>> = {
    gio_vs_cung_menh: { thuan: "độ số gia tăng", nghich: "bị kém bớt" },
    nam_vs_cung_menh: { thuan: "độ số gia tăng tốt thêm", nghich: "độ số có bị chiết giảm ít nhiều" },
  };
  return methods
    .filter((method) => method.verdict !== "chưa xác định")
    .map((method) => {
      const text = verdictText[method.id]!;
      return finding({
        id: `am_duong_${method.id}`,
        name: `Âm dương ${method.verdict} (${method.name})`,
        polarity: method.verdict === "thuận lý" ? "tốt" : "xấu",
        certainty: "interpretive",
        summary: `${method.detail}: ${method.verdict === "thuận lý" ? text.thuan : text.nghich}.`,
        assumptions: [
          method.id === "gio_vs_cung_menh" ? "âm dương của giờ lấy theo địa chi giờ; sách không liệt kê giờ âm/dương" : "'Mệnh thuộc Dương' hiểu là can năm sinh dương",
          "ba tiêu chí báo riêng, không gộp: KB 'chưa tìm thấy chỗ nào phân xử khi chúng mâu thuẫn'",
        ],
        source: method.source,
        kbFile: KB.yinYang,
      });
    });
}

function yearHourFindings(ctx: Context): readonly Finding[] {
  return YEAR_HOUR_CLASHES.filter((row) => row.years.includes(ctx.yearBranch) && row.hours.includes(ctx.hourBranch)).map((row) =>
    finding({
      id: "nam_gio_khac",
      name: `Tuổi ${ctx.yearBranch} giờ ${ctx.hourBranch}: ${row.label}`,
      polarity: "xấu",
      certainty: "interpretive",
      summary: `Cổ thư: tuổi ${row.years.join(" ")} sinh giờ ${row.hours.join(" ")} là ${row.label}.`,
      assumptions: ["KB xếp vào cổ thư; phải đối chiếu cung Phụ Mẫu trước khi kết luận"],
      source: "TVTH tr.96 mục 4",
      kbFile: KB.season,
    }),
  );
}

function dayNightFindings(ctx: Context, dayNight: "ngày" | "đêm"): readonly Finding[] {
  const results: Finding[] = [];
  const moonAtNight = dayNight === "đêm" && hasStarIn(ctx.life, "Thái Âm");
  const sunByDay = dayNight === "ngày" && hasStarIn(ctx.life, "Thái Dương");
  if (moonAtNight || sunByDay) {
    results.push(
      finding({
        id: "chinh_tinh_op_gio_sinh",
        name: "Chính tinh Mệnh ốp giờ sinh",
        polarity: "tốt",
        certainty: "interpretive",
        summary: `${moonAtNight ? "Thái Âm" : "Thái Dương"} tọa Mệnh, sinh ban ${dayNight} (giờ ${ctx.hourBranch}).`,
        assumptions: ["sách không nói chiều hướng lời đoán; giả định là thuận lợi"],
        source: "NP2 tr.167–169",
        kbFile: KB.season,
      }),
    );
  }
  if (ctx.yearBranch === "Ngọ") {
    results.push(
      finding({
        id: "tuoi_ngo_ngay_dem",
        name: `Tuổi Ngọ sinh ban ${dayNight}`,
        polarity: dayNight === "ngày" ? "xấu" : "tốt",
        certainty: "exact",
        summary: `NP2: tuổi Ngọ sinh ngày thì khổ, sinh đêm thì sướng — ở đây sinh ban ${dayNight}.`,
        source: "NP2 tr.167–169",
        kbFile: KB.season,
      }),
    );
  }
  return results;
}

const fiveElementRuleSource = "TVTH tr.100–101 mục VI.3–6; NP2 tr.35–36";

function palaceStarNatalFindings(ctx: Context, palace: Palace, label: "Mệnh" | "Thân"): readonly Finding[] {
  const nayin = ctx.nayinElement;
  const palaceElement = branchElement(palace.branch);
  const results: Finding[] = [];
  if (generatedBy(palaceElement) === nayin) {
    results.push(
      finding({ id: "np2_dia_loi", name: `Địa lợi (cung ${label})`, polarity: "tốt", certainty: "exact", summary: `Cung ${label} ${branchName(palace.branch)} hành ${palaceElement} sinh bản mệnh ${nayin}: địa lợi.`, source: "NP2 tr.35–36", kbFile: KB.palaceNatal }),
    );
  }
  const mains = mainSummaries(palace);
  const elements = mains.map((star) => ({ star, element: starElement(star.name, ctx.options) }));
  const mutualClash = elements.some((a) => elements.some((b) => a !== b && a.element && b.element && elementRelation(a.element.element, b.element.element).kind === "khắc"));
  for (const { star, element } of elements) {
    if (!element) continue;
    const certainty: Certainty = element.contested ? "interpretive" : "exact";
    const contested = element.contested ? [`hành ${star.name} có dị bản: ${element.variants.join("; ")}`] : [];
    const palaceToStar = elementRelation(palaceElement, element.element).kind;
    const starToNatal = elementRelation(element.element, nayin).kind;
    const base = `${formatSummary(star)} hành ${element.element} ở cung ${label} ${branchName(palace.branch)} (${palaceElement}), bản mệnh ${nayin}`;
    const push = (id: string, name: string, polarity: Polarity, text: string, extra: Partial<Finding> = {}) =>
      results.push(finding({ id, name, polarity, certainty, summary: `${base}: ${text}`, assumptions: contested, source: fiveElementRuleSource, kbFile: KB.palaceNatal, ...extra }));
    if (palaceToStar === "sinh" && starToNatal === "sinh") {
      push("ngu_hanh_chuoi_tot", `Cung sinh sao, sao sinh mệnh (${star.name})`, "tốt", `chuỗi tốt${mutualClash ? "; nhưng hai chính tinh sinh khắc nhau nên kém đi" : ""}.`);
    }
    if (palaceToStar === "khắc" || starToNatal === "khắc") {
      push("ngu_hanh_do_so_kem", `Độ số càng kém (${star.name})`, "xấu", `${palaceToStar === "khắc" ? "cung khắc sao" : "sao khắc bản mệnh"} — độ số càng kém.`);
    }
    if (starToNatal === "đồng hành" || starToNatal === "được sinh") {
      push("ngu_hanh_kem_tot_bot", `Độ số kém tốt bớt (${star.name})`, "xấu", `${starToNatal === "đồng hành" ? "sao cùng hành bản mệnh" : "bản mệnh sinh sao"} — độ số kém tốt bớt.`, {
        certainty: "interpretive",
        assumptions: [...contested, "câu sách OCR lủng củng ('Chính tinh cũng an mệnh'); KB đọc là 'cùng hành mệnh'"],
      });
    }
    const harmonious = starToNatal === "sinh" || starToNatal === "đồng hành";
    if (star.brightness === "Hãm" && harmonious) {
      push("ngu_hanh_ham_hop_menh", `Sao hãm hợp bản mệnh (${star.name})`, "tốt", "sao hãm mà hợp bản mệnh — trở thành khá hơn.", {
        certainty: "interpretive",
        assumptions: [...contested, "'hợp' hiểu là sao sinh bản mệnh hoặc cùng hành"],
      });
    }
    if (isStrong(star) && !harmonious) {
      push("ngu_hanh_sang_khong_hop", `Sao sáng không hợp bản mệnh (${star.name})`, "xấu", "sao miếu vượng đắc mà không hợp bản mệnh — kém đi.", {
        certainty: "interpretive",
        assumptions: [...contested, "'hợp' hiểu là sao sinh bản mệnh hoặc cùng hành"],
      });
    }
    if (label === "Mệnh" && starToNatal === "sinh") {
      push("np2_thien_thoi", `Thiên thời (${star.name})`, "tốt", "chính tinh sinh bản mệnh — thiên thời.", { source: "NP2 tr.35–36" });
    }
    if (label === "Mệnh" && isStrong(star)) {
      results.push(finding({ id: "np2_nhan", name: `Nhân (${star.name})`, polarity: "tốt", certainty: "exact", summary: `${formatSummary(star)} sáng sủa tại Mệnh — nhân.`, source: "NP2 tr.35–36", kbFile: KB.palaceNatal }));
    }
  }
  return results;
}

function thaiTueFindings(ctx: Context, info: ThaiTueInfo): readonly Finding[] {
  const { chart, life, body } = ctx;
  const results: Finding[] = [];
  const npOnly = "cách chia 4 bộ chỉ có ở NP2; TVTH/MLTC không chia; NP2 nói vòng Thái Tuế chỉ chiếm 50–60% ảnh hưởng";
  results.push(
    finding({
      id: "thai_tue_bo_tam_hop",
      name: `Mệnh thuộc bộ ${info.life.group.name}`,
      polarity: info.life.group.index === 0 ? "tốt" : "trung tính",
      certainty: "interpretive",
      summary: [
        `Mệnh ${branchName(life.branch)} có ${info.life.ringStar}, thuộc bộ ${info.life.group.name}; Thân ${branchName(body.branch)} có ${info.body.ringStar}, thuộc bộ ${info.body.group.name}.`,
        info.life.group.index === 0 ? `NP2: Tuế – Hổ – Phù đẹp nhất ở Mệnh – Tài – Quan, 'đại thượng cách'${stemPolarity(chart.parameters.year.stem) === "Âm" ? "; tuổi Âm hưởng trọn vẹn hơn" : "; tuổi Dương hưởng kém trọn vẹn hơn tuổi Âm"}.` : "",
      ]
        .filter(Boolean)
        .join(" "),
      assumptions: [npOnly],
      source: "NP2 tr.274–281, tr.15–24; TVTH tr.12–21",
      kbFile: KB.thaiTueGroups,
    }),
  );
  if (info.life.group.index === 0 && info.body.group.index === 2) {
    results.push(finding({ id: "thai_tue_menh_than_lech", name: "Mệnh Tuế – Hổ – Phù, Thân Tang – Tuế – Điếu", polarity: "xấu", certainty: "interpretive", summary: "NP2: càng về già càng cô đơn.", assumptions: [npOnly], source: "NP2 tr.274–281", kbFile: KB.thaiTueGroups }));
  }
  if (info.life.group.index === 2 && info.body.group.index === 0) {
    results.push(finding({ id: "thai_tue_menh_than_lech", name: "Mệnh Tang – Tuế – Điếu, Thân Tuế – Hổ – Phù", polarity: "trung tính", certainty: "interpretive", summary: "NP2: tuổi trẻ ham chơi, về già tu chí làm ăn.", assumptions: [npOnly], source: "NP2 tr.274–281", kbFile: KB.thaiTueGroups }));
  }
  if (hasStarIn(body, "Thái Tuế") && !ctx.sameHouse) {
    results.push(finding({ id: "thai_tue_o_than", name: "Thái Tuế ở cung Thân", polarity: "xấu", certainty: "exact", summary: "NP2: không hay, về già khó tính.", source: "NP2 tr.15–24", kbFile: KB.thaiTueTimely }));
  }
  if (info.thaiTueInLife) {
    const element = branchElement(life.branch);
    results.push(
      finding({
        id: "tue_pha_thien_di",
        name: "Tuế Phá ở Thiên Di",
        polarity: "xấu",
        certainty: "exact",
        summary: `Thái Tuế tọa Mệnh nên Tuế Phá ở ${info.tuePha.role} (${branchName(info.tuePha.branch)}): đi ra ngoài lại gặp nghịch cảnh.`,
        source: "NP1 tr.97–103; NP2 tr.15–24",
        kbFile: KB.thaiTueTimely,
      }),
      finding({
        id: "thai_tue_duoc_thoi",
        name: `Thái Tuế tọa Mệnh cung ${element}`,
        polarity: element === "Kim" || element === "Thổ" ? "tốt" : "xấu",
        certainty: "interpretive",
        summary: `${THAI_TUE_IN_LIFE_BY_ELEMENT[element]}.${branchIn(life.branch, FOUR_TOMB) && hasStarIn(life, "Hoa Cái") ? " Hoa Cái đồng cung Thái Tuế: NP1 'bướng nhất'." : ""}`,
        assumptions: ["lập luận 'được thời' dựa trên Thái Tuế hành Kim (NP1); TVTH/MLTC ghi Hỏa", "chỉ xét khi Thái Tuế tọa Mệnh"],
        variants: ["MLTC tr.791–792: Thái Tuế ở Mệnh 'không hòa hợp với quần tụ các sao'; gặp tứ sát thì tán gia bại sản"],
        source: "NP1 tr.97–103; NP2 tr.15–24",
        kbFile: KB.thaiTueTimely,
      }),
    );
  }
  if (ctx.yearBranch === "Thân" && (ctx.hourBranch === "Thân" || ctx.hourBranch === "Dần")) {
    results.push(
      finding({ id: "tuoi_than_gio_than_dan", name: `Tuổi Thân sinh giờ ${ctx.hourBranch}`, polarity: "tốt", certainty: "interpretive", summary: "NP2: tuổi Thân sinh giờ Thân hoặc giờ Dần là đại cát.", assumptions: ["sách không nói Mệnh có phải ở Thân hay không"], source: "NP2 tr.15–24", kbFile: KB.thaiTueTimely }),
    );
  }
  return results;
}

const pairName = (pair: readonly number[]): string => pair.map(branchName).join(" ");
const samePair = (a: readonly number[], b: readonly number[]): boolean => a.length === b.length && a.every((value) => b.includes(value));

function tuanTrietFindings(ctx: Context): readonly Finding[] {
  const { coverage, life, body, lifeVoid } = ctx;
  const results: Finding[] = [];
  if (!coverage.matchesTables) {
    results.push(
      finding({
        id: "tuan_triet_sai_vi_tri",
        name: "Tuần/Triệt trên lá số khác bảng tra",
        polarity: "xấu",
        certainty: "exact",
        summary: `Lá số: Tuần ${pairName(coverage.tuan)}, Triệt ${pairName(coverage.triet)}; bảng: Tuần ${pairName(coverage.expectedTuan)}, Triệt ${pairName(coverage.expectedTriet)}.`,
        source: "TVTH tr.12–21; MLTC bảng 19, 20",
        kbFile: KB.tuanTrietNature,
      }),
    );
  }
  const dacDia = (id: string, name: string, summary: string) => results.push(finding({ id, name, polarity: "tốt", certainty: "exact", summary, source: "TVTH tr.73–74", kbFile: KB.tuanTrietNature }));
  if (samePair(coverage.tuan, [2, 3])) dacDia("tuan_dac_dia", "Tuần đắc địa", "Tuần ở Dần Mão — đem lại hoạnh phát.");
  if (samePair(coverage.triet, [8, 9])) dacDia("triet_dao_kim_cung", "Triệt đáo Kim cung", "Triệt ở Thân Dậu — đắc địa, sao ở hai cung 'vàng đẹp', không trấn áp (còn tùy cung có hãm không).");
  if (samePair(coverage.tuan, [6, 7]) || samePair(coverage.triet, [6, 7])) dacDia("tuan_triet_ngo_mui", "Tuần/Triệt ở Ngọ Mùi", "Ảnh hưởng êm đềm, khoan hòa.");
  if (samePair(coverage.tuan, coverage.triet) && !samePair(coverage.tuan, [6, 7])) {
    results.push(finding({ id: "tuan_triet_dong_cung", name: "Tuần Triệt đồng cung", polarity: "xấu", certainty: "exact", summary: `Tuần và Triệt cùng ở ${pairName(coverage.tuan)} — thuở bé chịu lao đao, tính tình hoang phí.`, source: "TVTH tr.73–74", kbFile: KB.tuanTrietNature }));
  }
  const coverAssumption = "'án ngữ' hiểu là chi cung nằm trong cặp Tuần/Triệt; sách không phân biệt hai cung của cặp";
  const ageScope = "TVTH: người ngoài 32 tuổi chịu ảnh hưởng Tuần Triệt gốc rất yếu, nên xét lưu Tuần Triệt";
  if (coverage.lifeTuan || coverage.lifeTriet) {
    const which = [coverage.lifeTuan ? "Tuần" : "", coverage.lifeTriet ? "Triệt" : ""].filter(Boolean).join(", ");
    const mains = mainNames(life);
    const trietException = coverage.lifeTriet && mains.length > 0 && mains.every((name) => name === "Phá Quân" || name === "Cự Môn") && branchIn(life.branch, ["Tý", "Ngọ"]);
    const extra = [
      ...(coverage.lifeTriet && coverage.bodyTuan ? ["NP1: Mệnh Triệt Thân Tuần — ấu thơ vất vả, về già an nhàn."] : []),
      ...(trietException ? ["NP1: ngoại lệ — Phá Quân/Cự Môn ở Tý Ngọ, Mệnh gặp Triệt còn đẹp."] : coverage.lifeTriet ? ["NP1/NP2: Mệnh không ưa Triệt."] : []),
      ...(lifeVoid ? [`NP1: Mệnh VCD gặp Tuần Triệt rất tốt${hasStarIn(life, "Tam Thai") || hasStarIn(life, "Bát Tọa") ? "; có Thai Tọa thêm → rất thông minh" : " (Thai Tọa thêm → rất thông minh)"}.`] : []),
      ...(branchIn(life.branch, FOUR_TOMB) ? ["NP1: Mệnh cư Thìn Tuất Sửu Mùi có Tuần Triệt là tốt."] : []),
    ];
    results.push(
      finding({
        id: "tuan_triet_menh",
        name: `${which} án ngữ Mệnh`,
        polarity: lifeVoid || trietException ? "tốt" : "xấu",
        certainty: "interpretive",
        summary: ["TVTH phú: 'Thiếu niên tân khổ lo toan mọi đường'; NP1: tuổi ấu thơ vất vả; MLTC (Tiệt Không nhập Mệnh): phiêu bạt vô định, có đầu không cuối.", ...extra].join(" "),
        assumptions: [coverAssumption, ageScope],
        variants: ["NP1 'Mệnh gặp Tuần trước Triệt sau mới tốt': 'trước/sau' không được giải thích"],
        source: "TVTH tr.73–74, 105–118; NP1 Cung-Menh tr.142–185; MLTC tr.799",
        kbFile: KB.tuanTrietLife,
      }),
    );
  }
  if ((coverage.bodyTuan || coverage.bodyTriet) && !ctx.sameHouse) {
    results.push(
      finding({
        id: "tuan_triet_than",
        name: `${[coverage.bodyTuan ? "Tuần" : "", coverage.bodyTriet ? "Triệt" : ""].filter(Boolean).join(", ")} án ngữ Thân`,
        polarity: "trung tính",
        certainty: "interpretive",
        summary: `Thân ở ${palaceTag(body)} gặp Tuần/Triệt.`,
        assumptions: [coverAssumption, ageScope],
        variants: ["NP2: Thân gặp Tuần–Triệt về già liệt giường; Triệt: sức khỏe kém", "NP1: Thân Tuần (với Mệnh Triệt): về già an nhàn"],
        source: "NP1 Cach-Xem-Han tr.111–142; NP2 05_Cung-Sinh tr.35–36",
        kbFile: KB.tuanTrietLife,
      }),
    );
  }
  return results;
}

function voidFindings(ctx: Context, lifeVoid: VoidCoverage): readonly Finding[] {
  if (!lifeVoid.isVoid) return [];
  const { chart, life } = ctx;
  const group = threeSidesOf(chart, life.branch);
  const opposite = oppositeOf(chart, life.branch);
  const oppositeMains = mainNames(opposite);
  const results: Finding[] = [
    finding({
      id: "menh_vo_chinh_dieu",
      name: "Mệnh vô chính diệu",
      polarity: "trung tính",
      certainty: "exact",
      summary: `Mệnh ${branchName(life.branch)} không có chính tinh; mượn ${palaceTag(opposite)}: ${lifeVoid.borrowedStars.map(formatSummary).join(", ") || "không có"} (độ sáng tại cung gốc).`,
      variants: ["KB tự mâu thuẫn về mức giảm cát hung (60% hay 40%): không tính trọng số"],
      source: "MLTC tr.32–54; NP1 tr.1–7, tr.142–185",
      kbFile: KB.voidRules,
    }),
  ];
  for (const row of VOID_ARCHETYPES_MLTC) {
    if (!branchIn(life.branch, row.lifeBranches)) continue;
    const matched = row.match === "all" ? row.opposite.every((name) => oppositeMains.includes(name)) : row.opposite.some((name) => oppositeMains.includes(name));
    if (!matched) continue;
    const extraBreakers = row.extra ? presentInAny(group.all, SIX_MALEFIC) : [];
    const extraAuspicious = row.extra ? presentInAny(group.all, AUSPICIOUS_STARS) : [];
    results.push(
      finding({
        id: "vcd_muon_sao_MLTC",
        name: `Mệnh VCD ở ${branchName(life.branch)}, đối cung ${row.opposite.join(" – ")}`,
        polarity: "trung tính",
        certainty: "interpretive",
        summary: `MLTC: ${row.key}.${row.note ? ` ${row.note}.` : ""}`,
        ...(row.extra ? { satisfied: extraAuspicious.length ? [`cát tinh: ${extraAuspicious.join(", ")}`] : [], missing: extraAuspicious.length ? [] : ["không có cát tinh"], breakers: extraBreakers } : {}),
        assumptions: [row.match === "any" ? "dòng 'A hoặc B': khớp khi đối cung có một trong hai sao" : "khớp khi đối cung có đủ các sao", ...(row.extra ? ["điều kiện sát/cát xét trong tam phương tứ chính"] : [])],
        source: "MLTC mục 1.3",
        kbFile: KB.voidRules,
      }),
    );
  }
  const maleficInLife = presentIn(life, SIX_MALEFIC);
  if (hasAny(life, ["Kình Dương", "Đà La"])) {
    results.push(finding({ id: "kinh_da_vcd", name: "Mệnh VCD có Kình/Đà", polarity: "tốt", certainty: "exact", summary: "NP2: Kình, Đà ưa vô chính diệu.", source: "NP2 tr.40–45", kbFile: KB.voidThreeVoids }));
  }
  if (hasAny(life, ["Tả Phụ", "Hữu Bật"])) {
    results.push(finding({ id: "vcd_phu_bat", name: "Mệnh VCD có Tả/Hữu", polarity: "xấu", certainty: "exact", summary: "TVTH phú: 'Phụ Bật gia thủ đem mình ly tông'.", source: "TVTH tr.94–95", kbFile: KB.voidThreeVoids }));
  }
  if (hasStarIn(life, "Thiên Không")) {
    results.push(finding({ id: "thien_khong_o_menh", name: "Thiên Không ở Mệnh", polarity: "xấu", certainty: "exact", summary: "NP1: vất vả (tam hợp có Kiếp Sát, Đào Hoa).", source: "NP1 tr.142–185", kbFile: KB.voidThreeVoids }));
  }
  if (maleficInLife.length === 1) {
    results.push(
      finding({ id: "hung_tinh_doc_thu_vcd", name: `Mệnh VCD, ${maleficInLife[0]} độc thủ`, polarity: "tốt", certainty: "interpretive", summary: "NP1: cực kỳ tốt.", assumptions: ["'hung tinh' hiểu là lục sát; 'độc thủ' là đúng một sao"], source: "NP1 tr.142–185", kbFile: KB.voidThreeVoids }),
    );
  }
  const loneVoid = presentIn(life, ["Địa Không", "Địa Kiếp"]);
  const satKyAround = presentInAny([...group.trines, group.opposite], SAT_KY_STARS);
  if (loneVoid.length === 1 && satKyAround.length > 0) {
    results.push(
      finding({ id: "khong_kiep_vcd", name: `Mệnh VCD có ${loneVoid[0]} đơn độc`, polarity: "xấu", certainty: "interpretive", summary: `MLTC: phiêu bạt, cô đơn cả đời (sát kị chiếu: ${satKyAround.join(", ")}).`, assumptions: ["'sát kị' hiểu là lục sát + Hóa Kỵ ở tam hợp và đối cung"], source: "MLTC tr.691–701", kbFile: KB.voidThreeVoids }),
    );
  }
  if (presentInAny(group.all, ["Đại Hao", "Tiểu Hao", "Tuyệt"]).length === 3) {
    results.push(
      finding({ id: "vcd_song_hao_tuyet", name: "Mệnh VCD hội Song Hao, Tuyệt", polarity: "trung tính", certainty: "interpretive", summary: "TVTH tr.79: tằn tiện, nhiều tham vọng khó đạt.", assumptions: ["'hội' hiểu là trong tam phương tứ chính Mệnh"], source: "TVTH tr.79", kbFile: KB.voidThreeVoids }),
    );
  }
  const voidsInLife = presentIn(life, THREE_VOIDS_TVTH);
  if (voidsInLife.length >= 2) {
    const sunMoon = presentInAny(group.all, ["Thái Dương", "Thái Âm"]);
    const auspicious = presentInAny(group.all, AUSPICIOUS_STARS);
    const assumptions = ["'đắc Tam Không' hiểu là ít nhất 2 trong Tuần, Triệt, Thiên Không, Địa Không ở Mệnh (theo ví dụ KB)", "'Nhật Nguyệt chiếu' hiểu là trong tam phương tứ chính"];
    results.push(
      finding({
        id: "vcd_dac_tam_khong",
        name: "Mệnh VCD đắc Tam Không",
        polarity: sunMoon.length && auspicious.length ? "tốt" : "trung tính",
        certainty: "interpretive",
        summary: `Mệnh có ${voidsInLife.join(", ")}. TVTH: phát công khanh khi có cát tinh hội và Nhật Nguyệt chiếu.`,
        satisfied: [...(auspicious.length ? [`cát tinh hội: ${auspicious.join(", ")}`] : []), ...(sunMoon.length ? [`${sunMoon.join(", ")} chiếu`] : [])],
        missing: [...(auspicious.length ? [] : ["không có cát tinh hội"]), ...(sunMoon.length ? [] : ["không có Thái Dương/Thái Âm chiếu"])],
        assumptions,
        variants: ["TVTH nơi khác: 'Tam Không độc thủ' phú quý nan toàn", "MLTC 'Tứ Không' dùng Địa Kiếp thay Địa Không"],
        source: "TVTH tr.97–100, tr.105–118",
        kbFile: KB.voidThreeVoids,
      }),
    );
    if (presentInAny(group.all, ["Hóa Lộc", "Lộc Tồn"]).length === 2) {
      results.push(finding({ id: "vcd_tam_khong_loc", name: "Mệnh VCD Tam Không gặp Song Lộc", polarity: "trung tính", certainty: "interpretive", summary: "TVTH: giàu sang song không bền.", assumptions, source: "TVTH tr.60–62", kbFile: KB.voidThreeVoids }));
    }
  }
  return results;
}

function hiddenLuckFindings(ctx: Context): readonly Finding[] {
  const { chart, life } = ctx;
  const partner = palaceAt(chart, sixCombinationPartner(life.branch));
  const results: Finding[] = [];
  const assumptions = ["MLTC còn điều kiện khác ở file Lộc Tồn (05_Phu-tinh) chưa xét"];
  const lifeHas = (name: string) => hasStarIn(life, name);
  const partnerHas = (name: string) => hasStarIn(partner, name);
  if ((lifeHas("Lộc Tồn") && partnerHas("Hóa Lộc")) || (lifeHas("Hóa Lộc") && partnerHas("Lộc Tồn"))) {
    results.push(finding({ id: "minh_loc_am_loc", name: "Minh Lộc ám Lộc", polarity: "tốt", certainty: "interpretive", summary: `Một Lộc ở Mệnh, Lộc kia ở cung nhị hợp ${palaceTag(partner)}.`, assumptions, source: "MLTC tr.702–713, tr.743–751", kbFile: KB.partners }));
  }
  if (lifeHas("Hóa Khoa") && partnerHas("Lộc Tồn")) {
    results.push(finding({ id: "khoa_minh_loc_am", name: "Khoa minh Lộc ám", polarity: "tốt", certainty: "interpretive", summary: `Hóa Khoa ở Mệnh, Lộc Tồn ở cung nhị hợp ${palaceTag(partner)}.`, assumptions, source: "MLTC tr.702–713, tr.743–751", kbFile: KB.partners }));
  }
  return results;
}

function lifePartnerFindings(ctx: Context): readonly Finding[] {
  const { chart, life } = ctx;
  const combo = palaceAt(chart, sixCombinationPartner(life.branch));
  const harm = palaceAt(chart, sixHarmPartner(life.branch));
  const row = LIFE_PARTNER_ROLES.find((entry) => branchIn(life.branch, entry.lifeBranches))!;
  const group = branchIn(life.branch, FOUR_BIRTH) ? "tứ sinh" : branchIn(life.branch, FOUR_PEAK) ? "tứ bại" : "tứ mộ";
  return [
    finding({
      id: "menh_nhi_hop",
      name: `Mệnh nhị hợp ${combo.role}`,
      polarity: "trung tính",
      certainty: "exact",
      summary: `Mệnh ${branchName(life.branch)} nhị hợp ${palaceTag(combo)} (bảng: ${row.sixCombination}): bổ trợ; bị ảnh hưởng, chi phối; quan tâm chăm sóc ở đó.`,
      source: "TVTH tr.8–9; NP1 Menh tr.1–7",
      kbFile: KB.partners,
    }),
    finding({
      id: "menh_luc_hai",
      name: `Mệnh lục hại ${harm.role}`,
      polarity: "xấu",
      certainty: "interpretive",
      summary: `Mệnh ${branchName(life.branch)} lục hại ${palaceTag(harm)} (bảng: ${row.sixHarm}): xung phá, có thành có bại; mình ở thế bị động. NP1 (Mệnh ${group}): ${SICKNESS_VERSUS_LIFE[group]}.`,
      assumptions: ["không sách nào có bảng lục hại; các hàng Thân, Tuất, Hợi do KB suy theo đối xứng", "NP1: luận Thân cũng như vậy"],
      source: "NP1 Menh tr.1–7, Cung-Tat-Ach tr.199–202",
      kbFile: KB.partners,
    }),
  ];
}

export function natalProfile(chart: Chart, options: NatalOptions = DEFAULT_NATAL_OPTIONS): NatalProfile {
  const params = chart.parameters;
  const life = lifePalace(chart);
  const body = bodyPalace(chart);
  const yearBranch = branchName(params.year.branch);
  const hourBranch = branchName(params.hour);
  const nayinElement = chart.natalNayin.element;
  const expectedRole = BODY_RESIDENCE_BY_HOUR[hourBranch];
  const bodyResidence: BodyResidence = {
    role: body.role,
    expectedRole,
    label: expectedRole === "Mệnh" ? "Thân cư Mệnh (Thân Mệnh đồng cung)" : `Thân cư ${expectedRole}`,
    consistent: body.role === expectedRole && palaceOfRole(params.lifePalace, expectedRole) === params.bodyPalace,
  };
  const relation = elementRelation(params.bureau.element, nayinElement);
  const bureauVersusNatal: BureauVersusNatal = {
    bureau: params.bureau,
    nayin: chart.natalNayin,
    relation,
    verdict: relation.kind === "sinh" ? "Cục sinh Mệnh — thượng cách" : relation.kind === "khắc" || relation.kind === "bị khắc" ? "Mệnh, Cục tương khắc" : null,
  };
  const avoidedNames = BUREAU_AVOIDED_BRANCHES[params.bureau.element];
  const avoidedBranches: AvoidedBranches = {
    branches: avoidedNames.map(branchIndex),
    life: branchIn(life.branch, avoidedNames),
    body: branchIn(body.branch, avoidedNames),
  };
  const lifeStages = lifeStagesOf(nayinElement, life.branch, body.branch, options);
  const seasonName = SEASON_OF_MONTH[params.month]!;
  const season: SeasonInfo = {
    lunarMonth: params.month,
    isLeapMonth: chart.birth.lunar.isLeapMonth,
    season: seasonName,
    strength: SEASON_STRENGTH.find((row) => row.element === nayinElement && row.season === seasonName)?.label ?? null,
    favorableHour: FAVORABLE_HOURS_BY_SEASON[seasonName].includes(hourBranch),
  };
  const dayNight = DAY_HOURS.includes(hourBranch) ? "ngày" : "đêm";
  const yinYang: readonly YinYangMethod[] = [
    {
      id: "gio_vs_cung_menh",
      name: "giờ sinh với cung Mệnh",
      verdict: branchPolarity(params.hour) === branchPolarity(life.branch) ? "thuận lý" : "nghịch lý",
      detail: `giờ ${hourBranch} (${branchPolarity(params.hour)}), Mệnh ${branchName(life.branch)} (${branchPolarity(life.branch)})`,
      source: "TVTH tr.96 mục 3",
    },
    {
      id: "nam_vs_cung_menh",
      name: "năm sinh với cung Mệnh",
      verdict: stemPolarity(params.year.stem) === branchPolarity(life.branch) ? "thuận lý" : "nghịch lý",
      detail: `năm ${stemName(params.year.stem)} (${stemPolarity(params.year.stem)}), Mệnh ${branchName(life.branch)} (${branchPolarity(life.branch)})`,
      source: "TVTH tr.100 mục VI.1; NP2 tr.231–237",
    },
    {
      id: "phuc_am_phuc_duong",
      name: "Phúc âm Phúc dương",
      verdict: "chưa xác định",
      detail: "NP1 nêu 'Phúc âm Phúc dương' nhưng KB không định nghĩa cách xét",
      source: "NP1 tr.111–142",
    },
  ];
  const tuan = palacesOfStar(chart, "Tuần");
  const triet = palacesOfStar(chart, "Triệt");
  const expectedTuan = TUAN_BY_DECADE[`Giáp ${branchName(decadeLeaderBranch(params.year))}`]!.map(branchIndex);
  const expectedTriet = TRIET_BY_STEM_PAIR.find((row) => row.stems.includes(stemName(params.year.stem)))!.branches.map(branchIndex);
  const coverage: TuanTrietCoverage = {
    tuan,
    triet,
    expectedTuan,
    expectedTriet,
    matchesTables: samePair(tuan, expectedTuan) && samePair(triet, expectedTriet),
    lifeTuan: tuan.includes(life.branch),
    lifeTriet: triet.includes(life.branch),
    bodyTuan: tuan.includes(body.branch),
    bodyTriet: triet.includes(body.branch),
  };
  const thaiTue: ThaiTueInfo = {
    life: groupOf(chart, life.branch),
    body: groupOf(chart, body.branch),
    sameGroup: groupOf(chart, life.branch).group.index === groupOf(chart, body.branch).group.index,
    thaiTueInLife: life.branch === params.year.branch,
    tuePha: ref(palaceAt(chart, params.year.branch + 6)),
  };
  const lifeVoid = voidCoverage(chart, life);
  const bodyVoid = voidCoverage(chart, body);
  const lifeLord = lordOf(chart, LIFE_LORD_BY_LIFE_BRANCH[branchName(life.branch)]);
  const bodyLord = lordOf(chart, BODY_LORD_BY_YEAR_BRANCH[yearBranch]);
  const ctx: Context = { chart, options, life, body, sameHouse: life.branch === body.branch, yearBranch, hourBranch, nayinElement, coverage, lifeVoid: lifeVoid.isVoid };
  const findings: readonly Finding[] = [
    ...residenceFindings(ctx, bodyResidence),
    ...sameHouseFindings(ctx),
    ...lifeBodyCaseFindings(ctx),
    ...lordFindings(ctx, lifeLord, bodyLord),
    ...bureauFindings(ctx, bureauVersusNatal, avoidedBranches),
    ...lifeStageFindings(ctx, lifeStages),
    ...seasonFindings(season, nayinElement, hourBranch),
    ...yinYangFindings(yinYang),
    ...yearHourFindings(ctx),
    ...dayNightFindings(ctx, dayNight),
    ...palaceStarNatalFindings(ctx, life, "Mệnh"),
    ...(ctx.sameHouse ? [] : palaceStarNatalFindings(ctx, body, "Thân")),
    ...thaiTueFindings(ctx, thaiTue),
    ...tuanTrietFindings(ctx),
    ...voidFindings(ctx, lifeVoid),
    ...hiddenLuckFindings(ctx),
    ...lifePartnerFindings(ctx),
  ];
  return {
    yearName: stemBranchName(params.year),
    polarityLabel: chart.polarityLabel,
    life: ref(life),
    body: ref(body),
    bodyResidence,
    lifeLord,
    bodyLord,
    bureauVersusNatal,
    avoidedBranches,
    lifeStages,
    season,
    dayNight,
    yinYang,
    birthMonthMLTC: BIRTH_MONTH_MLTC[params.month]!,
    thaiTue,
    tuanTriet: coverage,
    lifeVoid,
    bodyVoid,
    options,
    findings,
  };
}

const lordLine = (label: string, lord: LordStar): string =>
  `- ${label}: ${lord.star}${lord.palace ? ` ở ${lord.palace.role} (${branchName(lord.palace.branch)})` : ""}`;

const voidLine = (label: string, coverage: VoidCoverage): string =>
  coverage.isVoid
    ? `- ${label} vô chính diệu, mượn ${coverage.borrowedFrom.role} (${branchName(coverage.borrowedFrom.branch)}): ${coverage.borrowedStars.map(formatSummary).join(", ") || "không có"}`
    : `- ${label} có chính tinh`;

export function renderNatalProfile(profile: NatalProfile): string {
  const stages = profile.lifeStages;
  const tt = profile.tuanTriet;
  return [
    `## Hồ sơ bản mệnh · ${profile.yearName} · ${profile.polarityLabel}`,
    `- Mệnh ở ${branchName(profile.life.branch)}; ${profile.bodyResidence.label} (${branchName(profile.body.branch)})`,
    lordLine("Chủ Mệnh", profile.lifeLord),
    lordLine("Chủ Thân", profile.bodyLord),
    `- Bản mệnh ${profile.bureauVersusNatal.nayin.name} · ${profile.bureauVersusNatal.bureau.name} · ${profile.bureauVersusNatal.relation.description}${profile.bureauVersusNatal.verdict ? ` → ${profile.bureauVersusNatal.verdict}` : " → sách không nêu quy tắc"}`,
    `- Cục kỵ hành: ${profile.avoidedBranches.branches.map(branchName).join(", ")}${profile.avoidedBranches.life ? " (trùng Mệnh)" : ""}${profile.avoidedBranches.body ? " (trùng Thân)" : ""}`,
    `- Sinh vượng bại tuyệt (${stages.source}, hành ${stages.element}): Mệnh ${stages.life ?? "không thuộc"}, Thân ${stages.body ?? "không thuộc"}${stages.variants.map((v) => `; ${v.source}: Mệnh ${v.life ?? "không thuộc"}, Thân ${v.body ?? "không thuộc"}`).join("")}`,
    `- Mùa sinh: ${profile.season.season} (tháng ${profile.season.lunarMonth}) · ${profile.season.strength ?? "không thuận mùa"} · ${profile.season.favorableHour ? "thuận giờ sinh" : "không thuận giờ sinh"} · sinh ban ${profile.dayNight}`,
    ...profile.yinYang.map((method) => `- Âm dương (${method.name}): ${method.verdict} — ${method.detail} [${method.source}]`),
    `- MLTC theo tháng sinh: thụ thai ${profile.birthMonthMLTC.conception}, tiết ${profile.birthMonthMLTC.solarTerm}`,
    `- Vòng Thái Tuế: Mệnh có ${profile.thaiTue.life.ringStar} (bộ ${profile.thaiTue.life.group.name}); Thân có ${profile.thaiTue.body.ringStar} (bộ ${profile.thaiTue.body.group.name})`,
    `- Tuần ${tt.tuan.map(branchName).join(" ")} · Triệt ${tt.triet.map(branchName).join(" ")} · Mệnh: ${[tt.lifeTuan ? "Tuần" : "", tt.lifeTriet ? "Triệt" : ""].filter(Boolean).join(", ") || "không"} · Thân: ${[tt.bodyTuan ? "Tuần" : "", tt.bodyTriet ? "Triệt" : ""].filter(Boolean).join(", ") || "không"}`,
    voidLine("Mệnh", profile.lifeVoid),
    voidLine("Thân", profile.bodyVoid),
    "",
    "### Nhận định",
    ...profile.findings.map(renderFinding),
  ].join("\n");
}
