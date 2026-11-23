import { foldVi, normalizeVi } from "./normalize.js";

export interface KbDocument {
  path: string;
  branch: string;
  title: string;
  questions: string[];
  keywords: string[];
  sources: string;
  body: string;
  norm: { title: string; questions: string; keywords: string; body: string };
  fold: { title: string; questions: string; keywords: string; body: string };
}

const headerField = (content: string, label: string): string => {
  const m = content.match(new RegExp(`^>\\s*\\*\\*${label}:\\*\\*\\s*(.+)$`, "m"));
  return m?.[1]?.trim() ?? "";
};

const splitList = (raw: string): string[] =>
  raw
    .split(/\s*[·;]\s*|,\s+/)
    .map((s) => s.replace(/^["“”']+|["“”']+$/g, "").trim())
    .filter(Boolean);

export function parseKbDocument(relPath: string, content: string): KbDocument {
  const path = relPath.split("\\").join("/");
  const title = content.match(/^# (.+)$/m)?.[1]?.trim() ?? path;
  const questions = splitList(headerField(content, "Trả lời câu hỏi"));
  const keywords = splitList(headerField(content, "Từ khóa"));
  const sources = headerField(content, "Nguồn chính");
  const bodyStart = content.search(/^## /m);
  const body = bodyStart >= 0 ? content.slice(bodyStart) : content;
  const q = questions.join(" | ");
  const k = keywords.join(" | ");
  return {
    path,
    branch: path.split("/")[0] ?? "",
    title,
    questions,
    keywords,
    sources,
    body,
    norm: { title: normalizeVi(title), questions: normalizeVi(q), keywords: normalizeVi(k), body: normalizeVi(body) },
    fold: { title: foldVi(title), questions: foldVi(q), keywords: foldVi(k), body: foldVi(body) },
  };
}
