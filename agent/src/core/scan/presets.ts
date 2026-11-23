import { TRIGGERS } from "./triggers.js";
import type { CriterionSpec, Goal, RankBy } from "./types.js";

export interface GoalPreset {
  readonly goal: Goal;
  readonly description: string;
  readonly rankBy: RankBy;
  readonly criteria: readonly CriterionSpec[];
}

const triggersFor = (goal: Goal): readonly CriterionSpec[] =>
  TRIGGERS.filter((trigger) => trigger.goals.includes(goal)).map((trigger) => ({ kind: "trigger", id: trigger.id }));

export const GOAL_PRESETS: Readonly<Record<Goal, GoalPreset>> = {
  "hôn nhân": {
    goal: "hôn nhân",
    description: "Bộ sao hôn phối TVTH tr.138-139 ở Phu Thê lưu niên / Đại Tiểu hạn; quy tắc Hồng Loan, Đào Hoa, tứ hóa của MLTC tr.903-944; cảnh báo NP1.",
    rankBy: "net",
    criteria: triggersFor("hôn nhân"),
  },
  "tài lộc": {
    goal: "tài lộc",
    description: "Bộ phát TVTH tr.138; can đại hạn hóa Lộc và tam cát hóa / Hóa Kỵ lưu niên của MLTC tr.865-882, tr.944-957; Lưu Lộc Tồn NP2.",
    rankBy: "net",
    criteria: triggersFor("tài lộc"),
  },
  "công danh": {
    goal: "công danh",
    description: "Bộ thăng quan TVTH tr.138; can đại hạn hóa Quyền và Khoa Quyền Lộc củng chiếu của MLTC tr.865-882.",
    rankBy: "net",
    criteria: triggersFor("công danh"),
  },
  "thi cử": {
    goal: "thi cử",
    description: "Quy tắc thi cử MLTC tr.865-882 mục 2.2.3 (7, 8, 10, 11) và bộ đại đăng khoa TVTH tr.138.",
    rankBy: "net",
    criteria: triggersFor("thi cử"),
  },
  "sức khỏe": {
    goal: "sức khỏe",
    description: "Năm cần giữ gìn: tự Hóa Kỵ, Tật Ách Kỵ xung (MLTC), Tang Hỏa Linh (TVTH), sao lưu xấu (NP1, NP2), tuổi kỵ, cục kỵ hành, trùng phùng.",
    rankBy: "count",
    criteria: [...triggersFor("sức khỏe"), { kind: "taboo" }, { kind: "bureau-avoidance" }, { kind: "coincidence" }],
  },
  "con cái": {
    goal: "con cái",
    description: "Sáu bộ sao báo sinh ở tiểu hạn TVTH tr.139.",
    rankBy: "net",
    criteria: triggersFor("con cái"),
  },
};
