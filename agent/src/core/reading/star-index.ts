import { MAIN_STARS } from "../analysis/chart-query.js";
import { BRANCHES } from "../calendar/stem-branch.js";
import { PALACE_ROLES, type PalaceRole } from "../chart/palaces.js";
import { ALL_STARS, isMainStar, isTextAmbiguousStar, labelMentionsRole, labelMentionsStar, resolveRole, starsInTitle, textMentionsBranch } from "./names.js";
import { canon, indexDocument, isContentLine, slugOf, type IndexedDoc, type IndexedLine, type ReadingKbDocument } from "./text.js";

export type MainStarDocKind = "nature" | "positions" | "combinations" | "gender" | "other-palaces" | "periods" | "patterns" | "general";

export interface MainStarDoc {
  readonly indexed: IndexedDoc;
  readonly kind: MainStarDocKind;
}

export interface MinorStarDoc {
  readonly indexed: IndexedDoc;
  readonly match: "title" | "section";
  readonly titleStarCount: number;
  readonly disclaimed: boolean;
}

export interface StarKbIndex {
  readonly docs: readonly IndexedDoc[];
  readonly byPath: ReadonlyMap<string, IndexedDoc>;
  readonly mainStarDocs: ReadonlyMap<string, readonly MainStarDoc[]>;
  readonly minorStarDocs: ReadonlyMap<string, readonly MinorStarDoc[]>;
  readonly palaceDocs: ReadonlyMap<PalaceRole, readonly IndexedDoc[]>;
  readonly bodyPalaceDocs: ReadonlyMap<PalaceRole, IndexedDoc>;
  readonly brightnessTable?: IndexedDoc;
}

const MAIN_STAR_BRANCH = "04_Chinh-tinh";
const PALACE_BRANCH = "03_Muoi-hai-cung";
const BODY_PALACE_FOLDER = "02_Ban-menh/01_Menh-va-Than";
const MINOR_STAR_BRANCHES = ["05_Phu-tinh-sat-tinh-tu-hoa", "06_Cac-vong-sao", "07_Tuan-Triet"];

const KIND_BY_FILE_SLUG: readonly (readonly [RegExp, MainStarDocKind])[] = [
  [/Tinh-chat/i, "nature"],
  [/Mieu-ham/i, "positions"],
  [/Sao-dong-cung/i, "combinations"],
  [/Nam-menh-nu-menh/i, "gender"],
  [/O-cac-cung/i, "other-palaces"],
  [/Nhap-han/i, "periods"],
  [/Cach-cuc/i, "patterns"],
];

export const kindOfMainStarDoc = (fileSlug: string): MainStarDocKind =>
  KIND_BY_FILE_SLUG.find(([pattern]) => pattern.test(fileSlug))?.[1] ?? "general";

const folderSlug = (folder: string): string => (folder.split("/").pop() ?? "").replace(/^\d+_/, "").replace(/^Cung-/i, "").toLowerCase();

const inBranch = (indexed: IndexedDoc, branch: string): boolean => indexed.doc.path.startsWith(`${branch}/`);

const titleStars = (indexed: IndexedDoc): readonly string[] => starsInTitle(indexed.titleCanon).filter((star) => !isMainStar(star));

const RING_BRANCH = "06_Cac-vong-sao";

export const lineMentionsStarAsTopic = (line: IndexedLine, star: string, docPath = ""): boolean => {
  if (line.isHeading) return starsInTitle(line.headingCanon).includes(star);
  if (isTextAmbiguousStar(star) && !line.isTableRow && !docPath.startsWith(`${RING_BRANCH}/`)) return false;
  return labelMentionsStar(line.label, star);
};

export const lineInStarSection = (line: IndexedLine, star: string, docPath = ""): boolean =>
  isContentLine(line) && (lineMentionsStarAsTopic(line, star, docPath) || starsInTitle(line.headingCanon).includes(star));

const disclaimsStar = (indexed: IndexedDoc, star: string): boolean =>
  indexed.lines.some((line) => line.canon.includes(`không phải sao ${canon(star)}`));

function minorStarDocs(docs: readonly IndexedDoc[]): ReadonlyMap<string, readonly MinorStarDoc[]> {
  const candidates = docs.filter((indexed) => MINOR_STAR_BRANCHES.some((branch) => inBranch(indexed, branch)));
  const entries = ALL_STARS.filter((star) => !isMainStar(star)).map((star) => {
    const found = candidates.flatMap((indexed): MinorStarDoc[] => {
      const inTitle = titleStars(indexed);
      const disclaimed = disclaimsStar(indexed, star);
      if (inTitle.includes(star)) return [{ indexed, match: "title", titleStarCount: inTitle.length, disclaimed }];
      const inSection = indexed.lines.some((line) => line.headingCanon !== "liên quan" && lineMentionsStarAsTopic(line, star, indexed.doc.path));
      return inSection ? [{ indexed, match: "section", titleStarCount: inTitle.length, disclaimed }] : [];
    });
    return [star, found] as const;
  });
  return new Map(entries.filter(([, found]) => found.length > 0));
}

