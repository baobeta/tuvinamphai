import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadKb } from "../src/kb/index.js";
import { createChartStore } from "../src/tools/chart-store.js";
import { ALL_TOOLS } from "../src/tools/index.js";
import { runTool, type ToolContext } from "../src/tools/registry.js";

const FIX = path.join(import.meta.dirname, "fixtures");
const toolMap = new Map(ALL_TOOLS.map((t) => [t.name, t]));
const birth = { calendar: "lunar", year: 1974, month: 3, day: 7, hour_branch: "Dần", gender: "nữ" };

const setup = async () => {
  const ctx: ToolContext = { kb: await loadKb(path.join(FIX, "kb")), corpusRoot: path.join(FIX, "corpus"), charts: createChartStore() };
  const built = await runTool(toolMap, "build_chart", { birth }, ctx);
  const chartId = /chart_id: (ls_[0-9a-f]+)/.exec(built.content)![1]!;
  return { ctx, chartId, call: (name: string, input: Record<string, unknown>) => runTool(toolMap, name, { chart_id: chartId, ...input }, ctx) };
};

describe("tool phân tích dùng chart_id", () => {
  it.each([
    ["analyze_chart", {}],
    ["detect_patterns", {}],
    ["natal_profile", {}],
    ["analyze_palace", { palace: "Phu Thê" }],
    ["analyze_palace", { palace: "Thân" }],
    ["analyze_palace", { palace: "Ngọ" }],
    ["period_layers", { year: 2000, month: 5, day: 10, hour_branch: "Tý" }],
    ["lifetime_timeline", {}],
    ["child_hazard_hours", {}],
  ])("%s chạy không lỗi và trả chart_id", async (name, input) => {
    const { call, chartId } = await setup();
    const out = await call(name, input);
    expect(out.isError, out.content).toBe(false);
    expect(out.content).toContain(chartId);
    expect(out.content.length).toBeGreaterThan(50);
  });

  it("analyze_palace: tên cung chức, tên gọi tắt và địa chi trỏ cùng một cung", async () => {
    const { call } = await setup();
    const body = (text: string) => text.slice(text.indexOf("##"));
    const byRole = await call("analyze_palace", { palace: "Quan Lộc" });
    const byAlias = await call("analyze_palace", { palace: "Quan" });
    const byBranch = await call("analyze_palace", { palace: "Ngọ" });
    expect(body(byRole.content)).toBe(body(byBranch.content));
    expect(body(byAlias.content)).toBe(body(byRole.content));
    expect(byBranch.content).toContain('Hiểu "Ngọ" là địa chi');
  });

  it("analyze_palace: 'Thân' là cung an Thân, 'chi Thân' là địa chi Thân", async () => {
    const { call } = await setup();
    const bodyPalace = await call("analyze_palace", { palace: "Thân" });
    const branchThan = await call("analyze_palace", { palace: "chi Thân" });
    expect(bodyPalace.content).toContain("cung an Thân");
    expect(bodyPalace.content).toContain("Canh Ngọ");
    expect(branchThan.content).toContain("Nhâm Thân");
    expect((await call("analyze_palace", { palace: "xyz" })).content).toContain("Dùng tên cung chức");
  });

  it("chart_id kèm options thì báo lỗi thay vì lặng lẽ bỏ qua", async () => {
    const { call } = await setup();
    const out = await call("natal_profile", { options: { transformations_for_canh: "MLTC" } });
    expect(out.isError).toBe(true);
    expect(out.content).toContain("không truyền cả hai");
  });

  it("detect_patterns với pattern_id lạ báo lỗi; list_patterns liệt kê đủ mã", async () => {
    const { call, ctx } = await setup();
    expect((await call("detect_patterns", { pattern_id: "khong-co" })).isError).toBe(true);
    const list = await runTool(toolMap, "list_patterns", {}, ctx);
    expect(list.content.split("\n").length).toBeGreaterThanOrEqual(50);
  });

  it("birth_hour_candidates so sánh nhiều giờ", async () => {
    const { ctx } = await setup();
    const out = await runTool(
      toolMap,
      "birth_hour_candidates",
      { calendar: "lunar", year: 1974, month: 3, day: 7, gender: "nữ", candidate_hours: ["Sửu", "Dần", "Mão"] },
      ctx,
    );
    expect(out.isError, out.content).toBe(false);
    expect(out.content).toContain("Dần");
  });
});
