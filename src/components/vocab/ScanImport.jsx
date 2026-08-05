import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { autofillWords, extractWordsFromText } from '../../services/ai.js';
import { extractWordsFromImage } from '../../services/vision.js';
import { ACCEPT_TYPES, getPdfPageText, isPdfFile, openPdf, prepareImageFile, renderPdfPage } from '../../lib/imageInput.js';
import { IconArrowLeft, IconArrowRight, IconCheck, IconUpload, IconWand } from '../icons.jsx';

// Dưới ngưỡng này coi như trang không có chữ sẵn (PDF scan) → phải nhờ AI nhìn ảnh
const MIN_PDF_TEXT = 40;

/**
 * Thêm từ hàng loạt từ ảnh chụp / trang PDF tài liệu:
 * chọn file → lấy từ ra danh sách ứng viên → user tick từ muốn học →
 * AI điền kana/nghĩa/ví dụ (như nút AI ở tab "Thêm từ") rồi lưu vào kho.
 *
 * PDF có sẵn lớp chữ (đề thi 技術士補) thì đọc thẳng chữ trong file: chính xác
 * tuyệt đối, DeepSeek lọc từ được nên không cần key Gemini. Ảnh chụp và PDF
 * scan mới phải nhờ Gemini nhìn ảnh.
 */
