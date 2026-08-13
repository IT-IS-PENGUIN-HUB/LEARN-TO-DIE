import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, SUBJECT_META, diagramUrl } from '../../data/examBank.js';
import { EXAM_RULES, maxAnswers } from '../../data/examRules.js';
import { LETTERS } from '../../lib/examData.js';

/**
 * Màn LÀM BÀI thi thử — mô phỏng đúng quy chế: đếm ngược, không tạm dừng,
 * KHÔNG hiện đúng/sai trong lúc làm, được đổi/bỏ đáp án, và giới hạn số câu
 * trả lời đúng như thi thật (専門 chọn 25/35, 基礎 mỗi nhóm 3 câu).
 * Nộp bài / hết giờ mới chấm — phần chấm nằm ở PracticeModule.
 */
export default function MockExam({
  questions, subject, startedAt, answers, flags, prefs,
  onAnswer, onFlag, onSubmit, onAbandon,
}) {
  const rule = EXAM_RULES[subject];
  const limit = maxAnswers(subject, questions.length);
  const [index, setIndex] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);
  const deadline = startedAt + rule.minutes * 60 * 1000;
  const [now, setNow] = useState(Date.now());
  const { lang, furi, size } = prefs;

  // Đồng hồ: tick mỗi giây; hết giờ tự nộp — thi thật không ai đợi mình
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remain = Math.max(0, deadline - now);
  useEffect(() => {
    if (remain === 0) onSubmit('hết giờ');
  }, [remain, onSubmit]);

  const answeredCount = Object.keys(answers).length;
  const perGroup = useMemo(() => {
    if (!rule.perGroupPick) return null;
    const m = {};
    for (const q of questions) {
      if (answers[q.qid]) m[q.cat] = (m[q.cat] ?? 0) + 1;
    }
    return m;
  }, [answers, questions, rule.perGroupPick]);

  const say = (text) => {
    setNotice(text);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3200);
  };

  const q = questions[index];
  if (!q) return null;
  const picked = answers[q.qid] ?? null;
  const flagged = Boolean(flags[q.qid]);
  const showJa = lang !== 'vi';
  const showVi = lang !== 'ja';

  const select = (letter) => {
    if (picked === letter) {
      onAnswer(q.qid, null); // bấm lại chính nó = bỏ chọn, trả quota
      return;
    }
    if (!picked) {
      // câu MỚI — soát quota trước khi nhận
      if (answeredCount >= limit) {
        say(`Chỉ được trả lời ${limit} câu — bỏ chọn một câu khác trước đã.`);
        return;
      }
      if (rule.perGroupPick && (perGroup[q.cat] ?? 0) >= rule.perGroupPick) {
        say(`Nhóm ${CATEGORIES[q.cat]?.ja ?? q.cat} chỉ được chọn ${rule.perGroupPick} câu.`);
        return;
      }
    }
    onAnswer(q.qid, letter);
  };

  const mm = String(Math.floor(remain / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, '0');
  const hh = Math.floor(remain / 3600000);
  const clock = hh > 0 ? `${hh}:${String(Math.floor((remain % 3600000) / 60000)).padStart(2, '0')}:${ss}` : `${mm}:${ss}`;
  const low = remain < 5 * 60 * 1000;

  return (
    <div className={`qb-run qb-size-${size}`}>
      <div className="qb-topbar qb-mock-bar">
        <div className="qb-crumb">
          <strong className="jp-text">模擬試験 · {SUBJECT_META[subject]?.ja}</strong>
          <span className="qb-chips">
            <span className="qb-chip is-year">{q.year}</span>
            <span className="qb-chip jp-text">第{q.qn}問</span>
            <span className="qb-chip">{answeredCount}/{limit} câu đã trả lời</span>
          </span>
        </div>
        <div className="qb-tools">
          <span className={`qb-timer${low ? ' is-low' : ''}`} aria-live="polite">{clock}</span>
          <button type="button" className="qb-icon" onClick={() => setShowNav((v) => !v)}
            aria-expanded={showNav} title="Bảng câu hỏi">▤</button>
          <button type="button" className={`qb-icon${flagged ? ' is-on' : ''}`}
            onClick={() => onFlag(q.qid)} aria-pressed={flagged} title="Đánh dấu xem lại">⚑</button>
        </div>
      </div>

      {showNav && (
        <div className="qb-mock-nav" role="navigation" aria-label="Chuyển nhanh giữa các câu">
          {questions.map((item, i) => {
            const cls = ['qb-mock-cell'];
            if (i === index) cls.push('is-cur');
            if (answers[item.qid]) cls.push('is-done');
            if (flags[item.qid]) cls.push('is-flag');
            return (
              <button key={item.qid} type="button" className={cls.join(' ')}
                onClick={() => { setIndex(i); setShowNav(false); window.scrollTo(0, 0); }}>
                {i + 1}
              </button>
            );
          })}
        </div>
      )}

      {notice && <p className="qb-note qb-mock-notice" role="alert">{notice}</p>}

      <div className="qb-body">
        <div className="qb-card">
          {showJa && (
            <p className="qb-ja" lang="ja">{q.qJa}</p>
          )}
          {showVi && q.qVi && <p className="qb-vi">{q.qVi}</p>}
          {q.dQ?.length > 0 && (
            <div className="qb-figs">
              {q.dQ.map((n) => (
                <figure key={n} className="qb-fig">
                  <figcaption>図 / Hình đề gốc</figcaption>
                  <span className="qb-fig-img"><img src={diagramUrl(n)} alt="Hình đề" loading="lazy" /></span>
                </figure>
              ))}
            </div>
          )}
        </div>

        <div className="qb-opts">
          {q.oJa.map((text, i) => {
            const letter = LETTERS[i];
            const isPick = picked === letter;
            return (
              <button key={letter} type="button"
                className={`qb-opt${isPick ? ' is-pick' : ''}`}
                onClick={() => select(letter)}>
                <span className="qb-key">{letter}</span>
                <span className="qb-opt-text">
                  {showJa && <span className="qb-ja" lang="ja">{text}</span>}
                  {showVi && q.oVi[i] && q.oVi[i] !== text && <span className="qb-vi">{q.oVi[i]}</span>}
                </span>
                {isPick && <span className="qb-tag">Đã chọn — bấm lại để bỏ</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="qb-actions">
        <button type="button" className="btn btn-outline" disabled={index === 0}
          onClick={() => { setIndex(index - 1); window.scrollTo(0, 0); }}>←</button>
        <button type="button" className="btn btn-outline" onClick={onAbandon}>Bỏ bài</button>
        <span className="qb-count">{index + 1}/{questions.length}</span>
        <button type="button" className="btn btn-success" onClick={() => onSubmit('tự nộp')}>
          Nộp bài
        </button>
        <button type="button" className="btn btn-primary" disabled={index === questions.length - 1}
          onClick={() => { setIndex(index + 1); window.scrollTo(0, 0); }}>→</button>
      </div>
    </div>
  );
}
