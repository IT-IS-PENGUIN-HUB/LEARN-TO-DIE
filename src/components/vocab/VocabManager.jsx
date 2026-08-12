import { useMemo, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { autofillWord } from '../../services/ai.js';
import { IconCheck, IconWand, IconX } from '../icons.jsx';

/** Từ hỏng: thiếu nghĩa (quiz sẽ hiện ô trống) hoặc thiếu cách đọc */
const isBroken = (w) => !w.meaning.trim() || !w.kana.trim();

const emptyDraft = { jp: '', kana: '', meaning: '', exJp: '', exVi: '' };

/**
 * Kho từ của một môn: tìm kiếm, sửa từng field, xoá hẳn từ hỏng.
 * Có bộ lọc "thiếu nội dung" vì đây là lý do chính phải mở màn này —
 * từ nhập thiếu nghĩa làm quiz hiện đáp án trống.
 */
export default function VocabManager({ subject }) {
  const { vocab, updateWord, deleteWord } = useVocab();
  const [q, setQ] = useState('');
  const [onlyBroken, setOnlyBroken] = useState(false);
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [confirmId, setConfirmId] = useState(null); // đang hỏi "xoá thật?"
  const [aiBusy, setAiBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {ok, text}

  const list = vocab[subject];
  const brokenCount = useMemo(() => list.filter(isBroken).length, [list]);

  // Sửa nốt từ hỏng cuối cùng thì bộ lọc tự tắt — không thì nút bị khoá
  // (không còn từ hỏng) mà danh sách vẫn kẹt ở trạng thái rỗng.
  const brokenFilterOn = onlyBroken && brokenCount > 0;

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list.filter((w) => {
      if (brokenFilterOn && !isBroken(w)) return false;
      if (!needle) return true;
      return `${w.jp} ${w.kana} ${w.meaning}`.toLowerCase().includes(needle);
    });
  }, [list, q, brokenFilterOn]);

  const startEdit = (w) => {
    setEditId(w.id);
    setConfirmId(null);
    setMsg(null);
    setDraft({ jp: w.jp, kana: w.kana, meaning: w.meaning, exJp: w.exJp, exVi: w.exVi });
  };

  const cancelEdit = () => {
    setEditId(null);
    setDraft(emptyDraft);
  };

  const save = () => {
    if (!draft.jp.trim()) {
      setMsg({ ok: false, text: 'Từ tiếng Nhật không được để trống.' });
      return;
    }
    updateWord(subject, editId, {
      jp: draft.jp.trim(),
      kana: draft.kana.trim(),
      meaning: draft.meaning.trim(),
      exJp: draft.exJp.trim(),
      exVi: draft.exVi.trim(),
    });
    cancelEdit();
    setMsg({ ok: true, text: 'Đã lưu ✓' });
  };

  const runAi = async () => {
    if (!draft.jp.trim()) {
      setMsg({ ok: false, text: 'Cần có từ tiếng Nhật thì AI mới điền được.' });
      return;
    }
    setAiBusy(true);
    setMsg({ ok: true, text: 'AI đang điền…' });
    try {
      const filled = await autofillWord(draft.jp.trim());
      setDraft((d) => ({ ...d, ...filled }));
      setMsg({ ok: true, text: 'AI đã điền xong, kiểm tra lại rồi bấm Lưu.' });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setAiBusy(false);
    }
  };

  const remove = (w) => {
    deleteWord(subject, w.id);
    setConfirmId(null);
    if (editId === w.id) cancelEdit();
    setMsg({ ok: true, text: `Đã xoá "${w.jp}" ✓` });
  };

  return (
    <div className="manager">
      <div className="manager-tools">
        <input
          className="text-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm từ (chữ Nhật, cách đọc hoặc nghĩa)"
          aria-label="Tìm từ trong kho"
        />
        <button
          type="button"
          className={`btn btn-xs ${brokenFilterOn ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setOnlyBroken((v) => !v)}
          disabled={!brokenCount}
          title="Chỉ hiện từ thiếu nghĩa hoặc thiếu cách đọc"
        >
          ⚠ Thiếu nội dung ({brokenCount})
        </button>
      </div>

      <p className="manager-count">
        {shown.length}/{list.length} từ
        {brokenCount > 0 && !brokenFilterOn && ' — từ thiếu nghĩa sẽ không được đưa vào quiz'}
      </p>

      {!shown.length && <p className="mastered-hint">Không có từ nào khớp.</p>}

      <ul className="manager-list">
        {shown.map((w) => (
          <li key={w.id} className={`manager-item ${isBroken(w) ? 'is-broken' : ''}`}>
            {editId === w.id ? (
              <div className="manager-edit">
                <div className="form-row">
                  <input
                    className="text-input jp-text"
                    value={draft.jp}
                    onChange={(e) => setDraft((d) => ({ ...d, jp: e.target.value }))}
                    placeholder="Từ tiếng Nhật"
                    aria-label="Từ tiếng Nhật"
                  />
                  <button type="button" className="btn btn-outline btn-sm" onClick={runAi} disabled={aiBusy} title="Nhờ AI điền lại">
                    <IconWand /> AI
                  </button>
                </div>
                <div className="form-row">
                  <input
                    className="text-input"
                    value={draft.kana}
                    onChange={(e) => setDraft((d) => ({ ...d, kana: e.target.value }))}
                    placeholder="Hiragana"
                    aria-label="Cách đọc hiragana"
                  />
                  <input
                    className="text-input"
                    value={draft.meaning}
                    onChange={(e) => setDraft((d) => ({ ...d, meaning: e.target.value }))}
                    placeholder="Nghĩa tiếng Việt"
                    aria-label="Nghĩa tiếng Việt"
                  />
                </div>
                <div className="form-row">
                  <textarea
                    className="text-input"
                    value={draft.exJp}
                    onChange={(e) => setDraft((d) => ({ ...d, exJp: e.target.value }))}
                    placeholder="Ví dụ tiếng Nhật"
                    aria-label="Câu ví dụ tiếng Nhật"
                    rows={2}
                  />
                </div>
                <div className="form-row">
                  <textarea
                    className="text-input"
                    value={draft.exVi}
                    onChange={(e) => setDraft((d) => ({ ...d, exVi: e.target.value }))}
                    placeholder="Dịch tiếng Việt của ví dụ"
                    aria-label="Bản dịch tiếng Việt của ví dụ"
                    rows={2}
                  />
                </div>
                <div className="manager-edit-actions">
                  <button type="button" className="btn btn-sm btn-primary" onClick={save} disabled={aiBusy}>
                    <IconCheck /> Lưu
                  </button>
                  <button type="button" className="btn btn-sm btn-outline" onClick={cancelEdit} disabled={aiBusy}>
                    <IconX /> Huỷ
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="manager-word">
                  <span className="jp-text manager-jp">{w.jp}</span>
                  <span className="manager-kana">{w.kana || <em className="manager-missing">thiếu cách đọc</em>}</span>
                  <span className="manager-meaning">{w.meaning || <em className="manager-missing">thiếu nghĩa</em>}</span>
                </div>
                {confirmId === w.id ? (
                  <div className="manager-actions">
                    <button type="button" className="btn btn-xs btn-danger" onClick={() => remove(w)}>
                      Xoá thật
                    </button>
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setConfirmId(null)}>
                      Thôi
                    </button>
                  </div>
                ) : (
                  <div className="manager-actions">
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => startEdit(w)}>
                      Sửa
                    </button>
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => setConfirmId(w.id)}>
                      Xoá
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      <p className={`form-msg ${msg ? (msg.ok ? 'ok' : 'err') : ''}`} role="status">
        {msg?.text}
      </p>
    </div>
  );
}
