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

      // Check search parameters to carry over prompt and name
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
    <div className="flex min-h-screen bg-[#FAFBFF] items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-gradient-to-bl from-[#635BFF]/10 to-transparent rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-tr from-[#FF5996]/10 to-transparent rounded-full blur-[100px]"></div>
      </div>

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#635BFF] flex items-center justify-center shadow-sm">
          <span className="font-bold text-white text-sm">O</span>
        </div>
        <span className="font-bold text-[#0A2540] text-lg tracking-tight">OneAtlas</span>
      </Link>

      <div className="relative w-full max-w-md bg-white border border-[#E3E8EE] rounded-2xl shadow-xl p-8 overflow-hidden z-10">
        
        {/* Top Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0A2540] tracking-tight">
            {isRegister ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-[#697386] mt-2">
            {isRegister ? 'Start building your internal tools today.' : 'Sign in to access your workspaces.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-[#425466] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full bg-[#FAFBFF] border border-[#E3E8EE] hover:border-[#635BFF]/50 focus:border-[#635BFF] rounded-lg px-4 py-2.5 text-[#0A2540] placeholder:text-[#697386] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#425466] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              required
              className="w-full bg-[#FAFBFF] border border-[#E3E8EE] hover:border-[#635BFF]/50 focus:border-[#635BFF] rounded-lg px-4 py-2.5 text-[#0A2540] placeholder:text-[#697386] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#425466] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#FAFBFF] border border-[#E3E8EE] hover:border-[#635BFF]/50 focus:border-[#635BFF] rounded-lg px-4 py-2.5 text-[#0A2540] placeholder:text-[#697386] focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#635BFF] hover:bg-[#5249E5] text-white font-medium py-2.5 px-4 rounded-lg transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[#E3E8EE] pt-6">
          <p className="text-[#697386] text-sm">
            {isRegister ? 'Already have an account?' : 'New to OneAtlas?'}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="ml-2 font-semibold text-[#635BFF] hover:text-[#0A2540] transition-colors"
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
