import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { KbIndex } from "../kb/index.js";
import type { ChartStore } from "./chart-store.js";

export interface ToolContext {
  kb: KbIndex;
  corpusRoot: string;
  charts?: ChartStore;
}

export interface ToolSpec<S extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  schema: S;
  run(input: z.infer<S>, ctx: ToolContext): Promise<string>;
}

export const defineTool = <S extends z.ZodType>(spec: ToolSpec<S>): ToolSpec<S> => spec;

export function toApiTool(spec: ToolSpec): Anthropic.Beta.BetaTool {
  const { $schema: _ignored, ...schema } = z.toJSONSchema(spec.schema) as Record<string, unknown>;
  return {
    name: spec.name,
    description: spec.description,
    input_schema: schema as Anthropic.Beta.BetaTool.InputSchema,
    eager_input_streaming: true,
  };
}

export interface ToolOutcome {
  content: string;
  isError: boolean;
}

export async function runTool(
  specs: ReadonlyMap<string, ToolSpec>,
  name: string,
  rawInput: unknown,
  ctx: ToolContext,
): Promise<ToolOutcome> {
  const spec = specs.get(name);
  if (!spec) return { content: `Không có tool tên "${name}".`, isError: true };
  const parsed = spec.schema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      content: `INVALID_INPUT: ${z.prettifyError(parsed.error)}\nInput nhận được: ${JSON.stringify(rawInput)}`,
      isError: true,
    };
  }
  try {
    return { content: await spec.run(parsed.data, ctx), isError: false };
  } catch (err) {
    return { content: `Lỗi khi chạy ${name}: ${(err as Error).message}`, isError: true };
  }
}
