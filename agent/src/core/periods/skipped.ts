export interface SkippedRule {
  readonly id: string;
  readonly reason: string;
}

export const SKIPPED_RULES: readonly SkippedRule[] = [
  {
    id: "PH-THAI-TUE-BANG-B",
    reason: "Bảng Thái Tuế B (TVTH tr.144-149) là OCR dạng khung chữ: nhiều ô (?) / UNKNOWN, cặp sao không rõ cần đồng cung hay một sao, \"Dương\" lẫn Thái Dương và Kình Dương, cùng sao có cả ở tốt và xấu mà không có quy tắc ưu tiên (A-BANGB-*).",
  },
  {
    id: "PH-HAN-SU-VIEC-TRIGGERS",
    reason: "Các cách hạn theo sự việc (phát đạt, hôn phối, sinh con, tật lối, tang, cách gọi hạn, MLTC-846/865/883/903/944) đều cần phạm vi \"gặp/hội\" (A-GAP-SCOPE), Tam Không (A-TAMKHONG), phân biệt sao gốc/sao lưu, giải tinh, cát/hung chiếm 2/3 — sách không định nghĩa.",
  },
  {
    id: "MLTC-848-LUU-NGUYET-NHAT",
    reason: "130 quy tắc lưu nguyệt/lưu nhật MLTC tr.848-861 cần can Lưu Nhật (A-LUU-STEMS) và phạm vi hội chiếu; nhiều quy tắc ghi \"chỉ mang tính tham khảo\".",
  },
  {
    id: "PH-TRUNG-PHUNG-TRIGGERS",
    reason: "Các cách lưỡng hạn TVTH tr.137 (Trúc La, Thương Sứ, Kình Đà, Tuần Triệt, Đế ngộ Không vong) cần phạm vi \"gặp\" và tập giải tinh chưa định nghĩa; nội dung sinh tử phải giữ nhãn cổ thư.",
  },
  {
    id: "PH-CHINH-TINH-NHAP-HAN-LOOKUP",
    reason: "Sách không nói \"nhập hạn\" là đại hạn, tiểu hạn hay cả hai; phần lớn dòng còn phụ thuộc miếu hãm (spec khác).",
  },
  {
    id: "PH-THAI-TUE-NHAP-QUE",
    reason: "Cần dữ liệu năm sinh người khác; \"Song Lộc giáp Mệnh\" và độ \"mạnh\" của Lộc/Quyền/Kỵ chưa định nghĩa thao tác.",
  },
  {
    id: "A-TUAN-TRIET-AGE",
    reason: "Ngưỡng tuổi 32 (TVTH tr.73-74) và 30–32 (han-van.md) mâu thuẫn, chỉ ảnh hưởng trọng số Tuần Triệt, không ảnh hưởng vị trí.",
  },
  {
    id: "A-UNDEFINED-LUU",
    reason: "Lưu Xương, Lưu Khúc, Lưu Hồng Loan, Lưu Thiên Hỷ, Lưu Sát được MLTC nhắc nhưng không có cách an.",
  },
];
