import { hasStarIn, palaceAt } from "../analysis/chart-query.js";
import { branchName, mod } from "../calendar/stem-branch.js";
import { sixCombinationPartner } from "../calendar/relations.js";
import type { BranchName } from "../calendar/stem-branch.js";
import type { Palace } from "../chart/types.js";
import {
  allInScope,
  allOf,
  anyInScope,
  anyOf,
  BAN_CACH_CAT,
  brightnessIn,
  condition,
  countInScope,
  describePalace,
  flankedBy,
  genderIs,
  isDaytime,
  isNighttime,
  KHONG_KIEP,
  khongVongAt,
  LOC_ANY,
  LUC_CAT,
  LUC_SAT,
  mainStarBrightIn,
  MINOR_STAR_GOOD_BRANCHES,
  palaceAtBranches,
  palaceOf,
  roleAt,
  samePalace,
  SAT_PHA_CACH,
  sharedPalace,
  soleMainStar,
  starAt,
  starIn,
  starInRole,
  starsInPalace,
  stemIn,
  strongAssumption,
  strongLevels,
  TAM_HOA,
  transformed,
  tuanTrietAt,
  TU_SAT,
  voidOfMain,
  withAssumption,
  yearBranchIn,
} from "./conditions.js";
import { defaultGoodBreakers, definePattern, luckyGrade, maleficBreakers, tuanTrietBreaker } from "./rules-common.js";
import type { Condition, PatternContext, PatternRule } from "./types.js";

const GENERAL_BREAK = "00 §2 L3";

const KB = "09_Cach-cuc/01_Cach-tot/";

const lifeHas = (ctx: PatternContext, name: string): Condition => starInRole(ctx, name, "Mệnh");
const lifeAt = (ctx: PatternContext, branches: readonly BranchName[]): Condition => roleAt(ctx, "Mệnh", branches);
const inLifeGroup = (ctx: PatternContext, names: readonly string[]): Condition => anyInScope(ctx, names, ctx.life, "tam phương tứ chính");
const allInLifeGroup = (ctx: PatternContext, names: readonly string[]): Condition => allInScope(ctx, names, ctx.life, "tam phương tứ chính");
const lifeOrBodyHas = (ctx: PatternContext, name: string): Condition =>
  anyOf(`${name} ở Mệnh hoặc Thân`, [starInRole(ctx, name, "Mệnh"), starInRole(ctx, name, "Thân")]);
const unspecifiedMalefic = (ctx: PatternContext, palace: Palace, cite: string, names: readonly string[] = SAT_PHA_CACH): readonly Condition[] =>
  maleficBreakers(ctx, names, palace, "tam phương tứ chính", cite, "'sát tinh' không nêu tên/phạm vi: hiểu là lục sát và Hóa Kỵ trong tam phương tứ chính (GA-2)");

const quanThanKhanhHoi = definePattern({
  id: "quan-than-khanh-hoi",
  name: "Quần thần khánh hội",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 32); MLTC tr.92–139 (Tử Vi mục 4.1, 4.5)",
  kbFile: `${KB}01_Quan-than-khanh-hoi.md`,
  variants: (ctx) => [
    {
      book: "TVTH",
      label: "TVTH số 32",
      cite: "TVTH tr.91–93 (số 32); tr.24–25",
      required: [
        lifeHas(ctx, "Tử Vi"),
        withAssumption(
          countInScope(
            ctx,
            ["Thiên Khôi", "Thiên Việt", "Văn Xương", "Văn Khúc", "Tả Phụ", "Hữu Bật", ...TAM_HOA, "Long Trì", "Phượng Các"],
            ctx.life,
            "tam phương tứ chính",
            ctx.options.minCourtStars,
          ),
          `'gặp toàn cát tinh hội' hiểu là có ít nhất ${ctx.options.minCourtStars} cát tinh trong tam phương tứ chính Mệnh (tùy chọn minCourtStars)`,
        ),
      ],
      breakers: unspecifiedMalefic(ctx, ctx.life, "MLTC Tử Vi mục 4.5"),
    },
    {
      book: "MLTC",
      label: "MLTC Tử Vi mục 4.5 (Quân thần khánh hội)",
      cite: "MLTC tr.92–139 (Tử Vi mục 4.5)",
      required: [
        lifeHas(ctx, "Tử Vi"),
        withAssumption(
          countInScope(
            ctx,
            ["Thiên Phủ", "Thiên Tướng", "Tả Phụ", "Hữu Bật", "Văn Xương", "Văn Khúc", "Tam Thai", "Bát Tọa", "Long Trì", "Phượng Các", "Ân Quang", "Thiên Quý"],
            ctx.life,
            "tam phương tứ chính",
            ctx.options.minCourtStars,
          ),
          `danh sách 'quần thần' để mở ('...'): hiểu là có ít nhất ${ctx.options.minCourtStars} sao trong tam phương tứ chính Mệnh; Tam Đài = Tam Thai`,
        ),
      ],
      strengtheners: [inLifeGroup(ctx, ["Lộc Tồn"]), inLifeGroup(ctx, TAM_HOA)],
      breakers: maleficBreakers(
        ctx,
        SAT_PHA_CACH,
        ctx.life,
        "tam phương tứ chính",
        "MLTC Tử Vi mục 4.5: nô tì bắt nạt chủ",
        "'kết hợp với nhau' hiểu là trong tam phương tứ chính Mệnh",
      ),
    },
    {
      book: "MLTC",
      label: "MLTC Tử Vi mục 4.1 (Bách quan triều củng)",
      cite: "MLTC tr.92–139 (Tử Vi mục 4.1)",
      required: [
        lifeHas(ctx, "Tử Vi"),
        brightnessIn(ctx, "Tử Vi", ["Miếu"]),
        allInLifeGroup(ctx, LUC_CAT),
        withAssumption(
          allOf("Lộc Mã gặp nhau", [inLifeGroup(ctx, LOC_ANY), inLifeGroup(ctx, ["Thiên Mã"])]),
          "'Lộc Mã gặp nhau' hiểu là Lộc (Lộc Tồn hoặc Hóa Lộc) và Thiên Mã cùng trong tam phương tứ chính Mệnh",
        ),
      ],
      breakers: maleficBreakers(ctx, SAT_PHA_CACH, ctx.life, "tam phương tứ chính", "MLTC Tử Vi mục 4.5"),
    },
  ],
  notes: ["Cách có danh sách sao mở và ngưỡng không định lượng trong sách (spec: flagged)"],
});

const tuPhuDongCung = definePattern({
  id: "tu-phu-dong-cung",
  name: "Tử Phủ đồng cung",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 1), tr.186–192 (câu 32); MLTC tr.92–139 (Tử Vi mục 4.8)",
  kbFile: `${KB}02_Tu-Phu-dong-cung.md`,
  variants: (ctx) => {
    const palace = sharedPalace(ctx, ["Tử Vi", "Thiên Phủ"]) ?? ctx.life;
    return [
      {
        book: "TVTH",
        label: "TVTH số 1",
        cite: "TVTH tr.91–93 (số 1); tr.186–192 (câu 32)",
        required: [samePalace(ctx, ["Tử Vi", "Thiên Phủ"]), lifeOrBodyHas(ctx, "Tử Vi")],
        grade: [
          withAssumption(
            luckyGrade(ctx, palace, BAN_CACH_CAT, `cung Tử Phủ ${describePalace(palace)}`),
            `TVTH số 1 không nêu điều kiện cát tinh: áp MLTC mục 4.8 'không có cát tinh và cát hóa thì không hợp cách' cho cung Tử Phủ, ngưỡng ${ctx.options.minLuckyCount} sao (GA-1)`,
          ),
        ],
        strengtheners: [stemIn(ctx, ["Giáp"])],
        breakers: [
          ...tuanTrietBreaker(ctx, palace, "TVTH câu 32: thiết hiềm nội trở Triệt Tuần"),
          ...maleficBreakers(
            ctx,
            SAT_PHA_CACH,
            palace,
            "tam phương tứ chính",
            "MLTC Tử Vi mục 4.5",
            "TVTH không nêu sát tinh phá Tử Phủ: áp quy tắc chung Tử Vi MLTC mục 4.5 cho tam phương tứ chính cung Tử Phủ",
          ),
        ],
      },
      {
        book: "MLTC",
        label: "MLTC Tử Vi mục 4.8",
        cite: "MLTC tr.92–139 (Tử Vi mục 4.8)",
        required: [lifeHas(ctx, "Tử Vi"), lifeAt(ctx, ["Dần", "Thân"])],
        grade: [luckyGrade(ctx, ctx.life)],
        strengtheners: [stemIn(ctx, ["Giáp"]), stemIn(ctx, ["Đinh", "Kỷ", "Canh", "Tân"])],
        breakers: [
          ...tuanTrietBreaker(ctx, palace, "TVTH câu 32"),
          ...maleficBreakers(ctx, SAT_PHA_CACH, ctx.life, "tam phương tứ chính", "MLTC Tử Vi mục 4.5", "mục 4.8 không nêu phá cách; áp quy tắc chung Tử Vi mục 4.5 (suy luận của KB)"),
        ],
      },
    ];
  },
});

const PHU_TUONG_MLTC_CASES: ReadonlyArray<{ readonly label: string; readonly life: BranchName; readonly stars: ReadonlyArray<readonly [string, BranchName]>; readonly mainInLife?: string; readonly voidLife?: boolean }> = [
  { label: "loại 1: Mệnh Sửu VCD, Phủ Tỵ, Tướng Dậu", life: "Sửu", stars: [["Thiên Phủ", "Tỵ"], ["Thiên Tướng", "Dậu"]], voidLife: true },
  { label: "loại 1: Mệnh Mùi VCD, Phủ Hợi, Tướng Mão", life: "Mùi", stars: [["Thiên Phủ", "Hợi"], ["Thiên Tướng", "Mão"]], voidLife: true },
  { label: "loại 1: Mệnh Mão VCD, Tướng Hợi, Phủ Mùi", life: "Mão", stars: [["Thiên Tướng", "Hợi"], ["Thiên Phủ", "Mùi"]], voidLife: true },
  { label: "loại 1: Mệnh Dậu VCD, Tướng Tỵ, Phủ Sửu", life: "Dậu", stars: [["Thiên Tướng", "Tỵ"], ["Thiên Phủ", "Sửu"]], voidLife: true },
  { label: "loại 2: Phủ Sửu, Tướng Tỵ", life: "Sửu", stars: [["Thiên Tướng", "Tỵ"]], mainInLife: "Thiên Phủ" },
  { label: "loại 2: Phủ Mùi, Tướng Hợi", life: "Mùi", stars: [["Thiên Tướng", "Hợi"]], mainInLife: "Thiên Phủ" },
  { label: "loại 2: Phủ Mão, Tướng Mùi", life: "Mão", stars: [["Thiên Tướng", "Mùi"]], mainInLife: "Thiên Phủ" },
  { label: "loại 2: Phủ Dậu, Tướng Sửu", life: "Dậu", stars: [["Thiên Tướng", "Sửu"]], mainInLife: "Thiên Phủ" },
  { label: "loại 2: Phủ Tỵ, Tướng Dậu", life: "Tỵ", stars: [["Thiên Tướng", "Dậu"]], mainInLife: "Thiên Phủ" },
  { label: "loại 2: Phủ Hợi, Tướng Mão", life: "Hợi", stars: [["Thiên Tướng", "Mão"]], mainInLife: "Thiên Phủ" },
  { label: "loại 3: Liêm Mệnh Dần, Phủ Tướng Ngọ Tuất", life: "Dần", stars: [["Thiên Phủ", "Ngọ"], ["Thiên Tướng", "Tuất"]], mainInLife: "Liêm Trinh" },
  { label: "loại 3: Liêm Mệnh Thân, Phủ Tướng Tý Thìn", life: "Thân", stars: [["Thiên Phủ", "Tý"], ["Thiên Tướng", "Thìn"]], mainInLife: "Liêm Trinh" },
];

