import { branchElement, elementRelation, generatedBy, type Element, type ElementRelation } from "../calendar/five-elements.js";
import { clashPartner, sixCombinationPartner, sixHarmPartner } from "../calendar/relations.js";
import { branchName, branchPolarity, stemName } from "../calendar/stem-branch.js";
import type { Chart, Palace } from "../chart/types.js";
import { mapResult, type Result } from "../result.js";
import { DEFAULT_ANALYSIS_OPTIONS, type AnalysisOptions } from "./analysis-options.js";
import {
  branchIn,
  describePlacements,
  flankPlacements,
  formatSummary,
  isStrong,
  mainNames,
  mainSummaries,
  oppositeOf,
  palaceTag,
  presentIn,
  presentInAny,
  resolveBranch,
  type FlankPlacement,
  type StarSummary,
} from "./analysis-helpers.js";
import { hasStarIn, isVoidOfMainStars, palaceAt, threeSidesOf } from "./chart-query.js";
import { finding, renderFinding, type Certainty, type Finding, type Polarity } from "./finding.js";
import {
  AUSPICIOUS_STARS,
  BAD_FLANK_PATTERNS,
  BODY_FLANK_LABELS_MLTC,
  FOUR_MALEFIC,
  GOOD_FLANK_PATTERNS,
  LIFE_STAGE_STAR_PREFERENCES,
  SIX_MALEFIC,
  TUAN_TRIET_BY_ROLE,
  VOID_AFFINITIES,
  VOID_PALACE_BY_ROLE_NP2,
  WEAK_STAR_VOID_CONFLICT,
  type FlankPattern,
  type SourcedLabel,
} from "./palace-tables.js";
import { starElement, type StarElement } from "./star-elements.js";

const KB = {
  threeSides: "08_Quan-he-giua-cac-cung/01_Tam-phuong-tu-chinh.md",
  goodFlank: "08_Quan-he-giua-cac-cung/02_Giap-cung-tot.md",
  badFlank: "08_Quan-he-giua-cac-cung/03_Giap-cung-xau.md",
  starPalace: "08_Quan-he-giua-cac-cung/04_Ngu-hanh-sao-voi-cung.md",
  partners: "08_Quan-he-giua-cac-cung/06_Nhi-hop-luc-xung-va-am-hop.md",
  tuanTrietRoles: "07_Tuan-Triet/03_Tuan-Triet-o-Menh-va-cung-chieu.md",
  tuanTrietStars: "07_Tuan-Triet/04_An-ngu-chinh-tinh-va-sao-ham.md",
  tuanTrietNature: "07_Tuan-Triet/01_Ban-chat-Tuan-Triet.md",
  voidRules: "04_Chinh-tinh/15_Menh-vo-chinh-dieu/01_Nguyen-tac-xem-VCD.md",
  voidThreeVoids: "04_Chinh-tinh/15_Menh-vo-chinh-dieu/02_Dac-tam-khong.md",
  lifeStage: "06_Cac-vong-sao/03_Vong-Trang-Sinh/02_Sinh-luc-tung-cung.md",
} as const;

export type ElementFit = "lạc hãm theo ngũ hành" | "thuận" | null;

export interface StarElementFit {
  readonly star: string;
  readonly element?: StarElement;
  readonly palaceElement: Element;
  readonly palaceVersusStar?: ElementRelation;
  readonly fit: ElementFit;
  readonly modifiers: readonly string[];
}

export interface MainStarAnalysis extends StarSummary {
  readonly elementFit: StarElementFit;
}

export interface SidePalace {
  readonly branch: number;
  readonly role: string;
  readonly mainStars: readonly StarSummary[];
  readonly stars: readonly string[];
}

export interface FlankMatch {
  readonly id: string;
  readonly label: string;
  readonly polarity: Polarity;
  readonly placements: readonly FlankPlacement[];
  readonly certainty: Certainty;
  readonly conditionsMet: boolean;
}

export interface PartnerPalace {
  readonly branch: number;
  readonly role: string;
}

export interface VoidInfo {
  readonly isVoid: boolean;
  readonly borrowedFrom?: PartnerPalace;
  readonly borrowedStars: readonly StarSummary[];
}

export interface LifeStageStarInfo {
  readonly star: string;
  readonly favoredHere: boolean;
  readonly favored: readonly string[];
  readonly avoidedHere: readonly SourcedLabel[];
  readonly note?: string;
}

export interface TuanTrietInfo {
  readonly hasTuan: boolean;
  readonly hasTriet: boolean;
  readonly roleEffects: readonly SourcedLabel[];
  readonly starEffects: readonly string[];
}

