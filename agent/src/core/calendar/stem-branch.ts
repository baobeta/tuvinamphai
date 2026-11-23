import { err, ok, type Result } from "../result.js";

export const STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
export const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;

export type StemName = (typeof STEMS)[number];
export type BranchName = (typeof BRANCHES)[number];
export type Polarity = "Dương" | "Âm";

export interface StemBranch {
  readonly stem: number;
  readonly branch: number;
}

export const mod = (n: number, m: number): number => ((n % m) + m) % m;

export const stemName = (stem: number): StemName => STEMS[mod(stem, 10)]!;
export const branchName = (branch: number): BranchName => BRANCHES[mod(branch, 12)]!;
export const stemBranchName = ({ stem, branch }: StemBranch): string => `${stemName(stem)} ${branchName(branch)}`;

export const stemPolarity = (stem: number): Polarity => (mod(stem, 2) === 0 ? "Dương" : "Âm");
export const branchPolarity = (branch: number): Polarity => (mod(branch, 2) === 0 ? "Dương" : "Âm");

const normalizeName = (text: string): string => text.trim().normalize("NFC").toLowerCase();

const STEM_LOOKUP: ReadonlyMap<string, number> = new Map(STEMS.map((name, i) => [name.toLowerCase(), i]));
const BRANCH_LOOKUP: ReadonlyMap<string, number> = new Map([
  ...BRANCHES.map((name, i) => [name.toLowerCase(), i] as const),
  ["tí", 0],
  ["tị", 5],
]);

export function parseStem(text: string): Result<number> {
  const found = STEM_LOOKUP.get(normalizeName(text));
  return found === undefined ? err(`Không nhận ra thiên can "${text}". Hợp lệ: ${STEMS.join(", ")}`) : ok(found);
}

export function parseBranch(text: string): Result<number> {
  const found = BRANCH_LOOKUP.get(normalizeName(text));
  return found === undefined ? err(`Không nhận ra địa chi "${text}". Hợp lệ: ${BRANCHES.join(", ")}`) : ok(found);
}

export function parseStemBranch(text: string): Result<StemBranch> {
  const parts = text.trim().normalize("NFC").split(/\s+/);
  if (parts.length !== 2) return err(`Can chi phải gồm hai chữ, ví dụ "Giáp Tý"; nhận được "${text}"`);
  const stem = parseStem(parts[0]!);
  if (!stem.ok) return stem;
  const branch = parseBranch(parts[1]!);
  if (!branch.ok) return branch;
  if (mod(stem.value, 2) !== mod(branch.value, 2)) {
    return err(`"${text}" không có trong 60 hoa giáp: can và chi phải cùng âm hoặc cùng dương`);
  }
  return ok({ stem: stem.value, branch: branch.value });
}

export const sexagenaryIndex = ({ stem, branch }: StemBranch): number => mod(6 * stem - 5 * branch, 60);
export const fromSexagenaryIndex = (index: number): StemBranch => ({ stem: mod(index, 10), branch: mod(index, 12) });

export const yearStemBranch = (lunarYear: number): StemBranch => ({
  stem: mod(lunarYear - 4, 10),
  branch: mod(lunarYear - 4, 12),
});

export const firstMonthStem = (yearStem: number): number => mod((mod(yearStem, 5) + 1) * 2, 10);

export const monthStemBranch = (yearStem: number, lunarMonth: number): StemBranch => ({
  stem: mod(firstMonthStem(yearStem) + lunarMonth - 1, 10),
  branch: mod(lunarMonth + 1, 12),
});

export const dayStemBranch = (julianDay: number): StemBranch => ({
  stem: mod(julianDay + 9, 10),
  branch: mod(julianDay + 1, 12),
});

export const ratHourStem = (dayStem: number): number => mod(mod(dayStem, 5) * 2, 10);

export const hourStemBranch = (dayStem: number, hourBranch: number): StemBranch => ({
  stem: mod(ratHourStem(dayStem) + hourBranch, 10),
  branch: mod(hourBranch, 12),
});

export const decadeLeaderBranch = ({ stem, branch }: StemBranch): number => mod(branch - stem, 12);

export const tuanVoidBranches = (stemBranch: StemBranch): readonly [number, number] => {
  const leader = decadeLeaderBranch(stemBranch);
  return [mod(leader + 10, 12), mod(leader + 11, 12)];
};
