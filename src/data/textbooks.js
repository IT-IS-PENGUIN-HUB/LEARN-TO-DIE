// Giáo trình của lớp học — mỗi môn là một "thư mục cha", mỗi chương là "thư mục con".
//
// Tài liệu gốc gộp nhiều buổi vào một file PDF, mỗi chương mở đầu bằng một trang bìa.
// Ở đây lưu sẵn khoảng trang của từng chương (dò từ trang bìa trong PDF) để mở
// thẳng đúng chương thay vì phải lật tay.
//
// Trang đầu mỗi file là các bảng 出題傾向 (tỷ lệ ra đề) — KHÔNG thuộc chương 1,
// nên để thành một mục riêng ngang hàng chương (kind: 'trend').
//
// Thêm giáo trình mới: copy PDF vào public/textbooks/<môn>/ rồi thêm một mục
// vào DOCS + các chương vào CHAPTERS của môn đó.

import { SUBJECTS } from './exams.js';

/** Các file PDF gốc, theo môn. `pages` = tổng số trang, dùng để hiện tiến độ. */
const DOCS = {
  tekisei: [
    {
      id: 'part1',
      label: '前半（第1〜7章）',
      labelVi: 'Phần đầu — chương 1–7',
      path: 'textbooks/tekisei/tekisei_part1_ch01-07.pdf',
      pages: 106,
    },
    {
      id: 'part2',
      label: '後半（第8〜16章＋付録）',
      labelVi: 'Phần sau — chương 8–16 + phụ lục',
      path: 'textbooks/tekisei/tekisei_part2_ch08-16.pdf',
      pages: 118,
    },
  ],
  kiso: [],
  senmon: [],
};

/**
 * Chương học. `start`/`end` là số trang trong file PDF (tính từ 1, bao gồm cả hai đầu).
 * `rate` = 出題率 ghi trên trang bìa chương — dùng để sắp thứ tự ưu tiên ôn.
 * kind: 'trend' = bảng tỷ lệ ra đề | 'chapter' = chương | 'appendix' = phụ lục.
 */