export interface PalaceAnalysis {
  readonly branch: number;
  readonly branchName: string;
  readonly stemBranch: string;
  readonly role: string;
  readonly isBodyPalace: boolean;
  readonly element: Element;
  readonly natalElement: Element;
  readonly palaceVersusNatal: ElementRelation;
  readonly mainStars: readonly MainStarAnalysis[];
  readonly threeSides: { readonly self: SidePalace; readonly trines: readonly [SidePalace, SidePalace]; readonly opposite: SidePalace };
  readonly flanking: { readonly before: PartnerPalace; readonly after: PartnerPalace; readonly matches: readonly FlankMatch[] };
  readonly sixCombination: PartnerPalace;
  readonly sixHarm: PartnerPalace;
  readonly clash: PartnerPalace;
  readonly tuanTriet: TuanTrietInfo;
  readonly voidInfo: VoidInfo;
  readonly lifeStageStar?: LifeStageStarInfo;
  readonly options: AnalysisOptions;
  readonly findings: readonly Finding[];
}

const partnerOf = (chart: Chart, branch: number): PartnerPalace => ({ branch, role: palaceAt(chart, branch).role });

const sideOf = (palace: Palace): SidePalace => ({
  branch: palace.branch,
  role: palace.role,
  mainStars: mainSummaries(palace),
  stars: palace.stars.filter((star) => star.group !== "chính tinh").map((star) => star.name),
});

export function elementFitOfStar(
  star: string,
  branch: number,
  otherMainStars: readonly string[],
  hasTuanOrTriet: boolean,
  options: AnalysisOptions = DEFAULT_ANALYSIS_OPTIONS,
): StarElementFit {
  const palaceElement = branchElement(branch);
  const element = starElement(star, options);
  if (!element) return { star, palaceElement, fit: null, modifiers: [] };
  const palaceVersusStar = elementRelation(palaceElement, element.element);
  const fit: ElementFit =
    palaceVersusStar.kind === "khắc" ? "lạc hãm theo ngũ hành" : palaceVersusStar.kind === "sinh" || palaceVersusStar.kind === "đồng hành" ? "thuận" : null;
  const rescuers =
    fit === "lạc hãm theo ngũ hành"
      ? otherMainStars.filter((other) => {
          const otherElement = starElement(other, options);
          return otherElement !== undefined && generatedBy(otherElement.element) === palaceElement;
        })
      : [];
  const modifiers = [
    ...(fit === "lạc hãm theo ngũ hành" && hasTuanOrTriet ? ["càng xấu (cung có Tuần/Triệt)"] : []),
    ...rescuers.map((other) => `hóa tốt (cứu): ${other} sinh hành cung`),
  ];
  return { star, element, palaceElement, palaceVersusStar, fit, modifiers };
}

const mentionsLife = (pattern: FlankPattern): boolean => pattern.label.includes("Mệnh");

function matchPattern(chart: Chart, branch: number, pattern: FlankPattern): readonly FlankPlacement[] | undefined {
  for (const [first, second] of pattern.pairs) {
    const placements = flankPlacements(chart, branch, first, second);
    if (placements) return placements;
  }
  return undefined;
}

