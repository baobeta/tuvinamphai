"""Tách 'Tử Vi Thực Hành' (Dịch Lý Huyền Cơ, tuvilyso.com, 201 trang, PDF có chữ) thành cây Markdown.

Dùng:  python3 -I build_tvth.py <pdf> <out_dir>
Số trang PDF = số trang in ở chân trang.
"""
import os, re, sys, shutil, subprocess, unicodedata, tempfile
from collections import Counter

PDF, OUT = sys.argv[1], sys.argv[2]
BOOK = "Tử Vi Thực Hành"

FOLDERS = [
    "Lời nói đầu",
    "Phần I – Lập thành",
    "Phần II – Chư tinh thể tính cách",
    "Phần III – Cách luận số mệnh",
    "Phú đoán các cung",
    "Luận đoán đại tiểu hạn",
    "Số Tử Vi mẫu",
    "Phú chữ Hán",
]

# (folder, page, marker – đầu dòng tiêu đề trong sách, title hiển thị hoặc None = lấy từ marker)
S = [
    (0, 2, "Nhắn gởi", "Nhắn gởi và Tựa"),
    (1, 6, "I. TÌM GIỜ", None), (1, 6, "II. PHÂN RÕ CAN CHI", None),
    (1, 8, "III. NGŨ HÀNH", None), (1, 9, "IV. CÁCH AN SỐ", None),
    (1, 10, "V. AN MỆNH", "V. An mệnh – tìm cục"), (1, 12, "VI. AN SAO", None),
    (1, 22, "KẾT MỤC AN SAO", None), (1, 22, "VII. CÁCH AN THÂN", None), (1, 22, "VIII. LƯU HẠN", None),
    (2, 24, "PHẦN HAI", "Lời dẫn"),
]
for pg, name in [(24, "TỬ VI"), (26, "THIÊN CƠ"), (28, "THÁI DƯƠNG"), (31, "SAO VŨ KHÚC"),
                 (33, "SAO THIÊN ĐỒNG"), (35, "SAO LIÊM TRINH"), (37, "SAO THIÊN PHỦ"), (39, "THÁI ÂM"),
                 (41, "SAO THAM LANG"), (44, "SAO CỰ MÔN"), (47, "SAO THIÊN TƯỚNG"), (49, "SAO THIÊN LƯƠNG"),
                 (51, "SAO THẤT SÁT"), (53, "SAO PHÁ QUÂN"), (55, "THIÊN KHÔI"), (55, "VĂN XƯƠNG"),
                 (57, "BỘ SAO TẢ PHỤ"), (58, "SAO LỘC TỒN"), (59, "SAO THIÊN MÃ"), (60, "BỘ SAO TỨ HÓA"),
                 (62, "SAO LONG PHƯỢNG"), (63, "ÂN QUANG"), (63, "TAM THAI"), (63, "THAI PHỤ"),
                 (64, "ĐÀO HOA"), (65, "SAO HOA CÁI"), (65, "THIÊN QUAN"), (65, "SAO THANH LONG"),
                 (66, "THIÊN GIẢI"), (66, "GIẢI THẦN"), (66, "THIÊN ĐỨC"), (66, "LONG ĐỨC"), (66, "THIÊN THỌ"),
                 (67, "THIÊN KHỐ"), (67, "THIÊN TRÙ"), (67, "QUỐC ẤN"), (67, "ĐƯỜNG PHÙ"),
                 (68, "BỘ SAO TRÀNG SINH"), (70, "BỘ SAO BÁC SỸ"), (72, "BỘ THÁI TUẾ"), (73, "SAO VĂN TINH"),
                 (73, "TUẦN"), (75, "KÌNH DƯƠNG"), (76, "ĐÀ LA"), (77, "HỎA TINH"), (78, "LINH TINH"),
                 (79, "ĐẠI HAO"), (80, "TANG MÔN"), (81, "THIÊN KHỐC"), (81, "THIÊN HÌNH"), (82, "THIÊN KHÔNG"),
                 (82, "ĐỊA KHÔNG"), (84, "KIẾP SÁT"), (84, "THIÊN DIÊU"), (85, "THIÊN Y"), (85, "CÔ THẦN"),
                 (85, "ĐẨU QUÂN"), (86, "PHÁ TOÁI"), (86, "LƯU HÀ"), (86, "LƯU TÙ"), (87, "THIÊN THƯƠNG"),
                 (87, "THIÊN LA")]:
    S.append((2, pg, name, None))