const phuTuongTrieuVien = definePattern({
  id: "phu-tuong-trieu-vien",
  name: "Phủ Tướng triều viên",
  polarity: "tốt",
  source: "MLTC tr.331–359 (Thiên Phủ mục 4.4); TVTH tr.193–197 (câu 34)",
  kbFile: `${KB}03_Phu-Tuong-trieu-vien.md`,
  variants: (ctx) => {
    const breakers = maleficBreakers(ctx, SAT_PHA_CACH, ctx.life, "tam phương tứ chính", "MLTC Thiên Phủ mục 4.4");
    const caseConditions = PHU_TUONG_MLTC_CASES.map((item) =>
      allOf(item.label, [
        lifeAt(ctx, [item.life]),
        ...(item.voidLife ? [voidOfMain(ctx.life, "Mệnh")] : []),
        ...(item.mainInLife ? [lifeHas(ctx, item.mainInLife)] : []),
        ...item.stars.map(([name, branch]) => starAt(ctx, name, [branch])),
      ]),
    );
    return [
      {
        book: "TVTH",
        label: "TVTH câu 34 (Mệnh Dần, Phủ Tướng Ngọ Tuất)",
        cite: "TVTH tr.193–197 (câu 34)",
        required: [lifeAt(ctx, ["Dần"]), starAt(ctx, "Thiên Phủ", ["Ngọ", "Tuất"]), starAt(ctx, "Thiên Tướng", ["Ngọ", "Tuất"])],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Thiên Phủ mục 4.4",
        cite: "MLTC tr.331–359 (Thiên Phủ mục 4.4)",
        required: [anyOf("một trong các thế Phủ Tướng triều viên", caseConditions)],
        grade: [luckyGrade(ctx, ctx.life)],
        breakers,
      },
    ];
  },
});

const nhatNguyetTinhMinh = definePattern({
  id: "nhat-nguyet-tinh-minh",
  name: "Nhật Nguyệt tịnh minh",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 21); MLTC tr.181–221 (Thái Dương mục 4.5)",
  kbFile: `${KB}04_Nhat-Nguyet-tinh-minh.md`,
  variants: (ctx) => {
    const kyOnLuminary = ["Thái Dương", "Thái Âm"].filter((name) => transformed(ctx, name, "Hóa Kỵ").met);
    const breakers = [
      ...maleficBreakers(ctx, LUC_SAT, ctx.life, "tam phương tứ chính", "MLTC Thái Dương mục 4.5: gặp lục sát thì bình thường", "'gặp lục sát' hiểu là trong tam phương tứ chính Mệnh"),
      ...maleficBreakers(
        ctx,
        ["Hóa Kỵ"],
        ctx.life,
        "tam phương tứ chính",
        `03_Cach-bi-pha/07: Kị phá Nhật Nguyệt tịnh minh${kyOnLuminary.length ? ` (Kỵ ở ${kyOnLuminary.join(", ")})` : ""}`,
        "03/07 coi Hóa Kỵ phá Nhật Nguyệt tịnh minh; TVTH tr.28–30 lại nói Thái Dương đắc địa, Thái Âm miếu vượng gặp Hóa Kỵ riêng (không sát khác) trở nên rất tốt — sách mâu thuẫn, phạm vi hiểu là tam phương tứ chính",
      ),
    ];
    return [
      {
        book: "TVTH",
        label: "TVTH số 21",
        cite: "TVTH tr.91–93 (số 21)",
        required: [
          starAt(ctx, "Thái Dương", ["Thìn", "Tỵ"]),
          starAt(ctx, "Thái Âm", ["Dậu", "Tuất"]),
          anyOf("Mệnh đóng ở Nhật hoặc Nguyệt", [lifeHas(ctx, "Thái Dương"), lifeHas(ctx, "Thái Âm")]),
        ],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Thái Dương mục 4.5 (Nhật Tỵ, Nguyệt Dậu, Mệnh Sửu)",
        cite: "MLTC tr.181–221 (Thái Dương mục 4.5)",
        required: [starAt(ctx, "Thái Dương", ["Tỵ"]), starAt(ctx, "Thái Âm", ["Dậu"]), lifeAt(ctx, ["Sửu"]), stemIn(ctx, ["Tân", "Ất"])],
        assumptions: ["MLTC 'sinh năm Tân, Ất là hợp cách' hiểu là điều kiện của biến thể; Bính (chủ quý), Đinh (chủ phúc) được sách nhắc riêng nhưng không tính là hợp cách"],
        strengtheners: [stemIn(ctx, ["Bính"]), stemIn(ctx, ["Đinh"])],
        breakers,
      },
    ];
  },
});

const nhatNguyetChieuBich = definePattern({
  id: "nhat-nguyet-chieu-bich",
  name: "Nhật Nguyệt chiếu bích",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 28); MLTC tr.181–221 (Thái Dương mục 4.7)",
  kbFile: `${KB}05_Nhat-Nguyet-chieu-bich.md`,
  variants: (ctx) => {
    const tianZhai = palaceOf(ctx, "Điền Trạch");
    const manyMalefic = countInScope(ctx, LUC_SAT, ctx.life, "tam phương tứ chính", ctx.options.manyMaleficThreshold);
    return [
      {
        book: "TVTH",
        label: "TVTH số 28 (Nhật Nguyệt Sửu chiếu Mệnh Mùi hoặc ngược lại)",
        cite: "TVTH tr.91–93 (số 28)",
        required: [
          samePalace(ctx, ["Thái Dương", "Thái Âm"]),
          anyOf("Nhật Nguyệt ở Sửu với Mệnh Mùi, hoặc ở Mùi với Mệnh Sửu", [
            allOf("Nhật Nguyệt Sửu, Mệnh Mùi", [starAt(ctx, "Thái Dương", ["Sửu"]), lifeAt(ctx, ["Mùi"])]),
            allOf("Nhật Nguyệt Mùi, Mệnh Sửu", [starAt(ctx, "Thái Dương", ["Mùi"]), lifeAt(ctx, ["Sửu"])]),
          ]),
        ],
        breakers: defaultGoodBreakers(ctx, ctx.life),
      },
      {
        book: "MLTC",
        label: "MLTC Thái Dương mục 4.7 (Phá Quân Thìn Tuất, Nhật Nguyệt ở Điền)",
        cite: "MLTC tr.181–221 (Thái Dương mục 4.7); tr.573–604 (Phá Quân mục 4.2)",
        required: [
          lifeHas(ctx, "Phá Quân"),
          lifeAt(ctx, ["Thìn", "Tuất"]),
          starsInPalace(["Thái Dương", "Thái Âm"], tianZhai, `Điền Trạch (${branchName(tianZhai.branch)})`),
        ],
        grade: [luckyGrade(ctx, ctx.life)],
        breakers: manyMalefic.met
          ? [withAssumption(condition(`hung sát nhiều: ${manyMalefic.label} [MLTC: thuộc mệnh bần hàn]`, true), `'hung sát nhiều' hiểu là từ ${ctx.options.manyMaleficThreshold} sao lục sát trong tam phương tứ chính (tùy chọn manyMaleficThreshold)`)]
          : [],
      },
    ];
  },
});

const thachTrungAnNgoc = definePattern({
  id: "thach-trung-an-ngoc",
  name: "Thạch trung ẩn ngọc",
  polarity: "tốt",
  source: "MLTC tr.436–472 (Cự Môn mục 4.2); TVTH tr.44–46",
  kbFile: `${KB}06_Thach-trung-an-ngoc.md`,
  variants: (ctx) => {
    const base = [lifeHas(ctx, "Cự Môn"), lifeAt(ctx, ["Tý", "Ngọ"])];
    return [
      {
        book: "MLTC",
        label: "MLTC Cự Môn mục 4.2",
        cite: "MLTC tr.436–472 (Cự Môn mục 4.2)",
        required: [...base, stemIn(ctx, ["Tân", "Quý"])],
        grade: [luckyGrade(ctx, ctx.life)],
        strengtheners: [
          anyOf("Cự Môn Hóa Quyền hoặc Hóa Lộc (hạng 1)", [transformed(ctx, "Cự Môn", "Hóa Quyền"), transformed(ctx, "Cự Môn", "Hóa Lộc")]),
          withAssumption(lifeHas(ctx, "Lộc Tồn"), "Lộc Tồn đồng cung: MLTC xếp hạng 2 (tốt), TVTH nói 'chìm' — sách mâu thuẫn"),
        ],
        breakers: [
          ...(hasStarIn(ctx.life, "Kình Dương") ? [condition("Kình Dương đồng cung Mệnh [MLTC Cự Môn mục 4.2]", true)] : []),
          ...maleficBreakers(ctx, SAT_PHA_CACH.filter((name) => name !== "Kình Dương"), ctx.life, "tam phương tứ chính", "nguyên tắc chung 00 §2 L3", "phá cách theo nguyên tắc chung (sát tinh, Hóa Kỵ trong tam phương tứ chính)"),
        ],
      },
      {
        book: "MLTC",
        label: "MLTC can Tân (Cự độc tọa, Nhật Hóa Quyền hội, Cơ miếu xung chiếu)",
        cite: "MLTC 03_Thap-thien-can-tu-hoa (can Tân)",
        required: [
          ...base,
          soleMainStar(ctx.life, "Cự Môn", "Mệnh"),
          withAssumption(inLifeGroup(ctx, ["Thái Dương"]), "'hội chiếu' hiểu là trong tam phương tứ chính Mệnh"),
          transformed(ctx, "Thái Dương", "Hóa Quyền"),
          starIn("Thiên Cơ", palaceAt(ctx.chart, ctx.life.branch + 6), "cung xung chiếu Mệnh"),
          brightnessIn(ctx, "Thiên Cơ", ["Miếu"]),
        ],
      },
      {
        book: "TVTH",
        label: "TVTH tr.44–46 (gặp Tuần Triệt hay Hóa Lộc ngọc mới lộ)",
        cite: "TVTH tr.44–46",
        required: [
          ...base,
          withAssumption(
            anyOf("gặp Tuần, Triệt hoặc Hóa Lộc", [tuanTrietAt(ctx.life, "Tuần hoặc Triệt", "Mệnh"), transformed(ctx, "Cự Môn", "Hóa Lộc")]),
            "'gặp Tuần, Triệt' hiểu là Tuần/Triệt đóng tại Mệnh; ở cách này Tuần Triệt là điều kiện thành cách, không phá",
          ),
        ],
        breakers: hasStarIn(ctx.life, "Lộc Tồn") ? [condition("Lộc Tồn đồng cung Mệnh: ngọc chìm [TVTH tr.44–46]", true)] : [],
      },
    ];
  },
});

