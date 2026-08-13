import { useCallback, useEffect, useRef, useState } from 'react';
import { useVocab } from '../context/VocabProvider.jsx';
import { hasSyncToken, pullVocab, pushVocab } from '../services/github.js';
import { pullProgress, pushProgress } from '../services/progressSync.js';
import { PROGRESS_EVENT } from '../lib/textbookProgress.js';

const AUTO_PUSH_DELAY_MS = 8000;
const PROGRESS_PUSH_DELAY_MS = 10000;

/**
 * Quản lý đồng bộ GitHub: pull/push thủ công + tự động
 * (pull khi mở app, push debounce sau khi dữ liệu đổi).
 */
export function useSync() {
  // rawVocab (còn cả từ đã xoá) mới là thứ được đẩy lên: đẩy bản đã lọc thì
  // máy khác không biết là đã xoá và sẽ đồng bộ ngược từ đó trở lại.
  const { rawVocab, replaceAll } = useVocab();
  const [status, setStatus] = useState(null); // {kind:'busy'|'ok'|'err', text}
  const vocabRef = useRef(rawVocab);
  vocabRef.current = rawVocab;
  const busyRef = useRef(false);
  const skipNextAutoPush = useRef(true); // lần render đầu + sau khi pull
  const timerRef = useRef(null);

  const doPull = useCallback(
    async (silent = false) => {
      if (busyRef.current) return;
      busyRef.current = true;
      if (!silent) setStatus({ kind: 'busy', text: 'Đang tải dữ liệu từ GitHub…' });
      try {
        const merged = await pullVocab(vocabRef.current);
        skipNextAutoPush.current = true;
        replaceAll(merged);
        // Tiến độ đọc giáo trình đi cùng chuyến: kéo về để đọc tiếp đúng chỗ máy kia dừng
        await pullProgress().catch((e) => console.warn('Pull tiến độ lỗi:', e.message));
        setStatus({ kind: 'ok', text: 'Đã tải về và gộp dữ liệu từ GitHub ✓' });
      } catch (e) {
        if (!silent) setStatus({ kind: 'err', text: e.message });
        else console.warn('Auto-pull lỗi:', e.message);
      } finally {
        busyRef.current = false;
      }
    },
    [replaceAll]
  );

  const doPush = useCallback(
    async (silent = false) => {
      if (busyRef.current) return;
      busyRef.current = true;
      if (!silent) setStatus({ kind: 'busy', text: 'Đang lưu lên GitHub…' });
      try {
        const { merged, skipped } = await pushVocab(vocabRef.current);
        skipNextAutoPush.current = true;
        replaceAll(merged);
        await pushProgress().catch((e) => console.warn('Push tiến độ lỗi:', e.message));
        setStatus(
          skipped
            ? { kind: 'ok', text: 'Dữ liệu đã khớp với GitHub, không cần lưu lại.' }
            : { kind: 'ok', text: 'Đã lưu dữ liệu lên GitHub ✓' }
        );
      } catch (e) {
        if (!silent) setStatus({ kind: 'err', text: e.message });
        else console.warn('Auto-push lỗi:', e.message);
      } finally {
        busyRef.current = false;
      }
    },
    [replaceAll]
  );

  // Tự pull khi mở app (nếu đã có token và đang online)
  useEffect(() => {
    if (hasSyncToken() && navigator.onLine) doPull(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự đẩy tiến độ đọc lên GitHub sau khi lật trang (debounce, im lặng).
  // Không gộp vào push vocab vì lật trang không đụng gì tới vocab.
  useEffect(() => {
    let timer = null;
    const onChange = () => {
      if (!hasSyncToken() || !navigator.onLine) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushProgress().catch((e) => console.warn('Auto-push tiến độ lỗi:', e.message));
      }, PROGRESS_PUSH_DELAY_MS);
    };
    window.addEventListener(PROGRESS_EVENT, onChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(PROGRESS_EVENT, onChange);
    };
  }, []);

  // Tự push (debounce) sau khi vocab thay đổi do thao tác của user
  useEffect(() => {
    if (skipNextAutoPush.current) {
      skipNextAutoPush.current = false;
      return undefined;
    }
    if (!hasSyncToken() || !navigator.onLine) return undefined;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doPush(true), AUTO_PUSH_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [rawVocab, doPush]);

  return { status, setStatus, doPull, doPush };
}