S += [
    (3, 88, "PHẦN THỨ BA", "Lời dẫn – các tiết mục luận đoán"),
    (3, 89, "I. SOÁT GIỜ SINH", None), (3, 91, "II. CÁCH CUỘC LẬP THÀNH", None),
    (3, 94, "III. SINH, VƯỢNG", "III. Sinh, vượng, bại, tuyệt địa"), (3, 94, "IV. LUẬN VỀ MỆNH", None),
    (3, 96, "NHẬN ĐỊNH VỀ MÙA SINH", None), (3, 97, "V. LUẬN CÁC CÁCH", None),
    (3, 100, "VI. LUẬN VỀ SAO", "VI. Luận về sao cung Mệnh"),
    (3, 101, "NGŨ HÀNH SỞ THUỘC", "Ngũ hành sở thuộc tính tinh"),
    (3, 102, "CUNG CÁC SAO ĐẮC ĐỊA", None), (3, 103, "12 CUNG CÁC SAO LỤC HÃM", "12 cung các sao lục hãm"),
    (3, 104, "HẠN HÀNH ĐẮC SỐ LỆ", "Hạn hành đắc số lệ – phản bối"),
    (4, 105, "PHÚ ĐOÁN CUNG MỆNH", "Cung Mệnh – Nam mệnh"),
    (4, 118, "Phụ giải:", "Phụ giải 14 chính tinh (nam / nữ mệnh)"),
    (4, 122, "B. ĐOÁN VỀ NỮ MỆNH", "Đoán về nữ mệnh"),
    (4, 124, "CUNG BÀO", None), (4, 125, "CUNG PHỐI", None), (4, 127, "CUNG TỬ", None),
    (4, 128, "TỦ TỨC CA", "Tử tức ca"), (4, 128, "CUNG TÀI", None), (4, 129, "CUNG GIẢI", None),
    (4, 130, "THIÊN DI", "Cung Thiên Di"), (4, 131, "CUNG NÔ", None), (4, 131, "CUNG QUAN", None),
    (4, 132, "CUNG TRẠCH", None), (4, 133, "CUNG PHÚC", None), (4, 133, "CUNG PHỤ MẪU", None),
    (5, 135, "LƯU TUẦN TRIỆT", "Lưu Tuần Triệt – Cửu tinh – Nhật Nguyệt"),
    (5, 137, "LUẬN ĐOÁN ĐẠI TIỂU HẠN", None), (5, 138, "ĐẠI TIỂU HẠN PHÁT", None),
    (5, 138, "ĐOÁN CÁCH Ở ĐẠI TIỂU HẠN", None), (5, 141, "CÁCH LƯU ĐẠI HẠN", None),
    (5, 142, "CÁC CÁCH DÙNG CHO", "Các cách dùng cho đại tiểu hạn"), (5, 142, "TUỔI VỚI HẠN KỴ", None),
    (5, 143, "LIÊN HỆ GIỮA ĐẠI VÀ TIỂU HẠN", None), (5, 143, "LIÊN HỆ GIỮA HẠN VÀ NĂM TUỔI", None),
    (5, 144, "XEM TIỂU HẠN THEO THÁI TUẾ", "Xem tiểu hạn theo Thái Tuế lưu niên từng năm"),
    (5, 150, "LIÊN HỆ GIỮA MỆNH THÂN VÀ HẠN", None), (5, 154, "ẢNH HƯỞNG SAO NHẬP HẠN", None),
    (5, 158, "LUẬN ĐOÁN VỀ HẠN CHẾT", None),
    (6, 159, "LÃ THÁI HẬU", None), (6, 161, "KHỔNG TỬ", None), (6, 163, "HẠNG VÕ", None),
    (6, 165, "LÁ SỐ ÂM NAM", "Âm Nam – Kỷ Mùi"), (6, 167, "LÁ SỐ NỮ VCD", "Nữ mệnh vô chính diệu – Canh Ngọ"),
    (6, 169, "LÁ SỐ MỒ CÔI MẸ", "Mồ côi mẹ – Giáp Thân"), (6, 171, "ÂM NAM", "Âm Nam – Kỷ Sửu"),
    (6, 173, "LÁ SỐ NAM CANH DẦN", "Nam – Canh Dần"), (6, 175, "LÁ SỐ NGA MI TÁC ÁN", "Nga mi tác án – Tân Mão"),
    (6, 176, "ÂM NAM QUÍ TỴ", "Âm Nam – Quí Tỵ"), (6, 177, "LÁ SỐ TỬ PHÁ TẠI SỬU", "Tử Phá tại Sửu – Ất Mùi"),
    (6, 179, "NAM BÍNH THÂN", "Nam – Bính Thân"), (6, 181, "LÁ SỐ NỮ NHÂN", "Nữ nhân Cự Đồng – Mậu Tuất"),
    (6, 182, "NAM KỶ HỢI", "Nam – Kỷ Hợi"), (6, 184, "NAM NHÂN LƯỠNG ĐẾ", "Nam nhân Lưỡng Đế – Giáp Thìn"),
    (7, 186, "MA THỊ CÁCH CHÚ", None), (7, 193, "CÁCH CUỘC LUẬN", None), (7, 198, "NỮ MỆNH LUẬN", None),
    (6, 201, None, "Lá số Chủ tịch Hồ Chí Minh (phụ lục cuối sách)"),
]
# dòng tiêu đề phần / dòng phụ của tiêu đề – bỏ vì đã có trong tiêu đề file / thư mục
DROP = {"LẬP THÀNH", "PHẦN I", "CHƯ TINH THỂ TÍNH CÁCH", "CÁCH LUẬN SỐ MỆNH", "PHÚ ĐOÁN CÁC CUNG",
        "SỐ TỬ VI MẪU", "PHÚ CHỮ HÁN", "LƯU NIÊN TỪNG NĂM", "A. NAM MỆNH:", "Thiên-Khố", "Thiên Khố"}
