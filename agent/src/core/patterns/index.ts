import { renderFinding, type Finding } from "../analysis/finding.js";
import type { Chart } from "../chart/types.js";
import { err, ok, type Result } from "../result.js";
import { BAD_PATTERNS, UNSUPPORTED_PATTERNS } from "./bad-patterns.js";
import { GOOD_PATTERNS } from "./good-patterns.js";
import { DEFAULT_PATTERN_OPTIONS, type PatternEvaluation, type PatternOptions, type PatternRule } from "./types.js";

export const PATTERN_CATALOG: readonly PatternRule[] = [...GOOD_PATTERNS, ...BAD_PATTERNS];

export { DEFAULT_PATTERN_OPTIONS, UNSUPPORTED_PATTERNS };
export type { PatternEvaluation, PatternOptions, PatternRule };

const evaluations = (chart: Chart, options: PatternOptions): readonly PatternEvaluation[] =>
  PATTERN_CATALOG.map((rule) => rule.evaluate(chart, options)).filter((item): item is PatternEvaluation => item !== null);

export const detectPatterns = (chart: Chart, options: PatternOptions = DEFAULT_PATTERN_OPTIONS): readonly Finding[] =>
  evaluations(chart, options)
    .filter((item) => item.matched)
    .map((item) => item.finding);

export function evaluatePattern(chart: Chart, id: string, options: PatternOptions = DEFAULT_PATTERN_OPTIONS): Result<PatternEvaluation> {
  const rule = PATTERN_CATALOG.find((item) => item.id === id);
  if (!rule) return err(`Không có cách cục mã '${id}'. Các mã hợp lệ: ${PATTERN_CATALOG.map((item) => item.id).join(", ")}`);
  const evaluation = rule.evaluate(chart, options);
  if (!evaluation) {
    const reason = UNSUPPORTED_PATTERNS.find((item) => item.id === id)?.reason ?? "chưa hình thức hóa được";
    return err(`Cách ${rule.name} chưa hỗ trợ: ${reason}`);
  }
  return ok(evaluation);
}

export function renderPatterns(findings: readonly Finding[]): string {
  if (!findings.length) return "Không phát hiện cách cục nào trong danh mục.";
  const section = (title: string, items: readonly Finding[]): string =>
    items.length ? [`### ${title}`, ...items.map(renderFinding)].join("\n\n") : "";
  return [
    section("Cách tốt", findings.filter((item) => item.polarity === "tốt")),
    section("Cách xấu", findings.filter((item) => item.polarity === "xấu")),
  ]
    .filter(Boolean)
    .join("\n\n");
}
