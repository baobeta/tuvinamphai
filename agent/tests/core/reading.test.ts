import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildChart } from "../../src/core/chart/build-chart.js";
import { DEFAULT_CHART_OPTIONS, type Chart } from "../../src/core/chart/types.js";
import {
  buildStarKbIndex,
  chartStarReferences,
  kbFilesForStar,
  starKbCoverage,
  topicReading,
  TOPICS,
  renderTopicReading,
  type StarKbIndex,
  type StarLookup,
} from "../../src/core/reading/index.js";
import { loadKb } from "../../src/kb/index.js";

const REAL_KB = path.join(import.meta.dirname, "../../../Kien-thuc-Tu-Vi-Nam-Phai");
const FIXTURE_KB = path.join(import.meta.dirname, "../fixtures/kb");

const lunarChart = (hourBranch: number): Chart => {
  const built = buildChart(
    { calendar: "lunar", date: { year: 1974, month: 3, day: 7, isLeapMonth: false }, hourBranch, gender: "nữ" },
    DEFAULT_CHART_OPTIONS,
  );
  if (!built.ok) throw new Error(built.error);
  return built.value;
};

const lookup = (index: StarKbIndex, query: Parameters<typeof kbFilesForStar>[1]): StarLookup => {
  const result = kbFilesForStar(index, query);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const paths = (result: StarLookup): readonly string[] => result.references.map((item) => item.path);

let index: StarKbIndex;
let fixtureIndex: StarKbIndex;

beforeAll(async () => {
  index = buildStarKbIndex((await loadKb(REAL_KB)).docs);
  fixtureIndex = buildStarKbIndex((await loadKb(FIXTURE_KB)).docs);
});

describe("bản đồ sao → file kho", () => {
  it("mọi chính tinh × 12 địa chi và × 11 cung ngoài Mệnh đều có mục riêng", () => {
    const coverage = starKbCoverage(index);
    expect(coverage.mainStarBranch).toMatchObject({ resolved: 168, total: 168 });
    expect(coverage.mainStarPalace).toMatchObject({ resolved: 154, total: 154 });
    expect(coverage.minorStars.missing).toEqual([]);
    expect(coverage.palaceFolderMainStar.resolved).toBeGreaterThanOrEqual(160);
  });

  it("Cự Môn ở Thìn, cung Phu Thê: file miếu hãm (mục Thìn Tuất), file ở các cung (mục Phu Thê), file chính tinh tại Phu Thê", () => {
    const result = lookup(index, { star: "Cự Môn", branch: "Thìn", palace: "Phu Thê" });
    const top = result.references.slice(0, 3);
    expect(top.map((item) => item.path)).toEqual([
      "04_Chinh-tinh/10_Cu-Mon/02_Mieu-ham-va-12-vi-tri.md",
      "04_Chinh-tinh/10_Cu-Mon/05_O-cac-cung-ngoai-Menh.md",
      "03_Muoi-hai-cung/11_Cung-Phu-The/02_Chinh-tinh-tai-cung.md",
    ]);
    expect(top[0]!.excerpts[0]).toContain("**Thìn, Tuất**");
    expect(top[0]!.excerpts.join("\n")).toContain("tuổi Quí Tân");
    expect(top[1]!.excerpts[0]).toContain("**Phu Thê:**");
    expect(top[2]!.excerpts[0]).toContain("| Cự Môn |");
    expect(top[0]!.sources).toContain("TVTH tr.44–46");
  });

  it("nhận tên gọi tắt và dị bản chính tả", () => {
    const canonical = lookup(index, { star: "Cự Môn", branch: "Tý", palace: "Phu Thê" });
    const aliased = lookup(index, { star: "cự môn", branch: "Tí", palace: "Phối" });
    expect(paths(aliased)).toEqual(paths(canonical));
    expect(lookup(index, { star: "Hóa Kị" }).query.star).toBe("Hóa Kỵ");
    expect(lookup(index, { star: "Kình" }).query.star).toBe("Kình Dương");
  });

  it("phụ tinh: file riêng của sao đứng đầu, kèm mục trong thư mục cung", () => {
    const result = lookup(index, { star: "Đào Hoa", palace: "Phu Thê" });
    expect(result.references[0]!.path).toBe("05_Phu-tinh-sat-tinh-tu-hoa/05_Sao-tinh-cam/01_Dao-Hoa.md");
    expect(paths(result).some((item) => item.startsWith("03_Muoi-hai-cung/11_Cung-Phu-The/"))).toBe(true);
    const tuan = lookup(index, { star: "Tuần", palace: "Phu Thê" });
    expect(paths(tuan)).toContain("07_Tuan-Triet/03_Tuan-Triet-o-Menh-va-cung-chieu.md");
  });

  it("nam mệnh, nữ mệnh: chỉ lấy mục đúng giới tính khi xét cung Mệnh", () => {
    const female = lookup(index, { star: "Cự Môn", palace: "Mệnh", gender: "nữ" });
    const gender = female.references.find((item) => item.kind === "gender")!;
    expect(gender.reason).toContain("nữ mệnh");
    expect(gender.excerpts.join(" ")).toContain("vượng phu ích tử");
  });

  it("sao vòng trùng tên cung (Phúc Đức): đề mục và ô đầu bảng nêu tên sao vẫn được tính", () => {
    const result = lookup(index, { star: "Phúc Đức" });
    expect(paths(result)).toContain("05_Phu-tinh-sat-tinh-tu-hoa/06_Sao-tinh-cach-khac/09_Hoa-Cai-Thien-Duc-Nguyet-Duc-Giai-than.md");
    const ring = result.references.find((item) => item.path === "06_Cac-vong-sao/01_Vong-Thai-Tue/01_Thu-tu-va-y-nghia-12-sao.md")!;
    expect(ring.excerpts.join("\n")).toContain("| Phúc Đức | Thổ |");
    expect(paths(result)).not.toContain("07_Tuan-Triet/03_Tuan-Triet-o-Menh-va-cung-chieu.md");
  });

  it("file tự ghi 'không phải sao Thái Tuế' xếp sau các file của sao", () => {
    const ordered = paths(lookup(index, { star: "Thái Tuế" }));
    const disclaimed = ordered.indexOf("06_Cac-vong-sao/01_Vong-Thai-Tue/04_Thai-Tue-nhap-quai.md");
    expect(disclaimed).toBeGreaterThan(ordered.indexOf("06_Cac-vong-sao/01_Vong-Thai-Tue/01_Thu-tu-va-y-nghia-12-sao.md"));
    expect(disclaimed).toBeGreaterThan(ordered.indexOf("06_Cac-vong-sao/01_Vong-Thai-Tue/03_Menh-trong-vong-Thai-Tue-va-duoc-thoi.md"));
  });

  it("đầu vào sai trả lỗi, không ném", () => {
    expect(kbFilesForStar(index, { star: "Sao Lạ" }).ok).toBe(false);
    expect(kbFilesForStar(index, { star: "Cự Môn", palace: "Cung Lạ" }).ok).toBe(false);
    expect(kbFilesForStar(index, { star: "Cự Môn", branch: "Xyz" }).ok).toBe(false);
    expect(kbFilesForStar(index, { star: "Cự Môn", brightness: "sáng" }).ok).toBe(false);
  });

  it("kho mẫu: không có mục địa chi thì dùng tóm tắt và ghi chú", () => {
    const result = lookup(fixtureIndex, { star: "Cự Môn", branch: "Thìn" });
    expect(result.references[0]).toMatchObject({ path: "04_Chinh-tinh/10_Cu-Mon/02_Mieu-ham-va-12-vi-tri.md", kind: "positions" });
    expect(result.references[0]!.excerpts[0]).toContain("tuổi Tân, Quý");
    expect(result.notes.join(" ")).toContain("không có mục riêng cho Thìn");
    const spouse = lookup(fixtureIndex, { star: "Vũ Khúc", palace: "Phu Thê" });
    expect(spouse.references[0]).toMatchObject({ kind: "palace-mention", path: "03_Muoi-hai-cung/11_Cung-Phu-The/01_Y-nghia-va-cach-xem.md" });
  });

  it("nhận danh sách KbDocument trực tiếp và cho kết quả giống chỉ mục dựng sẵn", async () => {
    const docs = (await loadKb(FIXTURE_KB)).docs;
    const fromDocs = kbFilesForStar(docs, { star: "Cự Môn", branch: "Thìn" });
    expect(fromDocs).toEqual(kbFilesForStar(fixtureIndex, { star: "Cự Môn", branch: "Thìn" }));
  });
});

describe("chartStarReferences", () => {
  it("tra mọi chính tinh, phụ tinh chính, Tứ Hóa, Tuần trong một cung", () => {
    const chart = lunarChart(2);
    const spouse = chart.palaces.find((palace) => palace.role === "Phu Thê")!;
    const result = chartStarReferences(index, chart, spouse.branch);
    const labels = result.entries.map((entry) => entry.label);
    expect(labels).toContain("Thất Sát (Miếu)");
    expect(labels).toContain("Tuần");
    const thatSat = result.entries.find((entry) => entry.label === "Thất Sát (Miếu)")!.lookup;
    expect(thatSat.query).toMatchObject({ role: "Phu Thê", branch: spouse.branch, brightness: "Miếu", gender: "nữ" });
    expect(paths(thatSat)).toContain("04_Chinh-tinh/13_That-Sat/05_O-cac-cung-ngoai-Menh.md");
    const life = chart.palaces.find((palace) => palace.role === "Mệnh")!;
    const lifeLabels = chartStarReferences(index, chart, life.branch).entries.map((entry) => entry.label);
    expect(lifeLabels).toContain("Hóa Lộc (trên Liêm Trinh)");
  });
});

describe("topicReading", () => {
  it("mỗi chủ đề trong 11_Chu-de-luan đều có file kho và cung chính", () => {
    const chart = lunarChart(2);
    for (const topic of TOPICS) {
      const reading = topicReading(index, chart, topic.id, "brief");
      if (!reading.ok) throw new Error(reading.error);
      expect(reading.value.topicFiles.filter((file) => file.path.startsWith("11_Chu-de-luan/")).length).toBeGreaterThanOrEqual(4);
      expect(reading.value.palaces[0]!.tier).toBe("chính");
      expect(reading.value.palaces[0]!.kbRole.length).toBeGreaterThan(0);
    }
  });

  it("hôn nhân: cung Phu Thê, sao kho nêu kèm trích dẫn, Thân cư Quan Lộc", () => {
    const reading = topicReading(index, lunarChart(2), "hôn nhân", "brief");
    if (!reading.ok) throw new Error(reading.error);
    const value = reading.value;
    expect(value.topic.id).toBe("marriage");
    expect(value.palaces[0]).toMatchObject({ role: "Phu Thê", hasTuan: true });
    expect(value.palaces[0]!.mainStars).toEqual([{ name: "Thất Sát", brightness: "Miếu" }]);
    const thatSat = value.topicStars.find((fact) => fact.star === "Thất Sát")!;
    expect(thatSat.inTopicPalaces).toContain("Phu Thê");
    expect(thatSat.rules[0]!.path).toMatch(/^11_Chu-de-luan\/04_Hon-nhan\//);
    expect(value.bodyPalace).toMatchObject({ role: "Quan Lộc" });
    expect(value.bodyPalace!.doc!.path).toBe("02_Ban-menh/01_Menh-va-Than/04_Than-cu-Quan.md");
    expect(value.palaceFindings[0]!.role).toBe("Phu Thê");
    const text = renderTopicReading(value);
    expect(text).toContain("Thất Sát");
    expect(text).toContain("khớp chắc chắn");
  });

  it("vai trò cung lấy theo ô đầu của dòng bảng, không theo chữ trong phần giải thích", () => {
    const reading = topicReading(index, lunarChart(2), "wealth", "full");
    if (!reading.ok) throw new Error(reading.error);
    const roleText = (role: string) => reading.value.palaces.find((facts) => facts.role === role)!.kbRole.map((quote) => quote.text).join("\n");
    expect(roleText("Quan Lộc")).not.toContain("Quan Lộc của Tài");
    expect(roleText("Mệnh")).toContain("khả năng quản lý tiền");
  });

  it("tài lộc không tự kéo cung Thân vào khi Thân nằm ngoài các cung kho nêu", () => {
    const chart = lunarChart(3);
    const wealth = topicReading(index, chart, "wealth", "brief");
    const travel = topicReading(index, chart, "travel", "brief");
    if (!wealth.ok || !travel.ok) throw new Error("topic lỗi");
    expect(travel.value.bodyPalace).toMatchObject({ role: "Thiên Di" });
    expect(wealth.value.bodyPalace).toBeUndefined();
  });

  it("chỉ trích quy tắc sao khi câu kho nói về đúng cung sao đang đóng", () => {
    const reading = topicReading(index, lunarChart(2), "marriage", "full");
    if (!reading.ok) throw new Error(reading.error);
    const tuVi = reading.value.topicStars.find((fact) => fact.star === "Tử Vi")!;
    expect(tuVi.positions.map((position) => position.role)).toEqual(["Tài Bạch"]);
    expect(tuVi.rules).toEqual([]);
    for (const fact of reading.value.topicStars) {
      for (const rule of fact.rules) expect(fact.positions.map((position) => position.role)).toContain(rule.aboutRole);
    }
  });

  it("Thân cư Phối dẫn tới file Thân cư Phu Thê", () => {
    const reading = topicReading(index, lunarChart(5), "marriage", "brief");
    if (!reading.ok) throw new Error(reading.error);
    expect(reading.value.bodyPalace).toMatchObject({ role: "Phu Thê" });
    expect(reading.value.bodyPalace!.doc!.path).toBe("02_Ban-menh/01_Menh-va-Than/07_Than-cu-Phoi.md");
  });

  it("full gồm cả cung phụ và nhiều hơn brief; kết quả tất định", () => {
    const chart = lunarChart(2);
    const brief = topicReading(index, chart, "career", "brief");
    const full = topicReading(index, chart, "career", "full");
    if (!brief.ok || !full.ok) throw new Error("topic lỗi");
    expect(full.value.palaces.length).toBeGreaterThan(brief.value.palaces.length);
    expect(renderTopicReading(full.value).length).toBeGreaterThan(renderTopicReading(brief.value).length);
    expect(topicReading(index, chart, "career", "brief")).toEqual(brief);
  });

  it("chủ đề lạ trả lỗi", () => {
    expect(topicReading(index, lunarChart(2), "xem bói", "brief").ok).toBe(false);
  });
});
