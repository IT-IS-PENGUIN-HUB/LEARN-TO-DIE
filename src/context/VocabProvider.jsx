import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import seed from '../data/seed.json';
import { SUBJECT_IDS, migrateVocab } from '../lib/migrate.js';
import { applyAnswer, countDue } from '../lib/srs.js';
import { KEYS, loadJSON, saveJSON } from '../lib/storage.js';

const VocabContext = createContext(null);

function initVocab() {
  const stored = loadJSON(KEYS.vocab);
  // Máy mới chưa có dữ liệu → nạp 75 từ seed đóng gói sẵn
  return migrateVocab(stored ?? seed);
}

function mapEntry(state, subject, id, updater) {
  return {
    ...state,
    [subject]: state[subject].map((w) => (w.id === id ? updater(w) : w)),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const { subject, fields, now } = action;
      const entry = {
        id: `${now}`,
        jp: fields.jp.trim(),
        kana: (fields.kana ?? '').trim(),
        meaning: (fields.meaning ?? '').trim(),
        exJp: (fields.exJp ?? '').trim(),
        exVi: (fields.exVi ?? '').trim(),
        score: 0,
        nextReview: now,
        mastered: false,
        updatedAt: now,
      };
      return { ...state, [subject]: [...state[subject], entry] };
    }
    case 'update':
      return mapEntry(state, action.subject, action.id, (w) => ({ ...w, ...action.patch, updatedAt: action.now }));
    case 'answer':
      return mapEntry(state, action.subject, action.id, (w) => applyAnswer(w, action.correct, action.now));
    case 'setMastered':
      return mapEntry(state, action.subject, action.id, (w) => ({
        ...w,
        mastered: action.mastered,
        updatedAt: action.now,
      }));
    case 'replaceAll':
      return migrateVocab(action.vocab);
    default:
      return state;
  }
}

export function VocabProvider({ children }) {
  const [vocab, dispatch] = useReducer(reducer, null, initVocab);

  useEffect(() => {
    saveJSON(KEYS.vocab, vocab);
  }, [vocab]);

  const addWord = useCallback((subject, fields) => {
    if (!fields.jp?.trim()) return false;
    dispatch({ type: 'add', subject, fields, now: Date.now() });
    return true;
  }, []);

  const updateWord = useCallback((subject, id, patch) => {
    dispatch({ type: 'update', subject, id, patch, now: Date.now() });
  }, []);

  const answerWord = useCallback((subject, id, correct) => {
    dispatch({ type: 'answer', subject, id, correct, now: Date.now() });
  }, []);

  const setMastered = useCallback((subject, id, mastered) => {
    dispatch({ type: 'setMastered', subject, id, mastered, now: Date.now() });
  }, []);

  const replaceAll = useCallback((next) => {
    dispatch({ type: 'replaceAll', vocab: next });
  }, []);

  const value = useMemo(() => {
    const statsFor = (subject) => {
      const list = vocab[subject] ?? [];
      return {
        total: list.length,
        mastered: list.filter((w) => w.mastered).length,
        due: countDue(list),
      };
    };
    const allWords = SUBJECT_IDS.flatMap((s) => vocab[s].map((w) => ({ ...w, subject: s })));
    const dueTotal = countDue(allWords);
    return { vocab, addWord, updateWord, answerWord, setMastered, replaceAll, statsFor, allWords, dueTotal };
  }, [vocab, addWord, updateWord, answerWord, setMastered, replaceAll]);

  return <VocabContext.Provider value={value}>{children}</VocabContext.Provider>;
}

export function useVocab() {
  const ctx = useContext(VocabContext);
  if (!ctx) throw new Error('useVocab phải dùng bên trong VocabProvider');
  return ctx;
}