function mainStarDocs(docs: readonly IndexedDoc[]): ReadonlyMap<string, readonly MainStarDoc[]> {
  const candidates = docs.filter((indexed) => inBranch(indexed, MAIN_STAR_BRANCH));
  return new Map(
    MAIN_STARS.map((star) => [
      star,
      candidates
        .filter((indexed) => folderSlug(indexed.folder) === slugOf(star))
        .map((indexed) => ({ indexed, kind: kindOfMainStarDoc(indexed.fileSlug) })),
    ]),
  );
}

function palaceDocs(docs: readonly IndexedDoc[]): ReadonlyMap<PalaceRole, readonly IndexedDoc[]> {
  const candidates = docs.filter((indexed) => inBranch(indexed, PALACE_BRANCH));
  return new Map(PALACE_ROLES.map((role) => [role, candidates.filter((indexed) => folderSlug(indexed.folder) === slugOf(role))]));
}

function bodyPalaceDocs(docs: readonly IndexedDoc[]): ReadonlyMap<PalaceRole, IndexedDoc> {
  const entries = docs
    .filter((indexed) => indexed.folder === BODY_PALACE_FOLDER)
    .flatMap((indexed): (readonly [PalaceRole, IndexedDoc])[] => {
      const named = /^thân cư\s+([^(:]+)/.exec(indexed.titleCanon)?.[1]?.trim();
      if (!named) return [];
      const role = resolveRole(named);
      return role.ok ? [[role.value, indexed]] : [];
    });
  return new Map(entries);
}

export function buildStarKbIndex(documents: readonly ReadingKbDocument[]): StarKbIndex {
  const docs = documents.map(indexDocument);
  const brightnessTable = docs.find((indexed) => inBranch(indexed, MAIN_STAR_BRANCH) && /Bang-mieu-ham/i.test(indexed.fileSlug));
  return {
    docs,
    byPath: new Map(docs.map((indexed) => [indexed.doc.path, indexed])),
    mainStarDocs: mainStarDocs(docs),
    minorStarDocs: minorStarDocs(docs),
    palaceDocs: palaceDocs(docs),
    bodyPalaceDocs: bodyPalaceDocs(docs),
    ...(brightnessTable ? { brightnessTable } : {}),
  };
}

const firstCell = (label: string): string => label.split(" | ")[0] ?? label;

export const linesAboutBranch = (indexed: IndexedDoc, branch: number): readonly IndexedLine[] =>
  indexed.lines.filter(
    (line) =>
      isContentLine(line) &&
      ((line.label !== undefined && textMentionsBranch(firstCell(line.label), branch)) || textMentionsBranch(line.headingCanon, branch)),
  );

export const linesAboutRole = (indexed: IndexedDoc, role: PalaceRole): readonly IndexedLine[] =>
  indexed.lines.filter((line) => isContentLine(line) && (labelMentionsRole(line.label, role) || labelMentionsRole(line.headingCanon, role)));

export interface StarKbCoverage {
  readonly mainStarBranch: { readonly resolved: number; readonly total: number; readonly missing: readonly string[] };
  readonly mainStarPalace: { readonly resolved: number; readonly total: number; readonly missing: readonly string[] };
  readonly palaceFolderMainStar: { readonly resolved: number; readonly total: number; readonly missing: readonly string[] };
  readonly minorStars: { readonly resolved: number; readonly total: number; readonly missing: readonly string[] };
}

const tally = (checks: readonly (readonly [string, boolean])[]) => ({
  resolved: checks.filter(([, okay]) => okay).length,
  total: checks.length,
  missing: checks.filter(([, okay]) => !okay).map(([label]) => label),
});

export function starKbCoverage(index: StarKbIndex): StarKbCoverage {
  const docOfKind = (star: string, kind: MainStarDocKind) => index.mainStarDocs.get(star)?.find((entry) => entry.kind === kind)?.indexed;
  const branchChecks = MAIN_STARS.flatMap((star) =>
    BRANCHES.map((name, branch) => {
      const doc = docOfKind(star, "positions");
      return [`${star} @ ${name}`, doc ? linesAboutBranch(doc, branch).length > 0 : false] as const;
    }),
  );
  const nonLifeRoles = PALACE_ROLES.filter((role) => role !== "Mệnh");
  const palaceChecks = MAIN_STARS.flatMap((star) =>
    nonLifeRoles.map((role) => {
      const doc = docOfKind(star, "other-palaces");
      return [`${star} @ ${role}`, doc ? linesAboutRole(doc, role).length > 0 : false] as const;
    }),
  );
  const folderChecks = MAIN_STARS.flatMap((star) =>
    PALACE_ROLES.map((role) => {
      const docs = index.palaceDocs.get(role) ?? [];
      const hit = docs.some((indexed) => indexed.lines.some((line) => isContentLine(line) && lineMentionsStarAsTopic(line, star, indexed.doc.path)));
      return [`${star} trong thư mục cung ${role}`, hit] as const;
    }),
  );
  const minorChecks = ALL_STARS.filter((star) => !isMainStar(star)).map((star) => [star, (index.minorStarDocs.get(star)?.length ?? 0) > 0] as const);
  return {
    mainStarBranch: tally(branchChecks),
    mainStarPalace: tally(palaceChecks),
    palaceFolderMainStar: tally(folderChecks),
    minorStars: tally(minorChecks),
  };
}
