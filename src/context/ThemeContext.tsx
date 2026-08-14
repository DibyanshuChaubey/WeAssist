import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';

export type AppTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'weassist-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    document.body.classList.toggle('theme-dark', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className={
        compact
          ? 'inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white/70 text-slate-700 shadow-sm transition-all duration-200 hover:bg-white hover:text-slate-900 dark-mode-button'
          : 'inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/75 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-white hover:text-slate-900 dark-mode-button'
      }
    >
      {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
      {!compact && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
    </button>
  );
};
