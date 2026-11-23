import Anthropic from "@anthropic-ai/sdk";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { loadConfig } from "./config.js";
import { loadKb } from "./kb/index.js";
import { ALL_TOOLS } from "./tools/kb-tools.js";
import { TuViAgent, streamerFromClient, type TurnResult } from "./agent/harness.js";

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const short = (v: unknown, n = 120) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

function footer(r: TurnResult): string {
  const u = r.usage;
  const status = r.status === "done" ? "" : ` · trạng thái: ${r.status}`;
  return dim(
    `\n[${r.iterations} lượt model · ${r.toolCalls} lần gọi tool · token vào ${u.input} (cache đọc ${u.cacheRead}, ghi ${u.cacheWrite}) · ra ${u.output}${status}]`,
  );
}

async function main(): Promise<void> {
  const config = loadConfig();
  const kb = await loadKb(config.kbRoot);
  const agent = new TuViAgent(
    streamerFromClient(new Anthropic()),
    config,
    ALL_TOOLS,
    { kb, corpusRoot: config.corpusRoot },
    {
      onText: (d) => stdout.write(d),
      onToolCall: (name, input) => stdout.write(dim(`\n→ ${name} ${short(input)}\n`)),
      onToolResult: (name, o) => o.isError && stdout.write(dim(`  ✗ ${name}: ${short(o.content)}\n`)),
    },
  );

  const onceIdx = process.argv.indexOf("--once");
  if (onceIdx >= 0) {
    const question = process.argv.slice(onceIdx + 1).join(" ").trim();
    if (!question) throw new Error('Cách dùng: pnpm ask "câu hỏi"');
    stdout.write(footer(await agent.ask(question)) + "\n");
    return;
  }

  stdout.write(
    `Tử Vi agent · ${config.model} (effort ${config.effort}) · kho: ${kb.docs.length} file\n` +
      dim("Lệnh: /reset xóa hội thoại · /usage xem token · /exit thoát\n"),
  );
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    for (;;) {
      const line = (await rl.question("\n› ")).trim();
      if (!line) continue;
      if (line === "/exit") break;
      if (line === "/reset") {
        agent.reset();
        stdout.write(dim("Đã xóa hội thoại.\n"));
        continue;
      }
      if (line === "/usage") {
        stdout.write(dim(JSON.stringify(agent.usage) + "\n"));
        continue;
      }
      try {
        stdout.write(footer(await agent.ask(line)) + "\n");
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError) {
          stdout.write("Chưa có credential: đặt ANTHROPIC_API_KEY hoặc chạy `ant auth login`.\n");
        } else if (err instanceof Anthropic.RateLimitError) {
          stdout.write("Bị giới hạn tốc độ (429). Thử lại sau.\n");
        } else if (err instanceof Anthropic.APIError) {
          stdout.write(`Lỗi API ${err.status}: ${err.message}\n`);
        } else throw err;
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
