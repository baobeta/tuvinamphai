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

## Thử tool không cần API key
Gọi thẳng các tool, không qua Claude:
```bash
pnpm tool --list
pnpm tool convert_calendar '{"direction":"solar_to_lunar","year":1990,"month":8,"day":15}'
pnpm tool build_chart '{"birth":{"calendar":"solar","year":1990,"month":8,"day":15,"hour":9,"minute":10,"gender":"nam"}}' \
          analyze_chart '{"chart_id":"@last"}' \
          year_forecast '{"chart_id":"@last","view_year":2026}'
```
Có thể gọi nhiều tool nối tiếp trong một lệnh; chúng dùng chung bộ nhớ lá số. `"@last"` là `chart_id` của lá số vừa lập. `pnpm test` chạy toàn bộ test, gồm cả vòng lặp agent với stream giả.

## Kiến trúc

Code chia ba tầng theo kiểu **functional core, imperative shell**:
- `core/` chỉ có hàm thuần: không I/O, không `throw`, dữ liệu `readonly`. Lỗi đầu vào trả về `Result<T>`, nên test chỉ cần gọi hàm rồi so kết quả.
- `tools/` là shell: parse input bằng zod, gọi core, đổi `Result` thành text trả cho model hoặc thành lỗi `is_error`.
- `agent/`, `cli.ts` lo vòng lặp với Claude API và giao tiếp terminal.

```
src/
  core/                    hàm thuần, không I/O
    result.ts              Result<T>, ok, err
    calendar/              lịch và can chi
      stem-branch.ts       10 can, 12 chi, can chi năm/tháng/ngày/giờ, 60 hoa giáp, Tuần không
      five-elements.ts     ngũ hành của can/chi, sinh khắc
      nayin.ts             nạp âm 60 năm, số Cục
      relations.ts         tam hợp, lục hợp, lục xung, lục hại, tứ hành xung, tam phương tứ chính, can hợp
      lunar.ts             dương lịch ↔ âm lịch (thuật toán Hồ Ngọc Đức, có tham số múi giờ)
      vietnam-calendar.ts  múi giờ lịch Việt Nam theo thời kỳ: UTC+8 trước 1968, UTC+7 từ 1968 (mặc định)
      hours.ts             giờ đồng hồ → canh giờ, hiệu chỉnh giờ, cảnh báo gần ranh giới
    chart/                 lá số
      types.ts             kiểu dữ liệu và lựa chọn dị bản mặc định
      birth.ts             dữ kiện sinh dương/âm → ngày âm + chi giờ; quy tắc tháng nhuận
      palaces.ts           Mệnh, Thân, 12 cung chức, can cung, Cục, chiều thuận/nghịch
      main-stars.ts        an Tử Vi theo Cục và ngày, 14 chính tinh, miếu/vượng/hãm
      minor-stars.ts       phụ tinh theo can, chi, tháng, ngày, giờ; Tuần, Triệt
      rings.ts             vòng Bác Sĩ, Tràng Sinh, Thái Tuế
      transformations.ts   Tứ Hóa (có dị bản Canh, Nhâm)
      periods.ts           đại hạn, tiểu hạn, đồng hạn, lưu nguyệt, sao lưu niên
      build-chart.ts       ghép tất cả thành Chart
      render.ts            Chart → bảng markdown
      render-grid.ts       Chart → địa bàn 4×4 (khung chữ hoặc bảng markdown)
    analysis/              phân tích trên lá số đã lập
      chart-query.ts       truy vấn: sao ở cung, tam phương tứ chính, giáp cung
      finding.ts           Finding: "khớp chắc chắn" / "khớp theo cách hiểu", điều kiện thỏa, phá cách, giả định, dị bản
      natal-profile.ts     bản mệnh: chủ Mệnh/Thân, Cục với bản mệnh, sinh vượng bại tuyệt, âm dương lý, vòng Thái Tuế, vô chính diệu
      palace-analysis.ts   một cung: ngũ hành sao/cung, tam phương tứ chính, giáp cung, nhị hợp, lục hại, Tuần Triệt
    patterns/              cách cục: 32 cách tốt, 26 cách xấu, quy tắc phá cách chung
    reading/               ánh xạ sao → file kho (theo cấu trúc thư mục, không dò toàn văn); luận theo 10 chủ đề của 11_Chu-de-luan
    scan/                  quét nhiều năm theo tiêu chí hoặc mục tiêu (hôn nhân, tài lộc…), gồm các hạn theo sự việc có nguồn
    compare/               so hai lá số: can chi, nạp âm, quy tắc vợ chồng (NP2, MLTC), Thái Tuế nhập quẻ
    periods/               vận hạn theo lớp (đại hạn, lưu đại hạn, tiểu hạn, lưu niên/nguyệt/nhật/thời), dòng thời gian cả đời, giờ xấu trẻ em, soát giờ sinh
  kb/                      kho tri thức: đọc, chuẩn hóa tiếng Việt, tìm kiếm
  tools/                   shell cho agent
    registry.ts            ToolSpec (zod là nguồn duy nhất cho schema), kiểm tra input, bắt lỗi thành is_error
    kb-tools.ts            search_kb · read_kb_file · list_kb · grep_corpus · read_corpus_file
    calendar-tools.ts      convert_calendar · convert_hour · stem_branch_info · branch_relations · element_relation · determine_bureau
    chart-tools.ts         build_chart · year_forecast; resolveChart (chart_id hoặc birth)
    chart-store.ts         kho lá số LRU theo chart_id (hash của dữ kiện sinh + tùy chọn); lưu dữ kiện ra .omc/charts/ để phiên sau dùng lại (TUVI_CHART_DIR=off để tắt)
    reading-tools.ts       lookup_star_meaning · chart_star_references · topic_reading
    scan-tools.ts          scan_years
    compare-tools.ts       compare_charts
    grid-tools.ts          render_chart_grid
    analysis-tools.ts      analyze_chart · detect_patterns · list_patterns · natal_profile · analyze_palace · period_layers · lifetime_timeline · child_hazard_hours · birth_hour_candidates
    index.ts               ALL_TOOLS
    paths.ts               khóa đường dẫn trong thư mục gốc
  agent/
    harness.ts             TuViAgent: vòng lặp stream → tool_use → tool_result → … → end_turn
    system-prompt.ts       prompt cố định (để prompt cache khớp tiền tố)
  cli.ts · config.ts
  tool-cli.ts            pnpm tool: gọi tool trực tiếp, không cần API key
tests/
  core/                    test thuần cho lịch và lá số, không cần fixture
  *.test.ts                test tool, kho tri thức, harness (stream giả, không tốn token)
```