function flankFindings(chart: Chart, palace: Palace): { readonly matches: readonly FlankMatch[]; readonly findings: readonly Finding[] } {
  const branch = palace.branch;
  const isLife = palace.role === "Mệnh";
  const group = threeSidesOf(chart, branch);
  const matches: FlankMatch[] = [];
  const findings: Finding[] = [];
  const maleficReading = "'sát tinh xung phá' hiểu là tứ sát (Kình, Đà, Hỏa, Linh) trong tam phương tứ chính";
  const maleficAround = presentInAny(group.all, FOUR_MALEFIC);
  const maleficBreakers = maleficAround.map((star) => `${star} trong tam phương tứ chính`);
  const auspiciousAround = (exclude: readonly string[]) => presentInAny(group.all, AUSPICIOUS_STARS).filter((star) => !exclude.includes(star));
  const record = (match: FlankMatch, extra: Partial<Finding>, source: string, kbFile: string) => {
    matches.push(match);
    findings.push(
      finding({
        id: match.id,
        name: match.label,
        polarity: match.polarity,
        certainty: match.certainty,
        summary: `${palaceTag(palace)} bị kẹp: ${describePlacements(match.placements)}.`,
        source,
        kbFile,
        ...extra,
      }),
    );
  };

  for (const pattern of GOOD_FLANK_PATTERNS) {
    const placements = matchPattern(chart, branch, pattern);
    if (!placements) continue;
    const onLifeOnly = mentionsLife(pattern) && !isLife ? [`sách nêu cho cung Mệnh; ở đây là ${palace.role}`] : [];
    if (pattern.id === "tu_phu_giap_menh") {
      const breakers = presentInAny(group.all, FOUR_MALEFIC);
      const missing = [
        ...(isLife ? [] : ["cung bị kẹp không phải Mệnh"]),
        ...(isVoidOfMainStars(palace) ? [] : ["Mệnh không vô chính diệu"]),
        ...(branchIn(branch, ["Dần", "Thân"]) ? [] : ["chỉ thành cách ở Dần, Thân"]),
      ];
      const conditionsMet = missing.length === 0 && breakers.length === 0;
      record(
        { id: pattern.id, label: conditionsMet ? pattern.label : `${pattern.label} — ${breakers.length ? "phá cách (sát tinh xung phá)" : "chưa đủ điều kiện"}`, polarity: conditionsMet ? "tốt" : "trung tính", placements, certainty: "interpretive", conditionsMet },
        {
          satisfied: [`${palaceTag(palace)}`, ...(missing.length ? [] : ["Mệnh vô chính diệu ở Dần/Thân"])],
          missing,
          breakers: breakers.map((star) => `${star} trong tam phương tứ chính`),
          assumptions: ["'sát tinh xung phá' hiểu là tứ sát (Kình, Đà, Hỏa, Linh) trong tam phương tứ chính"],
        },
        pattern.source,
        KB.goodFlank,
      );
      continue;
    }
    if (pattern.id === "khoa_quyen_loc_giap") {
      const strongInGroup = group.all.flatMap((side) => mainSummaries(side).filter(isStrong).map(formatSummary));
      record(
        { id: pattern.id, label: pattern.label, polarity: "tốt", placements, certainty: "interpretive", conditionsMet: strongInGroup.length > 0 },
        {
          satisfied: strongInGroup.length ? [`tam phương có chính tinh miếu/vượng/đắc: ${strongInGroup.join(", ")}`] : [],
          missing: strongInGroup.length ? [] : ["tam phương không có cát tinh miếu vượng (MLTC)"],
          assumptions: [pattern.ambiguity!, "'cát tinh miếu vượng' hiểu là chính tinh Miếu/Vượng/Đắc trong tam phương tứ chính", ...onLifeOnly],
        },
        pattern.source,
        KB.goodFlank,
      );
      continue;
    }
    const flankStars = pattern.pairs.flat();
    const helpers = auspiciousAround(flankStars);
    const unbroken = maleficAround.length === 0;
    record(
      { id: pattern.id, label: unbroken ? pattern.label : `${pattern.label} — bị sát tinh xung phá`, polarity: unbroken ? pattern.polarity : "trung tính", placements, certainty: "interpretive", conditionsMet: unbroken },
      {
        satisfied: helpers.length ? [`cát tinh hội thêm: ${helpers.join(", ")}`] : [],
        missing: helpers.length ? [] : ["không có cát tinh hội thêm (MLTC: nên có)"],
        breakers: maleficBreakers,
        assumptions: [maleficReading, "điều kiện chung của giáp tốt (MLTC tr.77–91): không sát tinh xung phá, nên có cát tinh hội", ...onLifeOnly],
      },
      pattern.source,
      KB.goodFlank,
    );
  }

  if (hasStarIn(palace, "Tử Vi") && (palace.role === "Mệnh" || palace.role === "Quan Lộc")) {
    const placements = flankPlacements(chart, branch, "Tả Phụ", "Hữu Bật") ?? flankPlacements(chart, branch, "Thiếu Dương", "Thiếu Âm");
    if (placements) {
      const unbroken = maleficAround.length === 0;
      record(
        { id: "kim_du_phu_gia", label: unbroken ? "Kim dư phù giá" : "Kim dư phù giá — bị tứ sát phá", polarity: unbroken ? "tốt" : "trung tính", placements, certainty: "interpretive", conditionsMet: unbroken },
        { satisfied: [`Tử Vi tọa ${palaceTag(palace)}`], breakers: maleficBreakers, assumptions: [maleficReading] },
        "TVTH tr.91–93",
        KB.goodFlank,
      );
    }
  }

  if (isLife) {
    const noble = matches.filter((match) => ["ta_huu_giap", "xuong_khuc_giap", "khoa_quyen_loc_giap", "khoi_viet_giap", "long_phuong_giap"].includes(match.id));
    const sunMoon = matches.find((match) => match.id === "nhat_nguyet_giap");
    const hasFu = hasStarIn(palace, "Thiên Phủ");
    const viaSunMoon = sunMoon !== undefined && hasFu && branchIn(branch, ["Sửu", "Mùi"]);
    const strictNoble = hasFu ? noble : [];
    const looseNoble = hasFu ? [] : noble;
    const khoaQuyenAmbiguity = GOOD_FLANK_PATTERNS.find((p) => p.id === "khoa_quyen_loc_giap")!.ambiguity!;
    if (strictNoble.length > 0 || viaSunMoon) {
      const reasons = [...(viaSunMoon ? ["Thiên Phủ tọa Mệnh Sửu/Mùi được Nhật Nguyệt giáp"] : []), ...strictNoble.map((match) => `Thiên Phủ tọa Mệnh được ${match.label}`)];
      const onlyAmbiguous = !viaSunMoon && strictNoble.every((match) => match.id === "khoa_quyen_loc_giap");
      record(
        {
          id: "quy_tinh_giap_menh",
          label: "Quí tinh giáp Mệnh cách",
          polarity: "tốt",
          placements: [...(viaSunMoon ? sunMoon.placements : []), ...strictNoble.flatMap((match) => match.placements)],
          certainty: onlyAmbiguous ? "interpretive" : "exact",
          conditionsMet: true,
        },
        { satisfied: reasons, assumptions: onlyAmbiguous ? [khoaQuyenAmbiguity] : [] },
        "TVTH tr.91–93",
        KB.goodFlank,
      );
    } else if (looseNoble.length > 0) {
      record(
        {
          id: "quy_tinh_giap_menh",
          label: "Quí tinh giáp Mệnh cách (cách đọc rộng)",
          polarity: "tốt",
          placements: looseNoble.flatMap((match) => match.placements),
          certainty: "interpretive",
          conditionsMet: false,
        },
        {
          satisfied: looseNoble.map((match) => match.label),
          missing: ["Mệnh không có Thiên Phủ: theo cách đọc chặt, 'ở bất cứ cung nào' vẫn nói về Thiên Phủ"],
          assumptions: ["cách đọc rộng: chủ ngữ của 'ở bất cứ cung nào mà giáp Tả Hữu…' là cung Mệnh, không cần Thiên Phủ", ...(looseNoble.every((match) => match.id === "khoa_quyen_loc_giap") ? [khoaQuyenAmbiguity] : [])],
        },
        "TVTH tr.91–93",
        KB.goodFlank,
      );
    }
  }

  if (hasStarIn(palace, "Thiên Tướng") || hasStarIn(palace, "Thiên Phủ")) {
    const placements = flankPlacements(chart, branch, "Vũ Khúc", "Thiên Lương") ?? flankPlacements(chart, branch, "Thiên Lương", "Hóa Lộc");
    if (placements) {
      record(
        { id: "tai_am_giap_an", label: "Tài ấm giáp ấn", polarity: "tốt", placements, certainty: "interpretive", conditionsMet: true },
        { assumptions: ["KB ghi 'Thiên Phủ/Tướng': nhận cả cung có Thiên Tướng hoặc Thiên Phủ"] },
        "MLTC tr.473–501",
        KB.goodFlank,
      );
    }
  }

  for (const pattern of BAD_FLANK_PATTERNS) {
    const placements = matchPattern(chart, branch, pattern);
    if (!placements) continue;
    const onLifeOnly = mentionsLife(pattern) && !isLife ? [`sách nêu cho cung Mệnh; ở đây là ${palace.role}`] : [];
    if (pattern.id === "hoa_linh_giap") {
      const mains = mainSummaries(palace);
      const tamers = mains.filter((star) => ["Tử Vi", "Thất Sát", "Tham Lang"].includes(star.name) && (star.brightness === "Miếu" || star.brightness === "Vượng"));
      const weak = mains.length === 0 || mains.every((star) => !isStrong(star));
      record(
        { id: pattern.id, label: pattern.label, polarity: "xấu", placements, certainty: "interpretive", conditionsMet: true },
        {
          satisfied: isLife && weak ? ["Mệnh chính tinh yếu: 'thành bại khó lường'"] : [],
          breakers: tamers.map((star) => `${formatSummary(star)} miếu vượng chế phục được`),
          assumptions: ["'chính tinh yếu' hiểu là cung không có chính tinh Miếu/Vượng/Đắc"],
        },
        pattern.source,
        KB.badFlank,
      );
      continue;
    }
    if (pattern.id === "giap_liem_giap_sat") {
      const roleLabel = palace.role === "Quan Lộc" ? "tung hoành, tuổi già mới rạng công danh" : undefined;
      record(
        { id: pattern.id, label: roleLabel ? `${pattern.label} ở Quan Lộc — ${roleLabel}` : pattern.label, polarity: "trung tính", placements, certainty: roleLabel ? "exact" : "interpretive", conditionsMet: true },
        { assumptions: roleLabel ? [] : ["sách chỉ cho lời đoán khi cung bị kẹp là Quan Lộc"] },
        pattern.source,
        KB.badFlank,
      );
      continue;
    }
    record(
      { id: pattern.id, label: pattern.label, polarity: pattern.polarity, placements, certainty: onLifeOnly.length ? "interpretive" : "exact", conditionsMet: true },
      { assumptions: onLifeOnly },
      pattern.source,
      KB.badFlank,
    );
  }

  if (hasStarIn(palace, "Lộc Tồn")) {
    const placements = flankPlacements(chart, branch, "Kình Dương", "Đà La");
    if (placements) {
      record(
        { id: "duong_da_giap_loc", label: "Dương Đà giáp Lộc (Kình Đà giáp — vi khất cái)", polarity: "xấu", placements, certainty: "interpretive", conditionsMet: auspiciousAround(["Lộc Tồn"]).length === 0 },
        {
          breakers: auspiciousAround(["Lộc Tồn"]).map((star) => `cát tinh hội: ${star}`),
          missing: auspiciousAround(["Lộc Tồn"]).length ? [] : ["không có cát tinh hội: TVTH 'lang thang kiếm ăn bằng lời nói'"],
          assumptions: [
            "'cát tinh hội' hiểu là cát tinh (trừ chính Lộc Tồn) trong tam phương tứ chính",
            "Kình Đà luôn kẹp cung Lộc Tồn, nên cung nào có Lộc Tồn cũng bị Kình Đà giáp; sách vẫn xét như một cách riêng",
          ],
        },
        "TVTH tr.75–76, tr.105–118; NP1 tr.42–49; MLTC tr.653–665",
        KB.badFlank,
      );
      const [before, after] = [palaceAt(chart, branch - 1), palaceAt(chart, branch + 1)];
      const kyAt = [palace, before, after].filter((side) => hasStarIn(side, "Hóa Kỵ"));
      if (kyAt.length > 0) {
        record(
          { id: "duong_da_giap_ky", label: "Dương Đà giáp Kỵ cách — bại cục", polarity: "xấu", placements, certainty: "interpretive", conditionsMet: true },
          {
            satisfied: kyAt.map((side) => `Hóa Kỵ ở ${palaceTag(side)}`),
            assumptions: ["KB không nói Hóa Kỵ phải ở đâu; đang nhận Hóa Kỵ ở cung bị kẹp hoặc ở hai cung kẹp"],
          },
          "MLTC tr.653–665, tr.702–713",
          KB.badFlank,
        );
      }
    }
  }

  if (hasStarIn(palace, "Thiên Tướng")) {
    const placements = flankPlacements(chart, branch, "Thiên Hình", "Hóa Kỵ");
    if (placements) {
      record({ id: "hinh_ky_giap_an", label: "Hình Kỵ giáp Ấn cách", polarity: "xấu", placements, certainty: "exact", conditionsMet: true }, {}, "MLTC tr.473–501", KB.badFlank);
    }
  }

  if (hasStarIn(palace, "Văn Xương") || hasStarIn(palace, "Văn Khúc")) {
    const placements = flankPlacements(chart, branch, "Địa Không", "Địa Kiếp");
    if (placements) {
      const helpers = presentIn(palace, AUSPICIOUS_STARS).filter((star) => star !== "Văn Xương" && star !== "Văn Khúc");
      record(
        { id: "van_tinh_ngo_giap", label: "Văn tinh ngộ giáp cách", polarity: "xấu", placements, certainty: "interpretive", conditionsMet: helpers.length === 0 },
        {
          missing: helpers.length ? [] : ["Mệnh không có cát tinh: MLTC 'bần hàn, có tài nhưng cả đời không gặp quý nhân'"],
          breakers: helpers.map((star) => `cát tinh tại cung: ${star}`),
          assumptions: ["'cát tinh' hiểu là cát tinh tọa tại cung bị kẹp, trừ chính Xương Khúc"],
        },
        "MLTC tr.605–619",
        KB.badFlank,
      );
    }
  }

  if (palace.isBodyPalace) {
    for (const row of BODY_FLANK_LABELS_MLTC) {
      const placements = flankPlacements(chart, branch, row.pair[0], row.pair[1]);
      if (!placements) continue;
      record(
        { id: "than_giap", label: `Thân bị giáp ${row.pair.join(" – ")}: ${row.label}`, polarity: "xấu", placements, certainty: "exact", conditionsMet: true },
        {},
        "MLTC tr.32–54",
        KB.badFlank,
      );
    }
  }

  return { matches, findings };
}

