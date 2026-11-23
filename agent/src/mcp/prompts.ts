import { buildReadingPrompt, parseReadingCommand, READING_COMMAND } from "../agent/reading-request.js";
import { READING_GUIDE } from "../agent/system-prompt.js";
import { err, ok, type Result } from "../core/result.js";

export const READING_PROMPT_NAME = "xem-la-so";

export interface PromptArgumentSpec {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
}

export const READING_PROMPT_ARGUMENTS: readonly PromptArgumentSpec[] = [
  { name: "ngay_sinh", description: "Ngày sinh dạng ngày/tháng/năm, ví dụ 15/8/1990", required: true },
  { name: "gio_sinh", description: "Giờ sinh: giờ đồng hồ (9:10) hoặc canh giờ (Tỵ)", required: true },
  { name: "gioi_tinh", description: "nam hoặc nữ", required: true },
  { name: "lich", description: "'âm' nếu ngày sinh là âm lịch, 'âm nhuận' nếu tháng nhuận; bỏ trống là dương lịch", required: false },
  { name: "ten", description: "Tên người xem (không bắt buộc)", required: false },
];

export const READING_PROMPT_DESCRIPTION =
  "Xem trọn lá số Tử Vi Nam Phái: chính tinh, phụ tinh, vòng sao, tam phương tứ chính, cách cục, 12 cung, từng đại vận và lời khuyên, có lập luận và nguồn.";

const READING_TOOL_NOTE =
  "Các tool nhắc tới dưới đây là tool của MCP server tu-vi-nam-phai (trong Claude Code có tiền tố mcp__…).";

export function readingCommandText(args: Readonly<Record<string, string | undefined>>): string {
  const parts = [READING_COMMAND, args.lich ?? "", args.ngay_sinh ?? "", args.gio_sinh ?? "", args.gioi_tinh ?? "", args.ten ?? ""];
  return parts.map((part) => part.trim()).filter(Boolean).join(" ");
}

export function readingPromptText(args: Readonly<Record<string, string | undefined>>): Result<string> {
  const missing = READING_PROMPT_ARGUMENTS.filter((spec) => spec.required && !args[spec.name]?.trim()).map((spec) => spec.name);
  if (missing.length) return err(`Thiếu tham số: ${missing.join(", ")}`);
  const request = parseReadingCommand(readingCommandText(args));
  if (!request.ok) return request;
  return ok([buildReadingPrompt(request.value), "", READING_TOOL_NOTE, "", READING_GUIDE].join("\n"));
}

export function readingPromptFromFreeText(text: string): Result<string> {
  const request = parseReadingCommand(`${READING_COMMAND} ${text}`);
  if (!request.ok) return request;
  return ok([buildReadingPrompt(request.value), "", READING_TOOL_NOTE, "", READING_GUIDE].join("\n"));
}
