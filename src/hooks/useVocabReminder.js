import { useEffect, useRef } from 'react';
import { KEYS, loadString, saveString } from '../lib/storage.js';
import { isDue } from '../lib/srs.js';

const CHECK_EVERY_MS = 15 * 1000;

/**
 * Vẽ từ vựng thành ảnh lớn (chữ Hán + cách đọc in đậm) để đính vào thông báo —
 * API Notification không cho chỉnh cỡ chữ, nhưng ảnh hero thì hiện to.
 */
function buildWordImage(w) {
  const W = 720;
  const H = 360;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const x = canvas.getContext('2d');

  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0f172a');
  g.addColorStop(1, '#1e3a8a');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  const jpFont = '"Yu Gothic UI", "Yu Gothic", "Meiryo", "Hiragino Sans", sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';

  // Chữ Hán: đậm, to nhất có thể mà vẫn vừa chiều ngang
  let size = 132;
  do {
    x.font = `bold ${size}px ${jpFont}`;
    size -= 6;
  } while (x.measureText(w.jp).width > W - 60 && size > 36);
  x.fillStyle = '#ffffff';
  x.fillText(w.jp, W / 2, w.kana ? H * 0.36 : H * 0.42);

  // Cách đọc: đậm, màu primary
  if (w.kana) {
    let ks = 56;
    do {
      x.font = `bold ${ks}px ${jpFont}`;
      ks -= 4;
    } while (x.measureText(w.kana).width > W - 80 && ks > 22);
    x.fillStyle = '#7db4ff';
    x.fillText(w.kana, W / 2, H * 0.66);
  }

  // Nghĩa tiếng Việt nhỏ hơn phía dưới
  if (w.meaning) {
    x.font = `500 30px "Inter Variable", "Segoe UI", sans-serif`;
    x.fillStyle = '#cbd5e1';
    let meaning = w.meaning;
    while (x.measureText(meaning).width > W - 60 && meaning.length > 4) {
      meaning = `${meaning.slice(0, -5)}…`;
    }
    x.fillText(meaning, W / 2, H * 0.88);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : null), 'image/png');
  });
}

async function showWordNotification(w, dueCount) {
  const title = `${w.jp}${w.kana ? `（${w.kana}）` : ''}`;
  const body = `${w.meaning}${dueCount ? `\nCòn ${dueCount} từ cần ôn hôm nay` : ''}`;
  const icon = `${import.meta.env.BASE_URL}icons/icon-192.png`;

  // Ưu tiên thông báo qua service worker: cho phép đính ảnh hero cỡ lớn
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg?.showNotification) {
      const image = await buildWordImage(w);
      await reg.showNotification(title, {
        body,
        tag: 'ltd-vocab-reminder',
        icon,
        ...(image ? { image } : {}),
      });
      if (image) setTimeout(() => URL.revokeObjectURL(image), 60 * 1000);
      return;
    }
  } catch (e) {
    console.warn('showNotification qua SW lỗi, dùng Notification thường:', e);
  }

  const n = new Notification(title, { body, tag: 'ltd-vocab-reminder', icon });
  n.onclick = () => window.focus();
}

/**
 * Nhắc từ vựng định kỳ bằng thông báo hệ thống (Windows hiện ở góc dưới phải).
 * Chỉ chạy khi: user đã chọn chu kỳ trong Cài đặt + đã cấp quyền thông báo.
 * Giới hạn nền tảng: chỉ bắn được khi trình duyệt/app còn mở (kể cả thu nhỏ).
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
      showWordNotification(w, due.length).catch((e) => console.warn('Không bắn được thông báo nhắc từ:', e));
    }, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, []);
}
