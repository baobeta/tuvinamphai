import { hasStarIn, palaceAt } from "../analysis/chart-query.js";
import { branchName } from "../calendar/stem-branch.js";
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
  flankedBy,
  khongVongAt,
  KHONG_KIEP,
  KINH_DUONG_HAM,
  LOC_ANY,
  LUC_SAT,
  mainStarBrightIn,
  mainStarHasLuckyTransformation,
  MINOR_STAR_GOOD_BRANCHES,
  noneInScope,
  palaceAtBranches,
  palaceOf,
  roleAt,
  starIn,
  starInRole,
  stemIn,
  strongAssumption,
  strongLevels,
  TAM_HOA,
  thienKhong,
  thienKhongAssumption,
  transformed,
  tuanTrietAt,
  TU_SAT,
  voidOfMain,
  withAssumption,
  yearBranchIn,
  type Role,
} from "./conditions.js";
import { definePattern, unsupportedPattern } from "./rules-common.js";
import type { Condition, PatternContext, PatternRule } from "./types.js";

const KB = "09_Cach-cuc/02_Cach-xau/";
const NATAL_ONLY = "chỉ xét phần lá số gốc; phần kích hoạt theo đại hạn/tiểu hạn/lưu niên chưa xét";
const GAP_SCOPE = "'gặp' không nêu phạm vi: hiểu là trong tam phương tứ chính Mệnh";

const lifeHas = (ctx: PatternContext, name: string): Condition => starInRole(ctx, name, "Mệnh");
const lifeAt = (ctx: PatternContext, branches: readonly BranchName[]): Condition => roleAt(ctx, "Mệnh", branches);
const inLifeGroup = (ctx: PatternContext, names: readonly string[]): Condition => anyInScope(ctx, names, ctx.life, "tam phương tứ chính");
const allInLifeGroup = (ctx: PatternContext, names: readonly string[]): Condition => allInScope(ctx, names, ctx.life, "tam phương tứ chính");
const noLucky = (ctx: PatternContext, names: readonly string[] = BAN_CACH_CAT): Condition => noneInScope(ctx, names, ctx.life, "tam phương tứ chính");
const mitigation = (label: string, met: boolean, assumption?: string): readonly Condition[] => (met ? [condition(label, true, assumption)] : []);
const tuanTrietRelief = (palace: Palace, cite: string): readonly Condition[] =>
  mitigation(`Tuần/Triệt tại ${palace.role} cứu giải một phần [${cite}]`, tuanTrietAt(palace).met);

const sinhBatPhungThoi = definePattern({
  id: "sinh-bat-phung-thoi",
  name: "Sinh bất phùng thời",
  polarity: "xấu",
  source: "TVTH tr.91–93 (bần tiện số 1); MLTC tr.290–330 (Liêm Trinh mục 4.5)",
  kbFile: `${KB}01_Sinh-bat-phung-thoi.md`,
  variants: (ctx) => [
    {
      book: "TVTH",
      label: "TVTH bần tiện số 1 (Liêm Dần Thân gặp Tuần Triệt án ngữ)",
      cite: "TVTH tr.91–93 (bần tiện số 1)",
      required: [lifeHas(ctx, "Liêm Trinh"), lifeAt(ctx, ["Dần", "Thân"]), tuanTrietAt(ctx.life, "Tuần hoặc Triệt", "Mệnh")],
    },
    {
      book: "MLTC",
      label: "MLTC Liêm Trinh mục 4.5 (Mệnh tọa Không Vong)",
      cite: "MLTC tr.290–330 (Liêm Trinh mục 4.5)",
      required: [lifeHas(ctx, "Liêm Trinh"), khongVongAt(ctx, ctx.life, "Mệnh")],
    },
  ],
  notes: ["Tuần/Triệt xét trên lá số gốc; TVTH tr.73–74 nói ngoài 32 tuổi ảnh hưởng rất yếu (không xét tuổi)"],
});

const thatSinhCoBan = definePattern({
  id: "that-sinh-co-ban",
  name: "Thất sinh cô bần",
  polarity: "xấu",
  source: "TVTH tr.91–93 (bần tiện số 2), tr.53–54; MLTC tr.573–604 (Phá Quân mục 4.3)",
  kbFile: `${KB}02_That-sinh-co-ban.md`,
  variants: (ctx) => {
    const lifeBranch = branchName(ctx.life.branch);
    const mitigations = [
      ...mitigation(
        "Phá Quân Mão Dậu, tuổi Ất, Tân hoặc năm Tý: khá giả [TVTH tr.53–54]",
        ["Mão", "Dậu"].includes(lifeBranch) && (stemIn(ctx, ["Ất", "Tân"]).met || yearBranchIn(ctx, ["Tý"]).met),
        "'tuổi Ất, Tân, Tí' hiểu là can Ất/Tân hoặc chi Tý",
      ),
      ...mitigation("Phá Quân Dần Thân, tuổi Giáp, Canh, Đinh, Kỷ: cũng khá [TVTH tr.53–54]", ["Dần", "Thân"].includes(lifeBranch) && stemIn(ctx, ["Giáp", "Canh", "Đinh", "Kỷ"]).met),
    ];
    return [
      {
        book: "TVTH",
        label: "TVTH bần tiện số 2 (Phá Dần Thân gặp sát tinh)",
        cite: "TVTH tr.91–93 (bần tiện số 2)",
        required: [lifeHas(ctx, "Phá Quân"), lifeAt(ctx, ["Dần", "Thân"]), withAssumption(inLifeGroup(ctx, LUC_SAT), "'gặp sát tinh' hiểu là có lục sát trong tam phương tứ chính Mệnh")],
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Phá Quân mục 4.3 (Nhất sinh cô bần: Phá Quân hãm Mão Dậu)",
        cite: "MLTC tr.573–604 (Phá Quân mục 4.3)",
        required: [lifeHas(ctx, "Phá Quân"), lifeAt(ctx, ["Mão", "Dậu"])],
        breakers: mitigations,
      },
    ];
  },
});

const quanTuTaiDa = definePattern({
  id: "quan-tu-tai-da",
  name: "Quân tử tại dã",
  polarity: "xấu",
  source: "MLTC tr.397–435 (Tham Lang mục 4.5); TVTH tr.91–93 (bần tiện số 3)",
  kbFile: `${KB}03_Quan-tu-tai-da.md`,
  variants: (ctx) => [
    {
      book: "MLTC",
      label: "MLTC Tham Lang mục 4.5 (Tham, tứ sát, Thiên Hình gặp nhau, cát tinh lạc hãm)",
      cite: "MLTC tr.397–435 (Tham Lang mục 4.5)",
      required: [
        lifeHas(ctx, "Tham Lang"),
        allInLifeGroup(ctx, TU_SAT),
        inLifeGroup(ctx, ["Thiên Hình"]),
        noLucky(ctx, ["Văn Xương", "Văn Khúc", "Tả Phụ", "Hữu Bật", ...TAM_HOA, "Thiên Khôi", "Thiên Việt"]),
      ],
      assumptions: [
        "'tứ sát tinh và Thiên Hình gặp nhau' hiểu là đủ bốn sát và Thiên Hình trong tam phương tứ chính Mệnh",
        "'cát tinh lạc hãm' hiểu là không có cát tinh trong tam phương tứ chính (bảng miếu hãm phụ tinh không có trong phạm vi)",
      ],
    },
  ],
  notes: ["Biến thể TVTH 'Mệnh bị sát tinh, hung tinh hội' không định lượng được (hung tinh không định nghĩa), chỉ xét biến thể MLTC"],
});

