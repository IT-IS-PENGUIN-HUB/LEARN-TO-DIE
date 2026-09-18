// Đồng bộ vocab.json với repo GitHub qua Contents API.
//
// KHÁC BẢN CŨ (quan trọng):
// 0. File >1MB phải đọc qua Git Blobs API — xem readBlob() bên dưới.
// 1. Token KHÔNG BAO GIỜ hardcode trong code — chỉ đọc từ localStorage
//    (user tự dán fine-grained PAT vào Cài đặt, mỗi thiết bị một lần).
// 2. Push không ghi đè mù quáng nữa: luôn GET bản remote trước, merge từng
//    từ theo id (updatedAt mới hơn thắng) rồi mới PUT — hết cảnh 2 thiết bị
//    cùng sync làm mất từ của nhau.

import { SUBJECT_IDS, migrateVocab } from '../lib/migrate.js';
import { KEYS, loadString } from '../lib/storage.js';

// user/repo không phải bí mật — prefill cho tiện, vẫn đổi được trong Cài đặt
const DEFAULT_USER = 'IT-IS-PENGUIN-HUB';
const DEFAULT_REPO = 'LEARN-TO-DIE';
const FILE_PATH = 'vocab.json';

export function getSyncConfig() {
  return {
    user: loadString(KEYS.ghUser) || DEFAULT_USER,
    repo: loadString(KEYS.ghRepo) || DEFAULT_REPO,
    token: loadString(KEYS.ghToken),
  };
}

export function hasSyncToken() {
  return Boolean(loadString(KEYS.ghToken));
}

function requireConfig() {
  const cfg = getSyncConfig();
  if (!cfg.token) {
    throw new Error('Chưa có GitHub token. Vào Cài đặt dán Personal Access Token trước.');
  }
  return cfg;
}

/* ---------- base64 UTF-8 an toàn (không tràn stack với dữ liệu lớn) ---------- */

function b64EncodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function b64DecodeUtf8(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/* ---------- merge ---------- */

/**
 * Gộp 2 bộ vocab theo từng entry id: bản có updatedAt mới hơn thắng,
 * entry chỉ tồn tại một bên thì giữ nguyên. `base` thắng khi hoà.
 */
export function mergeVocab(base, incoming) {
  const out = {};
  for (const s of SUBJECT_IDS) {
    const map = new Map();
    for (const w of base?.[s] ?? []) map.set(w.id, w);
    for (const w of incoming?.[s] ?? []) {
      const cur = map.get(w.id);
      if (!cur || (w.updatedAt ?? 0) > (cur.updatedAt ?? 0)) map.set(w.id, w);
    }
    out[s] = [...map.values()];
  }
  return migrateVocab(out);
}

/* ---------- GitHub API ---------- */

function apiUrl(cfg, path, cacheBust = false) {
  const base = `https://api.github.com/repos/${cfg.user}/${cfg.repo}/contents/${path}`;
  return cacheBust ? `${base}?t=${Date.now()}` : base;
}

function authHeaders(cfg) {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
  };
}

/**
 * Nội dung file qua Git Blobs API (đọc được tới 100MB).
 * Contents API chỉ nhét sẵn `content` cho file ≤ 1MB; lớn hơn thì trả
 * encoding:'none' + content:'' — kho từ vượt 1MB ngày 17/9/2026 và "Tải về"
 * chết ngay ở đó với lỗi "JSON hỏng?", nên phải có đường này.
 */
async function readBlob(cfg, sha) {
  const url = `https://api.github.com/repos/${cfg.user}/${cfg.repo}/git/blobs/${sha}?t=${Date.now()}`;
  const res = await fetch(url, {
    headers: { ...authHeaders(cfg), Accept: 'application/vnd.github.raw' },
  });
  if (!res.ok) throw new Error(`GitHub trả lỗi HTTP ${res.status} khi đọc nội dung file lớn.`);
  return res.text();
}

