import type { Certainty, Polarity } from "../analysis/finding.js";
import { MAIN_STARS } from "../analysis/chart-query.js";
import { branchName, mod, stemName } from "../calendar/stem-branch.js";
import type { PalaceRole } from "../chart/palaces.js";
import type { Transformation } from "../chart/types.js";
import {
  hasMainStar,
  palaceText,
  placementText,
  resolveTarget,
  scopePalaces,
  targetLabel,
  tokenPlacements,
  type TokenPlacement,
  type YearContext,
} from "./context.js";
import { decadeHit, hitIf, splitByScale, type HitOutcome, type TriggerDefinition } from "./criterion.js";
import type { Goal, PalaceScope, PalaceTarget } from "./types.js";

const KB = "10_Van-han/07_Han-theo-su-viec";
const MARRIAGE_FILE = `${KB}/02_Han-hon-nhan.md`;
const PROSPERITY_FILE = `${KB}/01_Han-phat-dat.md`;
const CHILD_FILE = `${KB}/03_Han-sinh-con.md`;
const ACCIDENT_FILE = `${KB}/05_Han-tai-nan-benh-tat.md`;
const EXAM_FILE = `${KB}/07_Han-thi-cu-thang-chuc.md`;
const FLOWING_LOC_FILE = "10_Van-han/04_Luu-nien/02_Luu-Loc-Kinh-Da.md";
const FLOWING_TUE_FILE = "10_Van-han/04_Luu-nien/01_Luu-Thai-Tue-Tang-Ho.md";

const SCOPE_ASSUMPTION =
  "\"Có/gặp\" hiểu là các sao nằm trong tam phương tứ chính của cung hạn (A-GAP-SCOPE). Ví dụ trong kho chỉ xét tam hợp, nhưng khi đó các cặp luôn xung chiếu nhau (Hồng Loan – Thiên Hỷ, Đế Vượng – Thai) không bao giờ hội đủ, nên tính cả xung chiếu.";
const NATAL_AND_FLOWING_ASSUMPTION =
  "Sách không phân biệt sao gốc và sao lưu; tính cả sao gốc và sao lưu niên có cách an (Lộc Tồn, Thiên Mã, Kình, Đà, Tang, Hổ, Khốc, Hư, Tứ Hóa can năm xem).";
const LOC_ASSUMPTION = "\"Lộc\" là Lộc Tồn hoặc Hóa Lộc.";
const MAIN_GROUP_ASSUMPTION = "Bộ chính tinh đầu câu (ví dụ \"Tử Phủ Vũ Tướng\") hiểu là cung hạn có ít nhất một sao của bộ tọa thủ.";
const NO_BREAKERS_ASSUMPTION = "Chưa xét sát tinh phá cách và tỷ lệ cát/hung 2/3 (TVTH tr.140).";
const MLTC_FRAME_ASSUMPTION = "MLTC không ghi rõ tầng cung; các cung chức đếm theo 12 cung Lưu niên (Mệnh lưu niên = cung chi năm xem).";
const NATAL_FRAME_ASSUMPTION = "Bài giảng không ghi tầng cung; cung chức lấy theo bản mệnh.";

type Slot = readonly (readonly string[])[];
const req = (name: string): Slot => [[name]];
const oneOf = (...names: readonly string[]): Slot => names.map((name) => [name]);
const groups = (...alternatives: readonly (readonly string[])[]): Slot => alternatives;

interface StarSetRule {
  readonly id: string;
  readonly name: string;
  readonly goals: readonly Goal[];
  readonly polarity: Polarity;
  readonly source: string;
  readonly kbFile: string;
  readonly anchors: readonly PalaceTarget[];
  readonly scope: PalaceScope;
  readonly mainStars?: readonly string[];
  readonly slots: readonly Slot[];
  readonly assumptions?: readonly string[];
}

function slotPlacements(ctx: YearContext, slot: Slot, palaces: readonly number[]): readonly TokenPlacement[] | null {
  for (const alternative of slot) {
    const found = alternative.map((token) => tokenPlacements(ctx, token, true).find((placement) => palaces.includes(placement.palace)));
    if (found.every((placement) => placement !== undefined)) return found as readonly TokenPlacement[];
  }
  return null;
}

function starSetTrigger(rule: StarSetRule): TriggerDefinition {
  return {
    id: rule.id,
    name: rule.name,
    goals: rule.goals,
    polarity: rule.polarity,
    certainty: "interpretive",
    assumptions: [
      SCOPE_ASSUMPTION,
      NATAL_AND_FLOWING_ASSUMPTION,
      ...(rule.mainStars ? [MAIN_GROUP_ASSUMPTION] : []),
      ...(rule.assumptions ?? []),
      NO_BREAKERS_ASSUMPTION,
    ],
    source: rule.source,
    kbFile: rule.kbFile,
    test(ctx) {
      const matches = rule.anchors.flatMap((anchor) => {
        const branch = resolveTarget(ctx, anchor);
        if (branch === null) return [];
        const main = rule.mainStars ? hasMainStar(ctx, branch, rule.mainStars) : [];
        if (rule.mainStars && !main.length) return [];
        const palaces = scopePalaces(branch, rule.scope);
        const placements = rule.slots.map((slot) => slotPlacements(ctx, slot, palaces));
        if (placements.some((found) => found === null)) return [];
        const used = placements.flatMap((found) => found!);
        const text = `${targetLabel(anchor)} ${palaceText(ctx.chart, branch)}${main.length ? ` có ${main.join(", ")}` : ""}: ${used.map((placement) => placementText(ctx, placement)).join("; ")}`;
        return [{ text, decade: anchor.frame === "major" && used.every((placement) => !placement.flowing) }];
      });
      return splitByScale(
        matches.filter((match) => !match.decade).map((match) => match.text),
        matches.filter((match) => match.decade).map((match) => match.text),
      );
    },
  };
}

