import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { BirthInput } from "../core/chart/birth.js";
import { buildChart } from "../core/chart/build-chart.js";
import { DEFAULT_CHART_OPTIONS, type Chart, type ChartOptions } from "../core/chart/types.js";

export const DEFAULT_CHART_STORE_CAPACITY = 64;
const CHART_ID_LENGTH = 10;
export const CHART_ID_PATTERN = /^ls_[0-9a-f]{10}$/;
const SAVED_CHART_VERSION = 1;

export interface ChartStore {
  get(id: string): Chart | undefined;
  remember(input: BirthInput, options: ChartOptions, build: () => Chart): RememberedChart;
  size(): number;
}

export interface RememberedChart {
  readonly id: string;
  readonly chart: Chart;
  readonly cached: boolean;
  readonly persisted: boolean | null;
}

export interface ChartPersistence {
  readonly directory: string;
  readonly rebuild: (input: BirthInput, options: ChartOptions) => Chart | undefined;
}

interface SavedChart {
  readonly version: number;
  readonly id: string;
  readonly input: BirthInput;
  readonly options: ChartOptions;
  readonly savedAt: string;
}

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

export const chartIdOf = (input: BirthInput, options: ChartOptions): string =>
  `ls_${createHash("sha256").update(canonicalJson({ input, options })).digest("hex").slice(0, CHART_ID_LENGTH)}`;

const savedChartPath = (directory: string, id: string): string => path.join(directory, `${id}.json`);

function removeQuietly(file: string): void {
  try {
    fs.rmSync(file, { force: true });
  } catch {
    return;
  }
}

function writeSavedChart(persistence: ChartPersistence, id: string, input: BirthInput, options: ChartOptions): boolean {
  const saved: SavedChart = { version: SAVED_CHART_VERSION, id, input, options, savedAt: new Date().toISOString() };
  const target = savedChartPath(persistence.directory, id);
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.mkdirSync(persistence.directory, { recursive: true, mode: 0o700 });
    fs.writeFileSync(temporary, `${JSON.stringify(saved, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporary, target);
    return true;
  } catch {
    removeQuietly(temporary);
    return false;
  }
}

function readSavedChart(persistence: ChartPersistence, id: string): Chart | undefined {
  if (!CHART_ID_PATTERN.test(id)) return undefined;
  try {
    const saved = JSON.parse(fs.readFileSync(savedChartPath(persistence.directory, id), "utf8")) as SavedChart;
    if (saved.version !== SAVED_CHART_VERSION || chartIdOf(saved.input, saved.options) !== id) return undefined;
    return persistence.rebuild(saved.input, { ...DEFAULT_CHART_OPTIONS, ...saved.options });
  } catch {
    return undefined;
  }
}

export function createChartStore(capacity: number = DEFAULT_CHART_STORE_CAPACITY, persistence?: ChartPersistence): ChartStore {
  const charts = new Map<string, Chart>();
  const touch = (id: string, chart: Chart): void => {
    charts.delete(id);
    charts.set(id, chart);
    while (charts.size > capacity) charts.delete(charts.keys().next().value!);
  };
  return {
    get(id) {
      const chart = charts.get(id) ?? (persistence ? readSavedChart(persistence, id) : undefined);
      if (chart) touch(id, chart);
      return chart;
    },
    remember(input, options, build) {
      const id = chartIdOf(input, options);
      const existing = charts.get(id);
      if (existing) {
        touch(id, existing);
        return { id, chart: existing, cached: true, persisted: null };
      }
      const chart = build();
      touch(id, chart);
      const persisted = persistence ? writeSavedChart(persistence, id, input, options) : null;
      return { id, chart, cached: false, persisted };
    },
    size: () => charts.size,
  };
}

export const createWorkspaceChartStore = (directory: string | null): ChartStore =>
  createChartStore(
    DEFAULT_CHART_STORE_CAPACITY,
    directory
      ? {
          directory,
          rebuild: (input, options) => {
            const rebuilt = buildChart(input, options);
            return rebuilt.ok ? rebuilt.value : undefined;
          },
        }
      : undefined,
  );
