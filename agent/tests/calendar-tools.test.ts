import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadKb } from "../src/kb/index.js";
import { ALL_TOOLS } from "../src/tools/index.js";
import { toBirthInput } from "../src/tools/chart-tools.js";
import { runTool, type ToolContext } from "../src/tools/registry.js";

const FIX = path.join(import.meta.dirname, "fixtures");
const toolMap = new Map(ALL_TOOLS.map((t) => [t.name, t]));
const call = async (name: string, input: unknown) => {
  const ctx: ToolContext = { kb: await loadKb(path.join(FIX, "kb")), corpusRoot: path.join(FIX, "corpus") };
  return runTool(toolMap, name, input, ctx);
};

describe("tool lịch và lá số", () => {
  it("convert_calendar: dương sang âm kèm can chi và tháng nhuận", async () => {
    const out = await call("convert_calendar", { direction: "solar_to_lunar", year: 2023, month: 3, day: 22 });
    expect(out.isError).toBe(false);
    expect(out.content).toContain("ngày 1 tháng 2 nhuận năm 2023");
    expect(out.content).toContain("năm Quý Mão");
    expect(out.content).toContain("nhuận tháng 2");
  });

  it("convert_calendar: ngày âm không tồn tại trả lỗi có thông báo", async () => {
    const out = await call("convert_calendar", { direction: "lunar_to_solar", year: 2024, month: 5, day: 1, is_leap_month: true });
    expect(out.isError).toBe(true);
    expect(out.content).toContain("không có tháng nhuận");
  });

  it("convert_hour: giờ Thìn, cảnh báo gần ranh giới, can giờ", async () => {
    const out = await call("convert_hour", { hour: 8, minute: 55, solar_date: { year: 2024, month: 2, day: 10 } });
    expect(out.content).toContain("Canh giờ: Thìn (07:00–09:00)");
    expect(out.content).toContain("Can chi giờ: Mậu Thìn");
    expect(out.content).toContain("ranh giới");
  });

  it("stem_branch_info và determine_bureau", async () => {
    const info = await call("stem_branch_info", { year: 1979 });
    expect(info.content).toContain("Kỷ Mùi");
    expect(info.content).toContain("Thiên Thượng Hỏa");
    const bureau = await call("determine_bureau", { year: 1979, life_palace: "Thìn" });
    expect(bureau.content).toContain("Mậu Thìn");
    expect(bureau.content).toContain("Mộc tam cục");
  });

  it("branch_relations: một chi và nhiều chi", async () => {
    const single = await call("branch_relations", { branches: ["Dần"] });
    expect(single.content).toContain("Dần Ngọ Tuất");
    const pairs = await call("branch_relations", { branches: ["Dần", "Thân", "Ngọ"] });
    expect(pairs.content).toContain("Dần – Thân: Dần – Thân xung chiếu");
    expect(pairs.content).toContain("Dần – Ngọ: Dần – Ngọ cùng bộ tam hợp");
  });

  it("element_relation", async () => {
    expect((await call("element_relation", { subject: "Hỏa", other: "Thủy" })).content).toContain("Thủy khắc Hỏa");
  });

  it("build_chart từ âm lịch ra bảng 12 cung", async () => {
    const out = await call("build_chart", {
      birth: { calendar: "lunar", year: 1974, month: 3, day: 7, hour_branch: "Dần", gender: "nữ" },
    });
    expect(out.isError).toBe(false);
    expect(out.content).toContain("Hỏa lục cục");
    expect(out.content).toContain("Liêm Trinh (Miếu, Hóa Lộc)");
  });

  it("build_chart thiếu giờ thì báo lỗi rõ ràng", async () => {
    const out = await call("build_chart", { birth: { calendar: "solar", year: 1990, month: 5, day: 1, gender: "nam" } });
    expect(out.isError).toBe(true);
    expect(out.content).toContain("cần giờ");
  });

  it("year_forecast", async () => {
    const out = await call("year_forecast", {
      birth: { calendar: "lunar", year: 1974, month: 3, day: 7, hour_branch: "Dần", gender: "nữ" },
      view_year: 2000,
    });
    expect(out.content).toContain("Canh Thìn");
    expect(out.content).toContain("27 tuổi âm");
  });

  it("toBirthInput đổi giờ đồng hồ sang chi khi nhập âm lịch", () => {
    const input = toBirthInput({ calendar: "lunar", year: 1974, month: 3, day: 7, hour: 23, minute: 30, gender: "nam" });
    expect(input.ok && input.value.calendar === "lunar" && input.value.hourBranch).toBe(0);
  });
});
