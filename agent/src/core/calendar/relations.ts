import type { Element } from "./five-elements.js";
import { branchName, mod, stemName } from "./stem-branch.js";

const TRINE_ELEMENTS: readonly Element[] = ["Thủy", "Kim", "Hỏa", "Mộc"];
const STEM_COMBINATION_ELEMENTS: readonly Element[] = ["Thổ", "Kim", "Thủy", "Mộc", "Hỏa"];
const CLASH_GROUP_NAMES = [
  "Tứ chính (tứ tuyệt, tứ bại): Tý Ngọ Mão Dậu",
  "Tứ mộ (tứ khố): Thìn Tuất Sửu Mùi",
  "Tứ sinh (tứ mã): Dần Thân Tỵ Hợi",
] as const;

export const trineGroup = (branch: number): number => mod(branch, 4);

export interface Trine {
  readonly branches: readonly [number, number, number];
  readonly element: Element;
}

export function trine(branch: number): Trine {
  const group = trineGroup(branch);
  const birthBranch = mod(8 - 3 * group, 12);
  return {
    branches: [birthBranch, mod(birthBranch + 4, 12), mod(birthBranch + 8, 12)],
    element: TRINE_ELEMENTS[group]!,
  };
}

export const sixCombinationPartner = (branch: number): number => mod(1 - branch, 12);
export const clashPartner = (branch: number): number => mod(branch + 6, 12);
export const sixHarmPartner = (branch: number): number => mod(7 - branch, 12);

export const fourClashGroup = (branch: number): number => mod(branch, 3);

export function fourClash(branch: number): { readonly branches: readonly number[]; readonly name: string } {
  const group = fourClashGroup(branch);
  return { branches: [0, 1, 2, 3].map((i) => mod(group + 3 * i, 12)), name: CLASH_GROUP_NAMES[group]! };
}

export interface ThreeSidesFourSquares {
  readonly self: number;
  readonly trines: readonly [number, number];
  readonly opposite: number;
}

export const threeSidesFourSquares = (palace: number): ThreeSidesFourSquares => ({
  self: mod(palace, 12),
  trines: [mod(palace + 4, 12), mod(palace + 8, 12)],
  opposite: mod(palace + 6, 12),
});

export const flankingPalaces = (palace: number): readonly [number, number] => [mod(palace - 1, 12), mod(palace + 1, 12)];

export const stemCombination = (stem: number): { readonly partner: number; readonly element: Element } => ({
  partner: mod(stem + 5, 10),
  element: STEM_COMBINATION_ELEMENTS[mod(stem, 5)]!,
});

export const describeStemCombination = (stem: number): string => {
  const { partner, element } = stemCombination(stem);
  return `${stemName(stem)} hợp ${stemName(partner)} hóa ${element}`;
};

export type BranchRelationKind = "đồng cung" | "tam hợp" | "lục hợp" | "lục xung" | "lục hại" | "cùng nhóm tứ hành xung";

export interface BranchRelation {
  readonly kind: BranchRelationKind;
  readonly description: string;
  readonly source: string;
}

export function branchRelations(a: number, b: number): readonly BranchRelation[] {
  const first = mod(a, 12);
  const second = mod(b, 12);
  const pair = `${branchName(first)} – ${branchName(second)}`;
  if (first === second) return [{ kind: "đồng cung", description: `${branchName(first)} cùng một chi`, source: "" }];
  const candidates: ReadonlyArray<BranchRelation | null> = [
    trineGroup(first) === trineGroup(second)
      ? {
          kind: "tam hợp",
          description: `${pair} cùng bộ tam hợp ${trine(first).branches.map(branchName).join(" ")} (hóa ${trine(first).element})`,
          source: "TVTH tr.8–9; MLTC tr.4–5",
        }
      : null,
    sixCombinationPartner(first) === second ? { kind: "lục hợp", description: `${pair} nhị hợp (lục hợp)`, source: "TVTH tr.9" } : null,
    clashPartner(first) === second ? { kind: "lục xung", description: `${pair} xung chiếu (đối cung)`, source: "TVTH tr.9" } : null,
    sixHarmPartner(first) === second ? { kind: "lục hại", description: `${pair} lục hại`, source: "NP1 tr.1–7 (OCR)" } : null,
    fourClashGroup(first) === fourClashGroup(second) && clashPartner(first) !== second
      ? { kind: "cùng nhóm tứ hành xung", description: `${pair} cùng nhóm ${fourClash(first).name}`, source: "TVTH tr.8; MLTC tr.4–5" }
      : null,
  ];
  return candidates.filter((relation): relation is BranchRelation => relation !== null);
}
