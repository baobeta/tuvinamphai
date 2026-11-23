import { z } from "zod";
import { compareCharts, renderComparison } from "../core/compare/index.js";
import { chartReferenceFields, resolveChart, type ResolvedChart } from "./chart-tools.js";
import { defineTool } from "./registry.js";
import { unwrapOrThrow } from "./result-output.js";

const chartReferenceSchema = z.strictObject(chartReferenceFields);

const idLine = (label: string, resolved: ResolvedChart): string => (resolved.id ? `chart_id ${label}: ${resolved.id}` : "");

export const compareChartsTool = defineTool({
  name: "compare_charts",
  description:
    "So hai lá số (hợp tuổi, hôn nhân, đối tác). Mỗi bên là chart_id hoặc birth (+ options). Trả về dữ kiện xếp nhóm hợp / xung / trung tính, " +
    "không cho điểm: can năm hợp, phá (TVTH tr.6–8); chi năm tam hợp, lục hợp, xung, hại, cùng nhóm tứ sinh/mộ/tuyệt (TVTH tr.8–9); " +
    "nạp âm hai chiều; với vợ chồng thêm quy tắc hợp tuổi NP2 tr.59–63, tinh hệ Phu Thê – Mệnh/Thân và ngũ hành cục (MLTC tr.903–944); " +
    "Thái Tuế nhập quẻ hai chiều (MLTC tr.985–987): tứ hóa can năm người kia và cung chi năm người kia trên lá số mình.",
  schema: z.strictObject({
    first: chartReferenceSchema.describe("Người thứ nhất (A)"),
    second: chartReferenceSchema.describe("Người thứ hai (B)"),
    relationship: z
      .enum(["spouse", "sibling", "friend"])
      .optional()
      .describe("Quan hệ: spouse = vợ chồng (cung Phu Thê, mặc định), sibling = anh chị em (Huynh Đệ), friend = bạn bè, đối tác (Nô Bộc)"),
  }),
  async run({ first, second, relationship }, ctx) {
    const resolvedFirst = resolveChart(first, ctx);
    const resolvedSecond = resolveChart(second, ctx);
    const comparison = unwrapOrThrow(
      compareCharts(resolvedFirst.chart, resolvedSecond.chart, { relationship: relationship ?? "spouse", labels: ["A", "B"] }),
    );
    const ids = [idLine("A", resolvedFirst), idLine("B", resolvedSecond)].filter(Boolean).join("\n");
    return (ids ? `${ids}\n\n` : "") + renderComparison(comparison);
  },
});

export const COMPARE_TOOLS = [compareChartsTool];