const locPhungLuongSatTvth = (ctx: PatternContext): readonly Condition[] => [
  anyOf("Lộc Tồn hoặc Hóa Lộc ở Mệnh", [lifeHas(ctx, "Lộc Tồn"), lifeHas(ctx, "Hóa Lộc")]),
  lifeHas(ctx, "Địa Không"),
  lifeHas(ctx, "Địa Kiếp"),
];

const khongKiepTyHoi = (ctx: PatternContext): readonly Condition[] =>
  mitigation("Mệnh ở Tỵ/Hợi nơi Không Kiếp đắc địa: phản vi giai, phải xem lại [Ma Thị câu 3]", [5, 11].includes(ctx.life.branch));

const locPhungLuongSat = definePattern({
  id: "loc-phung-luong-sat",
  name: "Lộc phùng lưỡng sát",
  polarity: "xấu",
  source: "TVTH tr.91–93 (bần tiện số 4); MLTC tr.702–713 (Lộc Tồn mục 5.11)",
  kbFile: `${KB}04_Loc-phung-luong-sat.md`,
  variants: (ctx) => [
    {
      book: "TVTH",
      label: "TVTH bần tiện số 4 (Lộc ở Mệnh gặp Không Kiếp đồng cung)",
      cite: "TVTH tr.91–93 (bần tiện số 4)",
      required: locPhungLuongSatTvth(ctx),
      breakers: khongKiepTyHoi(ctx),
    },
    {
      book: "MLTC",
      label: "MLTC Lộc Tồn mục 5.11 (Lộc gặp Không Vong, Thiên Không, Địa Kiếp)",
      cite: "MLTC tr.702–713 (Lộc Tồn mục 5.11)",
      required: [
        anyOf("Lộc Tồn hoặc Hóa Lộc ở Mệnh", [lifeHas(ctx, "Lộc Tồn"), lifeHas(ctx, "Hóa Lộc")]),
        khongVongAt(ctx, ctx.life, "Mệnh"),
        inLifeGroup(ctx, [thienKhong(ctx)]),
        inLifeGroup(ctx, ["Địa Kiếp"]),
      ],
      assumptions: ["'Lộc' hiểu là Lộc Tồn hoặc Hóa Lộc ở Mệnh", GAP_SCOPE, thienKhongAssumption(ctx)],
      breakers: khongKiepTyHoi(ctx),
    },
  ],
});

const luongTrungHoaCai = definePattern({
  id: "luong-trung-hoa-cai",
  name: "Lưỡng trùng Hoa Cái",
  polarity: "xấu",
  source: "TVTH tr.91–93 (bần tiện số 8); MLTC tr.702–713 (Lộc Tồn mục 5.2)",
  kbFile: `${KB}04_Loc-phung-luong-sat.md`,
  variants: (ctx) => [
    {
      book: "TVTH",
      label: "TVTH bần tiện số 8 (y như Lộc phùng lưỡng sát)",
      cite: "TVTH tr.91–93 (bần tiện số 8)",
      required: locPhungLuongSatTvth(ctx),
      breakers: khongKiepTyHoi(ctx),
    },
    {
      book: "MLTC",
      label: "MLTC Lộc Tồn mục 5.2 (Lộc Tồn, Hóa Lộc, Không, Kiếp cùng Mệnh)",
      cite: "MLTC tr.702–713 (Lộc Tồn mục 5.2)",
      required: [lifeHas(ctx, "Lộc Tồn"), lifeHas(ctx, "Hóa Lộc"), lifeHas(ctx, "Địa Không"), lifeHas(ctx, "Địa Kiếp")],
      assumptions: ["'Không' hiểu là Địa Không"],
      breakers: khongKiepTyHoi(ctx),
    },
  ],
});

const maLacKhongVong = definePattern({
  id: "ma-lac-khong-vong",
  name: "Mã lạc không vong",
  polarity: "xấu",
  source: "TVTH tr.91–93 (bần tiện số 5); MLTC tr.714–719 (Thiên Mã mục 4.3, 4.5)",
  kbFile: `${KB}05_Ma-lac-khong-vong.md`,
  variants: (ctx) => {
    const mitigations = mitigation(
      "chính tinh miếu vượng đồng cung, thêm cát tinh: giảm vất vả [MLTC Thiên Mã mục 4.5]",
      mainStarBrightIn(ctx.life, strongLevels(ctx.options)).met && inLifeGroup(ctx, BAN_CACH_CAT).met,
      strongAssumption(ctx.options),
    );
    return [
      {
        book: "TVTH",
        label: "TVTH bần tiện số 5 (Mã tại Mệnh gặp Tuần Triệt án ngữ)",
        cite: "TVTH tr.91–93 (bần tiện số 5); tr.59",
        required: [lifeHas(ctx, "Thiên Mã"), tuanTrietAt(ctx.life, "Tuần hoặc Triệt", "Mệnh")],
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Thiên Mã mục 4.5 (Mã ngộ Tuần trung Không Vong)",
        cite: "MLTC tr.714–719 (Thiên Mã mục 4.3, 4.5)",
        required: [lifeHas(ctx, "Thiên Mã"), tuanTrietAt(ctx.life, "Tuần", "Mệnh")],
        breakers: mitigations,
      },
    ];
  },
});

const taiDuTuCuu = definePattern({
  id: "tai-du-tu-cuu",
  name: "Tài dữ tù cừu",
  polarity: "xấu",
  source: "TVTH tr.91–93 (bần tiện số 6); MLTC tr.222–258 (Vũ Khúc mục 4.5)",
  kbFile: `${KB}06_Tai-du-tu-cuu.md`,
  variants: (ctx) => {
    const mitigations = mitigation("có Khoa, Quyền, Lộc trong tam phương: tương đối tốt [MLTC Vũ Khúc mục 4.5]", inLifeGroup(ctx, TAM_HOA).met);
    return [
      {
        book: "TVTH",
        label: "TVTH bần tiện số 6 (Vũ hay Liêm hãm tại Mệnh gặp sát tinh)",
        cite: "TVTH tr.91–93 (bần tiện số 6)",
        required: [
          anyOf("Vũ Khúc hoặc Liêm Trinh hãm tại Mệnh", [
            allOf("Vũ Khúc hãm tại Mệnh", [lifeHas(ctx, "Vũ Khúc"), brightnessIn(ctx, "Vũ Khúc", ["Hãm"])]),
            allOf("Liêm Trinh hãm tại Mệnh", [lifeHas(ctx, "Liêm Trinh"), brightnessIn(ctx, "Liêm Trinh", ["Hãm"])]),
          ]),
          withAssumption(inLifeGroup(ctx, LUC_SAT), "'gặp sát tinh' hiểu là lục sát trong tam phương tứ chính Mệnh"),
        ],
        assumptions: ["độ hãm của Vũ Khúc, Liêm Trinh lấy theo bảng miếu hãm TVTH của lá số (spec không có bảng trong phạm vi)"],
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Vũ Khúc mục 4.5 (Tài vi tù thù: Vũ Liêm gặp nhau ở Mệnh)",
        cite: "MLTC tr.222–258 (Vũ Khúc mục 4.5)",
        required: [
          anyOf("Vũ Khúc hoặc Liêm Trinh thủ Mệnh", [lifeHas(ctx, "Vũ Khúc"), lifeHas(ctx, "Liêm Trinh")]),
          allInScope(ctx, ["Vũ Khúc", "Liêm Trinh"], ctx.life, "tam hợp"),
        ],
        assumptions: ["Vũ Khúc và Liêm Trinh luôn cách nhau 4 cung (an sao) nên không thể đồng cung: 'cùng nhập Mệnh' hiểu là một sao thủ Mệnh, sao kia ở tam hợp"],
        breakers: mitigations,
      },
    ];
  },
});