const maDauDoiKiem = definePattern({
  id: "ma-dau-doi-kiem",
  name: "Mã đầu đới kiếm",
  polarity: "tốt",
  source: "MLTC tr.259–289 (Thiên Đồng mục 4.3); TVTH tr.75–76",
  kbFile: `${KB}07_Ma-dau-doi-kiem.md`,
  variants: (ctx) => {
    const base = [lifeAt(ctx, ["Ngọ"]), lifeHas(ctx, "Kình Dương")];
    return [
      {
        book: "MLTC",
        label: "MLTC loại 1 (Đồng Âm Kình ở Ngọ, tuổi Bính Tuất)",
        cite: "MLTC tr.259–289 (Thiên Đồng mục 4.3)",
        required: [...base, lifeHas(ctx, "Thiên Đồng"), lifeHas(ctx, "Thái Âm"), stemIn(ctx, ["Bính"]), withAssumption(yearBranchIn(ctx, ["Tuất"]), "'sinh năm Bính Tuất' hiểu là can Bính và chi Tuất")],
        grade: [luckyGrade(ctx, ctx.life)],
        breakers: unspecifiedMalefic(ctx, ctx.life, "TVTH tr.75–76", ["Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp", "Hóa Kỵ"]),
      },
      {
        book: "MLTC",
        label: "MLTC loại 2 (Tham Kình ở Ngọ, tuổi Bính Mậu)",
        cite: "MLTC tr.259–289 (Thiên Đồng mục 4.3)",
        required: [...base, lifeHas(ctx, "Tham Lang"), stemIn(ctx, ["Bính", "Mậu"])],
        strengtheners: [
          anyInScope(ctx, ["Hỏa Tinh", "Linh Tinh"], ctx.life, "đồng cung", "Mệnh"),
          anyInScope(ctx, ["Tả Phụ", "Hữu Bật"], ctx.life, "đồng cung", "Mệnh"),
        ],
        breakers: [
          ...(ctx.chart.parameters.gender === "nữ" ? [condition("nữ mệnh không nên có cách này [MLTC Thiên Đồng mục 4.3]", true)] : []),
          ...unspecifiedMalefic(ctx, ctx.life, "TVTH tr.75–76", ["Đà La", "Địa Không", "Địa Kiếp", "Hóa Kỵ"]),
        ],
      },
      {
        book: "TVTH",
        label: "TVTH tr.75–76 (Kình Ngọ gặp Khoa Quyền Lộc Tả Hữu, chính tinh đắc địa)",
        cite: "TVTH tr.75–76; tr.186–192 câu 73",
        required: [
          ...base,
          inLifeGroup(ctx, [...TAM_HOA, "Tả Phụ", "Hữu Bật"]),
          withAssumption(mainStarBrightIn(ctx.life, ["Miếu", "Vượng", "Đắc"], "Mệnh"), "'chính tinh đắc địa' hiểu là Miếu, Vượng hoặc Đắc (GA-6)"),
        ],
        strengtheners: [genderIs(ctx, "nam"), stemIn(ctx, ["Bính"]), yearBranchIn(ctx, ["Tuất"])],
        breakers: unspecifiedMalefic(ctx, ctx.life, "TVTH tr.75–76: Kình Ngọ gặp sát tinh thì chết yểu", ["Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp", "Hóa Kỵ"]),
      },
    ];
  },
});

const thamVuDongHanh = definePattern({
  id: "tham-vu-dong-hanh",
  name: "Tham Vũ đồng hành",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 3), tr.41–43; MLTC tr.222–258 (Vũ Khúc mục 4.2)",
  kbFile: `${KB}08_Tham-Vu-dong-hanh.md`,
  variants: (ctx) => {
    const thamPalace = ctx.chart.palaces.find((palace) => hasStarIn(palace, "Tham Lang"))!;
    const breakers = [
      ...(hasStarIn(thamPalace, "Hóa Kỵ")
        ? [condition(`Hóa Kỵ đồng cung Tham Lang tại ${describePalace(thamPalace)}: Tham Vũ mộ trung gặp Kỵ thì yểu [TVTH câu 50; tr.41–43]`, true)]
        : []),
      ...(transformed(ctx, "Tham Lang", "Hóa Lộc").met || transformed(ctx, "Vũ Khúc", "Hóa Lộc").met
        ? [
            condition(
              "Tham/Vũ Hóa Lộc ở tứ Mộ không phát được [TVTH câu 50]",
              true,
              "TVTH câu 50 coi Tham Vũ Hóa Lộc ở tứ Mộ là không phát; MLTC Vũ Khúc mục 4.2 lại coi cát hóa là tăng cách — sách mâu thuẫn",
            ),
          ]
        : []),
      ...maleficBreakers(
        ctx,
        (hasStarIn(thamPalace, "Hóa Kỵ") ? LUC_SAT : SAT_PHA_CACH).filter((name) => !isMinorStarAtGoodBranch(ctx, name)),
        ctx.life,
        "tam phương tứ chính",
        GENERAL_BREAK,
        "phá cách theo nguyên tắc chung 00 §2 L3: lục sát và Hóa Kỵ trong tam phương tứ chính Mệnh; Kình Dương, Không Kiếp đắc địa là hung tinh đắc cách (TVTH tr.175) nên không tính",
      ),
      ...tuanTrietBreaker(ctx, ctx.life),
    ];
    return [
      {
        book: "TVTH",
        label: "TVTH số 3",
        cite: "TVTH tr.91–93 (số 3); tr.41–43",
        required: [samePalace(ctx, ["Tham Lang", "Vũ Khúc"]), lifeHas(ctx, "Tham Lang"), lifeAt(ctx, ["Sửu", "Mùi"])],
        breakers,
      },
      {
        book: "TVTH",
        label: "TVTH lá số mẫu Tân Mão tr.175 (Tham thủ Mệnh, Vũ xung chiếu ở Thìn Tuất)",
        cite: "TVTH tr.175–176",
        required: [lifeHas(ctx, "Tham Lang"), lifeAt(ctx, ["Thìn", "Tuất"]), starIn("Vũ Khúc", palaceAt(ctx.chart, ctx.life.branch + 6), "cung xung chiếu Mệnh")],
        assumptions: ["lá số mẫu TVTH tr.175 gọi Tham (Tuất) – Vũ (Thìn) xung chiếu là 'Tham Vũ đồng hành'; định nghĩa số 3 lại đòi đồng cung"],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Vũ Khúc mục 4.2",
        cite: "MLTC tr.222–258 (Vũ Khúc mục 4.2)",
        required: [
          anyOf("Tham Vũ đồng cung ở Mệnh/Thân tại Sửu Mùi, hoặc Tham Vũ ở Thìn Tuất chia thủ Mệnh và Thân", [
            allOf("Tham Vũ đồng cung, Tham ở Mệnh hoặc Thân tại Sửu/Mùi", [
              samePalace(ctx, ["Tham Lang", "Vũ Khúc"]),
              lifeOrBodyHas(ctx, "Tham Lang"),
              starAt(ctx, "Tham Lang", ["Sửu", "Mùi"]),
            ]),
            allOf("Tham Vũ ở Thìn/Tuất, một thủ Mệnh một thủ Thân", [
              starAt(ctx, "Tham Lang", ["Thìn", "Tuất"]),
              starAt(ctx, "Vũ Khúc", ["Thìn", "Tuất"]),
              anyOf("Tham Mệnh Vũ Thân hoặc ngược lại", [
                allOf("Tham Mệnh, Vũ Thân", [lifeHas(ctx, "Tham Lang"), starInRole(ctx, "Vũ Khúc", "Thân")]),
                allOf("Vũ Mệnh, Tham Thân", [lifeHas(ctx, "Vũ Khúc"), starInRole(ctx, "Tham Lang", "Thân")]),
              ]),
            ]),
          ]),
        ],
        grade: [luckyGrade(ctx, ctx.life)],
        strengtheners: [anyOf("Tham Lang đồng cung Hỏa hoặc Linh", [samePalace(ctx, ["Tham Lang", "Hỏa Tinh"]), samePalace(ctx, ["Tham Lang", "Linh Tinh"])])],
        breakers,
      },
    ];
  },
});

const cuCoMaoDau = definePattern({
  id: "cu-co-mao-dau",
  name: "Cự Cơ Mão Dậu",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 10); MLTC tr.140–180 (Thiên Cơ mục 4.3)",
  kbFile: `${KB}09_Cu-Co-Mao-Dau.md`,
  variants: (ctx) => [
    {
      book: "TVTH",
      label: "TVTH số 10",
      cite: "TVTH tr.91–93 (số 10); tr.193–197 (câu 30)",
      required: [samePalace(ctx, ["Cự Môn", "Thiên Cơ"]), lifeHas(ctx, "Cự Môn"), lifeAt(ctx, ["Mão", "Dậu"])],
      strengtheners: [lifeAt(ctx, ["Mão"]), allInLifeGroup(ctx, ["Tả Phụ", "Hữu Bật"])],
      breakers: defaultGoodBreakers(ctx, ctx.life),
    },
    {
      book: "MLTC",
      label: "MLTC Thiên Cơ mục 4.3 (Cự Cơ đồng lâm, Mão, nam, Ất Bính Tân)",
      cite: "MLTC tr.140–180 (Thiên Cơ mục 4.3)",
      required: [
        samePalace(ctx, ["Cự Môn", "Thiên Cơ"]),
        lifeHas(ctx, "Cự Môn"),
        lifeAt(ctx, ["Mão"]),
        genderIs(ctx, "nam"),
        withAssumption(stemIn(ctx, ["Ất", "Bính", "Tân"]), "điều kiện ghi Ất, Bính, Tân; bài thơ ghi Ất, Canh, Bính — theo phần điều kiện"),
        withAssumption(
          anyInScope(ctx, ["Văn Xương", "Tả Phụ", "Hữu Bật", "Lộc Tồn", ...TAM_HOA], ctx.life, "đồng cung", "Mệnh"),
          "'gặp đồng cung Văn Xương, Tả, Hữu, Lộc, Khoa, Quyền' hiểu là có ít nhất một sao đồng cung Mệnh",
        ),
      ],
      breakers: defaultGoodBreakers(ctx, ctx.life),
    },
  ],
});

