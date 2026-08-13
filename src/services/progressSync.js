// Đồng bộ chỗ đọc dở giáo trình qua GitHub, để iPhone và PC nối tiếp nhau:
// sáng đọc trên tàu tới trang 8, trưa ở công ty đọc tiếp tới trang 15, tối mở
// iPhone ra phải là trang 15 chứ không phải trang 8.
//
// Dùng file riêng progress.json thay vì nhét vào vocab.json, vì migrateVocab
// cắt bỏ mọi field lạ và luật hoà updatedAt cho bản local thắng — nhét vào đó
// thì tiến độ sẽ bị máy kia xoá.

import { getSyncConfig, readJsonFile, writeJsonFile } from './github.js';
import { readProgress, writeProgress } from '../lib/textbookProgress.js';

const FILE_PATH = 'progress.json';

/**
 * Gộp 2 bản tiến độ: với mỗi chương, bản đọc SAU thắng (theo mốc `at`).
 * Không xoá chương chỉ có ở một bên.
 */
export function mergeProgress(a, b) {
  const out = {};
  for (const src of [a, b]) {
    for (const [subject, chapters] of Object.entries(src ?? {})) {
      if (subject === 'last' || !chapters || typeof chapters !== 'object') continue;
      out[subject] = out[subject] ?? {};
      for (const [chapterId, entry] of Object.entries(chapters)) {
        if (typeof entry?.page !== 'number') continue;
        const cur = out[subject][chapterId];
        if (!cur || (entry.at ?? 0) > (cur.at ?? 0)) out[subject][chapterId] = entry;
      }
    }
  }
  // `last` (chương mở gần nhất) lấy theo mốc thời gian mới hơn
  const lastOf = (src) => {
    const l = src?.last;
    if (!l?.subjectId || !l?.chapterId) return null;
    return { ...l, at: src?.[l.subjectId]?.[l.chapterId]?.at ?? 0 };
  };
  const la = lastOf(a);
  const lb = lastOf(b);
  const last = !la ? lb : !lb ? la : lb.at > la.at ? lb : la;
  if (last) out.last = { subjectId: last.subjectId, chapterId: last.chapterId };
  return out;
}

/** Kéo tiến độ từ GitHub, gộp vào bản local, lưu lại. Trả về bản đã gộp. */
export async function pullProgress() {
  const cfg = getSyncConfig();
  if (!cfg.token) return null;
  const { data } = await readJsonFile(cfg, FILE_PATH);
  if (!data) return null;
  return saveIfChanged(mergeProgress(readProgress(), data));
}

/**
 * Chỉ ghi khi thật sự khác bản đang có ở máy.
 * Ghi vô điều kiện sẽ phát sự kiện đổi tiến độ → useSync lại hẹn giờ push →
 * push lại ghi → lặp vô hạn mỗi 10 giây dù chẳng có gì mới.
 */
function saveIfChanged(merged) {
  const local = readProgress();
  if (JSON.stringify(merged) !== JSON.stringify(local)) writeProgress(merged);
  return merged;
}

/** Đẩy tiến độ lên GitHub (GET → merge → PUT). Không đổi gì thì bỏ qua. */
export async function pushProgress() {
  const cfg = getSyncConfig();
  if (!cfg.token) return { skipped: true };

  const attempt = async () => {
    const { data: remote, sha } = await readJsonFile(cfg, FILE_PATH);
    const merged = saveIfChanged(mergeProgress(readProgress(), remote));
    const content = JSON.stringify(merged, null, 2);
    if (remote && JSON.stringify(remote, null, 2) === content) return { skipped: true };
    await writeJsonFile(cfg, FILE_PATH, content, sha, `Sync tiến độ đọc: ${new Date().toLocaleString('vi-VN')}`);
    return { skipped: false };
  };

  try {
    return await attempt();
  } catch (e) {
    if (e.isConflict) return attempt();
    throw e;
  }
}
