import { BRANCHES, parseBranch } from "../calendar/stem-branch.js";
import { MAIN_STARS, SIX_LUCKY_STARS, SIX_MALEFIC_STARS } from "../analysis/chart-query.js";
import { PALACE_ROLES, type PalaceRole } from "../chart/palaces.js";
import type { Brightness, Gender } from "../chart/types.js";
import { err, ok, type Result } from "../result.js";
import { canon, containsName } from "./text.js";

export const TRANSFORMATION_STARS = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"] as const;

export const MINOR_STARS = [
  ...SIX_LUCKY_STARS,
  ...SIX_MALEFIC_STARS,
  "Lộc Tồn", "Thiên Mã", "Đào Hoa", "Hồng Loan", "Thiên Hỷ", "Thiên Diêu", "Thiên Y", "Long Trì", "Phượng Các",
  "Ân Quang", "Thiên Quý", "Thiên Hình", "Cô Thần", "Quả Tú", "Thiên Khốc", "Thiên Hư", "Tam Thai", "Bát Tọa",
  "Thai Phụ", "Phong Cáo", "Thiên Quan", "Thiên Phúc", "Thiên Tài", "Thiên Thọ", "Thiên Không", "Hoa Cái",
  "Thiên Đức", "Nguyệt Đức", "Giải Thần", "Phá Toái", "Kiếp Sát", "Lưu Hà", "Thiên Thương", "Thiên Sứ",
  "Thiên Giải", "Địa Giải", "Thiên Khố", "Thiên Trù", "Quốc Ấn", "Đường Phù", "Đẩu Quân", "Lưu Tù", "Thiên La",
  "Địa Võng", "LN Văn Tinh", "Tuần", "Triệt",
] as const;

export const RING_STARS = [
  "Bác Sĩ", "Lực Sĩ", "Thanh Long", "Tiểu Hao", "Tướng Quân", "Tấu Thư", "Phi Liêm", "Hỷ Thần", "Bệnh Phù",
  "Đại Hao", "Phục Binh", "Quan Phủ",
  "Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng",
  "Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù", "Tuế Phá", "Long Đức", "Bạch Hổ",
  "Phúc Đức", "Điếu Khách", "Trực Phù",
] as const;

export const ALL_STARS: readonly string[] = [...MAIN_STARS, ...TRANSFORMATION_STARS, ...MINOR_STARS, ...RING_STARS];

const MAIN_STAR_SET: ReadonlySet<string> = new Set(MAIN_STARS);
export const isMainStar = (name: string): boolean => MAIN_STAR_SET.has(name);

const SPELLING_VARIANTS: Readonly<Record<string, readonly string[]>> = {
  "Hóa Kỵ": ["Hóa Kị"],
  "Thiên Hỷ": ["Thiên Hỉ"],
  "Tả Phụ": ["Tả Phù"],
  "Kình Dương": ["Dương Nhẫn"],
  "Thiên Diêu": ["Thiên Riêu"],
  "Đào Hoa": ["Hàm Trì"],
  "Tràng Sinh": ["Trường Sinh"],
  "LN Văn Tinh": ["Lưu Niên Văn Tinh", "Văn Tinh"],
};

const TEXT_AMBIGUOUS_STARS: ReadonlySet<string> = new Set(["Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng", "Phúc Đức"]);

export const isTextAmbiguousStar = (star: string): boolean => TEXT_AMBIGUOUS_STARS.has(star);

export const textFormsOf = (star: string): readonly string[] => [star, ...(SPELLING_VARIANTS[star] ?? [])];

