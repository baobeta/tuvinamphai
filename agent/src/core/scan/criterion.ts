import type { Certainty } from "../analysis/finding.js";
import type { YearContext } from "./context.js";
import type { CriterionInfo, Goal } from "./types.js";

export interface HitOutcome {
  readonly details: readonly string[];
  readonly certainty?: Certainty;
  readonly decade?: boolean;
}

export interface Criterion extends CriterionInfo {
  readonly test: (ctx: YearContext) => HitOutcome | null;
  readonly minAge?: number;
}

export interface TriggerDefinition extends Criterion {
  readonly goals: readonly Goal[];
}

export const criterionInfo = ({ id, name, polarity, certainty, assumptions, source, kbFile }: Criterion): CriterionInfo => ({
  id,
  name,
  polarity,
  certainty,
  assumptions,
  source,
  ...(kbFile ? { kbFile } : {}),
});

export const hitIf = (details: readonly string[], certainty?: Certainty): HitOutcome | null =>
  details.length ? { details, ...(certainty ? { certainty } : {}) } : null;

export const decadeHit = (details: readonly string[], certainty?: Certainty): HitOutcome | null =>
  details.length ? { details, decade: true, ...(certainty ? { certainty } : {}) } : null;

export function splitByScale(yearDetails: readonly string[], decadeDetails: readonly string[], certainty?: Certainty): HitOutcome | null {
  if (yearDetails.length) return hitIf([...yearDetails, ...decadeDetails], certainty);
  return decadeHit(decadeDetails, certainty);
}
