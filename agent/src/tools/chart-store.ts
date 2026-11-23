import { createHash } from "node:crypto";
import type { BirthInput } from "../core/chart/birth.js";
import type { Chart, ChartOptions } from "../core/chart/types.js";

export const DEFAULT_CHART_STORE_CAPACITY = 64;
const CHART_ID_LENGTH = 10;

export interface ChartStore {
  get(id: string): Chart | undefined;
  remember(input: BirthInput, options: ChartOptions, build: () => Chart): { id: string; chart: Chart; cached: boolean };
  size(): number;
}

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

export const chartIdOf = (input: BirthInput, options: ChartOptions): string =>
  `ls_${createHash("sha256").update(canonicalJson({ input, options })).digest("hex").slice(0, CHART_ID_LENGTH)}`;

export function createChartStore(capacity: number = DEFAULT_CHART_STORE_CAPACITY): ChartStore {
  const charts = new Map<string, Chart>();
  const touch = (id: string, chart: Chart): void => {
    charts.delete(id);
    charts.set(id, chart);
    while (charts.size > capacity) charts.delete(charts.keys().next().value!);
  };
  return {
    get(id) {
      const chart = charts.get(id);
      if (chart) touch(id, chart);
      return chart;
    },
    remember(input, options, build) {
      const id = chartIdOf(input, options);
      const existing = charts.get(id);
      if (existing) {
        touch(id, existing);
        return { id, chart: existing, cached: true };
      }
      const chart = build();
      touch(id, chart);
      return { id, chart, cached: false };
    },
    size: () => charts.size,
  };
}