const thaiAmHamBranches = (ctx: PatternContext): readonly BranchName[] =>
  ctx.options.thaiAmHamTable === "TVTH" ? ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ"] : ["Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];

const nhatNguyetTangHung = definePattern({
  id: "nhat-nguyet-tang-hung",
  name: "Nhật Nguyệt tàng hung",
  polarity: "xấu",
  source: "TVTH tr.91–93 (bần tiện số 7); tr.28–30, 39–40",
  kbFile: `${KB}07_Nhat-Nguyet-tang-hung.md`,
  variants: (ctx) => {
    const rescueStars = [...TAM_HOA, "Văn Xương", "Văn Khúc", "Đào Hoa", "Hồng Loan", "Tả Phụ", "Hữu Bật", "Thiên Khôi", "Thiên Việt"];
    const badStars = ["Kình Dương", "Đà La", "Địa Không", "Địa Kiếp", "Thiên Diêu", "Thiên Hình"];
    return [
      {
        book: "TVTH",
        label: "TVTH bần tiện số 7 (Nhật Nguyệt hãm tại Mệnh không cứu tinh hoặc gặp sát)",
        cite: "TVTH tr.91–93 (bần tiện số 7)",
        required: [
          anyOf("Nhật hoặc Nguyệt hãm thủ Mệnh", [
            allOf("Thái Dương hãm thủ Mệnh", [lifeHas(ctx, "Thái Dương"), lifeAt(ctx, ["Tuất", "Hợi", "Tý", "Sửu"])]),
            allOf("Thái Âm hãm thủ Mệnh", [lifeHas(ctx, "Thái Âm"), lifeAt(ctx, thaiAmHamBranches(ctx))]),
          ]),
          anyOf("không có cứu tinh hoặc gặp sát tinh", [noLucky(ctx, rescueStars), inLifeGroup(ctx, LUC_SAT)]),
        ],
        assumptions: [
          "đủ một trong hai vế 'không cứu tinh' hoặc 'gặp sát tinh' là thành cách (cách hiểu của KB)",
          `Thái Âm hãm theo bảng ${ctx.options.thaiAmHamTable}; cứu tinh/sát tinh xét trong tam phương tứ chính Mệnh; Hỏa Linh đắc địa không xét (thiếu bảng)`,
        ],
        breakers: [
          ...tuanTrietRelief(ctx.life, "TVTH tr.28–30, 39–40: gặp Tuần Triệt cũng trở nên khá"),
          ...mitigation("hãm mà gặp cứu tinh: biến ra tốt về tài danh [TVTH tr.28–30, 39–40]", inLifeGroup(ctx, rescueStars).met),
          ...mitigation(
            "Thái Dương Hóa Kỵ riêng, không có ác tinh khác: biến thành tốt [TVTH tr.28–30]",
            transformed(ctx, "Thái Dương", "Hóa Kỵ").met && hasStarIn(ctx.life, "Thái Dương") && noLucky(ctx, badStars).met,
          ),
        ],
      },
    ];
  },
});

const isHamKhongKiep = (palace: Palace, name: string): boolean =>
  hasStarIn(palace, name) && !MINOR_STAR_GOOD_BRANCHES[name]!.includes(branchName(palace.branch));

const khongKiepSatHoi = definePattern({
  id: "khong-kiep-sat-hoi",
  name: "Không Kiếp sát hội",
  polarity: "xấu",
  source: "TVTH tr.91–93 (bần tiện số 9); tr.82–84",
  kbFile: `${KB}08_Khong-Kiep-sat-hoi.md`,
  variants: (ctx) => {
    const group = [ctx.life, palaceAt(ctx.chart, ctx.life.branch + 4), palaceAt(ctx.chart, ctx.life.branch + 8), palaceAt(ctx.chart, ctx.life.branch + 6)];
    const hamHit = group.flatMap((palace) => KHONG_KIEP.filter((name) => isHamKhongKiep(palace, name)).map((name) => `${name} hãm tại ${branchName(palace.branch)}`));
    const dacDia = group.some((palace) => KHONG_KIEP.some((name) => hasStarIn(palace, name) && !isHamKhongKiep(palace, name)));
    return [
      {
        book: "TVTH",
        label: "TVTH tr.82–84 (Không Kiếp giáp Mệnh)",
        cite: "TVTH tr.82–84; Ma Thị câu 65; Cách cuộc luận câu 21",
        required: [flankedBy(ctx, "Địa Không", "Địa Kiếp", ctx.life, "Mệnh")],
        assumptions: ["sách thêm 'nếu Mệnh không có quý cách thì là hạng bần tiện': chưa đối chiếu với cách tốt"],
      },
      {
        book: "TVTH",
        label: "TVTH bần tiện số 9 (Mệnh gặp Không Kiếp hãm hội sát tinh)",
        cite: "TVTH tr.91–93 (bần tiện số 9)",
        required: [
          condition(`Địa Không/Địa Kiếp hãm trong tam phương tứ chính Mệnh${hamHit.length ? `: ${hamHit.join(", ")}` : ""}`, hamHit.length > 0),
          inLifeGroup(ctx, TU_SAT),
        ],
        assumptions: [GAP_SCOPE, "Không Kiếp hãm = ngoài Tỵ Hợi Dần Thân (suy từ đắc địa, KB tự suy)", "'sát tinh' hiểu là tứ sát"],
        breakers: mitigation("có Không/Kiếp đắc địa (Tỵ Hợi Dần Thân) trong tam phương [03_Cach-bi-pha/06]", dacDia),
      },
    ];
  },
});

