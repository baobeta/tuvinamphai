import { bodyPalace, findStar, hasStarIn, lifePalace, mainStarsIn, palaceAt, palaceByRole } from "../analysis/chart-query.js";
import { formatSummary, palaceTag, summarizeStar } from "../analysis/analysis-helpers.js";
import { finding, type Finding, type Polarity } from "../analysis/finding.js";
import { elementRelation, stemElement, type ElementRelationKind } from "../calendar/five-elements.js";
import { branchRelations, clashPartner, flankingPalaces, stemCombination, type BranchRelationKind } from "../calendar/relations.js";
import { branchName, mod, stemBranchName, stemName } from "../calendar/stem-branch.js";
import { TRANSFORMATION_ORDER, transformationStars } from "../chart/transformations.js";
import type { Chart, Palace, Transformation } from "../chart/types.js";
import { err, ok, type Result } from "../result.js";
import {
  BUREAU_TEMPERAMENT_MLTC,
  KB_FILES,
  RELATIONSHIP_RULES,
  SKIPPED_COMPARE_RULES,
  SOURCES,
  stemBreakTarget,
  type Relationship,
  type RelationshipRule,
  type SkippedRule,
} from "./rules.js";

export interface CompareOptions {
  readonly relationship: Relationship;
  readonly labels: readonly [string, string];
}

export const DEFAULT_COMPARE_OPTIONS: CompareOptions = { relationship: "spouse", labels: ["A", "B"] };

export interface PersonSummary {
  readonly label: string;
  readonly gender: Chart["parameters"]["gender"];
  readonly year: string;
  readonly nayin: string;
  readonly lifePalace: string;
  readonly bureau: string;
}

export interface ChartComparison {
  readonly people: readonly [PersonSummary, PersonSummary];
  readonly relationship: RelationshipRule;
  readonly findings: readonly Finding[];
  readonly notes: readonly string[];
  readonly skipped: readonly SkippedRule[];
}

interface Person {
  readonly label: string;
  readonly chart: Chart;
}

const yearOf = (person: Person) => person.chart.parameters.year;

const tagged = (person: Person, text: string): string => `${text} (${person.label})`;

const isTrineOf = (branch: number, center: number): boolean => mod(branch - center, 12) === 4 || mod(branch - center, 12) === 8;

const mainNamesOf = (palaces: readonly Palace[]): readonly string[] => [...new Set(palaces.flatMap((palace) => mainStarsIn(palace).map((star) => star.name)))];

const describePalace = (palace: Palace): string => {
  const mains = mainStarsIn(palace).map((star) => formatSummary(summarizeStar(star)));
  return `${palaceTag(palace)}: ${mains.length ? mains.join(", ") : "vô chính diệu"}`;
};

const sameSet = (left: readonly string[], right: readonly string[]): boolean =>
  left.length > 0 && left.length === right.length && left.every((name) => right.includes(name));

const tamPhuong = (chart: Chart, branch: number): readonly Palace[] => [palaceAt(chart, branch), palaceAt(chart, branch + 4), palaceAt(chart, branch + 8)];

function stemFindings(first: Person, second: Person): readonly Finding[] {
  const a = yearOf(first).stem;
  const b = yearOf(second).stem;
  const pair = `${tagged(first, stemName(a))} – ${tagged(second, stemName(b))}`;
  const results: Finding[] = [];
  if (stemCombination(a).partner === b) {
    results.push(
      finding({
        id: "can-hop",
        name: "Can năm hợp",
        polarity: "tốt",
        certainty: "exact",
        summary: `${pair}: ${stemName(a)} hợp ${stemName(b)} hóa ${stemCombination(a).element}`,
        assumptions: ["Xếp vào nhóm 'hợp' theo tên quan hệ; TVTH chỉ định nghĩa can hợp, không luận riêng cho hai tuổi"],
        variants: [
          `Theo hành của can thì ${stemName(a)} (${stemElement(a)}) và ${stemName(b)} (${stemElement(b)}) khắc nhau; NP2 tr.59–63 không nói cặp can hợp có tính là "can khắc" hay không, nên ở đây không xếp vào can khắc`,
        ],
        source: SOURCES.stemCombination,
        kbFile: KB_FILES.stems,
      }),
    );
  }
  const breaker = stemBreakTarget(a) === b ? first : stemBreakTarget(b) === a ? second : null;
  if (breaker) {
    const target = breaker === first ? second : first;
    results.push(
      finding({
        id: "can-pha",
        name: "Can năm phá (khắc)",
        polarity: "xấu",
        certainty: "exact",
        summary: `${tagged(breaker, stemName(yearOf(breaker).stem))} phá ${tagged(target, stemName(yearOf(target).stem))}`,
        assumptions: ["Xếp vào nhóm 'xung' theo tên quan hệ; TVTH chỉ liệt kê cặp can phá"],
        source: SOURCES.stemBreak,
        kbFile: KB_FILES.stems,
      }),
    );
  }
  if (a === b) {
    results.push(
      finding({
        id: "can-dong",
        name: "Cùng can năm",
        polarity: "trung tính",
        certainty: "exact",
        summary: `Cả hai cùng can ${stemName(a)}`,
        source: SOURCES.stemCombination,
        kbFile: KB_FILES.stems,
      }),
    );
  }
  return results;
}

