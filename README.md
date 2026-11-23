# Tài liệu Tử Vi (Tử Vi Nam Phái – Lê Quang Lăng; Tử Vi Thực Hành – Dịch Lý Huyền Cơ)

| Sách | Nguồn | Cách trích xuất |
|---|---|---|
| [Mệnh Lý Thiên Cơ – Tuyển tập Tử Vi Nam Phái](Menh-Ly-Thien-Co_Tu-Vi-Nam-Phai/README.md) | TV34 (1000 trang, PDF có chữ) | tách theo mục lục: 5 chương, 139 mục |
| [Tử Vi Nam Phái – Phần 1](Tu-Vi-Nam-Phai_Phan-1/README.md) | TuViNamPhai1.pdf (282 trang scan) | OCR, 5 phần, 58 mục |
| [Tử Vi Nam Phái – Phần 2](Tu-Vi-Nam-Phai_Phan-2/README.md) | TuViNamPhai2.pdf (286 trang scan) | OCR, 6 khối, 102 mục |
| [Tử Vi Thực Hành – Dịch Lý Huyền Cơ](Tu-Vi-Thuc-Hanh/README.md) | 58_TU_VI_THUC_HANH.pdf (201 trang, PDF có chữ) | tách theo tiêu đề: 8 phần, 132 mục, 16 ảnh lá số |

**Kho tri thức tổng hợp:** [Kien-thuc-Tu-Vi-Nam-Phai/](Kien-thuc-Tu-Vi-Nam-Phai/README.md). Gồm 426 file theo 13 khía cạnh (lập lá số, bản mệnh, 12 cung, chính tinh, phụ tinh, vòng sao, Tuần Triệt, quan hệ cung, cách cục, vận hạn, chủ đề luận, nguyên tắc, lá số mẫu). Mỗi file trả lời một câu hỏi, có ví dụ và trích nguồn về 4 cuốn trên.

Hai cuốn Phần 1/Phần 2 là bản scan: chữ được nhận dạng bằng OCR nên có thể sai chính tả rải rác;
bảng, sơ đồ, chữ viết tay nên đối chiếu với PDF theo số trang ghi ở đầu mỗi file.
Script tái tạo: `split_book.py` (sách TV34), `build_ocr_book.py` (sách scan), `build_tvth.py` (Tử Vi Thực Hành).

**Agent hỏi đáp:** [agent/](agent/README.md) là harness TypeScript (pnpm) dùng Claude API, tra kho tri thức và sách gốc ở trên. Chạy: `cd agent && pnpm install && pnpm dev`.
