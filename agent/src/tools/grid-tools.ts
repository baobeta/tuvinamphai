import { z } from "zod";
import { DEFAULT_GRID_CELL_WIDTH, MIN_GRID_CELL_WIDTH, renderChartGrid } from "../core/chart/render-grid.js";
import { chartReferenceFields, resolveChart } from "./chart-tools.js";
import { defineTool } from "./registry.js";

export const renderChartGridTool = defineTool({
  name: "render_chart_grid",
  description:
    "Vẽ lá số theo bố cục địa bàn 4×4 cổ điển (Tỵ Ngọ Mùi Thân ở trên; Thìn, Mão bên trái; Dậu, Tuất bên phải; Dần Sửu Tý Hợi ở dưới; " +
    "giữa là dữ kiện sinh, âm dương, bản mệnh, Cục, Mệnh chủ, Thân chủ). Mỗi ô: cung chức (dấu THÂN), can chi, tuổi đại hạn, " +
    "chính tinh kèm miếu hãm và Hóa, rồi phụ tinh. format text: khung chữ đơn cách để hiển thị trong khối code; markdown: bảng 4×4 cho giao diện chat.",
  schema: z.strictObject({
    ...chartReferenceFields,
    format: z.enum(["text", "markdown"]).optional().describe("text (mặc định): khung box-drawing đơn cách; markdown: bảng 4×4"),
    cell_width: z
      .number()
      .int()
      .min(MIN_GRID_CELL_WIDTH)
      .max(60)
      .optional()
      .describe(`Độ rộng mỗi ô (ký tự) cho format text, mặc định ${DEFAULT_GRID_CELL_WIDTH}`),
    name: z.string().max(60).optional().describe("Tên đương số, hiện ở ô giữa"),
  }),
  async run({ format, cell_width, name, ...reference }, ctx) {
    const resolved = resolveChart(reference, ctx);
    const grid = renderChartGrid(resolved.chart, {
      ...(format ? { format } : {}),
      ...(cell_width ? { cellWidth: cell_width } : {}),
      ...(name ? { name } : {}),
    });
    const header = resolved.id ? `chart_id: ${resolved.id}\n\n` : "";
    return format === "markdown" ? header + grid : `${header}\`\`\`\n${grid}\n\`\`\``;
  },
});

export const GRID_TOOLS = [renderChartGridTool];
