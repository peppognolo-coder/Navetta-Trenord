import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'navetta_theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage non disponibile — si prosegue con la preferenza di sistema
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

/**
 * Tema chiaro/scuro dell'app. Applica/rimuove la classe "dark" su <html>,
 * da cui dipendono tutte le varianti dark: di Tailwind (darkMode: 'class'
 * in tailwind.config.ts). Persistito in localStorage. Stesso pattern di
 * Supremi Advisor — solo la chiave di storage cambia.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage non disponibile: il tema resta valido solo per questa sessione
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
}
