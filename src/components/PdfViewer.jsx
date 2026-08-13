import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { IconArrowLeft, IconArrowRight, IconExpand, IconRotate, IconX } from './icons.jsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

/**
 * Xem PDF bằng PDF.js (render canvas) — hoạt động tốt với đề scan trên iOS,
 * thay cho iframe cũ vốn chỉ hiện trang đầu trên Safari.
 * Có nút chuyển trang, zoom, toàn màn hình; lỗi thì fallback về iframe.
 *
 * pageStart/pageEnd (tuỳ chọn): giới hạn ở một khoảng trang — dùng cho giáo trình,
 * nơi nhiều chương nằm chung một file PDF. Khi có khoảng trang thì mở đúng trang
 * đầu chương và không lật ra ngoài chương được.
 * initialPage (tuỳ chọn): trang mở đầu, mặc định là pageStart — dùng để đọc tiếp
 * đúng chỗ dừng lần trước.
 * onReportPage (tuỳ chọn): báo trang đang đọc ra ngoài để nhớ chỗ đọc dở.
 * wholeFile (tuỳ chọn): tải trọn file thay vì tải từng đoạn. Dùng cho giáo trình —
 * file to, nhảy chương liên tục, và quan trọng hơn: response 200 mới được service
 * worker cache lại nên mới đọc được offline trên tàu.
 */
