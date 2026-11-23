import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { loadKb } from "../src/kb/index.js";
import { MCP_INSTRUCTIONS, createTuViMcpServer } from "../src/mcp/server.js";
import { readingPromptFromFreeText, readingPromptText } from "../src/mcp/prompts.js";
import { createChartStore } from "../src/tools/chart-store.js";
import { ALL_TOOLS } from "../src/tools/index.js";

const FIX = path.join(import.meta.dirname, "fixtures");

const connect = async () => {
  const server = createTuViMcpServer(ALL_TOOLS, {
    kb: await loadKb(path.join(FIX, "kb")),
    corpusRoot: path.join(FIX, "corpus"),
    charts: createChartStore(),
  });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0" });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return client;
};

const textOf = (result: unknown): string =>
  ((result as { content?: Array<{ text?: string }> }).content ?? []).map((part) => part.text ?? "").join("");

describe("MCP server", () => {
  it("liệt kê đủ mọi tool với JSON Schema đóng và gửi hướng dẫn dùng", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(ALL_TOOLS.map((tool) => tool.name).sort());
    for (const tool of tools) {
      expect(tool.inputSchema.type).toBe("object");
      expect((tool.inputSchema as Record<string, unknown>).additionalProperties).toBe(false);
      expect(tool.inputSchema).not.toHaveProperty("$schema");
    }
    expect(client.getInstructions()).toBe(MCP_INSTRUCTIONS);
    expect(MCP_INSTRUCTIONS).toContain("Xem trọn một lá số");
  });

  it("gọi tool nối tiếp bằng chart_id trong cùng một kết nối", async () => {
    const client = await connect();
    const built = await client.callTool({
      name: "build_chart",
      arguments: { birth: { calendar: "lunar", year: 1974, month: 3, day: 7, hour_branch: "Dần", gender: "nữ" } },
    });
    const id = /chart_id: (ls_[0-9a-f]+)/.exec(textOf(built))![1]!;
    const forecast = await client.callTool({ name: "year_forecast", arguments: { chart_id: id, view_year: 2000 } });
    expect(forecast.isError).toBe(false);
    expect(textOf(forecast)).toContain("27 tuổi âm");
  });

  it("input sai trả isError với thông báo của zod, tool lạ cũng vậy", async () => {
    const client = await connect();
    const bad = await client.callTool({ name: "convert_hour", arguments: { hour: 30 } });
    expect(bad.isError).toBe(true);
    expect(textOf(bad)).toContain("INVALID_INPUT");
    const unknown = await client.callTool({ name: "khong_co", arguments: {} });
    expect(unknown.isError).toBe(true);
  });

  it("prompt xem-la-so dựng yêu cầu xem trọn lá số kèm hướng dẫn 10 phần", async () => {
    const client = await connect();
    const { prompts } = await client.listPrompts();
    expect(prompts.map((prompt) => prompt.name)).toEqual(["xem-la-so"]);
    const result = await client.getPrompt({
      name: "xem-la-so",
      arguments: { ngay_sinh: "25/6/1990", gio_sinh: "Tỵ", gioi_tinh: "nữ", lich: "âm", ten: "Lan" },
    });
    const text = (result.messages[0]!.content as { text: string }).text;
    expect(text).toContain("25/6/1990 âm lịch");
    expect(text).toContain("Tên: Lan");
    expect(text).toContain("**Đại vận mười năm**");
    await expect(client.getPrompt({ name: "xem-la-so", arguments: { ngay_sinh: "25/6/1990" } })).rejects.toThrow(/Thiếu tham số/);
  });
});

describe("dựng prompt xem lá số", () => {
  it("từ tham số và từ chuỗi tự do cho cùng kết quả", () => {
    const fromArgs = readingPromptText({ ngay_sinh: "15/8/1990", gio_sinh: "9:10", gioi_tinh: "nam" });
    const fromText = readingPromptFromFreeText("15/8/1990 9:10 nam");
    expect(fromArgs.ok && fromText.ok && fromArgs.value === fromText.value).toBe(true);
  });
});
