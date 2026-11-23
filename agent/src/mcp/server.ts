import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { SYSTEM_PROMPT } from "../agent/system-prompt.js";
import { runTool, type ToolContext, type ToolSpec } from "../tools/registry.js";
import { READING_PROMPT_ARGUMENTS, READING_PROMPT_DESCRIPTION, READING_PROMPT_NAME, readingPromptText } from "./prompts.js";

export const MCP_SERVER_NAME = "tu-vi-nam-phai";
export const MCP_SERVER_VERSION = "0.1.0";

export const MCP_INSTRUCTIONS = [
  "Server này cung cấp tool tính toán và tra cứu Tử Vi Nam Phái trên kho tài liệu của người dùng (MLTC, TVTH, NP1, NP2 và kho tri thức 426 file).",
  "Khi người dùng hỏi về tử vi, làm theo hướng dẫn sau; tên tool trong hướng dẫn là tool của server này.",
  "",
  SYSTEM_PROMPT,
].join("\n");

const inputSchemaOf = (spec: ToolSpec): Record<string, unknown> => {
  const { $schema: _ignored, ...schema } = z.toJSONSchema(spec.schema) as Record<string, unknown>;
  return schema;
};

export function createTuViMcpServer(tools: readonly ToolSpec[], ctx: ToolContext): Server {
  const toolMap = new Map(tools.map((tool) => [tool.name, tool]));
  const server = new Server(
    { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    { capabilities: { tools: {}, prompts: {} }, instructions: MCP_INSTRUCTIONS },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({ name: tool.name, description: tool.description, inputSchema: inputSchemaOf(tool) })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const outcome = await runTool(toolMap, request.params.name, request.params.arguments ?? {}, ctx);
    return { content: [{ type: "text", text: outcome.content }], isError: outcome.isError };
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [{ name: READING_PROMPT_NAME, description: READING_PROMPT_DESCRIPTION, arguments: [...READING_PROMPT_ARGUMENTS] }],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    if (request.params.name !== READING_PROMPT_NAME) throw new Error(`Không có prompt "${request.params.name}"`);
    const text = readingPromptText(request.params.arguments ?? {});
    if (!text.ok) throw new Error(text.error);
    return {
      description: READING_PROMPT_DESCRIPTION,
      messages: [{ role: "user", content: { type: "text", text: text.value } }],
    };
  });

  return server;
}