export default function PdfViewer({
  url,
  title,
  pageStart,
  pageEnd,
  initialPage,
  wholeFile = false,
  onReportPage,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const textLayerRef = useRef(null);
  const startAt = initialPage ?? pageStart ?? 1;
  // Giữ trong ref để effect "đổi chương" không chạy lại mỗi lần lật trang
  const startAtRef = useRef(startAt);
  startAtRef.current = startAt;
  const [doc, setDoc] = useState(null);
  const [pageNum, setPageNum] = useState(startAt);
  const [zoom, setZoom] = useState(1); // hệ số nhân trên scale fit-width
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [fullscreen, setFullscreen] = useState(false);
  const [rotate, setRotate] = useState(0); // 0 = đứng, 90 = nằm ngang

  // Tải document
  useEffect(() => {
    let cancelled = false;
    let task = null;
    setStatus('loading');
    setDoc(null);
    setPageNum(startAtRef.current);
    setZoom(1);
    (async () => {
      const load = () => {
        task = wholeFile
          ? pdfjsLib.getDocument({ url, disableRange: true, disableStream: true })
          : pdfjsLib.getDocument(url);
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
    // startAt đọc qua ref — đổi chương trong CÙNG file thì không tải lại PDF
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // Đổi chương mà vẫn cùng file PDF: url không đổi nên effect trên không chạy → nhảy trang ở đây.
  // Chỉ phụ thuộc khoảng trang (đổi khi và chỉ khi đổi chương), không phụ thuộc trang đang đọc.
  useEffect(() => {
    if (pageStart != null || pageEnd != null) setPageNum(startAtRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageStart, pageEnd]);

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
        // Xoay do PDF.js làm (không phải CSS transform) → lớp chữ vẫn khớp canvas
        const base = page.getViewport({ scale: 1, rotation: rotate });
        const fitW = (wrap.clientWidth - 16) / base.width;
        // Toàn màn hình: vừa CẢ chiều cao, để trang nằm ngang lọt trọn màn hình.
        // Ngoài toàn màn hình khung cao theo nội dung nên đo chiều cao là vòng lặp → chỉ vừa bề ngang.
        const fitH = (wrap.clientHeight - 16) / base.height;
        const fit = Math.max(0.1, fullscreen && wrap.clientHeight > 80 ? Math.min(fitW, fitH) : fitW);
        const vp = page.getViewport({ scale: fit * zoom, rotation: rotate });
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
  }, [doc, pageNum, zoom, fullscreen, rotate]);

  // Esc thoát toàn màn hình
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  // Thoát toàn màn hình thì trả trang về đứng và bỏ khoá xoay màn hình
  useEffect(() => {
    if (fullscreen) return undefined;
    setRotate(0);
    return undefined;
  }, [fullscreen]);

  /**
   * Máy vừa được lật ngang thật thì thôi xoay nội dung nữa — nếu không sẽ xoay hai
   * lần và trang nằm sai chiều. Ai bật khoá xoay màn hình (iOS hay bật) thì khung
   * nhìn vẫn dọc, nội dung giữ nguyên trạng thái xoay, đúng như mong muốn.
   */
  useEffect(() => {
    if (!fullscreen) return undefined;
    const check = () => {
      if (window.innerWidth > window.innerHeight) setRotate(0);
    };
    check();
    // matchMedia là tín hiệu đáng tin nhất cho việc lật máy trên iOS;
    // resize/orientationchange giữ lại làm dự phòng cho trình duyệt cũ.
    const mq = window.matchMedia?.('(orientation: landscape)');
    mq?.addEventListener?.('change', check);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      mq?.removeEventListener?.('change', check);
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, [fullscreen]);

  const pageCount = doc?.numPages ?? 0;
  // Khoảng trang được phép lật. Chưa tải xong thì lấy tạm pageEnd để nút không bị khoá nhầm.
  const lastPage = pageCount || pageEnd || 1;
  const minPage = Math.max(1, pageStart ?? 1);
  const maxPage = Math.min(lastPage, pageEnd ?? lastPage);
  const ranged = pageStart != null || pageEnd != null;

  const goPrev = useCallback(() => setPageNum((p) => Math.max(minPage, p - 1)), [minPage]);
  const goNext = useCallback(() => setPageNum((p) => Math.min(maxPage, p + 1)), [maxPage]);

  /**
   * Vuốt ngang để lật trang. Khi đã phóng to (trang rộng hơn khung) thì kéo ngang
   * là để xem phần bị khuất, không phải lật trang — nên bỏ qua.
   */
  const touchRef = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) {
      touchRef.current = null;
      return;
    }
    const wrap = wrapRef.current;
    touchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      panzoom: wrap ? wrap.scrollWidth > wrap.clientWidth + 2 : false,
    };
  };
  const onTouchEnd = (e) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start || start.panzoom || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    // Phải rõ là ngang (không phải cuộn dọc) và đủ dài để không nhầm với chạm
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  /**
   * Xoay ngang. Trang giáo trình vốn nằm ngang nên xem dọc trên điện thoại rất bé.
   * Ngoài việc xoay nội dung, thử khoá luôn màn hình sang landscape — Android/Chrome
   * làm được, iOS Safari thì không cho, khi đó user tự xoay máy (hoặc cứ để nội dung
   * xoay 90° và nghiêng đầu/máy).
   */
  const toggleRotate = async () => {
    const next = rotate === 90 ? 0 : 90;
    setRotate(next);
    try {
      if (next === 90) {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
        await window.screen?.orientation?.lock?.('landscape');
      } else {
        window.screen?.orientation?.unlock?.();
        if (document.fullscreenElement) await document.exitFullscreen?.();
      }
    } catch {
      // Không khoá được (iOS) — nội dung vẫn xoay, đủ dùng
    }
  };

  // Báo trang đang đọc ra ngoài (nhớ chỗ đọc dở)
  useEffect(() => {
    if (status === 'ready') onReportPage?.(pageNum);
  }, [pageNum, status, onReportPage]);

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
            onClick={goPrev}
            disabled={pageNum <= minPage}
            aria-label="Trang trước"
          >
            <IconArrowLeft />
          </button>
          <span className="pdf-page-info" aria-live="polite">
            {status !== 'ready'
              ? 'Đang tải…'
              : ranged
                ? `${pageNum - minPage + 1}/${maxPage - minPage + 1} (tr. ${pageNum})`
                : `${pageNum}/${pageCount}`}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={goNext}
            disabled={pageNum >= maxPage}
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
          {fullscreen && (
            <button
              type="button"
              className={`btn btn-outline btn-xs${rotate === 90 ? ' is-on' : ''}`}
              onClick={toggleRotate}
              aria-pressed={rotate === 90}
              aria-label={rotate === 90 ? 'Trả trang về đứng' : 'Xoay trang nằm ngang'}
            >
              <IconRotate /> {rotate === 90 ? 'Về dọc' : 'Xoay ngang'}
            </button>
          )}
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
      <div className="pdf-canvas-wrap" ref={wrapRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {status === 'loading' && <p className="pdf-status">Đang tải PDF…</p>}
        <div className="pdf-page" ref={pageRef}>
          <canvas ref={canvasRef} role="img" aria-label={`${title} — trang ${pageNum}`} />
          <div className="textLayer" ref={textLayerRef} />
        </div>
      </div>
      {/* Nằm ngoài khung cuộn để không bị cắt; chỉ hiện lúc mới vào toàn màn hình */}
      {fullscreen && status === 'ready' && maxPage > minPage && (
        <p className="pdf-swipe-hint" key={`${url}-${minPage}`}>
          Vuốt ngang để lật trang
        </p>
      )}
    </div>
  );
}