/** Đọc một file JSON trong repo. Chưa có file thì trả {data:null, sha:null}. */
export async function readJsonFile(cfg, path) {
  const res = await fetch(apiUrl(cfg, path, true), { headers: authHeaders(cfg) });
  if (res.status === 401) {
    throw new Error('GitHub từ chối token (401) — token sai hoặc đã hết hạn. Tạo token mới rồi dán lại trong Cài đặt.');
  }
  if (res.status === 403) {
    throw new Error('GitHub từ chối token (403). Token cần quyền Contents: Read and write cho repo này.');
  }
  if (res.status === 404) {
    // 404 ở đây KHÔNG chắc là thiếu file: fine-grained PAT không được chọn repo
    // cũng trả 404 (GitHub giấu luôn sự tồn tại của repo). Hỏi thêm chính repo
    // để biết là sai tên repo / token thiếu quyền, hay repo đúng mà chưa có file.
    // 18/9/2026: iPhone tải được còn Huawei báo "không tìm thấy vocab.json".
    const repoRes = await fetch(
      `https://api.github.com/repos/${cfg.user}/${cfg.repo}?t=${Date.now()}`,
      { headers: authHeaders(cfg) }
    );
    if (repoRes.status === 404) {
      throw new Error(
        `Máy này không mở được repo ${cfg.user}/${cfg.repo}: sai tên Username/Repository, ` +
        'hoặc token của máy này chưa được cấp quyền cho repo đó (token fine-grained phải ' +
        'tick đúng repo). Kiểm tra 3 ô GitHub trong Cài đặt.'
      );
    }
    return { data: null, sha: null };
  }
  if (!res.ok) throw new Error(`GitHub trả lỗi HTTP ${res.status}.`);
  const body = await res.json();
  const raw = body.content
    ? b64DecodeUtf8(body.content.replace(/\n/g, ''))
    : await readBlob(cfg, body.sha);
  try {
    return { data: JSON.parse(raw), sha: body.sha };
  } catch {
    throw new Error(`${path} trên GitHub không đọc được (JSON hỏng?).`);
  }
}

/** Ghi một file JSON. Ném lỗi có `isConflict` khi sha cũ (bên khác vừa ghi). */
export async function writeJsonFile(cfg, path, content, sha, message) {
  const res = await fetch(apiUrl(cfg, path), {
    method: 'PUT',
    headers: { ...authHeaders(cfg), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: b64EncodeUtf8(content), ...(sha ? { sha } : {}) }),
  });
  if (res.status === 409) {
    const err = new Error('conflict');
    err.isConflict = true;
    throw err;
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error('GitHub từ chối token khi ghi (401/403). Token cần quyền Contents Read/Write.');
  }
  // 413 = payload quá lớn: kho từ đã to tới mức Contents API không nhận nữa
  // (giới hạn đọc là 1MB — đã đi vòng qua Blobs API — còn ghi thì vài chục MB).
  if (res.status === 413 || res.status === 422) {
    throw new Error(
      `GitHub không nhận file (HTTP ${res.status}) — kho từ có thể đã quá lớn cho Contents API.`
    );
  }
  if (!res.ok) throw new Error(`GitHub PUT lỗi HTTP ${res.status}.`);
}

async function fetchRemote(cfg) {
  const { data, sha } = await readJsonFile(cfg, FILE_PATH);
  return { vocab: data, sha };
}

/**
 * Kéo dữ liệu từ GitHub, gộp với dữ liệu local (không mất từ mới thêm ở máy này).
 */
export async function pullVocab(localVocab) {
  const cfg = requireConfig();
  const { vocab: remote } = await fetchRemote(cfg);
  if (!remote) throw new Error(`Không tìm thấy ${FILE_PATH} trên ${cfg.user}/${cfg.repo}.`);
  return mergeVocab(localVocab, remote);
}

/**
 * Đẩy dữ liệu lên GitHub: GET remote → merge → PUT kèm sha.
 * Gặp 409 (bên khác vừa push) thì thử lại một lần.
 * @returns {Promise<{merged, skipped: boolean}>} skipped=true nếu không có gì thay đổi
 */
export async function pushVocab(localVocab) {
  const cfg = requireConfig();

  const attempt = async () => {
    const { vocab: remote, sha } = await fetchRemote(cfg);
    const merged = remote ? mergeVocab(localVocab, remote) : migrateVocab(localVocab);
    const content = JSON.stringify(merged, null, 2);
    if (remote && sha && JSON.stringify(migrateVocab(remote), null, 2) === content) {
      return { merged, skipped: true };
    }
    await writeJsonFile(cfg, FILE_PATH, content, sha, `Sync vocab: ${new Date().toLocaleString('vi-VN')}`);
    return { merged, skipped: false };
  };

  try {
    return await attempt();
  } catch (e) {
    if (e.isConflict) return attempt();
    throw e;
  }
}
