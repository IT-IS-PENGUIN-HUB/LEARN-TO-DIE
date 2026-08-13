# -*- coding: utf-8 -*-
"""Sinh dữ liệu module Đề thi cho app từ kho 1189 câu.

Đọc:  kho-de-thi/questions.jsonl  +  kho-de-thi/diagrams/
Ghi:  public/exam-data/<năm>-<MÔN>.json   (45 mảnh, app fetch lúc chạy)
      public/exam-data/diagrams/...        (ảnh hình vẽ, chỉ chép khi khác byte)
      src/data/examBank.js                 (manifest nhỏ, app import tĩnh)

Chạy:  python scripts/build_examdata.py
Windows nhớ:  $env:PYTHONIOENCODING="utf-8"  (không thì print tiếng Nhật lỗi cp932)

BA ĐIỀU KHÔNG ĐƯỢC QUÊN
1. KHÔNG xuất `option*JaFurigana` — nó KHÔNG phải chú âm mà là bộ đáp án khác
   (83/1189 câu lệch, có câu xáo cả thứ tự A–E). Render nó = chấm sai câm lặng.
   Chỉ `questionJaFurigana` mới thật là chú âm.
2. 4 câu ban tổ chức HUỶ + 1 câu chấp nhận 2 đáp án → đánh dấu `sp` để app chấm
   riêng. Đối chiếu lại bất cứ lúc nào bằng: python kho-de-thi/check_official.py
3. Không giả định "mọi năm 80 câu" — 2011–2012 vốn 基礎 chỉ 25 câu. Mọi con số
   đều đếm từ dữ liệu.
"""
import json
import re
import shutil
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KHO = ROOT / "kho-de-thi"
SRC_JSONL = KHO / "questions.jsonl"
SRC_DIAG = KHO / "diagrams"
OUT_DIR = ROOT / "public" / "exam-data"
OUT_DIAG = OUT_DIR / "diagrams"
OUT_BANK = ROOT / "src" / "data" / "examBank.js"

LETTERS = "ABCDE"

# Thứ tự 5 nhóm của 基礎科目 trong đề thật: Ⅰ-1 … Ⅰ-5 (đã đối chiếu với công bố
# chính thức). Cần vì có năm đánh số câu LẶP LẠI 1–6 trong từng nhóm thay vì
# 1–30 liên tục, lúc đó chỉ nhìn questionNumber thì không biết câu nào trước.
KISO_GROUP_ORDER = ["KISO_DESIGN", "KISO_INFO", "KISO_ANALYSIS", "KISO_MATERIAL", "KISO_ENV"]

# Xác minh bằng công bố chính thức của 日本技術士会 (check_official.py):
# 1185/1189 khớp, 0 lệch. Còn lại là 5 ca do BAN TỔ CHỨC, không phải lỗi dữ liệu.
SPECIAL = {
    "2025-KENSETSU-URB-13": {"voided": True},   # sai tên luật → huỷ
    "2020-KISO-ENV-29": {"voided": True},
    "2018-TEKISEI-ETHICS-44": {"voided": True},
    "2014-KISO-ENV-03": {"voided": True},
    "2011-TEKISEI-LAW-04": {"multi": ["A", "E"]},  # ① hoặc ⑤ đều đúng
}

SUBJECT_META = {
    "KISO": {"ja": "基礎科目", "vi": "Kiến thức cơ sở", "short": "基礎"},
    "TEKISEI": {"ja": "適性科目", "vi": "Đạo đức nghề nghiệp", "short": "適性"},
    "KENSETSU": {"ja": "専門科目（建設部門）", "vi": "Chuyên ngành xây dựng", "short": "専門"},
}

# Năm dương → niên hiệu Nhật (sinh tự động, không viết tay từng năm)
def wareki(year):
    if year >= 2019:
        n = year - 2018
        return "令和元年度" if n == 1 else f"令和{n}年度"
    n = year - 1988
    return f"平成{n}年度"


def clean(s):
    """Chuẩn hoá nhẹ: bỏ khoảng trắng thừa hai đầu, giữ nguyên nội dung."""
    if s is None:
        return None
    s = s.strip()
    return s or None


