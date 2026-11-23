import type { Element } from "../calendar/five-elements.js";
import { DEFAULT_ANALYSIS_OPTIONS, type AnalysisOptions } from "./analysis-options.js";

export interface StarElement {
  readonly star: string;
  readonly element: Element;
  readonly source: string;
  readonly contested: boolean;
  readonly variants: readonly string[];
}

const MAIN_STAR_SOURCE = "TVTH tr.101–102 'Hành của Nam Bắc tinh'; NP2 tr.266–270";
const POEM_SOURCE = "TVTH tr.101–102 'Ngũ hành sở thuộc tính tinh'";
const THAI_TUE_RING_SOURCE = "TVTH tr.72–73 (bộ Thái Tuế)";

export const MAIN_STAR_ELEMENTS: Readonly<Record<string, Element>> = {
  "Tử Vi": "Thổ",
  "Thiên Phủ": "Thổ",
  "Thiên Cơ": "Mộc",
  "Thái Dương": "Hỏa",
  "Liêm Trinh": "Hỏa",
  "Vũ Khúc": "Kim",
  "Thiên Đồng": "Thủy",
  "Thiên Tướng": "Thủy",
  "Tham Lang": "Thủy",
  "Phá Quân": "Thủy",
  "Cự Môn": "Thủy",
  "Thái Âm": "Thủy",
};

export const THIEN_LUONG_ELEMENT: Readonly<Record<AnalysisOptions["thienLuongElement"], Element>> = { TVTH: "Thổ", NP2: "Mộc" };
export const THAT_SAT_ELEMENT: Readonly<Record<AnalysisOptions["thatSatElement"], Element>> = {
  "TVTH Nam Bắc tinh": "Kim",
  "TVTH bài thơ 1": "Hỏa",
};
export const THAI_TUE_ELEMENT: Readonly<Record<AnalysisOptions["thaiTueElement"], Element>> = { TVTH: "Hỏa", NP1: "Kim" };

export const AUX_STAR_ELEMENTS_TVTH_POEM: Readonly<Record<Element, readonly string[]>> = {
  Kim: [
    "Hóa Khoa", "Văn Xương", "Linh Tinh", "Đà La", "Kình Dương", "Triệt", "Bạch Hổ", "Suy", "Phá Toái",
    "Hoa Cái", "Lâm Quan", "Đế Vượng", "Quan Đới", "Thai Phụ", "Tấu Thư",
  ],
  Mộc: ["Dưỡng", "Bát Tọa", "Đường Phù", "Ân Quang", "Thiên Hỷ", "Hóa Quyền", "Đào Hoa", "Giải Thần", "Tang Môn", "Tướng Quân"],
  Thủy: [
    "Thiên Hư", "Lưu Hà", "Bác Sĩ", "Tam Thai", "Long Trì", "Long Đức", "Thanh Long", "Mộc Dục", "Tử", "Hồng Loan",
    "Thiên Khốc", "Thiên Diêu", "Hóa Kỵ", "Thiên Sứ", "Thiên Y", "Thiên Quý", "Thiếu Âm", "Văn Khúc", "Hữu Bật", "Tràng Sinh",
  ],
  Thổ: [
    "Thiên Thương", "Thiên Thọ", "Thiên Phúc", "Mộ", "Tả Phụ", "Địa Giải", "Quốc Ấn", "Thiên Trù", "Phượng Các", "Phúc Đức",
    "Bệnh Phù", "Thai", "Lộc Tồn", "Hóa Lộc", "Thiên Tài", "Tuyệt", "Thiên Khố", "Quả Tú", "Cô Thần",
  ],
  Hỏa: [
    "Thiên Khôi", "Thiên Việt", "Đại Hao", "Tiểu Hao", "Điếu Khách", "Đẩu Quân", "Địa Kiếp", "Địa Không", "Thiên Hình",
    "Thiên Mã", "Hỷ Thần", "Hỏa Tinh", "Thiếu Dương", "Tử Phù", "Quan Phủ", "Quan Phù", "Lực Sĩ", "Tuần", "Phục Binh",
    "Thiên Không", "Thiên Đức", "Nguyệt Đức", "Phi Liêm", "Kiếp Sát", "Thiên Quan", "Bệnh", "Thiên Giải", "LN Văn Tinh",
  ],
};

