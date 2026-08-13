// Từ vựng thuộc từng chương giáo trình.
//
// Bảng ánh xạ sinh sẵn bằng cách quét text đúng khoảng trang của mỗi chương rồi
// đối chiếu với kho từ (khớp cả dạng gốc: 見合う -> 見合). Sinh lại khi thêm giáo
// trình mới hoặc thêm nhiều từ mới.

import chapterWords from '../data/chapterWords.json';

/** Danh sách chuỗi từ (jp) thuộc một chương. */
export function getChapterWords(subjectId, chapterId) {
  return chapterWords[subjectId]?.[chapterId] ?? [];
}

export function chapterWordCount(subjectId, chapterId) {
  return getChapterWords(subjectId, chapterId).length;
}
