import type { Certainty, Polarity } from "../analysis/finding.js";
import { err, ok, type Result } from "../result.js";
import { palaceText, resolveTarget, SCOPE_LABEL, scopePalaces, targetLabel, type YearContext } from "./context.js";
import { decadeHit, hitIf, type Criterion, type HitOutcome } from "./criterion.js";
import { TRIGGER_BY_ID, TRIGGERS } from "./triggers.js";
import type { CriterionSpec, FlowingStarName, PalaceScope, PalaceTarget, PeriodLayerKind, TransformationStem } from "./types.js";

const LUU_KB = "10_Van-han/04_Luu-nien";

interface StarReference {
  readonly polarity: Polarity;
  readonly source: string;
  readonly kbFile: string;
}

const FLOWING_STAR_REFERENCE: Readonly<Record<FlowingStarName, StarReference>> = {
  "Thái Tuế": { polarity: "trung tính", source: "TVTH tr.136", kbFile: `${LUU_KB}/01_Luu-Thai-Tue-Tang-Ho.md` },
  "Tang Môn": { polarity: "xấu", source: "TVTH tr.136", kbFile: `${LUU_KB}/01_Luu-Thai-Tue-Tang-Ho.md` },
  "Bạch Hổ": { polarity: "xấu", source: "TVTH tr.136", kbFile: `${LUU_KB}/01_Luu-Thai-Tue-Tang-Ho.md` },
  "Lộc Tồn": { polarity: "tốt", source: "TVTH tr.136", kbFile: `${LUU_KB}/02_Luu-Loc-Kinh-Da.md` },
  "Kình Dương": { polarity: "xấu", source: "TVTH tr.136", kbFile: `${LUU_KB}/02_Luu-Loc-Kinh-Da.md` },
  "Đà La": { polarity: "xấu", source: "TVTH tr.136", kbFile: `${LUU_KB}/02_Luu-Loc-Kinh-Da.md` },
  "Thiên Mã": { polarity: "trung tính", source: "TVTH tr.135-136", kbFile: `${LUU_KB}/03_Luu-Thien-Ma.md` },
  "Thiên Khốc": { polarity: "xấu", source: "TVTH tr.136", kbFile: `${LUU_KB}/04_Luu-Khoc-Hu.md` },
  "Thiên Hư": { polarity: "xấu", source: "TVTH tr.136", kbFile: `${LUU_KB}/04_Luu-Khoc-Hu.md` },
  "Tuần": { polarity: "trung tính", source: "TVTH tr.135-136", kbFile: `${LUU_KB}/06_Tuan-Triet-luu.md` },
  "Triệt": { polarity: "trung tính", source: "TVTH tr.135-136", kbFile: `${LUU_KB}/06_Tuan-Triet-luu.md` },
};

const TRANSFORMATION_STEM_LABEL: Readonly<Record<TransformationStem, string>> = {
  "view-year": "can năm xem",
  "major-palace": "can cung đại hạn",
};

const LAYER_LABEL: Readonly<Record<PeriodLayerKind, string>> = { major: "Đại hạn", minor: "Tiểu hạn", yearly: "Lưu niên" };

const LAYER_REFERENCE: Readonly<Record<PeriodLayerKind, { readonly source: string; readonly kbFile: string }>> = {
  major: { source: "TVTH tr.22; MLTC tr.862-864", kbFile: "10_Van-han/01_Dai-van/01_Khoi-va-chieu-dai-van.md" },
  minor: { source: "TVTH tr.22", kbFile: "10_Van-han/02_Tieu-han/01_An-tieu-han-va-dong-han.md" },
  yearly: { source: "MLTC tr.862-864", kbFile: `${LUU_KB}/08_Lap-12-cung-luu-nien-va-chon-can.md` },
};

const targetKey = (target: PalaceTarget): string => `${target.frame}.${target.role ?? "Mệnh"}`;
const targetsText = (targets: readonly PalaceTarget[]): string => targets.map(targetLabel).join(", ");

const joinPolarity = (values: readonly Polarity[]): Polarity => (values.every((value) => value === values[0]) ? values[0]! : "trung tính");
const unique = <T>(values: readonly T[]): readonly T[] => [...new Set(values)];

export interface CompileDefaults {
  readonly palaces?: readonly PalaceTarget[] | undefined;
}

function resolveTargets(spec: { readonly targets?: readonly PalaceTarget[] | undefined }, defaults: CompileDefaults, what: string): Result<readonly PalaceTarget[]> {
  const targets = spec.targets?.length ? spec.targets : (defaults.palaces ?? []);
  if (!targets.length) return err(`Tiêu chí ${what} cần targets hoặc palaces (danh sách cung).`);
  const invalid = targets.find((target) => target.frame === "minor" && (target.role ?? "Mệnh") !== "Mệnh");
  if (invalid) return err(`Tiểu hạn chỉ có một cung (frame "minor" không nhận role ${invalid.role}); kho không lập 12 cung chức theo tiểu hạn.`);
  return ok(targets);
}

const withLabel = (criterion: Criterion, label: string | undefined): Criterion => (label ? { ...criterion, name: label } : criterion);