function threeSidesFindings(chart: Chart, palace: Palace): readonly Finding[] {
  const group = threeSidesOf(chart, palace.branch);
  const opposite = group.opposite;
  const auspicious = presentIn(opposite, AUSPICIOUS_STARS);
  const malefic = presentIn(opposite, SIX_MALEFIC);
  const facts = finding({
    id: "tam_phuong_tu_chinh",
    name: "Tam phương tứ chính",
    polarity: "trung tính",
    certainty: "exact",
    summary: [group.self, ...group.trines, opposite]
      .map((side) => `${palaceTag(side)}: ${mainSummaries(side).map(formatSummary).join(", ") || "vô chính diệu"}`)
      .join("; "),
    source: "MLTC tr.77–91 mục 8",
    kbFile: KB.threeSides,
  });
  const radiating = finding({
    id: "trieu_xung",
    name: "Triều / xung từ đối cung",
    polarity: malefic.length && !auspicious.length ? "xấu" : auspicious.length && !malefic.length ? "tốt" : "trung tính",
    certainty: "interpretive",
    summary: `Đối cung ${palaceTag(opposite)}: cát tinh triều (củng) ${auspicious.join(", ") || "không có"}; hung tinh xung ${malefic.join(", ") || "không có"}.`,
    assumptions: ["cát tinh theo danh sách phân loại nhanh (phu-tinh skill), hung tinh = lục sát; MLTC không liệt kê ở mục này"],
    source: "MLTC tr.77–91 mục 8",
    kbFile: KB.threeSides,
  });
  return [facts, radiating];
}

