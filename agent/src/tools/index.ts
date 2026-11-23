import { ANALYSIS_TOOLS } from "./analysis-tools.js";
import { CALENDAR_TOOLS } from "./calendar-tools.js";
import { CHART_TOOLS } from "./chart-tools.js";
import { COMPARE_TOOLS } from "./compare-tools.js";
import { GRID_TOOLS } from "./grid-tools.js";
import { KB_TOOLS } from "./kb-tools.js";
import { READING_TOOLS } from "./reading-tools.js";
import type { ToolSpec } from "./registry.js";
import { SCAN_TOOLS } from "./scan-tools.js";

export const ALL_TOOLS: ToolSpec[] = [
  ...KB_TOOLS,
  ...READING_TOOLS,
  ...CALENDAR_TOOLS,
  ...CHART_TOOLS,
  ...ANALYSIS_TOOLS,
  ...SCAN_TOOLS,
  ...COMPARE_TOOLS,
  ...GRID_TOOLS,
] as ToolSpec[];
