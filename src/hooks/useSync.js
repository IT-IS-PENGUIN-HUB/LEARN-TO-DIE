import { useCallback, useEffect, useRef, useState } from 'react';
import { useVocab } from '../context/VocabProvider.jsx';
import { hasSyncToken, pullVocab, pushVocab } from '../services/github.js';

const AUTO_PUSH_DELAY_MS = 8000;

/**
 * Quản lý đồng bộ GitHub: pull/push thủ công + tự động
 * (pull khi mở app, push debounce sau khi dữ liệu đổi).
 */
export function useSync() {
  const { vocab, replaceAll } = useVocab();
  const [status, setStatus] = useState(null); // {kind:'busy'|'ok'|'err', text}
  const vocabRef = useRef(vocab);
  vocabRef.current = vocab;
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
  }, [vocab, doPush]);

  return { status, setStatus, doPull, doPush };
}