const BRANCH_POLARITY: Readonly<Record<BranchRelationKind, Polarity>> = {
  "tam hợp": "tốt",
  "lục hợp": "tốt",
  "lục xung": "xấu",
  "lục hại": "xấu",
  "đồng cung": "trung tính",
  "cùng nhóm tứ hành xung": "trung tính",
};

function branchFindings(first: Person, second: Person): readonly Finding[] {
  const a = yearOf(first).branch;
  const b = yearOf(second).branch;
  const relations = branchRelations(a, b);
  if (relations.length === 0) {
    return [
      finding({
        id: "chi-khong-quan-he",
        name: "Chi năm",
        polarity: "trung tính",
        certainty: "exact",
        summary: `${tagged(first, branchName(a))} – ${tagged(second, branchName(b))}: không tam hợp, lục hợp, xung, hại, không cùng nhóm tứ sinh/tứ mộ/tứ tuyệt`,
        source: SOURCES.branch,
        kbFile: KB_FILES.branches,
      }),
    ];
  }
  return relations.map((relation) =>
    finding({
      id: `chi-${relation.kind.replaceAll(" ", "-")}`,
      name: `Chi năm: ${relation.kind}`,
      polarity: BRANCH_POLARITY[relation.kind],
      certainty: relation.kind === "lục hại" ? "interpretive" : "exact",
      summary: `${relation.description} (${first.label} – ${second.label})`,
      assumptions:
        relation.kind === "cùng nhóm tứ hành xung"
          ? ["Kho tri thức chỉ chia nhóm tứ sinh, tứ mộ, tứ tuyệt theo vòng Tràng Sinh, không nói hai tuổi cùng nhóm là xung; xung thật chỉ là cặp đối cung"]
          : relation.kind === "lục hại"
            ? [
                "Kho tri thức không có bảng lục hại đầy đủ (NP1 tr.1–7 chỉ cho vài ví dụ); cặp lục hại ở đây theo quy luật tổng chi bằng 7 (Tý–Mùi, Sửu–Ngọ…)",
                "Xếp nhóm theo tên quan hệ; sách không luận lục hại giữa hai tuổi",
              ]
            : ["Xếp nhóm theo tên quan hệ; TVTH, MLTC định nghĩa quan hệ giữa các chi, không luận riêng cho hai tuổi"],
      source: relation.source || SOURCES.branch,
      kbFile: KB_FILES.branches,
    }),
  );
}

const ELEMENT_POLARITY: Readonly<Record<ElementRelationKind, Polarity>> = {
  "đồng hành": "trung tính",
  sinh: "tốt",
  "được sinh": "tốt",
  khắc: "xấu",
  "bị khắc": "xấu",
};

function nayinFinding(first: Person, second: Person): Finding {
  const a = first.chart.natalNayin;
  const b = second.chart.natalNayin;
  const forward = elementRelation(a.element, b.element);
  const backward = elementRelation(b.element, a.element);
  return finding({
    id: "nap-am",
    name: "Nạp âm năm sinh",
    polarity: ELEMENT_POLARITY[forward.kind],
    certainty: "exact",
    summary:
      `${tagged(first, a.name)} – ${tagged(second, b.name)}. ` +
      `Từ ${first.label}: ${forward.description}; từ ${second.label}: ${backward.description}`,
    assumptions: ["Xếp nhóm theo sinh (hợp), khắc (xung), đồng hành (trung tính); NP2 dùng nạp âm để tính hợp tuổi vợ chồng"],
    source: SOURCES.nayin,
    kbFile: KB_FILES.nayin,
  });
}