const cuPhungTuSat = definePattern({
  id: "cu-phung-tu-sat",
  name: "Cự phùng tứ sát",
  polarity: "xấu",
  source: "MLTC tr.436–472 (Cự Môn mục 4.5); TVTH tr.186–192 (câu 34), tr.193–197 (câu 45, 55)",
  kbFile: `${KB}09_Cu-phung-tu-sat.md`,
  variants: (ctx) => {
    const mitigations = [
      ...mitigation("Tử Vi hoặc Lộc Tồn áp chế trong tam phương [MLTC Cự Môn mục 4.5]", inLifeGroup(ctx, ["Tử Vi", "Lộc Tồn"]).met, "'áp chế' hiểu là có Tử Vi/Lộc Tồn trong tam phương tứ chính"),
      ...mitigation("có cát tinh cầu giải trong tam phương [MLTC cổ nhân]", inLifeGroup(ctx, BAN_CACH_CAT).met),
    ];
    const cuHam = brightnessIn(ctx, "Cự Môn", ["Hãm"]);
    return [
      {
        book: "MLTC",
        label: "MLTC Cự Môn mục 4.5 loại 1 (Cự Môn hãm cùng tứ sát thủ Mệnh)",
        cite: "MLTC tr.436–472 (Cự Môn mục 4.5)",
        required: [lifeHas(ctx, "Cự Môn"), cuHam, anyInScope(ctx, TU_SAT, ctx.life, "đồng cung", "Mệnh")],
        assumptions: ["'Hỏa, Linh, Dương, Đà thủ Mệnh' hiểu là có ít nhất một sao tứ sát đồng cung; 'hãm địa' hiểu là Cự Môn hãm theo bảng TVTH của lá số"],
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Cự Môn mục 4.5 loại 2 (Cự thủ Mệnh, tứ sát thủ Thân hoặc ngược lại)",
        cite: "MLTC tr.436–472 (Cự Môn mục 4.5)",
        required: [
          cuHam,
          anyOf("Cự Môn ở Mệnh với sát ở Thân, hoặc ngược lại", [
            allOf("Cự Mệnh, sát Thân", [lifeHas(ctx, "Cự Môn"), anyInScope(ctx, TU_SAT, ctx.body, "đồng cung", "cung Thân")]),
            allOf("Cự Thân, sát Mệnh", [starInRole(ctx, "Cự Môn", "Thân"), anyInScope(ctx, TU_SAT, ctx.life, "đồng cung", "Mệnh")]),
          ]),
        ],
        assumptions: ["số sát tinh ở cung Thân không nêu: hiểu là ít nhất một sao tứ sát; 'hãm địa' theo bảng TVTH của lá số"],
        breakers: mitigations,
      },
      {
        book: "TVTH",
        label: "TVTH phú (Cự phùng Đà Kỵ / Cự Hỏa Kình Dương)",
        cite: "TVTH tr.186–192 (câu 34); tr.193–197 (câu 45, 55)",
        required: [
          lifeHas(ctx, "Cự Môn"),
          anyOf("Đà La và Hóa Kỵ, hoặc Hỏa Tinh và Kình Dương trong tam phương", [allInLifeGroup(ctx, ["Đà La", "Hóa Kỵ"]), allInLifeGroup(ctx, ["Hỏa Tinh", "Kình Dương"])]),
        ],
        assumptions: ["TVTH chỉ có câu phú, không định nghĩa thành cách; phạm vi hiểu là tam phương tứ chính Mệnh"],
        breakers: mitigations,
      },
    ];
  },
});

const kyAmDongMenhThanTatAch = definePattern({
  id: "ky-am-dong-menh-than-tat-ach",
  name: "Kị ám đồng Mệnh Thân Tật Ách",
  polarity: "xấu",
  source: "MLTC tr.436–472 (Cự Môn mục 4.7)",
  kbFile: `${KB}09_Cu-phung-tu-sat.md`,
  variants: (ctx) => {
    const cuPalace = ctx.chart.palaces.find((palace) => hasStarIn(palace, "Cự Môn"))!;
    const roles: readonly Role[] = ["Mệnh", "Thân", "Tật Ách"];
    return [
      {
        book: "MLTC",
        label: "MLTC Cự Môn mục 4.7",
        cite: "MLTC tr.436–472 (Cự Môn mục 4.7)",
        required: [transformed(ctx, "Cự Môn", "Hóa Kỵ"), anyOf("Cự Môn ở Mệnh, Thân hoặc Tật Ách", roles.map((role) => starInRole(ctx, "Cự Môn", role)))],
        strengtheners: [anyInScope(ctx, ["Kình Dương", "Hỏa Tinh"], cuPalace, "đồng cung", "cung Cự Môn")],
        assumptions: ["'Kị' hiểu là Hóa Kỵ (bản dịch có chỗ đồng nhất Kị với Hỏa Tinh, sách không phân xử)"],
        breakers: mitigation(
          "tam kỳ gia hội: chuyển thành Hóa tinh phản quý [MLTC Cự Môn mục 4.7]",
          allInScope(ctx, TAM_HOA, cuPalace, "tam phương tứ chính").met,
          "'tam kỳ gia hội' hiểu là đủ Hóa Lộc, Quyền, Khoa trong tam phương tứ chính cung Cự Môn",
        ),
      },
    ];
  },
});

const satCuTuyetDia = definePattern({
  id: "sat-cu-tuyet-dia",
  name: "Sát cư tuyệt địa",
  polarity: "xấu",
  source: "MLTC tr.538–572 (Thất Sát mục 4.4); TVTH tr.51–52",
  kbFile: `${KB}10_Sat-cu-tuyet-dia.md`,
  variants: (ctx) => {
    const mitigations = mitigation("có Tả, Hữu, Khôi, Việt hội chiếu: tai họa giảm [MLTC Thất Sát mục 4.4]", inLifeGroup(ctx, ["Tả Phụ", "Hữu Bật", "Thiên Khôi", "Thiên Việt"]).met);
    return [
      {
        book: "MLTC",
        label: "MLTC Thất Sát mục 4.4 (Sát Dần Thân Tỵ Hợi, gặp Kình Hỏa, ở Tuyệt)",
        cite: "MLTC tr.538–572 (Thất Sát mục 4.4)",
        required: [lifeHas(ctx, "Thất Sát"), lifeAt(ctx, ["Dần", "Thân", "Tỵ", "Hợi"]), allInLifeGroup(ctx, ["Kình Dương", "Hỏa Tinh"]), lifeHas(ctx, "Tuyệt")],
        assumptions: ["'gặp Kình Dương và Hỏa Tinh' hiểu là trong tam phương tứ chính Mệnh; 'tuyệt địa' là sao Tuyệt vòng Tràng Sinh", NATAL_ONLY],
        breakers: mitigations,
      },
      {
        book: "TVTH",
        label: "TVTH tr.51–52 (Mệnh phùng Tuyệt địa, Sát cùng Đà Dương)",
        cite: "TVTH tr.51–52",
        required: [lifeHas(ctx, "Thất Sát"), lifeHas(ctx, "Tuyệt"), allInLifeGroup(ctx, ["Đà La", "Kình Dương"])],
        assumptions: ["'cùng Đà, Dương' hiểu là trong tam phương tứ chính Mệnh; 'Tuyệt địa' là sao Tuyệt vòng Tràng Sinh"],
        breakers: mitigations,
      },
    ];
  },
});

const linhXuongDaVu = definePattern({
  id: "linh-xuong-da-vu",
  name: "Linh Xương Đà Vũ",
  polarity: "xấu",
  source: "MLTC tr.222–258 (Vũ Khúc mục 4.4); TVTH tr.193–197 (câu 45)",
  kbFile: `${KB}11_Linh-Xuong-Da-Vu.md`,
  variants: (ctx) => {
    const fourth = ctx.options.linhXuongDaVuFourthStar;
    const stars = ["Linh Tinh", "Văn Xương", fourth, "Vũ Khúc"];
    return [
      {
        book: "MLTC",
        label: "MLTC Vũ Khúc mục 4.4 (Tân Nhâm, bốn sao gặp nhau ở Thìn Tuất)",
        cite: "MLTC tr.222–258 (Vũ Khúc mục 4.4)",
        required: [stemIn(ctx, ["Tân", "Nhâm"]), lifeAt(ctx, ["Thìn", "Tuất"]), allInLifeGroup(ctx, stars)],
        strengtheners: [allInScope(ctx, stars, ctx.life, "đồng cung", "Mệnh")],
        assumptions: [
          NATAL_ONLY,
          "lá số gốc 'luận tương tự': xét Mệnh ở Thìn/Tuất và bốn sao trong tam phương tứ chính Mệnh",
          `sao thứ tư lấy ${fourth} (bản dịch MLTC ghi Hỏa Tinh, tên cách ghi Đà; tùy chọn linhXuongDaVuFourthStar)`,
        ],
        breakers: mitigation("có cát tinh trong tam phương: không chết nước [TVTH câu 45]", inLifeGroup(ctx, BAN_CACH_CAT).met),
      },
      {
        book: "TVTH",
        label: "TVTH câu 45 (Mệnh Thìn Tuất, tuổi Tân Nhâm Kỷ, không cát tinh)",
        cite: "TVTH tr.193–197 (Cách cuộc luận câu 45)",
        required: [stemIn(ctx, ["Tân", "Nhâm", "Kỷ"]), lifeAt(ctx, ["Thìn", "Tuất"]), allInLifeGroup(ctx, ["Linh Tinh", "Văn Xương", "Đà La", "Vũ Khúc"]), noLucky(ctx)],
        assumptions: [NATAL_ONLY, "điều kiện 'hạn đến Thìn Tuất' chưa xét; bốn sao xét trong tam phương tứ chính Mệnh"],
      },
    ];
  },
});

