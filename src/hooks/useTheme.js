import { useEffect, useState } from 'react';
import { KEYS, loadString, saveString } from '../lib/storage.js';

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = loadString(KEYS.theme);
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveString(KEYS.theme, theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#0f172a' : '#ffffff';
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, toggleTheme };
}
