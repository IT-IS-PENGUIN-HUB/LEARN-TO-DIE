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
#  3. Bộ 2025 là ảnh → quét ra rất ít; bảng SUPPLEMENT bên dưới bù theo chủ đề. KHÔNG sửa tay
#     chapterWords.json.
#  4. Giáo trình 専門 2025 là slide đã DỊCH SANG TIẾNG VIỆT, thuật ngữ Nhật nằm trong ảnh →
#     quét text ra gần như 0 từ. Những mục đó gán tay trong scripts/chapter_words_manual.json
#     ({môn: {mã mục: [từ]}}) — file đó là NGUỒN, sửa ở đó, vẫn không sửa chapterWords.json.

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
MANUAL_JSON = Path(__file__).resolve().parent / 'chapter_words_manual.json'
PUBLIC = ROOT / 'public'

# Dòng ghi nguồn đề: nội dung đổi theo năm/số câu nên không lặp y hệt → lọc bằng mẫu.
CITE = re.compile(r'出典|公益社団法人')

# Bộ 2025 là slide bài giảng, phần lớn là ẢNH: quét chữ chỉ ra 1–19 từ mỗi mục, nút
# "Ôn N từ vựng của chương này" thành vô nghĩa. Bù bằng cách ghép mỗi mục 2025 với các
# mục CÙNG CHỦ ĐỀ bên bộ cũ (song ngữ, có text layer): từ của mục cũ được cộng thêm vào
# mục 2025. Bảng do người đối chiếu mục lục hai bộ (chương 4: 15/9/2026, chương 1–3:
# cùng ngày). Chương 5 bản 2025 có text layer thật nên KHÔNG bù, để ánh xạ bám đúng
# trang. Thêm giáo trình mới thì bổ sung Ở ĐÂY — đừng sửa tay chapterWords.json, vì
# lần chạy sau ghi đè mất (đã trả giá một lần).
SUPPLEMENT = {
    'kiso': {
        # 第1章 設計・計画（2025）
        'k25ch1_01': ['ch1_trend'],
        'k25ch1_02': ['ch1_05', 'ch1_07'],   # 数理計画法 = LP + 最適化・EOQ
        'k25ch1_03': ['ch1_08'],             # ユニバーサルデザイン
        'k25ch1_04': ['ch1_12'],             # 製造者責任法
        'k25ch1_05': ['ch1_04'],             # ATM利用問題 = 待ち行列
        'k25ch1_06': ['ch1_09'],             # 品質管理
        'k25ch1_07': ['ch1_03'],             # 製図の投影法
        'k25ch1_08': ['ch1_01'],             # 信頼性
        'k25ch1_09': ['ch1_01'],             # OR回路・AND回路 = FTA
        'k25ch1_10': ['ch1_02', 'ch1_06'],   # 設計に関する諸問題 = 材料力学 + 安全率
        'k25ch1_11': ['ch1_10'],             # ネットワーク工程表
        # 第2章 情報・論理（2025）
        'k25ch2_01': ['ch2_trend'],
        'k25ch2_02': ['ch2_10'],             # 基数変換
        'k25ch2_03': ['ch2_12'],             # 補数表現
        'k25ch2_04': ['ch2_09'],             # 浮動小数点
        'k25ch2_05': ['ch2_05'],             # 情報量の計算
        'k25ch2_06': ['ch2_03'],             # 論理演算
        'k25ch2_07': ['ch2_02', 'ch2_08'],   # 情報ネットワーク = 暗号 + ネットワーク
        'k25ch2_08': ['ch2_01'],             # アルゴリズム
        'k25ch2_09': ['ch2_13'],             # 逆ポーランド記法
        'k25ch2_10': ['ch2_14'],             # 数値計算誤差
        'k25ch2_11': ['ch2_11'],             # スタック＆キュー
        'k25ch2_12': ['ch2_08'],             # IPv4/IPv6
        # 第3章 解析（2025）
        'k25ch3_01': ['ch3_trend'],
        'k25ch3_02': ['ch3_10'],             # 導関数
        'k25ch3_03': ['ch3_02', 'ch3_10'],   # 偏微分 = ベクトル解析 + 導関数
        'k25ch3_04': ['ch3_04'],             # 積分
        'k25ch3_05': ['ch3_05'],             # 行列
        'k25ch3_06': ['ch3_01'],             # 応力・ひずみ
        'k25ch3_07': ['ch3_03'],             # ばね定数
        'k25ch3_08': ['ch3_01', 'ch3_03'],   # 断面二次モーメント・変位量
        'k25ch3_09': ['ch3_03'],             # 固有振動数・エネルギー
        'k25ch3_10': ['ch3_08'],             # 有限要素法
        # 第4章 材料・科学・バイオ（2025）— bản 2025 không có phần sinh học nên không
        # nhét DNA/protein (ch4_09–ch4_12) vào đây
        'k25ch4_01': ['ch4_trend'],
        'k25ch4_02': ['ch4_05'], 'k25ch4_03': ['ch4_05'], 'k25ch4_04': ['ch4_05'],
        'k25ch4_05': ['ch4_05'], 'k25ch4_06': ['ch4_05'],   # 原子〜異性体 = 原子・分子
        'k25ch4_07': ['ch4_06'],                            # 酸化数
        'k25ch4_08': ['ch4_07'], 'k25ch4_09': ['ch4_07'], 'k25ch4_10': ['ch4_07'],  # モル・反応式・熱化学
        'k25ch4_11': ['ch4_08'],                            # 化学特性 = 酸・塩基
        'k25ch4_12': ['ch4_02'],                            # 金属材料の特性
        'k25ch4_13': ['ch4_01'],                            # 結晶構造
        'k25ch4_14': ['ch4_04'],                            # 金属製造
        'k25ch4_15': ['ch4_02', 'ch4_04'],                  # 金属用途
        'k25ch4_16': ['ch4_02'], 'k25ch4_17': ['ch4_02'], 'k25ch4_18': ['ch4_02'],
        'k25ch4_19': ['ch4_02'], 'k25ch4_20': ['ch4_02'],   # 力学特性〜疲労破壊
        'k25ch4_21': ['ch4_04'],                            # 腐食
    },
}

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
    live = [w['jp'] for w in vocab.get(subject, []) if not w.get('deleted') and w.get('jp')]
    # Dò tự động bỏ từ 1 ký tự (bẫy 2); bảng gán tay thì không cần lọc vì người chọn sẵn.
    words = [w for w in live if len(w) >= 2]
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
        # PDF hay ngắt dòng GIỮA một từ nên dò trên bản đã bỏ hết khoảng trắng;
        # để nguyên xuống dòng thì từ đúng trong sách vẫn trượt ánh xạ.
        flat = re.sub(r'\s+', '', text)
        # Từ trong kho cũng có thể mang khoảng trắng ("2 進数") -> bỏ luôn cho khớp.
        hit = sorted({w for w in words
                      if any(re.sub(r'\s+', '', s) in flat for s in stems(w))})
        if hit:
            out[cid] = hit
    # Cộng từ của các mục cũ cùng chủ đề vào mục 2025 (xem SUPPLEMENT)
    ids = {cid for cid, *_ in chapters}
    for target, sources in SUPPLEMENT.get(subject, {}).items():
        if target not in ids:
            print(f'  ! SUPPLEMENT: không có mục {target} trong textbooks.js')
            continue
        merged = set(out.get(target, []))
        for src in sources:
            if src not in ids:
                print(f'  ! SUPPLEMENT: mục nguồn {src} không tồn tại')
            merged.update(out.get(src, []))
        if merged:
            out[target] = sorted(merged)
    # Gán tay (mục mà quét text không ra được từ) — xem ghi chú 4 ở đầu file.
    manual = json.loads(MANUAL_JSON.read_text(encoding='utf-8')) if MANUAL_JSON.exists() else {}
    known = set(live)
    for cid, ws in manual.get(subject, {}).items():
        if cid not in ids:
            print(f'  ! gán tay: không có mục {cid} trong textbooks.js')
            continue
        miss = [w for w in ws if w not in known]
        if miss:
            print(f'  ! gán tay {cid}: {len(miss)} từ không có trong kho ({" ".join(miss[:5])})')
        merged = set(out.get(cid, [])) | (set(ws) & known)
        if merged:
            out[cid] = sorted(merged)
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
