import { IconLayers, IconPlay } from './icons.jsx';

export default function Hero({ onStartPractice, onStudyVocab }) {
  return (
    <section className="hero">
      <h1 className="headline">LEARN TO DIE</h1>
      <p className="subtext">Repeat until you remember. No shortcuts.</p>
      <div className="hero-cta">
        <button type="button" className="btn btn-primary" onClick={onStartPractice}>
          <IconPlay /> Luyện đề
        </button>
        <button type="button" className="btn btn-outline" onClick={onStudyVocab}>
          <IconLayers /> Học từ vựng
        </button>
      </div>
    </section>
  );
}
