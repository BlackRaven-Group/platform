import { useState, useEffect } from 'react';
import { Lock, Key, Send, ArrowLeft, AlertCircle, CheckCircle, Shield, Copy, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PGPMessagingProps {
  serviceType: string;
  onBack: () => void;
  onSuccess: () => void;
  clientUserId?: string;
}

const SERVICE_NAMES: Record<string, string> = {
  osint_person: 'RECHERCHE_PERSONNE',
  osint_organization: 'ANALYSE_ORGANISATION',
  geolocation: 'GÉOLOCALISATION',
  social_footprint: 'EMPREINTE_NUMÉRIQUE',
  network_analysis: 'ANALYSE_RÉSEAU',
  custom: 'DEMANDE_PERSONNALISÉE',
};

export default function PGPMessaging({ serviceType, onBack, onSuccess, clientUserId }: PGPMessagingProps) {
  // États pour la configuration PGP
  const [step, setStep] = useState<'loading' | 'setup' | 'messaging'>('loading');
  const [sitePublicKey, setSitePublicKey] = useState('');
  const [clientHasKey, setClientHasKey] = useState(false);
  const [clientFingerprint, setClientFingerprint] = useState('');
  
  // États pour le formulaire
  const [clientPublicKey, setClientPublicKey] = useState('');
  const [encryptedMessage, setEncryptedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    initializePGP();
  }, []);

  const initializePGP = async () => {
    try {
      // 1. Récupérer la clé publique du site
      const siteKeyResponse = await fetch(`${supabaseUrl}/functions/v1/pgp-keys/site-public-key`, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });
      const siteKeyData = await siteKeyResponse.json();
      if (siteKeyData.publicKey) {
        setSitePublicKey(siteKeyData.publicKey);
      }

      // 2. Vérifier si le client a déjà une clé enregistrée
      let userId = clientUserId;
      if (!userId) {
        const clientUserStr = localStorage.getItem('client_user');
        if (clientUserStr) {
          const clientUser = JSON.parse(clientUserStr);
          userId = clientUser.id;
        }
      }

      if (userId) {
        const keyStatusResponse = await fetch(`${supabaseUrl}/functions/v1/pgp-keys/client-key-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ client_id: userId }),
        });
        const keyStatusData = await keyStatusResponse.json();
        
        if (keyStatusData.hasKey) {
          setClientHasKey(true);
          setClientFingerprint(keyStatusData.fingerprint || '');
          setStep('messaging');
        } else {
          setStep('setup');
        }
      } else {
        setStep('setup');
      }
    } catch (err) {
      console.error('Error initializing PGP:', err);
      setStep('setup');
    }
  };

  const saveClientPublicKey = async () => {
    if (!clientPublicKey.trim()) {
      setError('Veuillez entrer votre clé publique PGP');
      return;
    }

    if (!clientPublicKey.includes('BEGIN PGP PUBLIC KEY BLOCK')) {
      setError('Format de clé publique PGP invalide');
      return;
    }

    if (clientPublicKey.includes('PRIVATE')) {
      setError('⚠️ ERREUR DE SÉCURITÉ: Ne partagez JAMAIS votre clé PRIVÉE! Fournissez uniquement votre clé PUBLIQUE.');
      return;
    }

    setSavingKey(true);
    setError('');

    try {
      let userId = clientUserId;
      if (!userId) {
        const clientUserStr = localStorage.getItem('client_user');
        if (clientUserStr) {
          const clientUser = JSON.parse(clientUserStr);
          userId = clientUser.id;
        }
      }

      if (!userId) {
        throw new Error('Utilisateur non identifié');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/pgp-keys/save-client-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          client_id: userId,
          public_key: clientPublicKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setClientHasKey(true);
      setClientFingerprint(data.fingerprint || '');
      setStep('messaging');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde de la clé');
    } finally {
      setSavingKey(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!encryptedMessage.trim()) {
        throw new Error('Veuillez entrer votre message chiffré');
      }

      if (!encryptedMessage.includes('BEGIN PGP MESSAGE')) {
        throw new Error('Format de message chiffré PGP invalide. Chiffrez votre message avec notre clé publique.');
      }

      let userId = clientUserId;
      if (!userId) {
        const clientUserStr = localStorage.getItem('client_user');
        if (clientUserStr) {
          const clientUser = JSON.parse(clientUserStr);
          userId = clientUser.id;
        }
      }

      // Save to service_requests table
      const { data: request, error: insertError } = await supabase
        .from('service_requests')
        .insert({
          client_id: userId || null,
          service_type: serviceType,
          encrypted_message: encryptedMessage,
          client_public_key: clientPublicKey || 'stored_in_profile',
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setRequestId(request.id);
      setSuccess(true);
      
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Écran de chargement
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-zinc-800 border-t-amber-600 rounded-full mb-4"></div>
          <p className="text-zinc-500">[INITIALISATION_PGP...]</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono relative overflow-hidden">
      <div className="scanline"></div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDI1NSwwLDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60"></div>

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>

      <div className="relative z-10 min-h-screen">
        <header className="border-b-2 border-zinc-800 bg-black/90 backdrop-blur">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={onBack}
              className="terminal-button-small flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>[RETOUR]</span>
            </button>
            <div className="flex items-center justify-center gap-4">
              <img
                src="/removal-190.png"
                alt="BlackRaven"
                className="w-10 h-10 opacity-90"
              />
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-zinc-900/50 border border-zinc-800 mb-3">
                  <span className="text-white text-xs font-bold tracking-wider">[{SERVICE_NAMES[serviceType]}]</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider glitch" data-text="[PGP_SÉCURISÉ]">
                  [PGP_SÉCURISÉ]
                </h1>
                <p className="text-zinc-500 text-sm tracking-wider mt-1">CHIFFREMENT END-TO-END</p>
              </div>
            </div>
          </div>
        </header>

        <main className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {success ? (
              <div className="border-2 border-green-700 bg-zinc-900/20 p-8 text-center">
                <CheckCircle className="w-16 h-16 text-zinc-200 mx-auto mb-4 animate-pulse" />
                <h3 className="text-2xl font-bold text-white mb-2">[DEMANDE_ENVOYÉE]</h3>
                {requestId && (
                  <p className="text-amber-500 font-mono text-sm mb-4">
                    REF: {requestId.substring(0, 8).toUpperCase()}
                  </p>
                )}
                <p className="text-zinc-500">
                  {'>'} Demande sécurisée transmise à l'équipe<br />
                  {'>'} Communication 100% anonyme garantie<br />
                  {'>'} Réponse chiffrée avec votre clé publique
                </p>
              </div>
            ) : step === 'setup' ? (
              // ÉTAPE 1: Configuration de la clé PGP
              <div className="space-y-8">
                <div className="terminal-card border-amber-600">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 border-2 border-amber-600 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">[CONFIGURATION_INITIALE]</h3>
                      <p className="text-zinc-400 text-sm">
                        Pour communiquer de manière sécurisée, nous avons besoin de votre clé PGP <strong>PUBLIQUE</strong>.
                        Cette clé nous permettra de chiffrer nos réponses pour que vous seul puissiez les lire.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Clé publique BlackRaven */}
                <div className="terminal-card">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Key className="w-5 h-5 text-green-500" />
                    [CLÉ_PUBLIQUE_BLACKRAVEN]
                  </h4>
                  <p className="text-zinc-500 text-xs mb-3">
                    Utilisez cette clé pour chiffrer vos messages vers nous :
                  </p>
                  <div className="relative">
                    <pre className="bg-zinc-950 border border-zinc-800 p-4 text-xs text-green-400 overflow-x-auto max-h-48">
                      {sitePublicKey || 'Chargement...'}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(sitePublicKey)}
                      className="absolute top-2 right-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded"
                      title="Copier"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                    </button>
                  </div>
                </div>

                {/* Formulaire pour la clé du client */}
                <div className="terminal-card">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-500" />
                    [VOTRE_CLÉ_PUBLIQUE]
                  </h4>
                  <p className="text-zinc-500 text-xs mb-3">
                    Collez votre clé publique PGP ci-dessous. <strong className="text-red-400">Ne partagez JAMAIS votre clé privée !</strong>
                  </p>
                  <textarea
                    value={clientPublicKey}
                    onChange={(e) => setClientPublicKey(e.target.value)}
                    placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;&#10;Collez votre clé PUBLIQUE ici...&#10;&#10;-----END PGP PUBLIC KEY BLOCK-----"
                    className="terminal-input w-full h-48 font-mono text-sm mb-4"
                  />

                  {error && (
                    <div className="border-2 border-red-700 bg-red-950/20 p-4 flex items-start gap-3 mb-4">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={saveClientPublicKey}
                    disabled={savingKey}
                    className="terminal-button-primary w-full flex items-center justify-center gap-2"
                  >
                    {savingKey ? (
                      '[ENREGISTREMENT...]'
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        <span>[ENREGISTRER_MA_CLÉ]</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center text-zinc-600 text-xs">
                  <p>💡 Pas de clé PGP ? Générez-en une avec :</p>
                  <code className="text-zinc-500">gpg --full-generate-key</code>
                  <p className="mt-1">ou utilisez <a href="https://pgpkeygen.com/" target="_blank" rel="noopener" className="text-amber-500 hover:underline">pgpkeygen.com</a></p>
                </div>
              </div>
            ) : (
              // ÉTAPE 2: Envoi de message chiffré
              <>
                {clientHasKey && (
                  <div className="terminal-card border-green-700 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <div>
                          <p className="text-green-400 font-bold text-sm">[CLÉ_PGP_CONFIGURÉE]</p>
                          <p className="text-zinc-500 text-xs">Empreinte: {clientFingerprint}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setStep('setup')}
                        className="terminal-button-small flex items-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Modifier</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="terminal-card mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 border-2 border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">[INSTRUCTIONS]</h3>
                      <ol className="text-zinc-500 space-y-2 text-sm">
                        <li>{'>'} Rédigez votre message en clair</li>
                        <li>{'>'} Chiffrez-le avec notre clé publique BlackRaven</li>
                        <li>{'>'} Collez le message chiffré ci-dessous</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Afficher la clé publique BlackRaven */}
                <div className="terminal-card mb-6">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
                    <Key className="w-4 h-4 text-green-500" />
                    [CLÉ_PUBLIQUE_BLACKRAVEN]
                  </h4>
                  <div className="relative">
                    <pre className="bg-zinc-950 border border-zinc-800 p-3 text-xs text-green-400 overflow-x-auto max-h-32">
                      {sitePublicKey || 'Chargement...'}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(sitePublicKey)}
                      className="absolute top-2 right-2 p-1 bg-zinc-800 hover:bg-zinc-700 rounded"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-white font-bold mb-3 text-sm">
                      <Lock className="w-5 h-5" />
                      [MESSAGE_CHIFFRÉ_PGP]
                    </label>
                    <textarea
                      value={encryptedMessage}
                      onChange={(e) => setEncryptedMessage(e.target.value)}
                      placeholder="-----BEGIN PGP MESSAGE-----&#10;&#10;Collez votre message chiffré ici...&#10;(Chiffré avec notre clé publique BlackRaven)&#10;&#10;-----END PGP MESSAGE-----"
                      className="terminal-input w-full h-64 font-mono text-sm"
                      required
                    />
                  </div>

                  {error && (
                    <div className="border-2 border-red-700 bg-red-950/20 p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm">[ERREUR] {error}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={onBack}
                      className="terminal-button flex-1"
                      disabled={loading}
                    >
                      [ANNULER]
                    </button>
                    <button
                      type="submit"
                      className="terminal-button-large flex-1 flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        '[ENVOI_EN_COURS...]'
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>[ENVOYER_DEMANDE]</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </main>

        <footer className="border-t-2 border-zinc-800 bg-black/90 backdrop-blur py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-zinc-500 text-xs tracking-wider">
              BLACKRAVEN INTELLIGENCE PLATFORM // PGP ENCRYPTED COMMS
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
