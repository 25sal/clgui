import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'light' per user request
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('fedsim_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('fedsim_theme', mode);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.className = 'bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.className = 'bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900';
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
