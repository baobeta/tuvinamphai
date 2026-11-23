"""Sinh README.md (mục lục) cho kho tri thức và kiểm tra chất lượng.

    python3 -I _build_index.py          # sinh README.md + in báo cáo kiểm tra
    python3 -I _build_index.py --check  # chỉ kiểm tra

Kiểm tra: đủ các mục bắt buộc của mẫu file, có trích nguồn (MLTC/TVTH/NP1/NP2), link tương đối không hỏng.
"""
import os, re, sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.abspath(__file__))
REQ = ["## Tóm tắt", "## Nội dung chi tiết", "## Ví dụ", "## Liên quan"]
SRC = re.compile(r"\b(MLTC|TVTH|NP1|NP2)\b")
LINK = re.compile(r"\]\(([^)#\s]+\.md)(#[^)]*)?\)")


def md_files():
    for dp, dns, fns in os.walk(ROOT):
        dns[:] = sorted(d for d in dns if not d.startswith((".", "_")))
        for fn in sorted(fns):
            if fn.endswith(".md") and fn not in ("README.md", "00_DAC-TA-VIET.md"):
                yield os.path.join(dp, fn)


def meta(path):
    s = open(path, encoding="utf-8").read()
    title = (re.search(r"^# (.+)$", s, re.M) or [None, os.path.basename(path)])[1].strip()
    q = re.search(r"\*\*Trả lời câu hỏi:\*\*\s*(.+)", s)
    return s, title, (q.group(1).strip() if q else "")


problems = defaultdict(list)
tree = defaultdict(list)
n = 0
for p in md_files():
    n += 1
    s, title, q = meta(p)
    rel = os.path.relpath(p, ROOT)
    top = rel.split(os.sep)[0]
    tree[top].append((rel, title, q))
    miss = [h for h in REQ if h not in s]
    if miss and not rel.startswith("13_La-so-mau/00_"):
        problems["thiếu mục"].append(f"{rel}: {', '.join(miss)}")
    if not SRC.search(s):
        problems["không có nguồn"].append(rel)
    if len(s.split()) < 120:
        problems["quá ngắn (<120 từ)"].append(rel)
    for m in LINK.finditer(s):
        tgt = os.path.normpath(os.path.join(os.path.dirname(p), m.group(1)))
        if not os.path.exists(tgt):
            problems["link hỏng"].append(f"{rel} -> {m.group(1)}")

if "--check" not in sys.argv:
    out = ["# Kho tri thức Tử Vi Nam Phái\n",
           "Tổng hợp từ 4 cuốn: **MLTC** (Mệnh Lý Thiên Cơ), **NP1/NP2** (Tử Vi Nam Phái Phần 1/2), "
           "**TVTH** (Tử Vi Thực Hành). Mỗi file trả lời một câu hỏi cụ thể, có ví dụ và nguồn. "
           f"Quy ước viết: [00_DAC-TA-VIET.md](00_DAC-TA-VIET.md). Tổng: **{n} file**.\n"]
    for top in sorted(tree):
        out.append(f"\n## {top}\n")
        cur = None
        for rel, title, q in tree[top]:
            sub = os.path.dirname(rel)
            if sub != cur and sub != top:
                out.append(f"\n**{sub.split(os.sep, 1)[1] if os.sep in sub else sub}/**\n")
            cur = sub
            qs = f" — {q[:140]}" if q else ""
            out.append(f"- [{title}]({rel}){qs}")
    open(os.path.join(ROOT, "README.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    print("README.md:", n, "file")

for k, v in problems.items():
    print(f"\n## {k}: {len(v)}")
    for x in v[:40]:
        print("  ", x)
print("\nTổng file:", n, "| nhánh:", {k: len(v) for k, v in sorted(tree.items())})
