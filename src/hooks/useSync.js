import { useCallback, useEffect, useRef, useState } from 'react';
import { useVocab } from '../context/VocabProvider.jsx';
import { hasSyncToken, mergeVocab, pullVocab, pushVocab } from '../services/github.js';
import { pullProgress, pushProgress } from '../services/progressSync.js';
import { pullExam, pushExam } from '../services/examSync.js';
import { PROGRESS_EVENT } from '../lib/textbookProgress.js';
import { EXAM_EVENT } from '../lib/examState.js';
import { KEYS, loadString, saveString } from '../lib/storage.js';

const AUTO_PUSH_DELAY_MS = 8000;
const PROGRESS_PUSH_DELAY_MS = 10000;
const EXAM_PUSH_DELAY_MS = 10000;

/** Có thay đổi chưa kịp đẩy (mất mạng / chưa có token) — sống qua cả lần tải lại trang. */
const markPending = () => saveString(KEYS.syncPending, '1');
const clearPending = () => saveString(KEYS.syncPending, '');
const hasPending = () => loadString(KEYS.syncPending) === '1';

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
        // Ảnh chụp lúc bắt đầu: mạng chậm thì ロン vẫn đang trả lời/sửa từ, và
        // replaceAll(bản gộp từ ảnh chụp cũ) sẽ nuốt mất thao tác vừa xong
        // (điểm 0→1→0). Gộp lại với bản MỚI NHẤT ngay trước khi thay.
        const before = vocabRef.current;
        const merged = await pullVocab(before);
        const latest = vocabRef.current;
        const clean = latest === before;
        // latest làm base: thao tác vừa xong có updatedAt mới hơn nên thắng
        replaceAll(clean ? merged : mergeVocab(latest, merged));
        // Có thao tác chen vào thì phải để auto-push đẩy nó lên, đừng bỏ qua
        skipNextAutoPush.current = clean;
        const failed = [];
        // Tiến độ đọc giáo trình đi cùng chuyến: kéo về để đọc tiếp đúng chỗ máy kia dừng
        await pullProgress().catch((e) => {
          failed.push('tiến độ đọc');
          console.warn('Pull tiến độ lỗi:', e.message);
        });
        // Trạng thái làm đề cũng vậy — catch riêng để lỗi đề không phá sync vocab
        await pullExam().catch((e) => {
          failed.push('tiến độ làm đề');
          console.warn('Pull đề thi lỗi:', e.message);
        });
        setStatus(
          failed.length
            ? { kind: 'err', text: `Đã tải từ vựng, nhưng chưa tải được ${failed.join(' và ')}. Thử lại sau.` }
            : { kind: 'ok', text: 'Đã tải về và gộp dữ liệu từ GitHub ✓' }
        );
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
        const before = vocabRef.current;
        const { merged, skipped } = await pushVocab(before);
        const latest = vocabRef.current;
        const clean = latest === before;
        replaceAll(clean ? merged : mergeVocab(latest, merged));
        skipNextAutoPush.current = clean;
        const failed = [];
        await pushProgress().catch((e) => {
          failed.push('tiến độ đọc');
          console.warn('Push tiến độ lỗi:', e.message);
        });
        await pushExam().catch((e) => {
          failed.push('tiến độ làm đề');
          console.warn('Push đề thi lỗi:', e.message);
        });
        if (failed.length) {
          // Báo thật: trước đây hai phần này hỏng vẫn hiện "Đã lưu ✓"
          markPending();
          setStatus({
            kind: 'err',
            text: `Đã lưu từ vựng, nhưng chưa lưu được ${failed.join(' và ')}. Sẽ thử lại khi có mạng.`,
          });
        } else {
          clearPending();
          setStatus(
            skipped
              ? { kind: 'ok', text: 'Dữ liệu đã khớp với GitHub, không cần lưu lại.' }
              : { kind: 'ok', text: 'Đã lưu dữ liệu lên GitHub ✓' }
          );
        }
      } catch (e) {
        markPending();
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
      if (!hasSyncToken()) return;
      if (!navigator.onLine) return markPending(); // học trên tàu: nhớ để lát nữa đẩy
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushProgress().catch((e) => {
          markPending();
          console.warn('Auto-push tiến độ lỗi:', e.message);
        });
      }, PROGRESS_PUSH_DELAY_MS);
    };
    window.addEventListener(PROGRESS_EVENT, onChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(PROGRESS_EVENT, onChange);
    };
  }, []);

  // Tự đẩy trạng thái làm đề sau mỗi câu trả lời/đánh dấu (debounce, im lặng)
  useEffect(() => {
    let timer = null;
    const onChange = () => {
      if (!hasSyncToken()) return;
      if (!navigator.onLine) return markPending();
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushExam().catch((e) => {
          markPending();
          console.warn('Auto-push đề thi lỗi:', e.message);
        });
      }, EXAM_PUSH_DELAY_MS);
    };
    window.addEventListener(EXAM_EVENT, onChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(EXAM_EVENT, onChange);
    };
  }, []);

  // Tự push (debounce) sau khi vocab thay đổi do thao tác của user
  useEffect(() => {
    if (skipNextAutoPush.current) {
      skipNextAutoPush.current = false;
      return undefined;
    }
    if (!hasSyncToken()) return undefined;
    if (!navigator.onLine) {
      markPending();
      return undefined;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doPush(true), AUTO_PUSH_DELAY_MS);
    return () => clearTimeout(timerRef.current);
  }, [rawVocab, doPush]);

  // Có mạng trở lại thì đẩy nốt những gì học lúc offline. Không nghe sự kiện này
  // thì ロン học cả chuyến tàu xong, máy kia vẫn không thấy gì cho tới lần bấm tay.
  useEffect(() => {
    const flush = () => {
      if (!hasSyncToken() || !navigator.onLine || !hasPending()) return;
      doPush(true);
    };
    window.addEventListener('online', flush);
    // Mở lại app sau chuyến đi cũng phải đẩy — cờ pending sống trong localStorage
    const t = setTimeout(flush, AUTO_PUSH_DELAY_MS);
    return () => {
      clearTimeout(t);
      window.removeEventListener('online', flush);
    };
  }, [doPush]);

  return { status, setStatus, doPull, doPush };
}
