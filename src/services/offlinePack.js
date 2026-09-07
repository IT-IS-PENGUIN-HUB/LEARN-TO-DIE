// "Tải về máy" — nạp sẵn mọi thứ cần cho những ngày KHÔNG CÓ MẠNG
// (ロン đi công tác ngoài đảo: đi máy bay, trên đảo có thể không có sóng).
//
// VÌ SAO PHẢI CÓ: service worker chỉ giữ được thứ đã MỞ ÍT NHẤT MỘT LẦN
// (vite.config.js — exam-json StaleWhileRevalidate, exam-img/textbook CacheFirst).
// Riêng ảnh hình vẽ trong đề là chỗ chết người: chế độ "câu chưa từng làm" theo
// đúng định nghĩa toàn câu CHƯA mở bao giờ → ra đảo gặp câu có hình là mất hình,
// mà đó lại đúng là kiểu ôn ロン định làm trong chuyến đi.
//
// CÁCH NẠP: gọi fetch() BÌNH THƯỜNG từ trang rồi đọc hết body, để chính service
// worker chặn và tự cất theo chiến lược của nó. KHÔNG tự caches.open(...).put():
// Workbox giữ sổ hạn dùng riêng trong IndexedDB, mục lạ không có trong sổ bị coi
// như hết hạn — cache trông thì đầy mà lúc offline vẫn hỏng, lỗi rất khó lần.

import { EXAM_YEARS, examDataUrl, diagramUrl } from '../data/examBank.js';
import { getDocs } from '../data/textbooks.js';
import { EXAMS, pdfUrl } from '../data/exams.js';

/** Trang có đang được service worker điều khiển không — không thì tải cũng không cất được. */
export function swControlled() {
  return typeof navigator !== 'undefined' && Boolean(navigator.serviceWorker?.controller);
}

/** URL toàn bộ mảnh đề dạng text (mỗi (năm, môn) một mảnh). */
export function shardUrls() {
  const urls = [];
  for (const y of EXAM_YEARS) {
    for (const [subject, n] of Object.entries(y.subjects ?? {})) {
      if (n > 0) urls.push(examDataUrl(y.year, subject));
    }
  }
  return urls;
}

/**
 * URL các PDF giáo trình của một môn. Có `edition` thì chỉ lấy bộ đó —
 * mỗi môn giờ có hai bộ (2025 đang học + bộ cũ), tải cả hai là gần gấp đôi
 * dung lượng, iPhone không dư chỗ đến thế.
 */
export function textbookUrls(subjectId, edition) {
  return getDocs(subjectId)
    .filter((d) => !edition || (d.edition ?? 'old') === edition)
    .map((d) => pdfUrl(d.path));
}

/** URL các PDF đề thi gốc của một môn (bản scan để đối chiếu). */
export function examPdfUrls(subjectId) {
  return (EXAMS[subjectId] ?? []).map((e) => pdfUrl(e.pdfPath));
}

/** Tên ảnh hình vẽ dùng trong một mảnh đề — dQ (hình đề) + dE (hình lời giải). */
function diagramsOfShard(shard) {
  const names = [];
  for (const q of shard?.questions ?? []) {
    for (const arr of [q.dQ, q.dE]) {
      if (Array.isArray(arr)) names.push(...arr);
    }
  }
  return names;
}

/* ---------------- tải ---------------- */

/** Một lần tải: trả về SỐ BYTE lấy được. Lỗi mạng chớp nhoáng thì thử lại một lần. */
async function grab(url, signal, retry = true) {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // Phải đọc hết body: fetch xong mà bỏ dở thì file chưa về đủ trên máy
    const buf = await res.arrayBuffer();
    return buf.byteLength;
  } catch (e) {
    if (signal?.aborted) throw e;
    if (retry) return grab(url, signal, false);
    throw e;
  }
}

/** Như grab nhưng trả luôn nội dung JSON (dùng cho mảnh đề — cần đọc tên ảnh). */
async function grabJson(url, signal, retry = true) {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    return { bytes: buf.byteLength, data: JSON.parse(new TextDecoder().decode(buf)) };
  } catch (e) {
    if (signal?.aborted) throw e;
    if (retry) return grabJson(url, signal, false);
    throw e;
  }
}

/** Chạy nhiều việc song song có giới hạn — mạng đảo/4G yếu, mở 30 kết nối là tự bóp mình. */
async function pool(items, worker, concurrency, signal) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      if (signal?.aborted) return;
      await worker(queue.shift());
    }
  });
  await Promise.all(runners);
}

/**
 * Tải một gói về máy.
 *
 * @param {object} opts
 * @param {boolean} opts.exam        kho đề (mảnh JSON + ảnh hình vẽ)
 * @param {{subject: string, edition: string}[]} opts.textbooks  bộ giáo trình cần tải
 * @param {string[]} opts.examPdfs   mã môn có đề gốc PDF cần tải
 * @param {AbortSignal} opts.signal  bấm Dừng
 * @param {(p) => void} opts.onProgress  {step, done, total, bytes, failed[]}
 * @returns {Promise<{done, total, bytes, failed}>}
 */
