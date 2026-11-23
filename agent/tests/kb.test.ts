import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseKbDocument } from "../src/kb/document.js";
import { loadKb } from "../src/kb/index.js";
import { foldVi, queryTerms } from "../src/kb/normalize.js";
import { searchKb } from "../src/kb/search.js";

const KB = path.join(import.meta.dirname, "fixtures/kb");

describe("normalize", () => {
  it("bỏ dấu tiếng Việt, kể cả đ", () => {
    expect(foldVi("Cự Môn ĐÀ LA")).toBe("cu mon da la");
  });
  it("tách bigram để khớp tên sao 2 chữ", () => {
    expect(queryTerms("Cự Môn Thìn").bigrams).toEqual(["cự môn", "môn thìn"]);
  });
});

describe("parseKbDocument", () => {
  it("đọc tiêu đề, câu hỏi, từ khóa, nguồn", async () => {
    const kb = await loadKb(KB);
    const doc = kb.byPath.get("04_Chinh-tinh/10_Cu-Mon/02_Mieu-ham-va-12-vi-tri.md")!;
    expect(doc.title).toBe("Cự Môn: miếu hãm và 12 vị trí");
    expect(doc.branch).toBe("04_Chinh-tinh");
    expect(doc.questions).toEqual(["Cự Môn ở Thìn Tuất tuổi Tân thì sao?", "Cự Môn miếu ở đâu?"]);
    expect(doc.keywords).toContain("Thạch trung ẩn ngọc");
    expect(doc.sources).toContain("TVTH tr.44–46");
  });

  it("file không theo mẫu vẫn có tiêu đề dự phòng", () => {
    const doc = parseKbDocument("x/y.md", "không có tiêu đề");
    expect(doc.title).toBe("x/y.md");
    expect(doc.questions).toEqual([]);
  });
});

describe("loadKb", () => {
  it("bỏ README và file đặc tả", async () => {
    const kb = await loadKb(KB);
    expect(kb.docs.map((d) => d.path).sort()).toEqual([
      "03_Muoi-hai-cung/11_Cung-Phu-The/01_Y-nghia-va-cach-xem.md",
      "04_Chinh-tinh/10_Cu-Mon/02_Mieu-ham-va-12-vi-tri.md",
    ]);
    expect(kb.branches).toEqual(["03_Muoi-hai-cung", "04_Chinh-tinh"]);
  });

  it("báo lỗi rõ khi thư mục không tồn tại", async () => {
    await expect(loadKb("/khong/ton/tai")).rejects.toThrow(/TUVI_WORKSPACE/);
  });
});

describe("searchKb", () => {
  it("tìm đúng file theo tên sao + cung", async () => {
    const kb = await loadKb(KB);
    const hits = searchKb(kb, "Cự Môn Thìn tuổi Tân");
    expect(hits[0]?.doc.path).toContain("10_Cu-Mon");
    expect(hits[0]?.snippet.length).toBeGreaterThan(0);
  });

  it("gõ không dấu vẫn tìm được", async () => {
    const kb = await loadKb(KB);
    expect(searchKb(kb, "cu mon")[0]?.doc.path).toContain("10_Cu-Mon");
  });

  it("câu hỏi về hôn nhân ra cung Phu Thê", async () => {
    const kb = await loadKb(KB);
    expect(searchKb(kb, "hôn nhân vợ chồng")[0]?.doc.path).toContain("Cung-Phu-The");
  });

  it("lọc theo nhánh", async () => {
    const kb = await loadKb(KB);
    const hits = searchKb(kb, "Cự Môn", { branch: "03_Muoi-hai-cung" });
    expect(hits.every((h) => h.doc.branch === "03_Muoi-hai-cung")).toBe(true);
  });

  it("truy vấn rỗng trả về rỗng", async () => {
    expect(searchKb(await loadKb(KB), "  ")).toEqual([]);
  });
});