function partnerFindings(chart: Chart, palace: Palace): readonly Finding[] {
  const combo = palaceAt(chart, sixCombinationPartner(palace.branch));
  const harm = palaceAt(chart, sixHarmPartner(palace.branch));
  const clash = palaceAt(chart, clashPartner(palace.branch));
  return [
    finding({
      id: "nhi_hop",
      name: "Nhị hợp",
      polarity: "trung tính",
      certainty: "exact",
      summary: `${palaceTag(palace)} nhị hợp ${palaceTag(combo)}: bổ trợ; bị ảnh hưởng, chi phối; quan tâm chăm sóc ở đó.`,
      source: "TVTH tr.8–9; NP1 Menh tr.1–7",
      kbFile: KB.partners,
    }),
    finding({
      id: "luc_hai",
      name: "Lục hại",
      polarity: "xấu",
      certainty: "interpretive",
      summary: `${palaceTag(palace)} lục hại ${palaceTag(harm)}: xung phá (có thành có bại); dung hòa ở đó; mình ở thế bị động.`,
      assumptions: ["không sách nào có bảng lục hại; cặp suy từ ví dụ NP1 (Thân–Hợi, Dậu–Tuất do KB suy)"],
      source: "NP1 Menh tr.1–7, Cach-Xem-Han tr.111–142",
      kbFile: KB.partners,
    }),
    finding({
      id: "luc_xung",
      name: "Lục xung",
      polarity: "trung tính",
      certainty: "exact",
      summary: `${palaceTag(palace)} xung chiếu ${palaceTag(clash)} (đối cung).`,
      source: "MLTC tr.791–792",
      kbFile: KB.partners,
    }),
  ];
}

