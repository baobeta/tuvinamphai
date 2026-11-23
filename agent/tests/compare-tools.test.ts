import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadKb } from "../src/kb/index.js";
import { createChartStore } from "../src/tools/chart-store.js";
import { CHART_TOOLS } from "../src/tools/chart-tools.js";
import { COMPARE_TOOLS } from "../src/tools/compare-tools.js";
import { runTool, type ToolContext, type ToolSpec } from "../src/tools/registry.js";

const FIX = path.join(import.meta.dirname, "fixtures");
const toolMap = new Map<string, ToolSpec>([...CHART_TOOLS, ...COMPARE_TOOLS].map((tool) => [tool.name, tool as ToolSpec]));
const husband = { calendar: "lunar", year: 1987, month: 3, day: 7, hour_branch: "Dần", gender: "nam" };
const wife = { calendar: "lunar", year: 1963, month: 5, day: 12, hour_branch: "Ngọ", gender: "nữ" };

const setup = async () => {
  const ctx: ToolContext = { kb: await loadKb(path.join(FIX, "kb")), corpusRoot: path.join(FIX, "corpus"), charts: createChartStore() };
  const build = async (birth: Record<string, unknown>) => {
    const built = await runTool(toolMap, "build_chart", { birth }, ctx);
    return /chart_id: (ls_[0-9a-f]+)/.exec(built.content)![1]!;
  };
  return { ctx, build, call: (input: Record<string, unknown>) => runTool(toolMap, "compare_charts", input, ctx) };
};

const body = (text: string): string => text.slice(text.indexOf("# So sánh"));

describe("compare_charts", () => {
  it("hai chart_id và hai birth cho cùng nội dung", async () => {
    const { build, call } = await setup();
    const [firstId, secondId] = [await build(husband), await build(wife)];
    const byIds = await call({ first: { chart_id: firstId }, second: { chart_id: secondId } });
    const byBirths = await call({ first: { birth: husband }, second: { birth: wife } });
    expect(byIds.isError, byIds.content).toBe(false);
    expect(byBirths.isError, byBirths.content).toBe(false);
    expect(byIds.content).toContain(`chart_id A: ${firstId}`);
    expect(byIds.content).toContain(`chart_id B: ${secondId}`);
    expect(body(byBirths.content)).toBe(body(byIds.content));
    expect(byIds.content).toContain("NP2: thiên can vợ chồng khắc nhau");
    expect(byIds.content).toContain("Thái Tuế nhập quẻ B → lá số A");
  });

  it("trộn chart_id với birth; relationship đổi cung xét", async () => {
    const { build, call } = await setup();
    const out = await call({ first: { chart_id: await build(husband) }, second: { birth: wife }, relationship: "sibling" });
    expect(out.isError, out.content).toBe(false);
    expect(out.content).toContain("anh chị em (cung Huynh Đệ)");
    expect(out.content).not.toContain("NP2:");
  });

  it("thiếu cả chart_id lẫn birth, hoặc chart_id lạ, thì báo lỗi", async () => {
    const { call } = await setup();
    expect((await call({ first: {}, second: { birth: wife } })).isError).toBe(true);
    expect((await call({ first: { chart_id: "ls_khongco" }, second: { birth: wife } })).content).toContain("sai định dạng");
    expect((await call({ first: { chart_id: "ls_0123456789" }, second: { birth: wife } })).content).toContain("Không tìm thấy lá số");
    expect((await call({ first: { birth: husband } })).isError).toBe(true);
  });
});