export default function ScanImport({ subject }) {
  const { addWord, allWords } = useVocab();
  const fileRef = useRef(null);
  const pdfRef = useRef(null); // giữ document để đổi trang không phải parse lại
  const [preview, setPreview] = useState(null); // {previewUrl, base64, mimeType}
  const [pdf, setPdf] = useState(null); // {pageCount, pageNum, text}
  const [phase, setPhase] = useState('idle'); // idle | preparing | scanning | adding
  const [candidates, setCandidates] = useState([]); // [{jp, kana, meaning, chosen, added}]
  const [progress, setProgress] = useState(null); // {done, total}
  const [msg, setMsg] = useState(null); // {ok, text}

  const busy = phase !== 'idle';
  // Kéo thả / Ctrl+V không đi qua nút bấm nên không tự bị disable — chặn bằng ref
  const busyRef = useRef(false);
  busyRef.current = busy;

  // Từ đã có trong kho (mọi môn) → khỏi thêm trùng
  const existing = useMemo(() => new Set(allWords.map((w) => w.jp.trim())), [allWords]);

  const handleFile = useCallback(async (file) => {
    if (!file || busyRef.current) return;
    setMsg(null);
    setCandidates([]);
    setProgress(null);
    setPhase('preparing');
    try {
      if (isPdfFile(file)) {
        const doc = await openPdf(file);
        pdfRef.current = doc;
        const [part, text] = await Promise.all([renderPdfPage(doc, 1), getPdfPageText(doc, 1)]);
        setPdf({ pageCount: doc.numPages, pageNum: 1, text });
        setPreview(part);
      } else {
        pdfRef.current = null;
        setPdf(null);
        setPreview(await prepareImageFile(file));
      }
    } catch (e) {
      console.error('Không xử lý được file:', e);
      setPreview(null);
      setMsg({ ok: false, text: e.message || 'Không đọc được file này.' });
    } finally {
      setPhase('idle');
    }
  }, []);

  // Ctrl+V dán thẳng ảnh chụp màn hình (Win + Shift + S) — nhanh hơn lưu file rồi chọn
  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      handleFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFile]);

  const goPage = async (next) => {
    const doc = pdfRef.current;
    if (!doc) return;
    const pageNum = Math.max(1, Math.min(doc.numPages, next));
    if (pageNum === pdf?.pageNum) return;
    setPhase('preparing');
    setCandidates([]);
    setMsg(null);
    try {
      const [part, text] = await Promise.all([renderPdfPage(doc, pageNum), getPdfPageText(doc, pageNum)]);
      setPreview(part);
      setPdf({ pageCount: doc.numPages, pageNum, text });
    } catch (e) {
      console.error('Không render được trang PDF:', e);
      setMsg({ ok: false, text: 'Không render được trang này.' });
    } finally {
      setPhase('idle');
    }
  };

  const hasPdfText = (pdf?.text?.length ?? 0) >= MIN_PDF_TEXT;

  const scan = async () => {
    if (!preview) return;
    setPhase('scanning');
    setCandidates([]);
    setMsg({ ok: true, text: hasPdfText ? 'Đang lọc từ vựng từ chữ trong file…' : 'AI đang đọc trang tài liệu…' });
    try {
      // PDF có chữ sẵn → đọc thẳng chữ (chuẩn hơn, không cần Gemini)
      const found = hasPdfText ? await extractWordsFromText(pdf.text) : await extractWordsFromImage(preview);
      if (!found.length) {
        setMsg({
          ok: false,
          text: hasPdfText
            ? 'Trang này không có từ nào đáng học. Thử trang khác.'
            : 'Không tìm thấy từ tiếng Nhật nào. Thử chụp rõ hơn hoặc phóng to trang.',
        });
        return;
      }
      const dup = found.filter((w) => existing.has(w.jp)).length;
      setCandidates(found.map((w) => ({ ...w, chosen: !existing.has(w.jp), added: false })));
      setMsg({
        ok: true,
        text: `Tìm thấy ${found.length} từ${dup ? ` (${dup} từ đã có trong kho — đã bỏ tick sẵn)` : ''}. Tick từ muốn học rồi bấm nút bên dưới.`,
      });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setPhase('idle');
    }
  };

  const toggle = (jp) => {
    setCandidates((cs) => cs.map((c) => (c.jp === jp && !c.added ? { ...c, chosen: !c.chosen } : c)));
  };

  const setAll = (chosen) => {
    setCandidates((cs) => cs.map((c) => (c.added ? c : { ...c, chosen })));
  };

  const addSelected = async () => {
    const picked = candidates.filter((c) => c.chosen && !c.added);
    if (!picked.length) {
      setMsg({ ok: false, text: 'Chưa tick từ nào.' });
      return;
    }
    setPhase('adding');
    setProgress({ done: 0, total: picked.length });
    setMsg({ ok: true, text: 'AI đang điền cách đọc, nghĩa và câu ví dụ…' });
    try {
      const filled = await autofillWords(
        picked.map((c) => c.jp),
        (done, total) => setProgress({ done, total })
      );
      let partial = 0;
      for (const c of picked) {
        const f = filled.get(c.jp);
        if (!f) partial += 1;
        addWord(subject, {
          jp: c.jp,
          kana: f?.kana || c.kana,
          meaning: f?.meaning || c.meaning,
          exJp: f?.exJp ?? '',
          exVi: f?.exVi ?? '',
        });
      }
      setCandidates((cs) => cs.map((c) => (c.chosen && !c.added ? { ...c, added: true, chosen: false } : c)));
      setMsg({
        ok: true,
        text:
          `Đã thêm ${picked.length} từ vào kho ✓` +
          (partial ? ` (${partial} từ AI không điền được, tạm dùng nội dung đọc từ ảnh — sửa lại ở tab "⭐ Đã nhớ"/"Thêm từ" nếu cần)` : ''),
      });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setProgress(null);
      setPhase('idle');
    }
  };

  const pickedCount = candidates.filter((c) => c.chosen && !c.added).length;

  return (
    <div className="scan-panel">
      <div
        className="scan-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer?.files?.[0]);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_TYPES}
          hidden
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = ''; // chọn lại đúng file đó vẫn chạy
          }}
        />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          <IconUpload /> Chọn ảnh hoặc PDF
        </button>
        <p className="scan-hint">Kéo thả file vào đây, hoặc dán ảnh chụp màn hình bằng Ctrl+V. Trên iPhone có thể chụp trực tiếp.</p>
      </div>

      {phase === 'preparing' && <p className="form-msg">Đang xử lý file…</p>}

      {preview && (
        <div className="scan-preview">
          <img src={preview.previewUrl} alt="Trang tài liệu sẽ được quét" />
          {pdf && (
            <div className="scan-pager">
              <button type="button" className="btn btn-outline btn-xs" onClick={() => goPage(pdf.pageNum - 1)} disabled={busy || pdf.pageNum <= 1} aria-label="Trang trước">
                <IconArrowLeft />
              </button>
              <span>
                Trang {pdf.pageNum}/{pdf.pageCount}
              </span>
              <button type="button" className="btn btn-outline btn-xs" onClick={() => goPage(pdf.pageNum + 1)} disabled={busy || pdf.pageNum >= pdf.pageCount} aria-label="Trang sau">
                <IconArrowRight />
              </button>
            </div>
          )}
          <p className="scan-source">
            {hasPdfText
              ? '✓ Trang này có sẵn chữ trong file — đọc thẳng, không cần key Gemini'
              : pdf
                ? 'Trang này là ảnh scan — cần key Gemini để đọc chữ'
                : 'Ảnh chụp — cần key Gemini để đọc chữ'}
          </p>
          <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={scan} disabled={busy}>
            <IconWand /> {phase === 'scanning' ? 'Đang quét…' : 'Quét từ vựng trong trang này'}
          </button>
        </div>
      )}

      {candidates.length > 0 && (
        <div className="scan-results">
          <div className="scan-results-head">
            <strong>{candidates.length} từ tìm được</strong>
            <span>
              <button type="button" className="btn btn-outline btn-xs" onClick={() => setAll(true)} disabled={busy}>
                Chọn tất cả
              </button>{' '}
              <button type="button" className="btn btn-outline btn-xs" onClick={() => setAll(false)} disabled={busy}>
                Bỏ chọn
              </button>
            </span>
          </div>

          <ul className="scan-list">
            {candidates.map((c) => (
              <li key={c.jp} className={`scan-item ${c.added ? 'is-added' : ''}`}>
                <label>
                  <input type="checkbox" checked={c.chosen} onChange={() => toggle(c.jp)} disabled={busy || c.added} />
                  <span className="scan-word">
                    <span className="jp-text scan-jp">{c.jp}</span>
                    {c.kana && <span className="scan-kana">{c.kana}</span>}
                    {c.meaning && <span className="scan-meaning">{c.meaning}</span>}
                  </span>
                </label>
                {c.added ? (
                  <span className="scan-badge ok">
                    <IconCheck /> đã thêm
                  </span>
                ) : (
                  existing.has(c.jp) && <span className="scan-badge">đã có</span>
                )}
              </li>
            ))}
          </ul>

          <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={addSelected} disabled={busy || !pickedCount}>
            {phase === 'adding'
              ? `AI đang điền… ${progress ? `${progress.done}/${progress.total}` : ''}`
              : `Thêm ${pickedCount} từ đã chọn vào kho`}
          </button>
        </div>
      )}

      <p className={`form-msg ${msg ? (msg.ok ? 'ok' : 'err') : ''}`} role="status">
        {msg?.text}
      </p>
    </div>
  );
}