const locMaGiaoTri = definePattern({
  id: "loc-ma-giao-tri",
  name: "Lộc Mã giao trì",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 20, 50); MLTC tr.702–713 (Lộc Tồn mục 5.9)",
  kbFile: `${KB}10_Loc-Ma-giao-tri.md`,
  variants: (ctx) => {
    const sharedLocMa = ctx.chart.palaces.find((palace) => hasStarIn(palace, "Thiên Mã") && LOC_ANY.some((name) => hasStarIn(palace, name)));
    const maVoid = allOf("Thiên Mã ở Mệnh gặp Tuần/Triệt", [lifeHas(ctx, "Thiên Mã"), tuanTrietAt(ctx.life, "Tuần hoặc Triệt", "Mệnh")]);
    const breakers = [
      ...maleficBreakers(ctx, KHONG_KIEP, ctx.life, "tam phương tứ chính", "TVTH câu 10: Khoa Quyền Lộc Mã tu phòng Không Kiếp ám xung", "'ám xung' hiểu là Không/Kiếp trong tam phương tứ chính Mệnh"),
      ...maleficBreakers(ctx, ["Hóa Kỵ"], ctx.life, "tam phương tứ chính", "03_Cach-bi-pha/01: phá bởi Không, Kiếp, Tuế, Kị", "'Kị' hiểu là Hóa Kỵ trong tam phương tứ chính Mệnh"),
      ...(maVoid.met
        ? [
            condition(
              `Mã lạc Không Vong: ${maVoid.label}, Lộc Mã vô dụng [03_Cach-bi-pha/03; MLTC Thiên Mã mục 4.3]`,
              true,
              "03/03 nói Tuần Triệt phá 'Mã gặp Lộc' không nêu phạm vi và dẫn sang Mã lạc không vong: hiểu là Thiên Mã ở Mệnh có Tuần/Triệt, cùng phạm vi với cách Mã lạc không vong",
            ),
          ]
        : []),
    ];
    return [
      {
        book: "TVTH",
        label: "TVTH số 20 (Lộc Mã đồng cung ở Mệnh, Tài, Quan, Di)",
        cite: "TVTH tr.91–93 (số 20, 50); Ma Thị câu 24",
        required: [
          condition(
            `Lộc (Lộc Tồn/Hóa Lộc) đồng cung Thiên Mã${sharedLocMa ? ` tại ${describePalace(sharedLocMa)}` : ""}`,
            Boolean(sharedLocMa),
          ),
          condition(
            `cung có Lộc Mã là Mệnh, Tài Bạch, Quan Lộc hoặc Thiên Di${sharedLocMa ? ` (thực tế ${sharedLocMa.role})` : ""}`,
            Boolean(sharedLocMa && ["Mệnh", "Tài Bạch", "Quan Lộc", "Thiên Di"].includes(sharedLocMa.role)),
          ),
        ],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Lộc Tồn mục 5.9 (Lộc và Mã trong tam phương tứ chính Mệnh)",
        cite: "MLTC tr.702–713 (Lộc Tồn mục 5.9)",
        required: [inLifeGroup(ctx, LOC_ANY), inLifeGroup(ctx, ["Thiên Mã"])],
        strengtheners: [condition("Lộc Mã đồng cung", Boolean(sharedLocMa))],
        breakers,
      },
    ];
  },
  notes: [
    "Thiên Mã an theo chi năm (TVTH); MLTC bảng 13 an theo tháng sẽ cho kết quả khác (GA-7)",
    "'Tuế' phá Lộc Mã là Thái Tuế lưu niên (TVTH câu 39), chỉ xét khi luận vận hạn; Thái Tuế gốc luôn ở chi năm nên không tính phá trên lá số gốc",
  ],
});

const thamHoaThamLinh = definePattern({
  id: "tham-hoa-tham-linh",
  name: "Tham Hỏa, Tham Linh",
  polarity: "tốt",
  source: "MLTC tr.397–435 (Tham Lang mục 4.3, 4.4); TVTH tr.91–93 (số 36)",
  kbFile: `${KB}11_Tham-Hoa-Tham-Linh.md`,
  variants: (ctx) => {
    const career = palaceOf(ctx, "Quan Lộc");
    const anchor = hasStarIn(ctx.life, "Tham Lang") ? ctx.life : career;
    return [
      {
        book: "MLTC",
        label: "MLTC Tham Lang mục 4.3–4.4",
        cite: "MLTC tr.397–435 (Tham Lang mục 4.3, 4.4)",
        required: [lifeHas(ctx, "Tham Lang"), inLifeGroup(ctx, ["Hỏa Tinh", "Linh Tinh"])],
        strengtheners: [
          anyInScope(ctx, ["Hỏa Tinh", "Linh Tinh"], ctx.life, "đồng cung", "Mệnh"),
          allOf("thượng cách: Mệnh tứ mộ và có cát tinh", [lifeAt(ctx, ["Thìn", "Tuất", "Sửu", "Mùi"]), inLifeGroup(ctx, ["Lộc Tồn", ...TAM_HOA, "Tả Phụ", "Hữu Bật", "Thiên Khôi", "Thiên Việt"])]),
        ],
        breakers: maleficBreakers(ctx, ["Kình Dương", "Đà La", "Địa Không", "Địa Kiếp", "Hóa Kỵ"], ctx.life, "tam phương tứ chính", "TVTH câu 31; 00 §2 L3", "'gặp Kình Đà Không Kiếp' hiểu là trong tam phương tứ chính"),
      },
      {
        book: "TVTH",
        label: "TVTH số 36 (Tham Hỏa tương hội Tứ Mộ, Mệnh hoặc Quan)",
        cite: "TVTH tr.91–93 (số 36); tr.193–197 (câu 30, 31)",
        required: [
          anyOf("Tham Lang ở Mệnh hoặc Quan Lộc", [lifeHas(ctx, "Tham Lang"), starInRole(ctx, "Tham Lang", "Quan Lộc")]),
          palaceAtBranches(anchor, ["Thìn", "Tuất", "Sửu", "Mùi"]),
          withAssumption(anyInScope(ctx, ["Hỏa Tinh", "Linh Tinh"], anchor, "tam phương tứ chính"), "'có Tham, Hỏa hội' hiểu là Hỏa/Linh trong tam phương tứ chính của cung có Tham Lang"),
        ],
        breakers: maleficBreakers(ctx, ["Kình Dương", "Đà La", "Địa Không", "Địa Kiếp"], anchor, "tam phương tứ chính", "TVTH câu 31", "phạm vi 'gặp' không nêu: hiểu là tam phương tứ chính"),
      },
    ];
  },
});

const SAT_PHA_LIEM_THAM = ["Thất Sát", "Phá Quân", "Liêm Trinh", "Tham Lang"] as const;

const isMinorStarAtGoodBranch = (ctx: PatternContext, name: string): boolean => {
  const goodBranches = MINOR_STAR_GOOD_BRANCHES[name];
  const palace = ctx.chart.palaces.find((item) => hasStarIn(item, name));
  return Boolean(goodBranches && palace && goodBranches.includes(branchName(palace.branch)));
};