const SHORT_ALIASES: Readonly<Record<string, string>> = {
  "cơ": "Thiên Cơ",
  "nhật": "Thái Dương",
  "nguyệt": "Thái Âm",
  "vũ": "Vũ Khúc",
  "đồng": "Thiên Đồng",
  "liêm": "Liêm Trinh",
  "phủ": "Thiên Phủ",
  "tham": "Tham Lang",
  "cự": "Cự Môn",
  "tướng": "Thiên Tướng",
  "lương": "Thiên Lương",
  "sát": "Thất Sát",
  "phá": "Phá Quân",
  "xương": "Văn Xương",
  "khúc": "Văn Khúc",
  "khôi": "Thiên Khôi",
  "việt": "Thiên Việt",
  "tả": "Tả Phụ",
  "phù": "Tả Phụ",
  "hữu": "Hữu Bật",
  "bật": "Hữu Bật",
  "kình": "Kình Dương",
  "đà": "Đà La",
  "hỏa": "Hỏa Tinh",
  "linh": "Linh Tinh",
  "không": "Địa Không",
  "kiếp": "Địa Kiếp",
  "đào": "Đào Hoa",
  "hồng": "Hồng Loan",
  "hỷ": "Thiên Hỷ",
  "hỉ": "Thiên Hỷ",
  "diêu": "Thiên Diêu",
  "riêu": "Thiên Diêu",
  "hình": "Thiên Hình",
  "mã": "Thiên Mã",
  "quyền": "Hóa Quyền",
  "khoa": "Hóa Khoa",
  "kỵ": "Hóa Kỵ",
  "kị": "Hóa Kỵ",
  "cô": "Cô Thần",
  "quả": "Quả Tú",
  "long": "Long Trì",
  "phượng": "Phượng Các",
  "quang": "Ân Quang",
  "tang": "Tang Môn",
  "hổ": "Bạch Hổ",
  "khốc": "Thiên Khốc",
  "hư": "Thiên Hư",
};

interface GroupAlias {
  readonly phrase: string;
  readonly members: readonly string[];
  readonly safeInText: boolean;
}

const group = (phrase: string, members: readonly string[], safeInText = true): GroupAlias => ({ phrase, members, safeInText });

