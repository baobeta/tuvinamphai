"""Dựng cây Markdown từ kết quả OCR (macOS Vision, vi-VT) của sách scan 'Tử Vi Nam Phái' (Lê Quang Lăng).

usage: python3 build_ocr_book.py <config: tv1|tv2> <out_dir> [--headings]
"""
import json, os, re, sys, shutil, subprocess, unicodedata

SCRATCH = os.path.dirname(os.path.abspath(__file__))
BOOK, OUT = sys.argv[1], sys.argv[2]
ONLY_HEADINGS = "--headings" in sys.argv
OCR = sorted(json.load(open(os.path.join(SCRATCH, f"{BOOK}.json"))), key=lambda p: p["page"])
IMGDIR = os.path.join(SCRATCH, f"{BOOK}img")


def slug(s):
    s = s.replace("Đ", "D").replace("đ", "d")
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-")[:55].strip("-")


def caps_ratio(t):
    letters = [c for c in t if c.isalpha()]
    return (sum(c == c.upper() for c in letters) / len(letters)) if len(letters) >= 4 else 0


def nice(t):
    t = re.sub(r"\s+", " ", t.strip(" .:"))
    return " ".join(w[:1].upper() + w[1:] for w in t.lower().split())


# ---------------------------------------------------------------- page → rows
def page_rows(pi):
    ls = [l for l in OCR[pi]["lines"] if l["t"].strip()]
    ls = [l for l in ls if not (l["y"] < 0.065 and "Nam Ph" in l["t"])]           # running header
    ls = [l for l in ls if not (l["y"] > 0.92 and re.fullmatch(r"[\s\d.,]{1,5}", l["t"]))]  # page number
    ls.sort(key=lambda l: l["y"])
    rows = []
    for l in ls:  # group boxes sharing a baseline into one row (two-column layouts)
        if rows and abs(rows[-1][0]["y"] - l["y"]) < 0.007:
            rows[-1].append(l)
        else:
            rows.append([l])
    out = []
    for r in rows:
        r.sort(key=lambda l: l["x"])
        out.append(dict(p=pi, y=r[0]["y"], x=r[0]["x"], xr=max(l["x"] + l["w"] for l in r),
                        t="   ".join(l["t"].strip() for l in r), n=len(r),
                        c=(r[0]["x"] + r[-1]["x"] + r[-1]["w"]) / 2))
    return out


ROWS = [r for pi in range(len(OCR)) for r in page_rows(pi)]

# ---------------------------------------------------------------- book configs
if BOOK == "tv1":
    TITLE = "Tử Vi Nam Phái – Phần 1"
    PAGE_OFFSET = 1  # pdf page = book page + 1
    CHART_PAGES = {i for i, p in enumerate(OCR) if (any(re.search(r"[DĐ]I[EỄẾỀỆ]N Đ[AÀẢẠÂẦẬ]N", l["t"]) for l in p["lines"])
                   or sum(bool(re.search(r"THIÊN DI|TẬT ÁCH|PHỤ M[ÃẪĂ]U|PHÚC ĐỨC|TÀI BẠCH|TỬ TỨC|HUYNH Đ|NÔ BỘC|QUAN LỘC|ĐIỀN TRẠCH", l["t"])) for l in p["lines"]) >= 2)}
    FOLDERS = [  # (first pdf index, folder title)
        (1, "Luận theo sao và chủ đề"),
        (111, "Cách xem hạn"),
        (142, "Luận theo mười hai cung"),
        (216, "Hỏi đáp và phú đoán"),
        (246, "Lá số mẫu"),
        (281, None),  # back cover
    ]

    def is_heading(r):
        if r["p"] in CHART_PAGES or r["n"] > 1 or not (0.06 < r["y"] < 0.93):
            return False
        if r["p"] < 111:
            return caps_ratio(r["t"]) > 0.9 and abs(r["c"] - 0.5) < 0.09 and r["t"].strip() not in ("CASEN",) \
                and not r["t"].startswith(("12 DIA", "CUNG TRÊN BAN"))
        if r["p"] == 111:
            return r["t"].startswith("CÁCH XEM HẠN")
        if 142 <= r["p"] < 216:
            return bool(re.match(r"^\d{1,2}\s*[./]?\s*(CUNG|BÁT BỘ|VẬN HẠN|MỘT SỐ|TƯỚNG SỐ)", r["t"]))
        if r["p"] == 216:
            return r is FIRST_ROW.get(216)
        return False

