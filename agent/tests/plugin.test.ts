import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../src/config.js";
import { PLUGIN_TOOL_PATTERN, renderXemCommand } from "../src/mcp/command.js";
import { MCP_SERVER_NAME } from "../src/mcp/server.js";

const PLUGIN_ROOT = path.join(REPO_ROOT, "tu-vi-plugin");
const readJson = (file: string) => JSON.parse(fs.readFileSync(file, "utf8"));

describe("plugin Claude Code", () => {
  it("commands/xem.md khớp với READING_GUIDE hiện tại (chạy pnpm build:plugin nếu hỏng)", () => {
    expect(fs.readFileSync(path.join(PLUGIN_ROOT, "commands", "xem.md"), "utf8")).toBe(renderXemCommand());
  });

  it("manifest, marketplace và .mcp.json khớp tên với nhau", () => {
    const manifest = readJson(path.join(PLUGIN_ROOT, ".claude-plugin", "plugin.json"));
    const marketplace = readJson(path.join(REPO_ROOT, ".claude-plugin", "marketplace.json"));
    const mcp = readJson(path.join(PLUGIN_ROOT, ".mcp.json"));
    expect(marketplace.plugins.map((plugin: { name: string }) => plugin.name)).toContain(manifest.name);
    const serverKey = Object.keys(mcp.mcpServers)[0]!;
    expect(PLUGIN_TOOL_PATTERN).toBe(`mcp__plugin_${manifest.name}_${serverKey}__*`);
    expect(mcp.mcpServers[serverKey].args[0]).toBe("${CLAUDE_PLUGIN_ROOT}/server/tuvi-mcp.mjs");
    expect(MCP_SERVER_NAME).toBe("tu-vi-nam-phai");
  });

  it("server và dữ liệu đã build có trong plugin để cài thẳng từ GitHub", () => {
    expect(fs.existsSync(path.join(PLUGIN_ROOT, "server", "tuvi-mcp.mjs"))).toBe(true);
    expect(fs.existsSync(path.join(PLUGIN_ROOT, "data", "Kien-thuc-Tu-Vi-Nam-Phai", "README.md"))).toBe(true);
    const ignore = fs.readFileSync(path.join(REPO_ROOT, ".gitignore"), "utf8");
    expect(ignore).not.toContain("tu-vi-plugin/server/");
  });

  it("server đã build không chứa đường dẫn cá nhân của máy build", () => {
    const bundle = fs.readFileSync(path.join(PLUGIN_ROOT, "server", "tuvi-mcp.mjs"), "utf8");
    expect(bundle).not.toContain(REPO_ROOT);
  });
});