function inTargets(ctx: YearContext, branch: number, targets: readonly PalaceTarget[], scope: PalaceScope, what: string): readonly string[] {
  return targets.flatMap((target) => {
    const anchor = resolveTarget(ctx, target);
    if (anchor === null || !scopePalaces(anchor, scope).includes(branch)) return [];
    return [`${what} ở ${palaceText(ctx.chart, branch)}, ${SCOPE_LABEL[scope]} ${targetLabel(target)} ${palaceText(ctx.chart, anchor)}`];
  });
}

function findingTest(id: string, decadeOnly: (ctx: YearContext) => boolean): (ctx: YearContext) => HitOutcome | null {
  return (ctx) => {
    const item = ctx.layers.findings.find((candidate) => candidate.id === id);
    if (!item) return null;
    const details = item.satisfied.length ? item.satisfied : [item.summary];
    return decadeOnly(ctx) ? decadeHit(details, item.certainty) : hitIf(details, item.certainty);
  };
}

const never = (): boolean => false;
const tabooFromMajorOnly = (ctx: YearContext): boolean => {
  const taboo = ctx.layers.taboo;
  return !taboo.yearHit && [...taboo.periodPalaceHits, ...taboo.starHits].every((hit) => hit.layer === "Đại hạn" && !("flowing" in hit && hit.flowing));
};
const avoidanceFromMajorOnly = (ctx: YearContext): boolean => ctx.layers.bureauAvoidance.hits.every((hit) => hit.layer === "Đại hạn");
const isDecadeFrame = (target: PalaceTarget): boolean => target.frame === "natal" || target.frame === "major";