const satPhaLiemTham = definePattern({
  id: "sat-pha-liem-tham",
  name: "Sát Phá Liêm Tham",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 4); tr.97–100",
  kbFile: `${KB}12_Sat-Pha-Liem-Tham.md`,
  variants: (ctx) => {
    const anchor = SAT_PHA_LIEM_THAM.some((name) => hasStarIn(ctx.life, name)) ? ctx.life : ctx.body;
    const bright = SAT_PHA_LIEM_THAM.filter((name) => hasStarIn(anchor, name)).map((name) => brightnessIn(ctx, name, ["Miếu", "Vượng", "Đắc"]));
    return [
      {
        book: "TVTH",
        label: "TVTH tr.97–100 (thượng cách Sát Phá Liêm Tham)",
        cite: "TVTH tr.97–100",
        required: [anyOf("bộ Sát Phá Liêm Tham đóng Mệnh hoặc Thân", SAT_PHA_LIEM_THAM.flatMap((name) => [lifeHas(ctx, name), starInRole(ctx, name, "Thân")]))],
        grade: [
          allOf("thượng cách: các sao bộ này tại cung đó Miếu/Vượng/Đắc", bright.length ? bright : [condition("có sao của bộ tại cung", false)]),
          inLifeGroup(ctx, ["Tả Phụ", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Long Trì", "Phượng Các", "Hồng Loan", "Đào Hoa", ...TAM_HOA]),
        ],
        assumptions: [
          "'bộ này đóng Mệnh Thân' hiểu là ít nhất một trong Thất Sát, Phá Quân, Liêm Trinh, Tham Lang thủ Mệnh hoặc Thân (sách không nói rõ số sao)",
          "'hội cát tinh' hiểu là có ít nhất một cát tinh trong tam phương tứ chính Mệnh",
          "độ sáng và cát tinh dùng để xếp thượng cách; thiếu thì giảm cách (TVTH lá số mẫu Giáp Thìn tr.184 vẫn gọi tên cách khi Thất Sát hãm ở Dậu)",
        ],
        breakers: [
          ...maleficBreakers(
            ctx,
            ["Kình Dương", "Đà La", "Địa Không", "Địa Kiếp", "Hóa Kỵ"].filter((name) => !isMinorStarAtGoodBranch(ctx, name)),
            anchor,
            "tam phương tứ chính",
            "TVTH tr.97–100: hạ cách khi hội Kình Đà, Không Kiếp, song Hao, Hóa Kỵ",
            "danh sách 'Thiên Địa Không Sát' hiểu là Địa Không, Địa Kiếp; Kình Dương, Không Kiếp đắc địa được coi là cát (TVTH tr.97–100, tr.175) nên không tính phá",
          ),
          ...(allInScope(ctx, ["Đại Hao", "Tiểu Hao"], anchor, "tam phương tứ chính").met
            ? [condition(`song Hao (Đại Hao, Tiểu Hao) cùng trong tam phương tứ chính ${describePalace(anchor)} [TVTH tr.97–100]`, true)]
            : []),
        ],
      },
    ];
  },
});

const CO_NGUYET_DONG_LUONG = ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"] as const;

const coNguyetDongLuong = definePattern({
  id: "co-nguyet-dong-luong",
  name: "Cơ Nguyệt Đồng Lương",
  polarity: "tốt",
  source: "MLTC tr.140–180 (Thiên Cơ mục 4.2); TVTH tr.91–93, tr.97–100",
  kbFile: `${KB}13_Co-Nguyet-Dong-Luong.md`,
  variants: (ctx) => {
    const breakers = [
      ...maleficBreakers(ctx, LUC_SAT, ctx.life, "tam hợp", "MLTC Thiên Cơ mục 4.2: gặp sát tinh ắt phá cách", "'sát tinh' hiểu là lục sát trong tam hợp Mệnh"),
      ...maleficBreakers(ctx, ["Hỏa Tinh", "Linh Tinh"], ctx.life, "xung chiếu", "TVTH câu 33: tối kỵ Hỏa Linh xâm phá", "'Hỏa Linh xâm phá' hiểu là cả ở cung xung chiếu"),
    ];
    const unionHas = (name: string) => condition(`${name} ở Mệnh hoặc Thân`, hasStarIn(ctx.life, name) || hasStarIn(ctx.body, name));
    return [
      {
        book: "MLTC",
        label: "MLTC Thiên Cơ mục 4.2 (đủ bốn sao ở tam hợp Mệnh Tài Quan)",
        cite: "MLTC tr.140–180 (Thiên Cơ mục 4.2)",
        required: [allInScope(ctx, CO_NGUYET_DONG_LUONG, ctx.life, "tam hợp")],
        strengtheners: [anyInScope(ctx, ["Văn Xương", "Văn Khúc"], ctx.life, "tam hợp")],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Thiên Cơ mục 4.2 (cung Thân Mệnh gặp bốn sao)",
        cite: "MLTC tr.140–180 (Thiên Cơ mục 4.2)",
        required: [allOf("đủ bốn sao ở Mệnh và Thân", CO_NGUYET_DONG_LUONG.map(unionHas))],
        assumptions: ["'cung Thân Mệnh gặp bốn sao này' hiểu là bốn sao nằm trong hai cung Mệnh và Thân"],
        breakers,
      },
    ];
  },
});

const cuNhatDongCung = definePattern({
  id: "cu-nhat-dong-cung",
  name: "Cự Nhật đồng cung",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 9); MLTC tr.181–221 (Thái Dương mục 4.1)",
  kbFile: `${KB}14_Cu-Nhat.md`,
  variants: (ctx) => {
    const base = [samePalace(ctx, ["Cự Môn", "Thái Dương"]), lifeHas(ctx, "Thái Dương")];
    const breakers = maleficBreakers(ctx, LUC_SAT, ctx.life, "tam phương tứ chính", "MLTC Thái Dương mục 4.1", "phạm vi tứ sát, Không Kiếp hiểu là tam phương tứ chính");
    return [
      {
        book: "TVTH",
        label: "TVTH số 9",
        cite: "TVTH tr.91–93 (số 9); tr.102–103",
        required: [...base, lifeAt(ctx, ["Dần", "Thân"])],
        strengtheners: [lifeAt(ctx, ["Dần"]), stemIn(ctx, ["Giáp", "Canh"])],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Thái Dương mục 4.1 (Mệnh Dần)",
        cite: "MLTC tr.181–221 (Thái Dương mục 4.1)",
        required: [...base, lifeAt(ctx, ["Dần"])],
        grade: [luckyGrade(ctx, ctx.life)],
        strengtheners: [stemIn(ctx, ["Canh", "Tân", "Quý"])],
        breakers,
      },
    ];
  },
});

const thatSatTrieuDau = definePattern({
  id: "that-sat-trieu-dau",
  name: "Thất Sát triều đẩu, ngưỡng đẩu",
  polarity: "tốt",
  source: "MLTC tr.538–572 (Thất Sát mục 4.1); TVTH tr.91–93 (số 34, 35)",
  kbFile: `${KB}15_That-Sat-trieu-dau-nguong-dau.md`,
  variants: (ctx) => {
    const breakers = unspecifiedMalefic(ctx, ctx.life, "MLTC Thất Sát mục 4.1: có cả cát lẫn sát thì thành bại tức khắc");
    return [
      {
        book: "TVTH",
        label: "TVTH số 34–35 (triều đẩu Dần Thân, ngưỡng đẩu Ngọ)",
        cite: "TVTH tr.91–93 (số 34, 35)",
        required: [lifeHas(ctx, "Thất Sát"), lifeAt(ctx, ["Dần", "Thân", "Ngọ"])],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Thất Sát mục 4.1 (triều đẩu Thân Ngọ, ngưỡng đẩu Dần Tý)",
        cite: "MLTC tr.538–572 (Thất Sát mục 4.1)",
        required: [lifeHas(ctx, "Thất Sát"), lifeAt(ctx, ["Tý", "Ngọ", "Dần", "Thân"])],
        grade: [luckyGrade(ctx, ctx.life)],
        strengtheners: [inLifeGroup(ctx, ["Tử Vi", "Thiên Phủ"])],
        breakers,
      },
    ];
  },
});

const consecutiveTransformations = (ctx: PatternContext): Condition => {
  const branches = TAM_HOA.map((name) => ctx.chart.palaces.find((palace) => hasStarIn(palace, name))?.branch);
  if (branches.some((branch) => branch === undefined)) return condition("đủ ba Hóa Lộc, Quyền, Khoa trên lá số", false);
  const present = branches as readonly number[];
  const consecutive = Array.from({ length: 12 }, (_, start) => start).find((start) =>
    present.every((branch) => [0, 1, 2].includes(mod(branch - start, 12))),
  );
  const distinct = new Set(present).size === 3;
  const met = consecutive !== undefined && distinct && present.includes(ctx.life.branch);
  return condition(`Khoa Quyền Lộc đi liền 3 cung, Mệnh có 1 Hóa (Hóa tại ${present.map(branchName).join(", ")})`, met);
};

const tamHoaLienChau = definePattern({
  id: "tam-hoa-lien-chau",
  name: "Tam Hóa liên châu",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 12, 26); MLTC tr.720–734 (Hóa Lộc mục 4.1)",
  kbFile: `${KB}16_Tam-hoa-lien-chau.md`,
  variants: (ctx) => {
    const breakers = [
      ...maleficBreakers(ctx, LUC_SAT, ctx.life, "tam phương tứ chính", "MLTC Hóa Lộc mục 4.1: gặp lục sát thì bình thường"),
      ...(mainStarBrightIn(ctx.life, ["Hãm"]).met ? [condition("chính tinh Mệnh hãm địa: giảm xuống bình thường [MLTC Hóa Lộc mục 4.1]", true)] : []),
      ...(khongVongAt(ctx, ctx.life, "Mệnh").met ? [withAssumption(condition(`${khongVongAt(ctx, ctx.life, "Mệnh").label} [MLTC Hóa Lộc mục 4.1]`, true), khongVongAt(ctx, ctx.life).assumption!)] : []),
    ];
    return [
      {
        book: "MLTC",
        label: "MLTC Hóa Lộc mục 4.1 / TVTH số 26 (Tam kỳ gia hội, Tam Hóa triều)",
        cite: "MLTC tr.720–734 (Hóa Lộc mục 4.1); TVTH tr.91–93 (số 26)",
        required: [allInLifeGroup(ctx, TAM_HOA)],
        strengtheners: [withAssumption(mainStarBrightIn(ctx.life, strongLevels(ctx.options), "Mệnh"), strongAssumption(ctx.options))],
        breakers,
      },
      {
        book: "TVTH",
        label: "TVTH số 12 (Khoa Quyền Lộc đi liền 3 cung)",
        cite: "TVTH tr.91–93 (số 12)",
        required: [consecutiveTransformations(ctx)],
        assumptions: ["'đi liền 3 cung' hiểu là ba Hóa ở ba cung kế tiếp nhau (thứ tự bất kỳ) và Mệnh là một trong ba cung đó"],
        breakers,
      },
    ];
  },
});

const vanQueVanHoa = definePattern({
  id: "van-que-van-hoa",
  name: "Văn Quế Văn Hoa",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 13); MLTC tr.605–619 (Văn Xương mục 5.1)",
  kbFile: `${KB}17_Van-que-van-hoa.md`,
  variants: (ctx) => {
    const breakers = [
      ...tuanTrietBreaker(ctx, ctx.life, "TVTH tr.55–56: gặp Tuần Triệt công danh trắc trở"),
      ...unspecifiedMalefic(ctx, ctx.life, "MLTC Văn Xương mục 5.1: gia hội hung sát là phá cách"),
    ];
    return [
      {
        book: "TVTH",
        label: "TVTH số 13",
        cite: "TVTH tr.91–93 (số 13); tr.193–197 (câu 47)",
        required: [samePalace(ctx, ["Văn Xương", "Văn Khúc"]), lifeHas(ctx, "Văn Xương"), lifeAt(ctx, ["Sửu", "Mùi"])],
        strengtheners: [allInLifeGroup(ctx, TAM_HOA)],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Văn Xương mục 5.1",
        cite: "MLTC tr.605–619 (Văn Xương mục 5.1)",
        required: [
          anyOf("Xương Khúc đồng cung ở Mệnh/Thân tại Sửu Mùi, hoặc ở cung đối của Mệnh Sửu/Mùi", [
            allOf("loại 1: Xương Khúc đồng cung ở Mệnh hoặc Thân", [samePalace(ctx, ["Văn Xương", "Văn Khúc"]), lifeOrBodyHas(ctx, "Văn Xương"), starAt(ctx, "Văn Xương", ["Sửu", "Mùi"])]),
            allOf("loại 2: Mệnh Sửu, Xương Khúc ở Mùi", [lifeAt(ctx, ["Sửu"]), starAt(ctx, "Văn Xương", ["Mùi"]), starAt(ctx, "Văn Khúc", ["Mùi"])]),
            allOf("loại 3: Mệnh Mùi, Xương Khúc ở Sửu", [lifeAt(ctx, ["Mùi"]), starAt(ctx, "Văn Xương", ["Sửu"]), starAt(ctx, "Văn Khúc", ["Sửu"])]),
          ]),
        ],
        grade: [luckyGrade(ctx, ctx.life)],
        breakers,
      },
    ];
  },
});

