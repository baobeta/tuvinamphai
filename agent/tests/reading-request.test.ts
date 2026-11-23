import { describe, expect, it } from "vitest";
import { buildReadingPrompt, parseReadingCommand } from "../src/agent/reading-request.js";
import { ANSWER_STYLE, READING_GUIDE, SYSTEM_PROMPT } from "../src/agent/system-prompt.js";
import { MCP_INSTRUCTIONS } from "../src/mcp/server.js";
import { renderXemCommand } from "../src/mcp/command.js";
import { ALL_TOOLS } from "../src/tools/index.js";
import { vietnamDateOf } from "../src/tools/calendar-tools.js";

const parse = (text: string) => {
  const result = parseReadingCommand(text);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe("/xem: dựng yêu cầu xem trọn lá số", () => {
  it("dương lịch, giờ đồng hồ, giới tính", () => {
    expect(parse("/xem 15/8/1990 9:10 nam")).toEqual({
      calendar: "dương lịch",
      day: 15,
      month: 8,
      year: 1990,
      isLeapMonth: false,
      time: "9:10",
      gender: "nam",
      name: "",
    });
  });

  it("âm lịch, tháng nhuận, canh giờ, tên, thứ tự tùy ý", () => {
    expect(parse("/xem Lan âm nhuận 10/2/2023 Thìn nữ")).toMatchObject({
      calendar: "âm lịch",
      isLeapMonth: true,
      time: "Thìn",
      gender: "nữ",
      name: "Lan",
    });
    expect(parse("/xem 1/1/2000 23h nu").time).toBe("23h");
  });

  it("thiếu dữ kiện thì báo kèm cách dùng", () => {
    for (const text of ["/xem", "/xem 15/8/1990 nam", "/xem 15/8/1990 9:10", "/xem 9:10 nam"]) {
      const result = parseReadingCommand(text);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error).toContain("Cách dùng");
    }
    expect(parseReadingCommand("/xem nhuận 1/2/2023 9:10 nam").ok).toBe(false);
  });

  it("yêu cầu dựng ra có đủ ý của mẫu: chi tiết, lập luận, lời khuyên năm lĩnh vực", () => {
    const prompt = buildReadingPrompt(parse("/xem âm 25/6/1990 Tỵ nữ Lan"));
    expect(prompt).toContain("Tên: Lan");
    expect(prompt).toContain("25/6/1990 âm lịch");
    for (const phrase of ["vòng Thái Tuế", "tam phương tứ chính", "đại vận mười năm", "lập luận", "sự nghiệp", "sức khỏe", "nên tránh"]) {
      expect(prompt).toContain(phrase);
    }
  });
});

describe("system prompt cho chế độ xem trọn lá số", () => {
  it("chỉ nhắc tới tool có thật", () => {
    const names = new Set(ALL_TOOLS.map((tool) => tool.name));
    const section = READING_GUIDE;
    const parameterNames = new Set(["chart_id"]);
    const mentioned = [...section.matchAll(/\b([a-z]+(?:_[a-z]+)+|today)\b/g)].map((match) => match[1]!).filter((name) => !parameterNames.has(name));
    expect(mentioned.length).toBeGreaterThan(8);
    expect(mentioned.filter((name) => !names.has(name))).toEqual([]);
  });

  it("có đủ 10 phần và quy tắc lập luận ba bước", () => {
    expect(SYSTEM_PROMPT).toContain("**Đại vận mười năm**");
    expect(SYSTEM_PROMPT).toContain("**Lời khuyên**");
    expect(SYSTEM_PROMPT).toContain("dữ kiện");
    expect(SYSTEM_PROMPT).toContain("không chẩn đoán bệnh");
  });
});

describe("today", () => {
  it("lấy ngày theo giờ Việt Nam, kể cả khi UTC còn ở ngày hôm trước", () => {
    expect(vietnamDateOf(new Date("2026-02-16T18:30:00Z"))).toEqual({ year: 2026, month: 2, day: 17 });
    expect(vietnamDateOf(new Date("2026-02-16T16:30:00Z"))).toEqual({ year: 2026, month: 2, day: 16 });
  });

  it("tool today trả ngày âm và can chi", async () => {
    const tool = ALL_TOOLS.find((item) => item.name === "today")!;
    const out = await tool.run({}, {} as never);
    expect(out).toContain("Hôm nay (giờ Việt Nam)");
    expect(out).toMatch(/Âm lịch: ngày \d+ tháng \d+/);
    expect(out).toContain("Can chi: năm");
  });
});

describe("bài trả lời không dẫn sách", () => {
  it("system prompt cấm ghi tên sách, trang, tên tool và nhãn kỹ thuật trong bài", () => {
    expect(SYSTEM_PROMPT).toContain("không ghi tên sách hay mã sách");
    expect(SYSTEM_PROMPT).toContain("Nếu người hỏi chủ động hỏi nguồn");
    expect(SYSTEM_PROMPT).not.toMatch(/\((?:TVTH|MLTC|NP1|NP2) tr\./);
    expect(SYSTEM_PROMPT).not.toContain("Mỗi khẳng định có nguồn");
  });

  it("yêu cầu /xem không đòi kèm nguồn", () => {
    expect(buildReadingPrompt(parse("/xem 15/8/1990 9:10 nam"))).not.toContain("kèm nguồn");
  });
});

describe("quy tắc cách viết không bị mất khi instructions bị cắt ngắn", () => {
  const NO_CITATION_RULE = "Không ghi tên sách hay mã sách";

  it("quy tắc cách viết nằm trong 2.500 ký tự đầu của system prompt và instructions MCP", () => {
    expect(SYSTEM_PROMPT.indexOf(ANSWER_STYLE)).toBeLessThan(200);
    expect(MCP_INSTRUCTIONS.indexOf("không ghi tên sách hay mã sách")).toBeGreaterThan(-1);
    expect(MCP_INSTRUCTIONS.indexOf("không ghi tên sách hay mã sách")).toBeLessThan(2_500);
  });

  it("hướng dẫn xem trọn lá số và lệnh /tu-vi:xem tự mang quy tắc không dẫn sách", () => {
    expect(READING_GUIDE).toContain(NO_CITATION_RULE);
    expect(renderXemCommand()).toContain(NO_CITATION_RULE);
  });

  it("mỗi mục của system prompt bắt đầu ở dòng riêng", () => {
    for (const heading of SYSTEM_PROMPT.match(/## [^\n]+/g) ?? []) {
      expect(SYSTEM_PROMPT).toContain(`\n${heading}`);
    }
  });
});
