import { bodyPalace, hasStarIn, isVoidOfMainStars, lifePalace, mainStarsIn, palaceAt, palaceByRole, palacesOfStar } from "../analysis/chart-query.js";
import { branchName, mod, parseBranch, STEMS, type BranchName, type StemName } from "../calendar/stem-branch.js";
import type { PalaceRole } from "../chart/palaces.js";
import type { Brightness, Chart, Gender, Palace, Transformation } from "../chart/types.js";
import type { Condition, PatternContext, PatternOptions, Scope } from "./types.js";

export const TU_SAT = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh"] as const;
export const KHONG_KIEP = ["Địa Không", "Địa Kiếp"] as const;
export const LUC_SAT = [...TU_SAT, ...KHONG_KIEP] as const;
export const SAT_PHA_CACH = [...LUC_SAT, "Hóa Kỵ"] as const;
export const LUC_CAT = ["Văn Xương", "Văn Khúc", "Tả Phụ", "Hữu Bật", "Thiên Khôi", "Thiên Việt"] as const;
export const TAM_HOA = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa"] as const;
export const BAN_CACH_CAT = ["Lộc Tồn", ...TAM_HOA, ...LUC_CAT] as const;
export const LOC_ANY = ["Lộc Tồn", "Hóa Lộc"] as const;

export type Role = PalaceRole | "Thân";

export const contextOf = (chart: Chart, options: PatternOptions): PatternContext => ({
  chart,
  options,
  life: lifePalace(chart),
  body: bodyPalace(chart),
});

export const roleName = (role: Role): string => (role === "Thân" ? "cung Thân" : role);

export const palaceOf = (ctx: PatternContext, role: Role): Palace => (role === "Thân" ? ctx.body : palaceByRole(ctx.chart, role));

export const describePalace = (palace: Palace): string => `${palace.role} (${branchName(palace.branch)})`;

const branchIndex = (name: BranchName): number => {
  const parsed = parseBranch(name);
  return parsed.ok ? parsed.value : -1;
};

export const branchesOf = (names: readonly BranchName[]): readonly number[] => names.map(branchIndex);

const joinNames = (names: readonly string[]): string => names.join(", ");

export const condition = (label: string, met: boolean, assumption?: string): Condition =>
  assumption ? { label, met, assumption } : { label, met };

export const withAssumption = (item: Condition, assumption: string): Condition => ({ ...item, assumption });

export const allOf = (label: string, items: readonly Condition[]): Condition => {
  const assumptions = items.map((item) => item.assumption).filter((text): text is string => Boolean(text));
  const unmet = items.filter((item) => !item.met).map((item) => item.label);
  const detail = unmet.length ? ` — thiếu: ${unmet.join("; ")}` : "";
  return condition(`${label}${detail}`, unmet.length === 0, assumptions.length ? assumptions.join("; ") : undefined);
};

export const anyOf = (label: string, items: readonly Condition[]): Condition => {
  const hit = items.find((item) => item.met);
  const chosen = hit ?? items[0];
  const detail = hit ? ` — đạt: ${hit.label}` : "";
  return condition(`${label}${detail}`, Boolean(hit), chosen?.assumption);
};

export const negate = (label: string, item: Condition): Condition => condition(label, !item.met, item.assumption);

export const scopePalaces = (ctx: PatternContext, palace: Palace, scope: Scope): readonly Palace[] => {
  const at = (offset: number): Palace => palaceAt(ctx.chart, palace.branch + offset);
  if (scope === "đồng cung") return [palace];
  if (scope === "xung chiếu") return [at(6)];
  if (scope === "tam hợp") return [palace, at(4), at(8)];
  return [palace, at(4), at(8), at(6)];
};

export const starsPresent = (ctx: PatternContext, names: readonly string[], palace: Palace, scope: Scope): readonly string[] =>
  names.filter((name) => scopePalaces(ctx, palace, scope).some((item) => hasStarIn(item, name)));

const palaceLabel = (palace: Palace, where?: string): string => where ?? describePalace(palace);

export const starIn = (name: string, palace: Palace, where?: string): Condition =>
  condition(`${name} ở ${palaceLabel(palace, where)}`, hasStarIn(palace, name));

export const starInRole = (ctx: PatternContext, name: string, role: Role): Condition => {
  const palace = palaceOf(ctx, role);
  return starIn(name, palace, `${roleName(role)} (${branchName(palace.branch)})`);
};

export const starsInPalace = (names: readonly string[], palace: Palace, where?: string): Condition =>
  condition(`${joinNames(names)} cùng ở ${palaceLabel(palace, where)}`, names.every((name) => hasStarIn(palace, name)));

export const palaceAtBranches = (palace: Palace, branches: readonly BranchName[], where?: string): Condition =>
  condition(
    `${palaceLabel(palace, where)} thuộc ${branches.join("/")}`,
    branchesOf(branches).includes(palace.branch),
  );

export const roleAt = (ctx: PatternContext, role: Role, branches: readonly BranchName[]): Condition => {
  const palace = palaceOf(ctx, role);
  return condition(`${roleName(role)} tại ${branches.join("/")} (thực tế ${branchName(palace.branch)})`, branchesOf(branches).includes(palace.branch));
};

