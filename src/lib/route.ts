/**
 * The app's three pages: the landing page (/), the workspace (/app) and the admin panel (/admin).
 * Moving between the landing page and the workspace happens in the browser, without a reload.
 */
import { useEffect, useState } from 'react';

export type Page = 'landing' | 'workspace' | 'admin';

const EVENT = 'co-route-change';

export function pageFor(pathname: string): Page {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/admin') return 'admin';
  if (p === '/') return 'landing';
  return 'workspace';
}

export function navigate(path: string) {
  if (window.location.pathname !== path) window.history.pushState({}, '', path);
  window.scrollTo({ top: 0 });
  window.dispatchEvent(new Event(EVENT));
}

export function usePage(): Page {
  const [page, setPage] = useState<Page>(() => pageFor(window.location.pathname));
  useEffect(() => {
    const sync = () => setPage(pageFor(window.location.pathname));
    window.addEventListener('popstate', sync);
    window.addEventListener(EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);
  return page;
}
