import {StrictMode, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {AdminPanel} from './components/admin/AdminPanel';
import {LandingPage} from './components/LandingPage';
import {SiteLogin} from './components/SiteLogin';
import {LOGIN_REQUIRED_EVENT} from './lib/api';
import {usePage} from './lib/route';
import './index.css';

type Access = 'checking' | 'open' | 'login';

// / is the landing page, /app the tool, /admin the password-protected usage & health panel.
function Root() {
  const page = usePage();
  // Once opened, the workspace stays mounted (hidden on the landing page) so a visit home keeps the audit.
  const [workspaceOpened, setWorkspaceOpened] = useState(page === 'workspace');
  if (page === 'workspace' && !workspaceOpened) setWorkspaceOpened(true);

  // With APP_PASSWORD set on the server, the workspace needs a sign-in; the landing page stays public.
  const [access, setAccess] = useState<Access>('checking');
  useEffect(() => {
    fetch('/api/session', {credentials: 'same-origin'})
      .then((r) => r.json())
      .then((s) => setAccess(s.required && !s.ok ? 'login' : 'open'))
      .catch(() => setAccess('open')); // the API itself will still refuse if a sign-in is needed
    const onLoginRequired = () => setAccess('login');
    window.addEventListener(LOGIN_REQUIRED_EVENT, onLoginRequired);
    return () => window.removeEventListener(LOGIN_REQUIRED_EVENT, onLoginRequired);
  }, []);

  if (page === 'admin') return <AdminPanel />;
  const showLogin = page === 'workspace' && access === 'login';
  return (
    <>
      {page === 'landing' && <LandingPage />}
      {showLogin && <SiteLogin onSignedIn={() => setAccess('open')} />}
      {workspaceOpened && access !== 'checking' && (
        <div hidden={page !== 'workspace' || showLogin}>
          <App />
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