interface CustomRule {
  readonly id: string;
  readonly name: string;
  readonly goals: readonly Goal[];
  readonly polarity: Polarity;
  readonly certainty: Certainty;
  readonly source: string;
  readonly kbFile: string;
  readonly assumptions?: readonly string[];
  readonly test: (ctx: YearContext) => HitOutcome | null;
}

const customTrigger = (rule: CustomRule): TriggerDefinition => ({ ...rule, assumptions: rule.assumptions ?? [] });

const natal = (role: PalaceRole): PalaceTarget => ({ frame: "natal", role });
const yearly = (role: PalaceRole): PalaceTarget => ({ frame: "yearly", role });
const MAJOR: PalaceTarget = { frame: "major" };
const MINOR: PalaceTarget = { frame: "minor" };

const isMainStar = (name: string): boolean => (MAIN_STARS as readonly string[]).includes(name);

const transformationOf = (list: YearContext["yearlyTransformations"], kind: Transformation) =>
  list.find((item) => item.transformation === kind && item.palace !== null);

function flowingAt(ctx: YearContext, stars: readonly string[], targets: readonly PalaceTarget[]): readonly string[] {
  return targets.flatMap((target) => {
    const branch = resolveTarget(ctx, target);
    if (branch === null) return [];
    return ctx.flowing
      .filter((star) => star.palace === branch && stars.includes(star.name))
      .map((star) => `${star.name} ở ${targetLabel(target)} ${palaceText(ctx.chart, branch)}`);
  });
}

function natalStarsAt(ctx: YearContext, stars: readonly string[], palaces: readonly number[], where: string): readonly string[] {
  return stars.flatMap((star) =>
    (ctx.index.starPalaces.get(star) ?? []).filter((branch) => palaces.includes(branch)).map((branch) => `${star} ở ${palaceText(ctx.chart, branch)} (${where})`),
  );
}

const MARRIAGE_ANCHORS: readonly PalaceTarget[] = [yearly("Phu Thê"), MAJOR, MINOR];
const MARRIAGE_ANCHOR_ASSUMPTION = "\"Cung Phối năm ấy\" hiểu là Phu Thê lưu niên (đếm từ cung chi năm xem); \"Đại Tiểu hạn\" là cung đại hạn và cung tiểu hạn.";
const TVTH_MARRIAGE = "TVTH tr.138-139";

const marriageSet = (id: string, name: string, slots: readonly Slot[], extra: Partial<StarSetRule> = {}): TriggerDefinition =>
  starSetTrigger({
    id,
    name,
    goals: ["hôn nhân"],
    polarity: "tốt",
    source: TVTH_MARRIAGE,
    kbFile: MARRIAGE_FILE,
    anchors: MARRIAGE_ANCHORS,
    scope: "three-sides",
    slots,
    ...extra,
    assumptions: [MARRIAGE_ANCHOR_ASSUMPTION, ...(extra.assumptions ?? [])],
  });

const PERIOD_ANCHORS: readonly PalaceTarget[] = [MAJOR, MINOR];

const prosperitySet = (id: string, name: string, goals: readonly Goal[], mainStars: readonly string[], slots: readonly Slot[], assumptions: readonly string[] = []) =>
  starSetTrigger({ id, name, goals, polarity: "tốt", source: "TVTH tr.138", kbFile: PROSPERITY_FILE, anchors: PERIOD_ANCHORS, scope: "three-sides", mainStars, slots, assumptions });

const childSet = (id: string, name: string, slots: readonly Slot[], assumptions: readonly string[] = []) =>
  starSetTrigger({ id, name, goals: ["con cái"], polarity: "tốt", source: "TVTH tr.139", kbFile: CHILD_FILE, anchors: [MINOR], scope: "three-sides", slots, assumptions });

const LEFT_RIGHT: readonly Slot[] = [req("Tả Phụ"), req("Hữu Bật")];
const DRAGON_PHOENIX: readonly Slot[] = [req("Long Trì"), req("Phượng Các")];
const KHOI_VIET: readonly Slot[] = [req("Thiên Khôi"), req("Thiên Việt")];
const XUONG_KHUC: readonly Slot[] = [req("Văn Xương"), req("Văn Khúc")];
const THREE_TRANSFORMATIONS: readonly Slot[] = [req("Hóa Lộc"), req("Hóa Quyền"), req("Hóa Khoa")];
const QUAN_PHUC: readonly Slot[] = [req("Thiên Quan"), req("Thiên Phúc")];

const marriagePartnerRole = (ctx: YearContext): PalaceRole => (ctx.chart.parameters.gender === "nam" ? "Phu Thê" : "Quan Lộc");
const ROMANCE_STARS = ["Hồng Loan", "Thiên Hỷ", "Thiên Diêu", "Đào Hoa"] as const;

