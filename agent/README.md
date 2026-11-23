# agent – Tử Vi agent harness

Agent harness hỏi đáp **Tử Vi Nam Phái** trên kho tri thức riêng
([`Kien-thuc-Tu-Vi-Nam-Phai`](../Kien-thuc-Tu-Vi-Nam-Phai/README.md), 426 file) và 4 cuốn sách gốc.
Agent dùng Claude qua Messages API. Harness tự giữ vòng lặp, tự chạy tool và tự quản lịch sử hội thoại.

## Chạy

```bash
cd agent
pnpm install
cp .env.example .env              # điền ANTHROPIC_API_KEY, hoặc dùng `ant auth login`
pnpm dev                          # REPL nhiều lượt: /reset, /usage, /exit
pnpm ask "Cự Môn ở Thìn, tuổi Tân thì luận thế nào?"
pnpm test                         # không gọi API
pnpm typecheck
```

Agent tự tìm kho tri thức và sách gốc ở thư mục cha (gốc repo); đặt `TUVI_WORKSPACE` nếu muốn trỏ chỗ khác. Các biến môi trường được mô tả trong `.env.example`.

## Kiến trúc

```
src/
  cli.ts                 REPL + chế độ --once, in tool call và thống kê token
  config.ts              đọc biến môi trường (model, effort, giới hạn vòng lặp, đường dẫn)
  agent/
    harness.ts           TuViAgent: vòng lặp stream → tool_use → tool_result → … → end_turn
    system-prompt.ts     prompt cố định (để prompt cache khớp tiền tố)
  kb/
    normalize.ts         chuẩn hóa tiếng Việt: có dấu / bỏ dấu, bigram
    document.ts          đọc phần đầu file kho: tiêu đề, "Trả lời câu hỏi", "Từ khóa", "Nguồn chính"
    index.ts             nạp toàn bộ kho vào bộ nhớ
    search.ts            chấm điểm và xếp hạng (scoreDocument)
  tools/
    registry.ts          ToolSpec (zod là nguồn duy nhất cho schema), kiểm tra input, bắt lỗi thành is_error
    kb-tools.ts          search_kb · read_kb_file · list_kb · grep_corpus · read_corpus_file
    paths.ts             khóa đường dẫn trong thư mục gốc (chặn ../, đường dẫn tuyệt đối, symlink)
tests/                   36 test, dùng stream giả, không tốn token
```

**Vòng lặp (`TuViAgent.ask`):**
- **Mỗi lượt:** stream một lượt model → `tool_use` thì chạy song song các tool → gửi **mọi** `tool_result` trong một message user → lặp lại.
- **Điều kiện dừng:**

  | `stop_reason` | Xử lý |
  |---|---|
  | `end_turn` | xong |
  | `refusal` | dừng; không chạy tool, không ghi lượt đó vào lịch sử |
  | `max_tokens` | dừng; không chạy tool có input bị cắt |
  | `pause_turn` | gửi lại để server chạy tiếp |
  | quá `TUVI_MAX_ITERATIONS` | dừng |

- **Lỗi:** lỗi API được ném ra (SDK đã tự retry 429/5xx); mất kết nối giữa stream thì làm lại lượt đó, tối đa 2 lần.

**Request:**
- **Model và effort:** `claude-opus-5-5` với `effort: high`, sửa được qua biến môi trường. Không gửi `thinking`, nên model dùng thinking thích ứng mặc định.
- **Prompt cache:** có hai breakpoint, một ở system prompt (đi kèm cả tools), một tự động ở cuối lịch sử hội thoại.
- **Fallback khi bị từ chối:** bật beta `server-side-fallback-2026-07-01` với `fallbacks: "default"`. Nếu model từ chối vì chính sách, server tự chạy lại request trên model dự phòng phù hợp. Muốn tắt thì xóa hai trường này trong `harness.ts`.
- **Tool:** bật `eager_input_streaming`, nên server không kiểm tra input; harness kiểm tra lại bằng zod trước khi chạy.

## Mở rộng

- **Thêm tool:** viết một `defineTool({ name, description, schema: z.strictObject(...), run })` rồi thêm vào `ALL_TOOLS`.
- **Chất lượng tìm kiếm:** chỉnh `scoreDocument` trong `src/kb/search.ts`.
- **Hướng tiếp theo nên làm:** thêm tool `lap_la_so` để an sao tất định từ âm lịch (quy tắc ở nhánh `01_Du-lieu-lap-la-so`); làm bộ eval gồm các câu hỏi có đáp án và nguồn đúng.
