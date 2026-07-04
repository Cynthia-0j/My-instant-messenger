"use client";

import { useEffect } from 'react';
import { DEFAULT_THEME_COLOR, generateThemeFromColor } from '../../lib/theme';
import { getCookie } from '../../lib/cookies';

const applyTheme = (themeColor: string) => {
  const theme = generateThemeFromColor(themeColor);
  const root = document.documentElement;

  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-secondary', theme.secondary);
  root.style.setProperty('--theme-surface', theme.surface);
  root.style.setProperty('--theme-background', theme.background);
  root.style.setProperty('--theme-text', theme.text);
};

export default function ThemeProvider() {
  useEffect(() => {
    const storedTheme = getCookie('theme_color');
    applyTheme(storedTheme || DEFAULT_THEME_COLOR);
  }, []);

  return null;
}
