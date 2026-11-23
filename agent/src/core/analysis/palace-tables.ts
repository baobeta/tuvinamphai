import type { Polarity } from "./finding.js";

export const FOUR_MALEFIC = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh"] as const;
export const SIX_MALEFIC = ["Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"] as const;
export const SIX_LOSS = ["Đại Hao", "Tiểu Hao", "Tang Môn", "Bạch Hổ", "Thiên Khốc", "Thiên Hư"] as const;
export const AUSPICIOUS_STARS = [
  "Thiên Khôi", "Thiên Việt", "Văn Xương", "Văn Khúc", "Tả Phụ", "Hữu Bật", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa",
  "Long Trì", "Phượng Các", "Ân Quang", "Thiên Quý", "Tam Thai", "Bát Tọa", "Thai Phụ", "Phong Cáo", "Thiên Quan",
  "Thiên Phúc", "Thiên Đức", "Nguyệt Đức", "Long Đức", "Phúc Đức", "Hồng Loan", "Đào Hoa", "Thiên Hỷ", "Hoa Cái",
  "Lộc Tồn", "Thiên Mã",
] as const;
export const SAT_KY_STARS = [...SIX_MALEFIC, "Hóa Kỵ"] as const;
export const THREE_VOIDS_TVTH = ["Tuần", "Triệt", "Thiên Không", "Địa Không"] as const;

export interface FlankPattern {
  readonly id: string;
  readonly pairs: ReadonlyArray<readonly [string, string]>;
  readonly label: string;
  readonly polarity: Polarity;
  readonly source: string;
  readonly ambiguity?: string;
}

export const GOOD_FLANK_PATTERNS: readonly FlankPattern[] = [
  { id: "tu_phu_giap_menh", pairs: [["Tử Vi", "Thiên Phủ"]], label: "Tử Phủ giáp Mệnh cách — phú quý song toàn", polarity: "tốt", source: "MLTC tr.32–54" },
  { id: "nhat_nguyet_giap", pairs: [["Thái Dương", "Thái Âm"]], label: "Giáp Nhật giáp Nguyệt — cận đắc quý nhân", polarity: "tốt", source: "TVTH tr.186–197; NP1 Cung-Thien-Di tr.202–205" },
  { id: "xuong_khuc_giap", pairs: [["Văn Xương", "Văn Khúc"]], label: "Xương Khúc giáp Mệnh — không phú cũng quý", polarity: "tốt", source: "TVTH tr.55–56; MLTC tr.605–628" },
  { id: "khoi_viet_giap", pairs: [["Thiên Khôi", "Thiên Việt"]], label: "Khôi Việt giáp Mệnh — thông minh, sớm thành đạt, hay gặp quý nhân", polarity: "tốt", source: "TVTH tr.55; MLTC tr.643–649" },
  { id: "ta_huu_giap", pairs: [["Tả Phụ", "Hữu Bật"]], label: "Tả Hữu giáp Mệnh — nhiều người kính phục", polarity: "tốt", source: "TVTH tr.57; MLTC tr.629–637" },
  { id: "song_loc_giap", pairs: [["Lộc Tồn", "Hóa Lộc"]], label: "Song Lộc giáp Mệnh (giáp Thân Mệnh chủ phú quý)", polarity: "tốt", source: "MLTC tr.702–713" },
  {
    id: "khoa_quyen_loc_giap",
    pairs: [["Hóa Khoa", "Hóa Quyền"], ["Hóa Khoa", "Hóa Lộc"], ["Hóa Quyền", "Hóa Lộc"]],
    label: "Khoa Quyền Lộc giáp vi quý cách",
    polarity: "tốt",
    source: "MLTC tr.720–734; TVTH tr.193–197",
    ambiguity: "Khoa Quyền Lộc giáp: sách không nói rõ hai sao nào; đang nhận bất kỳ hai trong ba Hóa Khoa, Hóa Quyền, Hóa Lộc",
  },
  { id: "long_phuong_giap", pairs: [["Long Trì", "Phượng Các"]], label: "giáp Long Phượng", polarity: "tốt", source: "NP1 Thien-Dong tr.75–91; TVTH tr.131" },
  { id: "thai_toa_giap", pairs: [["Tam Thai", "Bát Tọa"]], label: "giáp Tam Thai Bát Tọa", polarity: "tốt", source: "TVTH tr.105–118; NP1 Cung-Menh, La-so-mau-9" },
];

export const BAD_FLANK_PATTERNS: readonly FlankPattern[] = [
  { id: "khong_kiep_giap", pairs: [["Địa Không", "Địa Kiếp"]], label: "Không Kiếp giáp Mệnh — nhi yểu tắc bần", polarity: "xấu", source: "TVTH tr.186–192" },
  { id: "hoa_linh_giap", pairs: [["Hỏa Tinh", "Linh Tinh"]], label: "Hỏa Linh giáp — bại cục, chủ hung", polarity: "xấu", source: "TVTH tr.77–78; MLTC tr.673–683" },
  { id: "giap_liem_giap_sat", pairs: [["Liêm Trinh", "Thất Sát"]], label: "giáp Liêm giáp Sát", polarity: "trung tính", source: "TVTH tr.105–118, tr.131" },
];

