import type { KbDocument } from "./document.js";
import type { KbIndex } from "./index.js";
import { foldVi, normalizeVi, queryTerms } from "./normalize.js";

export interface SearchHit {
  doc: KbDocument;
  score: number;
  snippet: string;
}

export interface SearchOptions {
  limit?: number;
  branch?: string;
}

export function countOccurrences(hay: string, needle: string): number {
  if (!needle) return 0;
  let n = 0;
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + needle.length)) n++;
  return n;
}

export function scoreDocument(doc: KbDocument, terms: { words: string[]; bigrams: string[] }): number {
  let score = 0;
  for (const t of [...terms.bigrams, ...terms.words]) {
    const f = foldVi(t);
    if (doc.fold.title.includes(f)) score += 3;
    if (doc.fold.questions.includes(f)) score += 2;
    if (doc.fold.keywords.includes(f)) score += 2;
    if (doc.fold.body.includes(f)) score += 1;
  }
  return score;
}

export function makeSnippet(doc: KbDocument, terms: { words: string[]; bigrams: string[] }, max = 220): string {
  const lines = doc.body.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
  const candidates = [...terms.bigrams, ...terms.words].map(foldVi);
  const line =
    candidates.map((c) => lines.find((l) => foldVi(l).includes(c))).find(Boolean) ?? lines[0] ?? "";
  const clean = line.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export function searchKb(index: KbIndex, query: string, opts: SearchOptions = {}): SearchHit[] {
  const terms = queryTerms(query);
  if (terms.words.length === 0) return [];
  const limit = Math.min(Math.max(opts.limit ?? 8, 1), 25);
  const pool = opts.branch ? index.docs.filter((d) => d.branch === opts.branch) : index.docs;
  return pool
    .map((doc) => ({ doc, score: scoreDocument(doc, terms) }))
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score || a.doc.path.localeCompare(b.doc.path))
    .slice(0, limit)
    .map((h) => ({ ...h, snippet: makeSnippet(h.doc, terms) }));
}

export const hasExact = (hay: string, needle: string) => normalizeVi(hay).includes(normalizeVi(needle));
