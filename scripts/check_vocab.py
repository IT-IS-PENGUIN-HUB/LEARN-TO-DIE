"""Soi kho từ tìm lỗi làm hỏng quiz. Chạy sau mỗi đợt thêm/sửa từ:

    python scripts/check_vocab.py

Bắt 3 lỗi:
1. NGHĨA lẫn chữ Nhật — quiz lấy nghĩa làm đáp án, có chữ Hán trong đó là chỉ
   thẳng đáp án (nặng nhất khi nghĩa chứa đúng từ đang hỏi, và ở chế độ
   "nghĩa → chữ Hán" thì luôn luôn lộ).
2. CÁCH ĐỌC lẫn chữ Hán — chế độ "chữ Hán → cách đọc" cần kana thuần.
3. Thiếu nghĩa / thiếu cách đọc — không ra đề được.

Bỏ qua "bia mộ" (deleted: true) vì app đã ẩn chúng.
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOCAB = ROOT / "vocab.json"

# Chữ Nhật thật sự — bỏ các dấu câu full-width (・、。～（）) vốn vô hại trong tiếng Việt
JP = re.compile(r"[぀-ゟァ-ヺー一-鿿々ｦ-ﾟ]")
KANJI = re.compile(r"[一-鿿々]")


def main():
    vocab = json.loads(VOCAB.read_text(encoding="utf-8"))
    leaks, jp_in_meaning, kanji_in_kana, missing = [], [], [], []

    for subject, entries in vocab.items():
        for e in entries:
            if e.get("deleted") is True:
                continue
            jp, kana, meaning = e.get("jp", ""), e.get("kana", ""), e.get("meaning", "")
            label = f"[{subject}] {jp}"
            if meaning and JP.search(meaning):
                (leaks if jp and jp in meaning else jp_in_meaning).append(f"{label} → {meaning}")
            if kana and KANJI.search(kana):
                kanji_in_kana.append(f"{label} → {kana}")
            if not meaning.strip() or not kana.strip():
                missing.append(f"{label} (thiếu {'nghĩa' if not meaning.strip() else 'cách đọc'})")

    def report(title, rows, limit=15):
        print(f"\n{title}: {len(rows)}")
        for r in rows[:limit]:
            print(f"  - {r}")
        if len(rows) > limit:
            print(f"  … còn {len(rows) - limit} dòng nữa")

    report("LỘ ĐÁP ÁN — nghĩa chứa đúng từ đang hỏi", leaks)
    report("Nghĩa còn lẫn chữ Nhật khác", jp_in_meaning)
    report("Cách đọc lẫn chữ Hán (phải là kana thuần)", kanji_in_kana)
    report("Thiếu nghĩa hoặc thiếu cách đọc", missing)

    bad = len(leaks) + len(jp_in_meaning) + len(kanji_in_kana)
    print(f"\n=> {'CÓ LỖI cần sửa' if bad else 'Sạch'} ({bad} chỗ lẫn chữ Nhật).")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