elif BOOK == "tv2":
    TITLE = "Tử Vi Nam Phái – Phần 2"
    PAGE_OFFSET = 1
    CHART_PAGES = set()
    FOLDERS = json.load(open(os.path.join(SCRATCH, "tv2_folders.json"))) if os.path.exists(os.path.join(SCRATCH, "tv2_folders.json")) else [(1, "Nội dung")]

    def is_heading(r):
        if r["n"] > 1 or not (0.06 < r["y"] < 0.93):
            return False
        t = r["t"].strip()
        if re.sub(r"^\W+", "", t) in ("LỤC THẬP HOA GIÁP", "VẬN") or t.startswith("AN SAO LƯU ĐỘNG"):
            return True
        return caps_ratio(t) > 0.9 and abs(r["c"] - 0.5) < 0.1 and len(t) < 60

TITLE_FIX = {"THÁT SÁT": "THẤT SÁT", "HÓÁ": "HÓA", "QUÓC ÁN - PHONG CÁQ-": "QUỐC ẤN - PHONG CÁO -", "LÁ SÔ": "LÁ SỐ",
             "ĐIỂU KHÁCH": "ĐIẾU KHÁCH", "CÁCH CỰC": "CÁCH CỤC", "TẢ PHỦ": "TẢ PHÙ", "ĐƯỜNG PHÙ": "ĐƯỜNG PHÙ",
             "CHÍNH TÌNH": "CHÍNH TINH", "PHỤ MÂU": "PHỤ MẪU", "ĐIỆN TRẠCH": "ĐIỀN TRẠCH",
             "KẾT HỢP MÔI": "KẾT HỢP MÔI TRƯỜNG SỐNG", "TIỀU HAO": "TIỂU HAO", "BẠCH HỒ": "BẠCH HỔ"}
FIRST_ROW = {}
for r in ROWS:
    FIRST_ROW.setdefault(r["p"], r)

# ---------------------------------------------------------------- sections
sections = []  # dict(title, start_idx_in_ROWS, folder)
folder_starts = {fs: ft for fs, ft in FOLDERS}
i = 0
while i < len(ROWS):
    r = ROWS[i]
    if r["p"] in folder_starts and r is FIRST_ROW[r["p"]] and (not sections or sections[-1]["p"] != r["p"]):
        # forced section start at folder boundary (title refined below if row itself is heading)
        sections.append(dict(title=None, start=i, p=r["p"]))
    if is_heading(r):
        title = r["t"]
        j = i + 1
        while j < len(ROWS) and ROWS[j]["p"] == r["p"] and is_heading(ROWS[j]) and ROWS[j]["y"] - ROWS[j-1]["y"] < 0.05:
            title += " " + ROWS[j]["t"]; j += 1
        # keep only the uppercase lead of a heading row ("3. CUNG QUAN LỘC: là ..." -> "3. CUNG QUAN LỘC")
        words, keep = title.replace(":", " : ").split(), []
        for w in words:
            if w == ":" or any(c.islower() for c in w):
                break
            keep.append(w)
        title = " ".join(keep) or title
        if BOOK == "tv1" and r["p"] == 216:
            title = "Hỏi đáp và phú giải"
        if sections and sections[-1]["title"] is None and sections[-1]["start"] == i:
            sections[-1]["title"] = title; sections[-1]["hdr_end"] = j
        else:
            if sections and sections[-1]["title"] is None and sections[-1]["p"] == r["p"] and len(sections) > 1:
                sections.pop()  # forced folder start on a page that has its own heading: rows above stay with previous section
                folder_starts.pop(r["p"], None)
                FOLDERS[:] = [(r["p"] if fs == r["p"] else fs, ft) for fs, ft in FOLDERS]
            sections.append(dict(title=title, start=i, p=r["p"], hdr_end=j))
        i = j
        continue
    i += 1

