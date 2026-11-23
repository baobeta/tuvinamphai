import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadKb } from "../src/kb/index.js";
import {
  ALL_TOOLS,
  grepCorpusTool,
  listKbTool,
  readCorpusFileTool,
  readKbFileTool,
  searchKbTool,
} from "../src/tools/kb-tools.js";
import { resolveInside, PathEscapeError } from "../src/tools/paths.js";
import { runTool, toApiTool, type ToolContext } from "../src/tools/registry.js";

const FIX = path.join(import.meta.dirname, "fixtures");
const ctx = async (): Promise<ToolContext> => ({ kb: await loadKb(path.join(FIX, "kb")), corpusRoot: path.join(FIX, "corpus") });
const toolMap = new Map(ALL_TOOLS.map((t) => [t.name, t]));

describe("resolveInside", () => {
  it("chặn ../ ra ngoài thư mục gốc", async () => {
    await expect(resolveInside(path.join(FIX, "kb"), "../outside.txt")).rejects.toBeInstanceOf(PathEscapeError);
  });
  it("chặn đường dẫn tuyệt đối", async () => {
    await expect(resolveInside(path.join(FIX, "kb"), "/etc/passwd")).rejects.toBeInstanceOf(PathEscapeError);
  });
  it("cho phép đường dẫn bên trong", async () => {
    const p = await resolveInside(path.join(FIX, "kb"), "04_Chinh-tinh/10_Cu-Mon/02_Mieu-ham-va-12-vi-tri.md");
    expect(p.endsWith("02_Mieu-ham-va-12-vi-tri.md")).toBe(true);
  });
});

describe("toApiTool", () => {
  it("sinh JSON Schema đóng (additionalProperties: false), không có $schema", () => {
    for (const t of ALL_TOOLS) {
      const api = toApiTool(t);
      expect(api.input_schema.type).toBe("object");
      expect((api.input_schema as Record<string, unknown>).additionalProperties).toBe(false);
      expect(api.input_schema).not.toHaveProperty("$schema");
      expect(api.eager_input_streaming).toBe(true);
    }
  });
  it("tên tool không trùng", () => {
    expect(new Set(ALL_TOOLS.map((t) => t.name)).size).toBe(ALL_TOOLS.length);
  });
});

describe("runTool", () => {
  it("input sai schema → is_error, không chạy", async () => {
    const r = await runTool(toolMap, "search_kb", { query: "", extra: 1 }, await ctx());
    expect(r.isError).toBe(true);
    expect(r.content).toMatch(/INVALID_INPUT/);
  });
  it("tool không tồn tại → is_error", async () => {
    expect((await runTool(toolMap, "rm_rf", {}, await ctx())).isError).toBe(true);
  });
  it("đường dẫn thoát ra ngoài → is_error", async () => {
    const r = await runTool(toolMap, "read_kb_file", { path: "../outside.txt" }, await ctx());
    expect(r.isError).toBe(true);
    expect(r.content).not.toContain("secret");
  });
});

describe("các tool", () => {
  it("search_kb liệt kê file kèm câu hỏi mẫu", async () => {
    const out = await searchKbTool.run({ query: "Cự Môn" }, await ctx());
    expect(out).toContain("04_Chinh-tinh/10_Cu-Mon/02_Mieu-ham-va-12-vi-tri.md");
    expect(out).toContain("Trả lời:");
  });
  it("search_kb báo nhánh không tồn tại", async () => {
    expect(await searchKbTool.run({ query: "x", branch: "99_Khong-co" }, await ctx())).toMatch(/Nhánh không tồn tại/);
  });
  it("read_kb_file trả toàn văn", async () => {
    const out = await readKbFileTool.run({ path: "04_Chinh-tinh/10_Cu-Mon/02_Mieu-ham-va-12-vi-tri.md" }, await ctx());
    expect(out).toContain("Tân nhân hóa cát");
  });
  it("list_kb liệt kê nhánh gốc", async () => {
    const out = await listKbTool.run({}, await ctx());
    expect(out).toContain("04_Chinh-tinh/");
    expect(out).toContain("03_Muoi-hai-cung/");
  });
  it("grep_corpus tìm nguyên văn và ghi mã sách", async () => {
    const out = await grepCorpusTool.run({ text: "tuổi Quí tuổi Tân" }, await ctx());
    expect(out).toMatch(/^TVTH\/02_Phan-II\/11_Sao-Cu-Mon\.md:6:/);
  });
  it("grep_corpus bỏ dấu cho bản OCR", async () => {
    const out = await grepCorpusTool.run({ text: "tuoi qui tuoi tan", ignore_diacritics: true }, await ctx());
    expect(out).toContain("TVTH/");
  });
  it("read_corpus_file kèm dòng số trang", async () => {
    const out = await readCorpusFileTool.run({ path: "TVTH/02_Phan-II/11_Sao-Cu-Mon.md", max_lines: 3 }, await ctx());
    expect(out).toContain("Trang sách 44–46");
  });
  it("read_corpus_file từ chối mã sách lạ", async () => {
    expect(await readCorpusFileTool.run({ path: "XYZ/a.md" }, await ctx())).toMatch(/Mã sách không hợp lệ/);
  });
});
