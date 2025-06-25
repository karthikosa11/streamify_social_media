import { createContext, useContext, useState, useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { theme, setTheme } = useThemeStore();

  const value = {
    theme,
    setTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 