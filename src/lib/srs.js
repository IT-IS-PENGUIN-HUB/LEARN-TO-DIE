// SRS kiểu Leitner: score = hộp 0..7, interval ngày theo hộp.
// Đúng: lên 1 hộp, hẹn ôn sau interval[score mới] ngày.
// Sai: tụt 2 hộp, phải ôn lại ngay.

export const INTERVALS_DAYS = [0, 1, 2, 4, 7, 14, 30, 60];
export const MAX_SCORE = INTERVALS_DAYS.length - 1;
export const MASTER_SUGGEST_SCORE = 6;

const DAY_MS = 24 * 60 * 60 * 1000;

export function applyAnswer(entry, correct, now = Date.now()) {
  const score = correct ? Math.min(MAX_SCORE, entry.score + 1) : Math.max(0, entry.score - 2);
  const nextReview = correct ? now + INTERVALS_DAYS[score] * DAY_MS : now;
  return { ...entry, score, nextReview, updatedAt: now };
}

export function isDue(entry, now = Date.now()) {
  return !entry.mastered && entry.nextReview <= now;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Hàng đợi luyện tập: từ đến hạn (cũ nhất trước) → phần còn lại (chưa đến hạn,
 * chưa mastered) xáo trộn làm phần đệm.
 */
export function buildQueue(words, { now = Date.now(), limit = Infinity } = {}) {
  const pool = words.filter((w) => !w.mastered);
  const due = pool.filter((w) => w.nextReview <= now).sort((a, b) => a.nextReview - b.nextReview);
  const rest = shuffle(pool.filter((w) => w.nextReview > now));
  return [...due, ...rest].slice(0, limit);
}

export function countDue(words, now = Date.now()) {
  return words.reduce((n, w) => n + (isDue(w, now) ? 1 : 0), 0);
}