export const starAt = (ctx: PatternContext, name: string, branches: readonly BranchName[]): Condition => {
  const located = palacesOfStar(ctx.chart, name);
  const actual = located.length ? located.map(branchName).join("/") : "không có";
  return condition(`${name} tại ${branches.join("/")} (thực tế ${actual})`, located.some((branch) => branchesOf(branches).includes(branch)));
};

export const samePalace = (ctx: PatternContext, names: readonly string[]): Condition => {
  const shared = ctx.chart.palaces.filter((palace) => names.every((name) => hasStarIn(palace, name)));
  const where = shared.length ? ` (tại ${shared.map((palace) => branchName(palace.branch)).join("/")})` : "";
  return condition(`${joinNames(names)} đồng cung${where}`, shared.length > 0);
};

export const sharedPalace = (ctx: PatternContext, names: readonly string[]): Palace | undefined =>
  ctx.chart.palaces.find((palace) => names.every((name) => hasStarIn(palace, name)));

const scopeLabel = (scope: Scope, palace: Palace, where?: string): string => `${scope} ${palaceLabel(palace, where)}`;

export const anyInScope = (ctx: PatternContext, names: readonly string[], palace: Palace, scope: Scope, where?: string): Condition => {
  const found = starsPresent(ctx, names, palace, scope);
  return condition(
    `có ${names.length === 1 ? names[0] : `một trong [${joinNames(names)}]`} trong ${scopeLabel(scope, palace, where)}${found.length && names.length > 1 ? `: ${joinNames(found)}` : ""}`,
    found.length > 0,
  );
};

export const allInScope = (ctx: PatternContext, names: readonly string[], palace: Palace, scope: Scope, where?: string): Condition => {
  const found = starsPresent(ctx, names, palace, scope);
  const lacking = names.filter((name) => !found.includes(name));
  return condition(
    `đủ ${joinNames(names)} trong ${scopeLabel(scope, palace, where)}${lacking.length ? ` (thiếu ${joinNames(lacking)})` : ""}`,
    lacking.length === 0,
  );
};

export const countInScope = (
  ctx: PatternContext,
  names: readonly string[],
  palace: Palace,
  scope: Scope,
  minimum: number,
  where?: string,
): Condition => {
  const found = starsPresent(ctx, names, palace, scope);
  return condition(
    `${found.length}/${names.length} sao [${joinNames(names)}] trong ${scopeLabel(scope, palace, where)}${found.length ? `: ${joinNames(found)}` : ""} (ngưỡng ${minimum})`,
    found.length >= minimum,
  );
};

export const noneInScope = (ctx: PatternContext, names: readonly string[], palace: Palace, scope: Scope, where?: string): Condition => {
  const found = starsPresent(ctx, names, palace, scope);
  return condition(
    `không có [${joinNames(names)}] trong ${scopeLabel(scope, palace, where)}${found.length ? ` (đang có ${joinNames(found)})` : ""}`,
    found.length === 0,
  );
};

export const flankedBy = (ctx: PatternContext, first: string, second: string, palace: Palace, where?: string): Condition => {
  const before = palaceAt(ctx.chart, palace.branch - 1);
  const after = palaceAt(ctx.chart, palace.branch + 1);
  const met = (hasStarIn(before, first) && hasStarIn(after, second)) || (hasStarIn(before, second) && hasStarIn(after, first));
  return condition(`${first} và ${second} giáp ${palaceLabel(palace, where)}`, met);
};

export const stemIn = (ctx: PatternContext, stems: readonly StemName[]): Condition => {
  const actual = STEMS[mod(ctx.chart.parameters.year.stem, 10)]!;
  return condition(`tuổi ${stems.join("/")} (thực tế ${actual})`, stems.includes(actual));
};

export const yearBranchIn = (ctx: PatternContext, branches: readonly BranchName[]): Condition => {
  const actual = branchName(ctx.chart.parameters.year.branch);
  return condition(`năm ${branches.join("/")} (thực tế ${actual})`, branches.includes(actual));
};

export const genderIs = (ctx: PatternContext, gender: Gender): Condition =>
  condition(`${gender === "nam" ? "nam" : "nữ"} mệnh`, ctx.chart.parameters.gender === gender);

export const transformed = (ctx: PatternContext, name: string, transformation: Transformation): Condition => {
  const placed = ctx.chart.palaces.flatMap((palace) => palace.stars).find((star) => star.name === name && star.transformation === transformation);
  return condition(`${name} ${transformation}`, Boolean(placed));
};

export const tuanTrietAt = (palace: Palace, which: "Tuần" | "Triệt" | "Tuần hoặc Triệt" = "Tuần hoặc Triệt", where?: string): Condition => {
  const names = which === "Tuần hoặc Triệt" ? ["Tuần", "Triệt"] : [which];
  const found = names.filter((name) => palace.stars.some((star) => star.name === name));
  return condition(`${which} tại ${palaceLabel(palace, where)}${found.length ? ` (có ${found.join(", ")})` : ""}`, found.length > 0);
};

