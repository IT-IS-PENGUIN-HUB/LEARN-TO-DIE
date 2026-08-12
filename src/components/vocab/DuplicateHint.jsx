import { useMemo } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { SUBJECTS } from '../../data/exams.js';

// Dưới 2 ký tự thì kiểu so "chứa nhau" khớp lung tung (một kanji nằm trong
// hàng chục từ ghép) nên chỉ xét từ dài từ 2 ký tự trở lên.
const MIN_LEN = 2;
const MAX_RELATED = 5;

/**
 * Tìm trong kho (mọi môn): từ trùng y hệt, và từ "dính" nhau — cụm đang nhập
 * chứa một từ đã có, hoặc ngược lại (nhập 公益 mà kho đã có 公益の確保).
 */
export function findDuplicates(allWords, raw) {
  const jp = (raw ?? '').trim();
  if (!jp) return { exact: null, related: [] };
  const exact = allWords.find((w) => w.jp.trim() === jp) ?? null;
  const related =
    jp.length >= MIN_LEN
      ? allWords
          .filter((w) => {
            const other = w.jp.trim();
            if (!other || other === jp || other.length < MIN_LEN) return false;
            return jp.includes(other) || other.includes(jp);
          })
          .slice(0, MAX_RELATED)
      : [];
  return { exact, related };
}

/**
 * Cảnh báo trùng khi đang nhập từ mới: trùng y hệt thì hiện luôn nội dung đã
 * có để khỏi nhập lại; dính một phần thì chỉ liệt kê cho biết.
 */
export default function DuplicateHint({ jp, onOpenInManager }) {
  const { allWords } = useVocab();
  const { exact, related } = useMemo(() => findDuplicates(allWords, jp), [allWords, jp]);

  if (!exact && !related.length) return null;

  return (
    <div className={`dup-box ${exact ? 'dup-exact' : ''}`}>
      {exact && (
        <>
          <p className="dup-title">
            ⚠ Từ này đã có trong kho ({SUBJECTS[exact.subject]?.nameJp ?? exact.subject}) — không cần nhập lại
          </p>
          <div className="dup-entry">
            <span className="jp-text dup-jp">{exact.jp}</span>
            {exact.kana && <span className="dup-kana">{exact.kana}</span>}
            <span className="dup-meaning">{exact.meaning || <em className="manager-missing">chưa có nghĩa</em>}</span>
            {exact.exJp && <span className="jp-text dup-ex">{exact.exJp}</span>}
            {exact.exVi && <span className="dup-ex">{exact.exVi}</span>}
          </div>
          {onOpenInManager && (
            <button type="button" className="btn btn-xs btn-outline" onClick={() => onOpenInManager(exact)}>
              Mở trong 🗂 Kho từ để sửa
            </button>
          )}
        </>
      )}

      {related.length > 0 && (
        <>
          <p className="dup-title dup-title-soft">Trong kho đã có từ liên quan:</p>
          <ul className="dup-related">
            {related.map((w) => (
              <li key={`${w.subject}-${w.id}`}>
                <span className="jp-text">{w.jp}</span>
                {w.kana && <span className="dup-kana"> {w.kana}</span>}
                <span className="dup-meaning"> — {w.meaning || 'chưa có nghĩa'}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
