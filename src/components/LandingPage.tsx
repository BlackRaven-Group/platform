import { Shield, Eye, Network, Lock, ChevronRight, Users, FileSearch, Database, Skull, Briefcase, Server, Code, Megaphone, Headphones } from 'lucide-react';

interface LandingPageProps {
  onAccessServices: () => void;
  onAdminAccess: () => void;
}

export default function LandingPage({ onAccessServices, onAdminAccess }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono relative overflow-hidden">
      <div className="scanline"></div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

      <div className="relative z-10">
        <header className="border-b-2 border-zinc-800 backdrop-blur-sm bg-black/90">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/removal-190.png"
                  alt="BlackRaven"
                  className="w-12 h-12 opacity-90"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-wider glitch" data-text="BLACKRAVEN">
                    BLACKRAVEN
                  </h1>
                  <p className="text-xs text-zinc-500 tracking-widest">OSINT INTELLIGENCE VALHALLA</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onAdminAccess}
                  className="terminal-button-small text-xs px-3 py-2 border border-zinc-800 hover:border-amber-600 text-zinc-400 hover:text-amber-500 transition-all"
                >
                  [ADMIN]
                </button>
                <button
                  onClick={onAccessServices}
                  className="terminal-button flex items-center gap-2"
                >
                  <span>ACCÈS SERVICES</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main>
          <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-7xl mx-auto text-center relative z-10">
              <div className="inline-block mb-8 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-sm animate-pulse">
                <span className="text-white text-sm font-bold tracking-widest">[CLASSIFIED OPERATIONS]</span>
              </div>
              <img
                src="/hero-logo.png"
                alt="BlackRaven"
                className="w-[500px] h-[500px] md:w-[800px] md:h-[800px] mx-auto mb-8 opacity-35 hover:opacity-45 transition-opacity duration-300 object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ marginTop: '-1rem', zIndex: 0 }}
              />
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight glitch relative z-20" data-text="VALHALLA INTELLIGENCE">
                VALHALLA
                <br />
                <span className="text-zinc-200">
                  INTELLIGENCE
                </span>
              </h2>
              <div className="max-w-3xl mx-auto mb-8">
                <div className="border-2 border-zinc-800 bg-black/90 p-6 font-mono text-left">
                  <div className="text-white mb-2">&gt; MISSION_STATEMENT.txt</div>
                  <div className="text-zinc-200 text-sm leading-relaxed">
                    {'>'} Renseignement de source ouverte (OSINT)<br />
                    {'>'} Analyse stratégique et tactique<br />
                    {'>'} Surveillance géospatiale avancée<br />
                    {'>'} Opérations clandestines et discrétion absolue<br />
                    {'>'} Par les Ravens, pour les guerriers du digital
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={onAccessServices}
                  className="terminal-button-large flex items-center gap-2 px-8 py-4"
                >
                  <Skull className="w-5 h-5" />
                  <span>DEMANDER UNE PRESTATION</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>

          <section className="py-20 px-4 sm:px-6 lg:px-8 border-t-2 border-zinc-800/50 bg-black/30">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <Users className="w-16 h-16 text-white mx-auto mb-6 animate-pulse" />
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 glitch" data-text="[NOTRE_ÉQUIPE]">
                  [NOTRE_ÉQUIPE]
                </h3>
                <p className="text-zinc-500 text-sm">Les Ravens au service de l'Intelligence</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                <div className="terminal-card-team group">
                  <div className="flex items-center justify-center w-24 h-24 border-2 border-zinc-800 mb-4 mx-auto group-hover:border-amber-600 transition-all rounded-full bg-black/80 overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-white">
                      <path d="M50 20 C45 20 40 25 40 30 L40 40 C40 45 35 50 30 50 L25 50 C20 50 15 55 15 60 C15 65 20 70 25 70 L30 70 C35 70 40 75 40 80 L40 85 C40 90 45 95 50 95 C55 95 60 90 60 85 L60 80 C60 75 65 70 70 70 L75 70 C80 70 85 65 85 60 C85 55 80 50 75 50 L70 50 C65 50 60 45 60 40 L60 30 C60 25 55 20 50 20 Z M45 15 L55 15 L52 10 L48 10 Z" fill="currentColor"/>
                      <circle cx="45" cy="35" r="3" fill="black"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white text-center mb-1">LOUIS</h4>
                  <p className="text-zinc-500 text-center text-xs mb-2">Chef de projet</p>
                  <p className="text-amber-600 text-center text-xs italic mb-3">Le Corbeau de Valhalla</p>
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-zinc-900/50 border border-zinc-800 text-white text-xs font-bold">
                      [LEADER]
                    </span>
                  </div>
                </div>

                <div className="terminal-card-team group">
                  <div className="flex items-center justify-center w-24 h-24 border-2 border-zinc-800 mb-4 mx-auto group-hover:border-amber-600 transition-all rounded-full bg-black/80 overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-white">
                      <path d="M30 30 L25 35 L20 32 L15 40 C15 40 20 45 25 48 L20 55 L25 58 C25 58 30 60 35 58 L40 70 L45 75 L50 78 L55 75 L60 70 L65 58 C70 60 75 58 75 58 L80 55 L75 48 C80 45 85 40 85 40 L80 32 L75 35 L70 30 L65 25 L55 22 L50 20 L45 22 L35 25 Z M42 35 C42 35 45 32 50 32 C55 32 58 35 58 35 C58 35 60 38 58 42 C56 46 52 48 50 48 C48 48 44 46 42 42 C40 38 42 35 42 35 Z" fill="currentColor"/>
                      <circle cx="45" cy="38" r="2" fill="black"/>
                      <circle cx="55" cy="38" r="2" fill="black"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white text-center mb-1">STEVEN</h4>
                  <p className="text-zinc-500 text-center text-xs mb-2">Infrastructure</p>
                  <p className="text-amber-600 text-center text-xs italic mb-3">Le Loup Fenrir</p>
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-zinc-900/50 border border-zinc-800 text-white text-xs font-bold">
                      [INFRA]
                    </span>
                  </div>
                </div>

                <div className="terminal-card-team group">
                  <div className="flex items-center justify-center w-24 h-24 border-2 border-zinc-800 mb-4 mx-auto group-hover:border-amber-600 transition-all rounded-full bg-black/80 overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-white">
                      <path d="M50 15 Q45 20 42 25 Q40 30 38 35 Q35 40 34 45 Q32 50 32 55 Q30 60 32 65 Q34 70 38 73 Q42 76 48 75 Q52 74 55 70 Q58 66 60 62 Q62 58 65 55 Q68 52 70 48 Q72 44 72 40 Q72 36 70 32 Q68 28 66 25 Q64 22 62 20 Q60 18 58 17 Q56 16 54 16 Q52 16 50 15 M45 22 Q48 24 50 28 Q52 32 52 36 Q52 40 50 44 Q48 48 45 48 Q42 48 40 44 Q38 40 38 36 Q38 32 40 28 Q42 24 45 22" fill="currentColor" stroke="currentColor" stroke-width="2"/>
                      <circle cx="46" cy="32" r="2" fill="black"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white text-center mb-1">HOUSSAM</h4>
                  <p className="text-zinc-500 text-center text-xs mb-2">Développeur</p>
                  <p className="text-amber-600 text-center text-xs italic mb-3">Le Serpent Jörmungandr</p>
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-zinc-900/50 border border-zinc-800 text-white text-xs font-bold">
                      [DEV]
                    </span>
                  </div>
                </div>

                <div className="terminal-card-team group">
                  <div className="flex items-center justify-center w-24 h-24 border-2 border-zinc-800 mb-4 mx-auto group-hover:border-amber-600 transition-all rounded-full bg-black/80 overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-white">
                      <path d="M50 10 L45 20 L35 25 L30 30 L25 40 L20 50 L25 55 L30 58 L35 60 L40 65 L45 70 L50 75 L55 70 L60 65 L65 60 L70 58 L75 55 L80 50 L75 40 L70 30 L65 25 L55 20 Z M50 25 L55 30 L60 35 L65 40 L60 42 L55 40 L50 38 L45 40 L40 42 L35 40 L40 35 L45 30 Z" fill="currentColor"/>
                      <circle cx="44" cy="35" r="2" fill="black"/>
                      <circle cx="56" cy="35" r="2" fill="black"/>
                      <path d="M40 65 L35 70 M60 65 L65 70" stroke="currentColor" stroke-width="2" fill="none"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white text-center mb-1">ESRA</h4>
                  <p className="text-zinc-500 text-center text-xs mb-2">Marketing</p>
                  <p className="text-amber-600 text-center text-xs italic mb-3">L'Aigle de Vision</p>
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-zinc-900/50 border border-zinc-800 text-white text-xs font-bold">
                      [MARKETING]
                    </span>
                  </div>
                </div>

                <div className="terminal-card-team group">
                  <div className="flex items-center justify-center w-24 h-24 border-2 border-zinc-800 mb-4 mx-auto group-hover:border-amber-600 transition-all rounded-full bg-black/80 overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-16 h-16 text-white">
                      <path d="M50 20 L48 25 L45 28 L40 30 L38 33 L35 38 L33 45 L32 50 L33 55 L35 60 L38 63 L40 65 L42 68 L45 72 L48 78 L50 85 L52 78 L55 72 L58 68 L60 65 L62 63 L65 60 L67 55 L68 50 L67 45 L65 38 L62 33 L60 30 L55 28 L52 25 Z M35 35 L30 38 L28 42 L30 45 L33 43 Z M65 35 L70 38 L72 42 L70 45 L67 43 Z M50 30 L48 33 L50 36 L52 33 Z" fill="currentColor"/>
                      <circle cx="45" cy="42" r="2" fill="black"/>
                      <circle cx="55" cy="42" r="2" fill="black"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white text-center mb-1">ANIA</h4>
                  <p className="text-zinc-500 text-center text-xs mb-2">Support</p>
                  <p className="text-amber-600 text-center text-xs italic mb-3">Le Cheval Sleipnir</p>
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-zinc-900/50 border border-zinc-800 text-white text-xs font-bold">
                      [SUPPORT]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 px-4 sm:px-6 lg:px-8 border-t-2 border-b-2 border-zinc-800/50 bg-black/50">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 glitch" data-text="[SERVICES]">
                  [SERVICES]
                </h3>
                <p className="text-zinc-500 text-sm tracking-wider">ARSENAL TACTIQUE COMPLET</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="terminal-card group">
                  <div className="w-12 h-12 border-2 border-zinc-800 flex items-center justify-center mb-4 group-hover:border-amber-600 transition-all">
                    <FileSearch className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">[OSINT_SEARCH]</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Collecte et analyse de renseignement open-source. Identification de cibles, organisations et réseaux.
                  </p>
                </div>
                <div className="terminal-card group">
                  <div className="w-12 h-12 border-2 border-zinc-800 flex items-center justify-center mb-4 group-hover:border-amber-600 transition-all">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">[SURVEILLANCE]</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Surveillance tactique géospatiale. Tracking de mouvements via systèmes de caméras et géolocalisation.
                  </p>
                </div>
                <div className="terminal-card group">
                  <div className="w-12 h-12 border-2 border-zinc-800 flex items-center justify-center mb-4 group-hover:border-amber-600 transition-all">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">[DATA_ANALYSIS]</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed">
                    Corrélation de données massives, pattern recognition et production de rapports d'intelligence.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-16 px-4 sm:px-6 lg:px-8 border-t-2 border-zinc-800/50 bg-black/50">
            <div className="max-w-4xl mx-auto text-center">
              <Lock className="w-16 h-16 text-white mx-auto mb-6 animate-pulse" />
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 glitch" data-text="[SECURE_COMMS]">
                [SECURE_COMMS]
              </h3>
              <div className="border-2 border-zinc-800 bg-black/90 p-6 font-mono text-left mb-8 max-w-2xl mx-auto">
                <div className="text-white mb-2">&gt; ENCRYPTION_PROTOCOL.txt</div>
                <div className="text-zinc-500 text-sm leading-relaxed">
                  {'>'} Communications chiffrées end-to-end via PGP<br />
                  {'>'} Anonymat total garanti<br />
                  {'>'} Confidentialité niveau militaire<br />
                  {'>'} Accessible uniquement par équipe autorisée<br />
                  {'>'} Zero-knowledge architecture
                </div>
              </div>
              <button
                onClick={onAccessServices}
                className="terminal-button-large inline-flex items-center gap-2"
              >
                <Lock className="w-5 h-5" />
                <span>SOUMETTRE DEMANDE SÉCURISÉE</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </section>
        </main>

        <footer className="border-t-2 border-zinc-800/50 backdrop-blur-sm py-8 bg-black/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Skull className="w-5 h-5 text-amber-600" />
              <span className="text-white font-bold tracking-wider">BLACKRAVEN VALHALLA</span>
              <Skull className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-zinc-500 text-xs tracking-wider">
              © 2025 BLACKRAVEN INTELLIGENCE // ALL OPERATIONS CLASSIFIED // VALHALLA AWAITS
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
