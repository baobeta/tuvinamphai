export type Certainty = "exact" | "interpretive";

export type Polarity = "tốt" | "xấu" | "trung tính";

export interface Finding {
  readonly id: string;
  readonly name: string;
  readonly polarity: Polarity;
  readonly certainty: Certainty;
  readonly summary: string;
  readonly satisfied: readonly string[];
  readonly missing: readonly string[];
  readonly breakers: readonly string[];
  readonly assumptions: readonly string[];
  readonly variants: readonly string[];
  readonly source: string;
  readonly kbFile?: string;
}

export const finding = (fields: Omit<Finding, "satisfied" | "missing" | "breakers" | "assumptions" | "variants"> & Partial<Finding>): Finding => ({
  satisfied: [],
  missing: [],
  breakers: [],
  assumptions: [],
  variants: [],
  ...fields,
});

export const CERTAINTY_LABEL: Readonly<Record<Certainty, string>> = {
  exact: "khớp chắc chắn",
  interpretive: "khớp theo cách hiểu",
};

export function renderFinding(item: Finding): string {
  const parts = [
    `**${item.name}** (${item.polarity}, ${CERTAINTY_LABEL[item.certainty]}) — ${item.summary} [${item.source}]`,
    item.satisfied.length ? `  - Thỏa: ${item.satisfied.join("; ")}` : "",
    item.missing.length ? `  - Chưa thỏa: ${item.missing.join("; ")}` : "",
    item.breakers.length ? `  - Phá cách / giảm: ${item.breakers.join("; ")}` : "",
    item.assumptions.length ? `  - Cách hiểu đã dùng: ${item.assumptions.join("; ")}` : "",
    item.variants.length ? `  - Dị bản: ${item.variants.join("; ")}` : "",
  ];
  return parts.filter(Boolean).join("\n");
}

export type RenderDetail = "brief" | "full";

export const briefFooter = (findings: readonly Finding[]): string => {
  const assumptionCount = findings.reduce((total, item) => total + item.assumptions.length, 0);
  return `_Rút gọn · giả định: ${assumptionCount} mục, điều kiện, danh sách sao: gọi lại với detail full để xem_`;
};

const countMarker = (label: string, items: readonly string[]): string => (items.length ? ` · ${label}: ${items.length} mục` : "");

export function renderFindingBrief(item: Finding): string {
  const head =
    `- **${item.name}** (${item.polarity}, ${CERTAINTY_LABEL[item.certainty]}) — ${item.summary} [${item.source}]` +
    countMarker("phá cách/giảm", item.breakers) +
    countMarker("chưa thỏa", item.missing) +
    countMarker("giả định", item.assumptions);
  return item.variants.length ? `${head}\n  - Dị bản: ${item.variants.join("; ")}` : head;
}