CHART_PAGES = {159, 161, 163, 165, 167, 169, 171, 173, 175, 177, 178, 180, 181, 183, 184, 201}
CHART_AT_START = {177}          # biểu đồ nằm trên phần chữ của trang
TWO_COL = set(range(122, 135))  # các trang phú in 2 cột
LABELS = re.compile(r"^(Giải thích|Cước giải|Cước chú|Cước|Phú|Chú ý|Phụ giải|Ghi chú|Dịch ra|NHẬN XÉT)\s*:?\s*$")


def key(s):
    s = unicodedata.normalize("NFC", s)
    return re.sub(r"[\W_]+", "", s)


def slug(s):
    s = s.replace("Đ", "D").replace("đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-")[:60].strip("-")


def caps(t):
    L = [c for c in t if c.isalpha()]
    return len(L) >= 3 and sum(c.isupper() for c in L) / len(L) >= 0.85


def nice(t):
    t = t.strip().rstrip(":").strip()
    if not caps(t):
        return t
    out = []
    for w in t.lower().split():
        if re.fullmatch(r"[ivx]+\.", w):
            out.append(w.upper())
        else:
            i = next((k for k, c in enumerate(w) if c.isalpha()), None)
            out.append(w if i is None else w[:i] + w[i].upper() + w[i + 1:])
    return " ".join(out)


def clean(s):
    s = unicodedata.normalize("NFC", s)
    s = re.sub(r"^(\s*)[-]\s*", r"\1- ", s)   # ký tự bullet của Word
    return re.sub(r"[-]", "", s).rstrip()


# ---------------------------------------------------------------- đọc trang
txt = subprocess.run(["pdftotext", "-layout", PDF, "-"], capture_output=True, text=True).stdout
pages = txt.split("\f")
_GAP = re.compile(r"\S\s{3,}\S")


class _Gap:
    @staticmethod
    def search(l):   # khoảng trống giữa các cột (bỏ qua khoảng sau số thứ tự "1.   ")
        return _GAP.search(re.sub(r"^(\s*\d{1,3}\.)\s+", r"\1 ", l))


GAP = _Gap()


def page_lines(n):
    ls = [clean(l) for l in pages[n - 1].split("\n")]
    ls = [l for l in ls if "www.tuvilyso.com" not in l]
    while ls and not ls[-1].strip():
        ls.pop()
    if ls and re.fullmatch(r"\s*\d{1,3}\s*", ls[-1]):
        ls.pop()
    return ls