function tuanTrietAnalysis(palace: Palace, options: AnalysisOptions): { readonly info: TuanTrietInfo; readonly findings: readonly Finding[] } {
  const hasTuan = hasStarIn(palace, "Tuần");
  const hasTriet = hasStarIn(palace, "Triệt");
  if (!hasTuan && !hasTriet) return { info: { hasTuan, hasTriet, roleEffects: [], starEffects: [] }, findings: [] };
  const which = [hasTuan ? "Tuần" : "", hasTriet ? "Triệt" : ""].filter(Boolean).join(" và ");
  const roleEffects = TUAN_TRIET_BY_ROLE[palace.role] ?? [];
  const names = palace.stars.map((star) => star.name);
  const affinities = VOID_AFFINITIES.filter((affinity) => (affinity.together ? affinity.stars.every((star) => names.includes(star)) : affinity.stars.some((star) => hasStarIn(palace, star))));
  const isVoid = isVoidOfMainStars(palace);
  const starEffects = [
    ...affinities.map((affinity) => `${affinity.stars.join(" + ")} ${affinity.attitude} Tuần Triệt: ${affinity.note}`),
    ...(isVoid ? ["cung vô chính diệu gặp Tuần Triệt: NP1 cho là rất tốt (với Mệnh)"] : []),
  ];
  const weakMains = mainSummaries(palace).filter((star) => star.brightness === "Hãm");
  const strengthNote =
    hasTuan && options.tuanStrength !== "không xét"
      ? [`Theo lựa chọn '${options.tuanStrength}': Tuần đang ở cung ${branchPolarity(palace.branch).toLowerCase()} — ${(options.tuanStrength.includes("dương") ? branchPolarity(palace.branch) === "Dương" : branchPolarity(palace.branch) === "Âm") ? "mạnh" : "không phải chỗ mạnh nhất"}`]
      : [];
  const findings: Finding[] = [
    finding({
      id: "tuan_triet_cung",
      name: `${which} án ngữ ${palace.role}`,
      polarity: "trung tính",
      certainty: "interpretive",
      summary: [
        `${palaceTag(palace)} có ${which}.`,
        ...roleEffects.map((effect) => `${effect.source}: ${effect.label}.`),
        ...starEffects.map((effect) => `${effect}.`),
        ...strengthNote,
      ].join(" "),
      assumptions: ["lời đoán theo cung chức và sao chép từ nhiều sách, có chỗ trái nhau; không tính ảnh hưởng 'chiếu' sang cung khác"],
      variants: [
        ...(weakMains.length ? WEAK_STAR_VOID_CONFLICT.map((text) => `${weakMains.map(formatSummary).join(", ")}: ${text}`) : []),
        "TVTH tr.73–74: Tuần (dương) mạnh nhất ở cung dương; TVTH tr.135–137: Tuần mạnh nhất ở cung âm",
      ],
      source: "TVTH tr.73–74, 105–118; NP1; NP2; MLTC tr.799",
      kbFile: affinities.length ? KB.tuanTrietStars : KB.tuanTrietRoles,
    }),
  ];
  return { info: { hasTuan, hasTriet, roleEffects, starEffects }, findings };
}

