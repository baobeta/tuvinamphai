import { parseBranch } from "../core/calendar/stem-branch.js";
import { err, ok, type Result } from "../core/result.js";

export type ReadingCalendar = "dương lịch" | "âm lịch";

export interface ReadingRequest {
  readonly calendar: ReadingCalendar;
  readonly day: number;
  readonly month: number;
  readonly year: number;
  readonly isLeapMonth: boolean;
  readonly time: string;
  readonly gender: "nam" | "nữ";
  readonly name: string;
}

export const READING_COMMAND = "/xem";

export const READING_USAGE = [
  "Cách dùng: /xem <ngày/tháng/năm> <giờ> <nam|nữ> [tên]",
  "  /xem 15/8/1990 9:10 nam",
  "  /xem âm 25/6/1990 Tỵ nữ Lan",
  "  /xem âm nhuận 10/2/2023 Thìn nam",
].join("\n");

const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const CLOCK_PATTERN = /^(\d{1,2})(?::|h)(\d{2})?$/;
const GENDERS: Readonly<Record<string, "nam" | "nữ">> = { nam: "nam", "nữ": "nữ", nu: "nữ" };
const LUNAR_FLAGS = new Set(["âm", "am", "âm-lịch"]);
const LEAP_FLAGS = new Set(["nhuận", "nhuan"]);

const normalizeToken = (token: string): string => token.normalize("NFC").toLowerCase();

const isTimeToken = (token: string): boolean => CLOCK_PATTERN.test(token) || parseBranch(token).ok;

export function parseReadingCommand(text: string): Result<ReadingRequest> {
  const tokens = text.trim().normalize("NFC").split(/\s+/).slice(1);
  const lowered = tokens.map(normalizeToken);
  const dateIndex = tokens.findIndex((token) => DATE_PATTERN.test(token));
  const genderIndex = lowered.findIndex((token) => GENDERS[token] !== undefined);
  const timeIndex = tokens.findIndex((token, index) => index !== dateIndex && isTimeToken(token));
  if (dateIndex < 0) return err(`Thiếu ngày sinh dạng ngày/tháng/năm.\n${READING_USAGE}`);
  if (timeIndex < 0) return err(`Thiếu giờ sinh (ví dụ 9:10 hoặc tên canh giờ như Tỵ).\n${READING_USAGE}`);
  if (genderIndex < 0) return err(`Thiếu giới tính (nam hoặc nữ).\n${READING_USAGE}`);
  const [, day, month, year] = DATE_PATTERN.exec(tokens[dateIndex]!)!;
  const isLunar = lowered.some((token) => LUNAR_FLAGS.has(token));
  const isLeapMonth = lowered.some((token) => LEAP_FLAGS.has(token));
  if (isLeapMonth && !isLunar) return err("Tháng nhuận chỉ dùng với ngày âm lịch (thêm chữ 'âm').");
  const used = new Set([dateIndex, timeIndex, genderIndex]);
  const name = tokens
    .filter((_token, index) => !used.has(index) && !LUNAR_FLAGS.has(lowered[index]!) && !LEAP_FLAGS.has(lowered[index]!))
    .join(" ");
  return ok({
    calendar: isLunar ? "âm lịch" : "dương lịch",
    day: Number(day),
    month: Number(month),
    year: Number(year),
    isLeapMonth,
    time: tokens[timeIndex]!,
    gender: GENDERS[lowered[genderIndex]!]!,
    name,
  });
}

export function buildReadingPrompt(request: ReadingRequest): string {
  const date = `${request.day}/${request.month}${request.isLeapMonth ? " (tháng nhuận)" : ""}/${request.year} ${request.calendar}`;
  const person = request.name ? `Tên: ${request.name}. ` : "";
  return [
    `Hãy xem trọn lá số Tử Vi Nam Phái cho tôi. ${person}Tôi sinh ngày ${date}, giờ ${request.time}, giới tính ${request.gender}.`,
    "Phân tích chi tiết mọi phần của lá số: chính tinh, phụ tinh, Tứ Hóa, Tuần Triệt, vòng Thái Tuế, Bác Sĩ, Tràng Sinh, cung xung chiếu và các cung phụ trợ, tam phương tứ chính, cách cục, mười hai cung và từng đại vận mười năm.",
    "Mỗi luận giải phải có lập luận chặt chẽ: dữ kiện trên lá số, quy tắc của sách kèm nguồn, rồi mới đến kết luận, viết dễ hiểu cho người không chuyên.",
    "Cuối cùng, từ lá số hãy đưa ra lời khuyên hợp lý về sự nghiệp, công việc, gia đình, tình cảm và sức khỏe: việc nên làm và việc nên tránh, mỗi lời khuyên gắn với dữ kiện cụ thể trên lá số.",
  ].join("\n");
}
