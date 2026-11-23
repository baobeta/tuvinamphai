import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadKb } from "../src/kb/index.js";
import { createChartStore } from "../src/tools/chart-store.js";
import { ALL_TOOLS } from "../src/tools/index.js";
import { runTool, toApiTool, type ToolContext, type ToolSpec } from "../src/tools/registry.js";
import { SCAN_TOOLS } from "../src/tools/scan-tools.js";

const FIX = path.join(import.meta.dirname, "fixtures");
const toolMap = new Map<string, ToolSpec>([...ALL_TOOLS, ...(SCAN_TOOLS as ToolSpec[])].map((tool) => [tool.name, tool]));
const birth = { calendar: "lunar", year: 1974, month: 3, day: 7, hour_branch: "Dần", gender: "nữ" };

const setup = async () => {
  const ctx: ToolContext = { kb: await loadKb(path.join(FIX, "kb")), corpusRoot: path.join(FIX, "corpus"), charts: createChartStore() };
  const built = await runTool(toolMap, "build_chart", { birth }, ctx);
  const chartId = /chart_id: (ls_[0-9a-f]+)/.exec(built.content)![1]!;
  return { chartId, call: (input: Record<string, unknown>) => runTool(toolMap, "scan_years", { chart_id: chartId, ...input }, ctx) };
};

describe("scan_years", () => {
  it("goal hôn nhân: bảng năm, xếp hạng có nguồn, quy tắc chưa tính", async () => {
    const { call, chartId } = await setup();
    const out = await call({ from_year: 1996, to_year: 2025, goal: "hôn nhân", top: 3 });
    expect(out.isError, out.content).toBe(false);
    expect(out.content).toContain(chartId);
    expect(out.content).toContain("| 2011 | Tân Mão | 38 |");
    expect(out.content).toContain("### Xếp hạng");
    expect(out.content).toMatch(/\[(TVTH|MLTC|NP1)[^\]]*\]/);
    expect(out.content).toContain("### Chưa tính");
  });

  it("tiêu chí tùy chọn với palaces chung và ghép any", async () => {
    const { call } = await setup();
    const out = await call({
      from_year: 1996,
      to_year: 1997,
      palaces: [{ frame: "natal", role: "Phu Thê" }],
      criteria: [
        { kind: "flowing-star", stars: ["Thái Tuế"] },
        { kind: "any", of: [{ kind: "taboo" }, { kind: "coincidence" }], label: "rủi ro" },
      ],
    });
    expect(out.isError, out.content).toBe(false);
    expect(out.content).toContain("Lưu Thái Tuế ở Phu Thê bản mệnh");
    expect(out.content).toContain("rủi ro");
  });

  it("birth trực tiếp cũng chạy", async () => {
    const ctx: ToolContext = { kb: await loadKb(path.join(FIX, "kb")), corpusRoot: path.join(FIX, "corpus") };
    const out = await runTool(toolMap, "scan_years", { birth, from_year: 2020, to_year: 2030, goal: "sức khỏe" }, ctx);
    expect(out.isError, out.content).toBe(false);
  });

  it.each([
    [{ from_year: 2010, to_year: 2000, goal: "tài lộc" }, "phải nhỏ hơn"],
    [{ from_year: 1980, to_year: 2050, goal: "tài lộc" }, "tối đa 60"],
    [{ from_year: 2000, to_year: 2001 }, "Cần goal"],
    [{ from_year: 2000, to_year: 2001, criteria: [{ kind: "trigger", id: "KHONG-CO" }] }, "Không có trigger"],
  ])("lỗi đầu vào: %j", async (input, message) => {
    const { call } = await setup();
    const out = await call(input);
    expect(out.isError).toBe(true);
    expect(out.content).toContain(message);
  });

  it("zod chặn frame và goal sai", async () => {
    const { call } = await setup();
    expect((await call({ from_year: 2000, to_year: 2001, goal: "du lịch" })).content).toContain("INVALID_INPUT");
    expect((await call({ from_year: 2000, to_year: 2001, palaces: [{ frame: "tháng" }], criteria: [{ kind: "taboo" }] })).content).toContain("INVALID_INPUT");
  });

  it("schema xuất được JSON Schema cho API", () => {
    const api = toApiTool(SCAN_TOOLS[0] as ToolSpec);
    expect(api.name).toBe("scan_years");
    expect(JSON.stringify(api.input_schema)).toContain("from_year");
  });
});

describe("scan_years mô tả", () => {
  it("nêu phạm vi tam phương tứ chính và cách tính đại hạn", () => {
    expect(SCAN_TOOLS[0]!.description).toContain("tam phương tứ chính");
    expect(SCAN_TOOLS[0]!.description).toContain("tam hợp");
    expect(SCAN_TOOLS[0]!.description).toContain("đại hạn");
  });
});
