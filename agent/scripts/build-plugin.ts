import fs from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { REPO_ROOT } from "../src/config.js";
import { renderXemCommand } from "../src/mcp/command.js";
import { BOOK_DIRS } from "../src/tools/kb-tools.js";

const AGENT_ROOT = path.join(REPO_ROOT, "agent");
const PLUGIN_ROOT = path.join(REPO_ROOT, "tu-vi-plugin");
const SERVER_FILE = path.join(PLUGIN_ROOT, "server", "tuvi-mcp.mjs");
const DATA_ROOT = path.join(PLUGIN_ROOT, "data");
const KB_DIR = "Kien-thuc-Tu-Vi-Nam-Phai";
const COMMAND_FILE = path.join(PLUGIN_ROOT, "commands", "xem.md");

const isCopiedFile = (name: string): boolean => name.endsWith(".md");

function copyMarkdownTree(source: string, target: string): number {
  let copied = 0;
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copied += copyMarkdownTree(from, to);
    } else if (entry.isFile() && isCopiedFile(entry.name)) {
      fs.mkdirSync(target, { recursive: true });
      fs.copyFileSync(from, to);
      copied += 1;
    }
  }
  return copied;
}

async function bundleServer(): Promise<void> {
  await build({
    entryPoints: [path.join(AGENT_ROOT, "src", "mcp-stdio.ts")],
    outfile: SERVER_FILE,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    legalComments: "none",
    banner: { js: 'import { createRequire as __tuviCreateRequire } from "node:module"; const require = __tuviCreateRequire(import.meta.url);' },
    logLevel: "warning",
  });
}

async function main(): Promise<void> {
  fs.rmSync(path.join(PLUGIN_ROOT, "server"), { recursive: true, force: true });
  fs.rmSync(DATA_ROOT, { recursive: true, force: true });
  await bundleServer();
  const counts = [KB_DIR, ...Object.values(BOOK_DIRS)].map(
    (dir) => [dir, copyMarkdownTree(path.join(REPO_ROOT, dir), path.join(DATA_ROOT, dir))] as const,
  );
  fs.mkdirSync(path.dirname(COMMAND_FILE), { recursive: true });
  fs.writeFileSync(COMMAND_FILE, renderXemCommand(), "utf8");
  const size = (fs.statSync(SERVER_FILE).size / 1024).toFixed(0);
  process.stdout.write(`server: ${path.relative(REPO_ROOT, SERVER_FILE)} (${size} KB)\n`);
  for (const [dir, count] of counts) process.stdout.write(`data/${dir}: ${count} file .md\n`);
  process.stdout.write(`command: ${path.relative(REPO_ROOT, COMMAND_FILE)}\n`);
}

await main();