def split_cols(block):
    """block: các dòng của một đoạn in 2 cột -> dòng cột trái rồi dòng cột phải."""
    starts = Counter()
    for l in block:
        for m in re.finditer(r"\s{3,}(?=\S)", l.rstrip()):
            if m.start() > 0 and l[:m.start()].strip():
                starts[m.end()] += 1
    if not starts:
        return [l.strip() for l in block if l.strip()]
    c = starts.most_common(1)[0][0]
    left, right = [], []
    for l in block:
        if not l.strip():
            continue
        ind = len(l) - len(l.lstrip())
        if ind >= c - 3:
            right.append(l.strip()); continue
        best = None
        for m in re.finditer(r"\s{2,}(?=\S)", l):
            if m.start() > ind and abs(m.end() - c) <= 4:
                best = m
        if best:
            left.append(l[:best.start()].strip()); right.append(l[best.end():].strip())
        else:
            left.append(l.strip())
    return left + right


# items: ("L", page, indent, text, long, nojoin) | ("B",) | ("F", page, [lines]) | ("I", page)
items = []
for n in range(2, len(pages) + 1):
    if n > 201:
        break
    ls = page_lines(n)
    while ls and not ls[0].strip():
        ls.pop(0)
    if n in CHART_PAGES and n in CHART_AT_START:
        items.append(("I", n))
    body = [l for l in ls if l.strip()]
    base = min((len(l) - len(l.lstrip()) for l in body), default=0)
    maxw = max((len(re.sub(r"\s+", " ", l.strip())) for l in body), default=1)
    i = 0
    while i < len(ls):
        l = ls[i]
        if not l.strip():
            items.append(("B",)); i += 1; continue
        st = l.strip()
        if st in DROP or (len(st) <= 3 and not re.search(r"\w", st)):
            i += 1; continue
        if n in TWO_COL and GAP.search(l):
            j = i
            while j < len(ls) and (not ls[j].strip() or GAP.search(ls[j]) or len(ls[j].strip()) < 45) \
                    and not (ls[j].strip() and caps(ls[j]) and not GAP.search(ls[j])):
                j += 1
            for t in split_cols(ls[i:j]):
                items.append(("L", n, 0, t, False, True))
            items.append(("B",)); i = j; continue
        if GAP.search(l):   # bảng: gom các dòng có cột liền nhau
            j, blk = i, []
            while j < len(ls):
                if GAP.search(ls[j]) or re.search(r"\.{5,}|…", ls[j]):
                    blk.append(ls[j]); j += 1
                elif not ls[j].strip() and any(GAP.search(x) for x in ls[j + 1:j + 3]):
                    blk.append(""); j += 1
                elif blk and len(ls[j].strip()) < 40 and (any(GAP.search(x) for x in ls[j + 1:j + 4])
                        or (blk[-1].strip() and len(ls[j]) - len(ls[j].lstrip()) >= 6)):
                    blk.append(ls[j]); j += 1
                else:
                    break
            if len([b for b in blk if b.strip()]) >= 2:
                cut = min(len(b) - len(b.lstrip()) for b in blk if b.strip())
                items.append(("F", n, [b[cut:].rstrip() for b in blk])); i = j; continue
        ind = len(l) - len(l.lstrip()) - base
        flat = re.sub(r"\s+", " ", st)
        items.append(("L", n, ind, flat, len(flat) >= 0.8 * maxw, False))
        i += 1
    if n in CHART_PAGES and n not in CHART_AT_START:
        items.append(("I", n))

# ---------------------------------------------------------------- tìm điểm bắt đầu mục
starts = []
pos = 0
for k, (fo, pg, mk, title) in enumerate(S):
    if mk is None:
        idx = next(x for x, it in enumerate(items) if it[0] in "LFI" and it[1] == pg)
    else:
        idx = next(x for x, it in enumerate(items) if x >= pos and it[0] == "L" and it[1] >= pg
                   and key(it[3]).startswith(key(mk)))
    starts.append(idx)
    pos = idx
assert starts == sorted(starts[:-1]) + [starts[-1]] or True
order = sorted(range(len(S)), key=lambda k: starts[k])

# ---------------------------------------------------------------- render
ITEM = re.compile(r"^(\d{1,3}[.)]|[a-zA-Z][.)/]|- |– |\+ |✓)\s*")


