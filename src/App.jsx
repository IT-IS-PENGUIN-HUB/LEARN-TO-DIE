import { useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import SubjectDashboard from './components/SubjectDashboard.jsx';
import ExamList from './components/ExamList.jsx';
import ExamView from './components/ExamView.jsx';
import Footer from './components/Footer.jsx';
import { useTheme } from './hooks/useTheme.js';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  // view: {name:'home'} | {name:'subject', subjectId} | {name:'exam', subjectId, examId}
  const [view, setView] = useState({ name: 'home' });

  const goHome = () => setView({ name: 'home' });
  const openSubject = (subjectId) => setView({ name: 'subject', subjectId });
  const openExam = (subjectId, examId) => setView({ name: 'exam', subjectId, examId });

  return (
    <>
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onSelectSubject={openSubject}
        onOpenVocab={() => {}}
        onOpenSettings={() => {}}
      />

      {view.name === 'home' && (
        <>
          <Hero
            onStartPractice={() => {
              document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onStudyVocab={() => {}}
          />
          <section className="dashboard container" id="dashboard">
            <SubjectDashboard onSelectSubject={openSubject} />
          </section>
        </>
      )}

      {view.name === 'subject' && (
        <ExamList subjectId={view.subjectId} onBack={goHome} onOpenExam={(examId) => openExam(view.subjectId, examId)} />
      )}

      {view.name === 'exam' && (
        <ExamView
          subjectId={view.subjectId}
          examId={view.examId}
          onBack={() => openSubject(view.subjectId)}
        />
      )}

      <Footer />
    </>
  );
}
