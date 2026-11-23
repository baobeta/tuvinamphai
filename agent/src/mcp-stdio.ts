import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { loadKb } from "./kb/index.js";
import { createTuViMcpServer } from "./mcp/server.js";
import { createWorkspaceChartStore } from "./tools/chart-store.js";
import { ALL_TOOLS } from "./tools/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const kb = await loadKb(config.kbRoot);
  const server = createTuViMcpServer(ALL_TOOLS, {
    kb,
    corpusRoot: config.corpusRoot,
    charts: createWorkspaceChartStore(config.chartDir),
  });
  await server.connect(new StdioServerTransport());
  process.stderr.write(`tu-vi-nam-phai MCP: ${ALL_TOOLS.length} tool, kho ${kb.docs.length} file, ${config.kbRoot}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`tu-vi-nam-phai MCP lỗi khởi động: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
