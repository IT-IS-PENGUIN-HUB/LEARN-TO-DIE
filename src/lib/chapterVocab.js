// Từ vựng thuộc từng chương giáo trình.
//
// Bảng ánh xạ sinh sẵn bằng cách quét text đúng khoảng trang của mỗi chương rồi
// đối chiếu với kho từ (khớp cả dạng gốc: 見合う -> 見合). Sinh lại khi thêm giáo
// trình mới hoặc thêm nhiều từ mới.

import chapterWords from '../data/chapterWords.json';
import {
  EDITION_TAG,
  chapterLabel,
  editionOfChapter,
  getChapters,
  getDoc,
  getEditions,
  getVocabChapters,
} from '../data/textbooks.js';

/** Danh sách chuỗi từ (jp) thuộc một chương. */
export function getChapterWords(subjectId, chapterId) {
  return chapterWords[subjectId]?.[chapterId] ?? [];
}

export function chapterWordCount(subjectId, chapterId) {
  return getChapterWords(subjectId, chapterId).length;
}

/**
 * Danh sách chương có từ vựng của một môn — để chọn ngay trong màn Từ vựng,
 * không phải đi vòng qua Giáo trình.
 *
 * Môn có bảng chương gộp (基礎・適性) thì mỗi nhóm là MỘT CHƯƠNG gồm mục của cả
 * hai bộ sách; ロン 17/9: chia theo file 前半/後半 là vô nghĩa vì đó chỉ là cách
 * đóng tập của bộ cũ. Môn chưa có bảng (専門) thì mỗi file giáo trình đã là một
 * chương nên cứ gộp theo file như trước.
 *
 * `words` là kho từ HIỆN CÓ của môn (mảng object có .jp): chỉ đếm từ thật sự
 * ôn được, giống hai nút bên giáo trình — nhãn không được hứa nhiều hơn.
 * Trả về [] khi môn chưa có ánh xạ nào, để nơi gọi tự ẩn ô chọn.
 */
export function vocabChapterGroups(subjectId, words) {
  const have = new Set((words ?? []).map((w) => w.jp));
  const hitOf = (chapterId) => getChapterWords(subjectId, chapterId).filter((w) => have.has(w));

  const merged = getVocabChapters(subjectId);
  if (merged) {
    // Hai bộ nằm chung một chương thì phải ghi rõ mục nào của bộ nào
    const tagged = getEditions(subjectId).length > 1;
    const groups = [];
    for (const m of merged) {
      const items = [];
      const all = new Set();
      for (const c of m.chapters) {
        const hit = hitOf(c.id);
        if (!hit.length) continue;
        const tag = tagged ? `${EDITION_TAG[editionOfChapter(subjectId, c)]} · ` : '';
        items.push({ id: c.id, key: `ch:${c.id}`, label: `${tag}${chapterLabel(c)}`, words: hit });
        for (const w of hit) all.add(w);
      }
      if (items.length) {
        groups.push({
          key: `grp:${m.id}`,
          label: m.label,
          labelVi: m.labelVi,
          // Chương chỉ có một mục (bộ kia không dạy chủ đề đó) thì dòng "Cả chương"
          // và dòng mục là một — bỏ dòng con cho khỏi lặp.
          items: items.length > 1 ? items : [],
          words: [...all],
        });
      }
    }
    return groups;
  }

  const groups = [];
  const byDoc = new Map();
  for (const c of getChapters(subjectId)) {
    const hit = hitOf(c.id);
    if (!hit.length) continue;
    let g = byDoc.get(c.doc);
    if (!g) {
      const doc = getDoc(subjectId, c.doc);
      if (!doc) continue;
      g = { key: `doc:${doc.id}`, label: doc.label, labelVi: doc.labelVi, items: [], words: new Set() };
      byDoc.set(c.doc, g);
      groups.push(g);
    }
    g.items.push({ id: c.id, key: `ch:${c.id}`, label: chapterLabel(c), words: hit });
    for (const w of hit) g.words.add(w);
  }
  return groups.map((g) => ({ ...g, words: [...g.words] }));
}

/**
 * Giải một khoá chọn chương (`grp:<id>` = chương gộp hai bộ, `doc:<id>` = trọn
 * file giáo trình, `ch:<id>` = một mục) thành {words, label} trên kho từ `words`
 * của môn đó; không có thì null. Dùng chung cho ô chọn ở màn Từ vựng và cho từ
 * nhắc góc màn hình, để hai nơi không bao giờ hiểu một khoá theo hai cách.
 *
 * Khoá `doc:` cũ của 基礎・適性 (lưu trong Cài đặt trước 17/9) giờ không còn —
 * trả null, nơi gọi tự quay về cả kho, không vỡ gì.
 */
export function resolveChapterKey(subjectId, key, words) {
  if (!key) return null;
  for (const g of vocabChapterGroups(subjectId, words)) {
    if (key === g.key) return { words: g.words, label: g.label };
    for (const it of g.items) {
      if (key === it.key) return { words: it.words, label: it.label };
    }
  }
  return null;
}
