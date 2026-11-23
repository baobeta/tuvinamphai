import { err, flatMapResult, ok, type Result } from "../result.js";

export const VIETNAM_TIMEZONE = 7;
export const MIN_YEAR = 1800;
export const MAX_YEAR = 2199;

const SYNODIC_MONTH = 29.530588853;
const NEW_MOON_EPOCH = 2415021.076998695;
const RAD = Math.PI / 180;

export interface SolarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface LunarDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly isLeapMonth: boolean;
}

export function julianDayFromSolar({ day, month, year }: SolarDate): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  const gregorian =
    day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (gregorian >= 2299161) return gregorian;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
}

export function solarFromJulianDay(julianDay: number): SolarDate {
  const gregorian = julianDay > 2299160;
  const a = julianDay + 32044;
  const b = gregorian ? Math.floor((4 * a + 3) / 146097) : 0;
  const c = gregorian ? a - Math.floor((b * 146097) / 4) : julianDay + 32082;
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: b * 100 + d - 4800 + Math.floor(m / 10),
  };
}

function newMoonJulian(k: number): number {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const meanNewMoon =
    2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3 + 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * RAD);
  const sunAnomaly = (359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3) * RAD;
  const moonAnomaly = (306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3) * RAD;
  const latitudeArgument = (21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3) * RAD;
  const correction =
    (0.1734 - 0.000393 * t) * Math.sin(sunAnomaly) +
    0.0021 * Math.sin(2 * sunAnomaly) -
    0.4068 * Math.sin(moonAnomaly) +
    0.0161 * Math.sin(2 * moonAnomaly) -
    0.0004 * Math.sin(3 * moonAnomaly) +
    0.0104 * Math.sin(2 * latitudeArgument) -
    0.0051 * Math.sin(sunAnomaly + moonAnomaly) -
    0.0074 * Math.sin(sunAnomaly - moonAnomaly) +
    0.0004 * Math.sin(2 * latitudeArgument + sunAnomaly) -
    0.0004 * Math.sin(2 * latitudeArgument - sunAnomaly) -
    0.0006 * Math.sin(2 * latitudeArgument + moonAnomaly) +
    0.001 * Math.sin(2 * latitudeArgument - moonAnomaly) +
    0.0005 * Math.sin(2 * moonAnomaly + sunAnomaly);
  const deltaT =
    t < -11
      ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
      : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return meanNewMoon + correction - deltaT;
}

const newMoonDay = (k: number, timezone: number): number => Math.floor(newMoonJulian(k) + 0.5 + timezone / 24);