export const THAI_TUE_RING_ELEMENTS: Readonly<Record<string, Element>> = {
  "Thái Tuế": "Hỏa",
  "Thiếu Dương": "Hỏa",
  "Tang Môn": "Mộc",
  "Thiếu Âm": "Thủy",
  "Quan Phù": "Hỏa",
  "Tử Phù": "Hỏa",
  "Tuế Phá": "Hỏa",
  "Long Đức": "Thủy",
  "Bạch Hổ": "Kim",
  "Phúc Đức": "Thổ",
  "Điếu Khách": "Hỏa",
  "Trực Phù": "Hỏa",
};

const AUX_NOTES: Readonly<Record<string, readonly string[]>> = {
  "Kiếp Sát": ["bài thơ 1 TVTH ghi Kiếp Sát ở cả nhóm Kim lẫn nhóm Hỏa; đang dùng Hỏa"],
  "Trực Phù": ["bài thơ 1 TVTH ghi Kim; bộ Thái Tuế TVTH ghi Hỏa (đang dùng)"],
  "Tử": ["bài thơ ghi 'Tử', đoán là sao Tử vòng Tràng Sinh"],
  "Mộ": ["OCR ghi 'Mộc', đọc là sao Mộ vòng Tràng Sinh"],
  "Tả Phụ": ["sách phụ tinh có nơi ghi Tả Phụ hành Thổ, Hữu Bật Thủy; trùng bài thơ"],
  "Kình Dương": ["có sách ghi Kim đới Hỏa"],
  "Đà La": ["có sách ghi Kim đới Hỏa"],
  "Linh Tinh": ["bài thơ 1 TVTH xếp Linh Tinh vào Kim (đang dùng); bài Nam Bắc tinh xếp Hỏa; có sách ghi Kim đới Hỏa"],
  "Hóa Lộc": ["có sách ghi Mộc đới Thổ"],
};

const POEM_LOOKUP: ReadonlyMap<string, Element> = new Map(
  Object.entries(AUX_STAR_ELEMENTS_TVTH_POEM).flatMap(([element, stars]) => stars.map((star) => [star, element as Element] as const)),
);

const entry = (star: string, element: Element, source: string, variants: readonly string[] = [], contested = variants.length > 0): StarElement => ({
  star,
  element,
  source,
  contested,
  variants,
});

export function starElement(star: string, options: AnalysisOptions = DEFAULT_ANALYSIS_OPTIONS): StarElement | undefined {
  if (star === "Thiên Lương") {
    return entry(star, THIEN_LUONG_ELEMENT[options.thienLuongElement], options.thienLuongElement === "TVTH" ? "TVTH tr.101–102" : "NP2 tr.266–270", [
      "Thiên Lương: TVTH Thổ, NP2 Mộc",
    ]);
  }
  if (star === "Thất Sát") {
    return entry(star, THAT_SAT_ELEMENT[options.thatSatElement], `TVTH tr.101–102 (${options.thatSatElement})`, [
      "Thất Sát: TVTH Nam Bắc tinh và NP2 ghi Kim; bài thơ 1 TVTH xếp vào Hỏa",
    ]);
  }
  if (star === "Thái Âm") {
    return entry(star, "Thủy", "NP2 tr.266–270", ["Thái Âm không có trong hai bài thơ TVTH; hành Thủy lấy từ NP2"]);
  }
  if (star === "Thái Tuế") {
    return entry(star, THAI_TUE_ELEMENT[options.thaiTueElement], options.thaiTueElement === "TVTH" ? THAI_TUE_RING_SOURCE : "NP1 tr.97–103", [
      "Thái Tuế: TVTH/MLTC Hỏa, NP1 Kim",
    ]);
  }
  const main = MAIN_STAR_ELEMENTS[star];
  if (main) return entry(star, main, MAIN_STAR_SOURCE, star === "Thiên Đồng" ? ["NP2 không ghi hành Thiên Đồng"] : [], false);
  const ring = THAI_TUE_RING_ELEMENTS[star];
  if (ring) return entry(star, ring, THAI_TUE_RING_SOURCE, AUX_NOTES[star] ?? [], star === "Trực Phù");
  const poem = POEM_LOOKUP.get(star);
  if (poem) return entry(star, poem, POEM_SOURCE, AUX_NOTES[star] ?? [], star === "Kiếp Sát" || star === "Linh Tinh");
  return undefined;
}
