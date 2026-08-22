// Thang xếp hạng kiểu game (Liên Quân/LOL) — ロン chốt 13/8/2026, bảng đầy đủ
// trong kho-de-thi/PLAN-module-de-thi.md mục D.
//
// Đồng 5→1 · Bạc 3→1 · Vàng 3→1 · Bạch Kim 3→1 · Kim Cương 3→1 · Tinh Anh 3→1
// · Cao Thủ (sao không trần) · Thách Đấu. Mỗi bậc con 3 sao, leo số to về 1.
//
// NGUYÊN TẮC TỔNG QUÁT HOÁ: giá sao lưu dạng TỶ LỆ trên tổng kho (hiệu chuẩn
// tại kho 1189 câu: 3/12/20/25/30/35 câu một sao) — kho phình lên 1269 câu thì
// thang tự giãn, không sửa code. Mọi chỉ số derive thuần từ examState ĐÃ SYNC
// nên hai máy tự khớp hạng, không cần đồng bộ hạng riêng.
//
// Chỉ số: D = số câu KHÁC NHAU từng đúng ≥1 lần · coverage = số câu đã làm /
// tổng kho · acc = độ chính xác 30 ngày · mock = bài thi thử đã đỗ.

import { EXAM_RULES } from '../data/examRules.js';

const CAL_TOTAL = 1189; // cỡ kho lúc hiệu chuẩn bảng số

export const TIERS = [
  { id: 'dong', name: 'Đồng', divisions: 5, starCost: 3 / CAL_TOTAL, gates: {} },
  { id: 'bac', name: 'Bạc', divisions: 3, starCost: 12 / CAL_TOTAL, gates: {} },
  { id: 'vang', name: 'Vàng', divisions: 3, starCost: 20 / CAL_TOTAL, gates: { coverage: 0.15, acc: 0.5 } },
  { id: 'bachkim', name: 'Bạch Kim', divisions: 3, starCost: 25 / CAL_TOTAL, gates: { coverage: 0.3, acc: 0.55 } },
  { id: 'kimcuong', name: 'Kim Cương', divisions: 3, starCost: 30 / CAL_TOTAL, gates: { coverage: 0.45, acc: 0.6 } },
  { id: 'tinhanh', name: 'Tinh Anh', divisions: 3, starCost: 35 / CAL_TOTAL, gates: { coverage: 0.7, acc: 0.65, mockAny: 1 } },
  { id: 'caothu', name: 'Cao Thủ', divisions: 0, starCost: 0, gates: { coverage: 0.9, acc: 0.72, mockAll3: true } },
  { id: 'thachdau', name: 'Thách Đấu', divisions: 0, starCost: 0, gates: { coverage: 1, acc: 0.8, doubleSweep: true } },
];

const SUBJECTS = Object.keys(EXAM_RULES); // KISO/TEKISEI/KENSETSU

/** Câu-đúng cần cho MỘT sao của bậc, quy về kho hiện tại (tối thiểu 1). */
export function starCost(tier, bankTotal) {
  return Math.max(1, Math.round(tier.starCost * bankTotal));
}

/** Các bài thi thử đã đỗ, sắp theo thời gian bắt đầu. */
function passedMocks(attempts) {
  return Object.values(attempts ?? {})
    .filter((a) => a && a.mode === 'exam')
    .sort((x, y) => (x.startedAt ?? 0) - (y.startedAt ?? 0));
}

/** "2 bộ liên tiếp đủ 3 môn": đoạn CUỐI toàn bài đỗ, mỗi môn góp mặt ≥2 lần. */
function hasDoubleSweep(attempts) {
  const all = passedMocks(attempts);
  const tail = [];
  for (let i = all.length - 1; i >= 0; i--) {
    if (!all[i].passed) break;
    tail.push(all[i]);
  }
  const per = {};
  for (const a of tail) per[a.subject] = (per[a.subject] ?? 0) + 1;
  return SUBJECTS.every((s) => (per[s] ?? 0) >= 2);
}

/**
 * Các chỉ số nuôi thang hạng, gom một chỗ để computeRank và rankLadder dùng
 * chung (trước đây tính lọt trong computeRank; tách ra để bảng thang không
 * phải tính lại theo cách khác rồi lệch số với thẻ hạng).
 */