# chart sections for tv1 "Lá số mẫu": every chart page starts a new sample
if BOOK == "tv1":
    for pi in sorted(CHART_PAGES):
        if pi >= 246:
            k = next(n for n, r in enumerate(ROWS) if r["p"] == pi)
            if not any(s["start"] == k for s in sections):
                sections.append(dict(title=None, start=k, p=pi))
    sections.sort(key=lambda s: s["start"])

if ONLY_HEADINGS:
    for s in sections:
        print(s["p"], "|", s["title"])
    sys.exit()


# ---------------------------------------------------------------- reflow rows → markdown
BULLET = re.compile(r"^(?:[-–•●❖◆➢>✓]|o(?=\s|[A-ZĐÀ-Ỹ])|\+(?=\s?\S))\s*")
NUMBERED = re.compile(r"^(\d{1,2}(\.\d)?|[IVX]+|[a-z])\s*[./)]\s*\S")


def render(rows):
    if not rows:
        return ""
    lefts = sorted(r["x"] for r in rows if r["n"] == 1)
    base = lefts[len(lefts) // 10] if lefts else 0.08
    out, cur = [], None
    for k, r in enumerate(rows):
        t = r["t"].strip()
        prev = rows[k - 1] if k else None
        new_page = prev is not None and prev["p"] != r["p"]
        starts_item = bool(BULLET.match(t) or NUMBERED.match(t) or t.startswith("*")) or r["n"] > 1
        para_indent = (r["x"] - base) > 0.03 and not new_page and not (cur is not None and cur["bullet"])
        cont = (cur is not None and not starts_item and not para_indent and prev is not None and prev["n"] == 1
                and prev["xr"] > 0.74 and not prev["t"].rstrip().endswith(":")
                and (new_page or r["y"] - prev["y"] < 0.05))
        if cont:
            cur["t"] += " " + t
            continue
        indent = r["x"] - base
        level = 0
        if BULLET.match(t):
            sym = t[0]
            level = 1 if (sym in "+o" or indent > 0.08) else 0
        cur = dict(t=t, level=level, bullet=bool(BULLET.match(t)), multi=r["n"] > 1)
        out.append(cur)
    md = []
    for b in out:
        t = re.sub(r"\s+", " ", b["t"]).strip()
        if b["bullet"]:
            md.append("  " * b["level"] + "- " + BULLET.sub("", t))
        elif b["multi"]:
            md.append("`" + t.replace("`", "'") + "`" if False else t + "  ")
        else:
            md.append(t + "  ")
    # blank lines between non-list blocks for readability
    res = []
    for line in md:
        is_list = line.lstrip().startswith("- ")
        if res and not (is_list and res[-1].lstrip().startswith("- ")):
            res.append("")
        res.append(line)
    return "\n".join(res)


# ---------------------------------------------------------------- write
if os.path.exists(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT)
asset_dir = os.path.join(OUT, "_anh-trang")


def page_image(pi):
    os.makedirs(asset_dir, exist_ok=True)
    src = os.path.join(IMGDIR, f"p-{pi + 1:03d}.png")
    dst = os.path.join(asset_dir, f"trang-{pi + 1 - PAGE_OFFSET:03d}.jpg")
    if not os.path.exists(dst):
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "70", "-Z", "1400", src, "--out", dst],
                       capture_output=True)
    return os.path.relpath(dst, OUT)


