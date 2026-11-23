import { doubleHourOf, subtractMinutes, type ClockTime } from "../calendar/hours.js";
import { julianDayFromSolar, solarFromJulianDay, validateSolarDate, type LunarDate, type SolarDate } from "../calendar/lunar.js";
import { lunarToSolarVietnam, solarToLunarVietnam, timezoneNotes } from "../calendar/vietnam-calendar.js";
import { branchName } from "../calendar/stem-branch.js";
import { err, flatMapResult, ok, type Result } from "../result.js";
import type { ChartOptions, Gender, LeapMonthRule, LunarBirth } from "./types.js";

export interface SolarBirthInput {
  readonly calendar: "solar";
  readonly date: SolarDate;
  readonly time: ClockTime;
  readonly gender: Gender;
  readonly correctionMinutes?: number;
}

export interface LunarBirthInput {
  readonly calendar: "lunar";
  readonly date: LunarDate;
  readonly hourBranch: number;
  readonly gender: Gender;
}

export type BirthInput = SolarBirthInput | LunarBirthInput;

const pad = (n: number): string => String(n).padStart(2, "0");
const formatClock = (time: ClockTime): string => `${pad(time.hour)}:${pad(time.minute)}`;
const shiftSolarDate = (date: SolarDate, days: number): SolarDate => solarFromJulianDay(julianDayFromSolar(date) + days);

function resolveSolarBirth(input: SolarBirthInput, options: ChartOptions): Result<LunarBirth> {
  const validDate = validateSolarDate(input.date);
  if (!validDate.ok) return validDate;
  const corrected = subtractMinutes(input.time, input.correctionMinutes ?? 0);
  if (!corrected.ok) return corrected;
  const { time, dayShift } = corrected.value;
  const lateRatShift = options.lateRatHourNextDay && time.hour === 23 ? 1 : 0;
  const effectiveDate = shiftSolarDate(input.date, dayShift + lateRatShift);
  const notes = [
    ...(input.correctionMinutes ? [`Giờ đồng hồ ${formatClock(input.time)} đã trừ ${input.correctionMinutes} phút thành ${formatClock(time)}.`] : []),
    ...(dayShift !== 0 ? [`Sau hiệu chỉnh giờ, ngày sinh chuyển sang ${effectiveDate.day}/${effectiveDate.month}/${effectiveDate.year}.`] : []),
    ...(lateRatShift ? ["Sinh 23:00–24:00 và đang chọn tính sang ngày hôm sau (khác MLTC mục 7.1)."] : []),
  ];
  return flatMapResult(doubleHourOf(time), (doubleHour) =>
    flatMapResult(solarToLunarVietnam(effectiveDate, options.timezone), ({ lunar, timezone }) =>
      ok({
        lunar,
        hourBranch: doubleHour.branch,
        gender: input.gender,
        solar: input.date,
        clock: formatClock(input.time),
        notes: doubleHour.nearBoundary
          ? [
              ...notes,
              ...timezoneNotes(effectiveDate, timezone, options.timezone),
              `Giờ sinh cách ranh giới canh giờ ${doubleHour.minutesToNearestBoundary} phút (giờ ${branchName(doubleHour.branch)} ${doubleHour.start}–${doubleHour.end}): nên soát lại giờ sinh.`,
            ]
          : [...notes, ...timezoneNotes(effectiveDate, timezone, options.timezone)],
      }),
    ),
  );
}

function resolveLunarBirth(input: LunarBirthInput, options: ChartOptions): Result<LunarBirth> {
  if (!Number.isInteger(input.hourBranch) || input.hourBranch < 0 || input.hourBranch > 11) {
    return err(`Chi giờ không hợp lệ: ${input.hourBranch}`);
  }
  return flatMapResult(lunarToSolarVietnam(input.date, options.timezone), ({ solar, timezone }) =>
    ok({ lunar: input.date, hourBranch: input.hourBranch, gender: input.gender, solar, notes: timezoneNotes(solar, timezone, options.timezone) }),
  );
}

export const resolveBirth = (input: BirthInput, options: ChartOptions): Result<LunarBirth> =>
  input.calendar === "solar" ? resolveSolarBirth(input, options) : resolveLunarBirth(input, options);

export interface EffectiveMonth {
  readonly month: number;
  readonly note?: string;
}

export function effectiveMonth(lunar: LunarDate, rule: LeapMonthRule): EffectiveMonth {
  if (!lunar.isLeapMonth) return { month: lunar.month };
  const nextMonth = lunar.month === 12 ? 1 : lunar.month + 1;
  const useNext = rule === "next-month" || lunar.day > 15;
  const ruleText =
    rule === "next-month"
      ? "tính sang tháng kế tiếp (cách 1 của MLTC)"
      : "chia nửa tháng: trước hoặc đúng ngày 15 tính tháng trước, sau ngày 15 tính tháng sau (cách 2 của MLTC)";
  const month = useNext ? nextMonth : lunar.month;
  const yearNote = useNext && lunar.month === 12 ? " Năm sinh vẫn giữ can chi năm cũ; sách không nói rõ trường hợp nhuận tháng Chạp." : "";
  return { month, note: `Sinh tháng ${lunar.month} nhuận: ${ruleText}, nên an sao theo tháng ${month}.${yearNote}` };
}