const GROUP_ALIASES: readonly GroupAlias[] = [
  group("Khôi Việt", ["Thiên Khôi", "Thiên Việt"]),
  group("Xương Khúc", ["Văn Xương", "Văn Khúc"]),
  group("Tả Hữu", ["Tả Phụ", "Hữu Bật"]),
  group("Phù Bật", ["Tả Phụ", "Hữu Bật"]),
  group("Long Phượng", ["Long Trì", "Phượng Các"]),
  group("Quang Quý", ["Ân Quang", "Thiên Quý"]),
  group("Không Kiếp", ["Địa Không", "Địa Kiếp"]),
  group("Kình Đà", ["Kình Dương", "Đà La"]),
  group("Dương Đà", ["Kình Dương", "Đà La"]),
  group("Hỏa Linh", ["Hỏa Tinh", "Linh Tinh"]),
  group("Linh Hỏa", ["Hỏa Tinh", "Linh Tinh"]),
  group("Đào Hồng", ["Đào Hoa", "Hồng Loan"]),
  group("Hồng Đào", ["Đào Hoa", "Hồng Loan"]),
  group("Cô Quả", ["Cô Thần", "Quả Tú"]),
  group("Tang Hổ", ["Tang Môn", "Bạch Hổ"]),
  group("Khốc Hư", ["Thiên Khốc", "Thiên Hư"]),
  group("Song Hao", ["Đại Hao", "Tiểu Hao"]),
  group("Tam Hóa", ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa"]),
  group("Khoa Quyền Lộc", ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa"]),
  group("Tuần Triệt", ["Tuần", "Triệt"]),
  group("Nhật Nguyệt", ["Thái Dương", "Thái Âm"]),
  group("Âm Dương", ["Thái Dương", "Thái Âm"], false),
  group("Tử Phủ", ["Tử Vi", "Thiên Phủ"]),
  group("Sát Phá Tham", ["Thất Sát", "Phá Quân", "Tham Lang"]),
  group("Sát Phá Liêm Tham", ["Thất Sát", "Phá Quân", "Liêm Trinh", "Tham Lang"]),
  group("Vũ Tham", ["Vũ Khúc", "Tham Lang"]),
  group("Tuế Hổ Phù", ["Thái Tuế", "Bạch Hổ", "Quan Phù"]),
  group("Lộc Mã", ["Lộc Tồn", "Thiên Mã"]),
  group("Thai Cáo", ["Thai Phụ", "Phong Cáo"]),
  group("Lục sát", SIX_MALEFIC_STARS, false),
  group("Lục cát", SIX_LUCKY_STARS, false),
  group("Tứ sát", ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh"], false),
];

const LABEL_SEPARATORS = /\s*(?:[,;/+&–—|]|\s-\s|\svà\s|\s·\s)\s*/;

const unique = <T>(items: readonly T[]): readonly T[] => [...new Set(items)];

interface StarForm {
  readonly star: string;
  readonly form: string;
  readonly pattern: RegExp;
}

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const boundedGlobal = (form: string): RegExp => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(form)}(?![\\p{L}\\p{N}])`, "gu");

const STAR_FORMS: readonly StarForm[] = ALL_STARS.flatMap((star) =>
  textFormsOf(star).map((form) => ({ star, form: canon(form), pattern: boundedGlobal(canon(form)) })),
).sort((a, b) => b.form.length - a.form.length);

const memoize = <T>(compute: (key: string) => T): ((key: string) => T) => {
  const cache = new Map<string, T>();
  return (key) => {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const value = compute(key);
    cache.set(key, value);
    return value;
  };
};

const scanStarNames = memoize((canonText: string): readonly string[] => {
  let rest = canonText;
  const found: string[] = [];
  for (const entry of STAR_FORMS) {
    if (!rest.includes(entry.form)) continue;
    const stripped = rest.replace(entry.pattern, " ");
    if (stripped === rest) continue;
    rest = stripped;
    found.push(entry.star);
  }
  return unique(found);
});

const fullNamesIn = (canonText: string, allowAmbiguous: boolean): readonly string[] =>
  scanStarNames(canonText).filter((star) => allowAmbiguous || !TEXT_AMBIGUOUS_STARS.has(star));

const groupMembersIn = (canonText: string, inText: boolean): readonly string[] =>
  GROUP_ALIASES.filter((alias) => (inText ? alias.safeInText : true) && containsName(canonText, alias.phrase)).flatMap((alias) => alias.members);

const EXACT_STAR_BY_CANON: ReadonlyMap<string, string> = new Map(ALL_STARS.map((star) => [canon(star), star]));

export const starsInLabel = memoize((canonLabel: string): readonly string[] => {
  const tokens = canonLabel
    .replace(/[():.]/g, " ")
    .split(LABEL_SEPARATORS)
    .map((token) => token.replace(/\d+/g, " ").trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const singles = tokens.flatMap((token) => {
    const known = SHORT_ALIASES[token] ?? EXACT_STAR_BY_CANON.get(token);
    return known ? [known] : [];
  });
  return unique([...fullNamesIn(canonLabel, false), ...groupMembersIn(canonLabel, false), ...singles]);
});

export const starsInText = memoize((canonText: string): readonly string[] =>
  unique([...fullNamesIn(canonText, false), ...groupMembersIn(canonText, true)]),
);

export const starsInTitle = memoize((canonText: string): readonly string[] => fullNamesIn(canonText, true));

export const textMentionsStar = (canonText: string, star: string): boolean => starsInText(canonText).includes(star);

export const labelMentionsStar = (canonLabel: string | undefined, star: string): boolean =>
  canonLabel !== undefined && starsInLabel(canonLabel).includes(star);

export function starsInKeyword(keyword: string): readonly string[] {
  const text = canon(keyword);
  const singles = text.split(/\s+/).length === 1 ? starsInLabel(text) : [];
  const exact = EXACT_STAR_BY_CANON.get(text);
  return unique([...fullNamesIn(text, false), ...groupMembersIn(text, false), ...singles, ...(exact ? [exact] : [])]);
}

const STAR_INPUT_LOOKUP: ReadonlyMap<string, string> = new Map([
  ...ALL_STARS.flatMap((star) => textFormsOf(star).map((form) => [canon(form), star] as const)),
  ...Object.entries(SHORT_ALIASES).map(([alias, star]) => [alias, star] as const),
  ["kình", "Kình Dương"],
  ["hóa kị", "Hóa Kỵ"],
  ["kỵ", "Hóa Kỵ"],
]);

export function resolveStarName(input: string): Result<string> {
  const key = canon(input).replace(/^sao\s+/, "");
  const found = STAR_INPUT_LOOKUP.get(key);
  return found ? ok(found) : err(`Không nhận ra tên sao "${input}". Ví dụ hợp lệ: Cự Môn, Thiên Phủ, Kình Dương, Hóa Kỵ, Đào Hoa, Tuần.`);
}

interface RoleNames {
  readonly forms: readonly string[];
  readonly shortForms: readonly string[];
}

export const ROLE_NAMES: Readonly<Record<PalaceRole, RoleNames>> = {
  "Mệnh": { forms: ["Mệnh"], shortForms: [] },
  "Phụ Mẫu": { forms: ["Phụ Mẫu", "Văn Thư"], shortForms: ["phụ"] },
  "Phúc Đức": { forms: ["Phúc Đức"], shortForms: ["phúc"] },
  "Điền Trạch": { forms: ["Điền Trạch"], shortForms: ["điền", "trạch"] },
  "Quan Lộc": { forms: ["Quan Lộc"], shortForms: ["quan"] },
  "Nô Bộc": { forms: ["Nô Bộc", "Bộc Dịch", "Giao Hữu"], shortForms: ["nô", "bộc"] },
  "Thiên Di": { forms: ["Thiên Di"], shortForms: ["di"] },
  "Tật Ách": { forms: ["Tật Ách", "Giải Ách"], shortForms: ["tật"] },
  "Tài Bạch": { forms: ["Tài Bạch"], shortForms: ["tài"] },
  "Tử Tức": { forms: ["Tử Tức", "Tử Nữ"], shortForms: ["tử"] },
  "Phu Thê": { forms: ["Phu Thê", "Hôn phối", "Phu Quân"], shortForms: ["phối", "thê", "phu"] },
  "Huynh Đệ": { forms: ["Huynh Đệ"], shortForms: ["huynh", "bào"] },
};

export const roleFormsOf = (role: PalaceRole): readonly string[] => ROLE_NAMES[role].forms;

export function labelMentionsRole(canonLabel: string | undefined, role: PalaceRole): boolean {
  if (canonLabel === undefined) return false;
  if (ROLE_NAMES[role].forms.some((form) => containsName(canonLabel, form))) return true;
  const tokens = canonLabel.replace(/[():.]/g, " ").split(LABEL_SEPARATORS).map((token) => token.trim());
  return tokens.some((token) => ROLE_NAMES[role].shortForms.includes(token));
}

export const textMentionsRole = (canonText: string, role: PalaceRole): boolean =>
  ROLE_NAMES[role].forms.some((form) => containsName(canonText, form));

export function resolveRole(input: string): Result<PalaceRole> {
  const key = canon(input).replace(/^cung\s+/, "");
  const role = PALACE_ROLES.find(
    (candidate) => ROLE_NAMES[candidate].forms.some((form) => canon(form) === key) || ROLE_NAMES[candidate].shortForms.includes(key),
  );
  return role ? ok(role) : err(`Không nhận ra cung chức "${input}". Hợp lệ: ${PALACE_ROLES.join(", ")} (hoặc gọi tắt: Phối, Quan, Tài, Di, Phúc, Bào…).`);
}

export const BRANCH_TEXT_FORMS: readonly (readonly string[])[] = BRANCHES.map((name) =>
  name === "Tý" ? ["Tý", "Tí"] : name === "Tỵ" ? ["Tỵ", "Tị"] : [name],
);

export const branchFormsOf = (branch: number): readonly string[] => BRANCH_TEXT_FORMS[branch] ?? [];

export const textMentionsBranch = (canonText: string, branch: number): boolean =>
  branchFormsOf(branch).some((form) => containsName(canonText, form));

export const resolveBranchName = (input: string): Result<number> => parseBranch(input.trim().replace(/^(chi|địa chi|cung)\s+/i, ""));

export const BRIGHTNESS_WORDS: Readonly<Record<Brightness, readonly string[]>> = {
  "Miếu": ["miếu"],
  "Vượng": ["vượng"],
  "Đắc": ["đắc địa", "đắc"],
  "Lợi": ["lợi"],
  "Bình": ["bình"],
  "Hãm": ["hãm", "lạc hãm"],
};

export const textMentionsBrightness = (canonText: string, brightness: Brightness): boolean =>
  BRIGHTNESS_WORDS[brightness].some((word) => containsName(canonText, word));

const BRIGHTNESS_LOOKUP: ReadonlyMap<string, Brightness> = new Map(
  (Object.keys(BRIGHTNESS_WORDS) as Brightness[]).flatMap((brightness) => [
    [canon(brightness), brightness] as const,
    ...BRIGHTNESS_WORDS[brightness].map((word) => [word, brightness] as const),
  ]),
);

export function resolveBrightness(input: string): Result<Brightness> {
  const found = BRIGHTNESS_LOOKUP.get(canon(input));
  return found ? ok(found) : err(`Không nhận ra độ sáng "${input}". Hợp lệ: Miếu, Vượng, Đắc, Lợi, Bình, Hãm.`);
}

export const GENDER_HEADINGS: Readonly<Record<Gender, string>> = { nam: "nam mệnh", "nữ": "nữ mệnh" };
