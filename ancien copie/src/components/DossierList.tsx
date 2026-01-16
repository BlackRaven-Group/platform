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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {'>'} DOSSIERS
          </h2>
          <p className="text-sm text-zinc-500">
            {dossiers.length} CASE{dossiers.length !== 1 ? 'S' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {onOpenSurveillance && (
            <button
              onClick={onOpenSurveillance}
              className="terminal-button flex items-center space-x-2"
            >
              <Video className="w-4 h-4" />
              <span>SURVEILLANCE</span>
            </button>
          )}
          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="terminal-button flex items-center space-x-2"
            >
              <Map className="w-4 h-4" />
              <span>MAP</span>
            </button>
          )}
          {onOpenOSINT && (
            <button
              onClick={onOpenOSINT}
              className="terminal-button flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>OSINT</span>
            </button>
          )}
          <button
            onClick={onCreateNew}
            className="terminal-button-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>NEW</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="terminal-box">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white animate-pulse">LOADING...</span>
          </div>
        </div>
      ) : dossiers.length === 0 ? (
        <div className="terminal-box text-center py-12">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">NO DOSSIERS</p>
          <button onClick={onCreateNew} className="terminal-button-primary">
            CREATE
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dossiers.map((dossier) => (
            <button
              key={dossier.id}
              onClick={() => onViewDossier(dossier.id)}
              className="terminal-box text-left hover:border-zinc-600 transition-all group p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <Folder className="w-8 h-8 text-amber-600 group-hover:text-white" />
                <Lock className="w-5 h-5 text-zinc-500" />
              </div>

              <div className="text-2xl font-bold text-zinc-200 mb-1 font-mono group-hover:text-zinc-300">
                {dossier.code_name || 'UNKNOWN'}
              </div>

              <div className="text-xs text-zinc-500 mt-4">
                {new Date(dossier.updated_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
