import { finding } from "../analysis/finding.js";
import { hasStarIn, mainStarsIn } from "../analysis/chart-query.js";
import type { Chart, Palace } from "../chart/types.js";
import {
  BAN_CACH_CAT,
  condition,
  contextOf,
  countInScope,
  describePalace,
  mainStarHasLuckyTransformation,
  SAT_PHA_CACH,
  scopePalaces,
  starsPresent,
  strongAssumption,
  strongLevels,
  TAM_HOA,
} from "./conditions.js";
import type { Condition, PatternContext, PatternDefinition, PatternEvaluation, PatternOptions, PatternRule, Scope, Variant } from "./types.js";

const GENERAL_BREAK_CITE = "00 §2 L3; MLTC tr.331–359 mục 4.4, tr.92–139 mục 4.5";
const TUAN_TRIET_CITE = "03/03: TVTH tr.73–74";

export const luckyGrade = (
  ctx: PatternContext,
  palace: Palace,
  names: readonly string[] = BAN_CACH_CAT,
  where?: string,
): Condition => ({
  ...countInScope(ctx, names, palace, "tam phương tứ chính", ctx.options.minLuckyCount, where),
  assumption: `'gia hội cát tinh' hiểu là có ít nhất ${ctx.options.minLuckyCount} sao trong danh sách ở tam phương tứ chính (GA-1, tùy chọn minLuckyCount)`,
});

const hoaKyCarrier = (palaces: readonly Palace[]): string | undefined =>
  palaces.flatMap((palace) => palace.stars).find((star) => star.transformation === "Hóa Kỵ")?.name;

export const maleficBreakers = (
  ctx: PatternContext,
  names: readonly string[],
  palace: Palace,
  scope: Scope,
  cite: string,
  assumption?: string,
): readonly Condition[] => {
  const palaces = scopePalaces(ctx, palace, scope);
  return starsPresent(ctx, names, palace, scope).map((name) => {
    const carrier = name === "Hóa Kỵ" ? hoaKyCarrier(palaces) : undefined;
    const displayName = carrier ? `Hóa Kỵ (${carrier})` : name;
    const starBranch = palaces.find((item) => hasStarIn(item, name))?.branch;
    const khongKiepNote =
      (name === "Địa Không" || name === "Địa Kiếp") && starBranch !== undefined && [5, 11].includes(starBranch)
        ? "; TVTH: Không Kiếp ở Tỵ Hợi có thể hoạch phát, MLTC vẫn kể là sát"
        : "";
    return condition(`${displayName} trong ${scope} ${describePalace(palace)} [${cite}]${khongKiepNote}`, true, assumption);
  });
};

export const tuanTrietBreaker = (ctx: PatternContext, palace: Palace, cite: string = TUAN_TRIET_CITE): readonly Condition[] => {
  if (!ctx.options.tuanTrietBreaks) return [];
  const found = ["Tuần", "Triệt"].filter((name) => palace.stars.some((star) => star.name === name));
  if (!found.length) return [];
  const calmNote = [6, 7].includes(palace.branch) ? "; TVTH tr.161–162: Tuần Triệt ở Ngọ Mùi êm đềm, ảnh hưởng nhẹ" : "";
  return [
    condition(
      `${found.join(", ")} tại ${describePalace(palace)} [${cite}]${calmNote}`,
      true,
      "Tuần/Triệt xét trên lá số gốc, không xét tuổi (TVTH: ngoài 32 tuổi ảnh hưởng Tuần Triệt rất yếu, GA-5)",
    ),
  ];
};

export const weakestPalaceBreaker = (ctx: PatternContext, palace: Palace): readonly Condition[] => {
  const weakMain = mainStarsIn(palace).some((star) => star.brightness === "Hãm");
  const malefic = starsPresent(ctx, SAT_PHA_CACH.slice(0, 6), palace, "đồng cung").length > 0;
  const kyOpposite = starsPresent(ctx, ["Hóa Kỵ"], palace, "xung chiếu").length > 0;
  return weakMain && malefic && kyOpposite
    ? [condition(`${describePalace(palace)} là cung suy yếu nhất: chính tinh hãm, có sát tinh, Hóa Kỵ xung chiếu [MLTC tr.862–864]`, true)]
    : [];
};

export const defaultGoodBreakers = (ctx: PatternContext, palace: Palace): readonly Condition[] => [
  ...maleficBreakers(
    ctx,
    SAT_PHA_CACH,
    palace,
    "tam phương tứ chính",
    GENERAL_BREAK_CITE,
    "phá cách theo nguyên tắc chung: lục sát và Hóa Kỵ trong tam phương tứ chính (sách không nêu riêng cho cách này)",
  ),
  ...tuanTrietBreaker(ctx, palace),
  ...weakestPalaceBreaker(ctx, palace),
];

