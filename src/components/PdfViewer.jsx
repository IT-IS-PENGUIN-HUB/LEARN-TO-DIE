import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import AddWordForm from './vocab/AddWordForm.jsx';
import {
  IconArrowLeft,
  IconArrowRight,
  IconExpand,
  IconPlus,
  IconRotate,
  IconSkipBack,
  IconSkipForward,
  IconX,
} from './icons.jsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

// Xoay nội dung chỉ có nghĩa trên máy cầm tay (trang ngang, màn dọc). Trên PC màn
// hình vốn đã nằm ngang nên nút chỉ tổ chiếm chỗ — ẩn theo loại con trỏ chứ không
// theo bề rộng, vì cửa sổ PC hẹp vẫn là PC.
const isTouch = () => window.matchMedia?.('(pointer: coarse)').matches ?? false;

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
 * addWordSubject (tuỳ chọn): bật nút thêm từ vào môn này ngay trong toàn màn hình —
 * gặp từ mới lúc đọc thì khỏi phải thoát ra rồi vào lại.
 * onPrevChapter/onNextChapter (tuỳ chọn): nhảy sang MỤC trước/sau ngay trong toàn
 * màn hình. Giáo trình 2025 chia mục rất nhỏ (nhiều mục chỉ 1–2 trang) nên cứ hết
 * mục lại phải thoát toàn màn hình ra bấm mục kế thì quá vướng. Để null khi mục đó
 * không tồn tại (đầu/cuối sách) — nút vẫn hiện nhưng mờ đi, khỏi nhảy layout.
 * chapterName (tuỳ chọn): tên mục, hiện thoáng qua mỗi lần đổi mục để biết mình
 * vừa nhảy tới đâu mà không phải thoát ra xem.
 */