**Chạy nhanh:** `build_chart` trả `chart_id`; các tool sau chỉ nhận id nên model không phải gửi lại dữ kiện và lá số không phải lập lại. `analyze_chart` gộp bản mệnh, cách cục, cung Mệnh và Thân trong một lần gọi (khoảng 25 ms).

**Ít token:** các tool phân tích có `detail: "brief" | "full"`. `analyze_chart` mặc định brief (khoảng 4.000 ký tự so với 16.600 bản full); `topic_reading` brief khoảng 2.300 ký tự.

**Mức chắc chắn:** sách nhiều chỗ không định nghĩa chặt ("gặp", "hội", "nhiều sát tinh"…). Mỗi kết quả ghi "khớp chắc chắn" hoặc "khớp theo cách hiểu" kèm giả định đã dùng; các dị bản là tùy chọn. Quy tắc không thể tính chắc (Bảng B Thái Tuế, hạn theo sự việc…) nằm trong `SKIPPED_RULES` / `UNSUPPORTED_PATTERNS` kèm lý do.

**Đối chiếu lá số mẫu:** `tests/core/sample-charts.test.ts` so 29 lá số mẫu của kho (TVTH, NP1, NP2) với engine: 888 vị trí sao, 90 Tứ Hóa, cách cục sách gọi tên, Mệnh, Thân, Cục, 12 cung. Chỗ sách tự lệch hoặc OCR được ghi trong `knownDiscrepancies` của từng fixture, kèm trích trang.

**Test chuẩn của phần lá số:**
- Lá số mẫu Lã Thái Hậu (TVTH tr.159): so vị trí từng sao, hơn 100 sao.
- Ví dụ Kỷ Mùi (TVTH tr.10–12, tr.165).
- Bảng Cục 5×12 (MLTC bảng 7) và bảng Tử Vi 5 cục × 30 ngày.
- Lịch âm: đổi qua đổi lại khớp cho mọi ngày từ 1900 đến 2100. Kiểm thêm Tết 1985, khi Việt Nam (UTC+7) ăn Tết sớm hơn Trung Quốc (UTC+8) một tháng, và Tết Mậu Thân 1968 ở miền Bắc (29/1/1968).

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
