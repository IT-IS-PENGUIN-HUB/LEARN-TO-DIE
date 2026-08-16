# Sinh src/data/chapterWords.json — từ vựng của kho nằm trong khoảng trang từng chương.
#
# Dùng cho nút "Ôn N từ vựng của chương này" trong trình đọc giáo trình.
# Chạy lại khi: thêm giáo trình mới, đổi khoảng trang chương, hoặc thêm nhiều từ mới.
#
#   PYTHONIOENCODING=utf-8 python scripts/build_chapter_words.py           # tất cả môn có PDF
#   PYTHONIOENCODING=utf-8 python scripts/build_chapter_words.py kiso      # chỉ một môn
#
# Nguồn sự thật là src/data/textbooks.js (đọc ngược khoảng trang từ đó, KHÔNG gõ lại số trang)
# và vocab.json ở repo root (đích sync của app).
#
# HAI CÁI BẪY đã trả giá, đừng bỏ:
#  1. Phải LỌC BOILERPLATE trước khi dò. Header lặp mọi trang và nhất là dòng ghi nguồn
#     "出典：公益社団法人日本技術士会…" (đổi theo năm nên KHÔNG bị luật "dòng lặp" bắt) làm
#     từ 公益 dính 47/68 chương — nút ôn từ của chương nào cũng có nó.
#  2. Từ 1 ký tự bị loại: khớp chuỗi con thô nên chữ lẻ dính vào bất kỳ từ ghép nào.

import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
TEXTBOOKS_JS = ROOT / 'src' / 'data' / 'textbooks.js'
VOCAB_JSON = ROOT / 'vocab.json'
OUT_JSON = ROOT / 'src' / 'data' / 'chapterWords.json'
PUBLIC = ROOT / 'public'

# Dòng ghi nguồn đề: nội dung đổi theo năm/số câu nên không lặp y hệt → lọc bằng mẫu.
CITE = re.compile(r'出典|公益社団法人')

ROW_RE = re.compile(
    r"\{ id: '([^']+)', kind: '([^']+)',(?: no: '[^']*',)? doc: '([^']+)', "
    r"start: (\d+), end: (\d+)"
)
# `\s*` sau `{`: DOCS của 適性 xuống dòng sau dấu mở ngoặc, của 基礎 thì không —
# thiếu nó thì môn viết kiểu nhiều dòng bị bỏ qua lặng lẽ (tưởng đã cập nhật mà không).
DOC_RE = re.compile(r"\{\s*id: '([^']+)',[^}]*?path: '([^']+)'", re.S)


def parse_block(src, marker, subject):
    """Cắt mảng `<subject>: [ … ]` nằm sau `marker` (DOCS hoặc CHAPTERS) trong textbooks.js."""
    after = src.split(marker, 1)[1]
    block = after.split(f'  {subject}: [', 1)
    if len(block) < 2:
        return ''
    return block[1].split('\n  ],', 1)[0]


def load_declarations(subject):
    src = TEXTBOOKS_JS.read_text(encoding='utf-8')
    docs = dict(DOC_RE.findall(parse_block(src, 'const DOCS', subject)))
    chapters = ROW_RE.findall(parse_block(src, 'const CHAPTERS', subject))
    return docs, chapters


def page_texts(pdf_path):
    """Text từng trang, đã bỏ header/footer lặp và dòng ghi nguồn đề."""
    doc = fitz.open(pdf_path)
    raw = [
        [unicodedata.normalize('NFKC', line).strip()
         for line in doc[i].get_text().splitlines() if line.strip()]
        for i in range(doc.page_count)
    ]
    doc.close()
    freq = Counter()
    for lines in raw:
        freq.update(set(lines))
    limit = max(3, len(raw) * 0.3)
    boiler = {line for line, n in freq.items() if n >= limit}
    return ['\n'.join(l for l in lines if l not in boiler and not CITE.search(l)) for lines in raw]


def stems(word):
    """Dạng để dò: nguyên văn + bỏ đuôi hiragana (見合う → 見合)."""
    forms = {unicodedata.normalize('NFKC', word)}
    m = re.match(r'^(.*?[一-鿿゠-ヿ])[぀-ゟ]+$', word)
    if m and len(m.group(1)) >= 2:
        forms.add(unicodedata.normalize('NFKC', m.group(1)))
    return forms


def build(subject, vocab):
    docs, chapters = load_declarations(subject)
    if not docs or not chapters:
        return None
    words = [w['jp'] for w in vocab.get(subject, [])
             if not w.get('deleted') and w.get('jp') and len(w['jp']) >= 2]
    cache = {}
    out = {}
    for cid, _kind, doc_id, start, end in chapters:
        if doc_id not in cache:
            path = PUBLIC / docs[doc_id]
            if not path.exists():
                print(f'  ! thiếu file {path}')
                cache[doc_id] = []
            else:
                cache[doc_id] = page_texts(path)
        text = ''.join(cache[doc_id][int(start) - 1:int(end)])
        hit = sorted({w for w in words if any(s in text for s in stems(w))})
        if hit:
            out[cid] = hit
    covered = len({w for ws in out.values() for w in ws})
    print(f'{subject}: {len(out)} mục · {sum(len(v) for v in out.values())} lượt gán · '
          f'{covered}/{len(words)} từ có trong giáo trình')
    return out


def main():
    vocab = json.loads(VOCAB_JSON.read_text(encoding='utf-8'))
    wanted = sys.argv[1:] or ['kiso', 'tekisei', 'senmon']
    result = json.loads(OUT_JSON.read_text(encoding='utf-8')) if OUT_JSON.exists() else {}
    for subject in wanted:
        built = build(subject, vocab)
        if built is not None:
            result[subject] = built
    OUT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'→ ghi {OUT_JSON.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