const minhLocAmLoc = definePattern({
  id: "minh-loc-am-loc",
  name: "Minh lộc ám lộc",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 47), tr.58; MLTC tr.702–713 (Lộc Tồn mục 5.10)",
  kbFile: `${KB}18_Minh-loc-am-loc.md`,
  variants: (ctx) => {
    const hidden = palaceAt(ctx.chart, sixCombinationPartner(ctx.life.branch));
    const hiddenLabel = `cung nhị hợp với Mệnh (${branchName(hidden.branch)})`;
    return [
      {
        book: "TVTH",
        label: "TVTH số 47 (Lộc ở Mệnh, Lộc kia ở cung nhị hợp)",
        cite: "TVTH tr.91–93 (số 47); tr.58",
        required: [
          anyOf("Lộc Tồn ở Mệnh và Hóa Lộc ở cung nhị hợp, hoặc ngược lại", [
            allOf("Lộc Tồn Mệnh, Hóa Lộc ám hợp", [lifeHas(ctx, "Lộc Tồn"), starIn("Hóa Lộc", hidden, hiddenLabel)]),
            allOf("Hóa Lộc Mệnh, Lộc Tồn ám hợp", [lifeHas(ctx, "Hóa Lộc"), starIn("Lộc Tồn", hidden, hiddenLabel)]),
          ]),
        ],
        strengtheners: [lifeAt(ctx, ["Dần"]), condition("cung nhị hợp là Điền Trạch (MLTC: tổ hợp tốt nhất)", hidden.role === "Điền Trạch")],
        breakers: defaultGoodBreakers(ctx, ctx.life),
      },
    ];
  },
});

const tuLinh = definePattern({
  id: "tu-linh",
  name: "Tứ Linh",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 44); NP1 Hoa Cái tr.35–40",
  kbFile: `${KB}19_Tu-linh.md`,
  variants: (ctx) => [
    {
      book: "TVTH",
      label: "TVTH số 44 (Tứ Linh triều mệnh)",
      cite: "TVTH tr.91–93 (số 44); tr.62; tr.65",
      required: [
        withAssumption(mainStarBrightIn(ctx.life, strongLevels(ctx.options), "Mệnh"), strongAssumption(ctx.options)),
        withAssumption(allInLifeGroup(ctx, ["Long Trì", "Phượng Các", "Hoa Cái", "Bạch Hổ"]), "'Cái Hổ Phượng Long hội' hiểu là đủ bốn sao trong tam phương tứ chính Mệnh"),
      ],
      breakers: [
        ...(["Long Trì", "Phượng Các"].some((name) => ctx.chart.palaces.some((palace) => hasStarIn(palace, name) && KHONG_KIEP.some((bad) => hasStarIn(palace, bad))))
          ? [condition("Long Trì/Phượng Các đồng cung Không Kiếp [TVTH tr.62]", true)]
          : []),
        ...maleficBreakers(ctx, SAT_PHA_CACH, ctx.life, "tam phương tứ chính", "00 §2 L3", "phá cách theo nguyên tắc chung; Tứ Linh không sợ Tuần Triệt (NP1)"),
      ],
    },
  ],
  notes: ["Thành phần Tứ Linh theo NP1 khác TVTH (thêm Thanh Long, Giải Thần...) và điều kiện tuổi âm của NP1 không kiểm được; chỉ dùng thành phần TVTH"],
});

const hoHamKiem = definePattern({
  id: "ho-ham-kiem",
  name: "Hổ hàm kiếm",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 48); tr.81–82",
  kbFile: `${KB}20_Ho-ham-kiem.md`,
  variants: (ctx) => [
    {
      book: "TVTH",
      label: "TVTH số 48 (Thiên Hình ở Mệnh tại Dần)",
      cite: "TVTH tr.91–93 (số 48); tr.81–82",
      required: [lifeHas(ctx, "Thiên Hình"), lifeAt(ctx, ["Dần"])],
      strengtheners: [inLifeGroup(ctx, ["Tướng Quân", "Quốc Ấn", "Phục Binh"])],
      breakers: tuanTrietBreaker(ctx, ctx.life, "TVTH tr.81–82: Hình đắc cách gặp Tuần Triệt như kiếm báu không dùng được"),
    },
  ],
  notes: ["Thiên Hình ở Thân, Mão, Dậu cũng là 'đắc cách' (TVTH tr.81–82) nhưng sách không gọi là Hổ hàm kiếm; không tính"],
});

const chungThuyTrieuDong = definePattern({
  id: "chung-thuy-trieu-dong",
  name: "Chúng thủy triều đông",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 49), tr.79; MLTC tr.573–604 (Phá Quân mục 4.4)",
  kbFile: `${KB}21_Chung-thuy-trieu-dong.md`,
  variants: (ctx) => [
    {
      book: "TVTH",
      label: "TVTH số 49 (Mệnh Mão Dậu có song Hao)",
      cite: "TVTH tr.91–93 (số 49); tr.79",
      required: [
        lifeAt(ctx, ["Mão", "Dậu"]),
        anyOf("Đại Hao hoặc Tiểu Hao ở Mệnh", [lifeHas(ctx, "Đại Hao"), lifeHas(ctx, "Tiểu Hao")]),
        allInScope(ctx, ["Đại Hao", "Tiểu Hao"], ctx.life, "tam phương tứ chính"),
      ],
      assumptions: ["Đại Hao và Tiểu Hao (vòng Bác Sĩ) luôn xung chiếu nhau nên không thể đồng cung: 'Mệnh có song Hao' hiểu là một Hao thủ Mệnh, Hao kia xung chiếu"],
      strengtheners: [anyOf("Thiên Cơ hoặc Cự Môn đóng Mệnh", [lifeHas(ctx, "Thiên Cơ"), lifeHas(ctx, "Cự Môn")])],
      breakers: hasStarIn(ctx.life, "Hóa Lộc") ? [condition("Hóa Lộc ở Mệnh: trở nên kém hẳn [TVTH tr.79]", true)] : [],
    },
    {
      book: "MLTC",
      label: "MLTC Phá Quân mục 4.4 (Phá Quân với Xương/Khúc ở Mão Dậu)",
      cite: "MLTC tr.573–604 (Phá Quân mục 4.4)",
      required: [lifeHas(ctx, "Phá Quân"), lifeAt(ctx, ["Mão", "Dậu"]), anyOf("Văn Xương hoặc Văn Khúc đồng cung Mệnh", [lifeHas(ctx, "Văn Xương"), lifeHas(ctx, "Văn Khúc")])],
      assumptions: ["Xương Khúc chỉ đồng cung được ở Sửu Mùi nên 'Phá Quân đồng cung Xương Khúc ở Mão Dậu' hiểu là Xương hoặc Khúc"],
      strengtheners: [anyOf("Xương hoặc Khúc Hóa Khoa", [transformed(ctx, "Văn Xương", "Hóa Khoa"), transformed(ctx, "Văn Khúc", "Hóa Khoa")]), inLifeGroup(ctx, ["Lộc Tồn"])],
      breakers: [
        ...maleficBreakers(ctx, ["Hóa Kỵ"], ctx.life, "tam phương tứ chính", "MLTC Phá Quân mục 4.4: gặp Kị tinh dễ thủy ách"),
        ...(countInScope(ctx, LUC_SAT, ctx.life, "tam phương tứ chính", ctx.options.manyMaleficThreshold).met
          ? [withAssumption(condition("nhiều sát tinh thì bình thường [MLTC Phá Quân mục 4.4]", true), `'nhiều' hiểu là từ ${ctx.options.manyMaleficThreshold} sao lục sát trong tam phương tứ chính`)]
          : []),
      ],
    },
  ],
});

const LIFE_STAGE_TABLE: Readonly<Record<string, { readonly bai: BranchName; readonly tuyet: BranchName }>> = {
  Kim: { bai: "Ngọ", tuyet: "Dần" },
  Mộc: { bai: "Tý", tuyet: "Thân" },
  Hỏa: { bai: "Mão", tuyet: "Hợi" },
  Thủy: { bai: "Dậu", tuyet: "Tỵ" },
  Thổ: { bai: "Dậu", tuyet: "Tỵ" },
};

const tuyetXuPhungSinh = definePattern({
  id: "tuyet-xu-phung-sinh",
  name: "Tuyệt xứ phùng sinh",
  polarity: "tốt",
  source: "TVTH tr.94; MLTC tr.862–864",
  kbFile: `${KB}22_Tuyet-xu-phung-sinh.md`,
  variants: (ctx) => {
    const element = ctx.chart.natalNayin.element;
    const stage = LIFE_STAGE_TABLE[element]!;
    return [
      {
        book: "TVTH",
        label: "TVTH tr.94 (Mệnh ở Bại/Tuyệt của hành bản mệnh, gặp Tam hóa)",
        cite: "TVTH tr.94",
        required: [
          condition(`Mệnh ở Bại (${stage.bai}) hoặc Tuyệt (${stage.tuyet}) của hành ${element}`, [stage.bai, stage.tuyet].includes(branchName(ctx.life.branch))),
          anyOf("được cứu giải", [
            allInLifeGroup(ctx, TAM_HOA),
            allOf("quý tinh Tử Vi/Thiên Phủ thủ Mệnh có Khôi Việt hội (lá số mẫu TVTH tr.182–183)", [
              anyOf("Tử Vi hoặc Thiên Phủ thủ Mệnh", [lifeHas(ctx, "Tử Vi"), lifeHas(ctx, "Thiên Phủ")]),
              inLifeGroup(ctx, ["Thiên Khôi", "Thiên Việt"]),
            ]),
            countInScope(ctx, BAN_CACH_CAT, ctx.life, "tam phương tứ chính", ctx.options.minLuckyCount + 1),
          ]),
        ],
        assumptions: [
          "đường cứu gồm: Tam hóa hội (đủ Lộc, Quyền, Khoa trong tam phương tứ chính Mệnh, TVTH tr.94); quý cách Tử Phủ thủ Mệnh có Khôi/Việt hội như lá số mẫu TVTH tr.182–183; hoặc 'nhiều cát tinh hỗ trợ' (MLTC tr.862–864)",
          `'nhiều cát tinh' hiểu là từ ${ctx.options.minLuckyCount + 1} sao cát (Lộc Tồn, tam Hóa, lục cát) trong tam phương tứ chính Mệnh`,
          "đường 'chính diệu sinh bản mệnh theo ngũ hành' chưa xét (cần bảng hành sao)",
        ],
        breakers: defaultGoodBreakers(ctx, ctx.life),
      },
    ];
  },
});

