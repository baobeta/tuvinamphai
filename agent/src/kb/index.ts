import fs from "node:fs/promises";
import path from "node:path";
import { parseKbDocument, type KbDocument } from "./document.js";

export interface KbIndex {
  root: string;
  docs: KbDocument[];
  byPath: Map<string, KbDocument>;
  branches: string[];
}

const isContentFile = (name: string) =>
  name.endsWith(".md") && name !== "README.md" && !name.startsWith("00_DAC-TA") && !name.startsWith("_");

async function walk(dir: string, root: string, out: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, root, out);
    else if (e.isFile() && isContentFile(e.name)) out.push(path.relative(root, full));
  }
}

export async function loadKb(root: string): Promise<KbIndex> {
  const stat = await fs.stat(root).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new Error(`Không tìm thấy kho tri thức tại ${root}. Đặt TUVI_WORKSPACE hoặc TUVI_KB_DIR.`);
  }
  const rels: string[] = [];
  await walk(root, root, rels);
  const docs = await Promise.all(
    rels.map(async (rel) => parseKbDocument(rel, await fs.readFile(path.join(root, rel), "utf8"))),
  );
  return {
    root,
    docs,
    byPath: new Map(docs.map((d) => [d.path, d])),
    branches: [...new Set(docs.map((d) => d.branch))].sort(),
  };
}