function sunLongitudeRadians(julianDayUtc: number): number {
  const t = (julianDayUtc - 2451545.0) / 36525;
  const t2 = t * t;
  const meanAnomaly = (357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2) * RAD;
  const meanLongitude = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  const center =
    (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(meanAnomaly) +
    (0.019993 - 0.000101 * t) * Math.sin(2 * meanAnomaly) +
    0.00029 * Math.sin(3 * meanAnomaly);
  const longitude = (meanLongitude + center) * RAD;
  return longitude - Math.PI * 2 * Math.floor(longitude / (Math.PI * 2));
}

const sunSector = (dayNumber: number, timezone: number): number =>
  Math.floor((sunLongitudeRadians(dayNumber - 0.5 - timezone / 24) / Math.PI) * 6);

function eleventhMonthStart(year: number, timezone: number): number {
  const offset = julianDayFromSolar({ day: 31, month: 12, year }) - 2415021;
  const k = Math.floor(offset / SYNODIC_MONTH);
  const candidate = newMoonDay(k, timezone);
  return sunSector(candidate, timezone) >= 9 ? newMoonDay(k - 1, timezone) : candidate;
}

function leapMonthOffset(eleventhMonth: number, timezone: number): number {
  const k = Math.floor((eleventhMonth - NEW_MOON_EPOCH) / SYNODIC_MONTH + 0.5);
  const sectorAt = (i: number): number => sunSector(newMoonDay(k + i, timezone), timezone);
  let i = 2;
  while (sectorAt(i) !== sectorAt(i - 1) && i < 14) i += 1;
  return i - 1;
}

const validateYear = (year: number): Result<number> =>
  Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR
    ? ok(year)
    : err(`Chỉ hỗ trợ năm ${MIN_YEAR}–${MAX_YEAR}; nhận được ${year}`);

export function validateSolarDate(date: SolarDate): Result<SolarDate> {
  return flatMapResult(validateYear(date.year), () => {
    const roundTrip = solarFromJulianDay(julianDayFromSolar(date));
    const exists = roundTrip.day === date.day && roundTrip.month === date.month && roundTrip.year === date.year;
    return exists ? ok(date) : err(`Ngày dương lịch không tồn tại: ${date.day}/${date.month}/${date.year}`);
  });
}

function monthStartOnOrBefore(dayNumber: number, timezone: number): number {
  const approximateK = Math.floor((dayNumber - NEW_MOON_EPOCH) / SYNODIC_MONTH) + 1;
  const candidates = [approximateK, approximateK - 1, approximateK - 2].map((k) => newMoonDay(k, timezone));
  return candidates.find((start) => start <= dayNumber) ?? candidates[2]!;
}

function lunarFromValidSolar(date: SolarDate, timezone: number): LunarDate {
  const dayNumber = julianDayFromSolar(date);
  const monthStart = monthStartOnOrBefore(dayNumber, timezone);
  const eleventhThisYear = eleventhMonthStart(date.year, timezone);
  const beforeEleventh = eleventhThisYear >= monthStart;
  const startEleventh = beforeEleventh ? eleventhMonthStart(date.year - 1, timezone) : eleventhThisYear;
  const endEleventh = beforeEleventh ? eleventhThisYear : eleventhMonthStart(date.year + 1, timezone);
  const monthsSinceEleventh = Math.floor((monthStart - startEleventh) / 29);
  const hasLeapMonth = endEleventh - startEleventh > 365;
  const leapOffset = hasLeapMonth ? leapMonthOffset(startEleventh, timezone) : Number.POSITIVE_INFINITY;
  const afterLeap = monthsSinceEleventh >= leapOffset;
  const rawMonth = monthsSinceEleventh + (afterLeap ? 10 : 11);
  const month = rawMonth > 12 ? rawMonth - 12 : rawMonth;
  const baseYear = beforeEleventh ? date.year : date.year + 1;
  return {
    year: month >= 11 && monthsSinceEleventh < 4 ? baseYear - 1 : baseYear,
    month,
    day: dayNumber - monthStart + 1,
    isLeapMonth: monthsSinceEleventh === leapOffset,
  };
}

export const solarToLunar = (date: SolarDate, timezone: number = VIETNAM_TIMEZONE): Result<LunarDate> =>
  flatMapResult(validateSolarDate(date), (valid) => ok(lunarFromValidSolar(valid, timezone)));

function lunarMonthStartJulian(year: number, month: number, isLeapMonth: boolean, timezone: number): Result<number> {
  const [startEleventh, endEleventh] =
    month < 11
      ? [eleventhMonthStart(year - 1, timezone), eleventhMonthStart(year, timezone)]
      : [eleventhMonthStart(year, timezone), eleventhMonthStart(year + 1, timezone)];
  const k = Math.floor(0.5 + (startEleventh - NEW_MOON_EPOCH) / SYNODIC_MONTH);
  const baseOffset = month >= 11 ? month - 11 : month + 1;
  if (endEleventh - startEleventh <= 365) {
    return isLeapMonth ? err(`Năm âm ${year} không có tháng nhuận`) : ok(newMoonDay(k + baseOffset, timezone));
  }
  const leapOffset = leapMonthOffset(startEleventh, timezone);
  const leapMonth = leapOffset - 2 <= 0 ? leapOffset + 10 : leapOffset - 2;
  if (isLeapMonth && month !== leapMonth) {
    return err(`Năm âm ${year} không có tháng ${month} nhuận (tháng nhuận là ${leapMonth})`);
  }
  const offset = isLeapMonth || baseOffset >= leapOffset ? baseOffset + 1 : baseOffset;
  return ok(newMoonDay(k + offset, timezone));
}

const sameLunarDay = (a: LunarDate, b: LunarDate): boolean =>
  a.day === b.day && a.month === b.month && a.isLeapMonth === b.isLeapMonth;

export function lunarToSolar(date: LunarDate, timezone: number = VIETNAM_TIMEZONE): Result<SolarDate> {
  const year = validateYear(date.year);
  if (!year.ok) return year;
  if (!Number.isInteger(date.month) || date.month < 1 || date.month > 12) return err(`Tháng âm phải từ 1 đến 12; nhận được ${date.month}`);
  if (!Number.isInteger(date.day) || date.day < 1 || date.day > 30) return err(`Ngày âm phải từ 1 đến 30; nhận được ${date.day}`);
  return flatMapResult(lunarMonthStartJulian(date.year, date.month, date.isLeapMonth, timezone), (monthStart) => {
    const solar = solarFromJulianDay(monthStart + date.day - 1);
    return sameLunarDay(lunarFromValidSolar(solar, timezone), date)
      ? ok(solar)
      : err(`Tháng ${date.month}${date.isLeapMonth ? " nhuận" : ""} năm âm ${date.year} không có ngày ${date.day} (tháng thiếu chỉ có 29 ngày)`);
  });
}

export function leapMonthOfYear(lunarYear: number, timezone: number = VIETNAM_TIMEZONE): Result<number | null> {
  return flatMapResult(lunarToSolar({ year: lunarYear, month: 1, day: 1, isLeapMonth: false }, timezone), (newYear) => {
    const newYearJulian = julianDayFromSolar(newYear);
    const midMonths = Array.from({ length: 13 }, (_, i) =>
      lunarFromValidSolar(solarFromJulianDay(Math.floor(newYearJulian + 15 + i * SYNODIC_MONTH)), timezone),
    ).filter((lunar) => lunar.year === lunarYear);
    return ok(midMonths.find((lunar) => lunar.isLeapMonth)?.month ?? null);
  });
}

export function daysInLunarMonth(year: number, month: number, isLeapMonth: boolean, timezone: number = VIETNAM_TIMEZONE): Result<29 | 30> {
  return flatMapResult(lunarMonthStartJulian(year, month, isLeapMonth, timezone), (monthStart) =>
    ok(lunarFromValidSolar(solarFromJulianDay(monthStart + 29), timezone).day === 30 ? 30 : 29),
  );
}
