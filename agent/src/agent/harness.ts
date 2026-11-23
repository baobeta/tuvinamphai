import Anthropic from "@anthropic-ai/sdk";
import type { BetaMessageStreamParams } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { Config } from "../config.js";
import { runTool, toApiTool, type ToolContext, type ToolSpec } from "../tools/registry.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";

export type MessageParam = Anthropic.Beta.BetaMessageParam;
export type Message = Anthropic.Beta.BetaMessage;
export type StreamParams = BetaMessageStreamParams;

export interface MessageStreamLike {
  on(event: "text", listener: (delta: string) => void): unknown;
  finalMessage(): Promise<Message>;
}
export type Streamer = (params: StreamParams) => MessageStreamLike;

export const streamerFromClient =
  (client: Anthropic): Streamer =>
  (params) =>
    client.beta.messages.stream(params);

export interface HarnessHooks {
  onText?(delta: string): void;
  onToolCall?(name: string, input: unknown): void;
  onToolResult?(name: string, outcome: { content: string; isError: boolean }): void;
  onIteration?(index: number, message: Message): void;
}

export type TurnStatus = "done" | "refused" | "max_tokens" | "max_iterations";

export interface TurnResult {
  status: TurnStatus;
  text: string;
  iterations: number;
  toolCalls: number;
  usage: UsageTotals;
}

export interface UsageTotals {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export class TuViAgent {
  readonly messages: MessageParam[] = [];
  readonly usage: UsageTotals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  private readonly toolMap: ReadonlyMap<string, ToolSpec>;
  private readonly apiTools: Anthropic.Beta.BetaTool[];

  constructor(
    private readonly streamer: Streamer,
    private readonly config: Config,
    tools: ToolSpec[],
    private readonly ctx: ToolContext,
    private readonly hooks: HarnessHooks = {},
  ) {
    this.toolMap = new Map(tools.map((t) => [t.name, t]));
    this.apiTools = tools.map(toApiTool);
  }

  reset(): void {
    this.messages.length = 0;
  }

  private params(): StreamParams {
    return {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: this.apiTools,
      messages: this.messages,
      cache_control: { type: "ephemeral" },
      output_config: { effort: this.config.effort },
      betas: [FALLBACK_BETA],
      fallbacks: "default",
    };
  }

  async ask(question: string): Promise<TurnResult> {
    this.messages.push({ role: "user", content: question });
    const startUsage = { ...this.usage };
    let toolCalls = 0;
    let streamRetries = 0;
    let lastText = "";

    for (let i = 0; i < this.config.maxIterations; i++) {
      const stream = this.streamer(this.params());
      stream.on("text", (d) => this.hooks.onText?.(d));

      let message: Message;
      try {
        message = await stream.finalMessage();
        streamRetries = 0;
      } catch (err) {
        if (err instanceof Anthropic.APIError || streamRetries++ >= 2) throw err;
        i--;
        continue;
      }

      this.addUsage(message.usage);
      this.hooks.onIteration?.(i, message);
      lastText = textOf(message) || lastText;
      const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");

      switch (message.stop_reason) {
        case "refusal":
          return this.result("refused", lastText, i + 1, toolCalls, startUsage);
        case "pause_turn":
          this.messages.push({ role: "assistant", content: message.content });
          continue;
        case "max_tokens":
          this.messages.push({ role: "assistant", content: message.content });
          return this.result("max_tokens", lastText, i + 1, toolCalls, startUsage);
        case "tool_use":
          break;
        default:
          this.messages.push({ role: "assistant", content: message.content });
          return this.result("done", lastText, i + 1, toolCalls, startUsage);
      }

      this.messages.push({ role: "assistant", content: message.content });
      const results = await Promise.all(
        toolUses.map(async (tu): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
          this.hooks.onToolCall?.(tu.name, tu.input);
          const outcome = await runTool(this.toolMap, tu.name, tu.input, this.ctx);
          this.hooks.onToolResult?.(tu.name, outcome);
          return { type: "tool_result", tool_use_id: tu.id, content: outcome.content, is_error: outcome.isError };
        }),
      );
      toolCalls += results.length;
      this.messages.push({ role: "user", content: results });
    }
    return this.result("max_iterations", lastText, this.config.maxIterations, toolCalls, startUsage);
  }

  private addUsage(u: Anthropic.Beta.BetaUsage): void {
    this.usage.input += u.input_tokens;
    this.usage.output += u.output_tokens;
    this.usage.cacheRead += u.cache_read_input_tokens ?? 0;
    this.usage.cacheWrite += u.cache_creation_input_tokens ?? 0;
  }

  private result(status: TurnStatus, text: string, iterations: number, toolCalls: number, start: UsageTotals): TurnResult {
    return {
      status,
      text,
      iterations,
      toolCalls,
      usage: {
        input: this.usage.input - start.input,
        output: this.usage.output - start.output,
        cacheRead: this.usage.cacheRead - start.cacheRead,
        cacheWrite: this.usage.cacheWrite - start.cacheWrite,
      },
    };
  }
}

export const textOf = (m: Message): string =>
  m.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

