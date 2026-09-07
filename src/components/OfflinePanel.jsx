import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SUBJECTS, EXAMS } from '../data/exams.js';
import { EDITION_LABEL, getDocs, getEditions } from '../data/textbooks.js';
import {
  askPersist,
  downloadPack,
  fmtBytes,
  packStatus,
  storageInfo,
  swControlled,
} from '../services/offlinePack.js';
import { IconDownload, IconCheck, IconRefresh } from './icons.jsx';

const settle = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * "Dùng khi không có mạng" — nạp sẵn đề, hình vẽ và giáo trình vào máy.
 *
 * Có mặt vì chuyến công tác ra đảo (9/2026): app trung tâm cần mạng để đăng nhập
 * nên coi như mất, còn app này chỉ chạy được offline những phần ĐÃ tải. Xem
 * services/offlinePack.js để biết vì sao không tự ghi thẳng vào cache.
 *
 * Bảng kiểm kê đọc từ cache nên NGOÀI ĐẢO mở ra vẫn xem được — đó là điểm chính:
 * trước khi lên máy bay phải nhìn thấy "đủ" bằng mắt, không phải đoán.
 */
export default function OfflinePanel() {
  const subjects = useMemo(() => Object.values(SUBJECTS), []);
  const subjectIds = useMemo(() => subjects.map((s) => s.id), [subjects]);
  // Một dòng cho mỗi (môn × bộ sách): tải bộ 2025 mà phải ôm luôn bộ cũ thì phí
  // cả trăm MB trên điện thoại. Môn chưa có file thì không bày ra làm gì.
  const bookSets = useMemo(
    () =>
      subjects.flatMap((s) =>
        getEditions(s.id).map((edition) => {
          const docs = getDocs(s.id).filter((d) => (d.edition ?? 'old') === edition);
          return {
            key: `${s.id}|${edition}`,
            subject: s.id,
            edition,
            nameJp: s.nameJp,
            docs,
            mb: docs.reduce((sum, d) => sum + (d.mb ?? 0), 0),
          };
        })
      ),
    [subjects]
  );

  const [pick, setPick] = useState(() => ({ exam: true, books: {}, pdfs: false }));
  const [status, setStatus] = useState(null);
  const [store, setStore] = useState(null);
  const [prog, setProg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const abortRef = useRef(null);

  const refresh = useCallback(async () => {
    setStatus(await packStatus(bookSets, subjectIds));
    setStore(await storageInfo());
  }, [bookSets, subjectIds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Dừng luôn việc đang tải nếu đóng bảng giữa chừng
  useEffect(() => () => abortRef.current?.abort(), []);

  const toggleBook = (key) =>
    setPick((p) => ({ ...p, books: { ...p.books, [key]: !p.books[key] } }));

  const chosenBooks = bookSets.filter((b) => pick.books[b.key]);
  const nothingPicked = !pick.exam && !pick.pdfs && chosenBooks.length === 0;
  const ready = swControlled();

  /**
   * Đếm xem thứ VỪA CHỌN đã thật sự nằm trong máy chưa — nguồn sự thật là cache,
   * không phải "đã fetch xong bao nhiêu file". Tải mà máy không giữ lại thì tệ
   * hơn cả không tải: ra đảo mới biết mình tay trắng.
   */
  const missingAfter = (st) => {
    let miss = 0;
    if (pick.exam) {
      miss += st.shards.total - st.shards.have;
      miss += st.images.total - st.images.have;
    }
    for (const b of chosenBooks) miss += (st.books[b.key]?.total ?? 0) - (st.books[b.key]?.have ?? 0);
    if (pick.pdfs) {
      for (const id of subjectIds) miss += (st.pdfs[id]?.total ?? 0) - (st.pdfs[id]?.have ?? 0);
    }
    return miss;
  };

  const start = async () => {
    if (nothingPicked || !ready) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setMsg('');
    setProg({ step: 'Chuẩn bị…', done: 0, total: 0, bytes: 0, failed: [] });
    try {
      const r = await downloadPack({
        exam: pick.exam,
        textbooks: chosenBooks.map((b) => ({ subject: b.subject, edition: b.edition })),
        examPdfs: pick.pdfs ? subjectIds : [],
        signal: ctrl.signal,
        onProgress: setProg,
      });
      // Kiểm lại bằng chính cache của máy rồi mới dám nói "xong".
      // Phải CHỜ một nhịp: fetch ở trang xong trước, service worker ghi vào cache
      // sau — đo ngay lập tức thì file vừa tải vẫn "chưa có", báo thiếu oan
      // (đã dính lúc thử với 2 file PDF giáo trình).
      await settle(1200);
      let st = await packStatus(bookSets, subjectIds);
      if (missingAfter(st) > 0) {
        await settle(2500); // file to ghi lâu hơn — cho thêm một nhịp nữa rồi mới kết luận
        st = await packStatus(bookSets, subjectIds);
      }
      setStatus(st);
      setStore(await storageInfo());
      const miss = missingAfter(st);
      if (ctrl.signal.aborted) {
        setMsg(`Đã dừng — phần tải được vẫn nằm trong máy (${fmtBytes(r.bytes)}). Còn thiếu ${miss} file.`);
      } else if (miss > 0 || r.failed.length) {
        setMsg(`Còn thiếu ${miss || r.failed.length} file. Bấm "Tải về máy" lần nữa để lấy nốt.`);
      } else {
        setMsg(`Đã đủ ${r.done} file (${fmtBytes(r.bytes)}) trong máy — dùng được khi không có mạng ✓`);
      }
    } catch (e) {
      setMsg(`Lỗi khi tải: ${e?.message ?? e}`);
      refresh();
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const doPersist = async () => {
    const ok = await askPersist();
    setMsg(
      ok === true
        ? 'Đã xin giữ dữ liệu: máy sẽ không tự dọn kho đề và giáo trình ✓'
        : ok === false
          ? 'Trình duyệt chưa cho giữ cố định. Hãy cài app vào màn hình chính rồi thử lại.'
          : 'Máy này không hỗ trợ tuỳ chọn giữ dữ liệu.'
    );
  };

  /** Dòng kiểm kê: "45/45 ✓" hoặc "12/45". */
  const Have = ({ stat, unit }) => {
    if (!stat || !stat.total) return <span className="off-have">—</span>;
    const full = stat.have >= stat.total;
    return (
      <span className={`off-have${full ? ' is-full' : ''}`}>
        {full && <IconCheck />} {stat.have}/{stat.total} {unit}
      </span>
    );
  };

  const pct = prog?.total ? Math.min(100, Math.round((prog.done / prog.total) * 100)) : 0;

  return (
    <div className="settings-section">
      <h3>
        <IconDownload /> Dùng khi không có mạng
      </h3>
      <p className="settings-note">
        Tải sẵn về máy để làm bài lúc <strong>không có sóng</strong> (máy bay, ngoài đảo). Riêng{' '}
        <strong>hình vẽ trong đề</strong> bắt buộc phải tải trước: câu chưa từng làm thì máy chưa
        từng thấy hình của nó. Nhớ <strong>cài app vào màn hình chính</strong> để máy không tự xoá.
      </p>

      {/* Không có service worker điều khiển trang thì fetch KHÔNG đi qua nó, tải
          bao nhiêu cũng không đọng lại. Chặn hẳn nút còn hơn để ロン tưởng xong. */}
      {!ready && (
        <p className="off-warn" role="alert">
          ⚠ App chưa ở chế độ offline nên chưa tải được. Hãy đóng hẳn app rồi mở lại — nếu vẫn báo
          dòng này thì mở app bằng biểu tượng ngoài màn hình chính (không phải trong trình duyệt).
        </p>
      )}

      <ul className="off-list">
        <li>
          <label className="off-row">
            <input
              type="checkbox"
              checked={pick.exam}
              onChange={() => setPick((p) => ({ ...p, exam: !p.exam }))}
              disabled={busy}
            />
            <span className="off-name">
              Kho đề + hình vẽ
              <em>Câu hỏi, lời giải và toàn bộ hình trong đề</em>
            </span>
          </label>
          <span className="off-stats">
            <Have stat={status?.shards} unit="đề" />
            <Have stat={status?.images} unit="hình" />
          </span>
        </li>

        {bookSets.map((b) => (
          <li key={b.key}>
            <label className="off-row">
              <input
                type="checkbox"
                checked={Boolean(pick.books[b.key])}
                onChange={() => toggleBook(b.key)}
                disabled={busy}
              />
              <span className="off-name">
                Giáo trình {b.nameJp} — {EDITION_LABEL[b.edition] ?? b.edition}
                <em>
                  {b.docs.length} file{b.mb > 0 && <> · khoảng {b.mb} MB</>}
                </em>
              </span>
            </label>
            <span className="off-stats">
              <Have stat={status?.books?.[b.key]} unit="file" />
            </span>
          </li>
        ))}

        <li>
          <label className="off-row">
            <input
              type="checkbox"
              checked={pick.pdfs}
              onChange={() => setPick((p) => ({ ...p, pdfs: !p.pdfs }))}
              disabled={busy}
            />
            <span className="off-name">
              Đề thi gốc (PDF scan)
              <em>
                {subjectIds.reduce((n, id) => n + (EXAMS[id]?.length ?? 0), 0)} file — chỉ cần nếu
                muốn đối chiếu bản gốc
              </em>
            </span>
          </label>
          <span className="off-stats">
            {/* Gộp 3 môn thành một con số — ba dòng rời chỉ tổ khó đọc */}
            <Have
              stat={
                status
                  ? subjectIds.reduce(
                      (acc, id) => ({
                        have: acc.have + (status.pdfs?.[id]?.have ?? 0),
                        total: acc.total + (status.pdfs?.[id]?.total ?? 0),
                      }),
                      { have: 0, total: 0 }
                    )
                  : null
              }
              unit="file"
            />
          </span>
        </li>
      </ul>

      {prog && (
        <div className="off-prog">
          <div className="off-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="off-prog-txt">
            {prog.step} {prog.total > 0 && <>· {prog.done}/{prog.total} file</>}{' '}
            {prog.bytes > 0 && <>· {fmtBytes(prog.bytes)}</>}
          </p>
        </div>
      )}

      <div className="sync-row">
        {busy ? (
          <button type="button" className="btn btn-sm btn-outline" onClick={stop}>
            Dừng
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-sm btn-success"
            onClick={start}
            disabled={nothingPicked || !ready}
          >
            <IconDownload /> Tải về máy
          </button>
        )}
        <button type="button" className="btn btn-sm btn-outline" onClick={refresh} disabled={busy}>
          <IconRefresh /> Kiểm tra lại
        </button>
      </div>

      {store && (
        <p className="settings-note off-store">
          Đang chiếm <strong>{fmtBytes(store.usage)}</strong>
          {store.quota > 0 && <> trong {fmtBytes(store.quota)} máy cho phép</>}.{' '}
          <button type="button" className="link-btn" onClick={doPersist}>
            Giữ để máy khỏi tự xoá
          </button>
        </p>
      )}

      {msg && (
        <p className="sync-status" role="status" style={{ color: 'var(--text-muted)' }}>
          {msg}
        </p>
      )}
    </div>
  );
}