def folder_of(pi):
    cur = None
    for k, (fs, ft) in enumerate(FOLDERS):
        if pi >= fs:
            cur = (k, ft)
    return cur


written, counters, sample_no = [], {}, 0
for n, s in enumerate(sections):
    end = sections[n + 1]["start"] if n + 1 < len(sections) else len(ROWS)
    fk, ftitle = folder_of(s["p"])
    if ftitle is None:
        continue
    body_rows = ROWS[s.get("hdr_end", s["start"]):end]
    title = s["title"]
    if title is None:
        if BOOK == "tv1" and s["p"] >= 246:
            sample_no += 1
            title = f"Lá số mẫu {sample_no}"
        elif BOOK == "tv2" and s["p"] == 1:
            title = "Cách an sao Tử Vi"
        else:
            title = ftitle
    title = re.sub(r"^(?:[:❖•*]\s*|ở\s+)", "", title)
    if title.startswith(("AN SAO LƯU ĐỘNG",)):
        title = "AN SAO LƯU ĐỘNG"
    for a, b in TITLE_FIX.items():
        title = title.replace(a, b)
    title_n = nice(re.sub(r"^\d{1,2}\s*[./]?\s*", "", title)) if (caps_ratio(title) > 0.9 or title.isupper()) else title
    pages = sorted({r["p"] for r in ROWS[s["start"]:end]})
    # chart pages: drop the OCR noise of the grid, embed the scanned page instead
    parts, rows_buf = [], []
    for pi in pages:
        prs = [r for r in body_rows if r["p"] == pi]
        if pi in CHART_PAGES:
            parts.append(render(rows_buf)); rows_buf = []
            parts.append(f"![Trang {pi + 1 - PAGE_OFFSET}]({{IMG}}{page_image(pi)})")
            # keep prose printed around the chart grid (wide lines from the left margin + their continuations)
            last = None
            for r in prs:
                wide = r["n"] == 1 and r["x"] < 0.12 and (r["xr"] - r["x"]) > 0.45
                follow = last is not None and r["n"] == 1 and r["x"] < 0.12 and r["y"] - last["y"] < 0.04
                if wide or follow:
                    rows_buf.append(r); last = r
        else:
            rows_buf += prs
    parts.append(render(rows_buf))
    body = "\n\n".join(p for p in parts if p.strip())
    if not body.strip():
        continue
    folder = f"{fk + 1:02d}_{slug(ftitle)}"
    counters[folder] = counters.get(folder, 0) + 1
    fname = f"{counters[folder]:02d}_{slug(title_n) or 'Muc'}.md"
    rel = os.path.join(folder, fname)
    p_from, p_to = pages[0] + 1 - PAGE_OFFSET, pages[-1] + 1 - PAGE_OFFSET
    head = f"# {title_n}\n\n> {ftitle}  \n> Trang sách {p_from}–{p_to} · *{TITLE}* (bản scan, chữ được nhận dạng OCR)\n\n"
    body = body.replace("{IMG}", "../")
    os.makedirs(os.path.join(OUT, folder), exist_ok=True)
    open(os.path.join(OUT, rel), "w").write(head + body + "\n")
    written.append((rel, ftitle, title_n, p_from, p_to))

idx = [f"# {TITLE}", "", "Tác giả: Lê Quang Lăng. Sách là bản scan; nội dung được nhận dạng chữ (OCR) rồi chia theo mục. "
       "Bảng, sơ đồ và chữ viết tay có thể nhận dạng chưa chuẩn — đối chiếu bản PDF theo số trang.", ""]
last = None
for rel, ft, t, a, b in written:
    if ft != last:
        idx += ["", f"## {ft}", "", "| Mục | Trang |", "|---|---|"]
        last = ft
    idx.append(f"| [{t}]({rel}) | {a}–{b} |")
open(os.path.join(OUT, "README.md"), "w").write("\n".join(idx) + "\n")
print("files:", len(written))
