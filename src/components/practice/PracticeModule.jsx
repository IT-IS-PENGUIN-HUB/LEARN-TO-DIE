import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import PracticeHome from './PracticeHome.jsx';
import QuestionRunner from './QuestionRunner.jsx';
import CustomPractice from './CustomPractice.jsx';
import MockExam from './MockExam.jsx';
import ReviewBrowser from './ReviewBrowser.jsx';
import CategoryList from './CategoryList.jsx';
import StatsView from './StatsView.jsx';
import { EXAM_YEARS, SUBJECT_META, BANK_TOTAL, CATEGORIES } from '../../data/examBank.js';
import { gradeExam } from '../../data/examRules.js';
import {
  loadYear, loadShard, loadQuestionsByQids, loadCategory, shuffleQuestions, isCorrect,
} from '../../lib/examData.js';
import {
  loadExamState, saveExamState, recordExamAnswer, toggleBookmark, addAttempt,
  statsFor, saveSession, clearSession, activeSession, EXAM_EVENT, EXAM_SYNCED_EVENT,
} from '../../lib/examState.js';
import { computeRank, TIERS } from '../../lib/rank.js';
import RankUpModal from './RankUpModal.jsx';
import { buildQueue } from '../../lib/srs.js';
import { KEYS, loadJSON, saveJSON, loadString, saveString } from '../../lib/storage.js';
import { IconArrowLeft } from '../icons.jsx';

const SUBJECT_ORDER = ['KENSETSU', 'KISO', 'TEKISEI'];
const DEFAULT_PREFS = { lang: 'both', furi: true, size: 'm', goal: 20, qlist: false };

/**
 * Module Đề thi — tự quản 3 màn con (chọn đề → làm bài → kết quả) bằng state
 * nội bộ, để App.jsx chỉ phải thêm ĐÚNG MỘT view name. Đổi lại, view 'practice'
 * BẮT BUỘC nằm trong biểu thức `busy` của App.jsx, nếu không service worker sẽ
 * tải lại trang giữa lúc đang làm đề và mất sạch phiên (đúng lỗi cũ của quiz).
 */
