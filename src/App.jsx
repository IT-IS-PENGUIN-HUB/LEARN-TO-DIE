import { useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import SubjectDashboard from './components/SubjectDashboard.jsx';
import ExamList from './components/ExamList.jsx';
import ExamView from './components/ExamView.jsx';
import Footer from './components/Footer.jsx';
import WordOfTheDay from './components/WordOfTheDay.jsx';
import VocabModal from './components/vocab/VocabModal.jsx';
import { VocabProvider } from './context/VocabProvider.jsx';
import { useTheme } from './hooks/useTheme.js';
import { useVocab } from './context/VocabProvider.jsx';

function AppInner() {
  const { theme, toggleTheme } = useTheme();
  const { dueTotal } = useVocab();
  // view: {name:'home'} | {name:'subject', subjectId} | {name:'exam', subjectId, examId}
  const [view, setView] = useState({ name: 'home' });
  const [vocabOpen, setVocabOpen] = useState(false);

  const goHome = () => setView({ name: 'home' });
  const openSubject = (subjectId) => setView({ name: 'subject', subjectId });
  const openExam = (subjectId, examId) => setView({ name: 'exam', subjectId, examId });
  // Mở modal từ vựng với môn đang xem (nếu đang trong màn đề thi)
  const currentSubject = view.name === 'home' ? 'kiso' : view.subjectId;

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectSubject={openSubject}
        onOpenVocab={() => setVocabOpen(true)}
        onOpenSettings={() => {}}
        dueCount={dueTotal}
      />

      {view.name === 'home' && (
        <>
          <Hero
            onStartPractice={() => {
              document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onStudyVocab={() => setVocabOpen(true)}
          />
          <section className="dashboard container" id="dashboard">
            <WordOfTheDay onOpenVocab={() => setVocabOpen(true)} />
            <SubjectDashboard onSelectSubject={openSubject} />
          </section>
        </>
      )}

      {view.name === 'subject' && (
        <ExamList subjectId={view.subjectId} onBack={goHome} onOpenExam={(examId) => openExam(view.subjectId, examId)} />
      )}

      {view.name === 'exam' && (
        <ExamView subjectId={view.subjectId} examId={view.examId} onBack={() => openSubject(view.subjectId)} />
      )}

      {vocabOpen && <VocabModal onClose={() => setVocabOpen(false)} initialSubject={currentSubject} />}

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
