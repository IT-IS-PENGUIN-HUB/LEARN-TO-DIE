// Nhật ký học tập theo ngày: learn_to_die_stats = { 'YYYY-MM-DD': {reviewed, correct} }

import { KEYS, loadJSON, saveJSON } from './storage.js';

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function recordAnswer(correct) {
  const stats = loadJSON(KEYS.stats, {});
  const key = todayKey();
  const day = stats[key] ?? { reviewed: 0, correct: 0 };
  day.reviewed += 1;
  if (correct) day.correct += 1;
  stats[key] = day;
  saveJSON(KEYS.stats, stats);
}

export function getStats() {
  return loadJSON(KEYS.stats, {});
}

/** N ngày gần nhất (cũ → mới), mỗi phần tử {date, label, reviewed, correct} */
export function lastNDays(n, stats = getStats()) {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const key = todayKey(d);
    const day = stats[key] ?? { reviewed: 0, correct: 0 };
    out.push({ date: key, label: `${d.getDate()}/${d.getMonth() + 1}`, ...day });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** % đúng trong 7 ngày gần nhất (null nếu chưa học câu nào) */
export function accuracy7d(stats = getStats()) {
  const days = lastNDays(7, stats);
  const reviewed = days.reduce((s, d) => s + d.reviewed, 0);
  const correct = days.reduce((s, d) => s + d.correct, 0);
  return reviewed ? Math.round((correct / reviewed) * 100) : null;
}

/** Số ngày học liên tục tính đến hôm nay (hôm nay chưa học thì tính đến hôm qua) */
export function streak(stats = getStats()) {
  let count = 0;
  const d = new Date();
  if (!stats[todayKey(d)]?.reviewed) d.setDate(d.getDate() - 1);
  while (stats[todayKey(d)]?.reviewed > 0) {
    count += 1;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
