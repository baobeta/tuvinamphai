import type { PalaceRole } from "../chart/palaces.js";
import { err, ok, type Result } from "../result.js";
import { canon } from "./text.js";

export type TopicId =
  | "personality"
  | "career"
  | "wealth"
  | "marriage"
  | "children"
  | "health"
  | "property"
  | "social"
  | "travel"
  | "longevity";

export type PalaceTier = "chính" | "phụ";

export interface TopicPalace {
  readonly role: PalaceRole;
  readonly tier: PalaceTier;
}

export interface TopicDefinition {
  readonly id: TopicId;
  readonly label: string;
  readonly folderSlug: string;
  readonly aliases: readonly string[];
  readonly palaces: readonly TopicPalace[];
  readonly usesBodyPalace: boolean;
}

const main = (role: PalaceRole): TopicPalace => ({ role, tier: "chính" });
const side = (role: PalaceRole): TopicPalace => ({ role, tier: "phụ" });

export const TOPICS: readonly TopicDefinition[] = [
  {
    id: "personality",
    label: "Tính cách",
    folderSlug: "Tinh-cach",
    aliases: ["tính cách", "tinh cach", "tính tình", "con người", "tướng mạo"],
    palaces: [main("Mệnh"), side("Thiên Di"), side("Phúc Đức"), side("Phụ Mẫu"), side("Huynh Đệ"), side("Nô Bộc"), side("Phu Thê"), side("Tử Tức")],
    usesBodyPalace: true,
  },
  {
    id: "career",
    label: "Học vấn – Công danh",
    folderSlug: "Hoc-van-cong-danh",
    aliases: ["công danh", "học vấn", "sự nghiệp", "nghề nghiệp", "thi cử", "cong danh"],
    palaces: [main("Quan Lộc"), main("Mệnh"), side("Phụ Mẫu"), side("Thiên Di"), side("Tài Bạch"), side("Phúc Đức")],
    usesBodyPalace: true,
  },
  {
    id: "wealth",
    label: "Tài lộc",
    folderSlug: "Tai-loc",
    aliases: ["tài lộc", "tiền bạc", "tài chính", "giàu nghèo", "tai loc"],
    palaces: [main("Tài Bạch"), side("Phúc Đức"), side("Điền Trạch"), side("Mệnh"), side("Quan Lộc"), side("Tử Tức"), side("Huynh Đệ"), side("Tật Ách"), side("Phụ Mẫu")],
    usesBodyPalace: false,
  },
  {
    id: "marriage",
    label: "Hôn nhân",
    folderSlug: "Hon-nhan",
    aliases: ["hôn nhân", "vợ chồng", "tình duyên", "phu thê", "hon nhan"],
    palaces: [main("Phu Thê"), side("Mệnh"), side("Quan Lộc"), side("Phúc Đức"), side("Thiên Di"), side("Nô Bộc"), side("Điền Trạch"), side("Tài Bạch")],
    usesBodyPalace: true,
  },
  {
    id: "children",
    label: "Con cái",
    folderSlug: "Con-cai",
    aliases: ["con cái", "con cai", "tử tức", "sinh nở"],
    palaces: [main("Tử Tức"), side("Mệnh"), side("Điền Trạch"), side("Tật Ách"), side("Phúc Đức"), side("Phu Thê"), side("Tài Bạch"), side("Nô Bộc")],
    usesBodyPalace: false,
  },
  {
    id: "health",
    label: "Sức khỏe – Bệnh tật",
    folderSlug: "Suc-khoe-benh-tat",
    aliases: ["sức khỏe", "bệnh tật", "suc khoe", "tật ách"],
    palaces: [main("Tật Ách"), side("Mệnh"), side("Phụ Mẫu"), side("Phúc Đức"), side("Điền Trạch"), side("Huynh Đệ")],
    usesBodyPalace: false,
  },
  {
    id: "property",
    label: "Nhà cửa – Đất đai",
    folderSlug: "Nha-cua-dat-dai",
    aliases: ["nhà cửa", "đất đai", "điền trạch", "nha cua", "bất động sản"],
    palaces: [main("Điền Trạch"), side("Tài Bạch"), side("Huynh Đệ"), side("Tật Ách"), side("Tử Tức"), side("Phu Thê"), side("Mệnh")],
    usesBodyPalace: false,
  },
  {
    id: "social",
    label: "Quan hệ xã hội",
    folderSlug: "Quan-he-xa-hoi",
    aliases: ["quan hệ xã hội", "xã hội", "bạn bè", "nô bộc", "đối tác", "xa hoi", "ban be"],
    palaces: [main("Nô Bộc"), side("Thiên Di"), side("Quan Lộc"), side("Phụ Mẫu"), side("Tử Tức")],
    usesBodyPalace: false,
  },
  {
    id: "travel",
    label: "Xuất ngoại – Di chuyển",
    folderSlug: "Xuat-ngoai-di-chuyen",
    aliases: ["xuất ngoại", "di chuyển", "đi xa", "thiên di", "xuat ngoai"],
    palaces: [main("Thiên Di"), main("Mệnh"), side("Điền Trạch"), side("Phúc Đức"), side("Phu Thê")],
    usesBodyPalace: true,
  },
  {
    id: "longevity",
    label: "Tuổi thọ",
    folderSlug: "Tuoi-tho",
    aliases: ["tuổi thọ", "thọ yểu", "tuoi tho"],
    palaces: [main("Mệnh"), main("Phúc Đức"), main("Tật Ách"), side("Điền Trạch"), side("Phụ Mẫu")],
    usesBodyPalace: true,
  },
];

const TOPIC_LOOKUP: ReadonlyMap<string, TopicDefinition> = new Map(
  TOPICS.flatMap((topic) => [[topic.id, topic] as const, [canon(topic.label), topic] as const, ...topic.aliases.map((alias) => [canon(alias), topic] as const)]),
);

export function resolveTopic(input: string): Result<TopicDefinition> {
  const found = TOPIC_LOOKUP.get(canon(input));
  return found
    ? ok(found)
    : err(`Không nhận ra chủ đề "${input}". Hợp lệ: ${TOPICS.map((topic) => `${topic.id} (${topic.label})`).join(", ")}.`);
}