export const BODY_FLANK_LABELS_MLTC: ReadonlyArray<{ readonly pair: readonly [string, string]; readonly label: string }> = [
  { pair: ["Kình Dương", "Đà La"], label: "dễ kích động oán giận; có Hóa Kỵ thì tai họa" },
  { pair: ["Hỏa Tinh", "Linh Tinh"], label: "thân thể tật nguyền hoặc lao động vất vả" },
  { pair: ["Địa Không", "Địa Kiếp"], label: "bấp bênh hoặc khuyết tật" },
];

export interface SourcedLabel {
  readonly source: string;
  readonly label: string;
}

export interface LifeStagePreference {
  readonly favored: readonly string[];
  readonly avoided: readonly SourcedLabel[];
  readonly note?: string;
}

export const LIFE_STAGE_STAR_PREFERENCES: Readonly<Record<string, LifeStagePreference>> = {
  "Tràng Sinh": { favored: ["mọi cung", "Mệnh", "Quan Lộc", "Phúc Đức"], avoided: [{ source: "KB tổng hợp", label: "Tật Ách" }], note: "MLTC: kỵ lạc Không Vong; TVTH: Tràng Sinh ở Hợi 'tối hãm'" },
  "Mộc Dục": { favored: ["Phu Thê"], avoided: [{ source: "KB tổng hợp", label: "Mệnh" }, { source: "KB tổng hợp", label: "Tài Bạch" }, { source: "KB tổng hợp", label: "Điền Trạch" }] },
  "Quan Đới": { favored: ["Mệnh", "mọi cung"], avoided: [{ source: "KB tổng hợp", label: "Tật Ách" }] },
  "Lâm Quan": { favored: ["mọi cung"], avoided: [{ source: "NP", label: "Tài Bạch" }, { source: "NP", label: "Thiên Di" }], note: "MLTC: 'đi vào 12 cung là điềm lành'" },
  "Đế Vượng": { favored: ["mọi cung"], avoided: [{ source: "KB tổng hợp", label: "Tật Ách" }] },
  Suy: { favored: [], avoided: [{ source: "KB tổng hợp", label: "vận thiếu niên" }] },
  Bệnh: { favored: ["Nô Bộc"], avoided: [{ source: "KB tổng hợp", label: "Mệnh" }, { source: "KB tổng hợp", label: "Tật Ách" }, { source: "KB tổng hợp", label: "vận thiếu niên" }] },
  Tử: { favored: ["Điền Trạch", "Tài Bạch"], avoided: [{ source: "KB tổng hợp", label: "Mệnh" }, { source: "KB tổng hợp", label: "vận thiếu niên" }] },
  Mộ: { favored: ["Tài Bạch", "Quan Lộc", "Phúc Đức", "Điền Trạch"], avoided: [{ source: "KB tổng hợp", label: "Mệnh" }] },
  Tuyệt: {
    favored: ["Phu Thê"],
    avoided: [
      { source: "MLTC", label: "Mệnh" },
      { source: "MLTC", label: "Tử Tức" },
      { source: "NP1", label: "Tử Tức" },
      { source: "NP1", label: "Tài Bạch" },
    ],
  },
  Thai: { favored: ["Tử Tức"], avoided: [{ source: "KB tổng hợp", label: "vận muộn cung Tật" }, { source: "KB tổng hợp", label: "cung Không Vong" }] },
  Dưỡng: { favored: ["mọi cung", "Tài Bạch", "Điền Trạch"], avoided: [{ source: "TVTH", label: "Tật Ách nhiều sao mờ ám" }] },
};

export const TUAN_TRIET_BY_ROLE: Readonly<Record<string, readonly SourcedLabel[]>> = {
  "Tật Ách": [
    { source: "NP1/NP2", label: "hợp — Triệt hao tán bệnh, Tuần ngăn chặn (NP2: thêm thọ trên 100)" },
    { source: "MLTC", label: "Tiệt Không nhập Tật: ưu tư phát bệnh, trầm cảm" },
  ],
  "Phúc Đức": [
    { source: "NP2", label: "Triệt: mất mộ" },
    { source: "NP1", label: "số xuất ngoại cần Phúc không gặp Tuần Triệt; Thất Sát hãm ở Phúc gặp Tuần Triệt thì sáng cung Phúc" },
  ],
  "Thiên Di": [
    { source: "NP1", label: "đi không được ở không xong, đi lại phải về; Tuần ở Di giảm tai họa" },
    { source: "NP2", label: "sống thọ, ít tai ương, không làm được việc gì cho đời" },
  ],
  "Phụ Mẫu": [{ source: "NP1", label: "Thái Âm/Thái Dương gặp Tuần Triệt ở Phụ Mẫu: giảm thọ cha mẹ" }],
  "Quan Lộc": [
    { source: "TVTH", label: "+ Kiếp/Hỏa/Kỵ: nam muộn công danh (ngoài 40)" },
    { source: "NP1", label: "Triệt cư Quan: có lúc đổi hướng; 'quan quyền quan chức là không'" },
  ],
  "Phu Thê": [{ source: "NP1", label: "Phu có Triệt: chia đôi tài sản" }],
  "Tài Bạch": [{ source: "NP2", label: "Đà La + Triệt: 'ngựa què'" }],
};

