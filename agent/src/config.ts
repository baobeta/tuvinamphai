import path from "node:path";

export const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");

export const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof EFFORTS)[number];

export interface Config {
  corpusRoot: string;
  kbRoot: string;
  model: string;
  effort: Effort;
  maxIterations: number;
  maxTokens: number;
  chartDir: string | null;
}

export const CHART_DIR_DISABLED = "off";

export function loadConfig(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): Config {
  const corpusRoot = env.TUVI_WORKSPACE ? path.resolve(cwd, env.TUVI_WORKSPACE) : REPO_ROOT;
  const effort = (env.TUVI_EFFORT ?? "high") as Effort;
  if (!EFFORTS.includes(effort)) {
    throw new Error(`TUVI_EFFORT không hợp lệ: ${effort} (chọn một trong ${EFFORTS.join(", ")})`);
  }
  const maxIterations = Number(env.TUVI_MAX_ITERATIONS ?? 20);
  if (!Number.isInteger(maxIterations) || maxIterations < 1) {
    throw new Error(`TUVI_MAX_ITERATIONS phải là số nguyên dương: ${env.TUVI_MAX_ITERATIONS}`);
  }
  return {
    corpusRoot,
    kbRoot: path.resolve(cwd, env.TUVI_KB_DIR ?? path.join(corpusRoot, "Kien-thuc-Tu-Vi-Nam-Phai")),
    model: env.TUVI_MODEL ?? "claude-opus-5-5",
    effort,
    maxIterations,
    maxTokens: 64_000,
    chartDir:
      env.TUVI_CHART_DIR === CHART_DIR_DISABLED
        ? null
        : path.resolve(cwd, env.TUVI_CHART_DIR ?? path.join(corpusRoot, ".omc", "charts")),
  };
}
