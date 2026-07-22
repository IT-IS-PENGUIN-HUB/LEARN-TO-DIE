import { useEffect, useRef, useState } from 'react';
import { IconClock, IconPause, IconPlay, IconReset } from './icons.jsx';

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

function format(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function PomodoroTimer() {
  const [mode, setMode] = useState('work'); // 'work' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  // Hết giờ: đổi chế độ làm việc <-> nghỉ
  useEffect(() => {
    if (secondsLeft > 0) return;
    setMode((m) => {
      const next = m === 'work' ? 'break' : 'work';
      setSecondsLeft(next === 'work' ? WORK_SECONDS : BREAK_SECONDS);
      return next;
    });
  }, [secondsLeft]);

  const reset = () => {
    setRunning(false);
    setMode('work');
    setSecondsLeft(WORK_SECONDS);
  };

  return (
    <div className={`pomodoro${mode === 'break' ? ' break' : ''}`}>
      <h4 className="pomodoro-label">
        <IconClock /> {mode === 'work' ? 'Tập trung' : 'Giải lao'}
      </h4>
      <div className="pomodoro-time" role="timer" aria-live="off">
        {format(Math.max(0, secondsLeft))}
      </div>
      <div className="pomodoro-controls">
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setRunning((r) => !r)}>
          {running ? <IconPause /> : <IconPlay />} {running ? 'Dừng' : 'Bắt đầu'}
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={reset} aria-label="Đặt lại đồng hồ">
          <IconReset />
        </button>
      </div>
    </div>
  );
}