const duongDaGiapKy = definePattern({
  id: "duong-da-giap-ky",
  name: "Dương Đà giáp Kị",
  polarity: "xấu",
  source: "MLTC tr.653–665 (Kình Dương mục 5.7); TVTH tr.75–76",
  kbFile: `${KB}12_Duong-Da-giap-Ky.md`,
  variants: (ctx) => {
    const mitigations = mitigation(
      "tam kỳ gia hội và nhiều cát tinh: hóa giải [MLTC Kình Dương mục 5.7]",
      allInLifeGroup(ctx, TAM_HOA).met && countInScope(ctx, BAN_CACH_CAT, ctx.life, "tam phương tứ chính", ctx.options.minLuckyCount).met,
      `'nhiều cát tinh' hiểu là từ ${ctx.options.minLuckyCount} cát tinh trong tam phương tứ chính`,
    );
    const base = [lifeHas(ctx, "Lộc Tồn"), flankedBy(ctx, "Kình Dương", "Đà La", ctx.life, "Mệnh")];
    return [
      {
        book: "TVTH",
        label: "TVTH tr.75–76 (giáp Kình Đà mà Mệnh có Hóa Kỵ)",
        cite: "TVTH tr.75–76",
        required: [...base, lifeHas(ctx, "Hóa Kỵ")],
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Kình Dương mục 5.7 (Lộc Tồn giữa Kình Đà lại giáp Kị)",
        cite: "MLTC tr.653–665 (Kình Dương mục 5.7)",
        required: [
          ...base,
          anyOf("Hóa Kỵ ở Mệnh, xung chiếu Mệnh hoặc ở cung giáp", [
            lifeHas(ctx, "Hóa Kỵ"),
            starIn("Hóa Kỵ", palaceAt(ctx.chart, ctx.life.branch + 6), "cung xung chiếu Mệnh"),
            starIn("Hóa Kỵ", palaceAt(ctx.chart, ctx.life.branch - 1), "cung giáp trước"),
            starIn("Hóa Kỵ", palaceAt(ctx.chart, ctx.life.branch + 1), "cung giáp sau"),
          ]),
        ],
        assumptions: ["vị trí Hóa Kỵ không nêu: hiểu là ở Mệnh, cung xung chiếu (ví dụ KB) hoặc một cung giáp"],
        breakers: mitigations,
      },
    ];
  },
});

const hinhTuGiapAn = definePattern({
  id: "hinh-tu-giap-an",
  name: "Hình tù giáp ấn",
  polarity: "xấu",
  source: "MLTC tr.290–330 (Liêm Trinh mục 4.6); tr.473–501 (Thiên Tướng mục 4.4)",
  kbFile: `${KB}13_Hinh-tu-giap-an.md`,
  variants: (ctx) => [
    {
      book: "MLTC",
      label: "MLTC Liêm Trinh mục 4.6 (Liêm Tướng Tý Ngọ gặp Kình Dương đồng cung)",
      cite: "MLTC tr.290–330 (Liêm Trinh mục 4.6)",
      required: [lifeHas(ctx, "Liêm Trinh"), lifeHas(ctx, "Thiên Tướng"), lifeAt(ctx, ["Tý", "Ngọ"]), lifeHas(ctx, "Kình Dương")],
      strengtheners: [allOf("mạnh nhất: Mệnh Ngọ, tuổi Bính, Liêm Hóa Kỵ", [lifeAt(ctx, ["Ngọ"]), stemIn(ctx, ["Bính"]), transformed(ctx, "Liêm Trinh", "Hóa Kỵ")])],
      assumptions: [NATAL_ONLY + " (cách chỉ phát khi lưu niên gặp Liêm Hóa Kỵ, Bạch Hổ hoặc Hóa Kỵ)"],
      breakers: mitigation("có cát tinh hội chiếu: thường là bị oan [MLTC Liêm Trinh mục 4.6]", inLifeGroup(ctx, BAN_CACH_CAT).met),
    },
  ],
});

const LIEM_SAT_BAD = [...TU_SAT, "Thiên Hình", "Hóa Kỵ", "Địa Kiếp", "Địa Không"] as const;

const satCungLiemTrinh = definePattern({
  id: "sat-cung-liem-trinh",
  name: "Sát củng Liêm Trinh",
  polarity: "xấu",
  source: "MLTC tr.290–330 (Liêm Trinh mục 4.3); TVTH tr.51–52",
  kbFile: `${KB}14_Liem-Sat-lo-thuong-mai-thi.md`,
  variants: (ctx) => {
    const mitigations = mitigation("tuổi Kỷ, Ất: anh hùng trí dũng [TVTH tr.51–52]", stemIn(ctx, ["Kỷ", "Ất"]).met);
    const sameLife = [lifeHas(ctx, "Liêm Trinh"), lifeHas(ctx, "Thất Sát"), lifeAt(ctx, ["Sửu", "Mùi"])];
    return [
      {
        book: "TVTH",
        label: "TVTH tr.51–52 (Liêm Sát Sửu Mùi)",
        cite: "TVTH tr.51–52; Cách cuộc luận câu 44",
        required: sameLife,
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Liêm Trinh mục 4.3",
        cite: "MLTC tr.290–330 (Liêm Trinh mục 4.3)",
        required: [
          anyOf("một trong ba thế Liêm Sát", [
            anyOf("(1) Liêm Sát chia thủ Mệnh và Thân", [
              allOf("Liêm Mệnh, Sát Thân", [lifeHas(ctx, "Liêm Trinh"), starInRole(ctx, "Thất Sát", "Thân")]),
              allOf("Sát Mệnh, Liêm Thân", [lifeHas(ctx, "Thất Sát"), starInRole(ctx, "Liêm Trinh", "Thân")]),
            ]),
            allOf("(2) Liêm Sát ở Sửu Mùi thủ Mệnh", sameLife),
            allOf("(3) Sát Mão Dậu thủ Mệnh, tam hợp có Liêm", [lifeHas(ctx, "Thất Sát"), lifeAt(ctx, ["Mão", "Dậu"]), anyInScope(ctx, ["Liêm Trinh"], ctx.life, "tam hợp")]),
          ]),
          noLucky(ctx),
          inLifeGroup(ctx, LIEM_SAT_BAD),
        ],
        assumptions: ["'cung Thân' hiểu là cung an Thân (không phải địa chi Thân)"],
        breakers: mitigations,
      },
    ];
  },
});