export interface VoidAffinity {
  readonly stars: readonly string[];
  readonly together: boolean;
  readonly attitude: "ưa" | "sợ";
  readonly note: string;
}

export const VOID_AFFINITIES: readonly VoidAffinity[] = [
  { stars: ["Tham Lang"], together: false, attitude: "ưa", note: "dù miếu hay đắc (NP2); MLTC: thích Không Vong" },
  { stars: ["Cự Môn"], together: false, attitude: "ưa", note: "dù miếu hay đắc (NP2)" },
  { stars: ["Phá Quân"], together: false, attitude: "ưa", note: "NP2: bất kể cung nào; TVTH: Phá hãm ở Mệnh gặp Tuần Triệt 'chết đường', Phá đắc thì chẳng sao" },
  { stars: ["Liêm Trinh", "Phá Quân"], together: true, attitude: "ưa", note: "Liêm Phá cần Tuần Triệt (NP1)" },
  { stars: ["Thái Dương", "Thái Âm"], together: true, attitude: "ưa", note: "gặp Triệt vẫn tốt; Nhật Nguyệt đồng cung Hóa Kỵ gặp Tuần Triệt 'phản vi kỳ cách' (NP1)" },
  { stars: ["Long Trì"], together: false, attitude: "ưa", note: "Tứ linh không sợ Tuần Triệt (NP1)" },
  { stars: ["Phượng Các"], together: false, attitude: "ưa", note: "Tứ linh không sợ Tuần Triệt (NP1)" },
  { stars: ["Hoa Cái"], together: false, attitude: "ưa", note: "Tứ linh không sợ Tuần Triệt (NP1)" },
  { stars: ["Bạch Hổ"], together: false, attitude: "ưa", note: "Tứ linh không sợ Tuần Triệt (NP1)" },
  { stars: ["Thiên Phủ"], together: false, attitude: "sợ", note: "rất sợ (NP2); NP1: gặp Triệt tiền bần hậu phú" },
  { stars: ["Thiên Tướng"], together: false, attitude: "sợ", note: "sợ Tuần Triệt (NP1)" },
  { stars: ["Tướng Quân"], together: false, attitude: "sợ", note: "tướng cụt đầu (TVTH); NP1: sợ Triệt, Tuần thì đỡ" },
  { stars: ["Tử Vi"], together: false, attitude: "sợ", note: "hồ đồ, mất đường công danh (NP1/NP2)" },
  { stars: ["Thiên Cơ"], together: false, attitude: "sợ", note: "NP1 'sợ nhất' vs NP1 lá số 2 'thạch trung ẩn ngọc'" },
  { stars: ["Thiên Khôi"], together: false, attitude: "sợ", note: "không ưa Triệt (NP1)" },
  { stars: ["Thiên Việt"], together: false, attitude: "sợ", note: "không ưa Triệt (NP1)" },
  { stars: ["Văn Xương"], together: false, attitude: "sợ", note: "không ưa Triệt (NP1)" },
  { stars: ["Văn Khúc"], together: false, attitude: "sợ", note: "không ưa Triệt (NP1)" },
  { stars: ["Hóa Khoa"], together: false, attitude: "sợ", note: "MLTC: hữu danh vô thực; NP1: Khoa gần như không bị Tuần Triệt" },
  { stars: ["Thiên Mã"], together: false, attitude: "sợ", note: "Thiên Mã + Triệt: nội lực bị giới hạn (NP1); MLTC 'Mã ngộ Không Vong' tính Tiệt Không nhưng 'Tuần Không không luận'" },
];

export const WEAK_STAR_VOID_CONFLICT: readonly string[] = [
  "TVTH tr.100–101: sao hãm gặp Tuần Triệt càng thêm xấu",
  "TVTH tr.73–74: Tuần Triệt giảm cả tốt lẫn xấu",
  "NP1: sao lạc hãm cần Tuần Triệt",
];

export const VOID_PALACE_BY_ROLE_NP2: Readonly<Record<string, string>> = {
  "Phu Thê": "rất xấu",
  "Huynh Đệ": "rất xấu",
  "Phụ Mẫu": "rất xấu",
  "Tài Bạch": "kiếm tiền nhiều kiểu",
  "Tật Ách": "rất tốt",
};