export function rankStats(state, bankTotal, now = Date.now()) {
  const srs = state.srs ?? {};
  let everCorrect = 0;
  let done = 0;
  for (const e of Object.values(srs)) {
    const tried = (e.right ?? 0) + (e.wrong ?? 0) > 0;
    if (tried) done += 1;
    if ((e.right ?? 0) > 0) everCorrect += 1;
  }
  const coverage = bankTotal ? done / bankTotal : 0;

  // acc 30 ngày từ nhật ký daily (đã có helper riêng nhưng tính tại chỗ để
  // rank.js không phụ thuộc examState.js — dễ test thuần)
  const cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  const cutoff = `${cutoffDate.getFullYear()}-${p(cutoffDate.getMonth() + 1)}-${p(cutoffDate.getDate())}`;
  let r = 0;
  let w = 0;
  for (const [k, v] of Object.entries(state.daily ?? {})) {
    if (k >= cutoff) {
      r += v.r ?? 0;
      w += v.w ?? 0;
    }
  }
  const acc = r + w === 0 ? null : r / (r + w);

  const passed = passedMocks(state.attempts).filter((a) => a.passed);
  return {
    everCorrect,
    done,
    coverage,
    acc,
    passed,
    passedSubjects: new Set(passed.map((a) => a.subject)),
    doubleSweep: hasDoubleSweep(state.attempts),
    subjectCount: SUBJECTS.length,
  };
}

/**
 * Tính hạng từ examState. Trả về:
 * { tier, tierId, division (5..1|null), stars (trong bậc con, 0..3), label,
 *   totalStars, missing: [chuỗi mô tả điều kiện còn thiếu để lên tiếp] }
 */
export function computeRank(state, bankTotal, now = Date.now()) {
  const { everCorrect, coverage, acc, passed, passedSubjects } = rankStats(state, bankTotal, now);

  const gateMissing = (g) => {
    const miss = [];
    if (g.coverage && coverage < g.coverage) {
      miss.push(`phủ ${Math.round(coverage * 100)}%/${Math.round(g.coverage * 100)}% kho`);
    }
    if (g.acc && (acc ?? 0) < g.acc) {
      miss.push(`độ chính xác 30 ngày ${acc === null ? '—' : Math.round(acc * 100) + '%'}/${Math.round(g.acc * 100)}%`);
    }
    if (g.mockAny && passed.length < g.mockAny) miss.push('đỗ ≥1 bài thi thử');
    if (g.mockAll3 && passedSubjects.size < SUBJECTS.length) {
      miss.push(`đỗ thi thử đủ 3 môn (mới ${passedSubjects.size}/3)`);
    }
    if (g.doubleSweep && !hasDoubleSweep(state.attempts)) {
      miss.push('đỗ liên tiếp 2 bộ thi thử đủ 3 môn');
    }
    return miss;
  };

  // Leo thang từ Đồng: hết sao của bậc + qua cổng điều kiện thì sang bậc kế
  let spent = 0; // số câu-đúng đã "tiêu" cho các bậc đã qua
  for (let t = 0; t < TIERS.length; t++) {
    const tier = TIERS[t];

    if (tier.id === 'caothu') {
      // Trong Cao Thủ: mỗi bài thi thử đỗ = 1 sao, không trần
      const next = TIERS[t + 1];
      const missNext = gateMissing(next.gates);
      if (missNext.length === 0) continue; // đủ điều kiện Thách Đấu thì thăng luôn
      return {
        tier: tier.name,
        tierId: tier.id,
        division: null,
        stars: passed.length,
        totalStars: null,
        label: `${tier.name} ★${passed.length}`,
        missing: missNext.length ? missNext : null,
        nextTier: next.name,
      };
    }
    if (tier.id === 'thachdau') {
      return { tier: tier.name, tierId: tier.id, division: null, stars: null, totalStars: null, label: tier.name, missing: null, nextTier: null };
    }

    const cost = starCost(tier, bankTotal);
    const tierStars = tier.divisions * 3;
    const stars = Math.min(Math.floor((everCorrect - spent) / cost), tierStars);
    const next = TIERS[t + 1];
    const missNext = gateMissing(next.gates);

    if (stars >= tierStars && missNext.length === 0) {
      spent += tierStars * cost;
      continue; // qua bậc, leo tiếp
    }

    // Đứng lại ở bậc này. Đủ sao mà kẹt cổng điều kiện thì ghim ở bậc con 1
    // với 3 sao đầy (không tồn tại "bậc con 0").
    const capped = stars >= tierStars;
    const division = capped ? 1 : tier.divisions - Math.floor(stars / 3); // 5→1 hoặc 3→1
    const starInDiv = capped ? 3 : stars % 3;
    const starBar = '★'.repeat(starInDiv) + '☆'.repeat(3 - starInDiv);
    // missingKind cho UI biết đang thiếu SAO hay kẹt CỔNG — trước đây UI ghép
    // "Để lên Vàng: 12 câu đúng mới để lên ★" đọc rất tối nghĩa (ロン 22/8)
    const capped2 = stars >= tierStars;
    const missing = capped2
      ? missNext // đủ sao nhưng kẹt cổng điều kiện
      : [`${cost - ((everCorrect - spent) % cost)} câu đúng nữa là thêm ★`];
    return {
      tier: tier.name,
      tierId: tier.id,
      division,
      stars: starInDiv,
      totalStars: stars,
      label: `${tier.name} ${division} ${starBar}`,
      missing,
      missingKind: capped2 ? 'gates' : 'stars',
      nextTier: next.name,
    };
  }
  return null; // không tới được — phòng hờ
}

