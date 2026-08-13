// Nhớ chỗ đọc dở của giáo trình — mở app trên tàu là đọc tiếp được ngay,
// không phải nhớ mình dừng ở chương/trang nào.
//
// Hình dạng: { [subjectId]: { [chapterId]: {page, at} }, last: {subjectId, chapterId} }
// Bản này chỉ lo lưu ở máy; đồng bộ giữa iPhone và PC nằm ở services/progressSync.js.

import { KEYS, loadJSON, saveJSON } from './storage.js';

/** Sự kiện phát ra mỗi khi tiến độ đổi — useSync nghe để đẩy lên GitHub. */
export const PROGRESS_EVENT = 'ltd-progress-changed';

export function readProgress() {
  const data = loadJSON(KEYS.textbookProgress, {});
  return data && typeof data === 'object' ? data : {};
}

/** Ghi đè toàn bộ (dùng sau khi gộp với bản trên GitHub). */
export function writeProgress(data, { notify = true } = {}) {
  saveJSON(KEYS.textbookProgress, data);
  if (notify && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  }
}

/** Ghi lại trang đang đọc của một chương. */
export function saveProgress(subjectId, chapterId, page) {
  const data = readProgress();
  const bySubject = data[subjectId] && typeof data[subjectId] === 'object' ? data[subjectId] : {};
  if (bySubject[chapterId]?.page === page) return; // không đổi thì không đụng vào
  bySubject[chapterId] = { page, at: Date.now() };
  data[subjectId] = bySubject;
  data.last = { subjectId, chapterId };
  writeProgress(data);
}

/** Trang đang đọc dở của một chương (null nếu chưa đọc). */
export function getProgress(subjectId, chapterId) {
  const entry = readProgress()[subjectId]?.[chapterId];
  return typeof entry?.page === 'number' ? entry.page : null;
}

/** Toàn bộ tiến độ của một môn, để danh sách chương hiện dấu "đang đọc". */
export function getSubjectProgress(subjectId) {
  const bySubject = readProgress()[subjectId];
  return bySubject && typeof bySubject === 'object' ? bySubject : {};
}

/** Chương mở gần nhất — dùng cho nút "Đọc tiếp". */
export function getLastRead() {
  const { last } = readProgress();
  return last?.subjectId && last?.chapterId ? last : null;
}
