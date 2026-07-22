import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { IconArrowLeft, IconArrowRight, IconExpand, IconX } from './icons.jsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

/**
 * Xem PDF bằng PDF.js (render canvas) — hoạt động tốt với đề scan trên iOS,
 * thay cho iframe cũ vốn chỉ hiện trang đầu trên Safari.
 * Có nút chuyển trang, zoom, toàn màn hình; lỗi thì fallback về iframe.
 */
export default function PdfViewer({ url, title }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const textLayerRef = useRef(null);
  const [doc, setDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [zoom, setZoom] = useState(1); // hệ số nhân trên scale fit-width
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [fullscreen, setFullscreen] = useState(false);

  // Tải document
  useEffect(() => {
    let cancelled = false;
    let task = null;
    setStatus('loading');
    setDoc(null);
    setPageNum(1);
    setZoom(1);
    (async () => {
      const load = () => {
        task = pdfjsLib.getDocument(url);
        return task.promise;
      };
      try {
        let d;
        try {
          d = await load();
        } catch (e) {
          // StrictMode (dev) có thể destroy worker giữa chừng → thử lại 1 lần với worker mới
          if (!cancelled && /destroyed/i.test(e?.message ?? '')) d = await load();
          else throw e;
        }
        if (cancelled) return;
        setDoc(d);
        setStatus('ready');
      } catch (e) {
        if (!cancelled) {
          console.error('PDF.js không tải được PDF:', e);
          setStatus('error');
        }
      }
    })();
    return () => {
      cancelled = true;
      task?.destroy().catch(() => {});
    };
  }, [url]);

  // Render trang hiện tại (canvas + text layer để bôi đen/copy được chữ)
  useEffect(() => {
    if (!doc) return undefined;
    let cancelled = false;
    let renderTask = null;
    let textLayerTask = null;
    (async () => {
      try {
        const page = await doc.getPage(pageNum);
        if (cancelled) return;
        const wrap = wrapRef.current;
        const canvas = canvasRef.current;
        if (!wrap || !canvas) return;
        const base = page.getViewport({ scale: 1 });
        const fit = Math.max(0.1, (wrap.clientWidth - 16) / base.width);
        const vp = page.getViewport({ scale: fit * zoom });
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(vp.width * dpr);
        canvas.height = Math.floor(vp.height * dpr);
        canvas.style.width = `${Math.floor(vp.width)}px`;
        canvas.style.height = `${Math.floor(vp.height)}px`;
        renderTask = page.render({
          canvasContext: canvas.getContext('2d'),
          viewport: vp,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });

        // Text layer (lớp chữ trong suốt để bôi đen/copy) chạy SONG SONG với
        // canvas render — không phụ thuộc nhau, trang có chữ chọn được sớm hơn.
        // PDF dạng scan không có chữ thì lớp này rỗng, không sao.
        const textDiv = textLayerRef.current;
        const pageDiv = pageRef.current;
        let textPromise = Promise.resolve();
        if (textDiv && pageDiv) {
          textDiv.replaceChildren();
          textDiv.style.width = canvas.style.width;
          textDiv.style.height = canvas.style.height;
          pageDiv.style.setProperty('--scale-factor', String(vp.scale));
          textLayerTask = new TextLayer({
            textContentSource: page.streamTextContent(),
            container: textDiv,
            viewport: vp,
          });
          textPromise = textLayerTask.render().catch((e) => {
            console.warn('Không tạo được text layer (PDF dạng scan?):', e);
          });
        }

        await Promise.allSettled([renderTask.promise, textPromise]);
      } catch (e) {
        if (e?.name !== 'RenderingCancelledException') console.error('Lỗi render trang PDF:', e);
      }
    })();
    return () => {
      cancelled = true;
      renderTask?.cancel();
      textLayerTask?.cancel();
    };
  }, [doc, pageNum, zoom, fullscreen]);

  // Esc thoát toàn màn hình
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const pageCount = doc?.numPages ?? 0;

  if (status === 'error') {
    return (
      <div>
        <p className="pdf-status" style={{ color: 'var(--text-muted)' }}>
          Không render được PDF, dùng trình xem của trình duyệt.{' '}
          <a href={url} target="_blank" rel="noopener noreferrer">
            Mở trong tab mới ↗
          </a>
        </p>
        <iframe className="pdf-frame" src={url} title={title} />
      </div>
    );
  }

  return (
    <div className={fullscreen ? 'pdf-shell-fullscreen' : ''}>
      <div className="pdf-toolbar">
        <div className="pdf-toolbar-group">
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            disabled={pageNum <= 1}
            aria-label="Trang trước"
          >
            <IconArrowLeft />
          </button>
          <span className="pdf-page-info" aria-live="polite">
            {status === 'ready' ? `${pageNum}/${pageCount}` : 'Đang tải…'}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => setPageNum((p) => Math.min(pageCount, p + 1))}
            disabled={pageNum >= pageCount}
            aria-label="Trang sau"
          >
            <IconArrowRight />
          </button>
        </div>
        <div className="pdf-toolbar-group">
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)))}
            aria-label="Thu nhỏ"
          >
            −
          </button>
          <button type="button" className="btn btn-outline btn-xs" onClick={() => setZoom(1)} aria-label="Vừa chiều rộng">
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)))}
            aria-label="Phóng to"
          >
            +
          </button>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => setFullscreen((f) => !f)}
            aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {fullscreen ? <IconX /> : <IconExpand />} {fullscreen ? 'Đóng' : 'Toàn màn hình'}
          </button>
        </div>
      </div>
      <div className="pdf-canvas-wrap" ref={wrapRef}>
        {status === 'loading' && <p className="pdf-status">Đang tải PDF…</p>}
        <div className="pdf-page" ref={pageRef}>
          <canvas ref={canvasRef} role="img" aria-label={`${title} — trang ${pageNum}`} />
          <div className="textLayer" ref={textLayerRef} />
        </div>
      </div>
    </div>
  );
}
