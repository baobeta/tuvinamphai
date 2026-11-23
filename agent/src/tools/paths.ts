import fs from "node:fs/promises";
import path from "node:path";

export class PathEscapeError extends Error {}

export async function resolveInside(root: string, untrusted: string): Promise<string> {
  const rootReal = await fs.realpath(root);
  const target = path.resolve(rootReal, untrusted);
  assertInside(rootReal, target, untrusted);
  const real = await fs.realpath(target).catch(() => {
    throw new Error(`Không tồn tại: ${untrusted}`);
  });
  assertInside(rootReal, real, untrusted);
  return real;
}

function assertInside(root: string, target: string, label: string): void {
  const rel = path.relative(root, target);
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new PathEscapeError(`Đường dẫn nằm ngoài thư mục cho phép: ${label}`);
  }
}
