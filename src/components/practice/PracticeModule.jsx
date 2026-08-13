import { useCallback, useEffect, useMemo, useState } from 'react';
import PracticeHome from './PracticeHome.jsx';
import QuestionRunner from './QuestionRunner.jsx';
import { EXAM_YEARS, SUBJECT_META } from '../../data/examBank.js';
import { loadYear, isCorrect } from '../../lib/examData.js';
import {
  loadExamState, saveExamState, recordExamAnswer, toggleBookmark,
  statsFor, saveSession, clearSession, activeSession, EXAM_EVENT,
} from '../../lib/examState.js';
import { KEYS, loadJSON, saveJSON } from '../../lib/storage.js';
import { IconArrowLeft } from '../icons.jsx';

const SUBJECT_ORDER = ['KENSETSU', 'KISO', 'TEKISEI'];
const DEFAULT_PREFS = { lang: 'both', furi: true, size: 'm' };

/**
 * Module Đề thi — tự quản 3 màn con (chọn đề → làm bài → kết quả) bằng state
 * nội bộ, để App.jsx chỉ phải thêm ĐÚNG MỘT view name. Đổi lại, view 'practice'
 * BẮT BUỘC nằm trong biểu thức `busy` của App.jsx, nếu không service worker sẽ
 * tải lại trang giữa lúc đang làm đề và mất sạch phiên (đúng lỗi cũ của quiz).
 */
export default function PracticeModule({ onBack }) {
  const [examState, setExamState] = useState(loadExamState);
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...loadJSON(KEYS.examPrefs, {}) }));
  const [filter, setFilter] = useState('all');
  const [screen, setScreen] = useState('home'); // home | run | result
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [meta, setMeta] = useState(null); // {year, subjectFilter}
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
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(EXAM_EVENT, refresh);
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

  const startYear = useCallback(async (year, subjectFilter, restore = null) => {
    const subjects = subjectFilter === 'all' ? SUBJECT_ORDER : [subjectFilter];
    setLoading(true);
    setError(null);
    try {
      const list = await loadYear(year, subjects.filter((s) => {
        const y = EXAM_YEARS.find((e) => e.year === year);
        return (y?.subjects[s] ?? 0) > 0;
      }));
      setQuestions(list);
      setMeta({ year, subjectFilter });
      setAnswers(restore?.answers ?? {});
      setIndex(Math.min(restore?.index ?? 0, Math.max(0, list.length - 1)));
      setScreen('run');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Lưu chỗ đang làm sau mỗi thay đổi — app không có router nên F5, bản cập nhật
  // PWA, hay đóng tab đều đưa về trang chủ; đề 専門 35 câu mà mất phiên thì rất ức.
  useEffect(() => {
    if (screen !== 'run' || !meta) return;
    commit((s) => saveSession(s, {
      ...meta, index, answers, total: questions.length, at: Date.now(),
    }));
  }, [screen, meta, index, answers, questions.length, commit]);

  const resume = activeSession(examState);

  const select = useCallback((q, letter) => {
    if (answers[q.qid]) return;
    setAnswers((a) => ({ ...a, [q.qid]: letter }));
    commit((s) => recordExamAnswer(s, q.qid, isCorrect(q, letter)));
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
    setScreen('home');
    window.scrollTo({ top: 0 });
  }, []);

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

  if (screen === 'run') {
    return (
      <QuestionRunner
        questions={questions}
        index={index}
        answers={answers}
        examState={examState}
        prefs={{ ...prefs, set: setPref }}
        onSelect={select}
        onGo={go}
        onToggleBookmark={(qid) => commit((s) => toggleBookmark(s, qid))}
        onExit={exitRun}
        onFinish={finish}
      />
    );
  }

  if (screen === 'result') {
    const pct = result.done ? Math.round((result.right / result.done) * 100) : 0;
    return (
      <section className="qb-wrap container">
        <div className="section-header">
          <button type="button" className="back-btn" onClick={() => setScreen('home')}>
            <IconArrowLeft /> Quay lại
          </button>
          <h2>Kết quả</h2>
        </div>
        <div className="qb-result">
          <strong>{result.right}/{result.done}</strong>
          <span>
            đúng {pct}% · đã làm {result.done}/{result.total} câu ·{' '}
            {meta?.year} {meta?.subjectFilter !== 'all' && SUBJECT_META[meta?.subjectFilter]?.ja}
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
    <PracticeHome
      subjectFilter={filter}
      onChangeFilter={setFilter}
      onOpenYear={(year) => startYear(year, filter)}
      onBack={onBack}
      statsOf={statsOf}
      resume={resume}
      onResume={() => startYear(resume.year, resume.subjectFilter, resume)}
      onDropResume={() => commit(clearSession)}
    />
  );
}
