import { z } from "zod";
import { palaceOfRole } from "../core/chart/palaces.js";
import type { Chart } from "../core/chart/types.js";
import {
  buildStarKbIndex,
  chartStarReferences,
  FULL_LIMITS,
  kbFilesForStar,
  renderChartStarReferences,
  renderChartStarReferencesBrief,
  renderStarLookup,
  renderTopicReading,
  resolveBranchName,
  resolveRole,
  topicReading,
  TOPICS,
  type StarKbIndex,
} from "../core/reading/index.js";
import type { KbIndex } from "../kb/index.js";
import { chartReferenceFields, resolveChart, type ResolvedChart } from "./chart-tools.js";
import { defineTool } from "./registry.js";
import { ToolInputError, unwrapOrThrow } from "./result-output.js";

const starIndexCache = new WeakMap<KbIndex["docs"], StarKbIndex>();

export function starIndexOf(kb: KbIndex): StarKbIndex {
  const cached = starIndexCache.get(kb.docs);
  if (cached) return cached;
  const built = buildStarKbIndex(kb.docs);
  starIndexCache.set(kb.docs, built);
  return built;
}

const header = (resolved: ResolvedChart): string => (resolved.id ? `chart_id: ${resolved.id}\n\n` : "");

const detailField = z.enum(["brief", "full"]).optional().describe("brief (mặc định): ít file, ít câu trích; full: đầy đủ");

const BODY_PALACE_NAMES = new Set(["thân", "cung thân", "thân cư"]);

export function resolvePalaceBranch(chart: Chart, text: string): number {
  const normalized = text.trim().normalize("NFC").toLowerCase();
  if (BODY_PALACE_NAMES.has(normalized)) return chart.parameters.bodyPalace;
  const role = resolveRole(normalized);
  if (role.ok) return palaceOfRole(chart.parameters.lifePalace, role.value);
  const branch = resolveBranchName(normalized);
  if (branch.ok) return branch.value;
  throw new ToolInputError(`Không hiểu cung "${text}". Dùng tên cung chức (Mệnh, Phu Thê…), 'Thân' cho cung an Thân, hoặc địa chi ('Ngọ', 'chi Thân').`);
}

export const lookupStarMeaningTool = defineTool({
  name: "lookup_star_meaning",
  description:
    "Tra tất định file và mục trong kho tri thức nói về một sao, theo cấu trúc thư mục và tiêu đề (không chấm điểm toàn văn). " +
    "Nhận tên sao (chính tinh, phụ tinh, Tứ Hóa, Tuần/Triệt, sao vòng), có thể kèm cung chức, địa chi, độ sáng, giới tính. " +
    "Ví dụ Cự Môn ở Thìn cung Phu Thê trả về file miếu hãm 12 vị trí (mục Thìn Tuất), file Cự Môn ở các cung (mục Phu Thê), " +
    "file chính tinh tại cung Phu Thê. Mỗi file kèm câu trích nguyên văn và 'Nguồn chính'. Không tự luận giải.",
  schema: z.strictObject({
    star: z.string().describe("Tên sao, ví dụ 'Cự Môn', 'Kình Dương', 'Hóa Kỵ', 'Đào Hoa', 'Tuần'"),
    palace: z.string().optional().describe("Cung chức, ví dụ 'Mệnh', 'Phu Thê', 'Quan Lộc' (gọi tắt Phối, Quan, Tài… cũng được)"),
    branch: z.string().optional().describe("Địa chi sao đóng, ví dụ 'Thìn'"),
    brightness: z.string().optional().describe("Độ sáng: Miếu, Vượng, Đắc, Lợi, Bình, Hãm"),
    gender: z.enum(["nam", "nữ"]).optional(),
    detail: detailField,
  }),
  async run({ detail, ...query }, ctx) {
    const lookup = unwrapOrThrow(kbFilesForStar(starIndexOf(ctx.kb), query));
    return renderStarLookup(lookup, detail === "full" ? FULL_LIMITS : { maxReferences: 6, maxExcerpts: 3, maxExcerptChars: 400 });
  },
});

export const chartStarReferencesTool = defineTool({
  name: "chart_star_references",
  description:
    "Với một lá số (chart_id hoặc birth) và một cung, tra trong MỘT lần gọi các file kho cho mọi chính tinh, phụ tinh chính, Tứ Hóa, Tuần/Triệt " +
    "trong cung đó, theo đúng cung chức, địa chi, độ sáng của lá số. Mỗi sao kèm file, câu trích nguyên văn và nguồn sách.",
  schema: z.strictObject({
    ...chartReferenceFields,
    palace: z.string().describe("Cung: tên cung chức ('Phu Thê'), 'Thân' cho cung an Thân, hoặc địa chi ('Ngọ', 'chi Thân')"),
    all_minor_stars: z.boolean().optional().describe("true để tra cả các phụ tinh nhỏ và sao vòng Bác Sĩ, Tràng Sinh, Thái Tuế"),
    detail: detailField,
  }),
  async run({ palace, all_minor_stars, detail, ...reference }, ctx) {
    const resolved = resolveChart(reference, ctx);
    const branch = resolvePalaceBranch(resolved.chart, palace);
    const result = chartStarReferences(starIndexOf(ctx.kb), resolved.chart, branch, all_minor_stars ? "all" : "key");
    return header(resolved) + (detail === "full" ? renderChartStarReferences(result, FULL_LIMITS) : renderChartStarReferencesBrief(result));
  },
});

export const topicReadingTool = defineTool({
  name: "topic_reading",
  description:
    "Gom dữ kiện để luận một chủ đề trên lá số theo nhánh kho 11_Chu-de-luan: các cung cần xem (cung chức, địa chi, chính tinh, độ sáng, Tứ Hóa, " +
    "Tuần/Triệt, tam phương), Thân cư cung nào, các sao kho nêu cho chủ đề có trên lá số kèm câu kho trích nguyên văn, kết luận phân tích cung, " +
    "cách cục liên quan, file kho của chủ đề và tra sao của cung chính. Chỉ nêu dữ kiện có nguồn và mức chắc chắn, không phán đoán thêm. " +
    `Chủ đề: ${TOPICS.map((topic) => `${topic.id} (${topic.label})`).join(", ")}.`,
  schema: z.strictObject({
    ...chartReferenceFields,
    topic: z.string().describe("Mã hoặc tên chủ đề, ví dụ 'marriage' hoặc 'hôn nhân', 'công danh', 'tài lộc', 'sức khỏe'"),
    detail: detailField,
  }),
  async run({ topic, detail, ...reference }, ctx) {
    const resolved = resolveChart(reference, ctx);
    const reading = unwrapOrThrow(topicReading(starIndexOf(ctx.kb), resolved.chart, topic, detail ?? "brief"));
    return header(resolved) + renderTopicReading(reading);
  },
});

export const READING_TOOLS = [lookupStarMeaningTool, chartStarReferencesTool, topicReadingTool];
