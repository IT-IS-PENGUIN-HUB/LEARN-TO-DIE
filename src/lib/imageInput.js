// Đưa ảnh chụp / trang PDF người dùng chọn về cùng một dạng: JPEG base64 đủ nét
// để AI đọc được chữ Nhật nhưng không quá nặng khi gửi qua mạng (4G trên tàu).
//
// PDF.js được import động — vào tab "Quét ảnh" mà chỉ chọn ảnh thì không phải
// tải chunk PDF (giống cách ExamView lazy-load PdfViewer).

const MAX_EDGE = 2000; // cạnh dài nhất sau khi thu nhỏ — đủ để đọc kanji nhỏ
const JPEG_QUALITY = 0.85;
const PDF_TARGET_WIDTH = 1800;

export const ACCEPT_TYPES = 'image/*,application/pdf';

export function isPdfFile(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name ?? '');
}

/** @returns {{mimeType: string, base64: string, previewUrl: string}} */
function canvasToPart(canvas) {
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return {
    mimeType: 'image/jpeg',
    base64: dataUrl.slice(dataUrl.indexOf(',') + 1),
    previewUrl: dataUrl,
  };
}

function newCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d');
  // Ảnh PNG nền trong suốt → tô trắng, không thì chữ đen trên nền đen
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

/** Ảnh chụp màn hình / ảnh chụp từ điện thoại → JPEG base64 đã thu nhỏ. */
export async function prepareImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Không đọc được ảnh này (định dạng lạ, thử chụp lại dạng JPG/PNG).'));
      el.src = url;
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const { canvas, ctx } = newCanvas(img.naturalWidth * scale, img.naturalHeight * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvasToPart(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Mở PDF một lần rồi giữ lại document để đổi trang không phải parse lại. */
export async function openPdf(file) {
  const buf = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjsLib.getDocument({ data: buf }).promise;
}

/**
 * Lấy chữ có sẵn trong trang PDF (lớp text của file gốc) — chính xác tuyệt đối
 * và không tốn lượt AI đọc ảnh. PDF dạng scan thì trả về chuỗi rỗng, lúc đó
 * mới phải nhờ Gemini nhìn ảnh.
 */
export async function getPdfPageText(doc, pageNum) {
  try {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    // Tiếng Nhật không có dấu cách giữa từ → nối thẳng. Nhưng tài liệu của lớp
    // lẫn tiếng Việt, nối thẳng sẽ dính chữ ("côngcộng") nên chèn dấu cách khi
    // hai bên mối nối đều là chữ Latinh/số. Dải Latinh liệt kê tường minh để
    // không nuốt kana/kanji (kana nằm lọt giữa À-ỹ nếu viết dải kiểu đó).
    const LATIN_END = /[A-Za-z0-9À-ɏḀ-ỿ]$/;
    const LATIN_START = /^[A-Za-z0-9À-ɏḀ-ỿ]/;
    let out = '';
    for (const item of content.items) {
      const s = typeof item.str === 'string' ? item.str : '';
      if (s) out += (LATIN_END.test(out) && LATIN_START.test(s) ? ' ' : '') + s;
      if (item.hasEOL) out += '\n';
    }
    return out
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (e) {
    console.warn('Không lấy được lớp chữ của trang PDF:', e);
    return '';
  }
}

/** Render một trang PDF ra JPEG base64 (dùng cho cả preview lẫn gửi AI). */
export async function renderPdfPage(doc, pageNum) {
  const page = await doc.getPage(pageNum);
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(3, PDF_TARGET_WIDTH / base.width);
  const vp = page.getViewport({ scale });
  const { canvas, ctx } = newCanvas(vp.width, vp.height);
  // intent 'print': PDF.js render bằng setTimeout thay vì requestAnimationFrame.
  // Cần thiết vì rAF đứng im khi cửa sổ bị ẩn/thu nhỏ — không thì chọn file
  // xong chuyển sang app khác là kẹt mãi ở "Đang xử lý file…".
  await page.render({ canvasContext: ctx, viewport: vp, intent: 'print' }).promise;
  return canvasToPart(canvas);
}