export default function PracticeModule({ onBack, sub }) {
  const [examState, setExamState] = useState(loadExamState);
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...loadJSON(KEYS.examPrefs, {}) }));
  const [filter, setFilter] = useState('all');
  const [screen, setScreen] = useState('home'); // home | catlist | run | result
  // Chuyên mục đang mở danh sách: {code, subject, questions} — giữ lại sau khi
  // làm xong để bấm Quay lại là thấy đúng danh sách cũ, không phải tải lại.
  const [catView, setCatView] = useState(null);
  // Thoát màn làm bài thì về đâu: 'home' hay 'catlist' (vào từ danh sách mục)
  const [runBack, setRunBack] = useState('home');
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  // meta của phiên đang chạy:
  //   {mode:'year', year, subjectFilter}                — làm đề theo năm
  //   {mode:'wrong'|'bookmark'|'custom', qids, label}   — pool câu theo danh sách
  //   {mode:'mock', subject, year, startedAt}           — thi thử bấm giờ
  const [meta, setMeta] = useState(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [browseTab, setBrowseTab] = useState('recent');
  const [mockFlags, setMockFlags] = useState({});
  const [mockResult, setMockResult] = useState(null); // {attempt, questions, answers}
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewReturn, setReviewReturn] = useState('home'); // thoát review thì về đâu
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * MỌI thay đổi trạng thái phải đi qua đây, và phải là hàm biến đổi chứ không
   * phải object dựng sẵn. Lý do đã trả giá để biết: lúc đầu tôi để phiên làm dở
   * ghi thẳng xuống localStorage còn SRS/đánh dấu ghi qua state React — hai
   * đường ghi cùng một key, nên mỗi lần bấm đánh dấu là state React (không mang
   * theo phiên) đè lên và MẤT chỗ đang làm dở.
   */
  const commit = useCallback((fn) => {
    setExamState((prev) => {
      const next = fn(prev);
      saveExamState(next);
      return next;
    });
  }, []);

  // Sync kéo dữ liệu máy kia về ghi thẳng localStorage (notify:false) — nghe
  // EXAM_EVENT thì không đủ. Đọc lại khi tab hiện ra / cửa sổ được focus:
  // đúng nhịp người dùng chuyển từ iPhone sang PC.
  useEffect(() => {
    // Không chặn theo visibilityState: refresh chỉ là một phép so sánh rẻ,
    // chạy lúc tab ẩn cũng vô hại — chặn thì có tình huống bỏ lỡ cập nhật.
    const refresh = () => {
      const disk = loadExamState();
      setExamState((cur) => (JSON.stringify(disk) !== JSON.stringify(cur) ? disk : cur));
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener(EXAM_EVENT, refresh);
    window.addEventListener(EXAM_SYNCED_EVENT, refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(EXAM_EVENT, refresh);
      window.removeEventListener(EXAM_SYNCED_EVENT, refresh);
    };
  }, []);

  const setPref = useCallback((patch) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      saveJSON(KEYS.examPrefs, next);
      return next;
    });
  }, []);

  // Thống kê cho thẻ năm — đọc thẳng manifest nên không phải tải mảnh JSON nào.
  // Chỉ đếm được câu ĐÃ TỪNG LÀM (trong examState), đủ cho thanh tiến độ.
  const statsOf = useCallback((year, subjects) => {
    const prefixes = subjects.map((s) => `${year}-${s}-`);
    const qids = Object.keys(examState.srs).filter((qid) => prefixes.some((p) => qid.startsWith(p)));
    const y = EXAM_YEARS.find((e) => e.year === year);
    const total = subjects.reduce((n, s) => n + (y?.subjects[s] ?? 0), 0);
    const s = statsFor(examState, qids);
    return { ...s, total, pct: total ? Math.round((s.done / total) * 100) : 0 };
  }, [examState]);

  /** Vào màn làm bài với bộ câu đã nạp xong — mọi chế độ đều đi qua đây.
      `back` = màn để quay về khi thoát: mặc định 'home', vào từ danh sách chuyên
      mục thì 'catlist' (bỏ qua bước này là thoát ra bị văng về trang chọn đề). */
  const begin = useCallback((list, nextMeta, restore = null, back = 'home') => {
    setQuestions(list);
    setMeta(nextMeta);
    setAnswers(restore?.answers ?? {});
    setIndex(Math.min(restore?.index ?? 0, Math.max(0, list.length - 1)));
    setRunBack(back);
    setScreen('run');
  }, []);

  const guarded = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const startYear = useCallback((year, subjectFilter, restore = null) => guarded(async () => {
    const subjects = (subjectFilter === 'all' ? SUBJECT_ORDER : [subjectFilter]).filter((s) => {
      const y = EXAM_YEARS.find((e) => e.year === year);
      return (y?.subjects[s] ?? 0) > 0;
    });
    const list = await loadYear(year, subjects);
    begin(list, { mode: 'year', year, subjectFilter }, restore);
  }), [begin, guarded]);

  /** Ôn theo danh sách qid (câu sai / đánh dấu / làm tiếp phiên tuỳ chỉnh). */
  const startQids = useCallback((qids, mode, label, restore = null) => guarded(async () => {
    const list = await loadQuestionsByQids(qids);
    if (!list.length) throw new Error('Không còn câu nào trong nhóm này.');
    begin(list, { mode, qids: list.map((q) => q.qid), label }, restore);
  }), [begin, guarded]);

  // Pool câu sai: từng sai ít nhất một lần, chưa mastered. Lọc pool TRƯỚC rồi
  // mới đưa vào buildQueue — đưa cả kho vào là nó độn nghìn câu chưa sai vào đuôi.
  const wrongPool = useMemo(
    () => Object.entries(examState.srs)
      .filter(([, e]) => (e.wrong ?? 0) > 0 && !e.mastered)
      .map(([qid, e]) => ({ qid, ...e })),
    [examState]
  );
  const bookmarkQids = useMemo(
    () => Object.keys(examState.bookmarks)
      .filter((qid) => examState.bookmarks[qid]?.on)
      .sort()
      .reverse(), // năm mới trước (qid mở đầu bằng năm)
    [examState]
  );

  const startWrong = useCallback(() => {
    // buildQueue của srs.js: câu đến hạn cũ nhất trước, phần chưa đến hạn xáo trộn
    const queue = buildQueue(wrongPool);
    startQids(queue.map((e) => e.qid), 'wrong', 'Ôn câu sai');
  }, [wrongPool, startQids]);

  const startBookmarks = useCallback(() => {
    startQids(bookmarkQids, 'bookmark', 'Câu đánh dấu');
  }, [bookmarkQids, startQids]);

  /** Gợi ý hôm nay (おすすめ): câu đến hạn ôn SRS trước, độn thêm câu từng làm — tối đa 20. */
  const startSuggest = useCallback(() => {
    const pool = Object.entries(examState.srs)
      .filter(([, e]) => (e.right ?? 0) + (e.wrong ?? 0) > 0 && !e.mastered)
      .map(([qid, e]) => ({ qid, ...e }));
    const queue = buildQueue(pool, { limit: 20 });
    startQids(queue.map((e) => e.qid), 'suggest', 'Gợi ý hôm nay');
  }, [examState, startQids]);

  /** Câu mới (học 新しい問題 của trung tâm): 20 câu CHƯA TỪNG làm, ưu tiên đề
      năm gần nhất. Tải dần từng năm từ mới về cũ, đủ 20 thì dừng — người mới
      dùng khỏi phải tải cả 45 mảnh chỉ để chọn 20 câu. */
  const startNew = useCallback(() => guarded(async () => {
    const subjects = filter === 'all' ? SUBJECT_ORDER : [filter];
    const fresh = [];
    const years = [...EXAM_YEARS].sort((a, b) => b.year - a.year);
    for (const y of years) {
      const pairs = subjects.filter((s) => y.subjects[s]).map((s) => ({ year: y.year, subject: s }));
      if (!pairs.length) continue;
      const shards = await Promise.all(pairs.map((p) => loadShard(p.year, p.subject)));
      fresh.push(...shards
        .flatMap((sh) => sh.questions.map((q) => ({ ...q, year: sh.year, subject: sh.subject })))
        .filter((q) => {
          const e = examState.srs[q.qid];
          return !e || (e.right ?? 0) + (e.wrong ?? 0) === 0;
        }));
      if (fresh.length >= 20) break;
    }
    if (!fresh.length) throw new Error('Hết câu mới — bạn đã đụng tới toàn bộ kho rồi 🎉');
    const qs = shuffleQuestions(fresh).slice(0, 20);
    begin(qs, { mode: 'new', qids: qs.map((q) => q.qid), label: 'Câu chưa từng làm' });
  }), [begin, guarded, filter, examState]);

  /** Ngẫu nhiên (ランダム): 20 câu bất kỳ — bốc 3 mảnh ngẫu nhiên rồi trộn. */
  const startRandom = useCallback(() => guarded(async () => {
    const pairs = shuffleQuestions(
      EXAM_YEARS.flatMap((y) => SUBJECT_ORDER.filter((s) => y.subjects[s]).map((s) => ({ year: y.year, subject: s })))
    ).slice(0, 3);
    const shards = await Promise.all(pairs.map((p) => loadShard(p.year, p.subject)));
    const qs = shuffleQuestions(
      shards.flatMap((sh) => sh.questions.map((q) => ({ ...q, year: sh.year, subject: sh.subject })))
    ).slice(0, 20);
    begin(qs, { mode: 'random', qids: qs.map((q) => q.qid), label: 'Ngẫu nhiên 20 câu' });
  }), [begin, guarded]);

  /** Bấm một CHUYÊN MỤC → mở DANH SÁCH câu của mục theo năm (không lao thẳng
      vào làm cả 88 câu như trước — ロン yêu cầu 24/8/2026, học panel 問題一覧). */
  const openCategory = useCallback((subject, code) => guarded(async () => {
    const qs = await loadCategory(subject, code);
    if (!qs.length) throw new Error('Chuyên mục này chưa có câu nào.');
    // `from`: mở mục từ màn Thống kê thì Quay lại phải về Thống kê, không văng
    // về trang chọn đề (bảng nhiệt cuộn xa, bị đá về đầu là mất chỗ đang xem).
    setCatView({ code, subject, questions: qs, from: screen === 'stats' ? 'stats' : 'home' });
    setScreen('catlist');
    window.scrollTo(0, 0);
  }), [guarded, screen]);

  /** Bắt đầu làm từ danh sách chuyên mục: cả mục / cả một năm / thẳng một câu.
      Hàng đợi vẫn là NGUYÊN danh sách được truyền vào để bấm "Câu tiếp" đi tiếp
      trong mục, chỉ khác chỗ bắt đầu. */
  const startFromCategory = useCallback((list, startIndex, label) => {
    begin(list, { mode: 'category', qids: list.map((q) => q.qid), label }, { index: startIndex }, 'catlist');
    window.scrollTo(0, 0);
  }, [begin]);

  /** Mở MỘT câu từ trình Xem lại — chế độ review, có sẵn lựa chọn cũ nếu còn lưu. */
  const openSingle = useCallback((q) => {
    const last = examState.srs?.[q.qid]?.last;
    setQuestions([q]);
    setMeta({ mode: 'single', qids: [q.qid], label: 'Xem lại' });
    setAnswers(last ? { [q.qid]: last } : {});
    setIndex(0);
    setReviewMode(true);
    setReviewReturn('browse');
    setScreen('run');
    window.scrollTo(0, 0);
  }, [examState]);

  /** Luyện tuỳ chỉnh: nạp các mảnh trong khoảng năm/môn rồi lọc — chip chuyên mục
      và nguồn (sai/chưa làm/đánh dấu) cần nội dung câu nên phải nạp trước. */
  const startCustom = useCallback((f) => guarded(async () => {
    setCustomOpen(false);
    const pairs = EXAM_YEARS
      .filter((y) => y.year >= f.yearFrom && y.year <= f.yearTo)
      .flatMap((y) => f.subjects.filter((s) => y.subjects[s]).map((s) => ({ year: y.year, subject: s })));
    const shards = await Promise.all(pairs.map((p) => loadShard(p.year, p.subject)));
    let qs = shards.flatMap((sh) =>
      sh.questions.map((q) => ({ ...q, year: sh.year, subject: sh.subject }))
    );
    if (f.cats) qs = qs.filter((q) => f.cats.has(q.cat));
    if (f.source === 'wrong') {
      qs = qs.filter((q) => (examState.srs[q.qid]?.wrong ?? 0) > 0);
    } else if (f.source === 'unseen') {
      qs = qs.filter((q) => {
        const e = examState.srs[q.qid];
        return !e || (e.right ?? 0) + (e.wrong ?? 0) === 0;
      });
    } else if (f.source === 'bookmark') {
      qs = qs.filter((q) => examState.bookmarks[q.qid]?.on);
    }
    if (!qs.length) throw new Error('Không có câu nào khớp bộ lọc — nới điều kiện rồi thử lại.');
    qs = shuffleQuestions(qs);
    if (f.count) qs = qs.slice(0, f.count);
    begin(qs, { mode: 'custom', qids: qs.map((q) => q.qid), label: 'Luyện tuỳ chỉnh' });
  }), [begin, guarded, examState]);

  // Lưu chỗ đang làm sau mỗi thay đổi — app không có router nên F5, bản cập nhật
  // PWA, hay đóng tab đều đưa về trang chủ; đề 専門 35 câu mà mất phiên thì rất ức.
  // Khi ôn (run) lưu cả index; khi thi (mock) lưu đáp án + cờ xem lại + giờ bắt
  // đầu — đồng hồ TIẾP TỤC chạy lúc app đóng, đúng luật "không tạm dừng".
  useEffect(() => {
    if (reviewMode || !meta) return;
    if (screen === 'run') {
      commit((s) => saveSession(s, {
        ...meta, index, answers, total: questions.length, at: Date.now(),
      }));
    } else if (screen === 'mock') {
      commit((s) => saveSession(s, {
        ...meta, answers, flags: mockFlags, total: questions.length, at: Date.now(),
      }));
    }
  }, [screen, meta, index, answers, mockFlags, questions.length, commit, reviewMode]);

  // ---- THI THỬ (mock exam) ----------------------------------------------

  const startMock = useCallback((subject, yearSel, restore = null) => guarded(async () => {
    const candidates = EXAM_YEARS.filter((y) => (y.subjects[subject] ?? 0) > 0).map((y) => y.year);
    const year = yearSel === 'random'
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : Number(yearSel);
    const shard = await loadShard(year, subject);
    const list = [...shard.questions]
      .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0))
      .map((q) => ({ ...q, year: shard.year, subject: shard.subject }));
    setQuestions(list);
    setMeta({ mode: 'mock', subject, year, startedAt: restore?.startedAt ?? Date.now() });
    setAnswers(restore?.answers ?? {});
    setMockFlags(restore?.flags ?? {});
    setMockResult(null);
    setScreen('mock');
    window.scrollTo(0, 0);
  }), [guarded]);

  /** Chấm bài: MỘT commit gộp attempt + toàn bộ SRS + xoá phiên — không chấm đôi. */
  const submitMock = useCallback((reason) => {
    if (!meta || meta.mode !== 'mock' || mockResult) return;
    const now = Date.now();
    const graded = questions
      .filter((q) => answers[q.qid])
      .map((q) => ({ q, correct: isCorrect(q, answers[q.qid]) }));
    const correct = graded.filter((g) => g.correct).length;
    const { score, passed } = gradeExam(meta.subject, correct);
    const attempt = {
      id: `ex_${meta.startedAt}_${Math.random().toString(36).slice(2, 6)}`,
      mode: 'exam',
      subject: meta.subject,
      year: meta.year,
      startedAt: meta.startedAt,
      durationSec: Math.round((now - meta.startedAt) / 1000),
      answered: graded.length,
      correct,
      score,
      passed,
      reason,
    };
    commit((s0) => {
      let s = addAttempt(s0, attempt);
      for (const g of graded) s = recordExamAnswer(s, g.q.qid, g.correct, now, answers[g.q.qid]);
      return clearSession(s, now);
    });
    setMockResult({ attempt });
    setScreen('mock-result');
    window.scrollTo(0, 0);
  }, [meta, questions, answers, commit, mockResult]);

  const abandonMock = useCallback(() => {
    commit(clearSession);
    setMeta(null);
    setScreen('home');
    window.scrollTo(0, 0);
  }, [commit]);

  const resume = activeSession(examState);

  /** Mở lại phiên dở — phiên cũ (trước GĐ4) không có mode thì coi là theo năm. */
  const resumeSession = useCallback(() => {
    if (!resume) return;
    if (resume.mode === 'mock') {
      startMock(resume.subject, resume.year, resume);
    } else if (resume.qids?.length) {
      startQids(resume.qids, resume.mode ?? 'custom', resume.label ?? 'Làm tiếp', resume);
    } else {
      startYear(resume.year, resume.subjectFilter ?? 'all', resume);
    }
  }, [resume, startQids, startYear, startMock]);

  // Thang xếp hạng: derive thuần từ examState đã sync → hai máy tự khớp
  const rank = useMemo(() => computeRank(examState, BANK_TOTAL), [examState]);

  // Thăng BẬC LỚN (Đồng→Bạc→…): hiện màn chúc mừng một lần cho mỗi bậc.
  // Mốc "đã chúc mừng" lưu localStorage theo máy — acc 30 ngày sụt làm hạng
  // tạm rơi rồi leo lại thì không chúc mừng lại; lần đầu chạy bản mới thì ghi
  // nhận bậc hiện tại chứ không chúc (đã ở đó từ lâu rồi).
  const [rankUp, setRankUp] = useState(null);
  const tierIdx = (id) => TIERS.findIndex((t) => t.id === id);
  useEffect(() => {
    if (!rank?.tierId) return;
    const saved = loadString(KEYS.lastRankTier);
    if (!saved) {
      saveString(KEYS.lastRankTier, rank.tierId);
      return;
    }
    if (tierIdx(rank.tierId) > tierIdx(saved)) {
      setRankUp({ tierId: rank.tierId, tierName: rank.tier, label: rank.label });
      saveString(KEYS.lastRankTier, rank.tierId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rank?.tierId]);
  const rankUpModal = rankUp
    ? <RankUpModal {...rankUp} onClose={() => setRankUp(null)} />
    : null;

  // Mục tiêu ngày (ロン thích tính năng 今日の目標 của app trung tâm):
  // đích lưu trong prefs, tiến độ đếm từ nhật ký daily của hôm nay
  const goal = prefs.goal ?? 20;
  const todayCount = useMemo(() => {
    const p = (n) => String(n).padStart(2, '0');
    const d = new Date();
    const t = examState.daily?.[`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`];
    return (t?.r ?? 0) + (t?.w ?? 0);
  }, [examState]);

  // Sidebar điều thẳng vào màn con (Thống kê, Câu sai, Đánh dấu, khu Thi thử).
  // token đổi mỗi lần bấm để cùng một đích bấm lại vẫn ăn.
  const [pendingFocus, setPendingFocus] = useState(null);
  useEffect(() => {
    if (!sub?.token) return;
    if (sub.screen === 'stats') setScreen('stats');
    else if (sub.screen === 'browse') {
      setBrowseTab(sub.tab ?? 'recent');
      setScreen('browse');
    } else {
      setScreen('home');
      setPendingFocus(sub.focus ?? null);
    }
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub?.token]);

  // Cuộn tới khu thi thử NGAY SAU khi DOM dựng xong — không setTimeout (tab ẩn
  // bóp còn ≥1s), không behavior:smooth (chạy bằng rAF, đóng băng khi tab ẩn)
  useLayoutEffect(() => {
    if (screen !== 'home' || pendingFocus !== 'mock') return;
    document.querySelector('.qb-ecards')?.scrollIntoView();
    setPendingFocus(null);
  }, [screen, pendingFocus]);

  // Số câu đến hạn ôn SRS hôm nay — nuôi thẻ "Gợi ý"
  const dueCount = useMemo(() => {
    const now = Date.now();
    return Object.values(examState.srs).filter(
      (e) => (e.right ?? 0) + (e.wrong ?? 0) > 0 && !e.mastered && (e.nextReview ?? 0) <= now
    ).length;
  }, [examState]);
  const attemptList = useMemo(
    () => Object.values(examState.attempts ?? {})
      .filter((a) => a?.mode === 'exam')
      .sort((x, y) => (y.startedAt ?? 0) - (x.startedAt ?? 0)),
    [examState]
  );

  // Mốc "câu này hiện ra lúc nào" — nuôi phân tích thời gian trả lời của màn
  // Thống kê. Chỉ luồng luyện tập dùng (thi thử chấm gộp cuối giờ, không đo).
  const shownAtRef = useRef(Date.now());
  useEffect(() => {
    shownAtRef.current = Date.now();
  }, [index, questions]);

  const select = useCallback((q, letter) => {
    if (answers[q.qid]) return;
    setAnswers((a) => ({ ...a, [q.qid]: letter }));
    const sec = (Date.now() - shownAtRef.current) / 1000;
    commit((s) => recordExamAnswer(s, q.qid, isCorrect(q, letter), Date.now(), letter, sec));
  }, [answers, commit]);

  const go = useCallback((i) => {
    if (i < 0 || i >= questions.length) return;
    setIndex(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [questions.length]);

  const finish = useCallback(() => {
    commit(clearSession);
    setScreen('result');
    window.scrollTo({ top: 0 });
  }, [commit]);

  const exitRun = useCallback(() => {
    setScreen(runBack);
    window.scrollTo({ top: 0 });
  }, [runBack]);

  const result = useMemo(() => {
    const done = questions.filter((q) => answers[q.qid]);
    const right = done.filter((q) => isCorrect(q, answers[q.qid]));
    return { done: done.length, right: right.length, total: questions.length };
  }, [questions, answers]);

  if (loading) {
    return (
      <section className="qb-wrap container">
        <p className="qb-loading">Đang tải đề…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="qb-wrap container">
        <div className="section-header">
          <button type="button" className="back-btn" onClick={() => { setError(null); setScreen('home'); }}>
            <IconArrowLeft /> Quay lại
          </button>
          <h2>Không tải được đề</h2>
        </div>
        <p className="qb-note">{error}</p>
      </section>
    );
  }

  if (screen === 'browse') {
    return (
      <ReviewBrowser
        examState={examState}
        onOpen={openSingle}
        onBack={() => setScreen('home')}
        onPractice={() => { setScreen('home'); window.scrollTo(0, 0); }}
        initialTab={browseTab}
      />
    );
  }

  if (screen === 'catlist' && catView) {
    return (
      <>
        <CategoryList
          code={catView.code}
          subject={catView.subject}
          questions={catView.questions}
          examState={examState}
          onOpen={(i) => startFromCategory(catView.questions, i, CATEGORIES[catView.code]?.ja ?? catView.code)}
          onStart={startFromCategory}
          onBack={() => { setScreen(catView.from ?? 'home'); window.scrollTo(0, 0); }}
        />
        {rankUpModal}
      </>
    );
  }

  if (screen === 'stats') {
    return (
      <StatsView
        examState={examState}
        onBack={() => setScreen('home')}
        onOpenCategory={openCategory}
      />
    );
  }

  if (screen === 'mock') {
    return (
      <MockExam
        questions={questions}
        subject={meta.subject}
        startedAt={meta.startedAt}
        answers={answers}
        flags={mockFlags}
        prefs={prefs}
        onAnswer={(qid, letter) => setAnswers((a) => {
          const next = { ...a };
          if (letter === null) delete next[qid];
          else next[qid] = letter;
          return next;
        })}
        onFlag={(qid) => setMockFlags((f) => ({ ...f, [qid]: !f[qid] }))}
        onSubmit={submitMock}
        onAbandon={abandonMock}
      />
    );
  }

  if (screen === 'mock-result' && mockResult) {
    const a = mockResult.attempt;
    const rule = SUBJECT_META[a.subject];
    return (
      <section className="qb-wrap container">
        <div className="section-header">
          <button type="button" className="back-btn" onClick={() => { setMockResult(null); setScreen('home'); }}>
            <IconArrowLeft /> Quay lại
          </button>
          <h2>Kết quả thi thử</h2>
        </div>
        <div className={`qb-result qb-mock-verdict ${a.passed ? 'is-pass' : 'is-fail'}`}>
          <span className="qb-verdict-badge">{a.passed ? 'ĐỖ 合格' : 'TRƯỢT 不合格'}</span>
          <strong>{a.score} điểm</strong>
          <span>
            {a.correct}/{a.answered} câu đúng · <span className="jp-text">{rule?.ja}</span> đề {a.year} ·{' '}
            {Math.floor(a.durationSec / 60)} phút {a.durationSec % 60} giây · {a.reason}
          </span>
          <div className="qb-result-btns">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => { setReviewMode(true); setReviewReturn('mock-result'); setIndex(0); setScreen('run'); }}
            >
              Xem lại từng câu + lời giải
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setMockResult(null); setScreen('home'); }}>
              Về màn chọn đề
            </button>
          </div>
        </div>
        {rankUpModal}
      </section>
    );
  }

  if (screen === 'run') {
    return (
      <>
        <QuestionRunner
          questions={questions}
          index={index}
          answers={answers}
          examState={examState}
          prefs={{ ...prefs, set: setPref }}
          review={reviewMode}
          onSelect={reviewMode ? () => {} : select}
          onGo={go}
          onToggleBookmark={(qid) => commit((s) => toggleBookmark(s, qid))}
          onExit={reviewMode ? () => { setReviewMode(false); setScreen(reviewReturn); } : exitRun}
          onFinish={reviewMode ? () => { setReviewMode(false); setScreen(reviewReturn); } : finish}
        />
        {rankUpModal}
      </>
    );
  }

  if (screen === 'result') {
    const pct = result.done ? Math.round((result.right / result.done) * 100) : 0;
    return (
      <section className="qb-wrap container">
        <div className="section-header">
          <button type="button" className="back-btn" onClick={() => setScreen(runBack)}>
            <IconArrowLeft /> Quay lại
          </button>
          <h2>Kết quả</h2>
        </div>
        <div className="qb-result">
          <strong>{result.right}/{result.done}</strong>
          <span>
            đúng {pct}% · đã làm {result.done}/{result.total} câu ·{' '}
            {meta?.mode === 'year'
              ? <>{meta.year} {meta.subjectFilter !== 'all' && SUBJECT_META[meta.subjectFilter]?.ja}</>
              : meta?.label}
          </span>
          <div className="qb-result-btns">
            <button type="button" className="btn btn-primary" onClick={() => setScreen('home')}>
              Chọn đề khác
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => { setIndex(0); setScreen('run'); }}
            >
              Xem lại bài
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <PracticeHome
        subjectFilter={filter}
        onChangeFilter={setFilter}
        onOpenYear={(year) => startYear(year, filter)}
        onBack={onBack}
        statsOf={statsOf}
        resume={resume}
        onResume={resumeSession}
        onDropResume={() => commit(clearSession)}
        wrongCount={wrongPool.length}
        bookmarkCount={bookmarkQids.length}
        onStartWrong={startWrong}
        onStartBookmarks={startBookmarks}
        onOpenCustom={() => setCustomOpen(true)}
        rank={rank}
        attempts={attemptList}
        onStartMock={startMock}
        goal={goal}
        todayCount={todayCount}
        onSetGoal={(n) => setPref({ goal: n })}
        remind={Boolean(prefs.remind)}
        onToggleRemind={async () => {
          if (prefs.remind) { setPref({ remind: false }); return; }
          // xin quyền thông báo NGAY LÚC BẤM — đúng nhịp trình duyệt cho phép hỏi
          if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') return; // không có quyền thì đừng giả vờ bật
          }
          setPref({ remind: true });
        }}
        dueCount={dueCount}
        onStartSuggest={startSuggest}
        onStartRandom={startRandom}
        onStartNew={startNew}
        onOpenCategory={openCategory}
        onOpenBrowse={() => setScreen('browse')}
      />
      {customOpen && (
        <CustomPractice
          onClose={() => setCustomOpen(false)}
          onStart={startCustom}
          counts={{ wrong: wrongPool.length, bookmark: bookmarkQids.length }}
        />
      )}
      {rankUpModal}
    </>
  );
}
