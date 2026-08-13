"""Đếm tần suất từ vựng trong text các đề thi thật.

Chạy lại khi thêm từ mới hoặc thêm đề mới:
    python scripts/build_freq.py

Sinh ra:
    src/data/freq.json          — app đọc để hiện nhãn "hay thi"
    docs/tan-suat-tu-vung.csv   — bảng đầy đủ, mở bằng Excel
    docs/tan-suat-tu-vung.md    — báo cáo đọc bằng mắt

Ý nghĩa 4 con số của mỗi từ:
    hits/exams        — số lần / số kỳ, tính trên TẤT CẢ đề của cả ba môn
    ownHits/ownExams  — số lần / số kỳ, chỉ tính đề của đúng môn chứa từ đó

`ownExams` là con số đáng tin nhất để nói "từ này hay thi": ra 40 lần trong đúng
một kỳ chỉ là chủ đề của năm đó, còn ra ở 14/16 kỳ mới là từ phải thuộc. Vì vậy
freq.json xếp theo môn — cùng một từ nằm ở hai môn thì mẫu số khác nhau.

Tiếng Nhật không có dấu cách nên đây là đếm chuỗi con: từ 1 ký tự bị đếm lố
(基 tính cả trong 基礎・基本), từ 2 ký tự trở lên thì đáng tin. Động từ/tính từ
bị chia đuôi trong đề nên cột stem_* trong CSV đếm thêm theo gốc từ (見合う → 見合).
"""

import csv
import json
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "public" / "pdfs"
VOCAB = ROOT / "vocab.json"
OUT_JSON = ROOT / "src" / "data" / "freq.json"
OUT_CSV = ROOT / "docs" / "tan-suat-tu-vung.csv"
OUT_MD = ROOT / "docs" / "tan-suat-tu-vung.md"

# Thứ tự trong báo cáo: môn nào học trước đứng trước
SUBJECTS = ("tekisei", "kiso", "senmon")
SUBJECT_NAME = {"kiso": "基礎科目", "tekisei": "適性科目", "senmon": "専門科目"}
HIRAGANA = range(0x3041, 0x309F)
MEANING_MAX = 38
TOP_N = 50


def exam_texts():
    """{môn: [text từng đề]} — mỗi file PDF là một kỳ thi."""
    out = {}
    for subject in SUBJECTS:
        texts = []
        for path in sorted((PDF_DIR / subject).glob("*.pdf")):
            with fitz.open(path) as doc:
                texts.append("".join(page.get_text() for page in doc))
        out[subject] = texts
    return out


def count(word, texts):
    """(số lần, số kỳ) của một chuỗi trong danh sách text đề."""
    if not word:
        return 0, 0
    return sum(t.count(word) for t in texts), sum(1 for t in texts if word in t)


def stem_of(word):
    """Gốc từ: bỏ đuôi hiragana (見合う → 見合). Rỗng nếu không cắt được gì có ích."""
    chars = list(word)
    while chars and ord(chars[-1]) in HIRAGANA:
        chars.pop()
    stem = "".join(chars)
    # Cắt còn 1 ký tự thì đếm ra toàn nhiễu (図る → 図), thà bỏ trống
    return stem if len(stem) >= 2 and stem != word else ""


def unique_words(entries):
    """{từ: entry} — bỏ qua "bia mộ" (`deleted: true`): từ đã xoá vẫn nằm lại
    trong vocab.json để máy khác biết mà xoá theo, app ẩn chúng đi nên báo cáo
    và nhãn tần suất cũng phải ẩn. Từ nào lỡ lưu hai bản thì giữ bản đầy đủ hơn.
    """
    best = {}
    for entry in entries:
        word = (entry.get("jp") or "").strip()
        if not word or entry.get("deleted") is True:
            continue
        filled = sum(1 for k in ("kana", "meaning", "exJp") if (entry.get(k) or "").strip())
        cur = best.get(word)
        if cur is None or filled > cur[0]:
            best[word] = (filled, entry)
    return {word: entry for word, (_, entry) in best.items()}


def truncate(text, limit=MEANING_MAX):
    text = " ".join((text or "").split())
    return text if len(text) <= limit else f"{text[:limit]}…"


