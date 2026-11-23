import { loadConfig } from "./config.js";
import { loadKb } from "./kb/index.js";
import { createWorkspaceChartStore } from "./tools/chart-store.js";
import { ALL_TOOLS } from "./tools/index.js";
import { runTool } from "./tools/registry.js";

const USAGE = `Cách dùng:
  pnpm tool --list                         liệt kê tool
  pnpm tool <tên_tool> '<json input>'      chạy một tool
  pnpm tool <tên_tool> '<json>' <tên_tool> '<json>' …   chạy nối tiếp, dùng chung bộ nhớ chart_id
  Trong input có thể ghi "chart_id": "@last" để dùng chart_id của lá số vừa lập.`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "--help") {
    console.log(USAGE);
    return;
  }
  if (args[0] === "--list") {
    for (const tool of ALL_TOOLS) console.log(`${tool.name}\n  ${tool.description}\n`);
    return;
  }
  if (args.length % 2 !== 0) {
    console.error(`Mỗi tool cần một chuỗi JSON đi kèm.\n\n${USAGE}`);
    process.exitCode = 1;
    return;
  }
  const config = loadConfig();
  const ctx = { kb: await loadKb(config.kbRoot), corpusRoot: config.corpusRoot, charts: createWorkspaceChartStore(config.chartDir) };
  const toolMap = new Map(ALL_TOOLS.map((tool) => [tool.name, tool]));
  let lastChartId: string | undefined;
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i]!;
    const rawJson = args[i + 1]!.replaceAll('"@last"', JSON.stringify(lastChartId ?? ""));
    let input: unknown;
    try {
      input = JSON.parse(rawJson);
    } catch (error) {
      console.error(`JSON không hợp lệ cho ${name}: ${(error as Error).message}`);
      process.exitCode = 1;
      return;
    }
    const started = performance.now();
    const outcome = await runTool(toolMap, name, input, ctx);
    const elapsed = (performance.now() - started).toFixed(1);
    lastChartId = /chart_id: (ls_[0-9a-f]+)/.exec(outcome.content)?.[1] ?? lastChartId;
    console.log(`\x1b[2m→ ${name} (${elapsed} ms)${outcome.isError ? " LỖI" : ""}\x1b[0m\n${outcome.content}\n`);
    if (outcome.isError) process.exitCode = 1;
  }
}

await main();
