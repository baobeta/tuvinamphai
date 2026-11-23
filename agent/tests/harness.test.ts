import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import type { Config } from "../src/config.js";
import { loadKb } from "../src/kb/index.js";
import { ALL_TOOLS } from "../src/tools/kb-tools.js";
import { TuViAgent, type Message, type MessageStreamLike, type StreamParams } from "../src/agent/harness.js";

const FIX = path.join(import.meta.dirname, "fixtures");
const config: Config = {
  corpusRoot: path.join(FIX, "corpus"),
  kbRoot: path.join(FIX, "kb"),
  model: "claude-opus-5-5",
  effort: "high",
  maxIterations: 5,
  maxTokens: 64_000,
};

type Block = Anthropic.Beta.BetaContentBlock;
const usage = { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 3, cache_creation_input_tokens: 1 };
const msg = (stop_reason: string, content: unknown[]): Message =>
  ({ id: "m", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason, content, usage }) as unknown as Message;
const text = (t: string) => ({ type: "text", text: t, citations: null }) as unknown as Block;
const toolUse = (id: string, name: string, input: unknown) => ({ type: "tool_use", id, name, input }) as unknown as Block;

function fakeStreamer(script: Array<Message | Error>) {
  const requests: StreamParams[] = [];
  const streamer = (params: StreamParams): MessageStreamLike => {
    requests.push({ ...params, messages: [...params.messages] });
    const next = script.shift();
    if (!next) throw new Error("hết kịch bản");
    return {
      on: (_e, cb) => {
        if (!(next instanceof Error)) for (const b of next.content) if (b.type === "text") cb(b.text);
      },
      finalMessage: async () => {
        if (next instanceof Error) throw next;
        return next;
      },
    };
  };
  return { streamer, requests };
}

async function makeAgent(script: Array<Message | Error>, cfg = config) {
  const kb = await loadKb(cfg.kbRoot);
  const { streamer, requests } = fakeStreamer(script);
  const events: string[] = [];
  const agent = new TuViAgent(streamer, cfg, ALL_TOOLS, { kb, corpusRoot: cfg.corpusRoot }, {
    onToolCall: (n) => events.push(`call:${n}`),
    onToolResult: (n, o) => events.push(`result:${n}:${o.isError ? "err" : "ok"}`),
  });
  return { agent, requests, events };
}

