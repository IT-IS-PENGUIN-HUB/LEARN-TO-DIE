import { lazy, Suspense, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import Hero from './components/Hero.jsx';
import SubjectDashboard from './components/SubjectDashboard.jsx';
import ExamList from './components/ExamList.jsx';
import ExamView from './components/ExamView.jsx';
import ModuleShortcuts from './components/ModuleShortcuts.jsx';
import ScheduleView from './components/ScheduleView.jsx';
import TextbookLibrary from './components/textbook/TextbookLibrary.jsx';
import TextbookReader from './components/textbook/TextbookReader.jsx';
import Footer from './components/Footer.jsx';
import WordOfTheDay from './components/WordOfTheDay.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import VocabModal from './components/vocab/VocabModal.jsx';
import BackupPanel from './components/vocab/BackupPanel.jsx';
import { VocabProvider, useVocab } from './context/VocabProvider.jsx';
import { useTheme } from './hooks/useTheme.js';
import { useSync } from './hooks/useSync.js';
import { useVocabReminder } from './hooks/useVocabReminder.js';
import { applyAppUpdate, onUpdateReady } from './services/appUpdate.js';
import { recordAnswer } from './lib/stats.js';

// Module Đề thi kéo theo 1189 câu dữ liệu → tách chunk như PdfViewer, trang chủ giữ nhẹ
const PracticeModule = lazy(() => import('./components/practice/PracticeModule.jsx'));

function AppInner() {
  const { theme, toggleTheme } = useTheme();
  const { dueTotal, allWords } = useVocab();
  const sync = useSync();
  useVocabReminder(allWords);
  // view: {name:'home'} | {name:'subject', subjectId} | {name:'exam', subjectId, examId}
  //     | {name:'textbook', subjectId?, chapterId?} | {name:'schedule'} | {name:'practice'}
  const [view, setView] = useState({ name: 'home' });
  const [vocabOpen, setVocabOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Ôn từ vựng giới hạn trong một chương giáo trình: {subject, words, label}
  const [vocabFilter, setVocabFilter] = useState(null);
  // Tăng mỗi lần đóng modal luyện tập để StatsPanel đọc lại nhật ký
  const [statsToken, setStatsToken] = useState(0);

  // Có bản mới đang chờ (service worker đã tải xong)
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => onUpdateReady(() => setUpdateReady(true)), []);

  /**
   * Áp dụng bản mới = tải lại trang, nên chỉ làm khi đang không dở việc gì:
   * đang quiz thì mất phiên, đang đọc PDF thì mất chỗ đang xem. Ở trang chủ /
   * danh sách đề thì tải lại chẳng mất gì.
   */
  // 'practice' PHẢI có mặt ở đây: đang làm dở đề mà service worker tải lại trang
  // là mất phiên, đúng cái lỗi từng gặp với quiz từ vựng.
  const busy =
    vocabOpen || settingsOpen ||
    view.name === 'exam' || view.name === 'textbook' || view.name === 'practice';
  useEffect(() => {
    if (updateReady && !busy) applyAppUpdate();
  }, [updateReady, busy]);

  // Nhắc ôn trên desktop khi mở app (chỉ khi user đã cấp quyền thông báo)
  useEffect(() => {
    if (dueTotal > 0 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const timer = setTimeout(() => {
        new Notification('LEARN TO DIE', {
          body: `Hôm nay có ${dueTotal} từ cần ôn. Vào quiz thôi! 📚`,
          tag: 'ltd-due-reminder',
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goHome = () => setView({ name: 'home' });
  const openSubject = (subjectId) => setView({ name: 'subject', subjectId });
  const openExam = (subjectId, examId) => setView({ name: 'exam', subjectId, examId });
  const openTextbooks = () => setView({ name: 'textbook' });
  const openTextbookSubject = (subjectId) => setView({ name: 'textbook', subjectId });
  const openChapter = (subjectId, chapterId) => setView({ name: 'textbook', subjectId, chapterId });
  const openSchedule = () => setView({ name: 'schedule' });
  const openPractice = () => setView({ name: 'practice' });
  // Mọi lối vào thường: ôn trộn toàn bộ kho từ. Chỉ nút trong chương giáo trình mới lọc.
  const openVocab = () => {
    setVocabFilter(null);
    setVocabOpen(true);
  };
  // Mở modal từ vựng với môn đang xem (nếu đang trong màn đề thi / giáo trình)
  const currentSubject = view.subjectId ?? 'kiso';

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectSubject={openSubject}
        onOpenVocab={openVocab}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTextbooks={openTextbooks}
        onOpenSchedule={openSchedule}
        onGoHome={goHome}
        dueCount={dueTotal}
      />

      {view.name === 'home' && (
        <>
          <Hero onStartPractice={openPractice} onStudyVocab={openVocab} />
          <section className="dashboard container" id="dashboard">
            {/* Từ hôm nay liếc mỗi ngày → trên cùng; kế đến lối tắt hay bấm;
               3 thẻ môn xuống dưới. Điện thoại có thứ tự riêng bằng CSS order. */}
            <WordOfTheDay onOpenVocab={openVocab} />
            <ModuleShortcuts
              onOpenTextbooks={openTextbooks}
              onOpenSchedule={openSchedule}
              onResume={openChapter}
              onOpenPractice={openPractice}
            />
            <SubjectDashboard onSelectSubject={openSubject} />
            <div className="stats-slot">
              <StatsPanel refreshToken={statsToken} />
            </div>
          </section>
        </>
      )}

      {view.name === 'subject' && (
        <ExamList subjectId={view.subjectId} onBack={goHome} onOpenExam={(examId) => openExam(view.subjectId, examId)} />
      )}

      {view.name === 'exam' && (
        <ExamView subjectId={view.subjectId} examId={view.examId} onBack={() => openSubject(view.subjectId)} />
      )}

      {view.name === 'textbook' && !view.chapterId && (
        <TextbookLibrary
          subjectId={view.subjectId}
          onBack={view.subjectId ? openTextbooks : goHome}
          onOpenSubject={openTextbookSubject}
          onOpenChapter={(chapterId) => openChapter(view.subjectId, chapterId)}
        />
      )}

      {view.name === 'textbook' && view.chapterId && (
        <TextbookReader
          subjectId={view.subjectId}
          chapterId={view.chapterId}
          onBack={() => openTextbookSubject(view.subjectId)}
          onOpenChapter={(chapterId) => openChapter(view.subjectId, chapterId)}
          onReviewChapterVocab={(subject, words, label) => {
            setVocabFilter({ subject, words, label });
            setVocabOpen(true);
          }}
        />
      )}

      {view.name === 'practice' && (
        <Suspense fallback={<p className="qb-loading container">Đang mở kho đề…</p>}>
          <PracticeModule onBack={goHome} />
        </Suspense>
      )}

      {view.name === 'schedule' && <ScheduleView onBack={goHome} />}

      {vocabOpen && (
        <VocabModal
          onClose={() => {
            setVocabOpen(false);
            setVocabFilter(null);
            setStatsToken((t) => t + 1);
          }}
          initialSubject={currentSubject}
          backupSlot={<BackupPanel sync={sync} />}
          onRecordAnswer={recordAnswer}
          filter={vocabFilter}
          onClearFilter={() => setVocabFilter(null)}
        />
      )}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} sync={sync} />}

      {/* Nói trước để lát nữa app tải lại không thành cú giật mình. Kèm nút áp
          ngay — ロン phản hồi 14/8: đợi tự cập nhật thì không biết bao giờ mới
          thấy bản mới. Phiên làm đề/chỗ đọc giáo trình đều tự lưu nên bấm giữa
          chừng không mất gì; chỉ phiên quiz TỪ VỰNG đang dở là mất. */}
      {updateReady && busy && (
        <div className="update-toast" role="status">
          <span>Có bản mới của app</span>
          <button type="button" className="btn btn-sm btn-primary" onClick={applyAppUpdate}>
            Cập nhật ngay
          </button>
        </div>
      )}

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <VocabProvider>
      <AppInner />
    </VocabProvider>
  );
}
