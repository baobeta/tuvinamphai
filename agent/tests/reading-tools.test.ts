import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { loadKb, type KbIndex } from "../src/kb/index.js";
import { createChartStore } from "../src/tools/chart-store.js";
import { CHART_TOOLS } from "../src/tools/chart-tools.js";
import { READING_TOOLS, starIndexOf } from "../src/tools/reading-tools.js";
import { runTool, toApiTool, type ToolContext, type ToolSpec } from "../src/tools/registry.js";

const REAL_KB = path.join(import.meta.dirname, "../../Kien-thuc-Tu-Vi-Nam-Phai");
const FIXTURES = path.join(import.meta.dirname, "fixtures");
const toolMap = new Map([...READING_TOOLS, ...CHART_TOOLS].map((tool) => [tool.name, tool as unknown as ToolSpec]));
const birth = { calendar: "lunar", year: 1974, month: 3, day: 7, hour_branch: "Dần", gender: "nữ" };

let kb: KbIndex;

beforeAll(async () => {
  kb = await loadKb(REAL_KB);
});

const setup = async () => {
  const ctx: ToolContext = { kb, corpusRoot: path.join(FIXTURES, "corpus"), charts: createChartStore() };
  const built = await runTool(toolMap, "build_chart", { birth }, ctx);
  const chartId = /chart_id: (ls_[0-9a-f]+)/.exec(built.content)![1]!;
  return { ctx, chartId, call: (name: string, input: Record<string, unknown>) => runTool(toolMap, name, input, ctx) };
};

describe("READING_TOOLS", () => {
  it("có schema JSON hợp lệ cho API", () => {
    expect(READING_TOOLS.map((tool) => tool.name)).toEqual(["lookup_star_meaning", "chart_star_references", "topic_reading"]);
    for (const tool of READING_TOOLS) expect(toApiTool(tool as unknown as ToolSpec).input_schema.type).toBe("object");
  });

  it("lookup_star_meaning: Cự Môn ở Thìn cung Phu Thê trả đúng file và nguồn", async () => {
    const { call } = await setup();
    const out = await call("lookup_star_meaning", { star: "Cự Môn", branch: "Thìn", palace: "Phu Thê" });
    expect(out.isError, out.content).toBe(false);
    expect(out.content).toContain("04_Chinh-tinh/10_Cu-Mon/02_Mieu-ham-va-12-vi-tri.md");
    expect(out.content).toContain("04_Chinh-tinh/10_Cu-Mon/05_O-cac-cung-ngoai-Menh.md");
    expect(out.content).toContain("03_Muoi-hai-cung/11_Cung-Phu-The/02_Chinh-tinh-tai-cung.md");
    expect(out.content).toContain("Nguồn chính: MLTC");
  });

  it("lookup_star_meaning: tên sao lạ là lỗi đầu vào", async () => {
    const { call } = await setup();
    const out = await call("lookup_star_meaning", { star: "Sao Lạ" });
    expect(out.isError).toBe(true);
    expect(out.content).toContain("Không nhận ra tên sao");
  });

  it("chart_star_references: nhận chart_id, cung chức, 'Thân' và địa chi", async () => {
    const { call, chartId } = await setup();
    const byRole = await call("chart_star_references", { chart_id: chartId, palace: "Phu Thê" });
    expect(byRole.isError, byRole.content).toBe(false);
    expect(byRole.content).toContain(chartId);
    expect(byRole.content).toContain("Thất Sát (Miếu)");
    const byBranch = await call("chart_star_references", { chart_id: chartId, palace: "Tý" });
    expect(byBranch.content.slice(byBranch.content.indexOf("##"))).toBe(byRole.content.slice(byRole.content.indexOf("##")));
    const body = await call("chart_star_references", { chart_id: chartId, palace: "Thân" });
    expect(body.content).toContain("cung an Thân");
    expect((await call("chart_star_references", { chart_id: chartId, palace: "xyz" })).isError).toBe(true);
  });

  it("topic_reading: brief và full theo chart_id", async () => {
    const { call, chartId } = await setup();
    const brief = await call("topic_reading", { chart_id: chartId, topic: "hôn nhân" });
    expect(brief.isError, brief.content).toBe(false);
    expect(brief.content).toContain("# Hôn nhân (tóm tắt)");
    expect(brief.content).toContain("Thân cư Quan Lộc");
    const full = await call("topic_reading", { chart_id: chartId, topic: "marriage", detail: "full" });
    expect(brief.content).toContain("11_Chu-de-luan/04_Hon-nhan/01_Cach-xem-cung-va-sao-lien-quan.md");
    expect(full.content).toContain("11_Chu-de-luan/04_Hon-nhan/02_Bo-sao-tot.md");
    expect(full.content).toContain("(đầy đủ)");
    expect(full.content.length).toBeGreaterThan(brief.content.length);
    const bad = await call("topic_reading", { chart_id: chartId, topic: "xem bói" });
    expect(bad.isError).toBe(true);
  });

  it.each([
    ["topic_reading", { topic: "hôn nhân" }],
    ["chart_star_references", { palace: "Mệnh" }],
  ])("%s brief ≤ 4000 ký tự trên lá số Lã Thái Hậu, mọi file trong brief đều có trong full", async (name, input) => {
    const { call, chartId } = await setup();
    const brief = await call(name, { chart_id: chartId, ...input });
    const full = await call(name, { chart_id: chartId, ...input, detail: "full" });
    expect(brief.isError, brief.content).toBe(false);
    expect(brief.content.length).toBeLessThanOrEqual(4000);
    expect(brief.content).toContain('detail "full"');
    const briefPaths = [...brief.content.matchAll(/`(\d\d_[^`]+\.md)`/g)].map((match) => match[1]!);
    expect(briefPaths.length).toBeGreaterThan(0);
    expect(briefPaths.length).toBeLessThanOrEqual(5);
    for (const kbPath of briefPaths) expect(full.content).toContain(kbPath);
  });

  it("chỉ mục sao được dựng một lần cho mỗi kho", () => {
    expect(starIndexOf(kb)).toBe(starIndexOf(kb));
  });
});
