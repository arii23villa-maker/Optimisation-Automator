/**
 * Light/dark theme shared by the landing page and the workspace. The theme lives on <html data-theme>
 * (set before first paint by index.html) and is remembered per browser.
 */
import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const EVENT = 'co-theme-change';

export const currentTheme = (): ThemeMode =>
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

export function setTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('co-theme', theme);
  } catch {
    /* storage may be unavailable */
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The current theme and a toggle; every component using it stays in sync. */
export function useTheme(): [ThemeMode, () => void] {
  const [theme, setState] = useState<ThemeMode>(currentTheme);
  useEffect(() => {
    const sync = () => setState(currentTheme());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return [theme, () => setTheme(theme === 'light' ? 'dark' : 'light')];
}
