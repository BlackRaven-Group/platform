import { useState } from 'react';
import { Lock, User, LogIn, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { checkRateLimit, resetRateLimit } from '../lib/ratelimit';

interface AuthScreenProps {
  onAuthenticated: () => void;
  onBack?: () => void;
}

export default function AuthScreen({ onAuthenticated, onBack }: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const rateLimit = checkRateLimit(username);
    if (!rateLimit.allowed) {
      setError(`RATE LIMIT EXCEEDED - Try again in ${rateLimit.resetIn}s`);
      setLoading(false);
      setAttempts(MAX_ATTEMPTS);
      return;
    }

    const email = username.includes('@') ? username : `${username}@k3pr0s.local`;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setAttempts(prev => prev + 1);
      if (attempts + 1 >= MAX_ATTEMPTS) {
        setError('MAXIMUM ATTEMPTS EXCEEDED - ACCESS DENIED');
      } else {
        setError('INVALID CREDENTIALS');
      }
      setLoading(false);
    } else {
      resetRateLimit(username);
      onAuthenticated();
    }
  };



  if (attempts >= MAX_ATTEMPTS) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-mono flex items-center justify-center">
        <div className="scanline"></div>
        <div className="max-w-md w-full mx-4">
          <div className="terminal-box border-red-500 bg-red-950/20">
            <div className="text-center">
              <div className="text-6xl text-red-500 mb-4">⚠</div>
              <div className="text-2xl font-bold text-red-500 mb-4">[ACCESS_DENIED]</div>
              <div className="text-red-400 text-sm">
                {'>'} Maximum authentication attempts exceeded<br />
                {'>'} System access has been restricted<br />
                {'>'} Contact administrator
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono flex items-center justify-center">
      <div className="scanline"></div>

      <div className="max-w-md w-full mx-4">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">RETOUR</span>
          </button>
        )}

        <div className="text-center mb-8">
          <img
            src="/removal-190.png"
            alt="BlackRaven"
            className="w-20 h-20 mx-auto mb-4 opacity-90"
          />
          <h1 className="text-4xl font-bold text-white tracking-wider glitch mb-2" data-text="BLACKRAVEN">
            BLACKRAVEN
          </h1>
          <p className="text-xs text-zinc-500">ADMIN ACCESS PORTAL</p>
        </div>

        <div className="terminal-box">
          <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-zinc-800">
            <Lock className="w-8 h-8 text-amber-600" />
            <span className="text-white font-semibold">[AUTHENTICATION_REQUIRED]</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="data-label block mb-2">[USERNAME]</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="terminal-input w-full pl-10"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="data-label block mb-2">[PASSWORD]</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="terminal-input w-full pl-10"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-950/30 border-2 border-red-900 p-3 text-red-400 text-sm text-center font-bold">
                [ERREUR] {error}
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="terminal-button-primary flex items-center space-x-2 w-full justify-center"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? '[PROCESSING...]' : '[LOGIN]'}</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