describe("TuViAgent", () => {
  it("chạy tool rồi trả lời, gửi mọi tool_result trong MỘT message user", async () => {
    const { agent, requests, events } = await makeAgent([
      msg("tool_use", [
        text("Để tôi tra."),
        toolUse("t1", "search_kb", { query: "Cự Môn Thìn" }),
        toolUse("t2", "list_kb", {}),
      ]),
      msg("end_turn", [text("Cự Môn hãm ở Thìn, tuổi Tân lại tốt (TVTH tr.45).")]),
    ]);
    const r = await agent.ask("Cự Môn ở Thìn tuổi Tân?");

    expect(r.status).toBe("done");
    expect(r.text).toContain("TVTH tr.45");
    expect(r.iterations).toBe(2);
    expect(r.toolCalls).toBe(2);
    expect(events).toEqual(expect.arrayContaining(["call:search_kb", "call:list_kb", "result:search_kb:ok"]));

    const second = requests[1]!.messages;
    const last = second.at(-1)!;
    expect(last.role).toBe("user");
    const results = last.content as Anthropic.Beta.BetaToolResultBlockParam[];
    expect(results.map((b) => b.tool_use_id)).toEqual(["t1", "t2"]);
    expect(String(results[0]!.content)).toContain("10_Cu-Mon");
  });

  it("gửi cấu hình đúng: system có cache, effort, fallback, tool có schema", async () => {
    const { agent, requests } = await makeAgent([msg("end_turn", [text("ok")])]);
    await agent.ask("chào");
    const p = requests[0]!;
    expect(p.model).toBe("claude-opus-5-5");
    expect(p.output_config).toEqual({ effort: "high" });
    expect(p.fallbacks).toBe("default");
    expect(p.betas).toContain("server-side-fallback-2026-07-01");
    expect(Array.isArray(p.system) && p.system[0]?.cache_control).toEqual({ type: "ephemeral" });
    expect(p).not.toHaveProperty("thinking");
    expect(p.tools?.map((t: Anthropic.Beta.BetaToolUnion) => ("name" in t ? t.name : ""))).toEqual(ALL_TOOLS.map((t) => t.name));
  });

  it("input tool sai → tool_result is_error, vòng lặp vẫn tiếp tục", async () => {
    const { agent, requests } = await makeAgent([
      msg("tool_use", [toolUse("t1", "read_kb_file", { path: "../outside.txt" })]),
      msg("end_turn", [text("Không đọc được.")]),
    ]);
    const r = await agent.ask("đọc file ngoài");
    expect(r.status).toBe("done");
    const res = (requests[1]!.messages.at(-1)!.content as Anthropic.Beta.BetaToolResultBlockParam[])[0]!;
    expect(res.is_error).toBe(true);
  });

  it("refusal: dừng, không chạy tool, không đưa lượt bị từ chối vào lịch sử", async () => {
    const { agent, events } = await makeAgent([msg("refusal", [toolUse("t1", "search_kb", { query: "x" })])]);
    const r = await agent.ask("…");
    expect(r.status).toBe("refused");
    expect(events).toEqual([]);
    expect(agent.messages.map((m) => m.role)).toEqual(["user"]);
  });

  it("max_tokens khi đang gọi tool: không chạy tool cụt", async () => {
    const { agent, events } = await makeAgent([msg("max_tokens", [toolUse("t1", "search_kb", { query: "Cự" })])]);
    expect((await agent.ask("…")).status).toBe("max_tokens");
    expect(events).toEqual([]);
  });

  it("pause_turn: gửi lại để server tiếp tục", async () => {
    const { agent, requests } = await makeAgent([msg("pause_turn", [text("…")]), msg("end_turn", [text("xong")])]);
    const r = await agent.ask("…");
    expect(r.status).toBe("done");
    expect(requests).toHaveLength(2);
    expect(requests[1]!.messages.at(-1)!.role).toBe("assistant");
  });

  it("dừng ở maxIterations nếu model gọi tool mãi", async () => {
    const loop = Array.from({ length: 3 }, (_, i) => msg("tool_use", [toolUse(`t${i}`, "list_kb", {})]));
    const { agent } = await makeAgent(loop, { ...config, maxIterations: 3 });
    expect((await agent.ask("…")).status).toBe("max_iterations");
  });

  it("mất kết nối giữa stream → thử lại lượt đó; lỗi API → ném ra", async () => {
    const retry = await makeAgent([new Error("socket hang up"), msg("end_turn", [text("ok")])]);
    expect((await retry.agent.ask("…")).status).toBe("done");

    const apiErr = new Anthropic.BadRequestError(400, { type: "error" }, "bad", new Headers());
    const fail = await makeAgent([apiErr]);
    await expect(fail.agent.ask("…")).rejects.toBeInstanceOf(Anthropic.BadRequestError);
  });

  it("giữ lịch sử nhiều lượt và cộng dồn usage; reset xóa lịch sử", async () => {
    const { agent, requests } = await makeAgent([msg("end_turn", [text("một")]), msg("end_turn", [text("hai")])]);
    await agent.ask("câu 1");
    const r2 = await agent.ask("câu 2");
    expect(requests[1]!.messages.map((m: Anthropic.Beta.BetaMessageParam) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(r2.usage).toEqual({ input: 10, output: 5, cacheRead: 3, cacheWrite: 1 });
    expect(agent.usage.input).toBe(20);
    agent.reset();
    expect(agent.messages).toHaveLength(0);
  });
});
