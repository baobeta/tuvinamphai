import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { searchKb } from "../kb/search.js";
import { normalizeVi, foldVi } from "../kb/normalize.js";
import { resolveInside } from "./paths.js";
import { defineTool, type ToolSpec } from "./registry.js";

const MAX_FILE_CHARS = 30_000;

export const searchKbTool = defineTool({
  name: "search_kb",
  description:
    "Tìm trong kho tri thức Tử Vi Nam Phái (426 file, mỗi file trả lời một câu hỏi nhỏ, có ví dụ và trích nguồn). " +
    "Trả về danh sách file xếp theo mức liên quan, kèm câu hỏi mẫu và đoạn trích. Dùng tên sao, cung, cách cục, " +
    "chủ đề làm truy vấn (ví dụ: 'Cự Môn Thìn tuổi Tân', 'Thân cư Phúc', 'hạn hôn nhân'). Gọi tool này trước tiên.",
  schema: z.strictObject({
    query: z.string().min(1).describe("Truy vấn tiếng Việt, có hoặc không dấu"),
    branch: z
      .string()
      .optional()
      .describe("Giới hạn trong một nhánh, ví dụ '04_Chinh-tinh', '09_Cach-cuc', '10_Van-han'"),
    limit: z.number().int().min(1).max(25).optional().describe("Số kết quả, mặc định 8"),
  }),
  async run({ query, branch, limit }, { kb }) {
    if (branch && !kb.branches.includes(branch)) {
      return `Nhánh không tồn tại: ${branch}. Các nhánh: ${kb.branches.join(", ")}`;
    }
    const hits = searchKb(kb, query, { branch, limit });
    if (hits.length === 0) return `Không tìm thấy file nào cho "${query}". Thử từ khóa khác hoặc grep_corpus.`;
    return hits
      .map(
        (h, i) =>
          `${i + 1}. ${h.doc.path} (điểm ${h.score})\n   # ${h.doc.title}\n` +
          (h.doc.questions.length ? `   Trả lời: ${h.doc.questions.slice(0, 3).join(" · ")}\n` : "") +
          `   Trích: ${h.snippet}`,
      )
      .join("\n");
  },
});

export const readKbFileTool = defineTool({
  name: "read_kb_file",
  description:
    "Đọc toàn văn một file trong kho tri thức theo đường dẫn tương đối mà search_kb hoặc list_kb trả về. " +
    "File có các mục: Tóm tắt, Nội dung chi tiết, Ví dụ, Dị bản, Liên quan, và dòng Nguồn chính để trích dẫn.",
  schema: z.strictObject({
    path: z.string().min(1).describe("Ví dụ '04_Chinh-tinh/10_Cu-Mon/02_Mieu-ham-va-12-vi-tri.md'"),
  }),
  async run({ path: rel }, { kb }) {
    const full = await resolveInside(kb.root, rel);
    const text = await fs.readFile(full, "utf8");
    return text.length > MAX_FILE_CHARS
      ? `${text.slice(0, MAX_FILE_CHARS)}\n\n[… cắt bớt, file dài ${text.length} ký tự]`
      : text;
  },
});

export const listKbTool = defineTool({
  name: "list_kb",
  description:
    "Liệt kê nhánh, thư mục con và file của kho tri thức kèm tiêu đề. Không truyền `dir` để xem 13 nhánh gốc.",
  schema: z.strictObject({
    dir: z.string().optional().describe("Thư mục tương đối, ví dụ '03_Muoi-hai-cung/11_Cung-Phu-The'"),
  }),
  async run({ dir }, { kb }) {
    const prefix = dir ? `${dir.replace(/\/+$/, "")}/` : "";
    if (dir) await resolveInside(kb.root, dir);
    const children = new Map<string, string>();
    for (const d of kb.docs) {
      if (!d.path.startsWith(prefix)) continue;
      const rest = d.path.slice(prefix.length);
      const [head, ...tail] = rest.split("/");
      if (!head) continue;
      if (tail.length === 0) children.set(head, `file · ${d.title}`);
      else children.set(`${head}/`, `thư mục · ${kb.docs.filter((x) => x.path.startsWith(`${prefix}${head}/`)).length} file`);
    }
    if (children.size === 0) return `Không có gì trong "${dir}".`;
    return [...children].map(([name, info]) => `${prefix}${name}  (${info})`).join("\n");
  },
});

