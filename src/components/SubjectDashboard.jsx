import { SUBJECTS } from '../data/exams.js';
import { IconChip, IconCube, IconScale } from './icons.jsx';

const SUBJECT_ICONS = {
  kiso: IconCube,
  tekisei: IconScale,
  senmon: IconChip,
};

export default function SubjectDashboard({ onSelectSubject }) {
  return (
    <div className="card-grid">
      {Object.values(SUBJECTS).map((s) => {
        const Ico = SUBJECT_ICONS[s.id];
        return (
          <button
            key={s.id}
            type="button"
            className="subject-card"
            onClick={() => onSelectSubject(s.id)}
            aria-label={`${s.nameJp} — ${s.description}`}
          >
            <span className="card-icon">
              <Ico />
            </span>
            <h2>{s.nameJp}</h2>
            <p>{s.description}</p>
          </button>
        );
      })}
    </div>
  );
}
