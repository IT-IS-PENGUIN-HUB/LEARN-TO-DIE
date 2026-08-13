// Trạng thái làm đề của người dùng, khoá theo qid.
//
// CHỦ Ý ĐỂ RIÊNG, không đi ké vocab.json hay progress.json:
//  - migrateVocab CẮT BỎ mọi field lạ ở mọi cửa vào → nhét vào vocab là mất sạch.
//  - mergeProgress vứt mọi entry không có `page` là number → nhét vào progress cũng mất.
// GĐ2 mới chỉ lưu localStorage; GĐ3 sẽ thêm sync GitHub qua file exam-progress.json.

import { KEYS, loadJSON, saveJSON } from './storage.js';
import { applyAnswer } from './srs.js';

const EMPTY = { srs: {}, bookmarks: {}, session: null };

export function loadExamState() {
  const s = loadJSON(KEYS.examState, null);
  if (!s || typeof s !== 'object') return { ...EMPTY, srs: {}, bookmarks: {} };
  return { srs: s.srs ?? {}, bookmarks: s.bookmarks ?? {}, session: s.session ?? null };
}

export function saveExamState(state) {
  saveJSON(KEYS.examState, state);
}

/** Bản ghi SRS mặc định cho câu chưa từng làm. srs.js chỉ cần score + nextReview. */
function blank(now) {
  return { score: 0, nextReview: now, mastered: false, right: 0, wrong: 0, updatedAt: now };
}

/**
 * Ghi một lần trả lời. Dùng NGUYÊN applyAnswer của srs.js (Leitner 8 hộp) —
 * không viết engine riêng, để câu hỏi và từ vựng cùng một luật ôn tập.
 */
export function recordExamAnswer(state, qid, correct, now = Date.now()) {
  const prev = state.srs[qid] ?? blank(now);
  const next = applyAnswer(prev, correct, now);
  return {
    ...state,
    srs: {
      ...state.srs,
      [qid]: {
        ...next,
        right: prev.right + (correct ? 1 : 0),
        wrong: prev.wrong + (correct ? 0 : 1),
      },
    },
  };
}

export function toggleBookmark(state, qid, now = Date.now()) {
  const on = !state.bookmarks[qid]?.on;
  return { ...state, bookmarks: { ...state.bookmarks, [qid]: { on, updatedAt: now } } };
}

export const isBookmarked = (state, qid) => Boolean(state.bookmarks[qid]?.on);

/** Đã làm = từng trả lời ít nhất một lần (right + wrong > 0). */
export function isDone(state, qid) {
  const e = state.srs[qid];
  return Boolean(e && e.right + e.wrong > 0);
}

/** Thống kê cho một nhóm câu (một năm, một môn…): đã làm bao nhiêu, đúng bao nhiêu. */
export function statsFor(state, qids) {
  let done = 0;
  let right = 0;
  for (const qid of qids) {
    const e = state.srs[qid];
    if (!e || e.right + e.wrong === 0) continue;
    done += 1;
    if (e.right > 0) right += 1; // "đã từng đúng" — đúng thước đo dùng cho xếp hạng
  }
  return { done, right, total: qids.length, pct: qids.length ? Math.round((done / qids.length) * 100) : 0 };
}

/** Số câu KHÁC NHAU từng trả lời đúng ít nhất một lần — nền cho xếp hạng ở GĐ5. */
export function countEverCorrect(state) {
  return Object.values(state.srs).filter((e) => e.right > 0).length;
}

export function countBookmarks(state) {
  return Object.values(state.bookmarks).filter((b) => b.on).length;
}

/** Câu từng trả lời sai và chưa sửa được (wrong > 0) — dùng cho "Câu sai" ở GĐ4. */
export function countWrong(state) {
  return Object.values(state.srs).filter((e) => e.wrong > 0 && e.right === 0).length;
}

// ---- phiên làm dở -------------------------------------------------------
// App không có router; F5 hoặc service worker cập nhật là về trang chủ. Đề 専門
// có 35 câu nên mất phiên giữa chừng rất ức chế → lưu lại chỗ đang làm.

export function saveSession(state, session) {
  return { ...state, session };
}

export function clearSession(state) {
  return { ...state, session: null };
}