const loThuongMaiThi = definePattern({
  id: "lo-thuong-mai-thi",
  name: "Lộ thượng mai thi",
  polarity: "xấu",
  source: "MLTC tr.290–330 (Liêm Trinh mục 4.4)",
  kbFile: `${KB}14_Liem-Sat-lo-thuong-mai-thi.md`,
  variants: (ctx) => [
    {
      book: "MLTC",
      label: "MLTC Liêm Trinh mục 4.4 (Liêm Sát Sửu Mùi gặp sát hoặc Kị)",
      cite: "MLTC tr.290–330 (Liêm Trinh mục 4.4)",
      required: [lifeHas(ctx, "Liêm Trinh"), lifeHas(ctx, "Thất Sát"), lifeAt(ctx, ["Sửu", "Mùi"]), inLifeGroup(ctx, [...LUC_SAT, "Hóa Kỵ"])],
      assumptions: ["sách không nói rõ thủ Mệnh: suy từ ngữ cảnh chương (cách nhập Mệnh)"],
      breakers: mitigation(
        "tam kỳ gia hội giải ách [MLTC Liêm Trinh mục 4.4]",
        allInLifeGroup(ctx, TAM_HOA).met,
        "'tam kỳ' hiểu là đủ Hóa Lộc, Quyền, Khoa trong tam phương tứ chính",
      ),
    },
  ],
});

const NGUYET_LUONG_BAD = [...LUC_SAT, "Thiên Hình", "Thiên Diêu", "Hóa Kỵ", "Đại Hao"] as const;

const nguyetLuongLacHam = definePattern({
  id: "nguyet-luong-lac-ham",
  name: "Nguyệt Lương lạc hãm",
  polarity: "xấu",
  source: "MLTC tr.360–396 (Thái Âm mục 4.4); TVTH tr.103–104",
  kbFile: `${KB}15_Nguyet-Luong-lac-ham.md`,
  variants: (ctx) => {
    const luongHam: readonly BranchName[] = ctx.options.thienLuongHamTable === "TVTH" ? ["Tỵ", "Hợi", "Dậu"] : ["Tỵ", "Hợi", "Thân"];
    const mitigations = [
      ...tuanTrietRelief(ctx.life, "TVTH tr.39–40"),
      ...mitigation("hãm mà gặp cát tinh, Đào Hồng: trở nên tốt [TVTH tr.39–40]", inLifeGroup(ctx, [...BAN_CACH_CAT, "Đào Hoa", "Hồng Loan"]).met),
    ];
    const tableNote = `bảng hãm Thiên Lương theo ${ctx.options.thienLuongHamTable}, Thái Âm theo ${ctx.options.thaiAmHamTable} (sách không phân xử)`;
    return [
      {
        book: "MLTC",
        label: "MLTC Thái Âm mục 4.4 (Thiên Lương hãm thủ Mệnh gặp Thái Âm)",
        cite: "MLTC tr.360–396 (Thái Âm mục 4.4)",
        required: [lifeHas(ctx, "Thiên Lương"), palaceAtBranches(ctx.life, luongHam, "Mệnh (Thiên Lương hãm)"), inLifeGroup(ctx, ["Thái Âm"]), noLucky(ctx), inLifeGroup(ctx, NGUYET_LUONG_BAD)],
        assumptions: [GAP_SCOPE, tableNote],
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Thái Âm mục 4.4 (Thái Âm hãm thủ Mệnh gặp Thiên Lương)",
        cite: "MLTC tr.360–396 (Thái Âm mục 4.4)",
        required: [lifeHas(ctx, "Thái Âm"), palaceAtBranches(ctx.life, thaiAmHamBranches(ctx), "Mệnh (Thái Âm hãm)"), inLifeGroup(ctx, ["Thiên Lương"]), noLucky(ctx), inLifeGroup(ctx, NGUYET_LUONG_BAD)],
        assumptions: [GAP_SCOPE, tableNote],
        breakers: mitigations,
      },
      {
        book: "TVTH",
        label: "TVTH tr.39–40, 103–104 (Nguyệt Lương hội họp Mão đến Tỵ)",
        cite: "TVTH tr.103–104; Cách cuộc luận câu 22",
        required: [lifeHas(ctx, "Thái Âm"), inLifeGroup(ctx, ["Thiên Lương"]), lifeAt(ctx, ["Mão", "Thìn", "Tỵ"])],
        assumptions: [GAP_SCOPE],
        breakers: mitigations,
      },
    ];
  },
});

const voDaoChiQuan = definePattern({
  id: "vo-dao-chi-quan",
  name: "Vô đạo chi quân",
  polarity: "xấu",
  source: "MLTC tr.92–139 (Tử Vi mục 4.3); TVTH tr.24–25",
  kbFile: `${KB}16_De-ngo-hung-do-Vo-dao-chi-quan.md`,
  variants: (ctx) => [
    {
      book: "MLTC",
      label: "MLTC Tử Vi mục 4.3 (Tử Vi bị tứ sát công chiếu)",
      cite: "MLTC tr.92–139 (Tử Vi mục 4.3)",
      required: [
        lifeHas(ctx, "Tử Vi"),
        ctx.options.allFourMaleficsForVoDao ? allInLifeGroup(ctx, TU_SAT) : countInScope(ctx, TU_SAT, ctx.life, "tam phương tứ chính", ctx.options.manyMaleficThreshold),
      ],
      assumptions: [
        ctx.options.allFourMaleficsForVoDao
          ? "'tứ sát cùng công chiếu' hiểu là đủ bốn sát trong tam phương tứ chính (tùy chọn allFourMaleficsForVoDao)"
          : `'tứ sát cùng công chiếu' hiểu là từ ${ctx.options.manyMaleficThreshold} sao tứ sát trong tam phương tứ chính`,
      ],
    },
    {
      book: "TVTH",
      label: "TVTH tr.24–25 (Tử Vi gặp Địa Không Địa Kiếp)",
      cite: "TVTH tr.24–25",
      required: [lifeHas(ctx, "Tử Vi"), allInLifeGroup(ctx, KHONG_KIEP)],
      strengtheners: [tuanTrietAt(ctx.life, "Tuần hoặc Triệt", "Mệnh")],
      assumptions: [GAP_SCOPE],
    },
  ],
});

const deNgoHungDo = definePattern({
  id: "de-ngo-hung-do",
  name: "Đế ngộ hung đồ",
  polarity: "xấu",
  source: "MLTC tr.92–139 (Tử Vi mục 4.12, 4.13)",
  kbFile: `${KB}16_De-ngo-hung-do-Vo-dao-chi-quan.md`,
  variants: (ctx) => {
    const mitigations = mitigation(
      "tam cát hóa gặp nhau và nhiều cát tinh: giải được [MLTC Tử Vi mục 4.13]",
      allInLifeGroup(ctx, TAM_HOA).met && countInScope(ctx, BAN_CACH_CAT, ctx.life, "tam phương tứ chính", ctx.options.minLuckyCount + 3).met,
      `'nhiều cát tinh' hiểu là từ ${ctx.options.minLuckyCount + 3} cát tinh (gồm ba Hóa) trong tam phương tứ chính`,
    );
    return [
      {
        book: "MLTC",
        label: "MLTC Tử Vi mục 4.13 (Tử Vi gặp hung đồ tứ sát hội chiếu)",
        cite: "MLTC tr.92–139 (Tử Vi mục 4.13)",
        required: [lifeHas(ctx, "Tử Vi"), countInScope(ctx, TU_SAT, ctx.life, "tam phương tứ chính", ctx.options.manyMaleficThreshold)],
        assumptions: [`số sát tinh tối thiểu không nêu: lấy ngưỡng ${ctx.options.manyMaleficThreshold} (tùy chọn manyMaleficThreshold)`],
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Tử Vi mục 4.12 (Cực cư Mão Dậu ngộ Không Kiếp)",
        cite: "MLTC tr.92–139 (Tử Vi mục 4.12)",
        required: [lifeHas(ctx, "Tử Vi"), lifeHas(ctx, "Tham Lang"), lifeAt(ctx, ["Mão", "Dậu"]), inLifeGroup(ctx, KHONG_KIEP)],
        assumptions: ["'ngộ Không Kiếp' hiểu là có Không hoặc Kiếp trong tam phương tứ chính"],
        breakers: mitigations,
      },
    ];
  },
});

