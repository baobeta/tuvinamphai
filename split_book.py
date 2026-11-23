"""Tách sách 'Mệnh Lý Thiên Cơ - Tử Vi Nam Phái' (PDF 1000 trang) thành cây thư mục Markdown.

Trang PDF = trang sách + 10 (đã kiểm tra bằng số trang ở chân trang).
"""
import json, os, re, sys, unicodedata

SCRATCH = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
OFFSET = 10
LAYOUT = json.load(open(os.path.join(SCRATCH, "layout.json")))


# ---------------------------------------------------------------- helpers
def slug(s):
    s = s.replace("Đ", "D").replace("đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-")
    return s[:60].strip("-")


def norm(s):
    return re.sub(r"[\W_]+", "", unicodedata.normalize("NFC", s).upper())


def nice(title):
    """'1. SAO TỬ VI' -> 'Sao Tử Vi' (title case for ALL-CAPS names)."""
    t = re.sub(r"^\s*([IVX]+|\d+(\.\d+)*)\.?\s*", "", title).strip(" :")
    if t.upper() == t:
        t = " ".join(w.capitalize() if not w.startswith("(") else "(" + w[1:].capitalize() for w in t.lower().split())
    return t


# ---------------------------------------------------------------- lines of the book body
lines = []  # (pdf_index, text, indent)
for pi in range(2, 1000):  # skip 2 blank cover pages
    raw = [l.rstrip() for l in LAYOUT[pi].replace("\f", "").split("\n")]
    while raw and not raw[-1].strip():
        raw.pop()
    if raw and re.fullmatch(r"\s*\d+\s*", raw[-1]):
        raw.pop()  # footer page number
    while raw and not raw[-1].strip():
        raw.pop()
    while raw and not raw[0].strip():
        raw.pop(0)  # leading blanks would wrongly break a paragraph across pages
    nonblank = [l for l in raw if l.strip()]
    base = min((len(l) - len(l.lstrip()) for l in nonblank), default=0)
    for l in raw:
        ind = len(l) - len(l.lstrip()) - base if l.strip() else 0
        lines.append((pi, l.strip(), ind))


# ---------------------------------------------------------------- TOC (book pages)
def toc_stars():
    """Parse the 101 star entries of chương III.II from the printed TOC (PDF pages 5-9)."""
    txt = "\n".join(LAYOUT[i] for i in range(4, 9))
    out = []
    for m in re.finditer(r"^\s*(\d+)\.\s*([^\n]+?)\s*\.{3,}\s*(\d+)\s*$", txt, re.M):
        n, name, pg = int(m.group(1)), m.group(2).strip(" :"), int(m.group(3))
        if 92 <= pg < 810:
            out.append((f"{n}. {name}", pg))
    return out


STARS = toc_stars()
assert len(STARS) == 101, len(STARS)

