# Tử Vi Nam Phái

Bộ công cụ xem Tử Vi Nam Phái dựa trên sách, gồm:

- **Plugin cho Claude Code**: lập lá số, luận giải, xem vận hạn ngay trong Claude, không cần API key.
- **Kho tri thức** 426 bài ngắn, mỗi bài trả lời một câu hỏi, tổng hợp từ bốn cuốn sách Tử Vi Nam Phái.
- **Bản chữ của bốn cuốn sách** gốc, chia theo chương mục.
- **Agent dòng lệnh** (TypeScript) cho ai muốn chạy bằng Claude API.

Mọi phép tính (đổi âm dương lịch, an sao, Cục, đại hạn, tiểu hạn, cách cục…) chạy bằng code theo quy tắc trong sách, không để AI tự nhẩm.

## Bắt đầu nhanh: dùng trong Claude Code

Cần có [Claude Code](https://claude.com/claude-code) và [Node.js](https://nodejs.org) 22 trở lên.

**1. Cài plugin** (chạy trong terminal):

```bash
claude plugin marketplace add baobeta/tuvinamphai
claude plugin install tu-vi@tuvinamphai
```

Hoặc gõ ngay trong Claude Code:

```
/plugin marketplace add baobeta/tuvinamphai
/plugin install tu-vi@tuvinamphai
```

**2. Mở một phiên Claude Code mới** và dùng:

| Bạn muốn | Gõ |
|---|---|
| Xem trọn lá số (dương lịch) | `/tu-vi:xem 15/8/1990 9:10 nam` |
| Xem trọn lá số (âm lịch, giờ theo canh giờ) | `/tu-vi:xem âm 25/6/1990 Tỵ nữ Lan` |
| Sinh tháng nhuận | `/tu-vi:xem âm nhuận 10/2/2023 Thìn nam` |
| Hỏi một ý | "Lá số của tôi (15/8/1990, 9h10, nam) năm 2027 thế nào?" |
| Tìm năm thuận lợi | "Từ 2025 đến 2035 năm nào thuận cho việc cưới hỏi?" |
| Xem hợp tuổi | "So lá số của tôi với người sinh 3/2/1992, 20h, nữ" |
| Không nhớ chắc giờ sinh | "Tôi sinh khoảng 7 đến 10 giờ sáng, giúp tôi soát giờ" |

Lần đầu Claude gọi công cụ của plugin, Claude Code sẽ hỏi quyền; chọn cho phép. Lệnh `/tu-vi:xem` đã được cho phép sẵn.

Bài xem trọn lá số đi qua 10 phần: dữ kiện lá số và địa bàn, bản mệnh, cung Mệnh và Thân, các vòng sao, cách cục, mười hai cung, từng đại vận mười năm, năm hiện tại và năm tới, lời khuyên (sự nghiệp, tài chính, gia đình, tình cảm, sức khỏe), và những điểm cần lưu ý. Mỗi ý đi theo ba bước: dữ kiện trên lá số → quy tắc cổ thư → kết luận.

## Trong repo có gì

| Thư mục | Nội dung |
|---|---|
| [`tu-vi-plugin/`](tu-vi-plugin) | Plugin Claude Code: MCP server đã build (chạy bằng `node`), dữ liệu, lệnh `/tu-vi:xem`, skill |
| [`Kien-thuc-Tu-Vi-Nam-Phai/`](Kien-thuc-Tu-Vi-Nam-Phai/README.md) | Kho tri thức 426 bài theo 13 nhánh: lập lá số, bản mệnh, 12 cung, chính tinh, phụ tinh, vòng sao, Tuần Triệt, quan hệ cung, cách cục, vận hạn, chủ đề luận, nguyên tắc, lá số mẫu |
| [`agent/`](agent/README.md) | Mã nguồn TypeScript: lõi tính toán, 29 công cụ, MCP server, agent dòng lệnh, 2.200+ test |
| `Menh-Ly-Thien-Co_Tu-Vi-Nam-Phai/`, `Tu-Vi-Thuc-Hanh/`, `Tu-Vi-Nam-Phai_Phan-1/`, `Tu-Vi-Nam-Phai_Phan-2/` | Bản chữ của bốn cuốn sách, chia theo chương mục |

Bốn cuốn sách:

| Sách | Bản gốc | Ghi chú |
|---|---|---|
| [Mệnh Lý Thiên Cơ – Tuyển tập Tử Vi Nam Phái](Menh-Ly-Thien-Co_Tu-Vi-Nam-Phai/README.md) (Lê Quang Lăng) | PDF có chữ, 1000 trang | 5 chương, 139 mục |
| [Tử Vi Thực Hành](Tu-Vi-Thuc-Hanh/README.md) (Dịch Lý Huyền Cơ) | PDF có chữ, 201 trang | 8 phần, 132 mục, ảnh lá số mẫu |
| [Tử Vi Nam Phái – Phần 1](Tu-Vi-Nam-Phai_Phan-1/README.md) | PDF scan, 282 trang | chữ nhận dạng bằng OCR, có thể sai chính tả |
| [Tử Vi Nam Phái – Phần 2](Tu-Vi-Nam-Phai_Phan-2/README.md) | PDF scan, 286 trang | chữ nhận dạng bằng OCR, có thể sai chính tả |

## Độ chính xác

- Quy tắc an sao lấy từ Tử Vi Thực Hành, đối chiếu Mệnh Lý Thiên Cơ.
- Đã so với **29 lá số mẫu** trong sách: khớp cả 888 vị trí sao, Tứ Hóa, Mệnh, Thân, Cục và các cách cục sách gọi tên.
- Lịch âm theo thuật toán thiên văn Hồ Ngọc Đức. Ngày trước 1968 tính theo lịch UTC+8 mà người Việt dùng thời đó, từ 1968 theo UTC+7.
- Chỗ các sách nói khác nhau (ví dụ Tứ Hóa tuổi Canh, Khôi Việt tuổi Canh Tân) được đưa thành tùy chọn; kết quả luôn nói rõ điểm nào chưa chắc.

## Các cách dùng khác

**Agent dòng lệnh (cần Claude API key):**

```bash
cd agent
pnpm install
cp .env.example .env        # điền ANTHROPIC_API_KEY
pnpm dev                    # rồi gõ: /xem 15/8/1990 9:10 nam
```

**Gọi thẳng một công cụ, không cần API key** (để thử hoặc kiểm tra):

```bash
cd agent && pnpm install
pnpm tool --list
pnpm tool build_chart '{"birth":{"calendar":"solar","year":1990,"month":8,"day":15,"hour":9,"minute":10,"gender":"nam"}}' \
          render_chart_grid '{"chart_id":"@last"}'
```

**Sửa code hoặc kho rồi cài plugin từ máy mình:**

```bash
cd agent && pnpm install && pnpm test && pnpm build:plugin
claude plugin marketplace add "$(pwd)"   # chạy ở thư mục gốc repo
claude plugin install tu-vi@tuvinamphai
```

Chi tiết kiến trúc và từng công cụ: [agent/README.md](agent/README.md).

## Lưu ý

- Tử vi chỉ để tham khảo. Bài luận không thay cho lời khuyên y tế, pháp lý hay tài chính.
- Bản quyền nội dung bốn cuốn sách thuộc về tác giả và nhà xuất bản; bản chữ trong repo phục vụ nghiên cứu.
- Lá số bạn lập được lưu trên máy bạn (thư mục dữ liệu của plugin), không gửi đi đâu ngoài phiên Claude của bạn.
