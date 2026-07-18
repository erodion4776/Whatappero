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
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          router.push('/chat');
        }
      } else {
        // Check username not taken
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username.toLowerCase())
          .single();

        if (existingUser) {
          throw new Error('Username already taken. Choose another.');
        }

        // Sign up with Supabase auth
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (data.user) {
          // Insert profile manually
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: username.toLowerCase().trim(),
              full_name: fullName.trim(),
              avatar_url: null,
              is_bot: false,
            });

          if (profileError) throw profileError;

          setSuccess('Account created! Check your email to confirm then sign in.');
          setIsLogin(true);
        }
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

        {/* Form Card */}
        <div className="bg-dark-200 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-6">
            {isLogin ? 'Welcome back 👋' : 'Create your account'}
          </h2>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-400 rounded-lg p-3 mb-4 text-sm">
              ❌ {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="bg-green-900/30 border border-green-500 text-green-400 rounded-lg p-3 mb-4 text-sm">
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Sign up only fields */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="w-full bg-dark-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                      required
                      className="w-full bg-dark-300 rounded-lg pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                      placeholder="username"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Friends will add you by this username
                  </p>
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
                className="w-full bg-dark-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
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
                minLength={6}
                className="w-full bg-dark-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-white placeholder-gray-500"
                placeholder="Min 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? 'Please wait...'
                : isLogin
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-400 text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? 'Sign up free' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-600 mt-6">
          🤖 Powered by Luna AI • Free forever
        </p>
      </div>
    </div>
  );
}