function voidAnalysis(chart: Chart, palace: Palace): { readonly info: VoidInfo; readonly findings: readonly Finding[] } {
  if (!isVoidOfMainStars(palace)) return { info: { isVoid: false, borrowedStars: [] }, findings: [] };
  const opposite = oppositeOf(chart, palace.branch);
  const borrowedStars = mainSummaries(opposite);
  const roleLabel = VOID_PALACE_BY_ROLE_NP2[palace.role];
  const findings: Finding[] = [
    finding({
      id: "vo_chinh_dieu",
      name: `${palace.role} vô chính diệu`,
      polarity: "trung tính",
      certainty: "exact",
      summary: `${palaceTag(palace)} không có chính tinh; mượn chính tinh đối cung ${palaceTag(opposite)}: ${borrowedStars.map(formatSummary).join(", ") || "đối cung cũng vô chính diệu"} (độ sáng tính tại cung gốc). Bộ sao luận gồm sao mượn và phụ tinh tại bản cung.`,
      variants: [
        "NP1: vẫn mượn Thiên Di dù Mệnh hay Thiên Di bị Tuần Triệt; NP1 nơi khác: Mệnh VCD gặp Tuần ở Ngọ không lấy Đồng Âm ở Tý mà luận",
        "MLTC có nêu tỷ lệ giảm cát hung nhưng KB tự mâu thuẫn (60% hay 40%): không tính trọng số",
      ],
      source: "MLTC tr.32–54; NP1 tr.1–7, tr.142–185",
      kbFile: KB.voidRules,
    }),
    ...(roleLabel
      ? [
          finding({
            id: "vo_chinh_dieu_theo_cung",
            name: `${palace.role} vô chính diệu (NP2)`,
            polarity: roleLabel === "rất xấu" ? "xấu" : "tốt",
            certainty: "exact",
            summary: `NP2: ${palace.role} vô chính diệu ${roleLabel}.`,
            source: "NP2 tr.40–45, tr.169–178",
            kbFile: KB.voidThreeVoids,
          }),
        ]
      : []),
  ];
  return { info: { isVoid: true, borrowedFrom: { branch: opposite.branch, role: opposite.role }, borrowedStars }, findings };
}

function lifeStageAnalysis(palace: Palace): { readonly info?: LifeStageStarInfo; readonly findings: readonly Finding[] } {
  const ringStar = palace.stars.find((star) => star.group === "vòng Tràng Sinh");
  const preference = ringStar ? LIFE_STAGE_STAR_PREFERENCES[ringStar.name] : undefined;
  if (!ringStar || !preference) return { findings: [] };
  const favoredHere = preference.favored.includes(palace.role) || preference.favored.includes("mọi cung");
  const avoidedHere = preference.avoided.filter((item) => item.label === palace.role);
  const info: LifeStageStarInfo = {
    star: ringStar.name,
    favoredHere,
    favored: preference.favored,
    avoidedHere,
    ...(preference.note ? { note: preference.note } : {}),
  };
  const polarity: Polarity = avoidedHere.length ? "xấu" : preference.favored.includes(palace.role) ? "tốt" : "trung tính";
  return {
    info,
    findings: [
      finding({
        id: "trang_sinh_cung",
        name: `${ringStar.name} ở ${palace.role}`,
        polarity,
        certainty: "interpretive",
        summary: [
          `${ringStar.name} (vòng Tràng Sinh) tại ${palaceTag(palace)}.`,
          preference.favored.length ? `Ưa: ${preference.favored.join(", ")}.` : "",
          avoidedHere.length ? `Kỵ ở cung này: ${avoidedHere.map((item) => `${item.source}`).join(", ")}.` : "",
          preference.note ?? "",
        ]
          .filter(Boolean)
          .join(" "),
        assumptions: ["các sách trái nhau; liệt kê theo từng nguồn, không gộp thành một kết luận"],
        source: "MLTC tr.802–804; NP1 tr.104–109; NP2 tr.52–57; TVTH tr.68–70",
        kbFile: KB.lifeStage,
      }),
    ],
  };
}

function elementFindings(analysis: readonly MainStarAnalysis[], palace: Palace): readonly Finding[] {
  return analysis
    .filter((star) => star.elementFit.fit === "lạc hãm theo ngũ hành")
    .map((star) =>
      finding({
        id: "ngu_hanh_sao_cung",
        name: `${star.name} bị cung khắc`,
        polarity: star.elementFit.modifiers.some((text) => text.startsWith("hóa tốt")) ? "trung tính" : "xấu",
        certainty: "interpretive",
        summary: `${star.name} (${star.elementFit.element?.element}) ở ${palaceTag(palace)} hành ${star.elementFit.palaceElement}: cung khắc sao, lạc hãm theo ngũ hành${star.elementFit.modifiers.length ? `; ${star.elementFit.modifiers.join("; ")}` : ""}. Độ sáng theo bảng miếu hãm vẫn là ${star.brightness ?? "không ghi"}.`,
        assumptions: ["bảng miếu hãm của lá số là căn cứ chính, phép ngũ hành chỉ ghi kèm"],
        variants: ["MLTC tr.77–91: các nhà cải cách không luận theo ngũ hành của sao", ...(star.elementFit.element?.variants ?? [])],
        source: "TVTH tr.100–101 mục VI.2; TVTH tr.7–8",
        kbFile: KB.starPalace,
      }),
    );
}

