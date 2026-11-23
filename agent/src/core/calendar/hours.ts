import { err, ok, type Result } from "../result.js";
import { mod } from "./stem-branch.js";

export const MINUTES_PER_DAY = 24 * 60;
export const NEAR_BOUNDARY_MINUTES = 15;
export const MAX_CORRECTION_MINUTES = 180;

export interface ClockTime {
  readonly hour: number;
  readonly minute: number;
}

export interface DoubleHour {
  readonly branch: number;
  readonly start: string;
  readonly end: string;
  readonly minutesToNearestBoundary: number;
  readonly nearBoundary: boolean;
}

export interface CorrectedTime {
  readonly time: ClockTime;
  readonly dayShift: -1 | 0 | 1;
}

const formatClock = (totalMinutes: number): string => {
  const minutes = mod(totalMinutes, MINUTES_PER_DAY);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

export function validateClockTime(time: ClockTime): Result<ClockTime> {
  if (!Number.isInteger(time.hour) || time.hour < 0 || time.hour > 23) return err(`Giờ phải là số nguyên 0–23; nhận được ${time.hour}`);
  if (!Number.isInteger(time.minute) || time.minute < 0 || time.minute > 59) {
    return err(`Phút phải là số nguyên 0–59; nhận được ${time.minute}`);
  }
  return ok(time);
}

export const branchOfMinuteOfDay = (minuteOfDay: number): number => Math.floor(mod(minuteOfDay + 60, MINUTES_PER_DAY) / 120) % 12;

export function doubleHourOf(time: ClockTime): Result<DoubleHour> {
  const valid = validateClockTime(time);
  if (!valid.ok) return valid;
  const minuteOfDay = time.hour * 60 + time.minute;
  const branch = branchOfMinuteOfDay(minuteOfDay);
  const startMinute = branch * 120 - 60;
  const elapsed = mod(minuteOfDay - startMinute, MINUTES_PER_DAY);
  const minutesToNearestBoundary = Math.min(elapsed, 120 - elapsed);
  return ok({
    branch,
    start: formatClock(startMinute),
    end: formatClock(startMinute + 120),
    minutesToNearestBoundary,
    nearBoundary: minutesToNearestBoundary < NEAR_BOUNDARY_MINUTES,
  });
}

export function subtractMinutes(time: ClockTime, minutes: number): Result<CorrectedTime> {
  const valid = validateClockTime(time);
  if (!valid.ok) return valid;
  if (!Number.isInteger(minutes) || Math.abs(minutes) > MAX_CORRECTION_MINUTES) {
    return err(`Số phút hiệu chỉnh phải là số nguyên trong khoảng ±${MAX_CORRECTION_MINUTES}; nhận được ${minutes}`);
  }
  const total = time.hour * 60 + time.minute - minutes;
  const dayShift = total < 0 ? -1 : total >= MINUTES_PER_DAY ? 1 : 0;
  const minuteOfDay = mod(total, MINUTES_PER_DAY);
  return ok({ time: { hour: Math.floor(minuteOfDay / 60), minute: minuteOfDay % 60 }, dayShift });
}
