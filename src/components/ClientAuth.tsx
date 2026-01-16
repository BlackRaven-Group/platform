import { useState } from 'react';
import { Lock, Mail, User, Building, ChevronRight, AlertCircle, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';

interface ClientAuthProps {
  onAuthSuccess: (clientUser: any) => void;
  onBack?: () => void;
}

export default function ClientAuth({ onAuthSuccess, onBack }: ClientAuthProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (!email || !password || !fullName) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      if (password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/client-auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          full_name: fullName,
          organization: organization || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Email already registered') {
          throw new Error('Un compte avec cet email existe déjà');
        }
        throw new Error(data.error || 'Erreur lors de la création du compte');
      }

      setSuccessMessage(
        'Votre compte a été créé avec succès. Il est en attente d\'approbation par un administrateur. Vous recevrez une notification par email une fois votre compte activé.'
      );
      setEmail('');
      setPassword('');
      setFullName('');
      setOrganization('');

      setTimeout(() => {
        setMode('login');
        setSuccessMessage('');
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Veuillez remplir tous les champs');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/client-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Account pending approval') {
          throw new Error('Votre compte est en attente d\'approbation par un administrateur');
        } else if (data.error === 'Account suspended') {
          throw new Error('Votre compte a été suspendu. Veuillez contacter le support');
        }
        throw new Error(data.error || 'Email ou mot de passe incorrect');
      }

      localStorage.setItem('client_session_token', data.token);
      localStorage.setItem('client_user', JSON.stringify(data.user));

      onAuthSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (!email) {
        throw new Error('Veuillez entrer votre adresse email');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          action: 'request',
          email: email.toLowerCase()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la demande');
      }

      setSuccessMessage('Si cet email existe dans notre système, vous recevrez un lien de réinitialisation.');
      
      // En DEV: afficher le token pour test (à retirer en production)
      if (data._dev_token) {
        console.log('DEV Token:', data._dev_token);
        setResetToken(data._dev_token);
        setTimeout(() => {
          setMode('reset');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (!resetToken || !password) {
        throw new Error('Token et mot de passe requis');
      }

      if (password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          action: 'reset',
          token: resetToken,
          newPassword: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }

      setSuccessMessage('Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
      setPassword('');
      setConfirmPassword('');
      setResetToken('');

      setTimeout(() => {
        setMode('login');
        setSuccessMessage('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono flex items-center justify-center p-4">
      <div className="scanline"></div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="w-full max-w-md relative z-10">
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
            className="w-24 h-24 mx-auto mb-4 opacity-80"
          />
          <h1 className="text-3xl font-bold text-white mb-2 glitch">
            BLACKRAVEN VALHALLA
          </h1>
          <p className="text-zinc-500 text-sm tracking-wider">PORTAIL CLIENT</p>
        </div>

        <div className="terminal-box mb-6">
          {/* Tabs - visible only for login/register */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex border-b border-zinc-800 mb-6">
              <button
                onClick={() => {
                  setMode('login');
                  resetForm();
                }}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  mode === 'login'
                    ? 'text-white border-b-2 border-amber-600'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                CONNEXION
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  resetForm();
                }}
                className={`flex-1 py-3 text-sm font-bold transition-all ${
                  mode === 'register'
                    ? 'text-white border-b-2 border-amber-600'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                INSCRIPTION
              </button>
            </div>
          )}

          {/* Header for forgot/reset modes */}
          {(mode === 'forgot' || mode === 'reset') && (
            <div className="mb-6">
              <button
                onClick={() => {
                  setMode('login');
                  resetForm();
                  setResetToken('');
                }}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Retour à la connexion</span>
              </button>
              <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
                <KeyRound className="w-6 h-6 text-amber-500" />
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {mode === 'forgot' ? 'Mot de passe oublié' : 'Nouveau mot de passe'}
                  </h2>
                  <p className="text-zinc-500 text-xs">
                    {mode === 'forgot' 
                      ? 'Entrez votre email pour recevoir un lien de réinitialisation'
                      : 'Définissez votre nouveau mot de passe'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-600 rounded-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-600 rounded-sm flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span className="text-emerald-400 text-sm">{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="data-label block mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="data-label block mb-2">Mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  resetForm();
                }}
                className="text-amber-500 hover:text-amber-400 text-xs mb-6 block transition-colors"
              >
                Mot de passe oublié ?
              </button>

              <button
                type="submit"
                disabled={loading}
                className="terminal-button-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>CONNEXION...</span>
                ) : (
                  <>
                    <span>SE CONNECTER</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="data-label block mb-2">Nom complet *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="data-label block mb-2">Organisation</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="Votre entreprise"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="data-label block mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="data-label block mb-2">Mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                <p className="text-zinc-500 text-xs mt-1">Minimum 8 caractères</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="terminal-button-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>CRÉATION...</span>
                ) : (
                  <>
                    <span>CRÉER UN COMPTE</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword}>
              <div className="mb-6">
                <label className="data-label block mb-2">Adresse email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="terminal-button-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>ENVOI...</span>
                ) : (
                  <>
                    <span>ENVOYER LE LIEN</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label className="data-label block mb-2">Code de réinitialisation</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="terminal-input w-full pl-10 font-mono text-xs"
                    placeholder="Entrez le code reçu par email"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="data-label block mb-2">Nouveau mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                <p className="text-zinc-500 text-xs mt-1">Minimum 8 caractères</p>
              </div>

              <div className="mb-6">
                <label className="data-label block mb-2">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="terminal-input w-full pl-10"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="terminal-button-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>RÉINITIALISATION...</span>
                ) : (
                  <>
                    <span>RÉINITIALISER</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-zinc-500 text-xs">
          <p>© 2025 BLACKRAVEN VALHALLA</p>
          <p className="mt-1">PORTAIL D'ACCÈS CLIENT SÉCURISÉ</p>
        </div>
      </div>
    </div>
  );
}