def render(chunk):
    out, cur = [], None
    prev = None  # last L item

    def flush():
        nonlocal cur
        if cur:
            out.append("  \n".join(cur))
        cur = None

    for it in chunk:
        if it[0] == "B":
            flush(); prev = None; continue
        if it[0] == "F":
            flush(); out.append("```\n" + "\n".join(it[2]).strip("\n") + "\n```"); prev = None; continue
        if it[0] == "I":
            flush(); out.append(f"![Lá số – trang {it[1]}](../_anh-trang/trang-{it[1]:03d}.jpg)"); prev = None; continue
        _, pg, ind, t, long_, nojoin = it
        if LABELS.match(t):
            flush(); out.append(f"**{t.rstrip(':').strip()}:**"); prev = None; continue
        if caps(t) and len(t) <= 70 and not ITEM.match(t) or re.match(r"^\d{1,2}(-\d{1,2})?\.\s+[^a-zà-ỹ]{3,}:?$", t):
            flush(); out.append("### " + nice(t)); prev = None; continue
        is_item = bool(ITEM.match(t))
        if t.startswith("- ") is False and re.match(r"^[–]\s", t):
            t = "- " + t[2:]
        cont = (cur is not None and prev is not None and prev[4] and not prev[5] and not is_item
                and (ind <= 2 or (prev[1] != pg and ind <= 3) or (prev[6] is not None and abs(ind - prev[6]) <= 2)))
        hang = None
        if is_item:
            hang = ind + ITEM.match(t).end()
        elif cont and prev[6] is not None:
            hang = prev[6]
        if cont:
            cur[-1] += " " + t
        elif cur is not None and not (ind >= 3 and not nojoin and not is_item and (prev is None or prev[4] or prev[7])):
            cur.append(t)
        else:
            flush(); cur = [t]
        prev = (t, pg, ind, t, long_, nojoin, hang, cont)
    flush()
    return "\n\n".join(out)


if os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(os.path.join(OUT, "_anh-trang"))
with tempfile.TemporaryDirectory() as td:
    for pg in sorted(CHART_PAGES):
        subprocess.run(["pdftoppm", "-r", "150", "-f", str(pg), "-l", str(pg), "-png", "-singlefile", PDF,
                        os.path.join(td, "p")], check=True)
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "75",
                        os.path.join(td, "p.png"), "--out", os.path.join(OUT, "_anh-trang", f"trang-{pg:03d}.jpg")],
                       check=True, capture_output=True)

counters = Counter()
index = {f: [] for f in range(len(FOLDERS))}
for rank, k in enumerate(order):
    fo, pg, mk, title = S[k]
    a = starts[k]
    b = starts[order[rank + 1]] if rank + 1 < len(order) else len(items)
    chunk = items[a + (0 if mk is None else 1): b]
    pgs = [it[1] for it in items[a:b] if it[0] in "LFI"]
    p0, p1 = min(pgs), max(pgs)
    title = title or nice(items[a][3])
    if mk == "TỬ VI" or (fo == 2 and mk and title == nice(mk)):
        pass
    counters[fo] += 1
    fdir = f"{fo:02d}_{slug(FOLDERS[fo])}"
    fname = f"{counters[fo]:02d}_{slug(title)}.md"
    os.makedirs(os.path.join(OUT, fdir), exist_ok=True)
    body = render(chunk)
    rng = f"{p0}" if p0 == p1 else f"{p0}–{p1}"
    with open(os.path.join(OUT, fdir, fname), "w") as f:
        f.write(f"# {title}\n\n> {FOLDERS[fo]}  \n> Trang sách {rng} · *{BOOK}* (Dịch Lý Huyền Cơ)\n\n{body}\n")
    index[fo].append((title, rng, f"{fdir}/{fname}"))

with open(os.path.join(OUT, "README.md"), "w") as f:
    f.write(f"# {BOOK}\n\nTủ sách Tử Vi lý số · Dịch Lý Huyền Cơ (bản tuvilyso.com, 201 trang). "
            "Mỗi mục một file, xếp theo thư mục từng phần của sách.\n")
    for fo, name in enumerate(FOLDERS):
        f.write(f"\n## {fo:02d}. {name}\n\n| Mục | Trang |\n|---|---|\n")
        for title, rng, path in index[fo]:
            f.write(f"| [{title}]({path}) | {rng} |\n")
print("files:", sum(counters.values()))