def main():
    if not SRC_JSONL.exists():
        sys.exit(f"Không thấy {SRC_JSONL}")

    # ---- gom ảnh theo qid: <qid>_Q<n>.<ext> (đề) và <qid>_E<n>.<ext> (lời giải)
    diag = defaultdict(lambda: {"Q": [], "E": []})
    if SRC_DIAG.is_dir():
        pat = re.compile(r"^(?P<qid>.+?)_(?P<kind>[QE])(?P<n>\d+)\.(?P<ext>\w+)$")
        for f in sorted(SRC_DIAG.iterdir()):
            if not f.is_file():
                continue
            m = pat.match(f.name)
            if not m:
                print(f"  ⚠ tên ảnh lạ, bỏ qua: {f.name}")
                continue
            diag[m["qid"]][m["kind"]].append((int(m["n"]), f.name))
    for d in diag.values():
        for k in ("Q", "E"):
            d[k] = [name for _, name in sorted(d[k])]

    # ---- đọc kho
    shards = defaultdict(list)
    sources = {}
    cats = {}
    warn = defaultdict(list)
    total = 0

    with open(SRC_JSONL, encoding="utf-8") as fh:
        for line in fh:
            r = json.loads(line)
            total += 1
            qid = r["qid"]
            subject = qid.split("-")[1]
            year = r["year"]

            cat = r.get("category") or {}
            code = cat.get("code")
            if code:
                if code not in cats:
                    cats[code] = {
                        "ja": cat.get("nameJa") or code,
                        "vi": cat.get("nameVi") or cat.get("nameJa") or code,
                        "subject": subject,
                        "count": 0,
                    }
                cats[code]["count"] += 1  # để màn duyệt theo chuyên mục hiện số câu

            o_ja, o_vi = [], []
            for L in LETTERS:
                ja = clean(r.get(f"option{L}Ja"))
                if ja is None:
                    break                      # phương án dừng ở đây
                o_ja.append(ja)
                o_vi.append(clean(r.get(f"option{L}Vi")) or "")
            if len(o_ja) < 2:
                warn["thiếu phương án"].append(qid)
            if not clean(r.get("questionVi")):
                warn["thiếu bản dịch đề"].append(qid)
            if not clean(r.get("explanationVi")):
                warn["thiếu lời giải tiếng Việt"].append(qid)

            ans = (r.get("correctAnswer") or "").strip().upper()
            if ans not in LETTERS[: len(o_ja)]:
                warn["đáp án không hợp lệ"].append(f"{qid}={ans!r}")

            q = {
                "qid": qid,
                "cat": code,
                "qn": r.get("questionNumber"),
                "diff": r.get("difficulty"),
                "qJa": clean(r.get("questionJa")),
                "qVi": clean(r.get("questionVi")),
                "oJa": o_ja,
                "oVi": o_vi,
                "ans": ans,
                "eJa": clean(r.get("explanationJa")),
                "eVi": clean(r.get("explanationVi")),
            }
            fur = clean(r.get("questionJaFurigana"))
            if fur:
                q["qFuri"] = fur                # CHỈ furigana của ĐỀ mới dùng được
            d = diag.get(qid)
            if d:
                if d["Q"]:
                    q["dQ"] = d["Q"]
                if d["E"]:
                    q["dE"] = d["E"]
            elif r.get("hasDiagram"):
                warn["câu báo có hình mà thiếu file"].append(qid)
            if qid in SPECIAL:
                q["sp"] = SPECIAL[qid]

            shards[(year, subject)].append(q)
            sources.setdefault(year, clean(r.get("source")))

    # ---- ghi mảnh
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUT_DIR.glob("*.json"):
        old.unlink()
    bytes_json = 0
    for (year, subject), rows in sorted(shards.items()):
        # THỨ TỰ ĐỀ THẬT, không phải thứ tự bảng chữ cái của qid: qid mở đầu bằng
        # mã chuyên mục nên sắp theo qid sẽ ra CON trước GEO, người học mở đề thấy
        # ngay câu 10. Năm nào đánh số lặp trong từng nhóm thì xếp theo nhóm trước.
        grouped = len({r["qn"] for r in rows}) < len(rows)
        def order_key(r):
            if grouped and r["cat"] in KISO_GROUP_ORDER:
                return (KISO_GROUP_ORDER.index(r["cat"]), r["qn"] or 0)
            return (0, r["qn"] or 0)
        rows.sort(key=order_key)
        for i, r in enumerate(rows, 1):
            r["ord"] = i          # vị trí trong đề, app chỉ việc theo thứ tự này
        payload = {
            "year": year,
            "subject": subject,
            "source": sources.get(year),
            "count": len(rows),
            "questions": rows,
        }
        p = OUT_DIR / f"{year}-{subject}.json"
        text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"), sort_keys=False)
        p.write_text(text, encoding="utf-8")
        bytes_json += len(text.encode("utf-8"))

    # ---- chép ảnh (chỉ khi khác)
    OUT_DIAG.mkdir(parents=True, exist_ok=True)
    used = {n for d in diag.values() for k in ("Q", "E") for n in d[k]}
    copied = skipped = 0
    for name in sorted(used):
        src, dst = SRC_DIAG / name, OUT_DIAG / name
        if dst.exists() and dst.stat().st_size == src.stat().st_size \
                and dst.read_bytes() == src.read_bytes():
            skipped += 1
            continue
        shutil.copy2(src, dst)
        copied += 1
    for stale in OUT_DIAG.iterdir():
        if stale.is_file() and stale.name not in used:
            stale.unlink()

    # ---- manifest
    years = {}
    for (year, subject), rows in shards.items():
        y = years.setdefault(year, {"year": year, "wa": wareki(year), "subjects": {}, "total": 0})
        y["subjects"][subject] = len(rows)
        y["total"] += len(rows)
    # đề gốc từng có bao nhiêu câu: suy từ số câu LỚN NHẤT quan sát được ở mọi năm
    # cho từng môn (2011–2012 基礎 vốn 25 câu nên KHÔNG lấy 30 làm chuẩn chung)
    year_list = [years[y] for y in sorted(years, reverse=True)]
    bank_total = sum(y["total"] for y in year_list)

    lines = [
        "// SINH TỰ ĐỘNG bởi scripts/build_examdata.py — ĐỪNG SỬA TAY.",
        "// Chạy lại sau mỗi lần bổ sung đề: python scripts/build_examdata.py",
        "",
        f"export const BANK_TOTAL = {bank_total};",
        "",
        "export const SUBJECT_META = "
        + json.dumps(SUBJECT_META, ensure_ascii=False, indent=2) + ";",
        "",
        "export const CATEGORIES = "
        + json.dumps(dict(sorted(cats.items())), ensure_ascii=False, indent=2) + ";",
        "",
        "// Danh sách năm sinh TỪ DỮ LIỆU — thêm đề năm mới chỉ cần chạy lại script.",
        "export const EXAM_YEARS = "
        + json.dumps(year_list, ensure_ascii=False, indent=2) + ";",
        "",
        "const BASE = import.meta.env.BASE_URL;",
        "export const examDataUrl = (year, subject) =>",
        "  `${BASE}exam-data/${year}-${subject}.json`;",
        "export const diagramUrl = (name) => `${BASE}exam-data/diagrams/${name}`;",
        "",
    ]
    OUT_BANK.parent.mkdir(parents=True, exist_ok=True)
    OUT_BANK.write_text("\n".join(lines), encoding="utf-8")

    # ---- báo cáo
    mb = lambda n: f"{n / 1048576:.2f} MB"
    print("=" * 66)
    print(f"Đã đọc {total} câu → {len(shards)} mảnh JSON ({mb(bytes_json)} chưa nén)")
    print(f"Ảnh: chép {copied}, giữ nguyên {skipped}, tổng {len(used)} file")
    print(f"Manifest: {OUT_BANK.relative_to(ROOT)} — {len(year_list)} năm, "
          f"{len(cats)} chuyên mục, BANK_TOTAL={bank_total}")
    biggest = max(OUT_DIR.glob("*.json"), key=lambda p: p.stat().st_size)
    print(f"Mảnh nặng nhất: {biggest.name} = {biggest.stat().st_size / 1024:.0f} KB")
    print(f"Câu đặc biệt gắn cờ: {len(SPECIAL)} "
          f"({sum(1 for v in SPECIAL.values() if v.get('voided'))} huỷ, "
          f"{sum(1 for v in SPECIAL.values() if v.get('multi'))} hai đáp án)")
    if warn:
        print("-" * 66)
        for k, v in warn.items():
            print(f"⚠ {k}: {len(v)} → {v[:5]}{' …' if len(v) > 5 else ''}")
    else:
        print("Không có cảnh báo nào.")
    print("=" * 66)


if __name__ == "__main__":
    main()
