import path from "node:path";
import { describe, expect, it } from "vitest";
import { CERTAINTY_LABEL, renderFinding, renderFindingBrief, type Finding } from "../src/core/analysis/finding.js";
import { analyzePalace, renderPalaceAnalysis } from "../src/core/analysis/palace-analysis.js";
import { natalProfile, renderNatalProfile } from "../src/core/analysis/natal-profile.js";
import { buildChart } from "../src/core/chart/build-chart.js";
import { renderChart, renderYearView } from "../src/core/chart/render.js";
import { yearView } from "../src/core/chart/periods.js";
import { DEFAULT_CHART_OPTIONS } from "../src/core/chart/types.js";
import { detectPatterns, renderPatterns } from "../src/core/patterns/index.js";
import { lifetimeTimeline, periodLayers, renderLifetimeTimeline, renderPeriodLayers } from "../src/core/periods/index.js";
import { loadKb } from "../src/kb/index.js";
import { ANALYSIS_TOOLS } from "../src/tools/analysis-tools.js";
import { createChartStore } from "../src/tools/chart-store.js";
import { CHART_TOOLS } from "../src/tools/chart-tools.js";
import { GRID_TOOLS } from "../src/tools/grid-tools.js";
import { runTool, type ToolContext, type ToolSpec } from "../src/tools/registry.js";

const FIX = path.join(import.meta.dirname, "fixtures");
const toolMap = new Map(([...CHART_TOOLS, ...ANALYSIS_TOOLS, ...GRID_TOOLS] as ToolSpec[]).map((tool) => [tool.name, tool]));
const birth = { calendar: "lunar", year: 1974, month: 3, day: 7, hour_branch: "Dần", gender: "nữ" };

