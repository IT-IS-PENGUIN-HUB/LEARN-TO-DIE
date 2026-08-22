// Đồng bộ trạng thái LÀM ĐỀ qua GitHub — để PC và iPhone nối tiếp nhau đúng
// như tiến độ đọc giáo trình (progressSync.js là khuôn của file này).
//
// File riêng exam-progress.json, KHÔNG đi ké: migrateVocab cắt bỏ field lạ
// (vocab.json), mergeProgress vứt entry không có page:number (progress.json) —
// nhét vào hai chỗ đó dữ liệu chết lặng lẽ ngay lần sync đầu.
//
// Ba nhánh, BA luật gộp khác nhau — đây là phần hồn của file:
//  - srs       : mỗi câu lấy bản MỚI HƠN theo updatedAt (hoà thì local thắng,
//                cùng quy ước mergeVocab); riêng bộ đếm right/wrong lấy MAX
//                từng bên — không thì "đã từng đúng" (nền của xếp hạng) bị máy
//                trả lời sau cùng xoá mất.
//  - bookmarks : mỗi câu bản mới hơn thắng; bật/tắt là giá trị, không xoá key.
//  - attempts  : (GĐ5 ghi) HỢP theo id, không bao giờ đè — phiên thi thử làm
//                offline trên iPhone không thể bị PC nuốt.
//  - session   : phiên làm dở — bản có mốc `at` mới hơn thắng, xoá bằng bia mộ
//                {cleared:true} nên "xoá" cũng lan sang máy kia đúng cách.

import { getSyncConfig, readJsonFile, writeJsonFile } from './github.js';
import { loadExamState, saveExamState, EXAM_SYNCED_EVENT } from '../lib/examState.js';

const FILE_PATH = 'exam-progress.json';

const at = (e) => e?.updatedAt ?? 0;

/** Gộp hai bản trạng thái làm đề. Thuần — không đọc/ghi gì, để test được. */
export function mergeExamState(local, remote) {
  const a = local ?? {};
  const b = remote ?? {};

  const srs = {};
  for (const qid of new Set([...Object.keys(a.srs ?? {}), ...Object.keys(b.srs ?? {})])) {
    const x = a.srs?.[qid];
    const y = b.srs?.[qid];
    if (!x || !y) {
      srs[qid] = { ...(x ?? y) };
      continue;
    }
    const newer = at(y) > at(x) ? y : x; // hoà → local thắng
    srs[qid] = {
      ...newer,
      right: Math.max(x.right ?? 0, y.right ?? 0),
      wrong: Math.max(x.wrong ?? 0, y.wrong ?? 0),
    };
  }

  const bookmarks = {};
  for (const qid of new Set([
    ...Object.keys(a.bookmarks ?? {}),
    ...Object.keys(b.bookmarks ?? {}),
  ])) {
    const x = a.bookmarks?.[qid];
    const y = b.bookmarks?.[qid];
    bookmarks[qid] = !x ? { ...y } : !y ? { ...x } : at(y) > at(x) ? { ...y } : { ...x };
  }

  // Hợp theo id — mỗi lần thi thử là một bản ghi bất biến, có ở đâu giữ ở đó
  const attempts = { ...(b.attempts ?? {}), ...(a.attempts ?? {}) };

  // Nhật ký ngày: MAX từng phía cho mỗi ngày — cùng lý do với right/wrong của
  // srs: lũy đẳng, không bao giờ mất "đã học hôm đó"; hai máy cùng học một
  // ngày thì hơi đếm thiếu, chấp nhận được cho mục đích xếp hạng.
  const daily = {};
  for (const k of new Set([...Object.keys(a.daily ?? {}), ...Object.keys(b.daily ?? {})])) {
    const x = a.daily?.[k];
    const y = b.daily?.[k];
    const s = Math.max(x?.s ?? 0, y?.s ?? 0); // giây làm bài — cùng luật MAX
    daily[k] = {
      r: Math.max(x?.r ?? 0, y?.r ?? 0),
      w: Math.max(x?.w ?? 0, y?.w ?? 0),
      ...(s > 0 ? { s } : {}),
    };
  }

  // Giờ trả lời theo chuyên mục: MAX từng phía — lũy đẳng như daily. Bản app cũ
  // merge sẽ đánh rơi nhánh này, nhưng máy chạy bản mới còn giữ bản local nên
  // MAX lần sau tự khôi phục; hai máy cùng lên bản mới là hết lệch.
  const times = {};
  for (const k of new Set([...Object.keys(a.times ?? {}), ...Object.keys(b.times ?? {})])) {
    const x = a.times?.[k];
    const y = b.times?.[k];
    times[k] = {
      n: Math.max(x?.n ?? 0, y?.n ?? 0),
      s: Math.max(x?.s ?? 0, y?.s ?? 0),
    };
  }

  const sa = a.session;
  const sb = b.session;
  const session = !sa ? sb ?? null : !sb ? sa : (sb.at ?? 0) > (sa.at ?? 0) ? sb : sa;

  return { srs, bookmarks, attempts, daily, times, session };
}

/**
 * Chỉ ghi khi thật sự khác, và ghi KHÔNG phát sự kiện — phát thì useSync lại
 * hẹn push → push lại ghi → lặp vô hạn mỗi 10 giây (bẫy đã ghi ở progressSync).
 */
function saveIfChanged(merged) {
  const local = loadExamState();
  if (JSON.stringify(merged) !== JSON.stringify(local)) {
    saveExamState(merged, { notify: false });
    // Báo UI làm tươi bằng sự kiện RIÊNG (không phải EXAM_EVENT — useSync nghe
    // cái đó để hẹn push, phát nhầm là thành vòng lặp ghi↔đẩy)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EXAM_SYNCED_EVENT));
    }
  }
  return merged;
}

/** Kéo từ GitHub, gộp vào bản máy này, lưu lại. Trả về bản đã gộp (null nếu chưa có gì). */
export async function pullExam() {
  const cfg = getSyncConfig();
  if (!cfg.token) return null;
  const { data } = await readJsonFile(cfg, FILE_PATH);
  if (!data) return null;
  return saveIfChanged(mergeExamState(loadExamState(), data));
}

/** Đẩy lên GitHub: GET → merge → giống hệt thì thôi → PUT kèm sha, đụng 409 thử lại một lần. */
export async function pushExam() {
  const cfg = getSyncConfig();
  if (!cfg.token) return { skipped: true };

  const attempt = async () => {
    const { data: remote, sha } = await readJsonFile(cfg, FILE_PATH);
    const merged = saveIfChanged(mergeExamState(loadExamState(), remote));
    const content = JSON.stringify(merged);
    if (remote && JSON.stringify(remote) === content) return { skipped: true };
    await writeJsonFile(
      cfg,
      FILE_PATH,
      content,
      sha,
      `Sync đề thi: ${new Date().toLocaleString('vi-VN')}`
    );
    return { skipped: false };
  };

  try {
    return await attempt();
  } catch (e) {
    if (e.isConflict) return attempt();
    throw e;
  }
}
