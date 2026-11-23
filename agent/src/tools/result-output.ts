import type { Result } from "../core/result.js";

export class ToolInputError extends Error {}

export function unwrapOrThrow<T>(result: Result<T>): T {
  if (!result.ok) throw new ToolInputError(result.error);
  return result.value;
}
