'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { email, password, name } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      const params = new URLSearchParams(window.location.search);
      const nameParam = params.get('name');
      const promptParam = params.get('prompt');
      
      const dashboardUrl = new URL('/dashboard', window.location.origin);
      if (nameParam) dashboardUrl.searchParams.set('name', nameParam);
      if (promptParam) dashboardUrl.searchParams.set('prompt', promptParam);

      router.push(dashboardUrl.pathname + dashboardUrl.search);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] items-center justify-center p-4 font-sans">
      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-5 h-5 bg-[#111111] text-white dark:bg-[#F3F4F6] dark:text-[#111111] text-[10px] font-bold flex items-center justify-center">O</div>
        <span className="font-bold text-[var(--text-primary)] text-[18px] tracking-tight">OneAtlas</span>
      </Link>

      <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] shadow-soft p-[28px]">
        
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)] mb-2">
            {isRegister ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)]">
            {isRegister ? 'Start building internal tools.' : 'Sign in to your workspace.'}
          </p>
        </div>

        {error && (
          <div className="border border-[#FCA5A5] bg-[#FEF2F2] text-[#DC2626] text-[15px] px-4 py-3 rounded-[12px] mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[12px] font-semibold text-[var(--text-primary)] mb-1.5 uppercase tracking-[0.08em]">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--text-primary)] rounded-[12px] px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-[var(--text-primary)] mb-1.5 uppercase tracking-[0.08em]">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              required
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--text-primary)] rounded-[12px] px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[var(--text-primary)] mb-1.5 uppercase tracking-[0.08em]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--text-primary)] rounded-[12px] px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[15px] font-semibold rounded-[12px] transition-transform hover:-translate-y-px mt-4 disabled:opacity-50 disabled:transform-none"
          >
            {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
          <p className="text-[15px] text-[var(--text-secondary)]">
            {isRegister ? 'Already have an account?' : 'New to OneAtlas?'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="ml-2 font-medium text-[var(--text-primary)] hover:underline"
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