export const rescues = (ctx: PatternContext, palace: Palace): readonly Condition[] => {
  const tuViControls =
    hasStarIn(palace, "Tử Vi") && starsPresent(ctx, ["Hỏa Tinh", "Linh Tinh", "Kình Dương", "Đà La"], palace, "tam phương tứ chính").length > 0;
  const thienGiai = hasStarIn(palace, "Thiên Giải") && (hasStarIn(palace, "Đà La") || hasStarIn(palace, "Địa Kiếp"));
  const tamKy = starsPresent(ctx, TAM_HOA, palace, "tam phương tứ chính").length === TAM_HOA.length;
  const strongMain = mainStarsIn(palace).some((star) => star.brightness !== undefined && strongLevels(ctx.options).includes(star.brightness));
  const strongLucky =
    strongMain && mainStarHasLuckyTransformation(palace).met && starsPresent(ctx, BAN_CACH_CAT, palace, "tam phương tứ chính").length > 0;
  return [
    tuViControls ? condition("Tử Vi chế Hỏa Linh, Kình Đà (TVTH tr.24–25), nhưng không chế Không Kiếp", true) : null,
    thienGiai ? condition("Thiên Giải cứu Đà Kiếp (TVTH Cách cuộc luận câu 11)", true) : null,
    tamKy ? condition("Tam kỳ gia hội giải sát (MLTC Liêm Trinh 4.4, Cự Môn 4.7)", true) : null,
    strongLucky
      ? condition("chính tinh miếu vượng hóa cát, tam phương có cát tinh: không luận xấu (MLTC tr.605–619 mục 5.4)", true, strongAssumption(ctx.options))
      : null,
  ].filter((item): item is Condition => item !== null);
};

const assumptionsOf = (items: readonly Condition[]): readonly string[] =>
  items.map((item) => item.assumption).filter((text): text is string => Boolean(text));

const unique = (items: readonly string[]): readonly string[] => [...new Set(items)];

const isMatched = (variant: Variant): boolean => variant.required.every((item) => item.met);

const variantAssumptionCount = (variant: Variant): number =>
  (variant.assumptions?.length ?? 0) + assumptionsOf(variant.required).length + assumptionsOf(variant.grade ?? []).length;

const metCount = (variant: Variant): number => variant.required.filter((item) => item.met).length / Math.max(variant.required.length, 1);

const eligibleVariants = (variants: readonly Variant[], options: PatternOptions): readonly Variant[] => {
  if (options.book === "any") return variants;
  const preferred = variants.filter((variant) => variant.book === options.book);
  return preferred.length ? preferred : variants;
};

const pickVariant = (variants: readonly Variant[]): Variant | undefined => {
  const matched = variants.filter(isMatched);
  if (matched.length) return [...matched].sort((a, b) => variantAssumptionCount(a) - variantAssumptionCount(b))[0];
  return [...variants].sort((a, b) => metCount(b) - metCount(a))[0];
};

const describeVariant = (variant: Variant): string => {
  if (isMatched(variant)) return `${variant.label} [${variant.cite}]: khớp`;
  const lacking = variant.required.filter((item) => !item.met).map((item) => item.label);
  return `${variant.label} [${variant.cite}]: chưa khớp — thiếu ${lacking.join("; ")}`;
};