function spouseAgeFindings(husband: Person, wife: Person): readonly Finding[] {
  const results: Finding[] = [];
  const husbandStem = yearOf(husband).stem;
  const wifeStem = yearOf(wife).stem;
  const isCombinationPair = stemCombination(husbandStem).partner === wifeStem;
  const stemKinds = elementRelation(stemElement(husbandStem), stemElement(wifeStem)).kind;
  if (!isCombinationPair && (stemKinds === "khắc" || stemKinds === "bị khắc")) {
    const [breaker, target] = stemKinds === "khắc" ? [husband, wife] : [wife, husband];
    const isBreakPair = stemBreakTarget(yearOf(breaker).stem) === yearOf(target).stem;
    results.push(
      finding({
        id: "np2-can-khac",
        name: "NP2: thiên can vợ chồng khắc nhau (xấu nhất)",
        polarity: "xấu",
        certainty: "interpretive",
        summary:
          `Can ${tagged(breaker, stemName(yearOf(breaker).stem))} ${isBreakPair ? "phá" : "khắc"} can ${tagged(target, stemName(yearOf(target).stem))} ` +
          `(${breaker === husband ? "chồng khắc vợ" : "vợ khắc chồng"}). NP2: "Thiên can: khắc cách xấu nhất"`,
        assumptions: [
          "'Can khắc' của NP2 hiểu là can phá TVTH tr.6–8: cả hai ví dụ NP2 (Đinh phá Tân, Quý khắc Đinh) đều là cặp can phá; cặp can hợp không tính",
          ...(isBreakPair ? [] : ["Cặp này khắc theo hành của can nhưng không nằm trong bảng can phá TVTH tr.6–8, nên càng là cách hiểu rộng"]),
        ],
        variants: [
          "NP2 ví dụ 1: vợ Quý khắc chồng Đinh thì 'vứt đi'; ví dụ 2: chồng Đinh khắc vợ Tân mà vẫn 'tàm tạm' — chiều khắc có vẻ quan trọng",
          "Bản OCR NP2 ghi cả 'Chồng khắc vợ: xấu thứ 3' và 'Chồng phải khắc vợ' ở mục Đẹp",
        ],
        source: SOURCES.spouseAge,
        kbFile: KB_FILES.marriageExamples,
      }),
    );
  }
  if (clashPartner(yearOf(husband).branch) === yearOf(wife).branch) {
    results.push(
      finding({
        id: "np2-chi-xung",
        name: "NP2: địa chi vợ chồng xung",
        polarity: "xấu",
        certainty: "exact",
        summary: `${tagged(husband, branchName(yearOf(husband).branch))} xung ${tagged(wife, branchName(yearOf(wife).branch))}. NP2 xếp "Địa chi: xung" cùng mục với can khắc`,
        source: SOURCES.spouseAge,
        kbFile: KB_FILES.marriage,
      }),
    );
  }
  const husbandNayin = husband.chart.natalNayin;
  const wifeNayin = wife.chart.natalNayin;
  const fromWife = elementRelation(wifeNayin.element, husbandNayin.element);
  const nayinPair = `${tagged(wife, wifeNayin.name)}, ${tagged(husband, husbandNayin.name)}`;
  const nayinAssumption = "Xét theo hành nạp âm năm sinh: NP2 ghi 'khi tính tuổi vợ chồng hợp nhau hay không chỉ tính tuổi theo nạp âm'";
  if (fromWife.kind === "khắc") {
    results.push(
      finding({
        id: "np2-am-khac-duong",
        name: "NP2: âm khắc dương (xấu thứ 2)",
        polarity: "xấu",
        certainty: "interpretive",
        summary: `Nạp âm vợ khắc nạp âm chồng: ${nayinPair}. NP2: "Âm tối kỵ khắc Dương: xấu thứ 2"`,
        assumptions: ["'Âm' hiểu là vợ, 'Dương' là chồng", nayinAssumption],
        variants: ["Nếu 'âm, dương' là âm dương của năm sinh thì cần đọc lại; bản OCR không nói rõ"],
        source: SOURCES.spouseAge,
        kbFile: KB_FILES.marriage,
      }),
    );
  } else if (fromWife.kind === "bị khắc") {
    results.push(
      finding({
        id: "np2-chong-khac-vo",
        name: "NP2: chồng khắc vợ (xấu thứ 3)",
        polarity: "xấu",
        certainty: "interpretive",
        summary: `Nạp âm chồng khắc nạp âm vợ: ${nayinPair}. NP2: "Chồng khắc vợ: xấu thứ 3"`,
        assumptions: [nayinAssumption],
        variants: [
          "Bản OCR NP2 cũng ghi 'Chồng phải khắc vợ' dưới mục Đẹp; hai dòng mâu thuẫn",
          ...(wifeNayin.element === "Kim" && husbandNayin.element === "Hỏa"
            ? ["NP2 ví dụ 1 (vợ Quý Mão Kim, chồng Đinh Mão Hỏa) viết 'Kim khắc Hỏa', tức đọc là vợ khắc chồng (âm khắc dương, xấu thứ 2); theo tương khắc TVTH tr.8–9 thì Hỏa khắc Kim, nên câu sách có lẽ là lỗi chép"]
            : []),
        ],
        source: SOURCES.spouseAge,
        kbFile: KB_FILES.marriage,
      }),
    );
  } else if (fromWife.kind === "sinh") {
    results.push(
      finding({
        id: "np2-vo-sinh-chong",
        name: "NP2: vợ sinh chồng (đẹp)",
        polarity: "tốt",
        certainty: "interpretive",
        summary: `Nạp âm vợ sinh nạp âm chồng: ${nayinPair}. NP2: "Đẹp: vợ sinh cho chồng"`,
        assumptions: [nayinAssumption],
        source: SOURCES.spouseAge,
        kbFile: KB_FILES.marriage,
      }),
    );
  } else {
    results.push(
      finding({
        id: "np2-nap-am-khac",
        name: "NP2: nạp âm vợ chồng không thuộc mục nào",
        polarity: "trung tính",
        certainty: "interpretive",
        summary: `${fromWife.description} (${nayinPair}); NP2 không xếp loại trường hợp ${fromWife.kind === "đồng hành" ? "đồng hành" : "chồng sinh vợ"}`,
        assumptions: [nayinAssumption],
        variants: fromWife.kind === "được sinh" ? ["NP2 ví dụ 2: chồng Hỏa sinh vợ Thổ được ghi 'tạm'"] : [],
        source: SOURCES.spouseAge,
        kbFile: KB_FILES.marriageExamples,
      }),
    );
  }
  return results;
}