const kimDuPhuGia = definePattern({
  id: "kim-du-phu-gia",
  name: "Kim dư phù giá",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 30); MLTC tr.92–139 (Tử Vi mục 4.7)",
  kbFile: `${KB}23_Kim-du-phu-gia.md`,
  variants: (ctx) => {
    const ziwei = ctx.chart.palaces.find((palace) => hasStarIn(palace, "Tử Vi"))!;
    return [
      {
        book: "TVTH",
        label: "TVTH số 30 (Tử Vi ở Mệnh/Quan, giáp Tả Hữu hoặc Thiếu Dương Thiếu Âm)",
        cite: "TVTH tr.91–93 (số 30)",
        required: [
          anyOf("Tử Vi ở Mệnh hoặc Quan Lộc", [lifeHas(ctx, "Tử Vi"), starInRole(ctx, "Tử Vi", "Quan Lộc")]),
          anyOf("cung Tử Vi được giáp", [flankedBy(ctx, "Tả Phụ", "Hữu Bật", ziwei, "cung Tử Vi"), flankedBy(ctx, "Thiếu Dương", "Thiếu Âm", ziwei, "cung Tử Vi")]),
        ],
        assumptions: ["'giáp Tả Hữu, Thiếu Dương, Thiếu Âm' hiểu là giáp một trong hai cặp"],
        breakers: maleficBreakers(ctx, TU_SAT, ziwei, "tam phương tứ chính", "Tử Vi bị tứ sát công chiếu (02_Cach-xau/16)"),
      },
      {
        book: "MLTC",
        label: "MLTC Tử Vi mục 4.7 (giáp Nhật Nguyệt)",
        cite: "MLTC tr.92–139 (Tử Vi mục 4.7)",
        required: [lifeHas(ctx, "Tử Vi"), flankedBy(ctx, "Thái Dương", "Thái Âm", ctx.life, "Mệnh")],
        breakers: maleficBreakers(ctx, TU_SAT, ctx.life, "tam phương tứ chính", "02_Cach-xau/16"),
      },
    ];
  },
  notes: ["MLTC tự nhận Nhật Nguyệt không thể cùng giáp cung Tử Vi nên biến thể MLTC không bao giờ khớp"],
});

const nguyetLangThienMon = definePattern({
  id: "nguyet-lang-thien-mon",
  name: "Nguyệt lãng thiên môn",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 24); MLTC tr.360–396 (Thái Âm mục 4.5)",
  kbFile: `${KB}24_Nguyet-lang-thien-mon.md`,
  variants: (ctx) => {
    const base = [lifeHas(ctx, "Thái Âm"), lifeAt(ctx, ["Hợi"])];
    return [
      {
        book: "TVTH",
        label: "TVTH số 24",
        cite: "TVTH tr.91–93 (số 24)",
        required: base,
        breakers: maleficBreakers(ctx, ["Địa Không", "Địa Kiếp", "Thiên Hình", "Hóa Kỵ"], ctx.life, "tam phương tứ chính", "NP1 Cách xem hạn", "NP1 không nêu phạm vi: hiểu là tam phương tứ chính"),
      },
      {
        book: "MLTC",
        label: "MLTC Thái Âm mục 4.5 (sinh ban đêm)",
        cite: "MLTC tr.360–396 (Thái Âm mục 4.5)",
        required: [...base, isNighttime(ctx)],
        grade: [luckyGrade(ctx, ctx.life)],
        strengtheners: [starsInPalace(["Thái Âm", "Văn Xương", "Văn Khúc"], ctx.life, "Mệnh"), stemIn(ctx, ["Ất", "Bính", "Mậu"])],
        breakers: maleficBreakers(ctx, LUC_SAT, ctx.life, "đồng cung", "MLTC Thái Âm mục 4.5: cung Mệnh có sát tinh là phá cách", "'sát tinh' hiểu là lục sát"),
      },
    ];
  },
});

const starsIn4 = (ctx: PatternContext): readonly string[] =>
  ["Văn Xương", "Văn Khúc", "Tả Phụ", "Hữu Bật"].filter((name) => allInLifeGroup(ctx, [name]).met);

const nhatLeTrungThien = definePattern({
  id: "nhat-le-trung-thien",
  name: "Nhật lệ trung thiên",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 22); MLTC tr.181–221 (Thái Dương mục 4.2)",
  kbFile: `${KB}25_Nhat-le-trung-thien.md`,
  variants: (ctx) => {
    const base = [lifeHas(ctx, "Thái Dương"), lifeAt(ctx, ["Ngọ"])];
    const breakers = [
      ...maleficBreakers(ctx, KHONG_KIEP, ctx.life, "tam phương tứ chính", "MLTC Thái Dương mục 4.2: gặp Không Kiếp giảm toàn mỹ", "phạm vi Không Kiếp hiểu là tam phương tứ chính"),
      ...(starsIn4(ctx).length === 0
        ? [withAssumption(condition("không gặp Xương Khúc Tả Hữu: tính toàn mỹ giảm rất lớn [MLTC Thái Dương mục 4.2]", true), "'không gặp Xương Khúc Tả Hữu' hiểu là không có sao nào trong bốn sao ở tam phương tứ chính")]
        : []),
    ];
    return [
      {
        book: "TVTH",
        label: "TVTH số 22",
        cite: "TVTH tr.91–93 (số 22); tr.28–30",
        required: base,
        strengtheners: [stemIn(ctx, ["Canh", "Nhâm"]), isDaytime(ctx)],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Thái Dương mục 4.2 (Kim xán quang huy)",
        cite: "MLTC tr.181–221 (Thái Dương mục 4.2)",
        required: [...base, soleMainStar(ctx.life, "Thái Dương", "Mệnh")],
        grade: [luckyGrade(ctx, ctx.life)],
        strengtheners: [stemIn(ctx, ["Canh", "Tân"])],
        breakers,
      },
    ];
  },
});

const phuBatCungDe = definePattern({
  id: "phu-bat-cung-de",
  name: "Phụ Bật củng đế",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 31); MLTC tr.92–139 (Tử Vi mục 4.4)",
  kbFile: `${KB}26_Phu-Bat-cung-de.md`,
  variants: (ctx) => {
    const ziwei = ctx.chart.palaces.find((palace) => hasStarIn(palace, "Tử Vi"))!;
    return [
      {
        book: "TVTH",
        label: "TVTH số 31",
        cite: "TVTH tr.91–93 (số 31)",
        required: [
          anyOf("Tử Vi ở Mệnh hoặc Quan Lộc", [lifeHas(ctx, "Tử Vi"), starInRole(ctx, "Tử Vi", "Quan Lộc")]),
          allInScope(ctx, ["Tả Phụ", "Hữu Bật"], ziwei, "tam phương tứ chính", "cung Tử Vi"),
        ],
        breakers: maleficBreakers(ctx, SAT_PHA_CACH, ziwei, "tam phương tứ chính", "MLTC Tử Vi mục 4.5", "phá cách theo quy tắc chung của Tử Vi (MLTC mục 4.5)"),
      },
      {
        book: "MLTC",
        label: "MLTC Tử Vi mục 4.4",
        cite: "MLTC tr.92–139 (Tử Vi mục 4.4)",
        required: [lifeHas(ctx, "Tử Vi"), allInLifeGroup(ctx, ["Tả Phụ", "Hữu Bật"])],
        breakers: maleficBreakers(ctx, SAT_PHA_CACH, ctx.life, "tam phương tứ chính", "MLTC Tử Vi mục 4.5"),
      },
    ];
  },
});

const taHuuDongCung = definePattern({
  id: "ta-huu-dong-cung",
  name: "Tả Hữu đồng cung",
  polarity: "tốt",
  source: "MLTC tr.629–637 (Tả Phù mục 5); TVTH tr.91–93 (số 11, 38)",
  kbFile: `${KB}27_Ta-Huu-dong-cung.md`,
  variants: (ctx) => {
    const breakers = countInScope(ctx, LUC_SAT, ctx.life, "tam phương tứ chính", ctx.options.manyMaleficThreshold).met
      ? [withAssumption(condition("tam phương nhiều hung tinh: chỉ bình thường [MLTC Tả Phù mục 5]", true), `'nhiều hung tinh' hiểu là từ ${ctx.options.manyMaleficThreshold} sao lục sát trong tam phương tứ chính`)]
      : [];
    return [
      {
        book: "TVTH",
        label: "TVTH số 11 (Tả Hữu đồng cung ở Mệnh hoặc Thân)",
        cite: "TVTH tr.91–93 (số 11, 38); Ma Thị câu 20",
        required: [samePalace(ctx, ["Tả Phụ", "Hữu Bật"]), lifeOrBodyHas(ctx, "Tả Phụ")],
        breakers: [
          ...breakers,
          ...maleficBreakers(
            ctx,
            SAT_PHA_CACH,
            ctx.life,
            "tam phương tứ chính",
            GENERAL_BREAK,
            "TVTH số 11 không nêu phá cách: áp nguyên tắc chung 00 §2 L3 (lục sát, Hóa Kỵ trong tam phương tứ chính)",
          ),
        ],
      },
      {
        book: "MLTC",
        label: "MLTC Tả Phù mục 5 (Sửu Mùi, có cát tinh gia hội)",
        cite: "MLTC tr.629–637 (Tả Phù mục 5)",
        required: [samePalace(ctx, ["Tả Phụ", "Hữu Bật"]), lifeOrBodyHas(ctx, "Tả Phụ"), starAt(ctx, "Tả Phụ", ["Sửu", "Mùi"])],
        grade: [luckyGrade(ctx, ctx.life, BAN_CACH_CAT.filter((name) => name !== "Tả Phụ" && name !== "Hữu Bật"))],
        breakers,
      },
    ];
  },
});

const thienAtQuyNhan = definePattern({
  id: "thien-at-quy-nhan",
  name: "Thiên Ất quý nhân",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 16, 45); MLTC tr.643–649 (Thiên Khôi mục 5.1)",
  kbFile: `${KB}28_Thien-At-quy-nhan.md`,
  variants: (ctx) => {
    const many = countInScope(ctx, SAT_PHA_CACH, ctx.life, "tam phương tứ chính", ctx.options.manyMaleficThreshold);
    const breakers = many.met
      ? [withAssumption(condition(`Khôi Việt hung xung: ${many.label} [MLTC Thiên Khôi mục 5.2]`, true), `'nhiều sao hung sát' hiểu là từ ${ctx.options.manyMaleficThreshold} sao lục sát/Hóa Kỵ trong tam phương tứ chính`)]
      : [];
    const pairWith = (other: "Phu Thê" | "Thiên Di") =>
      anyOf(`một sao Khôi/Việt ở Mệnh, sao kia ở ${other}`, [
        allOf("Khôi Mệnh", [lifeHas(ctx, "Thiên Khôi"), starInRole(ctx, "Thiên Việt", other)]),
        allOf("Việt Mệnh", [lifeHas(ctx, "Thiên Việt"), starInRole(ctx, "Thiên Khôi", other)]),
      ]);
    return [
      {
        book: "TVTH",
        label: "TVTH số 45 (Tọa quý hướng quý)",
        cite: "TVTH tr.91–93 (số 45)",
        required: [
          anyOf("Khôi hoặc Việt thủ Mệnh, sao kia chiếu", [
            allOf("Khôi thủ Mệnh, Việt chiếu", [lifeHas(ctx, "Thiên Khôi"), inLifeGroup(ctx, ["Thiên Việt"])]),
            allOf("Việt thủ Mệnh, Khôi chiếu", [lifeHas(ctx, "Thiên Việt"), inLifeGroup(ctx, ["Thiên Khôi"])]),
          ]),
        ],
        assumptions: ["'chiếu' hiểu là sao kia nằm trong tam phương tứ chính Mệnh"],
        breakers,
      },
      {
        book: "TVTH",
        label: "TVTH số 16 (Khôi Việt chiếu Mệnh)",
        cite: "TVTH tr.91–93 (số 16)",
        required: [allInLifeGroup(ctx, ["Thiên Khôi", "Thiên Việt"])],
        assumptions: ["'chiếu mệnh' hiểu là cả Khôi và Việt trong tam phương tứ chính Mệnh"],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Thiên Khôi mục 5.1 (Thiên Ất củng Mệnh)",
        cite: "MLTC tr.643–649 (Thiên Khôi mục 5.1)",
        required: [
          anyOf("Khôi Việt chia Mệnh với Phu Thê hoặc Thiên Di", [pairWith("Phu Thê"), pairWith("Thiên Di")]),
          withAssumption(mainStarBrightIn(ctx.life, strongLevels(ctx.options), "Mệnh"), strongAssumption(ctx.options)),
        ],
        grade: [luckyGrade(ctx, ctx.life, BAN_CACH_CAT.filter((name) => name !== "Thiên Khôi" && name !== "Thiên Việt"))],
        strengtheners: [condition("cung Thân ở Thiên Di", ctx.body.role === "Thiên Di")],
        breakers,
      },
    ];
  },
});

