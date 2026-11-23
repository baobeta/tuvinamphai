import { err, flatMapResult, ok, type Result } from "../result.js";
import { julianDayFromSolar, lunarToSolar, solarToLunar, validateSolarDate, type LunarDate, type SolarDate } from "./lunar.js";

export const TIMEZONE_SWITCH_DATE: SolarDate = { year: 1968, month: 1, day: 1 };
export const TIMEZONE_BEFORE_SWITCH = 8;
export const TIMEZONE_AFTER_SWITCH = 7;
export const SOUTH_UTC8_LAST_YEAR = 1975;

export type TimezoneSetting = number | "historical";

const isBeforeSwitch = (date: SolarDate): boolean => julianDayFromSolar(date) < julianDayFromSolar(TIMEZONE_SWITCH_DATE);

export const historicalTimezone = (date: SolarDate): number => (isBeforeSwitch(date) ? TIMEZONE_BEFORE_SWITCH : TIMEZONE_AFTER_SWITCH);

export interface ConvertedLunar {
  readonly lunar: LunarDate;
  readonly timezone: number;
}

export interface ConvertedSolar {
  readonly solar: SolarDate;
  readonly timezone: number;
}

export function solarToLunarVietnam(date: SolarDate, setting: TimezoneSetting = "historical"): Result<ConvertedLunar> {
  return flatMapResult(validateSolarDate(date), (valid) => {
    const timezone = setting === "historical" ? historicalTimezone(valid) : setting;
    return flatMapResult(solarToLunar(valid, timezone), (lunar) => ok({ lunar, timezone }));
  });
}

export function lunarToSolarVietnam(date: LunarDate, setting: TimezoneSetting = "historical"): Result<ConvertedSolar> {
  if (setting !== "historical") return flatMapResult(lunarToSolar(date, setting), (solar) => ok({ solar, timezone: setting }));
  const before = lunarToSolar(date, TIMEZONE_BEFORE_SWITCH);
  if (before.ok && isBeforeSwitch(before.value)) return ok({ solar: before.value, timezone: TIMEZONE_BEFORE_SWITCH });
  const after = lunarToSolar(date, TIMEZONE_AFTER_SWITCH);
  if (after.ok && !isBeforeSwitch(after.value)) return ok({ solar: after.value, timezone: TIMEZONE_AFTER_SWITCH });
  if (!before.ok && !after.ok) return before;
  return err(`Ngày âm ${date.day}/${date.month}${date.isLeapMonth ? " nhuận" : ""}/${date.year} không tồn tại vào thời điểm đổi múi giờ lịch (1968)`);
}

export function timezoneNotes(solar: SolarDate, timezone: number, setting: TimezoneSetting): readonly string[] {
  if (setting !== "historical") return [`Lịch âm tính theo múi giờ UTC${timezone >= 0 ? "+" : ""}${timezone} do người dùng chọn.`];
  if (timezone === TIMEZONE_BEFORE_SWITCH) {
    return ["Sinh trước 1968: lịch âm tính theo UTC+8, là lịch Việt Nam dùng trước khi đổi sang UTC+7 năm 1968."];
  }
  if (solar.year <= SOUTH_UTC8_LAST_YEAR) {
    return ["Miền Nam dùng lịch âm UTC+8 đến 1975; nếu ngày âm do gia đình ở miền Nam ghi lại mà lệch, thử tính với timezone 8."];
  }
  return [];
}