export function compileCriterion(spec: CriterionSpec, defaults: CompileDefaults = {}): Result<Criterion> {
  switch (spec.kind) {
    case "transformation": {
      const targets = resolveTargets(spec, defaults, spec.transformation);
      if (!targets.ok) return targets;
      const stem = spec.stem ?? "view-year";
      const scope = spec.scope ?? "self";
      const what = `${spec.transformation} (${TRANSFORMATION_STEM_LABEL[stem]})`;
      return ok(
        withLabel(
          {
            id: `${spec.transformation}/${stem}@${targets.value.map(targetKey).join("+")}~${scope}`,
            name: `${what} ${SCOPE_LABEL[scope]} ${targetsText(targets.value)}`,
            polarity: spec.transformation === "Hóa Kỵ" ? "xấu" : "tốt",
            certainty: "exact",
            assumptions: [],
            source: stem === "view-year" ? "MLTC tr.846-847, tr.862-864" : "MLTC tr.846-847",
            kbFile: `${LUU_KB}/05_Tu-hoa-luu-nien.md`,
            test(ctx) {
              const list = stem === "view-year" ? ctx.yearlyTransformations : ctx.majorTransformations;
              const item = list.find((candidate) => candidate.transformation === spec.transformation && candidate.palace !== null);
              if (!item) return null;
              const details = inTargets(ctx, item.palace!, targets.value, scope, `${spec.transformation} ${item.star}`);
              return stem === "major-palace" && targets.value.every(isDecadeFrame) ? decadeHit(details) : hitIf(details);
            },
          },
          spec.label,
        ),
      );
    }
    case "flowing-star": {
      if (!spec.stars.length) return err("Tiêu chí flowing-star cần ít nhất một sao lưu.");
      const targets = resolveTargets(spec, defaults, `sao lưu ${spec.stars.join(", ")}`);
      if (!targets.ok) return targets;
      const scope = spec.scope ?? "self";
      const references = spec.stars.map((star) => FLOWING_STAR_REFERENCE[star]);
      const names = new Set(spec.stars.map((star) => `L. ${star}`));
      return ok(
        withLabel(
          {
            id: `L.${spec.stars.join("+")}@${targets.value.map(targetKey).join("+")}~${scope}`,
            name: `Lưu ${spec.stars.join(", ")} ${SCOPE_LABEL[scope]} ${targetsText(targets.value)}`,
            polarity: joinPolarity(references.map((reference) => reference.polarity)),
            certainty: "exact",
            assumptions: [],
            source: unique(references.map((reference) => reference.source)).join("; "),
            kbFile: references[0]!.kbFile,
            test: (ctx) =>
              hitIf(ctx.flowing.filter((star) => names.has(star.name)).flatMap((star) => inTargets(ctx, star.palace, targets.value, scope, star.name))),
          },
          spec.label,
        ),
      );
    }
    case "period-palace": {
      const targets = resolveTargets(spec, defaults, `cung ${LAYER_LABEL[spec.layer]}`);
      if (!targets.ok) return targets;
      const reference = LAYER_REFERENCE[spec.layer];
      const layerPalace = (ctx: YearContext): number | null =>
        spec.layer === "major" ? ctx.majorPalace : spec.layer === "minor" ? ctx.minorPalace : ctx.yearlyPalace;
      return ok(
        withLabel(
          {
            id: `${spec.layer}=${targets.value.map(targetKey).join("+")}`,
            name: `${LAYER_LABEL[spec.layer]} ở ${targetsText(targets.value)}`,
            polarity: "trung tính",
            certainty: "exact",
            assumptions: [],
            source: reference.source,
            kbFile: reference.kbFile,
            test(ctx) {
              const branch = layerPalace(ctx);
              if (branch === null) return null;
              const details = targets.value
                .filter((target) => resolveTarget(ctx, target) === branch)
                .map((target) => `${LAYER_LABEL[spec.layer]} ở ${targetLabel(target)} ${palaceText(ctx.chart, branch)}`);
              return spec.layer === "major" && targets.value.every(isDecadeFrame) ? decadeHit(details) : hitIf(details);
            },
          },
          spec.label,
        ),
      );
    }
    case "coincidence":
      return ok(
        withLabel(
          {
            id: "trung-phung",
            name: "Đại tiểu hạn trùng phùng",
            polarity: "trung tính",
            certainty: "exact",
            assumptions: [],
            source: "TVTH tr.143",
            kbFile: "10_Van-han/03_Trung-phung/01_Dai-tieu-han-trung-phung.md",
            test: findingTest("PH-TRUNG-PHUNG", never),
          },
          spec.label,
        ),
      );
    case "age-year":
      return ok(
        withLabel(
          {
            id: "nam-tuoi",
            name: "Năm tuổi (tiểu hạn về cung tuổi)",
            polarity: "trung tính",
            certainty: "exact",
            assumptions: [],
            source: "TVTH tr.143; NP2 tr.281-284",
            kbFile: "10_Van-han/03_Trung-phung/02_Han-gap-cung-tuoi.md",
            test: (ctx) =>
              ctx.layers.ageYear.minorAtAgePalace
                ? hitIf([
                    `Tuổi ${ctx.age}: tiểu hạn về cung tuổi ${palaceText(ctx.chart, ctx.layers.ageYear.agePalace)}${ctx.layers.coincidence.majorMinor ? ", lại trùng phùng" : ""}`,
                  ])
                : null,
          },
          spec.label,
        ),
      );
    case "taboo":
      return ok(
        withLabel(
          {
            id: "tuoi-ky",
            name: "Tuổi kỵ năm / hạn",
            polarity: "xấu",
            certainty: "exact",
            assumptions: [],
            source: "TVTH tr.142-143",
            kbFile: "10_Van-han/02_Tieu-han/03_Tuoi-ky-nam-ky.md",
            test: findingTest("PH-TUOI-KY-NAM", tabooFromMajorOnly),
          },
          spec.label,
        ),
      );
    case "bureau-avoidance":
      return ok(
        withLabel(
          {
            id: "cuc-ky-hanh",
            name: "Hạn vào cung cục kỵ hành",
            polarity: "xấu",
            certainty: "exact",
            assumptions: [],
            source: "MLTC tr.5-6",
            kbFile: "01_Du-lieu-lap-la-so/04_Cuc/01_Xac-dinh-cuc.md",
            test: findingTest("PH-CUC-KY-HANH", avoidanceFromMajorOnly),
          },
          spec.label,
        ),
      );
    case "trigger": {
      const trigger = TRIGGER_BY_ID.get(spec.id);
      if (!trigger) return err(`Không có trigger "${spec.id}". Có: ${TRIGGERS.map((item) => item.id).join(", ")}`);
      return ok(withLabel(trigger, spec.label));
    }
    case "all":
    case "any": {
      if (!spec.of.length) return err(`Tiêu chí ${spec.kind} cần ít nhất một tiêu chí con.`);
      const children: Criterion[] = [];
      for (const child of spec.of) {
        const compiled = compileCriterion(child, defaults);
        if (!compiled.ok) return compiled;
        children.push(compiled.value);
      }
      const isAll = spec.kind === "all";
      const certainty: Certainty = children.some((child) => child.certainty === "interpretive") ? "interpretive" : "exact";
      return ok(
        withLabel(
          {
            id: `${spec.kind}(${children.map((child) => child.id).join(",")})`,
            name: children.map((child) => child.name).join(isAll ? " VÀ " : " HOẶC "),
            polarity: joinPolarity(children.map((child) => child.polarity)),
            certainty,
            assumptions: unique(children.flatMap((child) => child.assumptions)),
            source: unique(children.map((child) => child.source)).join("; "),
            kbFile: children[0]!.kbFile,
            ...(children.some((child) => child.minAge !== undefined) ? { minAge: Math.max(...children.map((child) => child.minAge ?? 0)) } : {}),
            test(ctx) {
              const outcomes = children.map((child) => child.test(ctx));
              const hits = outcomes.filter((outcome): outcome is HitOutcome => outcome !== null);
              if (isAll ? hits.length < children.length : !hits.length) return null;
              const hitCertainty: Certainty = hits.some((hit) => hit.certainty === "interpretive") ? "interpretive" : certainty;
              const details = hits.flatMap((hit) => hit.details);
              return hits.every((hit) => hit.decade) ? decadeHit(details, hitCertainty) : hitIf(details, hitCertainty);
            },
          },
          spec.label,
        ),
      );
    }
  }
}
