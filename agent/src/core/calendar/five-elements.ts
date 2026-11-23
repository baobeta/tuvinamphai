import { err, ok, type Result } from "../result.js";
import { mod } from "./stem-branch.js";

export const ELEMENTS = ["Kim", "Thủy", "Mộc", "Hỏa", "Thổ"] as const;
export type Element = (typeof ELEMENTS)[number];

const STEM_ELEMENTS: readonly Element[] = ["Mộc", "Mộc", "Hỏa", "Hỏa", "Thổ", "Thổ", "Kim", "Kim", "Thủy", "Thủy"];
const BRANCH_ELEMENTS: readonly Element[] = ["Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"];

export const stemElement = (stem: number): Element => STEM_ELEMENTS[mod(stem, 10)]!;
export const branchElement = (branch: number): Element => BRANCH_ELEMENTS[mod(branch, 12)]!;

const position = (element: Element): number => ELEMENTS.indexOf(element);

export const generatedBy = (element: Element): Element => ELEMENTS[mod(position(element) + 1, 5)]!;
export const controlledBy = (element: Element): Element => ELEMENTS[mod(position(element) + 2, 5)]!;

export type ElementRelationKind = "đồng hành" | "sinh" | "được sinh" | "khắc" | "bị khắc";

export interface ElementRelation {
  readonly kind: ElementRelationKind;
  readonly description: string;
}

export function elementRelation(subject: Element, other: Element): ElementRelation {
  if (subject === other) return { kind: "đồng hành", description: `${subject} và ${other} đồng hành (tương hòa)` };
  if (generatedBy(subject) === other) return { kind: "sinh", description: `${subject} sinh ${other} (sinh xuất)` };
  if (generatedBy(other) === subject) return { kind: "được sinh", description: `${other} sinh ${subject} (sinh nhập)` };
  if (controlledBy(subject) === other) return { kind: "khắc", description: `${subject} khắc ${other} (khắc xuất)` };
  return { kind: "bị khắc", description: `${other} khắc ${subject} (khắc nhập)` };
}

export function parseElement(text: string): Result<Element> {
  const normalized = text.trim().normalize("NFC").toLowerCase();
  const found = ELEMENTS.find((element) => element.toLowerCase() === normalized);
  return found ? ok(found) : err(`Không nhận ra hành "${text}". Hợp lệ: ${ELEMENTS.join(", ")}`);
}