export const BOOK_DIRS = {
  MLTC: "Menh-Ly-Thien-Co_Tu-Vi-Nam-Phai",
  NP1: "Tu-Vi-Nam-Phai_Phan-1",
  NP2: "Tu-Vi-Nam-Phai_Phan-2",
  TVTH: "Tu-Vi-Thuc-Hanh",
} as const;

async function listMarkdown(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith(".md") && e.name !== "README.md") out.push(path.join(e.parentPath, e.name));
  }
  return out.sort();
}

export const grepCorpusTool = defineTool({
  name: "grep_corpus",
  description:
    "Tìm nguyên văn trong 4 cuốn sách gốc (MLTC, NP1, NP2, TVTH) khi cần trích câu phú, kiểm chứng một quy tắc, " +
    "hoặc kho tri thức không có. Trả về 'sách/đường-dẫn:dòng: nội dung'. NP1/NP2 là bản OCR, có thể sai chính tả.",
  schema: z.strictObject({
    text: z.string().min(2).describe("Chuỗi cần tìm (không phân biệt hoa thường)"),
    book: z.enum(["MLTC", "NP1", "NP2", "TVTH"]).optional().describe("Giới hạn một cuốn"),
    ignore_diacritics: z.boolean().optional().describe("Bỏ qua dấu tiếng Việt (hữu ích với bản OCR)"),
    limit: z.number().int().min(1).max(60).optional().describe("Số dòng tối đa, mặc định 25"),
  }),
  async run({ text, book, ignore_diacritics, limit = 25 }, { corpusRoot }) {
    const norm = ignore_diacritics ? foldVi : normalizeVi;
    const needle = norm(text);
    const books = book ? [book] : (Object.keys(BOOK_DIRS) as (keyof typeof BOOK_DIRS)[]);
    const lines: string[] = [];
    for (const code of books) {
      const files = await listMarkdown(path.join(corpusRoot, BOOK_DIRS[code])).catch(() => []);
      for (const file of files) {
        const content = await fs.readFile(file, "utf8");
        const rows = content.split("\n");
        for (let i = 0; i < rows.length && lines.length < limit; i++) {
          if (norm(rows[i] ?? "").includes(needle)) {
            lines.push(`${code}/${path.relative(path.join(corpusRoot, BOOK_DIRS[code]), file)}:${i + 1}: ${rows[i]!.trim().slice(0, 300)}`);
          }
        }
        if (lines.length >= limit) return `${lines.join("\n")}\n[… dừng ở ${limit} dòng]`;
      }
    }
    return lines.length ? lines.join("\n") : `Không thấy "${text}" trong ${books.join(", ")}.`;
  },
});

export const readCorpusFileTool = defineTool({
  name: "read_corpus_file",
  description:
    "Đọc một đoạn của file sách gốc. `path` dạng 'MLTC/Chuong-01_La-so-Tu-Vi/07_Lap-tu-tru-va-la-so-tu-vi.md' " +
    "(mã sách + đường dẫn như grep_corpus trả về). Dòng đầu file có '> Trang sách a–b' để trích dẫn.",
  schema: z.strictObject({
    path: z.string().min(3),
    start_line: z.number().int().min(1).optional().describe("Dòng bắt đầu, mặc định 1"),
    max_lines: z.number().int().min(1).max(400).optional().describe("Số dòng, mặc định 150"),
  }),
  async run({ path: p, start_line = 1, max_lines = 150 }, { corpusRoot }) {
    const [code, ...rest] = p.split("/");
    const dir = BOOK_DIRS[code as keyof typeof BOOK_DIRS];
    if (!dir) return `Mã sách không hợp lệ: ${code}. Dùng MLTC, NP1, NP2 hoặc TVTH.`;
    const full = await resolveInside(path.join(corpusRoot, dir), rest.join("/"));
    const rows = (await fs.readFile(full, "utf8")).split("\n");
    const slice = rows.slice(start_line - 1, start_line - 1 + max_lines);
    const header = rows.slice(0, 4).find((r) => r.includes("Trang sách")) ?? "";
    return `${header ? `${header}\n` : ""}[dòng ${start_line}–${start_line + slice.length - 1} / ${rows.length}]\n${slice.join("\n")}`;
  },
});

export const ALL_TOOLS: ToolSpec[] = [
  searchKbTool,
  readKbFileTool,
  listKbTool,
  grepCorpusTool,
  readCorpusFileTool,
] as ToolSpec[];
