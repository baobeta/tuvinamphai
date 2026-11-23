import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { REPO_ROOT } from "../src/config.js";

const PLUGIN_ROOT = path.join(REPO_ROOT, "tu-vi-plugin");

const textOf = (result: unknown): string =>
  ((result as { content?: Array<{ text?: string }> }).content ?? []).map((part) => part.text ?? "").join("");

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Smoke test hỏng: ${message}`);
  process.stdout.write(`  ✓ ${message}\n`);
}

async function main(): Promise<void> {
  const chartDir = fs.mkdtempSync(path.join(os.tmpdir(), "tuvi-plugin-smoke-"));
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(PLUGIN_ROOT, "server", "tuvi-mcp.mjs")],
    cwd: os.tmpdir(),
    env: { PATH: process.env.PATH ?? "", TUVI_WORKSPACE: path.join(PLUGIN_ROOT, "data"), TUVI_CHART_DIR: chartDir },
    stderr: "pipe",
  });
  const client = new Client({ name: "smoke", version: "0" });
  const started = performance.now();
  await client.connect(transport);
  process.stdout.write(`Kết nối server đã build sau ${(performance.now() - started).toFixed(0)} ms\n`);
  const { tools } = await client.listTools();
  check(tools.length >= 29, `liệt kê ${tools.length} tool`);
  const search = await client.callTool({ name: "search_kb", arguments: { query: "Cự Môn Thìn tuổi Tân" } });
  check(!search.isError && textOf(search).includes("04_Chinh-tinh"), "search_kb đọc được kho đã chép vào plugin");
  const corpus = await client.callTool({ name: "grep_corpus", arguments: { text: "Cự Môn", book: "TVTH", limit: 2 } });
  check(!corpus.isError && textOf(corpus).length > 0, "grep_corpus đọc được sách gốc đã chép vào plugin");
  const built = await client.callTool({
    name: "build_chart",
    arguments: { birth: { calendar: "lunar", year: 1974, month: 3, day: 7, hour_branch: "Dần", gender: "nữ" } },
  });
  const id = /chart_id: (ls_[0-9a-f]+)/.exec(textOf(built))?.[1];
  check(Boolean(id) && textOf(built).includes("Hỏa lục cục"), `build_chart lập lá số mẫu Lã Thái Hậu (${id})`);
  check(fs.existsSync(path.join(chartDir, `${id}.json`)), "lá số được lưu vào TUVI_CHART_DIR");
  const analysis = await client.callTool({ name: "analyze_chart", arguments: { chart_id: id } });
  check(!analysis.isError && textOf(analysis).includes("Phủ Tướng triều viên"), "analyze_chart nhận ra cách Phủ Tướng triều viên");
  const prompt = await client.getPrompt({ name: "xem-la-so", arguments: { ngay_sinh: "15/8/1990", gio_sinh: "9:10", gioi_tinh: "nam" } });
  check(JSON.stringify(prompt.messages).includes("Đại vận mười năm"), "prompt xem-la-so có hướng dẫn 10 phần");
  check((client.getInstructions() ?? "").includes("Xem trọn một lá số"), "server gửi instructions cho Claude");
  await client.close();
  fs.rmSync(chartDir, { recursive: true, force: true });
  process.stdout.write("Smoke test plugin: đạt\n");
}

await main();
