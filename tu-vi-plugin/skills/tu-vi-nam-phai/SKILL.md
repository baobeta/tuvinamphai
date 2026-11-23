---
name: tu-vi-nam-phai
description: Use when the user asks about Tử Vi Đẩu Số / Tử Vi Nam Phái in Vietnamese — lập lá số, xem lá số, an sao, chính tinh, phụ tinh, Tứ Hóa, cách cục, cung, đại hạn, tiểu hạn, lưu niên, hợp tuổi, giờ sinh — and the tu-vi plugin's MCP tools (build_chart, analyze_chart, topic_reading, scan_years…) are available.
---

# Tử Vi Nam Phái qua MCP server của plugin

Plugin này có MCP server `tuvi` chạy cục bộ, chứa toàn bộ quy tắc an sao, phân tích và kho tri thức (MLTC, TVTH, NP1, NP2 và 426 file kho). Hướng dẫn chi tiết cách dùng tool nằm trong phần instructions của server; skill này chỉ nhắc các điểm chính.

## Nguyên tắc
- Mọi phép tính có quy tắc cố định thì gọi tool, không tự nhẩm: đổi lịch, đổi giờ, can chi, hợp xung, Cục, an sao, vận hạn.
- Lập lá số bằng `build_chart`, giữ `chart_id` và dùng nó cho mọi tool phân tích sau đó.
- Luận lá số: `analyze_chart` trước, rồi `topic_reading`, `analyze_palace`, `detect_patterns` khi cần chi tiết. Nghĩa của sao: `lookup_star_meaning` hoặc `chart_star_references`, sau đó mới `search_kb`.
- Mỗi khẳng định có nguồn dạng (TVTH tr.45), lấy từ kết quả tool hoặc file kho. Không bịa số trang.
- Kết quả tool ghi "khớp chắc chắn" hoặc "khớp theo cách hiểu"; với loại thứ hai phải nêu giả định. Nêu dị bản giữa các sách.
- Không phán chắc chắn về cái chết, bệnh nặng hay tai họa của người thật; không chẩn đoán bệnh.

## Xem trọn một lá số
Người dùng có thể gõ `/tu-vi:xem <ngày/tháng/năm> <giờ> <nam|nữ>`. Khi người dùng đưa đủ dữ kiện và muốn xem toàn bộ lá số mà không dùng lệnh, làm như hướng dẫn "Xem trọn một lá số" trong instructions của server: thu thập dữ kiện bằng tool trước, viết 10 phần, lập luận dữ kiện → quy tắc có nguồn → kết luận.