const shortLabel = (item: Condition): string => item.label.replace(/ \[.*$/, "");

function composeSummary(
  definition: PatternDefinition,
  variant: Variant,
  matched: boolean,
  breakers: readonly Condition[],
  gradeMissing: readonly Condition[],
  rescued: readonly Condition[],
): string {
  if (!matched) {
    const lacking = variant.required.filter((item) => !item.met).map((item) => item.label);
    return `Không thành cách ${definition.name}: theo ${variant.label} còn thiếu ${lacking.join("; ")}.`;
  }
  if (definition.polarity === "xấu") {
    const mitigation = breakers.length ? `; có yếu tố giải/giảm: ${breakers.map(shortLabel).join("; ")}` : "";
    return `Phạm cách xấu ${definition.name} theo ${variant.label}${mitigation}.`;
  }
  const rescueText = rescued.length ? `; có cứu giải: ${rescued.map(shortLabel).join("; ")}` : "";
  if (breakers.length) return `Có cách ${definition.name} theo ${variant.label} nhưng phá cách / giảm: ${breakers.map(shortLabel).join("; ")}${rescueText}.`;
  if (gradeMissing.length) return `Có cách ${definition.name} theo ${variant.label} nhưng giảm xuống cách bình thường / không hợp cách vì thiếu cát tinh hội: ${gradeMissing.map(shortLabel).join("; ")}.`;
  return `Thành cách ${definition.name} theo ${variant.label}.`;
}

const firedBreakersOf = (variant: Variant): readonly Condition[] => (variant.breakers ?? []).filter((item) => item.met);

const gradeMissingOf = (variant: Variant): readonly Condition[] => (variant.grade ?? []).filter((item) => !item.met);

const outcomeOf = (variant: Variant): string => {
  const broken = firedBreakersOf(variant);
  const lacking = gradeMissingOf(variant);
  const parts = [
    ...(broken.length ? [`phá cách / giảm (${broken.map(shortLabel).join("; ")})`] : []),
    ...(lacking.length ? ["không hợp cách vì thiếu cát tinh"] : []),
  ];
  return parts.length ? parts.join(", ") : "thành cách";
};

const describeMatchedVariant = (variant: Variant): string => `${variant.label} [${variant.cite}]: khớp — ${outcomeOf(variant)}`;

export function evaluateDefinition(definition: PatternDefinition, chart: Chart, options: PatternOptions): PatternEvaluation | null {
  const ctx = contextOf(chart, options);
  const all = definition.variants(ctx);
  const eligible = eligibleVariants(all, options);
  const variant = pickVariant(eligible);
  if (!variant) return null;
  const matched = isMatched(variant);
  const isGood = definition.polarity === "tốt";
  const otherMatched = matched ? eligible.filter((item) => item !== variant && isMatched(item)) : [];
  const ownBreakers = matched ? [...firedBreakersOf(variant), ...(definition.commonBreakers?.(ctx) ?? []).filter((item) => item.met)] : [];
  const ownLabels = new Set(ownBreakers.map((item) => item.label));
  const borrowedBreakers = otherMatched.flatMap((item) =>
    firedBreakersOf(item)
      .filter((breaker) => !ownLabels.has(breaker.label))
      .map((breaker) => ({ ...breaker, label: `theo ${item.label}: ${breaker.label}` })),
  );
  const firedBreakers = [...ownBreakers, ...borrowedBreakers].filter(
    (item, index, list) => list.findIndex((other) => other.label === item.label) === index,
  );
  const rescued = matched ? rescues(ctx, ctx.life) : [];
  const breakers = isGood ? firedBreakers : [...firedBreakers, ...rescued];
  const grade = variant.grade ?? [];
  const ownGradeMissing = matched ? gradeMissingOf(variant) : [];
  const borrowedGradeMissing = otherMatched.flatMap((item) =>
    gradeMissingOf(item).map((lack) => ({ ...lack, label: `không hợp cách theo ${item.label} vì thiếu cát tinh: ${lack.label}` })),
  );
  const gradeMissing = [...ownGradeMissing, ...borrowedGradeMissing];
  const disagreeing = otherMatched.filter((item) => outcomeOf(item) !== outcomeOf({ ...variant, breakers: ownBreakers }));
  const disagreement = disagreeing.length
    ? [`các sách khác nhau về kết luận: theo ${variant.label} ${outcomeOf({ ...variant, breakers: ownBreakers })}; ${disagreeing.map((item) => `theo ${item.label} ${outcomeOf(item)}`).join("; ")}`]
    : [];
  const strengtheners = [variant, ...otherMatched].flatMap((item) => (item.strengtheners ?? []).filter((boost) => boost.met));
  const assumptions = unique([
    ...(variant.assumptions ?? []),
    ...assumptionsOf(variant.required),
    ...(matched ? assumptionsOf(grade) : []),
    ...otherMatched.flatMap((item) => (gradeMissingOf(item).length || firedBreakersOf(item).length ? assumptionsOf(item.grade ?? []) : [])),
    ...assumptionsOf(breakers),
    ...(isGood && firedBreakers.length ? assumptionsOf(rescued) : []),
    ...disagreement,
    ...(definition.notes ?? []),
  ]);
  const others = all.filter((item) => item !== variant).map((item) => (matched && otherMatched.includes(item) ? describeMatchedVariant(item) : describeVariant(item)));
  return {
    matched,
    finding: finding({
      id: definition.id,
      name: definition.name,
      polarity: definition.polarity,
      certainty: assumptions.length ? "interpretive" : "exact",
      summary: composeSummary(definition, variant, matched, breakers, gradeMissing, isGood ? rescued : []),
      satisfied: [
        ...variant.required.filter((item) => item.met).map((item) => item.label),
        ...(matched ? grade.filter((item) => item.met).map((item) => `cát tinh hội: ${item.label}`) : []),
        ...unique(strengtheners.map((item) => `tăng cách: ${item.label}`)),
        ...(isGood && firedBreakers.length ? rescued.map((item) => `cứu giải: ${item.label}`) : []),
      ],
      missing: [
        ...variant.required.filter((item) => !item.met).map((item) => item.label),
        ...ownGradeMissing.map((item) => `giảm cách vì thiếu cát tinh: ${item.label}`),
        ...borrowedGradeMissing.map((item) => item.label),
      ],
      breakers: breakers.map((item) => item.label),
      assumptions,
      variants: others,
      source: variant.cite,
      kbFile: definition.kbFile,
    }),
  };
}

export const definePattern = (definition: PatternDefinition): PatternRule => ({
  id: definition.id,
  name: definition.name,
  polarity: definition.polarity,
  source: definition.source,
  kbFile: definition.kbFile,
  evaluate: (chart, options) => evaluateDefinition(definition, chart, options),
});

export const unsupportedPattern = (meta: Omit<PatternRule, "evaluate">): PatternRule => ({ ...meta, evaluate: () => null });
