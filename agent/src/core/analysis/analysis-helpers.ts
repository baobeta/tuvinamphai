import { BRANCHES, branchName, mod, parseBranch, type BranchName } from "../calendar/stem-branch.js";
import type { Brightness, Chart, Palace, PlacedStar, Transformation } from "../chart/types.js";
import { err, ok, type Result } from "../result.js";
import { asTransformation, flankingOf, hasStarIn, mainStarsIn, palaceAt, STRONG_BRIGHTNESS } from "./chart-query.js";

export const branchIndex = (name: BranchName): number => BRANCHES.indexOf(name);

export const branchIn = (branch: number, names: readonly BranchName[]): boolean => names.includes(branchName(branch));

export function resolveBranch(input: number | string): Result<number> {
  if (typeof input === "string") return parseBranch(input);
  return Number.isInteger(input) && input >= 0 && input <= 11 ? ok(input) : err(`Địa chi phải là số nguyên 0–11 (Tý=0 … Hợi=11); nhận được ${input}`);
}

export interface StarSummary {
  readonly name: string;
  readonly brightness?: Brightness;
  readonly transformation?: Transformation;
}

export const summarizeStar = (star: PlacedStar): StarSummary => ({
  name: star.name,
  ...(star.brightness ? { brightness: star.brightness } : {}),
  ...(star.transformation ? { transformation: star.transformation } : {}),
});

export const formatSummary = (star: StarSummary): string => {
  const details = [star.brightness, star.transformation].filter(Boolean);
  return details.length ? `${star.name} (${details.join(", ")})` : star.name;
};

export const isStrong = (star: StarSummary): boolean => star.brightness !== undefined && STRONG_BRIGHTNESS.includes(star.brightness);

export const mainSummaries = (palace: Palace): readonly StarSummary[] => mainStarsIn(palace).map(summarizeStar);

export const mainNames = (palace: Palace): readonly string[] => mainStarsIn(palace).map((star) => star.name);

export function carrierName(palace: Palace, name: string): string {
  const transformation = asTransformation(name);
  if (!transformation) return name;
  const carrier = palace.stars.find((star) => star.transformation === transformation);
  return carrier ? `${name} (${carrier.name})` : name;
}

export const palaceTag = (palace: Palace): string => `${palace.role} (${branchName(palace.branch)})`;

export const hasAny = (palace: Palace, names: readonly string[]): boolean => names.some((name) => hasStarIn(palace, name));

export const presentIn = (palace: Palace, names: readonly string[]): readonly string[] => names.filter((name) => hasStarIn(palace, name));

export const presentInAny = (palaces: readonly Palace[], names: readonly string[]): readonly string[] =>
  names.filter((name) => palaces.some((palace) => hasStarIn(palace, name)));

export interface FlankPlacement {
  readonly star: string;
  readonly display: string;
  readonly branch: number;
  readonly role: string;
}

export function flankPlacements(chart: Chart, branch: number, first: string, second: string): readonly [FlankPlacement, FlankPlacement] | undefined {
  const [before, after] = flankingOf(chart, branch);
  const place = (star: string, palace: Palace): FlankPlacement => ({ star, display: carrierName(palace, star), branch: palace.branch, role: palace.role });
  if (hasStarIn(before, first) && hasStarIn(after, second)) return [place(first, before), place(second, after)];
  if (hasStarIn(before, second) && hasStarIn(after, first)) return [place(first, after), place(second, before)];
  return undefined;
}

export const describePlacements = (placements: readonly FlankPlacement[]): string =>
  placements.map((placed) => `${placed.display} ở ${placed.role} (${branchName(placed.branch)})`).join(", ");

export const oppositeOf = (chart: Chart, branch: number): Palace => palaceAt(chart, mod(branch + 6, 12));