const built = buildChart({ calendar: "lunar", date: { year: 1974, month: 3, day: 7, isLeapMonth: false }, hourBranch: 2, gender: "nữ" }, DEFAULT_CHART_OPTIONS);
if (!built.ok) throw new Error(built.error);
const chart = built.value;
const palaceOf = (branch: number) => {
  const result = analyzePalace(chart, branch);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const setup = async () => {
  const ctx: ToolContext = { kb: await loadKb(path.join(FIX, "kb")), corpusRoot: path.join(FIX, "corpus"), charts: createChartStore() };
  const first = await runTool(toolMap, "build_chart", { birth }, ctx);
  const chartId = /chart_id: (ls_[0-9a-f]+)/.exec(first.content)![1]!;
  return (name: string, input: Record<string, unknown>) => runTool(toolMap, name, { chart_id: chartId, ...input }, ctx);
};

describe("renderer full giữ nguyên khi không truyền detail", () => {
  it("mặc định của mọi renderer là full", () => {
    const profile = natalProfile(chart);
    const palace = palaceOf(chart.parameters.lifePalace);
    const patterns = detectPatterns(chart);
    const layers = periodLayers(chart, { year: 2026 });
    if (!layers.ok) throw new Error(layers.error);
    const view = yearView(chart, 2026);
    if (!view.ok) throw new Error(view.error);
    const timeline = lifetimeTimeline(chart);
    expect(renderNatalProfile(profile, "full")).toBe(renderNatalProfile(profile));
    expect(renderPalaceAnalysis(palace, "full")).toBe(renderPalaceAnalysis(palace));
    expect(renderPatterns(patterns, "full")).toBe(renderPatterns(patterns));
    expect(renderPatterns(patterns)).toBe(
      ["### Cách tốt", ...patterns.filter((item) => item.polarity === "tốt").map(renderFinding)].join("\n\n") +
        "\n\n" +
        ["### Cách xấu", ...patterns.filter((item) => item.polarity === "xấu").map(renderFinding)].join("\n\n"),
    );
    expect(renderChart(chart, "full")).toBe(renderChart(chart));
    expect(renderYearView(chart, view.value, "full")).toBe(renderYearView(chart, view.value));
    expect(renderPeriodLayers(chart, layers.value, "full")).toBe(renderPeriodLayers(chart, layers.value));
    expect(renderLifetimeTimeline(chart, timeline, "full")).toBe(renderLifetimeTimeline(chart, timeline));
  });
});

describe("renderFindingBrief", () => {
  it("giữ tên, mức chắc chắn, kết luận, nguồn, dị bản nguyên văn; bỏ điều kiện thỏa và giả định", () => {
    for (const item of [...natalProfile(chart).findings, ...detectPatterns(chart)]) {
      const brief = renderFindingBrief(item);
      expect(brief).toContain(`**${item.name}** (${item.polarity}, ${CERTAINTY_LABEL[item.certainty]}) — ${item.summary} [${item.source}]`);
      expect(brief).not.toContain("Thỏa:");
      expect(brief).not.toContain("Cách hiểu đã dùng");
      for (const variant of item.variants) expect(brief).toContain(variant);
      expect(brief.includes(`giả định: ${item.assumptions.length} mục`)).toBe(item.assumptions.length > 0);
    }
  });
});

const expectNoLostConclusion = (brief: string, full: string, findings: readonly Finding[]) => {
  expect(brief.length).toBeLessThan(full.length);
  for (const item of findings) {
    for (const text of [item.name, CERTAINTY_LABEL[item.certainty], item.summary, item.source, ...item.variants]) {
      expect(full).toContain(text);
      expect(brief).toContain(text);
    }
    expect(brief).toContain(`(${item.polarity}, ${CERTAINTY_LABEL[item.certainty]})`);
  }
};

describe("detail brief của tool", () => {
  it("analyze_chart mặc định brief, ngắn hơn full, không mất kết luận nào", async () => {
    const call = await setup();
    const brief = (await call("analyze_chart", {})).content;
    const full = (await call("analyze_chart", { detail: "full" })).content;
    expect(full).toContain("Cách hiểu đã dùng");
    const findings = [
      ...natalProfile(chart).findings,
      ...detectPatterns(chart),
      ...[chart.parameters.lifePalace, chart.parameters.bodyPalace].flatMap((branch) => palaceOf(branch).findings),
    ];
    expectNoLostConclusion(brief, full, findings);
    const assumptionCount = findings.reduce((total, item) => total + item.assumptions.length, 0);
    expect(brief).toContain(`giả định: ${assumptionCount} mục`);
    expect(brief).toContain("detail full");
  });

  it("các tool đơn mục đích mặc định full, nhận detail brief", async () => {
    const call = await setup();
    const cases: ReadonlyArray<[string, Record<string, unknown>]> = [
      ["natal_profile", {}],
      ["analyze_palace", { palace: "Mệnh" }],
      ["detect_patterns", {}],
      ["period_layers", { year: 2026, month: 5 }],
      ["lifetime_timeline", {}],
      ["year_forecast", { view_year: 2026 }],
    ];
    for (const [name, input] of cases) {
      const fallback = await call(name, input);
      const full = await call(name, { ...input, detail: "full" });
      const brief = await call(name, { ...input, detail: "brief" });
      expect(brief.isError, brief.content).toBe(false);
      expect(fallback.content).toBe(full.content);
      expect(brief.content.length, name).toBeLessThan(full.content.length);
    }
  });

  it("natal_profile, lifetime_timeline, period_layers brief giữ kết luận, dữ kiện và phạm vi Tứ Hóa", async () => {
    const solarBirth = { calendar: "solar", year: 1990, month: 8, day: 15, hour: 10, gender: "nam" };
    const ctx: ToolContext = { kb: await loadKb(path.join(FIX, "kb")), corpusRoot: path.join(FIX, "corpus") };
    const run = async (name: string, input: Record<string, unknown>) => {
      const full = (await runTool(toolMap, name, { birth: solarBirth, ...input, detail: "full" }, ctx)).content;
      const brief = (await runTool(toolMap, name, { birth: solarBirth, ...input, detail: "brief" }, ctx)).content;
      return { full, brief };
    };
    const solarBuilt = buildChart(
      { calendar: "solar", date: { year: 1990, month: 8, day: 15 }, time: { hour: 10, minute: 0 }, gender: "nam" },
      DEFAULT_CHART_OPTIONS,
    );
    if (!solarBuilt.ok) throw new Error(solarBuilt.error);
    const solarChart = solarBuilt.value;

    const natal = await run("natal_profile", {});
    expectNoLostConclusion(natal.brief, natal.full, natalProfile(solarChart).findings);
    for (const fact of ["- Cục kỵ hành:", "- Chủ Mệnh:", "- Chủ Thân:", "- Tuần "]) expect(natal.brief).toContain(fact);

    const timeline = await run("lifetime_timeline", {});
    expectNoLostConclusion(timeline.brief, timeline.full, lifetimeTimeline(solarChart).findings);
    const life = lifetimeTimeline(solarChart);
    expect(timeline.brief).toContain("Đồng hạn");
    for (const item of life.ageYearReturns) expect(timeline.brief).toContain(`${item.age} (${item.year})`);

    const layers = await run("period_layers", { year: 2026 });
    const layerData = periodLayers(solarChart, { year: 2026 });
    if (!layerData.ok) throw new Error(layerData.error);
    expectNoLostConclusion(layers.brief, layers.full, layerData.value.findings);
    for (const set of layerData.value.transformations) {
      expect(layers.brief).toContain(`Phạm vi: ${set.scope}.`);
      for (const variant of set.variants) expect(layers.brief).toContain(variant);
    }
  });

  it("build_chart brief chỉ giữ chính tinh, Tứ Hóa, Tuần Triệt, sát tinh và ghi chú", async () => {
    const ctx: ToolContext = { kb: await loadKb(path.join(FIX, "kb")), corpusRoot: path.join(FIX, "corpus") };
    const full = (await runTool(toolMap, "build_chart", { birth }, ctx)).content;
    const brief = (await runTool(toolMap, "build_chart", { birth, detail: "brief" }, ctx)).content;
    expect(full).toBe(renderChart(chart));
    expect(brief).toContain("Liêm Trinh (Miếu, Hóa Lộc)");
    expect(brief).toContain("Đà La, Địa Kiếp");
    expect(brief).toContain("Triệt");
    expect(brief).toContain("## Ghi chú và dị bản");
    expect(brief).not.toContain("Thiên Khôi");
    expect(brief).not.toContain("Lực Sĩ");
  });

  it("render_chart_grid trả khung text trong khối code hoặc bảng markdown", async () => {
    const call = await setup();
    const text = await call("render_chart_grid", { cell_width: 22 });
    expect(text.isError, text.content).toBe(false);
    expect(text.content).toContain("```\n┌");
    const markdown = await call("render_chart_grid", { format: "markdown", name: "Bà A" });
    expect(markdown.content).toContain("|---|---|---|---|");
    expect(markdown.content).toContain("Bà A");
  });
});