const CHAPTERS = {
  tekisei: [
    { id: 'trend1', kind: 'trend', doc: 'part1', start: 2, end: 4,
      titleJp: '目次・出題傾向（前半）', titleVi: 'Mục lục & bảng tỷ lệ ra đề — phần đầu' },
    { id: 'ch01', kind: 'chapter', no: '①', doc: 'part1', start: 5, end: 20, rate: 100,
      titleJp: '技術士制度・技術士法・CPD・資質能力', titleVi: 'Chế độ 技術士 · Luật 技術士法 · CPD · Năng lực' },
    { id: 'ch02', kind: 'chapter', no: '②', doc: 'part1', start: 21, end: 37, rate: 100,
      titleJp: 'リスクマネジメント・安全', titleVi: 'Quản lý rủi ro & an toàn (リスクアセスメント・ALARP)' },
    { id: 'ch03', kind: 'chapter', no: '③', doc: 'part1', start: 38, end: 52, rate: 100,
      titleJp: '技術者倫理の基礎理論', titleVi: 'Lý thuyết nền tảng về đạo đức kỹ sư' },
    { id: 'ch04', kind: 'chapter', no: '④', doc: 'part1', start: 53, end: 67, rate: 83,
      titleJp: 'SDGs・持続可能・環境', titleVi: 'SDGs · Phát triển bền vững · Môi trường' },
    { id: 'ch05', kind: 'chapter', no: '⑤', doc: 'part1', start: 68, end: 82, rate: 100,
      titleJp: '知的財産権', titleVi: 'Quyền sở hữu trí tuệ (知財)' },
    { id: 'ch06', kind: 'chapter', no: '⑥', doc: 'part1', start: 83, end: 94, rate: 100,
      titleJp: '製造物責任法（PL法）', titleVi: 'Luật trách nhiệm sản phẩm (PL法)' },
    { id: 'ch07', kind: 'chapter', no: '⑦', doc: 'part1', start: 95, end: 106, rate: 58,
      titleJp: '研究倫理・研究不正', titleVi: 'Đạo đức nghiên cứu & gian lận nghiên cứu' },

    { id: 'trend2', kind: 'trend', doc: 'part2', start: 2, end: 5,
      titleJp: '目次・出題傾向（後半）', titleVi: 'Mục lục & bảng tỷ lệ ra đề — phần sau' },
    { id: 'ch08', kind: 'chapter', no: '⑧', doc: 'part2', start: 6, end: 17, rate: 42,
      titleJp: '新技術と社会・倫理（AI等）', titleVi: 'Công nghệ mới & xã hội · đạo đức (AI…)' },
    { id: 'ch09', kind: 'chapter', no: '⑨', doc: 'part2', start: 18, end: 29, rate: 58,
      titleJp: '公益通報者保護法', titleVi: 'Luật bảo vệ người tố giác vì lợi ích công' },
    { id: 'ch10', kind: 'chapter', no: '⑩', doc: 'part2', start: 30, end: 41, rate: 50,
      titleJp: '働き方・労働・ダイバーシティ', titleVi: 'Cách làm việc · Lao động · Đa dạng' },
    { id: 'ch11', kind: 'chapter', no: '⑪', doc: 'part2', start: 42, end: 53, rate: 42,
      titleJp: 'ハラスメント', titleVi: 'Quấy rối nơi làm việc (harassment)' },
    { id: 'ch12', kind: 'chapter', no: '⑫', doc: 'part2', start: 54, end: 65, rate: 42,
      titleJp: '組織不正・品質不正・失敗学', titleVi: 'Gian lận tổ chức · gian lận chất lượng · khoa học thất bại' },
    { id: 'ch13', kind: 'chapter', no: '⑬', doc: 'part2', start: 66, end: 77, rate: 33,
      titleJp: '公正取引・独占禁止', titleVi: 'Thương mại công bằng · chống độc quyền' },
    { id: 'ch14', kind: 'chapter', no: '⑭', doc: 'part2', start: 78, end: 92, rate: 58,
      titleJp: '個人情報・情報セキュリティ', titleVi: 'Thông tin cá nhân · an ninh thông tin' },
    { id: 'ch15', kind: 'chapter', no: '⑮', doc: 'part2', start: 93, end: 104, rate: 25,
      titleJp: '安全保障貿易管理', titleVi: 'Quản lý thương mại an ninh (輸出管理)' },
    { id: 'ch16', kind: 'chapter', no: '⑯', doc: 'part2', start: 105, end: 116, rate: 50,
      titleJp: 'ISO 26000・社会的責任・国際標準', titleVi: 'ISO 26000 · trách nhiệm xã hội · tiêu chuẩn quốc tế' },
    { id: 'appendix', kind: 'appendix', doc: 'part2', start: 117, end: 118,
      titleJp: '付録：ユニバーサルデザイン・バリアフリー', titleVi: 'Phụ lục: Universal Design · Barrier-free' },
  ],
  kiso: [],
  senmon: [],
};

/** Thư mục cha: 3 môn, kèm số chương hiện có (0 = chưa có giáo trình). */
export const TEXTBOOK_SUBJECTS = Object.values(SUBJECTS).map((s) => ({
  ...s,
  docCount: (DOCS[s.id] ?? []).length,
  chapterCount: (CHAPTERS[s.id] ?? []).filter((c) => c.kind === 'chapter').length,
}));

export function getDocs(subjectId) {
  return DOCS[subjectId] ?? [];
}

export function getChapters(subjectId) {
  return CHAPTERS[subjectId] ?? [];
}

export function getChapter(subjectId, chapterId) {
  return getChapters(subjectId).find((c) => c.id === chapterId) ?? null;
}

export function getDoc(subjectId, docId) {
  return getDocs(subjectId).find((d) => d.id === docId) ?? null;
}

export function pageCount(chapter) {
  return chapter.end - chapter.start + 1;
}

/** Nhãn hiển thị ngắn: "① 技術士制度…" / "出題傾向" / "付録". */
export function chapterLabel(chapter) {
  if (chapter.kind === 'chapter') return `${chapter.no} ${chapter.titleJp}`;
  return chapter.titleJp;
}
