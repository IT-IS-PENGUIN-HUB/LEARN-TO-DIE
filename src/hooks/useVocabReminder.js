import { useEffect, useRef } from 'react';
import { KEYS, loadString, saveString } from '../lib/storage.js';
import { isDue } from '../lib/srs.js';

const CHECK_EVERY_MS = 30 * 1000;

/**
 * Nhắc từ vựng định kỳ bằng thông báo hệ thống (Windows hiện ở góc dưới phải).
 * Chỉ chạy khi: user đã chọn chu kỳ trong Cài đặt + đã cấp quyền thông báo.
 * Giới hạn nền tảng: chỉ bắn được khi trình duyệt/app còn mở (kể cả thu nhỏ);
 * iOS không hỗ trợ đặt lịch thông báo cho web app.
 *
 * Ưu tiên từ đến hạn ôn; hết từ đến hạn thì lấy ngẫu nhiên từ chưa thuộc.
 * Mốc lần nhắc cuối lưu localStorage → nhiều tab không bắn trùng, reload không spam.
 */
export function useVocabReminder(allWords) {
  const wordsRef = useRef(allWords);
  wordsRef.current = allWords;

  useEffect(() => {
    const timer = setInterval(() => {
      const minutes = parseInt(loadString(KEYS.reminderMin) || '0', 10);
      if (!minutes || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

      const last = parseInt(loadString(KEYS.reminderLast) || '0', 10);
      if (Date.now() - last < minutes * 60 * 1000) return;

      const words = wordsRef.current;
      const due = words.filter((w) => isDue(w));
      const pool = due.length ? due : words.filter((w) => !w.mastered);
      if (!pool.length) return;

      const w = pool[Math.floor(Math.random() * pool.length)];
      saveString(KEYS.reminderLast, String(Date.now()));
      try {
        const n = new Notification(`${w.jp}${w.kana ? `（${w.kana}）` : ''}`, {
          body: `${w.meaning}${due.length ? `\nCòn ${due.length} từ cần ôn hôm nay` : ''}`,
          tag: 'ltd-vocab-reminder',
          icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
        });
        n.onclick = () => window.focus();
      } catch (e) {
        console.warn('Không bắn được thông báo nhắc từ:', e);
      }
    }, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, []);
}
