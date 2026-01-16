import { FileSearch, Users, MapPin, Database, Shield, Globe, ChevronRight, ArrowLeft, Ticket } from 'lucide-react';

interface ServiceSelectionProps {
  onSelectService: (serviceType: string) => void;
  onBack: () => void;
  onViewMyTickets?: () => void;
  hasTickets?: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const SERVICES: Service[] = [
  {
    id: 'osint_person',
    title: 'RECHERCHE_PERSONNE',
    description: 'Investigation complète sur un individu avec collecte de données publiques',
    icon: <Users className="w-8 h-8" />,
    features: [
      'Identité et aliases',
      'Présence sur les réseaux sociaux',
      'Adresses et localisations',
      'Historique professionnel',
      'Connexions et relations',
    ],
  },
  {
    id: 'osint_organization',
    title: 'ANALYSE_ORGANISATION',
    description: "Renseignement sur une entreprise, organisation ou entité",
    icon: <Database className="w-8 h-8" />,
    features: [
      'Structure organisationnelle',
      'Personnel clé',
      'Présence digitale',
      'Partenaires et affiliations',
      'Historique et réputation',
    ],
  },
  {
    id: 'geolocation',
    title: 'GÉOLOCALISATION',
    description: 'Analyse de localisation et suivi de mouvements',
    icon: <MapPin className="w-8 h-8" />,
    features: [
      'Identification de lieux',
      'Historique de déplacements',
      'Surveillance de zone',
      'Analyse de caméras',
      'Points d\'intérêt',
    ],
  },
  {
    id: 'social_footprint',
    title: 'EMPREINTE_NUMÉRIQUE',
    description: 'Analyse complète de la présence en ligne',
    icon: <Globe className="w-8 h-8" />,
    features: [
      'Comptes sociaux',
      'Publications et activités',
      'Données de breach',
      'Credentials exposés',
      'Historique web',
    ],
  },
  {
    id: 'network_analysis',
    title: 'ANALYSE_RÉSEAU',
    description: 'Cartographie des connexions et relations',
    icon: <Shield className="w-8 h-8" />,
    features: [
      'Réseau de contacts',
      'Liens organisationnels',
      'Analyse de groupes',
      'Identifications de patterns',
      'Corrélations de données',
    ],
  },
  {
    id: 'custom',
    title: 'DEMANDE_PERSONNALISÉE',
    description: 'Mission sur mesure selon vos besoins spécifiques',
    icon: <FileSearch className="w-8 h-8" />,
    features: [
      'Brief personnalisé',
      'Méthodologie adaptée',
      'Objectifs définis',
      'Ressources dédiées',
      'Support prioritaire',
    ],
  },
];

export default function ServiceSelection({ onSelectService, onBack, onViewMyTickets, hasTickets }: ServiceSelectionProps) {
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono relative overflow-hidden">
      <div className="scanline"></div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDI1NSwwLDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60"></div>

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>

      <div className="relative z-10 min-h-screen">
        <header className="border-b-2 border-zinc-800 bg-black/90 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={onBack}
                className="terminal-button-small flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>[RETOUR]</span>
              </button>
              
              {onViewMyTickets && (
                <button
                  onClick={onViewMyTickets}
                  className="terminal-button flex items-center gap-2 bg-amber-600/10 border-amber-600 text-amber-500 hover:bg-amber-600/20"
                >
                  <Ticket className="w-4 h-4" />
                  <span>[MES_DEMANDES]</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-center gap-4">
              <img
                src="/removal-190.png"
                alt="BlackRaven"
                className="w-10 h-10 opacity-90"
              />
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider glitch" data-text="[SÉLECTION_PRESTATION]">
                  [SÉLECTION_PRESTATION]
                </h1>
                <p className="text-zinc-500 text-sm tracking-wider mt-1">CHOISISSEZ VOTRE MISSION</p>
              </div>
            </div>
          </div>
        </header>

        <main className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SERVICES.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onSelectService(service.id)}
                  className="terminal-card group text-left hover:scale-105 transition-transform"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 border-2 border-zinc-800 flex items-center justify-center group-hover:border-green-500 transition-all">
                      <div className="text-white">{service.icon}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">[{service.title}]</h3>
                  <p className="text-zinc-500 text-sm mb-4 leading-relaxed">{service.description}</p>
                  <div className="space-y-2">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-green-800 text-xs">
                        <div className="w-1 h-1 bg-green-700"></div>
                        {'>'} {feature}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-12 border-2 border-zinc-800 bg-black/90 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 border-2 border-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-2">[COMMUNICATION_SÉCURISÉE]</h4>
                  <p className="text-zinc-500 leading-relaxed text-sm">
                    {'>'} Après sélection, vous choisissez votre mode de communication<br />
                    {'>'} PGP chiffré (anonyme) ou Ticketing GLPI (suivi direct)<br />
                    {'>'} Confidentialité garantie niveau militaire<br />
                    {'>'} Accessible uniquement par équipe support autorisée
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t-2 border-zinc-800 bg-black/90 backdrop-blur py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-zinc-500 text-xs tracking-wider">
              BLACKRAVEN INTELLIGENCE PLATFORM // VALHALLA OPERATIONS
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
