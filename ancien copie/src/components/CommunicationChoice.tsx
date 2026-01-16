import { Lock, Ticket, Shield, User, ArrowLeft, ChevronRight } from 'lucide-react';

interface CommunicationChoiceProps {
  serviceType: string;
  onSelectPGP: () => void;
  onSelectGLPI: () => void;
  onBack: () => void;
}

const SERVICE_NAMES: Record<string, string> = {
  osint_person: 'RECHERCHE_PERSONNE',
  osint_organization: 'ANALYSE_ORGANISATION',
  geolocation: 'GÉOLOCALISATION',
  social_footprint: 'EMPREINTE_NUMÉRIQUE',
  network_analysis: 'ANALYSE_RÉSEAU',
  custom: 'DEMANDE_PERSONNALISÉE',
};

export default function CommunicationChoice({
  serviceType,
  onSelectPGP,
  onSelectGLPI,
  onBack,
}: CommunicationChoiceProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono relative overflow-hidden">
      <div className="scanline"></div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDI1NSwwLDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60"></div>

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>

      <div className="relative z-10 min-h-screen">
        <header className="border-b-2 border-zinc-800 bg-black/90 backdrop-blur">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider glitch" data-text="[MODE_COMMUNICATION]">
                  [MODE_COMMUNICATION]
                </h1>
                <p className="text-zinc-500 text-sm tracking-wider mt-1">CHOISISSEZ VOTRE PROTOCOLE</p>
              </div>
            </div>
          </div>
        </header>

        <main className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <button
                onClick={onSelectPGP}
                className="terminal-card group text-left hover:scale-105 transition-transform p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 border-2 border-zinc-800 flex items-center justify-center group-hover:border-amber-600 transition-all">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">[PGP_CHIFFRÉ]</h3>
                <p className="text-zinc-500 mb-6 leading-relaxed text-sm">
                  Mode anonyme avec chiffrement end-to-end. Vos données restent totalement confidentielles et non-traçables.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-bold text-sm">{'>'} ANONYMAT_TOTAL</p>
                      <p className="text-zinc-500 text-xs">Aucune donnée personnelle requise</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-bold text-sm">{'>'} CHIFFREMENT_PGP</p>
                      <p className="text-zinc-500 text-xs">Sécurité cryptographique maximale</p>
                    </div>
                  </div>
                </div>

                <div className="inline-block px-3 py-1 bg-zinc-900/50 border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-bold">RECOMMANDÉ_MISSIONS_SENSIBLES</span>
                </div>
              </button>

              <button
                onClick={onSelectGLPI}
                className="terminal-card group text-left hover:scale-105 transition-transform p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-16 h-16 border-2 border-zinc-800 flex items-center justify-center group-hover:border-amber-600 transition-all">
                    <Ticket className="w-8 h-8 text-white" />
                  </div>
                  <ChevronRight className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">[TICKETING_GLPI]</h3>
                <p className="text-zinc-500 mb-6 leading-relaxed text-sm">
                  Communication directe avec suivi temps réel. Idéal pour prestations avec échanges réguliers.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-bold text-sm">{'>'} IDENTIFICATION_CLIENT</p>
                      <p className="text-zinc-500 text-xs">Authentification pour suivi personnalisé</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Ticket className="w-5 h-5 text-zinc-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-bold text-sm">{'>'} SUIVI_TEMPS_RÉEL</p>
                      <p className="text-zinc-500 text-xs">Consultez avancement de votre demande</p>
                    </div>
                  </div>
                </div>

                <div className="inline-block px-3 py-1 bg-zinc-900/50 border border-zinc-800">
                  <span className="text-zinc-500 text-xs font-bold">COMMUNICATION_DIRECTE_ÉQUIPE</span>
                </div>
              </button>
            </div>

            <div className="mt-12 border-2 border-zinc-800 bg-black/90 p-6">
              <div className="text-center">
                <Shield className="w-12 h-12 text-white mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white mb-2">[GARANTIE_CONFIDENTIALITÉ]</h4>
                <div className="text-zinc-500 leading-relaxed max-w-3xl mx-auto text-sm">
                  {'>'} Quel que soit le mode choisi, toutes communications sécurisées<br />
                  {'>'} Strictement confidentielles, jamais partagées avec tiers<br />
                  {'>'} Protection niveau militaire appliquée
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t-2 border-zinc-800 bg-black/90 backdrop-blur py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-zinc-500 text-xs tracking-wider">
              BLACKRAVEN INTELLIGENCE PLATFORM // SECURE PROTOCOL SELECTION
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
