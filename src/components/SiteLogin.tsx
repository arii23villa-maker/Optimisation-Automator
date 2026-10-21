import React, { useState } from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { navigate } from '../lib/route';

/** Sign-in for the workspace when the server has APP_PASSWORD set (the landing page stays public). */
export function SiteLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) onSignedIn();
      else setError(data.error || 'Could not sign in.');
    } catch {
      setError('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
        <div className="brand-mark mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-white">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-semibold text-slate-100">Sign in to Content Optimizer</h1>
        <p className="mt-1 text-[13px] text-slate-400">Ask the owner of this site for the password.</p>
        <label className="mt-5 block text-[12px] font-medium text-slate-400" htmlFor="site-password">Password</label>
        <input
          id="site-password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
        />
        {error && <p role="alert" className="mt-2 text-[13px] text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'} <ArrowRight className="h-4 w-4" />
        </button>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="mt-4 block text-center text-[12px] text-slate-500 hover:text-slate-300"
        >
          Back to the overview
        </a>
      </form>
    </div>
  );
}