const VAN_STARS = ["Văn Xương", "Văn Khúc"] as const;

const vanTinhNgoGiap = definePattern({
  id: "van-tinh-ngo-giap",
  name: "Văn tinh ngộ giáp",
  polarity: "xấu",
  source: "MLTC tr.605–619 (Văn Xương mục 5.4)",
  kbFile: `${KB}17_Van-tinh-that-vi-giap-Khong-Kiep.md`,
  variants: (ctx) => {
    const anchor = VAN_STARS.some((name) => hasStarIn(ctx.life, name)) ? ctx.life : ctx.body;
    const otherLucky = BAN_CACH_CAT.filter((name) => !VAN_STARS.includes(name as (typeof VAN_STARS)[number]));
    return [
      {
        book: "MLTC",
        label: "MLTC Văn Xương mục 5.4 (Xương/Khúc nhập Mệnh, Không Kiếp kẹp hai bên)",
        cite: "MLTC tr.605–619 (Văn Xương mục 5.4)",
        required: [
          anyOf("Văn Xương hoặc Văn Khúc ở Mệnh hoặc Thân", VAN_STARS.flatMap((name) => [lifeHas(ctx, name), starInRole(ctx, name, "Thân")])),
          flankedBy(ctx, "Địa Không", "Địa Kiếp", anchor),
          noLucky(ctx, otherLucky),
          inLifeGroup(ctx, [...LUC_SAT, "Hóa Kỵ"]),
        ],
        assumptions: [
          "'tam phương không cát tinh' không tính chính Xương Khúc",
          "'có hung' hiểu là có lục sát hoặc Hóa Kỵ trong tam phương tứ chính (hung tinh không định nghĩa)",
        ],
        breakers: mitigation(
          "chính tinh miếu vượng hóa cát, tam phương có cát tinh: không luận như vậy [MLTC mục 5.4]",
          mainStarBrightIn(ctx.life, strongLevels(ctx.options)).met && mainStarHasLuckyTransformation(ctx.life).met,
          strongAssumption(ctx.options),
        ),
      },
    ];
  },
});

const vanTinhThatVi = definePattern({
  id: "van-tinh-that-vi",
  name: "Văn tinh thất vị",
  polarity: "xấu",
  source: "MLTC tr.605–619 (Văn Xương mục 5.5); TVTH tr.55–56",
  kbFile: `${KB}17_Van-tinh-that-vi-giap-Khong-Kiep.md`,
  variants: (ctx) => {
    const khucHam: readonly BranchName[] = ctx.options.vanKhucHamTable === "TVTH" ? ["Ngọ", "Tuất"] : ["Dần", "Ngọ", "Tuất"];
    return [
      {
        book: "MLTC",
        label: "MLTC Văn Xương mục 5.5 (Xương Khúc lạc hãm Dần Ngọ Tuất gặp Không Kiếp Hình Kị)",
        cite: "MLTC tr.605–619 (Văn Xương mục 5.5)",
        required: [
          anyOf("Văn Xương hoặc Văn Khúc thủ Mệnh", VAN_STARS.map((name) => lifeHas(ctx, name))),
          lifeAt(ctx, ["Dần", "Ngọ", "Tuất"]),
          inLifeGroup(ctx, ["Địa Không", "Địa Kiếp", "Thiên Hình", "Hóa Kỵ"]),
        ],
        assumptions: [GAP_SCOPE],
      },
      {
        book: "TVTH",
        label: "TVTH tr.55–56 (Xương Khúc hãm gặp nhiều sát tinh)",
        cite: "TVTH tr.55–56",
        required: [
          anyOf("Xương hoặc Khúc hãm thủ Mệnh", [
            allOf("Văn Xương hãm", [lifeHas(ctx, "Văn Xương"), lifeAt(ctx, ["Dần", "Ngọ", "Tuất"])]),
            allOf("Văn Khúc hãm", [lifeHas(ctx, "Văn Khúc"), lifeAt(ctx, khucHam)]),
          ]),
          countInScope(ctx, LUC_SAT, ctx.life, "tam phương tứ chính", ctx.options.manyMaleficThreshold),
        ],
        assumptions: [`'nhiều sát tinh' hiểu là từ ${ctx.options.manyMaleficThreshold} sao lục sát trong tam phương tứ chính; Văn Khúc hãm theo bảng ${ctx.options.vanKhucHamTable}`],
      },
      {
        book: "NP2",
        label: "NP2 (Xương Khúc gặp Kỵ ở Mệnh)",
        cite: "NP2 Tửu bộ văn chương tr.51–52",
        required: [lifeHas(ctx, "Văn Xương"), lifeHas(ctx, "Văn Khúc"), lifeHas(ctx, "Hóa Kỵ")],
        assumptions: ["NP2 không nêu cung: hiểu là cùng ở Mệnh"],
      },
    ];
  },
});

const thamXuongThamKhuc = definePattern({
  id: "tham-xuong-tham-khuc",
  name: "Tham Xương Tham Khúc",
  polarity: "xấu",
  source: "MLTC tr.397–435 (Tham Lang mục 4.6); TVTH tr.193–197 (câu 14, 46)",
  kbFile: `${KB}18_Tham-Xuong-Tham-Khuc.md`,
  variants: (ctx) => {
    const thamPalace = ctx.chart.palaces.find((palace) => hasStarIn(palace, "Tham Lang"))!;
    const career = palaceOf(ctx, "Quan Lộc");
    const mitigations = mitigation(
      "chính tinh Mệnh mạnh: ảnh hưởng không lớn [MLTC Tham Lang mục 4.6]",
      mainStarBrightIn(ctx.life, strongLevels(ctx.options)).met,
      `'chính tinh mạnh' hiểu theo độ sáng: ${strongAssumption(ctx.options)}`,
    );
    return [
      {
        book: "TVTH",
        label: "TVTH câu 46 (Xương Tham cư Mệnh Tỵ Hợi hoặc cư Quan)",
        cite: "TVTH tr.193–197 (câu 46)",
        required: [
          anyOf("Tham Lang và Văn Xương ở Mệnh Tỵ/Hợi hoặc ở Quan Lộc", [
            allOf("ở Mệnh Tỵ/Hợi", [lifeHas(ctx, "Tham Lang"), lifeHas(ctx, "Văn Xương"), lifeAt(ctx, ["Tỵ", "Hợi"])]),
            allOf("ở Quan Lộc", [starIn("Tham Lang", career, "Quan Lộc"), starIn("Văn Xương", career, "Quan Lộc")]),
          ]),
        ],
        breakers: mitigations,
      },
      {
        book: "TVTH",
        label: "TVTH câu 14 (Tham đồng Xương Khúc ở Sửu Mùi)",
        cite: "TVTH tr.193–197 (câu 14)",
        required: [lifeHas(ctx, "Tham Lang"), anyOf("Văn Xương hoặc Văn Khúc ở Mệnh", VAN_STARS.map((name) => lifeHas(ctx, name))), lifeAt(ctx, ["Sửu", "Mùi"])],
        assumptions: ["sách không nêu cung: hiểu là Mệnh; 'Xương Khúc' hiểu là Xương hoặc Khúc"],
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Tham Lang mục 4.6 (Tham Lang hội Xương Khúc ở bất kỳ cung nào)",
        cite: "MLTC tr.397–435 (Tham Lang mục 4.6)",
        required: [allInScope(ctx, VAN_STARS, thamPalace, "tam phương tứ chính", `cung Tham Lang (${thamPalace.role})`)],
        strengtheners: [lifeHas(ctx, "Hóa Kỵ")],
        assumptions: ["cách không gắn với cung nào: xét cung có Tham Lang; 'Văn Xương và Văn Khúc' hiểu là cả hai trong tam phương tứ chính cung đó"],
        breakers: mitigations,
      },
    ];
  },
});

