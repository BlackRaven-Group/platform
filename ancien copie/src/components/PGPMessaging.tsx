import { useState } from 'react';
import { Lock, Key, Send, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

interface PGPMessagingProps {
  serviceType: string;
  onBack: () => void;
  onSuccess: () => void;
}

const SERVICE_NAMES: Record<string, string> = {
  osint_person: 'RECHERCHE_PERSONNE',
  osint_organization: 'ANALYSE_ORGANISATION',
  geolocation: 'GÉOLOCALISATION',
  social_footprint: 'EMPREINTE_NUMÉRIQUE',
  network_analysis: 'ANALYSE_RÉSEAU',
  custom: 'DEMANDE_PERSONNALISÉE',
};

export default function PGPMessaging({ serviceType, onBack, onSuccess }: PGPMessagingProps) {
  const [publicKey, setPublicKey] = useState('');
  const [encryptedMessage, setEncryptedMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!publicKey.trim() || !encryptedMessage.trim()) {
        throw new Error('Veuillez remplir tous les champs');
      }

      if (!publicKey.includes('BEGIN PGP PUBLIC KEY BLOCK')) {
        throw new Error('Format de clé publique PGP invalide');
      }

      if (!encryptedMessage.includes('BEGIN PGP MESSAGE')) {
        throw new Error('Format de message chiffré PGP invalide');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

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
                <p className="text-zinc-500">
                  {'>'} Demande sécurisée transmise à l'équipe<br />
                  {'>'} Vous serez contacté prochainement
                </p>
              </div>
            ) : (
              <>
                <div className="terminal-card mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 border-2 border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">[INSTRUCTIONS_CHIFFREMENT]</h3>
                      <ol className="text-zinc-500 space-y-2 text-sm">
                        <li>{'>'} Générez paire de clés PGP si nécessaire</li>
                        <li>{'>'} Rédigez message avec tous les détails</li>
                        <li>{'>'} Chiffrez avec clé publique Blackraven</li>
                        <li>{'>'} Collez clé publique + message chiffré</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-white font-bold mb-3 text-sm">
                      <Key className="w-5 h-5" />
                      [CLÉ_PUBLIQUE_PGP]
                    </label>
                    <textarea
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----&#10;&#10;Collez votre clé publique ici...&#10;&#10;-----END PGP PUBLIC KEY BLOCK-----"
                      className="terminal-input w-full h-48 font-mono text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-white font-bold mb-3 text-sm">
                      <Lock className="w-5 h-5" />
                      [MESSAGE_CHIFFRÉ_PGP]
                    </label>
                    <textarea
                      value={encryptedMessage}
                      onChange={(e) => setEncryptedMessage(e.target.value)}
                      placeholder="-----BEGIN PGP MESSAGE-----&#10;&#10;Collez votre message chiffré ici...&#10;&#10;-----END PGP MESSAGE-----"
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
