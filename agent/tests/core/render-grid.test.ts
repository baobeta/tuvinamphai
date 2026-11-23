import { describe, expect, it } from "vitest";
import { branchName } from "../../src/core/calendar/stem-branch.js";
import { buildChart } from "../../src/core/chart/build-chart.js";
import { formatStar } from "../../src/core/chart/render.js";
import { displayLength, GRID_LAYOUT, padDisplay, renderChartGrid, wrapItems } from "../../src/core/chart/render-grid.js";
import { DEFAULT_CHART_OPTIONS } from "../../src/core/chart/types.js";

const built = buildChart({ calendar: "lunar", date: { year: 1974, month: 3, day: 7, isLeapMonth: false }, hourBranch: 2, gender: "nữ" }, DEFAULT_CHART_OPTIONS);
if (!built.ok) throw new Error(built.error);
const chart = built.value;

describe("độ dài hiển thị tiếng Việt", () => {
  it("NFC và NFD cùng độ dài, đệm đúng số cột", () => {
    const composed = "Thiên Đồng (Miếu) Hóa Kỵ";
    const decomposed = composed.normalize("NFD");
    expect(decomposed.length).toBeGreaterThan(composed.length);
    expect(displayLength(decomposed)).toBe(displayLength(composed));
    expect(displayLength(composed)).toBe(24);
    expect(displayLength(padDisplay(decomposed, 30))).toBe(30);
    expect(padDisplay(decomposed, 30)).toBe(padDisplay(composed, 30));
  });

  it("wrapItems không vượt độ rộng và giữ đủ chữ", () => {
    const items = ["Thiên Khôi", "Ân Quang", "Thiên Quý", "Đà La", "Hồng Loan", "Quả Tú", "Địa Kiếp", "Phượng Các Giải Thần Thiên Hư"];
    const lines = wrapItems(items, 12);
    for (const line of lines) expect(displayLength(line)).toBeLessThanOrEqual(12);
    expect(lines.join(" ").replace(/,/g, "").split(/\s+/)).toEqual(items.join(" ").split(/\s+/));
  });
});

describe("renderChartGrid dạng text", () => {
  it.each([26, 20, 34])("mọi dòng cùng độ rộng với ô %i", (cellWidth) => {
    const lines = renderChartGrid(chart, { cellWidth }).split("\n");
    for (const line of lines) expect(displayLength(line)).toBe(cellWidth * 4 + 5);
    expect(lines[0]!.startsWith("┌")).toBe(true);
    expect(lines.at(-1)!.startsWith("└")).toBe(true);
  });

  it("hàng trên Tỵ Ngọ Mùi Thân, hàng dưới Dần Sửu Tý Hợi, cột bên Thìn/Mão và Dậu/Tuất", () => {
    expect(GRID_LAYOUT.map((row) => row.map((branch) => (branch < 0 ? "·" : branchName(branch))))).toEqual([
      ["Tỵ", "Ngọ", "Mùi", "Thân"],
      ["Thìn", "·", "·", "Dậu"],
      ["Mão", "·", "·", "Tuất"],
      ["Dần", "Sửu", "Tý", "Hợi"],
    ]);
    const lines = renderChartGrid(chart).split("\n");
    const firstRow = lines[1]!;
    const topRoles = [5, 6, 7, 8].map((branch) => chart.palaces[branch]!.role.toUpperCase());
    const positions = topRoles.map((role) => firstRow.indexOf(role));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    const bottomStart = lines.findLastIndex((line) => line.startsWith("├"));
    const bottomRoles = [2, 1, 0, 11].map((branch) => lines[bottomStart + 1]!.indexOf(chart.palaces[branch]!.role.toUpperCase()));
    expect(bottomRoles.every((position) => position > 0)).toBe(true);
    expect([...bottomRoles].sort((a, b) => a - b)).toEqual(bottomRoles);
  });

  it("ô có cung chức, dấu Thân, can chi, đại hạn, chính tinh kèm miếu hãm và Hóa; ô giữa có dữ kiện sinh", () => {
    const grid = renderChartGrid(chart, { cellWidth: 40 });
    expect(grid).toContain("QUAN LỘC · THÂN");
    expect(grid).toContain("Canh Ngọ · ĐH 86");
    expect(grid).toContain("THIÊN DI [Triệt]");
    for (const palace of chart.palaces) {
      for (const star of palace.stars.filter((item) => item.group === "chính tinh")) expect(grid).toContain(formatStar(star));
    }
    for (const text of ["Dương lịch: 30/3/1974", "Dương Nữ", "Đại Khê Thủy", "Hỏa lục cục", "Mệnh chủ: Lộc Tồn", "Thân chủ: Thiên Lương"]) {
      expect(grid).toContain(text);
    }
    expect(renderChartGrid(chart, { name: "Nguyễn Thị A" })).toContain("Nguyễn Thị A");
  });

  it("ô hẹp hơn mức tối thiểu được nâng lên 12", () => {
    const lines = renderChartGrid(chart, { cellWidth: 4 }).split("\n");
    for (const line of lines) expect(displayLength(line)).toBe(12 * 4 + 5);
  });
});

describe("renderChartGrid dạng markdown", () => {
  it("bảng 4×4 có hàng phân cách, ô giữa chứa dữ kiện sinh", () => {
    const rows = renderChartGrid(chart, { format: "markdown" }).split("\n");
    expect(rows).toHaveLength(5);
    expect(rows[1]).toBe("|---|---|---|---|");
    for (const row of rows) expect(row.split(/(?<!\\)\|/).length - 2).toBe(4);
    expect(rows[0]).toContain("ĐIỀN TRẠCH");
    expect(rows[2]).toContain("Bản mệnh: Đại Khê Thủy");
    expect(rows[4]).toContain("**Liêm Trinh (Miếu, Hóa Lộc)**");
    const named = renderChartGrid(chart, { format: "markdown", name: "A | B\nC" }).split("\n");
    expect(named).toHaveLength(5);
    expect(named[2]).toContain("A \\| B C");
  });
});