const kinhDuongDocThuHam = definePattern({
  id: "kinh-duong-doc-thu-ham",
  name: "Kình Dương độc thủ hãm",
  polarity: "xấu",
  source: "MLTC tr.259–289 (Thiên Đồng mục 4.3.3); TVTH tr.75–76",
  kbFile: `${KB}19_Kinh-Duong-doc-thu-ham-Ngo.md`,
  variants: (ctx) => {
    const solo =
      ctx.options.soloKinhReading === "vô chính diệu"
        ? voidOfMain(ctx.life, "Mệnh")
        : noneInScope(ctx, ["Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"], ctx.life, "đồng cung", "Mệnh");
    const mitigations = [
      ...tuanTrietRelief(ctx.life, "TVTH tr.75–76"),
      ...mitigation(
        "Kình ở Ngọ có Khoa Quyền Lộc Tả Hữu và chính tinh đắc địa: chuyển thành Mã đầu đới kiếm [TVTH tr.75–76]",
        ctx.life.branch === 6 && inLifeGroup(ctx, [...TAM_HOA, "Tả Phụ", "Hữu Bật"]).met && mainStarBrightIn(ctx.life, ["Miếu", "Vượng", "Đắc"]).met,
        "'chính tinh đắc địa' hiểu là Miếu, Vượng hoặc Đắc",
      ),
    ];
    return [
      {
        book: "TVTH",
        label: "TVTH tr.75–76 (Kình ở Tý Ngọ Mão Dậu không yểu cũng tàn tật)",
        cite: "TVTH tr.75–76",
        required: [lifeHas(ctx, "Kình Dương"), palaceAtBranches(ctx.life, KINH_DUONG_HAM, "Mệnh (Kình Dương hãm)")],
        breakers: mitigations,
      },
      {
        book: "MLTC",
        label: "MLTC Thiên Đồng mục 4.3.3 (Kình Dương đơn thủ Tý Ngọ Mão Dậu)",
        cite: "MLTC tr.259–289 (Thiên Đồng mục 4.3.3)",
        required: [lifeHas(ctx, "Kình Dương"), lifeAt(ctx, KINH_DUONG_HAM), solo],
        assumptions: [`'đơn thủ / độc nhập' hiểu là ${ctx.options.soloKinhReading} (tùy chọn soloKinhReading)`],
        breakers: mitigations,
      },
    ];
  },
});

const locPhungXungPha = definePattern({
  id: "loc-phung-xung-pha",
  name: "Lộc phùng xung phá",
  polarity: "xấu",
  source: "MLTC tr.702–713 (Lộc Tồn mục 5.14); tr.752–768 (Hóa Kị mục 5.1); TVTH tr.165–166",
  kbFile: `${KB}20_Loc-suy-Ma-khon-Loc-phung-xung-pha.md`,
  variants: (ctx) => {
    const mitigations = mitigation(
      "chính tinh Mệnh mạnh: ảnh hưởng không lớn [MLTC Lộc Tồn mục 5.14]",
      mainStarBrightIn(ctx.life, strongLevels(ctx.options)).met,
      `'chính tinh mạnh' hiểu theo độ sáng: ${strongAssumption(ctx.options)}`,
    );
    return [
      {
        book: "MLTC",
        label: "MLTC Lộc Tồn mục 5.14 (Lộc gặp Hóa Kỵ, hoặc Thiên Không Địa Kiếp đồng cung)",
        cite: "MLTC tr.702–713 (Lộc Tồn mục 5.14); Thiên Không mục 5.2; Hóa Kị mục 5.1",
        required: [
          anyOf("Lộc Tồn hoặc Hóa Lộc ở Mệnh", LOC_ANY.map((name) => lifeHas(ctx, name))),
          anyOf("Hóa Kỵ đồng cung, hoặc Thiên Không và Địa Kiếp đồng cung", [
            lifeHas(ctx, "Hóa Kỵ"),
            allOf(`${thienKhong(ctx)} và Địa Kiếp đồng cung`, [lifeHas(ctx, thienKhong(ctx)), lifeHas(ctx, "Địa Kiếp")]),
          ]),
        ],
        assumptions: ["sách không nêu cung: xét cung Mệnh", thienKhongAssumption(ctx)],
        breakers: mitigations,
      },
      {
        book: "TVTH",
        label: "TVTH tr.165–166 (Lộc Tồn bị Hóa Kỵ chiếu)",
        cite: "TVTH tr.165–166 (lá số mẫu Âm Nam Kỷ Mùi)",
        required: [lifeHas(ctx, "Lộc Tồn"), anyInScope(ctx, ["Hóa Kỵ"], ctx.life, "tam phương tứ chính", "Mệnh")],
        assumptions: ["ví dụ TVTH là ở đại hạn; áp cho cung Mệnh của lá số gốc", "'Kỵ chiếu' hiểu là Hóa Kỵ trong tam phương tứ chính"],
        breakers: mitigations,
      },
    ];
  },
});

export const UNSUPPORTED_PATTERNS: ReadonlyArray<{ readonly id: string; readonly reason: string }> = [
  {
    id: "loc-suy-ma-khon",
    reason:
      "MLTC định nghĩa hoàn toàn trên cung Đại hạn/Tiểu hạn/Lưu niên (Lộc Tồn, Thiên Mã, Thiên Không, Địa Kiếp đồng cung tại cung hạn), không có phần lá số gốc; TVTH chỉ có câu phú 'Lộc đảo, Mã đảo kỵ Thái Tuế chi hợp Kiếp Không' không định lượng được",
  },
];

const locSuyMaKhon = unsupportedPattern({
  id: "loc-suy-ma-khon",
  name: "Lộc suy Mã khốn",
  polarity: "xấu",
  source: "MLTC tr.691–697 (Thiên Không mục 5.1); TVTH Cách cuộc luận câu 39",
  kbFile: `${KB}20_Loc-suy-Ma-khon-Loc-phung-xung-pha.md`,
});

export const BAD_PATTERNS: readonly PatternRule[] = [
  sinhBatPhungThoi,
  thatSinhCoBan,
  quanTuTaiDa,
  locPhungLuongSat,
  luongTrungHoaCai,
  maLacKhongVong,
  taiDuTuCuu,
  nhatNguyetTangHung,
  khongKiepSatHoi,
  cuPhungTuSat,
  kyAmDongMenhThanTatAch,
  satCuTuyetDia,
  linhXuongDaVu,
  duongDaGiapKy,
  hinhTuGiapAn,
  satCungLiemTrinh,
  loThuongMaiThi,
  nguyetLuongLacHam,
  voDaoChiQuan,
  deNgoHungDo,
  vanTinhNgoGiap,
  vanTinhThatVi,
  thamXuongThamKhuc,
  kinhDuongDocThuHam,
  locPhungXungPha,
  locSuyMaKhon,
];
