'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/chat');
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // Create profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: username.toLowerCase(),
              full_name: fullName,
              avatar_url: null,
            });
          if (profileError) throw profileError;
        }

        alert('Check your email to confirm your account!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
            💬
          </div>
          <h1 className="text-3xl font-bold text-white">MyChat</h1>
          <p className="text-gray-400 mt-2">AI-powered private messaging</p>
        </div>

        {/* Form */}
        <div className="bg-dark-200 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-400 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required={!isLogin}
                    className="w-full bg-dark-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-white"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required={!isLogin}
                    className="w-full bg-dark-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-white"
                    placeholder="@username"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-dark-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-white"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-dark-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-400">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
