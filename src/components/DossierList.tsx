import { Folder, Plus, Lock, AlertTriangle, Database, Map, Video } from 'lucide-react';
import type { Dossier } from '../lib/supabase';

interface DossierListProps {
  dossiers: Dossier[];
  loading: boolean;
  onViewDossier: (id: string) => void;
  onCreateNew: () => void;
  onOpenOSINT?: () => void;
  onOpenMap?: () => void;
  onOpenSurveillance?: () => void;
}

export default function DossierList({ dossiers, loading, onViewDossier, onCreateNew, onOpenOSINT, onOpenMap, onOpenSurveillance }: DossierListProps) {
  return (
    <div>
      {/* Header - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
            {'>'} DOSSIERS
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            {dossiers.length} DOSSIER{dossiers.length !== 1 ? 'S' : ''}
          </p>
        </div>
        
        {/* Action buttons - wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenSurveillance && (
            <button
              onClick={onOpenSurveillance}
              className="terminal-button flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">SURVEILLANCE</span>
              <span className="xs:hidden">CAM</span>
            </button>
          )}
          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="terminal-button flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>MAP</span>
            </button>
          )}
          {onOpenOSINT && (
            <button
              onClick={onOpenOSINT}
              className="terminal-button flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>OSINT</span>
            </button>
          )}
          <button
            onClick={onCreateNew}
            className="terminal-button-primary flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">NOUVEAU</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="terminal-box">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white animate-pulse">CHARGEMENT...</span>
          </div>
        </div>
      ) : dossiers.length === 0 ? (
        <div className="terminal-box text-center py-8 sm:py-12">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4 text-sm sm:text-base">AUCUN DOSSIER</p>
          <button onClick={onCreateNew} className="terminal-button-primary text-sm">
            CRÉER
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {dossiers.map((dossier) => (
            <button
              key={dossier.id}
              onClick={() => onViewDossier(dossier.id)}
              className="terminal-box text-left hover:border-zinc-600 transition-all group p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Folder className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 group-hover:text-white" />
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
              </div>

              <div className="text-lg sm:text-2xl font-bold text-zinc-200 mb-1 font-mono group-hover:text-zinc-300 truncate">
                {dossier.code_name || 'INCONNU'}
              </div>

              <div className="text-[10px] sm:text-xs text-zinc-500 mt-3 sm:mt-4">
                {new Date(dossier.updated_at).toLocaleDateString('fr-FR')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
