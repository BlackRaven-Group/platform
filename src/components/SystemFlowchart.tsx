import { useState } from 'react';
import { X, Database, User, Shield, Eye, FileSearch, Map, MessageSquare, Ticket, Lock } from 'lucide-react';

interface SystemFlowchartProps {
  onClose?: () => void;
}

export default function SystemFlowchart({ onClose }: SystemFlowchartProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const nodeInfo: Record<string, { title: string; description: string; color: string }> = {
    access: {
      title: 'Écran d\'Accès',
      description: 'Point d\'entrée - Déblocage audio et authentification',
      color: '#fbbf24'
    },
    splash: {
      title: 'Splash Screen',
      description: 'Animation d\'introduction avec son',
      color: '#fbbf24'
    },
    landing: {
      title: 'Page d\'Accueil',
      description: 'Présentation des services et accès',
      color: '#10b981'
    },
    auth: {
      title: 'Authentification',
      description: 'Connexion Admin / Client avec gestion des rôles',
      color: '#3b82f6'
    },
    osint: {
      title: 'OSINT Dashboard',
      description: 'Recherche de renseignement open-source via API LeakOSINT',
      color: '#8b5cf6'
    },
    dossier: {
      title: 'Gestion Dossiers',
      description: 'Création, accès PIN, consultation et suppression de dossiers',
      color: '#ec4899'
    },
    targets: {
      title: 'Targets & Intelligence',
      description: 'Gestion des cibles, consolidation, notes et corrélations',
      color: '#f59e0b'
    },
    map: {
      title: 'Cartographie',
      description: 'Visualisation géospatiale avec pins et surveillance',
      color: '#06b6d4'
    },
    tickets: {
      title: 'Ticketing GLPI',
      description: 'Gestion des demandes client via intégration GLPI',
      color: '#14b8a6'
    },
    pgp: {
      title: 'Communication PGP',
      description: 'Messagerie chiffrée end-to-end',
      color: '#6366f1'
    },
    db: {
      title: 'Base de Données',
      description: 'Supabase PostgreSQL - Stockage sécurisé avec RLS',
      color: '#64748b'
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm overflow-auto">
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 border-b-2 border-zinc-800 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-wider glitch" data-text="ARCHITECTURE SYSTÈME">
                ARCHITECTURE SYSTÈME
              </h1>
              <p className="text-zinc-400 text-sm font-mono">Flowchart des processus et fonctionnalités</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors p-2"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Legend */}
          <div className="mb-6 p-4 bg-zinc-900/50 border border-zinc-800 rounded-sm">
            <h3 className="text-white font-bold mb-3 text-sm tracking-wider">[LÉGENDE]</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-600 rounded"></div>
                <span className="text-zinc-300">Interface Utilisateur</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-zinc-300">Authentification</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 rounded"></div>
                <span className="text-zinc-300">Fonctionnalités</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-slate-500 rounded"></div>
                <span className="text-zinc-300">Infrastructure</span>
              </div>
            </div>
          </div>

          {/* SVG Flowchart */}
          <div className="bg-black/50 border-2 border-zinc-800 rounded-sm p-4 sm:p-8 overflow-x-auto">
            <svg
              viewBox="0 0 1200 1600"
              className="w-full h-auto"
              style={{ minHeight: '800px' }}
            >
              {/* Background grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                </pattern>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#10b981" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Connection lines */}
              {/* Access -> Splash */}
              <line x1="600" y1="100" x2="600" y2="200" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Splash -> Landing */}
              <line x1="600" y1="300" x2="600" y2="400" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Landing -> Auth */}
              <line x1="400" y1="500" x2="300" y2="600" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Landing -> Services */}
              <line x1="600" y1="500" x2="600" y2="600" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Auth -> Admin Panel */}
              <line x1="200" y1="700" x2="200" y2="800" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Auth -> Client Services */}
              <line x1="400" y1="700" x2="400" y2="800" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Services -> OSINT */}
              <line x1="500" y1="700" x2="500" y2="800" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Services -> Dossier */}
              <line x1="600" y1="700" x2="600" y2="800" stroke="#ec4899" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Services -> Map */}
              <line x1="700" y1="700" x2="700" y2="800" stroke="#06b6d4" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Services -> Tickets */}
              <line x1="800" y1="700" x2="800" y2="800" stroke="#14b8a6" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Services -> PGP */}
              <line x1="900" y1="700" x2="900" y2="800" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* OSINT -> Dossier */}
              <line x1="500" y1="900" x2="550" y2="1000" stroke="#8b5cf6" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* Dossier -> Targets */}
              <line x1="600" y1="900" x2="600" y2="1000" stroke="#ec4899" strokeWidth="2" markerEnd="url(#arrowhead)" />
              
              {/* All -> Database */}
              <line x1="600" y1="1100" x2="600" y2="1200" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="200" y1="900" x2="400" y2="1200" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="400" y1="900" x2="500" y2="1200" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="800" y1="900" x2="700" y2="1200" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="900" y1="900" x2="800" y2="1200" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />

              {/* Nodes */}
              {/* Access Screen */}
              <g onClick={() => setSelectedNode('access')} className="cursor-pointer">
                <rect x="500" y="50" width="200" height="100" rx="5" fill="#1f2937" stroke="#fbbf24" strokeWidth="2" />
                <text x="600" y="85" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold">ACCÈS</text>
                <text x="600" y="110" textAnchor="middle" fill="#9ca3af" fontSize="10">Déblocage Audio</text>
                <text x="600" y="130" textAnchor="middle" fill="#9ca3af" fontSize="10">Interaction Utilisateur</text>
              </g>

              {/* Splash Screen */}
              <g onClick={() => setSelectedNode('splash')} className="cursor-pointer">
                <rect x="500" y="200" width="200" height="100" rx="5" fill="#1f2937" stroke="#fbbf24" strokeWidth="2" />
                <text x="600" y="235" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold">SPLASH</text>
                <text x="600" y="260" textAnchor="middle" fill="#9ca3af" fontSize="10">Animation GIF</text>
                <text x="600" y="280" textAnchor="middle" fill="#9ca3af" fontSize="10">Son Corbeau</text>
              </g>

              {/* Landing Page */}
              <g onClick={() => setSelectedNode('landing')} className="cursor-pointer">
                <rect x="500" y="400" width="200" height="100" rx="5" fill="#1f2937" stroke="#10b981" strokeWidth="2" />
                <text x="600" y="435" textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="bold">LANDING</text>
                <text x="600" y="460" textAnchor="middle" fill="#9ca3af" fontSize="10">Présentation Services</text>
                <text x="600" y="480" textAnchor="middle" fill="#9ca3af" fontSize="10">Équipe & Fonctionnalités</text>
              </g>

              {/* Authentication */}
              <g onClick={() => setSelectedNode('auth')} className="cursor-pointer">
                <rect x="250" y="600" width="200" height="100" rx="5" fill="#1f2937" stroke="#3b82f6" strokeWidth="2" />
                <text x="350" y="635" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold">AUTH</text>
                <text x="350" y="660" textAnchor="middle" fill="#9ca3af" fontSize="10">Admin / Client</text>
                <text x="350" y="680" textAnchor="middle" fill="#9ca3af" fontSize="10">Gestion Rôles</text>
              </g>

              {/* Services Hub */}
              <g>
                <rect x="450" y="600" width="300" height="100" rx="5" fill="#1f2937" stroke="#10b981" strokeWidth="2" />
                <text x="600" y="635" textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="bold">SERVICES</text>
                <text x="600" y="660" textAnchor="middle" fill="#9ca3af" fontSize="10">Hub Central</text>
                <text x="600" y="680" textAnchor="middle" fill="#9ca3af" fontSize="10">Sélection Service</text>
              </g>

              {/* Admin Panel */}
              <g onClick={() => setSelectedNode('admin')} className="cursor-pointer">
                <rect x="100" y="800" width="200" height="100" rx="5" fill="#1f2937" stroke="#3b82f6" strokeWidth="2" />
                <text x="200" y="835" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold">ADMIN</text>
                <text x="200" y="860" textAnchor="middle" fill="#9ca3af" fontSize="10">Panneau Admin</text>
                <text x="200" y="880" textAnchor="middle" fill="#9ca3af" fontSize="10">Gestion Système</text>
              </g>

              {/* Client Services */}
              <g>
                <rect x="300" y="800" width="200" height="100" rx="5" fill="#1f2937" stroke="#3b82f6" strokeWidth="2" />
                <text x="400" y="835" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="bold">CLIENT</text>
                <text x="400" y="860" textAnchor="middle" fill="#9ca3af" fontSize="10">Services Client</text>
                <text x="400" y="880" textAnchor="middle" fill="#9ca3af" fontSize="10">Demandes</text>
              </g>

              {/* OSINT */}
              <g onClick={() => setSelectedNode('osint')} className="cursor-pointer">
                <rect x="400" y="800" width="200" height="100" rx="5" fill="#1f2937" stroke="#8b5cf6" strokeWidth="2" />
                <text x="500" y="835" textAnchor="middle" fill="#8b5cf6" fontSize="14" fontWeight="bold">OSINT</text>
                <text x="500" y="860" textAnchor="middle" fill="#9ca3af" fontSize="10">Recherche API</text>
                <text x="500" y="880" textAnchor="middle" fill="#9ca3af" fontSize="10">LeakOSINT</text>
              </g>

              {/* Dossiers */}
              <g onClick={() => setSelectedNode('dossier')} className="cursor-pointer">
                <rect x="500" y="800" width="200" height="100" rx="5" fill="#1f2937" stroke="#ec4899" strokeWidth="2" />
                <text x="600" y="835" textAnchor="middle" fill="#ec4899" fontSize="14" fontWeight="bold">DOSSIERS</text>
                <text x="600" y="860" textAnchor="middle" fill="#9ca3af" fontSize="10">Création / Accès PIN</text>
                <text x="600" y="880" textAnchor="middle" fill="#9ca3af" fontSize="10">Gestion Intelligence</text>
              </g>

              {/* Map */}
              <g onClick={() => setSelectedNode('map')} className="cursor-pointer">
                <rect x="600" y="800" width="200" height="100" rx="5" fill="#1f2937" stroke="#06b6d4" strokeWidth="2" />
                <text x="700" y="835" textAnchor="middle" fill="#06b6d4" fontSize="14" fontWeight="bold">CARTE</text>
                <text x="700" y="860" textAnchor="middle" fill="#9ca3af" fontSize="10">Google Maps</text>
                <text x="700" y="880" textAnchor="middle" fill="#9ca3af" fontSize="10">Surveillance</text>
              </g>

              {/* Tickets */}
              <g onClick={() => setSelectedNode('tickets')} className="cursor-pointer">
                <rect x="700" y="800" width="200" height="100" rx="5" fill="#1f2937" stroke="#14b8a6" strokeWidth="2" />
                <text x="800" y="835" textAnchor="middle" fill="#14b8a6" fontSize="14" fontWeight="bold">TICKETS</text>
                <text x="800" y="860" textAnchor="middle" fill="#9ca3af" fontSize="10">GLPI Integration</text>
                <text x="800" y="880" textAnchor="middle" fill="#9ca3af" fontSize="10">Support Client</text>
              </g>

              {/* PGP */}
              <g onClick={() => setSelectedNode('pgp')} className="cursor-pointer">
                <rect x="800" y="800" width="200" height="100" rx="5" fill="#1f2937" stroke="#6366f1" strokeWidth="2" />
                <text x="900" y="835" textAnchor="middle" fill="#6366f1" fontSize="14" fontWeight="bold">PGP</text>
                <text x="900" y="860" textAnchor="middle" fill="#9ca3af" fontSize="10">Messagerie</text>
                <text x="900" y="880" textAnchor="middle" fill="#9ca3af" fontSize="10">Chiffrement E2E</text>
              </g>

              {/* Targets */}
              <g onClick={() => setSelectedNode('targets')} className="cursor-pointer">
                <rect x="500" y="1000" width="200" height="100" rx="5" fill="#1f2937" stroke="#f59e0b" strokeWidth="2" />
                <text x="600" y="1035" textAnchor="middle" fill="#f59e0b" fontSize="14" fontWeight="bold">TARGETS</text>
                <text x="600" y="1060" textAnchor="middle" fill="#9ca3af" fontSize="10">Consolidation</text>
                <text x="600" y="1080" textAnchor="middle" fill="#9ca3af" fontSize="10">Intelligence Notes</text>
              </g>

              {/* Database */}
              <g onClick={() => setSelectedNode('db')} className="cursor-pointer">
                <rect x="300" y="1200" width="600" height="150" rx="5" fill="#1f2937" stroke="#64748b" strokeWidth="3" />
                <text x="600" y="1235" textAnchor="middle" fill="#64748b" fontSize="16" fontWeight="bold">SUPABASE DATABASE</text>
                <text x="600" y="1260" textAnchor="middle" fill="#9ca3af" fontSize="11">PostgreSQL avec Row Level Security (RLS)</text>
                <text x="400" y="1285" textAnchor="middle" fill="#9ca3af" fontSize="10">Dossiers • Targets • Credentials</text>
                <text x="600" y="1285" textAnchor="middle" fill="#9ca3af" fontSize="10">OSINT Searches • Notes</text>
                <text x="800" y="1285" textAnchor="middle" fill="#9ca3af" fontSize="10">Tickets • Users</text>
                <text x="600" y="1310" textAnchor="middle" fill="#9ca3af" fontSize="10">Edge Functions • Real-time • Storage</text>
              </g>
            </svg>
          </div>

          {/* Node Info Panel */}
          {selectedNode && nodeInfo[selectedNode] && (
            <div className="mt-6 p-6 bg-zinc-900/50 border border-zinc-800 rounded-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded`} style={{ backgroundColor: nodeInfo[selectedNode].color }}></div>
                <h3 className="text-white font-bold text-lg">{nodeInfo[selectedNode].title}</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="ml-auto text-zinc-500 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-zinc-300 text-sm">{nodeInfo[selectedNode].description}</p>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-6 p-4 bg-zinc-900/30 border border-zinc-800 rounded-sm text-center">
            <p className="text-zinc-400 text-xs font-mono">
              Cliquez sur les nœuds pour plus d'informations • Flux de données représentés par les flèches vertes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