function starSystemFinding(owner: Person, other: Person): Finding {
  const spousePalace = palaceByRole(owner.chart, "Phu Thê");
  const spouseMains = mainNamesOf([spousePalace]);
  const otherCore = [lifePalace(other.chart), bodyPalace(other.chart)].filter((palace, i, all) => all.findIndex((item) => item.branch === palace.branch) === i);
  const otherCoreMains = mainNamesOf(otherCore);
  const direct = spouseMains.filter((name) => otherCoreMains.includes(name));
  const spouseSystem = mainNamesOf(tamPhuong(owner.chart, spousePalace.branch));
  const lifeSystem = mainNamesOf(tamPhuong(other.chart, other.chart.parameters.lifePalace));
  const bodySystem = mainNamesOf(tamPhuong(other.chart, other.chart.parameters.bodyPalace));
  const systemMatch = sameSet(spouseSystem, lifeSystem) || sameSet(spouseSystem, bodySystem);
  const matched = direct.length > 0 && systemMatch;
  const directText = `${owner.label}: ${describePalace(spousePalace)}. ${other.label} (Mệnh, Thân): ${otherCore.map(describePalace).join("; ")}`;
  return finding({
    id: `tinh-he-${owner.label}-${other.label}`,
    name: `Tinh hệ Phu Thê ${owner.label} so với Mệnh, Thân ${other.label}`,
    polarity: matched ? "tốt" : "trung tính",
    certainty: "interpretive",
    summary: matched
      ? `Khớp: hai bên "hòa hợp hơn, có thể trò chuyện, có thể cùng nhau già đi" theo MLTC. ${directText}`
      : `Không khớp. ${directText}`,
    satisfied: [
      ...(direct.length ? [`Chính tinh Phu Thê ${owner.label} có ở Mệnh/Thân ${other.label}: ${direct.join(", ")}`] : []),
      ...(systemMatch ? [`Tam phương Phu Thê ${owner.label} (${spouseSystem.join(", ")}) trùng tam phương Mệnh hoặc Thân ${other.label}`] : []),
    ],
    missing: [
      ...(spouseMains.length === 0 ? [`Phu Thê ${owner.label} vô chính diệu`] : []),
      ...(!direct.length && spouseMains.length ? [`Không chính tinh Phu Thê ${owner.label} nào ở Mệnh/Thân ${other.label}`] : []),
      ...(!systemMatch
        ? [`Tam phương Phu Thê ${owner.label}: ${spouseSystem.join(", ") || "không chính tinh"}; tam phương Mệnh ${other.label}: ${lifeSystem.join(", ") || "không chính tinh"}; tam phương Thân ${other.label}: ${bodySystem.join(", ") || "không chính tinh"}`]
        : []),
    ],
    assumptions: [
      "'Các ngôi sao trong cung Phu Thê' hiểu là chính tinh",
      "'Tinh hệ tam phương hoàn toàn phù hợp' hiểu là cùng tập chính tinh trong cung và hai cung tam hợp",
      "Quy tắc (1) cần đủ hai vế: chính tinh Phu Thê một bên là chính tinh Mệnh hoặc Thân bên kia, và tinh hệ tam phương hai cung đó trùng nhau (vế sau hiểu theo ví dụ 'Sát Phá Lang cách' của MLTC); Phu Thê vô chính diệu không khớp",
    ],
    variants: matched ? [] : ["MLTC (2): tinh hệ khác nhau không nhất thiết là không hợp, tùy một bên có bao dung hay không"],
    source: SOURCES.starSystems,
    kbFile: KB_FILES.marriage,
  });
}