const TRIGGER_RULES: readonly TriggerDefinition[] = [
  marriageSet("HN-TVTH-SAT-PHA-LIEM-DAO", "Hôn phối: Sát Phá Liêm ngộ Đào", [req("Đào Hoa")], {
    mainStars: ["Thất Sát", "Phá Quân", "Liêm Trinh"],
  }),
  marriageSet(
    "HN-TVTH-VU-DIEU-LOC-MA-HY-DAO",
    "Hôn phối: Vũ Diêu Lộc Mã Hỉ Đào (hay Hồng)",
    [req("Vũ Khúc"), req("Thiên Diêu"), oneOf("Lộc Tồn", "Hóa Lộc"), req("Thiên Mã"), req("Thiên Hỷ"), oneOf("Đào Hoa", "Hồng Loan")],
    { assumptions: [LOC_ASSUMPTION, "\"Hỉ\" hiểu là Thiên Hỷ (câu khác của sách ghi riêng \"Hỉ Thần\")."] },
  ),
  marriageSet("HN-TVTH-TA-HUU-HONG-HY", "Hôn phối: Tả Hữu Hồng (hay Đào) Thiên Hỉ", [...LEFT_RIGHT, oneOf("Hồng Loan", "Đào Hoa"), req("Thiên Hỷ")]),
  marriageSet("HN-TVTH-LONG-PHUONG-HY-THAN", "Hôn phối: Long Phượng Hỉ Thần", [...DRAGON_PHOENIX, req("Hỷ Thần")]),
  marriageSet("HN-TVTH-DAO-HONG-NHAT-NGUYET", "Hôn phối: Đào Hồng, Nhật Nguyệt (hay Diêu Hỉ)", [
    req("Đào Hoa"),
    req("Hồng Loan"),
    groups(["Thái Dương", "Thái Âm"], ["Thiên Diêu", "Thiên Hỷ"]),
  ]),
  customTrigger({
    id: "HN-MLTC-HONG-LOAN-NHAP-HAN",
    name: "Hồng Loan nhập cung Lưu niên hoặc cung đại hạn",
    goals: ["hôn nhân"],
    polarity: "tốt",
    certainty: "exact",
    source: "MLTC tr.903-944 (mục 4)",
    kbFile: MARRIAGE_FILE,
    assumptions: ["Phần \"vào Lưu niên Thân\" chưa tính: kho không có cách lập cung Thân lưu niên. MLTC dặn không dùng Hồng Loan làm căn cứ duy nhất."],
    test: (ctx) =>
      splitByScale(
        natalStarsAt(ctx, ["Hồng Loan"], [ctx.yearlyPalace], "cung Lưu niên"),
        ctx.majorPalace === null ? [] : natalStarsAt(ctx, ["Hồng Loan"], [ctx.majorPalace], "cung đại hạn"),
      ),
  }),
  customTrigger({
    id: "HN-MLTC-LUU-NIEN-PHOI",
    name: "Lưu niên rơi vào Phu Thê (nam) / Quan Lộc (nữ) có sao hoa đào",
    goals: ["hôn nhân"],
    polarity: "tốt",
    certainty: "interpretive",
    source: "MLTC tr.903-944",
    kbFile: MARRIAGE_FILE,
    assumptions: [
      "Hàm Trì hiểu là Đào Hoa.",
      "\"Lưu niên tam phương\" tính cả xung chiếu; \"Phúc Đức\" là Phúc Đức lưu niên.",
      "Chưa xét \"các sao ổn định\" (sách không định nghĩa).",
    ],
    test(ctx) {
      const role = marriagePartnerRole(ctx);
      const landing = [natal(role), { frame: "major", role } as PalaceTarget].filter((target) => resolveTarget(ctx, target) === ctx.yearlyPalace);
      if (!landing.length) return null;
      const fortune = resolveTarget(ctx, yearly("Phúc Đức"))!;
      const palaces = [...scopePalaces(ctx.yearlyPalace, "three-sides"), fortune];
      const stars = natalStarsAt(ctx, ROMANCE_STARS, palaces, "tam phương Lưu niên hoặc Phúc Đức lưu niên");
      if (!stars.length) return null;
      return hitIf([`Lưu niên ${palaceText(ctx.chart, ctx.yearlyPalace)} là ${landing.map(targetLabel).join(", ")}`, ...stars]);
    },
  }),
  customTrigger({
    id: "HN-MLTC-KHOA-TAM-PHUONG-MENH",
    name: "Can Lưu niên hóa Khoa vào tam phương Mệnh",
    goals: ["hôn nhân"],
    polarity: "tốt",
    certainty: "interpretive",
    source: "MLTC tr.903-944",
    kbFile: MARRIAGE_FILE,
    assumptions: ["\"Mệnh\" hiểu là Mệnh bản mệnh; tam phương tính cả xung chiếu."],
    test(ctx) {
      const khoa = transformationOf(ctx.yearlyTransformations, "Hóa Khoa");
      if (!khoa || !scopePalaces(ctx.chart.parameters.lifePalace, "three-sides").includes(khoa.palace!)) return null;
      return hitIf([`Hóa Khoa lưu niên (${khoa.star}) ở ${palaceText(ctx.chart, khoa.palace!)}, trong tam phương Mệnh`]);
    },
  }),
  customTrigger({
    id: "HN-MLTC-KY-CHINH-TINH-MENH",
    name: "Can Lưu niên hóa Kỵ chính tinh cung Mệnh (kết hôn người quen)",
    goals: ["hôn nhân"],
    polarity: "trung tính",
    certainty: "interpretive",
    source: "MLTC tr.903-944",
    kbFile: MARRIAGE_FILE,
    assumptions: ["\"Mệnh\" hiểu là Mệnh bản mệnh."],
    test(ctx) {
      const ky = transformationOf(ctx.yearlyTransformations, "Hóa Kỵ");
      if (!ky || ky.palace !== ctx.chart.parameters.lifePalace || !isMainStar(ky.star)) return null;
      return hitIf([`Hóa Kỵ lưu niên vào ${ky.star} ở cung Mệnh (${branchName(ky.palace)})`]);
    },
  }),
  customTrigger({
    id: "HN-MLTC-DAO-HOA-HAN",
    name: "Đại hạn hoặc Lưu niên có Đào Hoa (sống chung, khó lâu dài)",
    goals: ["hôn nhân"],
    polarity: "trung tính",
    certainty: "exact",
    source: "MLTC tr.903-944",
    kbFile: MARRIAGE_FILE,
    test: (ctx) =>
      splitByScale(
        natalStarsAt(ctx, ["Đào Hoa"], [ctx.yearlyPalace], "cung Lưu niên"),
        ctx.majorPalace === null ? [] : natalStarsAt(ctx, ["Đào Hoa"], [ctx.majorPalace], "cung đại hạn"),
      ),
  }),
  customTrigger({
    id: "HN-MLTC-CAN-PHU-THE-KY-DAI-HAN",
    name: "Can cung Phu Thê hóa Kỵ vào tam phương đại hạn (kết hôn trong hạn)",
    goals: ["hôn nhân"],
    polarity: "trung tính",
    certainty: "interpretive",
    source: "MLTC tr.903-944",
    kbFile: MARRIAGE_FILE,
    assumptions: ["Cung Phu Thê là Phu Thê bản mệnh; tam phương tính cả xung chiếu. Quy tắc cho cả 10 năm đại hạn, không chỉ ra năm."],
    test(ctx) {
      if (ctx.majorPalace === null) return null;
      const spouse = resolveTarget(ctx, natal("Phu Thê"))!;
      const ky = transformationOf(ctx.index.transformationsByStem(ctx.chart.palaces[spouse]!.stem), "Hóa Kỵ");
      if (!ky || !scopePalaces(ctx.majorPalace, "three-sides").includes(ky.palace!)) return null;
      return decadeHit([
        `Can ${stemName(ctx.chart.palaces[spouse]!.stem)} cung Phu Thê hóa Kỵ ${ky.star} ở ${palaceText(ctx.chart, ky.palace!)}, trong tam phương đại hạn ${palaceText(ctx.chart, ctx.majorPalace)}`,
      ]);
    },
  }),
  customTrigger({
    id: "HN-NP1-LUU-MA-PHU-THE",
    name: "Lưu Thiên Mã nhập Phu Thê (khó cưới, có thể bỏ nhau)",
    goals: ["hôn nhân"],
    polarity: "xấu",
    certainty: "interpretive",
    source: "NP1 tr.111-142",
    kbFile: MARRIAGE_FILE,
    assumptions: [NATAL_FRAME_ASSUMPTION, "Câu ngắn trong bài giảng, không có điều kiện kèm."],
    test: (ctx) => hitIf(flowingAt(ctx, ["L. Thiên Mã"], [natal("Phu Thê")])),
  }),
  customTrigger({
    id: "HN-NP1-LUU-HO-KINH-PHU-THE",
    name: "Lưu Bạch Hổ, Lưu Kình Dương gặp Phu Thê (hỏng)",
    goals: ["hôn nhân"],
    polarity: "xấu",
    certainty: "interpretive",
    source: "NP1 tr.111-142",
    kbFile: MARRIAGE_FILE,
    assumptions: [NATAL_FRAME_ASSUMPTION, "\"Gặp\" hiểu là sao lưu nằm tại cung Phu Thê."],
    test: (ctx) => hitIf(flowingAt(ctx, ["L. Bạch Hổ", "L. Kình Dương"], [natal("Phu Thê")])),
  }),
  customTrigger({
    id: "HN-NP1-CO-LUONG-NAM-MAU",
    name: "Phu Thê có Cơ Lương gặp năm Mậu (Thiên Cơ Hóa Kỵ)",
    goals: ["hôn nhân"],
    polarity: "xấu",
    certainty: "exact",
    source: "NP1 tr.111-142",
    kbFile: MARRIAGE_FILE,
    test(ctx) {
      if (mod(ctx.stemBranch.stem, 10) !== 4) return null;
      const spouse = resolveTarget(ctx, natal("Phu Thê"))!;
      if (hasMainStar(ctx, spouse, ["Thiên Cơ", "Thiên Lương"]).length < 2) return null;
      return hitIf([`Năm Mậu, Phu Thê ${palaceText(ctx.chart, spouse)} có Thiên Cơ, Thiên Lương; Thiên Cơ Hóa Kỵ`]);
    },
  }),

  prosperitySet("TL-TVTH-TU-PHU-VU-TUONG", "Phát giàu: Tử Phủ Vũ Tướng có Lộc, Long Phượng, Tả Hữu", ["tài lộc"], ["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng"], [
    oneOf("Lộc Tồn", "Hóa Lộc"),
    ...DRAGON_PHOENIX,
    ...LEFT_RIGHT,
  ], [LOC_ASSUMPTION]),
  prosperitySet("TL-TVTH-CU-NHAT-SONG-LOC", "Phát buôn bán: Cự Nhật có song Lộc, Sinh Vượng, Tả Hữu", ["tài lộc"], ["Cự Môn", "Thái Dương"], [
    req("Lộc Tồn"),
    req("Hóa Lộc"),
    oneOf("Tràng Sinh", "Đế Vượng"),
    ...LEFT_RIGHT,
  ], ["\"Song Lộc\" là Lộc Tồn và Hóa Lộc; \"Sinh Vượng\" là Tràng Sinh hoặc Đế Vượng."]),
  prosperitySet("TL-TVTH-SAT-PHA-LIEM-THAM", "Phát kinh doanh: Sát Phá Liêm Tham có Tả Hữu, Quyền Lộc, Khôi Việt", ["tài lộc"], ["Thất Sát", "Phá Quân", "Liêm Trinh", "Tham Lang"], [
    ...LEFT_RIGHT,
    req("Hóa Quyền"),
    req("Hóa Lộc"),
    ...KHOI_VIET,
  ]),
  prosperitySet("CD-TVTH-NGUYET-DONG-CO-CU", "Thăng quan, đại đăng khoa: Nguyệt Đồng Cơ Cự có Khoa Quyền Lộc, Tướng Ấn, Khôi Việt, Tả Hữu", ["công danh", "thi cử"], ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"], [
    ...THREE_TRANSFORMATIONS,
    req("Tướng Quân"),
    req("Quốc Ấn"),
    ...KHOI_VIET,
    ...LEFT_RIGHT,
  ], ["\"Tướng Ấn\" hiểu là Tướng Quân và Quốc Ấn."]),
  prosperitySet("CD-TVTH-CO-NGUYET-DONG-LUONG", "Phát công danh và giàu có: Cơ Nguyệt Đồng Lương có Xương Khúc, Hồng Đào, Tam Hóa", ["công danh", "tài lộc"], ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"], [
    ...XUONG_KHUC,
    req("Hồng Loan"),
    req("Đào Hoa"),
    ...THREE_TRANSFORMATIONS,
  ]),
  customTrigger({
    id: "TL-MLTC-CAN-DAI-HAN-LOC",
    name: "Can cung đại hạn hóa Lộc chính tinh ở cung Lưu niên hoặc Quan Lộc lưu niên (giàu có trong năm)",
    goals: ["tài lộc"],
    polarity: "tốt",
    certainty: "exact",
    source: "MLTC tr.865-882 (mục 2.2.2)",
    kbFile: PROSPERITY_FILE,
    test(ctx) {
      const loc = transformationOf(ctx.majorTransformations, "Hóa Lộc");
      if (!loc || !isMainStar(loc.star)) return null;
      const targets = [yearly("Mệnh"), yearly("Quan Lộc")].filter((target) => resolveTarget(ctx, target) === loc.palace);
      return hitIf(targets.map((target) => `Can cung đại hạn hóa Lộc ${loc.star} ở ${targetLabel(target)} ${palaceText(ctx.chart, loc.palace!)}`));
    },
  }),
  customTrigger({
    id: "TL-MLTC-TAM-CAT-HOA-LUU-NIEN",
    name: "Can Lưu niên hóa Lộc/Quyền/Khoa vào Mệnh, Điền, Huynh Đệ, Tài Bạch, Phúc Đức (may mắn tiền bạc)",
    goals: ["tài lộc"],
    polarity: "tốt",
    certainty: "interpretive",
    source: "MLTC tr.944-957",
    kbFile: PROSPERITY_FILE,
    assumptions: [MLTC_FRAME_ASSUMPTION, "Tác giả dặn: may mắn tài chính không có nghĩa tự giàu."],
    test(ctx) {
      const roles: readonly PalaceRole[] = ["Mệnh", "Điền Trạch", "Huynh Đệ", "Tài Bạch", "Phúc Đức"];
      return hitIf(
        ctx.yearlyTransformations
          .filter((item) => item.transformation !== "Hóa Kỵ" && item.palace !== null)
          .flatMap((item) =>
            roles
              .filter((role) => resolveTarget(ctx, yearly(role)) === item.palace)
              .map((role) => `${item.transformation} lưu niên (${item.star}) ở ${role} lưu niên ${palaceText(ctx.chart, item.palace!)}`),
          ),
      );
    },
  }),
  customTrigger({
    id: "TL-MLTC-KY-LUU-NIEN-MAT-TIEN",
    name: "Can Lưu niên hóa Kỵ vào Nô Bộc, Tử Tức, Phụ Mẫu (xui, mất tiền)",
    goals: ["tài lộc"],
    polarity: "xấu",
    certainty: "interpretive",
    source: "MLTC tr.944-957",
    kbFile: PROSPERITY_FILE,
    assumptions: [MLTC_FRAME_ASSUMPTION, "Tác giả dặn: xui không có nghĩa nghèo, có thể tránh hoặc hóa giải."],
    test(ctx) {
      const ky = transformationOf(ctx.yearlyTransformations, "Hóa Kỵ");
      if (!ky) return null;
      const roles: readonly PalaceRole[] = ["Nô Bộc", "Tử Tức", "Phụ Mẫu"];
      return hitIf(
        roles.filter((role) => resolveTarget(ctx, yearly(role)) === ky.palace).map((role) => `Hóa Kỵ lưu niên (${ky.star}) ở ${role} lưu niên ${palaceText(ctx.chart, ky.palace!)}`),
      );
    },
  }),
  customTrigger({
    id: "TL-NP2-LUU-LOC-TON",
    name: "Lưu Lộc Tồn vào Mệnh, Tài, Quan, Điền (may mắn, mua xe, đổi nhà)",
    goals: ["tài lộc"],
    polarity: "tốt",
    certainty: "interpretive",
    source: "NP2 tr.281-284",
    kbFile: FLOWING_LOC_FILE,
    assumptions: [NATAL_FRAME_ASSUMPTION, "Bản OCR NP2 có chỗ lẫn chữ."],
    test: (ctx) => hitIf(flowingAt(ctx, ["L. Lộc Tồn"], [natal("Mệnh"), natal("Tài Bạch"), natal("Quan Lộc"), natal("Điền Trạch")])),
  }),

  customTrigger({
    id: "CD-MLTC-CAN-DAI-HAN-QUYEN",
    name: "Can cung đại hạn hóa Quyền chính tinh vào Mệnh/Quan Lộc bản mệnh hoặc hội chiếu Mệnh/Quan Lộc lưu niên (thăng chức)",
    goals: ["công danh"],
    polarity: "tốt",
    certainty: "interpretive",
    source: "MLTC tr.865-882 (mục 2.2.2)",
    kbFile: EXAM_FILE,
    assumptions: ["\"Hội chiếu\" hiểu là nằm trong tam phương tứ chính (khớp theo cách hiểu); vào thẳng Mệnh/Quan Lộc bản mệnh là khớp chắc chắn, ghi một lần cho cả đại hạn."],
    test(ctx) {
      const quyen = transformationOf(ctx.majorTransformations, "Hóa Quyền");
      if (!quyen || !isMainStar(quyen.star)) return null;
      const text = `Can cung đại hạn hóa Quyền ${quyen.star} ở ${palaceText(ctx.chart, quyen.palace!)}`;
      const direct = [natal("Mệnh"), natal("Quan Lộc")].filter((target) => resolveTarget(ctx, target) === quyen.palace);
      if (direct.length) return decadeHit(direct.map((target) => `${text} = ${targetLabel(target)}`), "exact");
      const aspect = [yearly("Mệnh"), yearly("Quan Lộc")].filter((target) => scopePalaces(resolveTarget(ctx, target)!, "three-sides").includes(quyen.palace!));
      return hitIf(aspect.map((target) => `${text}, hội chiếu ${targetLabel(target)}`), "interpretive");
    },
  }),

  customTrigger({
    id: "TC-MLTC-7-HOA-KHOA",
    name: "Tiểu hạn hoặc Lưu niên có Hóa Khoa (may mắn kỳ thi)",
    goals: ["thi cử"],
    polarity: "tốt",
    certainty: "interpretive",
    source: "MLTC tr.865-882 (mục 2.2.3, quy tắc 7)",
    kbFile: EXAM_FILE,
    assumptions: [NATAL_AND_FLOWING_ASSUMPTION, "\"Có\" hiểu là Hóa Khoa nằm tại cung."],
    test(ctx) {
      const anchors = [
        { label: "cung tiểu hạn", branch: ctx.minorPalace },
        { label: "cung Lưu niên", branch: ctx.yearlyPalace },
      ].filter((anchor): anchor is { label: string; branch: number } => anchor.branch !== null);
      const khoa = tokenPlacements(ctx, "Hóa Khoa", true);
      const support = tokenPlacements(ctx, "Tả Phụ", false);
      return hitIf(
        anchors.flatMap((anchor) =>
          khoa
            .filter((placement) => placement.palace === anchor.branch)
            .map((placement) => `${placementText(ctx, placement)} (${anchor.label})${support.some((item) => item.palace === anchor.branch) ? ", thêm Tả Phụ" : ""}`),
        ),
      );
    },
  }),
  customTrigger({
    id: "TC-MLTC-8-XUONG-MA",
    name: "Văn Xương, Thiên Mã vào Mệnh hoặc Đại Tiểu hạn (lợi thi thăng cấp)",
    goals: ["thi cử"],
    polarity: "tốt",
    certainty: "interpretive",
    source: "MLTC tr.865-882 (mục 2.2.3, quy tắc 8)",
    kbFile: EXAM_FILE,
    assumptions: [NATAL_AND_FLOWING_ASSUMPTION, "Hai sao cùng nằm tại cung Mệnh bản mệnh, cung đại hạn hoặc cung tiểu hạn."],
    test(ctx) {
      const anchors = [natal("Mệnh"), MAJOR, MINOR];
      const xuong = tokenPlacements(ctx, "Văn Xương", true);
      const ma = tokenPlacements(ctx, "Thiên Mã", true);
      const matches = anchors.flatMap((anchor) => {
        const branch = resolveTarget(ctx, anchor);
        if (branch === null) return [];
        const x = xuong.find((item) => item.palace === branch);
        const m = ma.find((item) => item.palace === branch);
        if (!x || !m) return [];
        return [{ text: `${targetLabel(anchor)} ${palaceText(ctx.chart, branch)}: ${x.label}, ${m.label}`, decade: anchor.frame !== "minor" && !x.flowing && !m.flowing }];
      });
      return splitByScale(
        matches.filter((match) => !match.decade).map((match) => match.text),
        matches.filter((match) => match.decade).map((match) => match.text),
      );
    },
  }),
  customTrigger({
    id: "TC-MLTC-10-LOC-MA",
    name: "Thiên Lộc Thiên Mã, kinh nhân giáp đệ (Lộc và Mã cùng cung hoặc hội chiếu)",
    goals: ["thi cử"],
    polarity: "tốt",
    certainty: "interpretive",
    source: "MLTC tr.865-882 (mục 2.2.3, quy tắc 10)",
    kbFile: EXAM_FILE,
    assumptions: [
      LOC_ASSUMPTION,
      "Ít nhất một trong hai sao là sao lưu để quy tắc ứng theo năm; \"hội chiếu\" là tam phương tứ chính.",
    ],
    test(ctx) {
      const locs = [...tokenPlacements(ctx, "Lộc Tồn", true), ...tokenPlacements(ctx, "Hóa Lộc", true)];
      const mas = tokenPlacements(ctx, "Thiên Mã", true);
      return hitIf(
        locs.flatMap((loc) =>
          mas
            .filter((ma) => (loc.flowing || ma.flowing) && scopePalaces(loc.palace, "three-sides").includes(ma.palace))
            .map((ma) => `${placementText(ctx, loc)}; ${placementText(ctx, ma)}`),
        ),
      );
    },
  }),
  customTrigger({
    id: "TC-MLTC-11-KHOA-QUYEN-LOC",
    name: "Khoa Quyền Lộc củng chiếu tam phương Lưu niên hoặc Tiểu hạn (lợi thi cử, thăng tiến)",
    goals: ["thi cử", "công danh"],
    polarity: "tốt",
    certainty: "interpretive",
    source: "MLTC tr.865-882 (mục 2.2.3, quy tắc 11)",
    kbFile: EXAM_FILE,
    assumptions: [NATAL_AND_FLOWING_ASSUMPTION, "Tam phương tính cả xung chiếu."],
    test(ctx) {
      const anchors = [
        { label: "cung Lưu niên", branch: ctx.yearlyPalace },
        { label: "cung tiểu hạn", branch: ctx.minorPalace },
      ].filter((anchor): anchor is { label: string; branch: number } => anchor.branch !== null);
      const kinds: readonly Transformation[] = ["Hóa Khoa", "Hóa Quyền", "Hóa Lộc"];
      return hitIf(
        anchors.flatMap((anchor) => {
          const palaces = scopePalaces(anchor.branch, "three-sides");
          const found = kinds.map((kind) => tokenPlacements(ctx, kind, true).find((item) => palaces.includes(item.palace)));
          if (found.some((item) => item === undefined)) return [];
          return [`Tam phương ${anchor.label} ${palaceText(ctx.chart, anchor.branch)}: ${found.map((item) => placementText(ctx, item!)).join("; ")}`];
        }),
      );
    },
  }),

  customTrigger({
    id: "SK-MLTC-LUU-NIEN-TU-HOA-KY",
    name: "Cung Lưu niên tự Hóa Kỵ (dễ tai nạn giao thông)",
    goals: ["sức khỏe"],
    polarity: "xấu",
    certainty: "exact",
    source: "MLTC tr.883-899 (mục 7)",
    kbFile: ACCIDENT_FILE,
    test(ctx) {
      const stem = ctx.chart.palaces[ctx.yearlyPalace]!.stem;
      const ky = transformationOf(ctx.index.transformationsByStem(stem), "Hóa Kỵ");
      if (!ky || ky.palace !== ctx.yearlyPalace) return null;
      return hitIf([`Can ${stemName(stem)} cung Lưu niên ${palaceText(ctx.chart, ctx.yearlyPalace)} hóa Kỵ ${ky.star} ngay trong cung`]);
    },
  }),
  customTrigger({
    id: "SK-MLTC-TAT-ACH-KY-XUNG",
    name: "Can cung Tật Ách lưu niên hóa Kỵ xung Huynh Đệ lưu niên hoặc Phụ Mẫu đại hạn (sức khỏe kém)",
    goals: ["sức khỏe"],
    polarity: "xấu",
    certainty: "interpretive",
    source: "MLTC tr.883-899",
    kbFile: ACCIDENT_FILE,
    assumptions: ["\"Xung\" hiểu là sao Hóa Kỵ nằm ở cung đối diện cung bị xung."],
    test(ctx) {
      const health = resolveTarget(ctx, yearly("Tật Ách"))!;
      const stem = ctx.chart.palaces[health]!.stem;
      const ky = transformationOf(ctx.index.transformationsByStem(stem), "Hóa Kỵ");
      if (!ky) return null;
      const targets: readonly PalaceTarget[] = [yearly("Huynh Đệ"), { frame: "major", role: "Phụ Mẫu" }];
      return hitIf(
        targets.flatMap((target) => {
          const branch = resolveTarget(ctx, target);
          return branch !== null && mod(branch + 6, 12) === ky.palace
            ? [`Can ${stemName(stem)} cung Tật Ách lưu niên hóa Kỵ ${ky.star} ở ${palaceText(ctx.chart, ky.palace)}, xung ${targetLabel(target)} ${palaceText(ctx.chart, branch)}`]
            : [];
        }),
      );
    },
  }),
  starSetTrigger({
    id: "SK-TVTH-TIEU-HAN-TANG-HOA-LINH",
    name: "Tiểu hạn gặp Tang Hỏa Linh (dễ cháy nhà, nhất là đóng Điền)",
    goals: ["sức khỏe"],
    polarity: "xấu",
    source: "TVTH tr.139-140",
    kbFile: ACCIDENT_FILE,
    anchors: [MINOR],
    scope: "three-sides",
    slots: [req("Tang Môn"), req("Hỏa Tinh"), req("Linh Tinh")],
  }),
  customTrigger({
    id: "SK-NP2-LUU-KINH-DA-MENH-TAT",
    name: "Lưu Kình Đà vào Mệnh (bệnh tật) hoặc Tật Ách (hình thương)",
    goals: ["sức khỏe"],
    polarity: "xấu",
    certainty: "interpretive",
    source: "NP2 tr.281-284",
    kbFile: FLOWING_LOC_FILE,
    assumptions: [NATAL_FRAME_ASSUMPTION, "Bản OCR NP2 ở đoạn này rất lẫn."],
    test: (ctx) => hitIf(flowingAt(ctx, ["L. Kình Dương", "L. Đà La"], [natal("Mệnh"), natal("Tật Ách")])),
  }),
  customTrigger({
    id: "SK-NP1-TIEU-HAN-KHOC-HU-TANG-HO",
    name: "Tiểu hạn có Lưu Khốc, Hư, Tang, Hổ (kém)",
    goals: ["sức khỏe"],
    polarity: "xấu",
    certainty: "interpretive",
    source: "NP1 tr.111-142",
    kbFile: FLOWING_TUE_FILE,
    assumptions: ["Sách liệt kê bốn sao; tính khi có ít nhất một sao lưu tại cung tiểu hạn."],
    test: (ctx) => hitIf(flowingAt(ctx, ["L. Thiên Khốc", "L. Thiên Hư", "L. Tang Môn", "L. Bạch Hổ"], [MINOR])),
  }),

  childSet("SC-TVTH-PHU-TUONG-LONG-PHUONG-THAI", "Sinh con: Phủ Tướng Long Phượng ngộ Thai", [req("Thiên Phủ"), req("Thiên Tướng"), ...DRAGON_PHOENIX, req("Thai")]),
  childSet("SC-TVTH-NHAT-NGUYET-KHOI-VIET-HONG-DAO", "Sinh con: Nhật Nguyệt, Khôi Việt ngộ Hồng Đào", [req("Thái Dương"), req("Thái Âm"), ...KHOI_VIET, req("Hồng Loan"), req("Đào Hoa")]),
  childSet("SC-TVTH-THANH-LONG-DE-VUONG-THAI", "Sinh con: Thanh Long Đế Vượng ngộ Thai", [req("Thanh Long"), req("Đế Vượng"), req("Thai")]),
  childSet("SC-TVTH-QUAN-PHUC-TA-HUU-HONG-HY", "Sinh con: Quan Phúc, Tả Hữu, Hồng Hỉ", [...QUAN_PHUC, ...LEFT_RIGHT, req("Hồng Loan"), req("Thiên Hỷ")], [
    "\"Quan Phúc\" là Thiên Quan, Thiên Phúc; \"Hồng Hỉ\" là Hồng Loan, Thiên Hỷ.",
  ]),
  childSet("SC-TVTH-THANH-LONG-LONG-TRI-MA-SINH-VUONG", "Sinh con: Thanh Long, Long Trì, Thiên Mã ngộ Sinh hay Vượng", [
    req("Thanh Long"),
    req("Long Trì"),
    req("Thiên Mã"),
    oneOf("Tràng Sinh", "Đế Vượng"),
  ]),
  childSet("SC-TVTH-QUAN-PHUC-TAU-THU-HY-THAN", "Sinh con: Quan Phúc, Tấu Thư, Hỉ Thần", [...QUAN_PHUC, req("Tấu Thư"), req("Hỷ Thần")], [
    "\"Quan Phúc\" là Thiên Quan, Thiên Phúc.",
  ]),
];

const ADULT_GOALS: readonly Goal[] = ["hôn nhân", "con cái", "tài lộc", "công danh"];
export const ADULT_TRIGGER_MIN_AGE = 13;

export const TRIGGERS: readonly TriggerDefinition[] = TRIGGER_RULES.map((trigger) =>
  trigger.goals.some((goal) => ADULT_GOALS.includes(goal)) ? { ...trigger, minAge: ADULT_TRIGGER_MIN_AGE } : trigger,
);

export const TRIGGER_BY_ID: ReadonlyMap<string, TriggerDefinition> = new Map(TRIGGERS.map((trigger) => [trigger.id, trigger]));
