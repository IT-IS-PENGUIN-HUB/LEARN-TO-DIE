// Từ vựng thuộc từng chương giáo trình.
//
// Bảng ánh xạ sinh sẵn bằng cách quét text đúng khoảng trang của mỗi chương rồi
// đối chiếu với kho từ (khớp cả dạng gốc: 見合う -> 見合). Sinh lại khi thêm giáo
// trình mới hoặc thêm nhiều từ mới.

import chapterWords from '../data/chapterWords.json';
import { chapterLabel, getChapters, getDoc } from '../data/textbooks.js';

/** Danh sách chuỗi từ (jp) thuộc một chương. */
export function getChapterWords(subjectId, chapterId) {
  return chapterWords[subjectId]?.[chapterId] ?? [];
}

export function chapterWordCount(subjectId, chapterId) {
  return getChapterWords(subjectId, chapterId).length;
}

/**
 * Danh sách chương có từ vựng của một môn, gộp theo file giáo trình — để chọn
 * ngay trong màn Từ vựng, không phải đi vòng qua Giáo trình.
 *
 * `words` là kho từ HIỆN CÓ của môn (mảng object có .jp): chỉ đếm từ thật sự
 * ôn được, giống hai nút bên giáo trình — nhãn không được hứa nhiều hơn.
 * Trả về [] khi môn chưa có ánh xạ nào, để nơi gọi tự ẩn ô chọn.
 */
export function vocabChapterGroups(subjectId, words) {
  const have = new Set((words ?? []).map((w) => w.jp));
  const groups = [];
  const byDoc = new Map();
  for (const c of getChapters(subjectId)) {
    const hit = getChapterWords(subjectId, c.id).filter((w) => have.has(w));
    if (!hit.length) continue;
    let g = byDoc.get(c.doc);
    if (!g) {
      const doc = getDoc(subjectId, c.doc);
      if (!doc) continue;
      g = { docId: doc.id, label: doc.label, labelVi: doc.labelVi, items: [], words: new Set() };
      byDoc.set(c.doc, g);
      groups.push(g);
    }
    g.items.push({ id: c.id, label: chapterLabel(c), words: hit });
    for (const w of hit) g.words.add(w);
  }
  return groups.map((g) => ({ ...g, words: [...g.words] }));
}

/**
 * Giải một khoá chọn chương (`doc:<id>` = trọn file giáo trình, `ch:<id>` = một mục)
 * thành {words, label} trên kho từ `words` của môn đó; không có thì null.
 * Dùng chung cho ô chọn ở màn Từ vựng và cho từ nhắc góc màn hình, để hai nơi
 * không bao giờ hiểu một khoá theo hai cách.
 */
export function resolveChapterKey(subjectId, key, words) {
  if (!key) return null;
  for (const g of vocabChapterGroups(subjectId, words)) {
    if (key === `doc:${g.docId}`) return { words: g.words, label: g.label };
    for (const it of g.items) {
      if (key === `ch:${it.id}`) return { words: it.words, label: it.label };
    }
  }
  return null;
}
