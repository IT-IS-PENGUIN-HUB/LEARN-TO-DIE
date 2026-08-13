// Quy chế kỳ thi thật 技術士第一次試験 — MỘT chỗ duy nhất, mọi màn thi thử đọc
// từ đây (nguyên tắc của ロン: không rải số 120/25/35 khắp code, quy chế đổi
// thì sửa một file).
//
// Nguồn: thẻ 模擬試験 của app trung tâm + quy chế công bố của 日本技術士会.
//  - 基礎:  60 phút · đề 30 câu chia 5 nhóm × 6, MỖI NHÓM CHỌN ĐÚNG 3 câu để
//           trả lời (tổng 15) · 1 điểm/câu · đạt ≥8/15. (2011–2012 đề 5 nhóm
//           × 5 câu nhưng vẫn chọn 3/nhóm — luật perGroupPick tự khớp.)
//  - 適性:  60 phút · làm cả 15 câu · 1 điểm/câu · đạt ≥8/15.
//  - 専門:  120 phút · đề 35 câu, CHỌN 25 câu để trả lời · 2 điểm/câu · đạt
//           ≥25/50 điểm (tức ≥13 câu đúng).

export const EXAM_RULES = {
  KISO: {
    minutes: 60,
    pick: 15, // tổng số câu được trả lời
    perGroupPick: 3, // mỗi nhóm (chuyên mục) chỉ được trả lời đúng chừng này câu
    pointsPer: 1,
    passPoints: 8,
  },
  TEKISEI: {
    minutes: 60,
    pick: null, // null = trả lời toàn bộ
    perGroupPick: null,
    pointsPer: 1,
    passPoints: 8,
  },
  KENSETSU: {
    minutes: 120,
    pick: 25,
    perGroupPick: null,
    pointsPer: 2,
    passPoints: 25,
  },
};

/** Số câu tối đa được trả lời trong một đề cụ thể. */
export function maxAnswers(subject, totalQuestions) {
  const r = EXAM_RULES[subject];
  return r?.pick ?? totalQuestions;
}

/** Chấm một bài thi: đếm đúng → điểm → đỗ/trượt. */
export function gradeExam(subject, correctCount) {
  const r = EXAM_RULES[subject];
  const score = correctCount * r.pointsPer;
  return { score, maxScore: (r.pick ?? 0) * r.pointsPer || null, passed: score >= r.passPoints };
}
