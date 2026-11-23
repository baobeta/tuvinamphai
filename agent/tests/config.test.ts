import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig, REPO_ROOT } from "../src/config.js";

describe("loadConfig", () => {
  it("mặc định trỏ về gốc repo tuvinamphai (thư mục cha của agent/)", () => {
    const cfg = loadConfig({}, "/bat/ky/dau");
    expect(cfg.corpusRoot).toBe(REPO_ROOT);
    expect(path.basename(path.join(import.meta.dirname, "..", ".."))).toBe(path.basename(REPO_ROOT));
    expect(cfg.kbRoot).toBe(path.join(REPO_ROOT, "Kien-thuc-Tu-Vi-Nam-Phai"));
  });
  it("thư mục lưu lá số mặc định nằm trong .omc của workspace, tắt được bằng off", () => {
    expect(loadConfig({}, "/x").chartDir).toBe(path.join(REPO_ROOT, ".omc", "charts"));
    expect(loadConfig({ TUVI_CHART_DIR: "off" }).chartDir).toBeNull();
    expect(loadConfig({ TUVI_CHART_DIR: "c" }, "/tmp").chartDir).toBe("/tmp/c");
  });
  it("biến môi trường chưa được thay giá trị (còn ${…}) thì bỏ qua, dùng mặc định", () => {
    const cfg = loadConfig({ TUVI_CHART_DIR: "${CLAUDE_PLUGIN_DATA}/charts", TUVI_WORKSPACE: "${X}" }, "/x");
    expect(cfg.corpusRoot).toBe(REPO_ROOT);
    expect(cfg.chartDir).toBe(path.join(REPO_ROOT, ".omc", "charts"));
  });
  it("TUVI_WORKSPACE ghi đè, tính theo thư mục đang chạy", () => {
    expect(loadConfig({ TUVI_WORKSPACE: "x" }, "/tmp").corpusRoot).toBe("/tmp/x");
  });
  it("từ chối effort lạ và số vòng không hợp lệ", () => {
    expect(() => loadConfig({ TUVI_EFFORT: "ultra" })).toThrow(/TUVI_EFFORT/);
    expect(() => loadConfig({ TUVI_MAX_ITERATIONS: "0" })).toThrow(/TUVI_MAX_ITERATIONS/);
  });
});
