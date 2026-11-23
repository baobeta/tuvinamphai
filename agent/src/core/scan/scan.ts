import type { Chart } from "../chart/types.js";
import { periodLayers, type PeriodOptions } from "../periods/layers.js";
import { err, ok, type Result } from "../result.js";
import { indexChart, yearContext } from "./context.js";
import { compileCriterion } from "./criteria.js";
import { criterionInfo, type Criterion } from "./criterion.js";
import { GOAL_PRESETS } from "./presets.js";
import type { CriterionHit, DecadeNote, RankBy, RankedYear, ScanRequest, ScanResult, YearScan } from "./types.js";

export const MAX_SCAN_YEARS = 60;
export const DEFAULT_TOP = 5;

function validateRange(request: ScanRequest): Result<ScanRequest> {
  const { fromYear, toYear } = request;
  if (!Number.isInteger(fromYear) || !Number.isInteger(toYear)) return err(`Năm phải là số nguyên; nhận được ${fromYear}–${toYear}`);
  if (fromYear > toYear) return err(`fromYear (${fromYear}) phải nhỏ hơn hoặc bằng toYear (${toYear})`);
  if (toYear - fromYear + 1 > MAX_SCAN_YEARS) return err(`Mỗi lần quét tối đa ${MAX_SCAN_YEARS} năm; nhận được ${toYear - fromYear + 1} năm`);
  if (request.top !== undefined && (!Number.isInteger(request.top) || request.top < 1)) return err(`top phải là số nguyên dương; nhận được ${request.top}`);
  return ok(request);
}

function compileAll(request: ScanRequest): Result<readonly Criterion[]> {
  const specs = [...(request.goal ? GOAL_PRESETS[request.goal].criteria : []), ...request.criteria];
  if (!specs.length) return err("Cần goal hoặc ít nhất một tiêu chí (criteria).");
  const compiled: Criterion[] = [];
  const seen = new Set<string>();
  for (const spec of specs) {
    const criterion = compileCriterion(spec, { palaces: request.palaces });
    if (!criterion.ok) return criterion;
    if (seen.has(criterion.value.id)) continue;
    seen.add(criterion.value.id);
    compiled.push(criterion.value);
  }
  return ok(compiled);
}

interface YearTally extends RankedYear {
  readonly caution: number;
}

function tallyYears(years: readonly YearScan[], criteria: readonly Criterion[], rankBy: RankBy): readonly YearTally[] {
  const polarityOf = new Map(criteria.map((criterion) => [criterion.id, criterion.polarity]));
  return years.map((year) => {
    const yearHits = year.hits.filter((hit) => !hit.decade);
    const count = (polarity: string) => yearHits.filter((hit) => polarityOf.get(hit.criterionId) === polarity).length;
    const favourable = count("tốt");
    const unfavourable = count("xấu");
    const neutral = count("trung tính");
    const score = rankBy === "net" ? favourable - unfavourable : favourable;
    return { year: year.year, score, favourable, unfavourable, neutral, caution: unfavourable };
  });
}

const strip = ({ caution: _caution, ...ranked }: YearTally): RankedYear => ranked;

function rankYears(tallies: readonly YearTally[], top: number): readonly RankedYear[] {
  return tallies
    .filter((tally) => tally.score > 0 && tally.favourable > 0)
    .sort((a, b) => b.score - a.score || b.favourable - a.favourable || a.unfavourable - b.unfavourable || a.year - b.year)
    .slice(0, top)
    .map(strip);
}

function cautionYears(tallies: readonly YearTally[], top: number): readonly RankedYear[] {
  return tallies
    .filter((tally) => tally.caution > 0)
    .sort((a, b) => b.caution - a.caution || a.favourable - b.favourable || a.year - b.year)
    .slice(0, top)
    .map(strip);
}

function decadeNotes(years: readonly YearScan[], fromYear: number, toYear: number): readonly DecadeNote[] {
  const notes = new Map<string, DecadeNote>();
  for (const year of years) {
    if (year.majorPalace === null || year.majorFromAge === null) continue;
    const decadeStart = year.year - (year.age - year.majorFromAge);
    for (const hit of year.hits) {
      const key = `${year.majorFromAge}|${hit.criterionId}`;
      if (!hit.decade || notes.has(key)) continue;
      notes.set(key, {
        majorPalace: year.majorPalace,
        fromYear: Math.max(decadeStart, fromYear),
        toYear: Math.min(decadeStart + 9, toYear),
        criterionId: hit.criterionId,
        details: hit.details,
        certainty: hit.certainty,
      });
    }
  }
  return [...notes.values()];
}

export function scanYears(chart: Chart, request: ScanRequest, overrides: Partial<PeriodOptions> = {}): Result<ScanResult> {
  const valid = validateRange(request);
  if (!valid.ok) return valid;
  const criteria = compileAll(request);
  if (!criteria.ok) return criteria;
  const index = indexChart(chart);
  const years: YearScan[] = [];
  for (let year = request.fromYear; year <= request.toYear; year += 1) {
    const layers = periodLayers(chart, { year }, overrides);
    if (!layers.ok) return layers;
    const ctx = yearContext(index, layers.value);
    const hits: CriterionHit[] = [];
    for (const criterion of criteria.value) {
      if (criterion.minAge !== undefined && ctx.age < criterion.minAge) continue;
      const outcome = criterion.test(ctx);
      if (outcome) {
        hits.push({ criterionId: criterion.id, details: outcome.details, certainty: outcome.certainty ?? criterion.certainty, decade: outcome.decade ?? false });
      }
    }
    years.push({
      year,
      stemBranch: ctx.stemBranch,
      age: ctx.age,
      majorPalace: ctx.majorPalace,
      majorFromAge: layers.value.majorPeriod?.fromAge ?? null,
      minorPalace: ctx.minorPeriodPalace,
      childhoodPalace: ctx.childhoodPalace,
      yearlyPalace: ctx.yearlyPalace,
      hits,
    });
  }
  const rankBy: RankBy = request.goal ? GOAL_PRESETS[request.goal].rankBy : "count";
  const tallies = tallyYears(years, criteria.value, rankBy);
  const top = request.top ?? DEFAULT_TOP;
  return ok({
    fromYear: request.fromYear,
    toYear: request.toYear,
    goal: request.goal ?? null,
    rankBy,
    criteria: criteria.value.map(criterionInfo),
    years,
    ranking: rankYears(tallies, top),
    caution: cautionYears(tallies, top),
    decadeNotes: decadeNotes(years, request.fromYear, request.toYear),
  });
}
