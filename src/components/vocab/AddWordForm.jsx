import { useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { autofillWord } from '../../services/ai.js';
import { IconWand } from '../icons.jsx';

export default function AddWordForm({ subject }) {
  const { addWord } = useVocab();
  const [jp, setJp] = useState('');
  const [kana, setKana] = useState('');
  const [meaning, setMeaning] = useState('');
  const [exJp, setExJp] = useState('');
  const [exVi, setExVi] = useState('');
  const [msg, setMsg] = useState(null); // {ok: bool, text}
  const [loading, setLoading] = useState(false);

  const runAutofill = async () => {
    if (!jp.trim()) {
      setMsg({ ok: false, text: 'Nhập từ tiếng Nhật trước đã.' });
      return;
    }
    setLoading(true);
    setMsg({ ok: true, text: 'AI đang điền…' });
    try {
      const filled = await autofillWord(jp.trim());
      setKana(filled.kana);
      setMeaning(filled.meaning);
      setExJp(filled.exJp);
      setExVi(filled.exVi);
      setMsg({ ok: true, text: 'AI đã điền xong, kiểm tra lại rồi lưu nhé.' });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const save = (e) => {
    e.preventDefault();
    if (!jp.trim()) {
      setMsg({ ok: false, text: 'Từ tiếng Nhật không được để trống.' });
      return;
    }
    addWord(subject, { jp, kana, meaning, exJp, exVi });
    setJp('');
    setKana('');
    setMeaning('');
    setExJp('');
    setExVi('');
    setMsg({ ok: true, text: 'Đã lưu từ mới ✓' });
  };

  return (
    <form className="quick-add" onSubmit={save}>
      <h4>Thêm từ mới (hỗ trợ AI)</h4>
      <div className="form-row">
        <input
          className="text-input"
          value={jp}
          onChange={(e) => setJp(e.target.value)}
          placeholder="Từ tiếng Nhật (Kanji/Kana)"
          aria-label="Từ tiếng Nhật"
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={runAutofill}
          disabled={loading}
          title="Dùng AI điền tự động (DeepSeek/Gemini)"
        >
          <IconWand /> AI
        </button>
      </div>
      <div className="form-row">
        <input
          className="text-input"
          value={kana}
          onChange={(e) => setKana(e.target.value)}
          placeholder="Hiragana"
          aria-label="Cách đọc hiragana"
        />
        <input
          className="text-input"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Nghĩa tiếng Việt"
          aria-label="Nghĩa tiếng Việt"
        />
      </div>
      <div className="form-row">
        <textarea
          className="text-input"
          value={exJp}
          onChange={(e) => setExJp(e.target.value)}
          placeholder="Ví dụ tiếng Nhật"
          aria-label="Câu ví dụ tiếng Nhật"
          rows={2}
        />
      </div>
      <div className="form-row">
        <textarea
          className="text-input"
          value={exVi}
          onChange={(e) => setExVi(e.target.value)}
          placeholder="Dịch tiếng Việt của ví dụ"
          aria-label="Bản dịch tiếng Việt của ví dụ"
          rows={2}
        />
      </div>
      <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
        Lưu từ mới
      </button>
      <p className={`form-msg ${msg ? (msg.ok ? 'ok' : 'err') : ''}`} role="status">
        {msg?.text}
      </p>
    </form>
  );
}