def main():
    texts = exam_texts()
    all_texts = [t for subject in SUBJECTS for t in texts[subject]]
    for subject in SUBJECTS:
        print(f"{subject}: {len(texts[subject])} đề")

    vocab = json.loads(VOCAB.read_text(encoding="utf-8"))
    freq = {}
    rows = []
    for subject in SUBJECTS:
        own_texts = texts[subject]
        freq[subject] = {}
        for word, entry in unique_words(vocab.get(subject, [])).items():
            hits, exams = count(word, all_texts)
            own_hits, own_exams = count(word, own_texts)
            freq[subject][word] = {
                "hits": hits,
                "exams": exams,
                "ownHits": own_hits,
                "ownExams": own_exams,
            }
            stem = stem_of(word)
            stem_hits, stem_exams = count(stem, own_texts)
            rows.append(
                {
                    "subject": subject,
                    "jp": word,
                    "kana": entry.get("kana", ""),
                    "meaning": entry.get("meaning", ""),
                    "hits": hits,
                    "exams": exams,
                    "own_hits": own_hits,
                    "own_exams": own_exams,
                    "stem": stem,
                    "stem_hits": stem_hits,
                    "stem_exams": stem_exams,
                }
            )

    OUT_JSON.write_text(json.dumps(freq, ensure_ascii=False, indent=1), encoding="utf-8")
    write_csv(rows)
    write_md(rows, {s: len(texts[s]) for s in SUBJECTS})
    total = sum(len(v) for v in freq.values())
    unseen = sum(1 for r in rows if r["hits"] == 0)
    print(f"{total} từ → {OUT_JSON.relative_to(ROOT)} ({unseen} từ chưa từng thấy trong đề)")
    print(f"báo cáo → {OUT_CSV.relative_to(ROOT)} + {OUT_MD.relative_to(ROOT)}")


def write_csv(rows):
    with OUT_CSV.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_md(rows, exam_counts):
    total_exams = sum(exam_counts.values())
    out = [
        f"# Tần suất từ vựng trong {total_exams} đề thi thật",
        "",
        f"Đếm từng từ trong kho từ vựng xem xuất hiện bao nhiêu lần trong text của {total_exams} đề",
        "(gồm cả phần đề bài và phần giải thích 解説).",
        "",
        "**Cột nào quan trọng nhất:** `Kỳ có / tổng kỳ môn`. Một từ ra 40 lần trong đúng",
        "một kỳ thì chỉ là chủ đề của năm đó; một từ ra ở 14/16 kỳ mới thật sự là từ phải thuộc.",
        "",
        "**Hai điểm cần biết khi đọc số:**",
        "",
        "1. Tiếng Nhật không có dấu cách nên đây là đếm chuỗi con. Từ **1 ký tự (đánh dấu ⚠)**",
        "   bị đếm lố vì nằm bên trong từ dài hơn — `基` được tính cả trong 基礎・基本・基準.",
        "   Từ 2 ký tự trở lên thì con số đáng tin.",
        "2. Động từ / tính từ bị chia đuôi trong đề nên dạng nguyên thể đếm ra ít hoặc bằng 0.",
        "   Cột `stem_hits` trong file CSV đếm theo gốc từ (見合う → 見合) để bù chỗ này.",
        "",
        f"Dữ liệu đầy đủ cho cả {len(rows)} từ: [tan-suat-tu-vung.csv](tan-suat-tu-vung.csv) (mở bằng Excel).",
        "",
    ]

    for subject in SUBJECTS:
        mine = [r for r in rows if r["subject"] == subject]
        n_exams = exam_counts[subject]
        every = sum(1 for r in mine if r["own_exams"] == n_exams)
        unseen = [r for r in mine if r["hits"] == 0]
        pct = round(len(unseen) / len(mine) * 100) if mine else 0
        out += [
            f"## {SUBJECT_NAME[subject]} — {len(mine)} từ, {n_exams} kỳ thi",
            "",
            f"- Ra ở **mọi kỳ** ({n_exams}/{n_exams}): **{every} từ**",
            f"- Chưa từng thấy trong đề nào: **{len(unseen)} từ** ({pct}%)",
            "",
            f"### {TOP_N} từ hay thi nhất",
            "",
            f"| # | Từ | Cách đọc | Nghĩa | Kỳ có / tổng kỳ môn | Lần trong môn | Tổng {total_exams} đề |",
            "|---|---|---|---|---|---|---|",
        ]
        top = sorted(mine, key=lambda r: (-r["own_exams"], -r["own_hits"], r["jp"]))[:TOP_N]
        for i, r in enumerate(top, 1):
            mark = " ⚠" if len(r["jp"]) == 1 else ""
            out.append(
                f"| {i} | {r['jp']}{mark} | {r['kana']} | {truncate(r['meaning'])} "
                f"| {r['own_exams']}/{n_exams} | {r['own_hits']} | {r['hits']} |"
            )
        out += [
            "",
            f"<details><summary>Từ chưa từng xuất hiện trong đề ({len(unseen)})</summary>",
            "",
            " · ".join(r["jp"] for r in unseen) if unseen else "(không có)",
            "",
            "</details>",
            "",
        ]

    OUT_MD.write_text("\n".join(out), encoding="utf-8")


if __name__ == "__main__":
    main()