export async function downloadPack({
  exam = false,
  textbooks = [],
  examPdfs = [],
  signal,
  onProgress,
} = {}) {
  const st = { step: '', done: 0, total: 0, bytes: 0, failed: [] };
  const emit = () => onProgress?.({ ...st, failed: [...st.failed] });
  const tick = (n = 0) => {
    st.bytes += n;
    st.done += 1;
    emit();
  };
  const fail = (url, e) => {
    st.failed.push({ url, message: e?.message ?? String(e) });
    st.done += 1;
    emit();
  };

  const shards = exam ? shardUrls() : [];
  const bookUrls = textbooks.flatMap((t) => textbookUrls(t.subject, t.edition));
  const pdfUrls = examPdfs.flatMap(examPdfUrls);
  // Số ảnh chưa biết trước khi đọc mảnh đề → cộng vào total sau
  st.total = shards.length + bookUrls.length + pdfUrls.length;
  emit();

  // 1) Mảnh đề — đọc luôn tên ảnh trong đó
  const imgNames = new Set();
  if (shards.length) {
    st.step = 'Đang tải câu hỏi…';
    emit();
    await pool(
      shards,
      async (url) => {
        try {
          const { bytes, data } = await grabJson(url, signal);
          for (const n of diagramsOfShard(data)) imgNames.add(n);
          tick(bytes);
        } catch (e) {
          if (!signal?.aborted) fail(url, e);
        }
      },
      6,
      signal
    );
  }

  // 2) Ảnh hình vẽ của đề
  if (imgNames.size && !signal?.aborted) {
    const urls = [...imgNames].map(diagramUrl);
    st.total += urls.length;
    st.step = 'Đang tải hình vẽ trong đề…';
    emit();
    await pool(
      urls,
      async (url) => {
        try {
          tick(await grab(url, signal));
        } catch (e) {
          if (!signal?.aborted) fail(url, e);
        }
      },
      8,
      signal
    );
  }

  // 3) PDF (giáo trình + đề gốc) — file to, đi ít mối một để không nghẽn
  const bigFiles = [...bookUrls, ...pdfUrls];
  if (bigFiles.length && !signal?.aborted) {
    st.step = 'Đang tải PDF…';
    emit();
    await pool(
      bigFiles,
      async (url) => {
        try {
          tick(await grab(url, signal));
        } catch (e) {
          if (!signal?.aborted) fail(url, e);
        }
      },
      2,
      signal
    );
  }

  st.step = signal?.aborted ? 'Đã dừng' : 'Xong';
  emit();
  return { done: st.done, total: st.total, bytes: st.bytes, failed: st.failed };
}

/* ---------------- kiểm tra đã có sẵn những gì ---------------- */

/** Có nằm sẵn trong cache của máy không. Chỉ ĐỌC, không đụng sổ hạn dùng của Workbox. */
async function cached(url) {
  if (typeof caches === 'undefined') return false;
  try {
    return Boolean(await caches.match(url));
  } catch {
    return false;
  }
}

async function countCached(urls) {
  let have = 0;
  for (const u of urls) if (await cached(u)) have += 1;
  return { have, total: urls.length };
}

/**
 * Kiểm kê những gì đã nằm trên máy. CHẠY ĐƯỢC CẢ KHI OFFLINE (đọc từ cache),
 * để ngoài đảo mở ra vẫn tự soi được là mình đã có đủ đồ hay chưa.
 */
export async function packStatus(bookSets = [], subjectIds = []) {
  const shards = shardUrls();
  const shardStat = await countCached(shards);

  // Danh sách ảnh nằm trong chính các mảnh đề — đọc lại từ cache, không cần mạng
  const imgNames = new Set();
  if (typeof caches !== 'undefined') {
    for (const url of shards) {
      try {
        const res = await caches.match(url);
        if (!res) continue;
        for (const n of diagramsOfShard(await res.clone().json())) imgNames.add(n);
      } catch {
        /* mảnh hỏng thì bỏ qua, coi như chưa có */
      }
    }
  }
  const imgStat = await countCached([...imgNames].map(diagramUrl));

  // khoá 'kiso|2025' — mỗi môn hai bộ sách nên môn thôi thì không đủ định danh
  const books = {};
  for (const b of bookSets) {
    books[`${b.subject}|${b.edition}`] = await countCached(textbookUrls(b.subject, b.edition));
  }
  const pdfs = {};
  for (const id of subjectIds) pdfs[id] = await countCached(examPdfUrls(id));

  return {
    shards: shardStat,
    // Tổng ảnh chỉ biết được khi đã có mảnh đề trong máy — chưa đủ mảnh thì con
    // số này còn thiếu, nên UI phải xét shards trước rồi mới nói về ảnh.
    images: imgStat,
    imagesKnown: shardStat.have === shardStat.total && shardStat.total > 0,
    books,
    pdfs,
  };
}

/* ---------------- dung lượng máy ---------------- */

/** {usage, quota} theo byte — iPhone hay hết chỗ, cho ロン nhìn thấy trước khi bay. */
export async function storageInfo() {
  try {
    if (!navigator.storage?.estimate) return null;
    const { usage, quota } = await navigator.storage.estimate();
    return { usage: usage ?? 0, quota: quota ?? 0 };
  } catch {
    return null;
  }
}

/**
 * Xin trình duyệt ĐỪNG tự dọn dữ liệu này khi máy đầy. iOS hay xoá dữ liệu web
 * bỏ lâu không mở — xin được thì chuyến đi yên tâm hơn hẳn.
 */
export async function askPersist() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/** "12,3 MB" — số cho người đọc, không phải cho máy. */
export function fmtBytes(n) {
  if (!n) return '0 MB';
  const mb = n / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1).replace('.', ',')} GB`;
  if (mb >= 10) return `${Math.round(mb)} MB`;
  return `${mb.toFixed(1).replace('.', ',')} MB`;
}