export function analyzePalaceAt(chart: Chart, branch: number, options: AnalysisOptions = DEFAULT_ANALYSIS_OPTIONS): PalaceAnalysis {
  const palace = palaceAt(chart, branch);
  const group = threeSidesOf(chart, branch);
  const hasVoidStar = hasStarIn(palace, "Tuần") || hasStarIn(palace, "Triệt");
  const names = mainNames(palace);
  const mainStars: readonly MainStarAnalysis[] = mainSummaries(palace).map((star) => ({
    ...star,
    elementFit: elementFitOfStar(
      star.name,
      branch,
      names.filter((other) => other !== star.name),
      hasVoidStar,
      options,
    ),
  }));
  const flank = flankFindings(chart, palace);
  const tuanTriet = tuanTrietAnalysis(palace, options);
  const voidResult = voidAnalysis(chart, palace);
  const lifeStage = lifeStageAnalysis(palace);
  const element = branchElement(branch);
  return {
    branch: palace.branch,
    branchName: branchName(palace.branch),
    stemBranch: `${stemName(palace.stem)} ${branchName(palace.branch)}`,
    role: palace.role,
    isBodyPalace: palace.isBodyPalace,
    element,
    natalElement: chart.natalNayin.element,
    palaceVersusNatal: elementRelation(element, chart.natalNayin.element),
    mainStars,
    threeSides: { self: sideOf(group.self), trines: [sideOf(group.trines[0]), sideOf(group.trines[1])], opposite: sideOf(group.opposite) },
    flanking: { before: partnerOf(chart, palaceAt(chart, branch - 1).branch), after: partnerOf(chart, palaceAt(chart, branch + 1).branch), matches: flank.matches },
    sixCombination: partnerOf(chart, sixCombinationPartner(branch)),
    sixHarm: partnerOf(chart, sixHarmPartner(branch)),
    clash: partnerOf(chart, clashPartner(branch)),
    tuanTriet: tuanTriet.info,
    voidInfo: voidResult.info,
    ...(lifeStage.info ? { lifeStageStar: lifeStage.info } : {}),
    options,
    findings: [
      ...threeSidesFindings(chart, palace),
      ...flank.findings,
      ...partnerFindings(chart, palace),
      ...tuanTriet.findings,
      ...voidResult.findings,
      ...lifeStage.findings,
      ...elementFindings(mainStars, palace),
    ],
  };
}

export const analyzePalace = (chart: Chart, branch: number | string, options: AnalysisOptions = DEFAULT_ANALYSIS_OPTIONS): Result<PalaceAnalysis> =>
  mapResult(resolveBranch(branch), (resolved) => analyzePalaceAt(chart, resolved, options));

const sideLine = (label: string, side: SidePalace): string =>
  `- ${label}: ${side.role} (${branchName(side.branch)}) — ${side.mainStars.map(formatSummary).join(", ") || "vô chính diệu"}${side.stars.length ? `; ${side.stars.join(", ")}` : ""}`;

export function renderPalaceAnalysis(analysis: PalaceAnalysis): string {
  const mains = analysis.mainStars.length
    ? analysis.mainStars.map((star) => {
        const element = star.elementFit.element ? `${star.elementFit.element.element}` : "không rõ hành";
        const fit = star.elementFit.fit ?? "không xét";
        return `- ${formatSummary(star)} · hành ${element} · với cung ${analysis.element}: ${fit}${star.elementFit.modifiers.length ? ` (${star.elementFit.modifiers.join("; ")})` : ""}`;
      })
    : ["- Vô chính diệu"];
  return [
    `## Cung ${analysis.role}${analysis.isBodyPalace ? " (Thân)" : ""} · ${analysis.stemBranch}`,
    `- Hành cung: ${analysis.element} · bản mệnh: ${analysis.natalElement} · ${analysis.palaceVersusNatal.description}`,
    `- Nhị hợp: ${analysis.sixCombination.role} (${branchName(analysis.sixCombination.branch)}) · Lục hại: ${analysis.sixHarm.role} (${branchName(analysis.sixHarm.branch)}) · Xung chiếu: ${analysis.clash.role} (${branchName(analysis.clash.branch)})`,
    `- Kẹp bởi: ${analysis.flanking.before.role} (${branchName(analysis.flanking.before.branch)}) và ${analysis.flanking.after.role} (${branchName(analysis.flanking.after.branch)})`,
    ...(analysis.lifeStageStar ? [`- Vòng Tràng Sinh: ${analysis.lifeStageStar.star}`] : []),
    ...(analysis.voidInfo.isVoid
      ? [`- Vô chính diệu, mượn ${analysis.voidInfo.borrowedFrom?.role}: ${analysis.voidInfo.borrowedStars.map(formatSummary).join(", ") || "không có"}`]
      : []),
    "",
    "### Chính tinh",
    ...mains,
    "",
    "### Tam phương tứ chính",
    sideLine("Bản cung", analysis.threeSides.self),
    sideLine("Tam hợp", analysis.threeSides.trines[0]),
    sideLine("Tam hợp", analysis.threeSides.trines[1]),
    sideLine("Xung chiếu", analysis.threeSides.opposite),
    "",
    "### Nhận định",
    ...analysis.findings.map(renderFinding),
  ].join("\n");
}