export default function PdfViewer({
  url,
  title,
  pageStart,
  pageEnd,
  initialPage,
  wholeFile = false,
  onReportPage,
  addWordSubject,
  onPrevChapter,
  onNextChapter,
  chapterName,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const textLayerRef = useRef(null);
  // Vuốt lật trang có hiệu ứng: cả hai trang nằm trong `stack`, kéo là dịch cả
  // khối; `ghost` là trang sắp tới, vẽ sẵn và đặt lệch sang một bên.
  const stackRef = useRef(null);
  const ghostRef = useRef(null);
  const ghostPageRef = useRef(null);
  // Đang chờ canvas chính vẽ xong trang mới để hạ màn hiệu ứng (xem onEnd)
  const pendingRef = useRef(null);
  const resetSwipeRef = useRef(() => {});
  // Trang nào đang nằm sẵn trong canvas phụ (null = chưa có/đã cũ), và token để
  // hai lượt vẽ không giẫm chân nhau trên cùng một canvas.
  const ghostHasRef = useRef(null);
  const ghostTokenRef = useRef(0);
  const ghostTaskRef = useRef(null);
  const draggingRef = useRef(false);
  // Đã từng có ngón tay chạm vào chưa. `touch` (pointer: coarse) bỏ sót vài loại
  // máy — laptop màn cảm ứng, iPad ở chế độ "xem như máy tính" — nên cứ gắn tay
  // nghe thao tác vuốt cho mọi máy (chuột thì không bao giờ bắn sự kiện chạm),
  // còn việc VẼ TRƯỚC tốn CPU thì chỉ bật khi biết chắc máy có cảm ứng.
  const sawTouchRef = useRef(false);
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
  const [addOpen, setAddOpen] = useState(false);
  const [touch] = useState(isTouch);

  /**
   * Khổ hiển thị của một trang — DÙNG CHUNG cho trang đang xem và trang vẽ sẵn
   * để vuốt, hai trang phải cùng tỷ lệ thì kéo mới khớp nhau.
   * Xoay do PDF.js làm (không phải CSS transform) → lớp chữ vẫn khớp canvas.
   */
  const computeVp = useCallback(
    (page) => {
      const wrap = wrapRef.current;
      if (!wrap) return null;
      const base = page.getViewport({ scale: 1, rotation: rotate });
      const fitW = (wrap.clientWidth - 16) / base.width;
      // Toàn màn hình: vừa CẢ chiều cao, để trang nằm ngang lọt trọn màn hình.
      // Ngoài toàn màn hình khung cao theo nội dung nên đo chiều cao là vòng lặp → chỉ vừa bề ngang.
      const fitH = (wrap.clientHeight - 16) / base.height;
      const fit = Math.max(0.1, fullscreen && wrap.clientHeight > 80 ? Math.min(fitW, fitH) : fitW);
      return page.getViewport({ scale: fit * zoom, rotation: rotate });
    },
    [rotate, fullscreen, zoom]
  );

  /**
   * Vẽ sẵn một trang vào canvas phụ để lúc kéo có cái mà lộ ra. Không kèm lớp chữ:
   * đang kéo thì không ai bôi đen chữ, vẽ thêm chỉ tổ giật.
   *
   * Vẽ một trang slide mất vài trăm mili giây — LÂU HƠN một cú vuốt (đo thực tế),
   * nên trang kế được vẽ sẵn từ trước lúc vuốt (xem effect "vẽ trước trang kế").
   * Token + cancel để hai lượt vẽ không cùng đổ vào một canvas thành ảnh rác.
   */
  const renderGhost = useCallback(
    async (target) => {
      const canvas = ghostRef.current;
      if (!doc || !canvas) return false;
      ghostTaskRef.current?.cancel();
      ghostTaskRef.current = null;
      ghostHasRef.current = null;
      const token = ++ghostTokenRef.current;
      const page = await doc.getPage(target);
      if (token !== ghostTokenRef.current) return false;
      const vp = computeVp(page);
      if (!vp) return false;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(vp.width * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width = `${Math.floor(vp.width)}px`;
      canvas.style.height = `${Math.floor(vp.height)}px`;
      const task = page.render({
        canvasContext: canvas.getContext('2d'),
        viewport: vp,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      });
      ghostTaskRef.current = task;
      await task.promise;
      if (token !== ghostTokenRef.current) return false;
      ghostHasRef.current = target;
      return true;
    },
    [doc, computeVp]
  );

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
        const vp = computeVp(page);
        if (!vp) return;
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
          textPromise = textLayerTask
            .render()
            .catch((e) => {
              console.warn('Không tạo được text layer (PDF dạng scan?):', e);
            })
            .finally(() => {
              // PDF.js tự đặt lại kích thước khung chữ theo trang CHƯA xoay, nên
              // khi xoay 90° khung bị nằm ngang trong khi canvas đứng: chữ cuối
              // trang bị cắt, và khung thò ra ngoài làm trình xem tưởng đang
              // phóng to → nuốt luôn thao tác vuốt lật trang. Ép về đúng canvas.
              textDiv.style.width = canvas.style.width;
              textDiv.style.height = canvas.style.height;
            });
        }

        await Promise.allSettled([renderTask.promise, textPromise]);
        // Vuốt xong đang giữ nguyên khung lệch + trang vẽ sẵn để không chớp;
        // giờ trang thật đã vẽ đúng nội dung đó rồi thì trả khung về chỗ cũ.
        if (!cancelled && pendingRef.current) {
          clearTimeout(pendingRef.current.timer);
          pendingRef.current = null;
          resetSwipeRef.current();
        }
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
      if (e.key !== 'Escape') return;
      // Đang mở ô thêm từ thì Esc chỉ đóng ô đó, giữ nguyên toàn màn hình
      if (addOpen) setAddOpen(false);
      else setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, addOpen]);

  // Thoát toàn màn hình thì trả trang về đứng và bỏ khoá xoay màn hình
  useEffect(() => {
    if (fullscreen) return undefined;
    setRotate(0);
    setAddOpen(false);
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

  const hasChapterNav = Boolean(onPrevChapter || onNextChapter);
  /**
   * ĐIỆN THOẠI trong toàn màn hình: vuốt đã lo việc lật trang rồi, hai nút mũi tên
   * chỉ ngồi không — nhường chỗ cho nút nhảy MỤC (ロン đề nghị 9/9/2026).
   * MÁY TÍNH thì không vuốt được nên phải giữ cả hai loại nút.
   * Màn xem ĐỀ THI không truyền nút mục nên không bao giờ rơi vào nhánh này —
   * bỏ nút trang ở đó là mất hẳn đường lật trang.
   */
  const showPageArrows = !(fullscreen && touch && hasChapterNav);

  /**
   * VẼ TRƯỚC TRANG KẾ (chỉ máy cảm ứng — chỉ ở đó mới vuốt).
   *
   * Vẽ một trang mất vài trăm ms, dài hơn một cú vuốt, nên nếu đợi tới lúc vuốt
   * mới vẽ thì gần như không bao giờ kịp: người dùng thả tay là trang nhảy cái
   * rụp, đúng cái khó chịu cần bỏ. Vẽ sẵn trang SAU (chiều đọc thường xuyên) khi
   * trang hiện tại đã yên vị; vuốt lùi thì vẽ tại chỗ, không kịp thì đổi thẳng.
   * Hoãn một nhịp để không tranh CPU với trang đang vẽ dở.
   */
  useEffect(() => {
    if (status !== 'ready' || !doc) return undefined;
    if (!touch && !sawTouchRef.current) return undefined;
    const next = pageNum + 1;
    if (next > maxPage) return undefined;
    const t = setTimeout(() => {
      if (!pendingRef.current && !draggingRef.current) renderGhost(next).catch(() => {});
    }, 350);
    return () => {
      clearTimeout(t);
      // Đổi trang/đổi cỡ thì ảnh vẽ sẵn thành vô nghĩa (sai trang hoặc sai tỷ lệ)
      ghostHasRef.current = null;
    };
  }, [touch, status, doc, pageNum, maxPage, renderGhost]);

  /**
   * VUỐT LẬT TRANG THEO NGÓN TAY (chỉ máy cảm ứng).
   *
   * Trước đây chỉ đo quãng vuốt rồi đổi trang cái rụp: màn hình chớp một nhịp,
   * ロン không biết trang đã đổi hay chưa (phản hồi 9/9/2026). Giờ trang bám theo
   * tay: kéo tới đâu trang dịch tới đó, khe hở giữa hai trang lộ ra, thả quá
   * ngưỡng thì sang trang, chưa đủ thì bật về chỗ cũ. Hết trang (đầu/cuối mục)
   * thì kéo nặng tay rồi bật lại — tự nó nói "không còn trang nào nữa".
   *
   * Bấm NÚT vẫn đổi trang thẳng, không hiệu ứng (ロン chốt: chỉ vuốt mới cần).
   *
   * Dịch chuyển bằng transform trên một khối bọc chung, không đụng tới canvas —
   * trình duyệt chạy trên GPU nên kéo mượt, và canvas không phải vẽ lại lần nào.
   */
  useEffect(() => {
    const wrap = wrapRef.current;
    const stack = stackRef.current;
    if (!wrap || !stack || status !== 'ready') return undefined;

    const GAP = 16; // khe hở giữa hai trang — chính là cái "ranh giới" nhìn thấy
    const AXIS = rotate === 90 ? 'Y' : 'X';
    let st = null;

    // Trang xoay 90° + máy cầm ngang: "trái" của người đọc là phía TRÊN màn hình,
    // nên trục kéo là trục dọc. Cùng quy ước với bản vuốt cũ.
    const spanOf = () => {
      const c = canvasRef.current;
      if (!c) return 0;
      return (rotate === 90 ? c.offsetHeight : c.offsetWidth) + GAP;
    };
    const setT = (px, anim) => {
      stack.style.transition = anim ? 'transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1)' : 'none';
      stack.style.transform = px ? `translate${AXIS}(${px}px)` : '';
    };
    const hideGhost = () => {
      const g = ghostPageRef.current;
      if (g) g.style.visibility = 'hidden';
    };
    const resetNow = () => {
      setT(0, false);
      hideGhost();
      stack.style.willChange = '';
    };
    resetSwipeRef.current = resetNow;

    const onStart = (e) => {
      if (e.touches.length !== 1 || pendingRef.current) {
        st = null;
        return;
      }
      // Lần đầu thấy ngón tay: bật vẽ trước và vẽ ngay trang kế, để cú vuốt thứ
      // hai trở đi đã có sẵn trang mà lộ ra.
      if (!sawTouchRef.current) {
        sawTouchRef.current = true;
        if (pageNum + 1 <= maxPage && ghostHasRef.current == null) renderGhost(pageNum + 1).catch(() => {});
      }
      // Đang phóng to (khung cuộn được theo trục kéo) thì kéo là để xem chỗ
      // khuất, không phải lật trang — giữ nguyên luật cũ.
      const canPan =
        rotate === 90
          ? wrap.scrollHeight > wrap.clientHeight + 2
          : wrap.scrollWidth > wrap.clientWidth + 2;
      if (canPan) {
        st = null;
        return;
      }
      st = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        t: Date.now(),
        decided: false,
        drag: false,
        dir: 0,
        span: 0,
        edge: false,
        ready: false,
        along: 0,
      };
    };

    const onMove = (e) => {
      if (!st || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - st.x;
      const dy = e.touches[0].clientY - st.y;
      const along = rotate === 90 ? dy : dx;
      const across = rotate === 90 ? dx : dy;

      if (!st.decided) {
        if (Math.abs(along) < 8 && Math.abs(across) < 8) return;
        st.decided = true;
        // Nghiêng hẳn về trục lật mới coi là lật trang, kẻo cuộn dọc cũng bị bắt
        st.drag = Math.abs(along) > Math.abs(across) * 1.2;
        if (!st.drag) return;
        st.dir = along < 0 ? 1 : -1; // 1 = sang trang sau
        draggingRef.current = true; // đang kéo thì đừng vẽ trước, kẻo đè lên ảnh đang lộ
        st.span = spanOf();
        const target = pageNum + st.dir;
        st.edge = target < minPage || target > maxPage;
        stack.style.willChange = 'transform';
        if (!st.edge) {
          const g = ghostPageRef.current;
          const pg = pageRef.current;
          if (g && pg) {
            // Bám đúng chỗ trang thật đang đứng rồi mới lệch sang một bên —
            // đo tại chỗ nên không phụ thuộc lề CSS (trong/ngoài toàn màn hình khác nhau).
            g.style.top = `${pg.offsetTop}px`;
            g.style.left = `${pg.offsetLeft}px`;
            g.style.transform = `translate${AXIS}(${st.dir * st.span}px)`;
            if (ghostHasRef.current === target) {
              // Đã vẽ sẵn từ trước → lộ ra ngay, đây là đường đi thường gặp
              st.ready = true;
              g.style.visibility = 'visible';
            } else {
              g.style.visibility = 'hidden';
              const mine = st;
              renderGhost(target)
                .then((ok) => {
                  if (ok && st === mine) {
                    mine.ready = true;
                    g.style.visibility = 'visible';
                  }
                })
                .catch(() => {});
            }
          }
        }
      }
      if (!st.drag) return;
      e.preventDefault(); // chặn trang cuộn theo, listener đã đăng ký passive:false
      st.along = along;
      // Kéo ngược lại hướng đã chọn thì dừng ở 0 — không hé trang phía bên kia ra
      let px = st.dir === 1 ? Math.min(0, along) : Math.max(0, along);
      if (st.edge) px *= 0.3; // hết trang: nặng tay như kéo dây chun
      px = Math.max(-st.span, Math.min(st.span, px));
      setT(px, false);
    };

    const onEnd = () => {
      draggingRef.current = false;
      if (!st) return;
      const s = st;
      st = null;
      if (!s.drag) return;

      const moved = Math.abs(s.along);
      // Qua 1/3 trang là đổi; hoặc vẩy nhanh một cái ngắn cũng tính (như lướt ảnh)
      const pass = moved > s.span * 0.33 || (moved > 55 && Date.now() - s.t < 320);
      const target = pageNum + s.dir;

      if (!s.edge && pass && s.ready) {
        // Trượt nốt cho trang mới vào giữa, xong mới đổi số trang
        setT(-s.dir * s.span, true);
        const commit = () => {
          if (pendingRef.current) return;
          // Giữ nguyên khung lệch + trang vẽ sẵn cho tới khi canvas chính vẽ xong
          // trang này (effect render sẽ gọi resetSwipeRef) → không chớp trắng.
          pendingRef.current = {
            timer: setTimeout(() => {
              pendingRef.current = null;
              resetNow();
            }, 1500), // phòng khi render hỏng, đừng để kẹt luôn màn hình
          };
          setPageNum(target);
        };
        stack.addEventListener('transitionend', commit, { once: true });
        // Có máy không bắn transitionend (đúng vị trí sẵn) — chốt bằng tay
        setTimeout(commit, 320);
      } else if (!s.edge && pass) {
        // Trang kế chưa vẽ kịp: đổi thẳng như bản cũ còn hơn đứng chờ
        resetNow();
        setPageNum(Math.max(minPage, Math.min(maxPage, target)));
      } else {
        setT(0, true); // chưa đủ ngưỡng / hết trang → bật về chỗ cũ
        setTimeout(() => {
          if (!pendingRef.current) resetNow();
        }, 260);
      }
    };

    wrap.addEventListener('touchstart', onStart, { passive: true });
    wrap.addEventListener('touchmove', onMove, { passive: false });
    wrap.addEventListener('touchend', onEnd, { passive: true });
    wrap.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      wrap.removeEventListener('touchstart', onStart);
      wrap.removeEventListener('touchmove', onMove);
      wrap.removeEventListener('touchend', onEnd);
      wrap.removeEventListener('touchcancel', onEnd);
    };
  }, [status, rotate, pageNum, minPage, maxPage, renderGhost]);

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
          {fullscreen && hasChapterNav && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => onPrevChapter?.()}
              disabled={!onPrevChapter}
              aria-label="Mục trước"
              title="Mục trước"
            >
              <IconSkipBack /> <span className="pdf-btn-label">Mục trước</span>
            </button>
          )}
          {showPageArrows && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={goPrev}
              disabled={pageNum <= minPage}
              aria-label="Trang trước"
            >
              <IconArrowLeft />
            </button>
          )}
          <span className="pdf-page-info" aria-live="polite">
            {status !== 'ready'
              ? 'Đang tải…'
              : ranged
                ? `${pageNum - minPage + 1}/${maxPage - minPage + 1} (tr. ${pageNum})`
                : `${pageNum}/${pageCount}`}
          </span>
          {showPageArrows && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={goNext}
              disabled={pageNum >= maxPage}
              aria-label="Trang sau"
            >
              <IconArrowRight />
            </button>
          )}
          {fullscreen && hasChapterNav && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => onNextChapter?.()}
              disabled={!onNextChapter}
              aria-label="Mục sau"
              title="Mục sau"
            >
              <IconSkipForward /> <span className="pdf-btn-label">Mục sau</span>
            </button>
          )}
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
          {fullscreen && addWordSubject && (
            <button
              type="button"
              className={`btn btn-outline btn-xs${addOpen ? ' is-on' : ''}`}
              onClick={() => setAddOpen(true)}
              aria-label="Thêm từ vựng mới"
            >
              <IconPlus /> <span className="pdf-btn-label">Thêm từ</span>
            </button>
          )}
          {fullscreen && touch && (
            <button
              type="button"
              className={`btn btn-outline btn-xs${rotate === 90 ? ' is-on' : ''}`}
              onClick={toggleRotate}
              aria-pressed={rotate === 90}
              aria-label={rotate === 90 ? 'Trả trang về đứng' : 'Xoay trang nằm ngang'}
            >
              <IconRotate /> <span className="pdf-btn-label">{rotate === 90 ? 'Về dọc' : 'Xoay ngang'}</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-outline btn-xs"
            onClick={() => setFullscreen((f) => !f)}
            aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {fullscreen ? <IconX /> : <IconExpand />}{' '}
            <span className="pdf-btn-label">{fullscreen ? 'Đóng' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>
      {/* Thao tác vuốt gắn bằng listener thường (passive:false) trong effect ở trên,
          không dùng onTouch* của React — cần preventDefault để trang khỏi cuộn theo. */}
      <div className="pdf-canvas-wrap" ref={wrapRef}>
        {status === 'loading' && <p className="pdf-status">Đang tải PDF…</p>}
        <div className="pdf-page-stack" ref={stackRef}>
          <div className="pdf-page" ref={pageRef}>
            <canvas ref={canvasRef} role="img" aria-label={`${title} — trang ${pageNum}`} />
            <div className="textLayer" ref={textLayerRef} />
          </div>
          {/* Trang sắp tới, chỉ hiện trong lúc kéo */}
          <div className="pdf-page pdf-page-ghost" ref={ghostPageRef} aria-hidden="true">
            <canvas ref={ghostRef} />
          </div>
        </div>
      </div>
      {/* Nằm ngoài khung cuộn để không bị cắt; hiện thoáng qua lúc vào toàn màn hình
          VÀ mỗi lần nhảy mục (key đổi theo trang đầu mục) — nhảy mục mà không biết
          mình đang ở mục nào thì lại phải thoát ra xem, đúng cái phiền cần bỏ.
          Lời nhắc vuốt chỉ dành cho máy cảm ứng; PC vuốt không được. */}
      {fullscreen && status === 'ready' && (chapterName || maxPage > minPage) && (
        <p className="pdf-swipe-hint" key={`${url}-${minPage}`}>
          {chapterName && <strong>{chapterName}</strong>}
          {chapterName && touch && maxPage > minPage && ' · '}
          {touch && maxPage > minPage && 'Vuốt ngang để lật trang'}
        </p>
      )}
      {/* Nằm trong khung toàn màn hình nên đóng ô này là vẫn đang đọc dở, không văng ra ngoài */}
      {fullscreen && addOpen && addWordSubject && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setAddOpen(false)}>
          <div className="modal-content">
            <button type="button" className="close-btn" onClick={() => setAddOpen(false)} aria-label="Đóng">
              <IconX />
            </button>
            <AddWordForm subject={addWordSubject} />
          </div>
        </div>
      )}
    </div>
  );
}