function bureauFinding(first: Person, second: Person): Finding {
  const a = first.chart.parameters.bureau;
  const b = second.chart.parameters.bureau;
  return finding({
    id: "ngu-hanh-cuc",
    name: "Ngũ hành cục hai bên",
    polarity: "trung tính",
    certainty: "exact",
    summary:
      `${a.name === b.name ? "Cùng cục" : "Khác cục"}: ${tagged(first, a.name)} — ${BUREAU_TEMPERAMENT_MLTC[a.element]}; ` +
      `${tagged(second, b.name)} — ${BUREAU_TEMPERAMENT_MLTC[b.element]}. MLTC: "mối quan hệ giữa ngũ hành cục và hôn nhân thường không được xem trọng"`,
    source: SOURCES.bureau,
    kbFile: KB_FILES.marriage,
  });
}

const PROJECTION_READING: Readonly<Partial<Record<Transformation, { readonly polarity: Polarity; readonly text: string }>>> = {
  "Hóa Lộc": { polarity: "tốt", text: "tình cảm tốt" },
  "Hóa Quyền": { polarity: "trung tính", text: "chi phối lẫn nhau" },
  "Hóa Kỵ": { polarity: "xấu", text: "tình cảm không tốt hoặc bất lợi" },
};

function projectionFindings(host: Person, guest: Person, rule: RelationshipRule): readonly Finding[] {
  const chart = host.chart;
  const life = chart.parameters.lifePalace;
  const guestYear = yearOf(guest);
  const prefix = `nhap-que-${guest.label}-${host.label}`;
  const title = `Thái Tuế nhập quẻ ${guest.label} → lá số ${host.label}`;
  const stars = transformationStars(guestYear.stem, chart.options);
  const placements = stars.map((star, i) => ({ transformation: TRANSFORMATION_ORDER[i]!, star, palace: findStar(chart, star)?.palace }));
  const placementText = placements
    .map(({ transformation, star, palace }) => `${star} ${transformation} ở ${palace === undefined ? "không tìm thấy" : palaceTag(palaceAt(chart, palace))}`)
    .join("; ");
  const stemVariant = [
    ...(guestYear.stem === 6 || guestYear.stem === 8 ? [`Can ${stemName(guestYear.stem)} có dị bản tứ hóa; dùng lựa chọn dị bản của lá số ${host.label}`] : []),
    ...(guestYear.stem === 4 ? ["Can Mậu: Hóa Khoa ở Hữu Bật theo TVTH và MLTC bảng 15; MLTC phần luận can Mậu có chỗ ghi Tả Phù"] : []),
    ...(guestYear.stem === 7 ? ["Can Tân: Hóa Lộc ở Cự Môn; bài thơ TVTH in \"Vũ\" là lỗi in"] : []),
  ];
  const results: Finding[] = [
    finding({
      id: `${prefix}-tu-hoa`,
      name: `${title}: tứ hóa can ${stemName(guestYear.stem)}`,
      polarity: "trung tính",
      certainty: "exact",
      summary: placementText,
      variants: stemVariant,
      source: SOURCES.projection,
      kbFile: KB_FILES.projection,
    }),
  ];
  const palaceOf = (transformation: Transformation) => placements.find((item) => item.transformation === transformation);
  const loc = palaceOf("Hóa Lộc");
  if (loc?.palace !== undefined) {
    const where = loc.palace === life ? "vào cung Mệnh" : isTrineOf(loc.palace, life) ? "vào tam hợp cung Mệnh" : null;
    if (where) {
      results.push(
        finding({
          id: `${prefix}-loc-menh`,
          name: `${title}: Hóa Lộc ${where}`,
          polarity: "tốt",
          certainty: "exact",
          summary: `${loc.star} Hóa Lộc (can ${stemName(guestYear.stem)} của ${guest.label}) ${where} ${host.label}: ${guest.label} giúp ích ${host.label} mà không đòi đền đáp`,
          source: SOURCES.projection,
          kbFile: KB_FILES.projection,
        }),
      );
    }
    const [before, after] = flankingPalaces(life);
    const otherFlank = loc.palace === before ? after : loc.palace === after ? before : null;
    if (otherFlank !== null) {
      const otherPalace = palaceAt(chart, otherFlank);
      const partner = hasStarIn(otherPalace, "Lộc Tồn") ? "Lộc Tồn" : hasStarIn(otherPalace, "Hóa Lộc") ? "Hóa Lộc gốc" : null;
      if (partner) {
        results.push(
          finding({
            id: `${prefix}-song-loc-giap-menh`,
            name: `${title}: Song Lộc giáp Mệnh`,
            polarity: "tốt",
            certainty: "interpretive",
            summary: `${loc.star} Hóa Lộc của ${guest.label} ở ${palaceTag(palaceAt(chart, loc.palace))}, ${partner} của ${host.label} ở ${palaceTag(otherPalace)}: ${guest.label} giúp ích mà không đòi đền đáp`,
            assumptions: ["'Song Lộc giáp Mệnh' hiểu là Hóa Lộc của đối phương và Lộc Tồn (hoặc Hóa Lộc gốc) ở hai cung kề Mệnh"],
            source: SOURCES.projection,
            kbFile: KB_FILES.projection,
          }),
        );
      }
    }
  }
  const ky = palaceOf("Hóa Kỵ");
  if (ky?.palace === life) {
    results.push(
      finding({
        id: `${prefix}-ky-menh`,
        name: `${title}: Hóa Kỵ vào cung Mệnh`,
        polarity: "xấu",
        certainty: "exact",
        summary: `${ky.star} Hóa Kỵ (can ${stemName(guestYear.stem)} của ${guest.label}) vào Mệnh ${host.label}: ${guest.label} không có lợi, thậm chí cản trở`,
        source: SOURCES.projection,
        kbFile: KB_FILES.projection,
      }),
    );
  }
  const relationPalace = palaceByRole(chart, rule.palace);
  for (const placement of placements) {
    const reading = PROJECTION_READING[placement.transformation];
    if (!reading || placement.palace === undefined) continue;
    const offset = mod(placement.palace - relationPalace.branch, 12);
    const where = offset === 0 ? "tại" : offset === 4 || offset === 8 || offset === 6 ? "hội chiếu" : null;
    if (!where) continue;
    results.push(
      finding({
        id: `${prefix}-${placement.transformation.replace("Hóa ", "").toLowerCase()}-${rule.palace.replace(" ", "-").toLowerCase()}`,
        name: `${title}: ${placement.transformation} ${where} cung ${rule.palace}`,
        polarity: reading.polarity,
        certainty: "interpretive",
        summary: `${placement.star} ${placement.transformation} ở ${palaceTag(palaceAt(chart, placement.palace))}, ${where} cung ${rule.palace} (${rule.label}): ${reading.text}`,
        assumptions: [
          "'Tác động mạnh' hiểu là nằm tại cung hoặc hội chiếu từ tam phương tứ chính; sách không định nghĩa 'mạnh'",
          ...(rule.certainty === "interpretive" ? [rule.note] : []),
        ],
        source: SOURCES.projection,
        kbFile: KB_FILES.projection,
      }),
    );
  }
  const branchPalace = palaceAt(chart, guestYear.branch);
  const branchOffset = mod(guestYear.branch - life, 12);
  const sameSide = branchOffset === 0 || branchOffset === 4 || branchOffset === 8;
  const relationText = branchOffset === 0 ? "trùng cung Mệnh" : sameSide ? "tam hợp cung Mệnh" : branchOffset === 6 ? "đối cung (xung chiếu) Mệnh" : "ngoài tam phương tứ chính Mệnh";
  results.push(
    finding({
      id: `${prefix}-chi`,
      name: `${title}: cung chi ${branchName(guestYear.branch)}`,
      polarity: "trung tính",
      certainty: branchOffset === 6 ? "interpretive" : "exact",
      summary:
        `Chi năm sinh ${branchName(guestYear.branch)} của ${guest.label} rơi vào ${describePalace(branchPalace)} của ${host.label}, ${relationText}` +
        (sameSide ? ": hai người có tính cách giống nhau" : ""),
      assumptions: branchOffset === 6 ? ["MLTC chỉ nói cung nằm trong tam phương với Mệnh thì tính cách giống nhau; đối cung không được nhắc"] : [],
      variants: branchOffset === 6 ? ["Nếu hiểu 'tam phương' gồm cả đối cung (tam phương tứ chính) thì cũng là tính cách giống nhau"] : [],
      source: SOURCES.projection,
      kbFile: KB_FILES.projection,
    }),
  );
  return results;
}

