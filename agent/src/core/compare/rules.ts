import type { PalaceRole } from "../chart/palaces.js";
import type { Element } from "../calendar/five-elements.js";
import { mod } from "../calendar/stem-branch.js";

export type Relationship = "spouse" | "sibling" | "friend";

export interface RelationshipRule {
  readonly label: string;
  readonly palace: PalaceRole;
  readonly certainty: "exact" | "interpretive";
  readonly note: string;
}

export const RELATIONSHIP_RULES: Readonly<Record<Relationship, RelationshipRule>> = {
  spouse: { label: "vợ chồng", palace: "Phu Thê", certainty: "exact", note: "MLTC tr.985–987: lục thân khác thì đổi cung theo thân phận (Phụ Mẫu, Phu Thê…)" },
  sibling: { label: "anh chị em", palace: "Huynh Đệ", certainty: "exact", note: "MLTC tr.985–987: ví dụ gốc xét cung Huynh Đệ" },
  friend: {
    label: "bạn bè, đối tác",
    palace: "Nô Bộc",
    certainty: "interpretive",
    note: "MLTC tr.985–987 chỉ nói 'đổi cung theo thân phận', không nêu cung cho bạn bè, đối tác; ở đây dùng cung Nô Bộc (Giao Hữu)",
  },
};

export const SOURCES = {
  stemCombination: "TVTH tr.6–8",
  stemBreak: "TVTH tr.6–8",
  branch: "TVTH tr.8–9; MLTC tr.4–5",
  nayin: "TVTH tr.9–10; NP2 tr.59–63",
  spouseAge: "NP2 tr.59–63",
  starSystems: "MLTC tr.903–944",
  bureau: "MLTC tr.903–944",
  projection: "MLTC tr.985–987",
} as const;

export const KB_FILES = {
  stems: "01_Du-lieu-lap-la-so/02_Can-chi-ngu-hanh/01_Can-chi-am-duong-ngu-hanh.md",
  branches: "01_Du-lieu-lap-la-so/02_Can-chi-ngu-hanh/02_Hop-xung-tam-hop.md",
  nayin: "01_Du-lieu-lap-la-so/02_Can-chi-ngu-hanh/03_Nap-am-60-nam.md",
  marriage: "11_Chu-de-luan/04_Hon-nhan/01_Cach-xem-cung-va-sao-lien-quan.md",
  marriageExamples: "11_Chu-de-luan/04_Hon-nhan/04_Vi-du.md",
  projection: "06_Cac-vong-sao/01_Vong-Thai-Tue/04_Thai-Tue-nhap-quai.md",
} as const;

export const stemBreakTarget = (stem: number): number => mod(stem + 4, 10);

export const BUREAU_TEMPERAMENT_MLTC: Readonly<Record<Element, string>> = {
  Thủy: "nhanh trí và dễ thay đổi",
  Mộc: "khỏe mạnh và ngăn nắp",
  Kim: "chính trực và sắc bén",
  Thổ: "thực dụng và thực tế, lười biếng",
  Hỏa: "chủ động và kích động",
};

export interface SkippedRule {
  readonly rule: string;
  readonly source: string;
  readonly reason: string;
}

export const SKIPPED_COMPARE_RULES: readonly SkippedRule[] = [
  {
    rule: "Cấm kỵ của 12 con giáp",
    source: "MLTC tr.6–7",
    reason: "bảng nói cung, sao mà một tuổi sợ khi vận của chính người đó đi qua, không phải quan hệ giữa hai tuổi",
  },
  {
    rule: "Phạm Thái Tuế, xung Thái Tuế",
    source: "MLTC tr.791–792",
    reason: "nói về tuổi gặp năm lưu niên, không phải hai người với nhau",
  },
  {
    rule: "Năm kết hôn: can lưu niên (tiểu hạn) hai bên không làm chính tinh Mệnh đối phương Hóa Kỵ",
    source: "MLTC tr.903–944",
    reason: "cần năm xem; tool này chỉ so lá số gốc",
  },
  {
    rule: "Thái Tuế nhập quẻ trên vòng đại hạn, lưu niên, lưu thời, lưu phân",
    source: "MLTC tr.985–987",
    reason: "cần năm hoặc thời điểm xem; ở đây chỉ chiếu lên lá số gốc",
  },
  {
    rule: "Tinh diệu hỗ viên",
    source: "MLTC tr.903–944",
    reason: "sách không định nghĩa đủ chặt 'hai cung tương tự' để tính",
  },
  {
    rule: "Quan hệ địa chi giữa cung Mệnh hai người (Mệnh – Mệnh)",
    source: "—",
    reason: "kho tri thức không có quy tắc so cung Mệnh hai người theo địa chi",
  },
];
