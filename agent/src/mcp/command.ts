import { READING_GUIDE } from "../agent/system-prompt.js";

export const XEM_ARGUMENT_HINT = "<ngày/tháng/năm> <giờ> <nam|nữ> [âm] [nhuận] [tên]";

export const PLUGIN_TOOL_PATTERN = "mcp__plugin_tu-vi_tuvi__*";

export function renderXemCommand(): string {
  return [
    "---",
    "description: Xem trọn lá số Tử Vi Nam Phái (chính tinh, phụ tinh, vòng sao, tam phương tứ chính, cách cục, 12 cung, đại vận, lời khuyên)",
    `argument-hint: ${XEM_ARGUMENT_HINT}`,
    `allowed-tools: ${PLUGIN_TOOL_PATTERN}`,
    "---",
    "",
    "Dữ kiện người dùng đưa: $ARGUMENTS",
    "",
    "Đọc từ dữ kiện trên: ngày/tháng/năm sinh, giờ sinh (giờ đồng hồ như 9:10 hoặc canh giờ như Tỵ), giới tính, chữ \"âm\" nếu là âm lịch, \"nhuận\" nếu sinh tháng nhuận, và tên nếu có. Không có chữ \"âm\" thì hiểu là dương lịch. Thiếu ngày, giờ hoặc giới tính thì hỏi lại trước khi làm gì khác.",
    "",
    "Sau đó xem trọn lá số Tử Vi Nam Phái cho người này. Phân tích chi tiết mọi phần của lá số: chính tinh, phụ tinh, Tứ Hóa, Tuần Triệt, vòng Thái Tuế, Bác Sĩ, Tràng Sinh, cung xung chiếu và các cung phụ trợ, tam phương tứ chính, cách cục, mười hai cung và từng đại vận mười năm. Mỗi luận giải phải có lập luận chặt chẽ: dữ kiện trên lá số, quy tắc cổ thư diễn đạt bằng lời thường, rồi mới đến kết luận, viết dễ hiểu cho người không chuyên. Cuối cùng đưa ra lời khuyên hợp lý về sự nghiệp, công việc, gia đình, tình cảm và sức khỏe: việc nên làm và việc nên tránh, mỗi lời khuyên gắn với dữ kiện cụ thể trên lá số.",
    "",
    "Các tool nhắc tới dưới đây là tool của MCP server `tuvi` trong plugin này (tên đầy đủ có tiền tố `mcp__plugin_tu-vi_tuvi__`).",
    "",
    READING_GUIDE,
    "",
  ].join("\n");
}