export const voidOfMain = (palace: Palace, where?: string): Condition =>
  condition(`${palaceLabel(palace, where)} vô chính diệu`, isVoidOfMainStars(palace));

export const soleMainStar = (palace: Palace, name: string, where?: string): Condition => {
  const mains = mainStarsIn(palace).map((star) => star.name);
  return condition(`${name} độc tọa ${palaceLabel(palace, where)}${mains.length > 1 ? ` (có ${joinNames(mains)})` : ""}`, mains.length === 1 && mains[0] === name);
};

export const strongLevels = (options: PatternOptions): readonly Brightness[] =>
  options.strongIncludesDac ? ["Miếu", "Vượng", "Đắc"] : ["Miếu", "Vượng"];

export const strongAssumption = (options: PatternOptions): string =>
  options.strongIncludesDac ? "'miếu vượng' hiểu gồm cả Đắc (GA-6)" : "'miếu vượng' hiểu là Miếu hoặc Vượng, không gồm Đắc (GA-6)";

export const brightnessIn = (ctx: PatternContext, name: string, levels: readonly Brightness[]): Condition => {
  const placed = ctx.chart.palaces.flatMap((palace) => palace.stars).find((star) => star.name === name && star.group === "chính tinh");
  const actual = placed?.brightness ?? "không xếp hạng";
  return condition(`${name} ${levels.join("/")} (thực tế ${actual})`, Boolean(placed?.brightness && levels.includes(placed.brightness)));
};

export const mainStarBrightIn = (palace: Palace, levels: readonly Brightness[], where?: string): Condition => {
  const mains = mainStarsIn(palace);
  const actual = mains.length ? mains.map((star) => `${star.name} ${star.brightness ?? "không xếp hạng"}`).join(", ") : "vô chính diệu";
  return condition(
    `chính tinh ${palaceLabel(palace, where)} ${levels.join("/")} (thực tế ${actual})`,
    mains.some((star) => star.brightness !== undefined && levels.includes(star.brightness)),
    "chính tinh đạt độ sáng khi ít nhất một chính tinh trong cung đạt mức yêu cầu (bảng miếu hãm TVTH của lá số)",
  );
};

export const mainStarHasLuckyTransformation = (palace: Palace, where?: string): Condition => {
  const lucky = mainStarsIn(palace).filter((star) => star.transformation && star.transformation !== "Hóa Kỵ");
  return condition(`chính tinh ${palaceLabel(palace, where)} hóa cát`, lucky.length > 0);
};

export const MINOR_STAR_GOOD_BRANCHES: Readonly<Record<string, readonly BranchName[]>> = {
  "Kình Dương": ["Thìn", "Tuất", "Sửu", "Mùi"],
  "Địa Không": ["Tỵ", "Hợi", "Dần", "Thân"],
  "Địa Kiếp": ["Tỵ", "Hợi", "Dần", "Thân"],
  "Thiên Hình": ["Dần", "Thân", "Mão", "Dậu"],
};

export const KINH_DUONG_HAM: readonly BranchName[] = ["Tý", "Ngọ", "Mão", "Dậu"];

export const isDaytime = (ctx: PatternContext): Condition =>
  condition(
    `sinh ban ngày (giờ ${branchName(ctx.chart.parameters.hour)})`,
    ctx.options.daytimeHours.includes(ctx.chart.parameters.hour),
    `ban ngày hiểu là giờ ${ctx.options.daytimeHours.map(branchName).join(", ")} (EXT-DAYNIGHT, sách không định ranh giới)`,
  );

export const isNighttime = (ctx: PatternContext): Condition => {
  const day = isDaytime(ctx);
  return condition(`sinh ban đêm (giờ ${branchName(ctx.chart.parameters.hour)})`, !day.met, day.assumption);
};

export const thienKhong = (ctx: PatternContext): string => ctx.options.thienKhongReading;

export const thienKhongAssumption = (ctx: PatternContext): string =>
  ctx.options.thienKhongReading === "Địa Không"
    ? "'Thiên Không' trong MLTC hiểu là Địa Không (bạn của Địa Kiếp), không phải Thiên Không vòng Thái Tuế"
    : "'Thiên Không' trong MLTC hiểu là sao Thiên Không (an theo chi năm)";

export const khongVongAt = (ctx: PatternContext, palace: Palace, where?: string): Condition => {
  const names = ctx.options.khongVongIncludesThienKhong ? ["Tuần", "Triệt", "Thiên Không"] : ["Tuần", "Triệt"];
  const found = names.filter((name) => palace.stars.some((star) => star.name === name));
  return condition(
    `Không Vong tại ${palaceLabel(palace, where)}${found.length ? ` (có ${found.join(", ")})` : ""}`,
    found.length > 0,
    `'Không Vong' hiểu là ${names.join(", ")} đóng tại cung`,
  );
};

export const relativePalace = (ctx: PatternContext, palace: Palace, offset: number): Palace => palaceAt(ctx.chart, palace.branch + offset);