const nhatChieuLoiMon = definePattern({
  id: "nhat-chieu-loi-mon",
  name: "Nhật chiếu lôi môn",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 23); MLTC tr.181–221 (Thái Dương mục 4.3)",
  kbFile: `${KB}29_Nhat-chieu-loi-mon.md`,
  variants: (ctx) => {
    const base = [lifeHas(ctx, "Thái Dương"), lifeAt(ctx, ["Mão"])];
    const breakers = unspecifiedMalefic(ctx, ctx.life, "MLTC Thái Dương mục 4.3: gia sát tinh là phá cách");
    return [
      {
        book: "TVTH",
        label: "TVTH số 23",
        cite: "TVTH tr.91–93 (số 23)",
        required: base,
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Thái Dương mục 4.3 (Nhật xuất phù tang, sinh ban ngày)",
        cite: "MLTC tr.181–221 (Thái Dương mục 4.3)",
        required: [...base, samePalace(ctx, ["Thái Dương", "Thiên Lương"]), isDaytime(ctx)],
        grade: [luckyGrade(ctx, ctx.life, ["Lộc Tồn", ...TAM_HOA, "Tả Phụ", "Hữu Bật", "Văn Xương", "Văn Khúc"])],
        strengtheners: [stemIn(ctx, ["Kỷ", "Ất", "Nhâm", "Tân"])],
        breakers,
      },
    ];
  },
});

const minhChauXuatHai = definePattern({
  id: "minh-chau-xuat-hai",
  name: "Minh châu xuất hải",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 39); MLTC tr.181–221 (Thái Dương mục 4.6), tr.259–289 (Thiên Đồng mục 4.2)",
  kbFile: `${KB}30_Minh-chau-xuat-hai.md`,
  variants: (ctx) => {
    const breakers = defaultGoodBreakers(ctx, ctx.life);
    const tianZhai = palaceOf(ctx, "Điền Trạch");
    return [
      {
        book: "MLTC",
        label: "MLTC Thái Dương mục 4.6 (Mệnh Mùi VCD, Nhật Mão, Nguyệt Hợi)",
        cite: "MLTC tr.181–221 (Thái Dương mục 4.6)",
        required: [lifeAt(ctx, ["Mùi"]), voidOfMain(ctx.life, "Mệnh"), starAt(ctx, "Thái Dương", ["Mão"]), starAt(ctx, "Thái Âm", ["Hợi"])],
        grade: [luckyGrade(ctx, ctx.life)],
        breakers,
      },
      {
        book: "TVTH",
        label: "TVTH số 39 (Nguyệt sinh thương hải: Thái Âm ở Tý)",
        cite: "TVTH tr.91–93 (số 39); tr.39–40",
        required: [withAssumption(lifeHas(ctx, "Thái Âm"), "'Nguyệt tại Tí' hiểu là Thái Âm thủ Mệnh tại Tý"), lifeAt(ctx, ["Tý"])],
        strengtheners: [stemIn(ctx, ["Bính", "Đinh"])],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Thiên Đồng mục 4.2 (Đồng Âm ở Tý thủ Mệnh hoặc Điền)",
        cite: "MLTC tr.259–289 (Thiên Đồng mục 4.2)",
        required: [
          samePalace(ctx, ["Thiên Đồng", "Thái Âm"]),
          anyOf("Đồng Âm ở Mệnh hoặc Điền Trạch tại Tý", [
            allOf("Mệnh Tý", [lifeHas(ctx, "Thái Âm"), lifeAt(ctx, ["Tý"])]),
            allOf("Điền Trạch Tý", [starIn("Thái Âm", tianZhai, "Điền Trạch"), roleAt(ctx, "Điền Trạch", ["Tý"])]),
          ]),
        ],
        grade: [luckyGrade(ctx, ctx.life)],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC can Quý (Cự Đồng Sửu Mùi, Cự Hóa Quyền)",
        cite: "MLTC 03_Thap-thien-can-tu-hoa (can Quý)",
        required: [samePalace(ctx, ["Cự Môn", "Thiên Đồng"]), lifeHas(ctx, "Cự Môn"), starAt(ctx, "Cự Môn", ["Sửu", "Mùi"]), transformed(ctx, "Cự Môn", "Hóa Quyền"), stemIn(ctx, ["Quý"])],
        assumptions: ["sách không nói Cự Đồng phải thủ Mệnh: hiểu là thủ Mệnh"],
        breakers,
      },
    ];
  },
});

const songLoc = definePattern({
  id: "song-loc",
  name: "Song Lộc",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 25); MLTC tr.702–713 (Lộc Tồn mục 5.3, 5.6, 5.7)",
  kbFile: `${KB}31_Song-Loc.md`,
  variants: (ctx) => {
    const locPalaces = ctx.chart.palaces.filter((palace) => LOC_ANY.some((name) => hasStarIn(palace, name)));
    const breakers = locPalaces.flatMap((palace) => [
      ...(KHONG_KIEP.every((name) => hasStarIn(palace, name)) ? [condition(`Lộc phùng lưỡng sát: Không Kiếp đồng cung Lộc tại ${describePalace(palace)} [02_Cach-xau/04]`, true)] : []),
      ...(hasStarIn(palace, "Hóa Kỵ") ? [condition(`Lộc phùng xung phá: Hóa Kỵ đồng cung Lộc tại ${describePalace(palace)} [02_Cach-xau/20]`, true)] : []),
    ]);
    return [
      {
        book: "TVTH",
        label: "TVTH số 25 (Lộc Tồn Hóa Lộc đồng cung ở Mệnh)",
        cite: "TVTH tr.91–93 (số 25); Ma Thị câu 75",
        required: [lifeHas(ctx, "Lộc Tồn"), lifeHas(ctx, "Hóa Lộc")],
        breakers,
      },
      {
        book: "TVTH",
        label: "TVTH số 25 / MLTC 5.7 (Song Lộc triều viên: cả hai trong tam phương tứ chính Mệnh)",
        cite: "TVTH tr.91–93 (số 25); MLTC tr.702–713 (Lộc Tồn mục 5.7, 5.15)",
        required: [allInLifeGroup(ctx, LOC_ANY)],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Lộc Tồn mục 5.6 (Lộc hợp uyên ương: Mệnh và Thân)",
        cite: "MLTC tr.702–713 (Lộc Tồn mục 5.6)",
        required: [
          anyOf("Lộc Tồn và Hóa Lộc ở Mệnh/Thân", [
            allOf("cả hai ở Thân", [starInRole(ctx, "Lộc Tồn", "Thân"), starInRole(ctx, "Hóa Lộc", "Thân")]),
            allOf("Lộc Tồn Mệnh, Hóa Lộc Thân", [lifeHas(ctx, "Lộc Tồn"), starInRole(ctx, "Hóa Lộc", "Thân")]),
            allOf("Hóa Lộc Mệnh, Lộc Tồn Thân", [lifeHas(ctx, "Hóa Lộc"), starInRole(ctx, "Lộc Tồn", "Thân")]),
          ]),
        ],
        breakers,
      },
      {
        book: "MLTC",
        label: "MLTC Lộc Tồn mục 5.3 (Song Lộc giáp Mệnh)",
        cite: "MLTC tr.702–713 (Lộc Tồn mục 5.3)",
        required: [flankedBy(ctx, "Lộc Tồn", "Hóa Lộc", ctx.life, "Mệnh")],
        strengtheners: [stemIn(ctx, ["Giáp", "Ất", "Bính", "Mậu"])],
        breakers,
      },
    ];
  },
});

const tienCaiHauMa = definePattern({
  id: "tien-cai-hau-ma",
  name: "Tiền Cái hậu Mã",
  polarity: "tốt",
  source: "TVTH tr.91–93 (số 27); tr.59",
  kbFile: `${KB}32_Tien-Cai-hau-Ma.md`,
  variants: (ctx) => [
    {
      book: "TVTH",
      label: "TVTH số 27 (Hoa Cái và Thiên Mã giáp Mệnh)",
      cite: "TVTH tr.91–93 (số 27); tr.59",
      required: [flankedBy(ctx, "Hoa Cái", "Thiên Mã", ctx.life, "Mệnh")],
      assumptions: ["'cung trước / cung sau' chưa rõ chiều: hiểu là Hoa Cái và Thiên Mã giáp Mệnh theo chiều bất kỳ (TVTH ghi cả hai thứ tự)"],
      breakers: defaultGoodBreakers(ctx, ctx.life),
    },
  ],
});

export const GOOD_PATTERNS: readonly PatternRule[] = [
  quanThanKhanhHoi,
  tuPhuDongCung,
  phuTuongTrieuVien,
  nhatNguyetTinhMinh,
  nhatNguyetChieuBich,
  thachTrungAnNgoc,
  maDauDoiKiem,
  thamVuDongHanh,
  cuCoMaoDau,
  locMaGiaoTri,
  thamHoaThamLinh,
  satPhaLiemTham,
  coNguyetDongLuong,
  cuNhatDongCung,
  thatSatTrieuDau,
  tamHoaLienChau,
  vanQueVanHoa,
  minhLocAmLoc,
  tuLinh,
  hoHamKiem,
  chungThuyTrieuDong,
  tuyetXuPhungSinh,
  kimDuPhuGia,
  nguyetLangThienMon,
  nhatLeTrungThien,
  phuBatCungDe,
  taHuuDongCung,
  thienAtQuyNhan,
  nhatChieuLoiMon,
  minhChauXuatHai,
  songLoc,
  tienCaiHauMa,
];