/**
 * BẢNG THANG ĐẦY ĐỦ để người học xem trước đường leo (ロン hỏi 15/8: "các cấp
 * bậc khác, điều kiện lên cấp cần bao nhiêu câu đúng phải có chỗ xem").
 * Trả về mọi bậc kèm mốc câu đúng cộng dồn, giá sao, cổng điều kiện và trạng
 * thái so với hiện tại — mọi con số derive từ TIERS + kho hiện tại, không
 * viết cứng, kho phình lên là bảng tự giãn.
 */
export function rankLadder(state, bankTotal, now = Date.now()) {
  const st = rankStats(state, bankTotal, now);
  const cur = computeRank(state, bankTotal, now);
  const curIdx = TIERS.findIndex((t) => t.id === cur?.tierId);
  const pct = (x) => `${Math.round(x * 100)}%`;

  let from = 0; // câu đúng cộng dồn để BẮT ĐẦU bậc này
  return TIERS.map((tier, i) => {
    const cost = starCost(tier, bankTotal);
    const starsTotal = tier.divisions * 3;
    const span = starsTotal * cost;
    const row = {
      id: tier.id,
      name: tier.name,
      divisions: tier.divisions,
      cost,
      starsTotal,
      from,
      to: starsTotal ? from + span : null,
      state: curIdx < 0 ? 'locked' : i < curIdx ? 'done' : i === curIdx ? 'current' : 'locked',
      // Cổng điều kiện: mô tả + đã đạt chưa + số hiện tại (hiện cả khi đã qua
      // bậc, để biết vì sao mình từng bị chặn ở đó)
      gates: [
        tier.gates.coverage != null && {
          label: `Phủ ${pct(tier.gates.coverage)} kho đề`,
          now: pct(st.coverage),
          ok: st.coverage >= tier.gates.coverage,
        },
        tier.gates.acc != null && {
          label: `Chính xác 30 ngày ≥ ${pct(tier.gates.acc)}`,
          now: st.acc === null ? '—' : pct(st.acc),
          ok: (st.acc ?? 0) >= tier.gates.acc,
        },
        tier.gates.mockAny != null && {
          label: `Đỗ ≥ ${tier.gates.mockAny} bài thi thử`,
          now: `${st.passed.length} bài`,
          ok: st.passed.length >= tier.gates.mockAny,
        },
        tier.gates.mockAll3 && {
          label: 'Đỗ thi thử đủ 3 môn',
          now: `${st.passedSubjects.size}/${st.subjectCount} môn`,
          ok: st.passedSubjects.size >= st.subjectCount,
        },
        tier.gates.doubleSweep && {
          label: 'Đỗ liên tiếp 2 bộ đủ 3 môn',
          now: st.doubleSweep ? 'đạt' : 'chưa',
          ok: st.doubleSweep,
        },
      ].filter(Boolean),
    };
    if (starsTotal) from += span;
    return row;
  }).map((row) => ({
    ...row,
    // Sao đã kiếm được trong bậc này (bậc đã qua = đầy, bậc chưa tới = 0)
    starsGot: row.state === 'done' ? row.starsTotal
      : row.state === 'current' ? (cur?.totalStars ?? cur?.stars ?? 0)
        : 0,
    // Bậc CON đã hoàn thành — nuôi cung sao trên huy hiệu (3 sao nhỏ = 1 bậc con)
    doneDivs: row.state === 'done' ? row.divisions
      : row.state === 'current' ? Math.floor((cur?.totalStars ?? 0) / 3)
        : 0,
  }));
}