# node: (title, book_page, match_key or None, children)
TREE = [
    ("Lời tựa", -7, "LỜI TỰA", []),
    ("Chương I: Lá số Tử Vi", 1, "Chương I : LÁ SỐ TỬ VI", [
        ("1. Khái quát về lá số tử vi", 1, "1. Khái quát về lá số", []),
        ("2. Bát quái, mười hai địa chi, ngũ hành tương ứng mười hai cung", 4, "2. Bát quái, mười hai", []),
        ("3. Ngũ hành cục", 5, "3. Ngũ hành cục", []),
        ("4. Sự tuần hành và cấm kị của 12 con giáp", 6, "4. Sự tuần hành", []),
        ("5. Chủ mệnh, chủ thân", 7, "5. Chủ mệnh", []),
        ("6. Tử niên đẩu quân", 7, "6. Tử niên đẩu quân", []),
        ("7. Lập tứ trụ và lá số tử vi", 8, "7. Lập tứ trụ", []),
        ("8. Luận mệnh dựa vào tháng sinh", 24, "8. Luận mệnh dựa vào", []),
    ]),
    ("Chương II: Mười hai cung", 28, "Chương II: MƯỜI HAI CUNG", [
        ("I. Cung Mệnh, cung Thân", 32, "I. CUNG MỆNH, CUNG THÂN", []),
        ("II. Cung Huynh Đệ", 54, "II. CUNG HUYNH ĐỆ", []),
        ("III. Cung Phu Thê", 56, "III. CUNG PHU THÊ", []),
        ("IV. Cung Tử Nữ", 57, "IV. CUNG TỬ NỮ", []),
        ("V. Cung Tài Bạch", 59, "V. CUNG TÀI BẠCH", []),
        ("VI. Cung Tật Ách", 62, "VI. CUNG TẬT ÁCH", []),
        ("VII. Cung Thiên Di", 64, "VII. CUNG THIÊN DI", []),
        ("VIII. Cung Bộc Dịch (Giao Hữu)", 66, "VIII. CUNG BỘC DỊCH", []),
        ("IX. Cung Quan Lộc (Sự Nghiệp)", 66, "IX. CUNG QUAN LỘC", []),
        ("X. Cung Điền Trạch", 67, "X. CUNG ĐIỀN TRẠCH", []),
        ("XI. Cung Phúc Đức", 73, "XI. CUNG PHÚC ĐỨC", []),
        ("XII. Cung Phụ Mẫu (Tướng Mạo, Văn Thư)", 75, "XII. CUNG PHỤ MẪU", []),
    ]),
    ("Chương III: Diệu tinh", 77, "CHƯƠNG III: DIỆU TINH", [
        ("I. Diệu tinh tổng luận", 77, "I. DIỆU TINH TỔNG LUẬN", []),
        ("II. Tinh diệu các luận", 92, "II. TINH DIỆU CÁC LUẬN", [
            (f"{t.split('.', 1)[0]}. {nice(t)}", p, t, []) for t, p in STARS
        ]),
        ("III. Thập thiên can tứ hóa", 810, "III. THẬP THIÊN CAN TỨ HÓA", []),
    ]),
    ("Chương 4: Lưu niên đẩu quân, lưu nguyệt, lưu nhật, lưu thời", 845, "Chương 4", [
        ("1. Các khái niệm cơ bản", 845, "1. Các khái niệm cơ bản", []),
        ("2. Các quy tắc suy luận cơ bản", 846, "2. Các quy tắc suy luận cơ bản", []),
        ("3. Tập hợp các quy tắc suy luận về Lưu Nguyệt và Lưu Nhật", 848, "3. Tập hợp các quy tắc", []),
    ]),
    ("Chương 5: Các bước suy luận trong Tử Vi Đẩu Số và bộ quy tắc phân loại", 862, "Chương 5: CÁC BƯỚC SUY LUẬN", [
        ("1. Các bước suy luận", 862, "1. Các bước suy luận", []),
        ("2. Phân loại các quy tắc suy luận về người, sự việc và sự vật", 864, "2. Phân loại các quy tắc", [
            ("2.1. Xác định điều người đó đang hỏi", 864, "2.1. Xác định điều", []),
            ("2.2. Suy đoán nghề nghiệp và sự nghiệp", 865, "2.2. Suy đoán nghề nghiệp", []),
            ("2.3. Suy đoán sức khỏe, bệnh tật và tuổi thọ", 883, "2.3 Suy đoán sức khỏe", []),
            ("2.4. Suy luận tội phạm và thời gian ngồi tù", 899, "2.4. Suy luận tội phạm", []),
            ("2.5. Suy luận về việc lựa chọn vợ/chồng và kết hôn", 903, "2.5. Suy luận về việc lựa chọn", []),
            ("2.6. Suy ra của cải và nguồn tài chính", 944, "2.6. Suy ra của cải", []),
            ("2.7. Tứ hóa phi tinh của cung Mệnh", 957, "2.7. Tứ hóa phi tinh", []),
        ]),
        ("3. Phương pháp Thái Tuế Nhập Quẻ (Quái)", 985, "3. Phương pháp Thái Tuế", []),
        ("4. Phương pháp tham khảo để xác định giờ sinh", 987, "4. Phương pháp tham khảo", []),
    ]),
]

# ---------------------------------------------------------------- locate cut points (sequential)
flat = []  # (path_of_nodes, node)


def walk(nodes, path):
    for n in nodes:
        flat.append((path + [n], n))
        walk(n[3], path + [n])


walk(TREE, [])
# Mục lục (PDF 5-9) sits between Lời tựa and Chương I — add a sentinel cut to drop it.
cuts = []
cursor = 0
for path, (title, bp, key, _) in flat:
    k = norm(key)
    lo, hi = bp + OFFSET - 2, bp + OFFSET + 1  # pdf index window (0-based)
    hit = None
    for i in range(cursor, len(lines)):
        pi, txt, _ = lines[i]
        if pi > hi:
            break
        if pi >= lo and norm(txt).startswith(k):
            hit = i
            break
    if hit is None:
        print("MISS", title, bp)
        continue
    cuts.append((hit, path))
    cursor = hit + 1
    if title == "Lời tựa":
        # end of Lời tựa = start of MỤC LỤC
        toc_i = next(i for i in range(hit, len(lines)) if lines[i][1] == "MỤC LỤC")
        cuts.append((toc_i, None))

print("cuts:", len(cuts), "expected:", len(flat) + 1)


# ---------------------------------------------------------------- reflow to markdown
HEAD_RE = re.compile(r"^(\d+(\.\d+)*\.?|[IVX]+\.)\s+\S")