const summarize = (person: Person): PersonSummary => ({
  label: person.label,
  gender: person.chart.parameters.gender,
  year: stemBranchName(yearOf(person)),
  nayin: person.chart.natalNayin.name,
  lifePalace: branchName(person.chart.parameters.lifePalace),
  bureau: person.chart.parameters.bureau.name,
});

export function compareCharts(firstChart: Chart, secondChart: Chart, options: CompareOptions = DEFAULT_COMPARE_OPTIONS): Result<ChartComparison> {
  const [firstLabel, secondLabel] = options.labels;
  if (!firstLabel.trim() || !secondLabel.trim() || firstLabel === secondLabel) return err("Hai nhãn người phải khác nhau và không rỗng");
  const first: Person = { label: firstLabel, chart: firstChart };
  const second: Person = { label: secondLabel, chart: secondChart };
  const rule = RELATIONSHIP_RULES[options.relationship];
  const isSpouse = options.relationship === "spouse";
  const husband = [first, second].find((person) => person.chart.parameters.gender === "nam");
  const wife = [first, second].find((person) => person.chart.parameters.gender === "nữ");
  const spousePair = isSpouse && husband && wife ? { husband, wife } : null;
  const notes = [
    ...(isSpouse && !spousePair ? ["Quy tắc hợp tuổi vợ chồng của NP2 tr.59–63 cần một nam một nữ; bỏ qua"] : []),
    ...(!isSpouse ? ["Quy tắc hợp tuổi, tinh hệ và ngũ hành cục của NP2 và MLTC tr.903–944 chỉ dành cho vợ chồng; bỏ qua"] : []),
  ];
  const findings: readonly Finding[] = [
    ...stemFindings(first, second),
    ...branchFindings(first, second),
    nayinFinding(first, second),
    ...(spousePair ? spouseAgeFindings(spousePair.husband, spousePair.wife) : []),
    ...(isSpouse ? [starSystemFinding(first, second), starSystemFinding(second, first), bureauFinding(first, second)] : []),
    ...projectionFindings(first, second, rule),
    ...projectionFindings(second, first, rule),
  ];
  return ok({ people: [summarize(first), summarize(second)], relationship: rule, findings, notes, skipped: SKIPPED_COMPARE_RULES });
}
