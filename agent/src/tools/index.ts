import { CALENDAR_TOOLS } from "./calendar-tools.js";
import { CHART_TOOLS } from "./chart-tools.js";
import { KB_TOOLS } from "./kb-tools.js";
import type { ToolSpec } from "./registry.js";

export const ALL_TOOLS: ToolSpec[] = [...KB_TOOLS, ...CALENDAR_TOOLS, ...CHART_TOOLS] as ToolSpec[];