def to_markdown(seg):
    paras, cur = [], []

    def flush():
        if cur:
            paras.append(cur[:])
            cur.clear()

    for _, txt, ind in seg:
        if not txt:
            flush()
            continue
        starts_new = ind >= 2 or txt[0] in "-•+●" or (HEAD_RE.match(txt) and len(txt) < 90)
        if starts_new:
            flush()
        cur.append(txt)
        if txt.endswith(":") and len(txt) < 90 and len(cur) == 1:
            flush()
    flush()

    out = []
    for p in paras:
        text = " ".join(p)
        text = re.sub(r"\s+", " ", text).strip()
        if len(p) == 1 and HEAD_RE.match(text) and len(text) < 90:
            out.append("### " + text)
        elif text[0] in "-•●+":
            out.append("- " + text.lstrip("-•●+ ").strip())
        else:
            out.append(text)
    return "\n\n".join(out)


# ---------------------------------------------------------------- write tree
def node_dir(path):
    """Directory for a node that has children; file name for leaves."""
    parts = []
    for depth, node in enumerate(path):
        parent_children = TREE if depth == 0 else path[depth - 1][3]
        idx = parent_children.index(node)
        title = node[0]
        if depth == 0:
            if title == "Lời tựa":
                parts.append("00_Loi-tua")
            else:
                parts.append(f"Chuong-{idx:02d}_{slug(nice(title.split(':', 1)[1]))}")
        else:
            width = 3 if len(parent_children) > 99 else 2
            parts.append(f"{idx + 1:0{width}d}_{slug(nice(title))}")
    return parts


def book_page(pi):
    return pi + 1 - OFFSET


cuts.sort()
written = []
for j, (start, path) in enumerate(cuts):
    if path is None:
        continue
    end = cuts[j + 1][0] if j + 1 < len(cuts) else len(lines)
    # drop heading line itself (re-added as # title) plus its wrapped continuation lines
    s = start + 1
    while s < end and not lines[s][1] and s - start < 3:
        s += 1
    while s < end and lines[s][1] and len(lines[s][1]) < 80 and (
        (lines[s][1].upper() == lines[s][1] and re.search(r"[A-ZÀ-Ỹ]", lines[s][1]))
        or (len(lines[s][1]) < 25 and lines[s][1][0].islower())
    ):
        s += 1
    seg = lines[s:end]
    node = path[-1]
    parts = node_dir(path)
    has_children = bool(node[3])
    body = to_markdown(seg).strip()
    if has_children:
        if not body:
            continue
        rel = os.path.join(*parts, "00_Tong-quan.md")
    else:
        rel = os.path.join(*parts) + ".md"
    p_from, p_to = book_page(lines[start][0]), book_page(lines[end - 1][0])
    breadcrumb = " › ".join(n[0] for n in path[:-1])
    head = f"# {node[0]}\n\n"
    if breadcrumb:
        head += f"> {breadcrumb}  \n"
    head += f"> Trang sách {p_from}–{p_to} · *Mệnh Lý Thiên Cơ – Tử Vi Nam Phái*\n\n"
    full = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w").write(head + body + "\n")
    written.append((rel, path, p_from, p_to, len(body)))

json.dump([(r, [n[0] for n in p], a, b, n) for r, p, a, b, n in written],
          open(os.path.join(SCRATCH, "written.json"), "w"), ensure_ascii=False, indent=1)

# ---------------------------------------------------------------- README index
idx = ["# Mệnh Lý Thiên Cơ – Tuyển tập Tử Vi Nam Phái", "",
       "Soạn và biên dịch: Lê Quang Lăng. Bản trích xuất theo chương/mục từ PDF gốc (TV34, 1000 trang).", "",
       "| Mục | Trang sách |", "|---|---|"]
shown = set()
for rel, path, a, b, n in written:
    # heading rows for every ancestor (chapter / section folder) not yet listed
    for d, anc in enumerate(path[:-1]):
        if id(anc) not in shown:
            shown.add(id(anc))
            idx.append(f"| {'&nbsp;' * 4 * d}**{anc[0]}** | |")
    node = path[-1]
    depth = len(path) - 1
    pages = f"{a}–{b}" if a > 0 else "—"
    if node[3]:  # folder node with its own intro text
        shown.add(id(node))
        idx.append(f"| {'&nbsp;' * 4 * depth}**[{node[0]}]({rel})** (tổng quan) | {pages} |")
    else:
        idx.append(f"| {'&nbsp;' * 4 * depth}[{node[0]}]({rel}) | {pages} |")
open(os.path.join(OUT, "README.md"), "w").write("\n".join(idx) + "\n")
print("files:", len(written))
