import { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, FileDown, Database, Edit2, Check, X } from 'lucide-react';
import { supabase, type Dossier, type Target } from '../lib/supabase';
import TargetCard from './TargetCard';
import TargetDetail from './TargetDetail';
import CreateTarget from './CreateTarget';
import ReportExport from './ReportExport';
import OSINTDashboard from './OSINTDashboard';

interface DossierViewProps {
  dossierId: string;
  onBack: () => void;
}

export default function DossierView({ dossierId, onBack }: DossierViewProps) {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [showCreateTarget, setShowCreateTarget] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showOSINT, setShowOSINT] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  useEffect(() => {
    loadDossierData();
  }, [dossierId]);

  const loadDossierData = async () => {
    setLoading(true);

    const { data: dossierData } = await supabase
      .from('dossiers')
      .select('*')
      .eq('id', dossierId)
      .maybeSingle();

    const { data: targetsData } = await supabase
      .from('targets')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false });

    if (dossierData) setDossier(dossierData);
    if (targetsData) setTargets(targetsData);

    setLoading(false);
  };

  const handleTargetCreated = () => {
    setShowCreateTarget(false);
    loadDossierData();
  };

  const handleTargetUpdated = () => {
    loadDossierData();
    setSelectedTargetId(null);
  };

  const handleEditTitle = () => {
    setEditedTitle(dossier?.title || '');
    setEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || !dossier) return;

    const { error } = await supabase
      .from('dossiers')
      .update({ title: editedTitle.trim() })
      .eq('id', dossierId);

    if (!error) {
      setEditingTitle(false);
      loadDossierData();
    }
  };

  const handleCancelEdit = () => {
    setEditingTitle(false);
    setEditedTitle('');
  };

  if (loading) {
    return (
      <div className="terminal-box">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white animate-pulse">LOADING DOSSIER DATA...</span>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="terminal-box">
        <p className="text-red-500">ERROR: DOSSIER NOT FOUND</p>
        <button onClick={onBack} className="terminal-button mt-4">
          RETURN TO LIST
        </button>
      </div>
    );
  }

  if (showOSINT) {
    return (
      <OSINTDashboard
        dossierId={dossierId}
        onClose={() => {
          setShowOSINT(false);
          loadDossierData();
        }}
      />
    );
  }

  if (showCreateTarget) {
    return (
      <CreateTarget
        dossierId={dossierId}
        onBack={() => setShowCreateTarget(false)}
        onCreated={handleTargetCreated}
      />
    );
  }

  if (selectedTargetId) {
    return (
      <TargetDetail
        targetId={selectedTargetId}
        onBack={() => setSelectedTargetId(null)}
        onUpdate={handleTargetUpdated}
      />
    );
  }

  if (showExport) {
    return (
      <ReportExport
        dossier={dossier}
        targets={targets}
        onBack={() => setShowExport(false)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="terminal-button">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            {editingTitle ? (
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="bg-black border-2 border-white text-zinc-200 text-2xl font-bold p-2 font-mono focus:outline-none flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <button
                  onClick={handleSaveTitle}
                  className="terminal-button flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="terminal-button flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <h2 className="text-3xl font-bold text-white">
                  {'>'} {dossier.title}
                </h2>
                <button
                  onClick={handleEditTitle}
                  className="text-zinc-500 hover:text-white transition-colors"
                  title="Edit title"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>
            )}
            <p className="text-sm text-zinc-500 mt-2">{dossier.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowOSINT(true)}
            className="terminal-button flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>OSINT</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="terminal-button flex items-center space-x-2"
          >
            <FileDown className="w-4 h-4" />
            <span>EXPORT</span>
          </button>
          <button
            onClick={() => setShowCreateTarget(true)}
            className="terminal-button-primary flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>NEW TARGET</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="terminal-box">
          <div className="data-label mb-1">Status</div>
          <div className="data-value text-lg">{dossier.status.toUpperCase()}</div>
        </div>
        <div className="terminal-box">
          <div className="data-label mb-1">Classification</div>
          <div className="data-value text-lg">{dossier.classification.toUpperCase()}</div>
        </div>
        <div className="terminal-box">
          <div className="data-label mb-1">Targets</div>
          <div className="data-value text-lg">{targets.length}</div>
        </div>
        <div className="terminal-box">
          <div className="data-label mb-1">Last Updated</div>
          <div className="data-value text-sm">{new Date(dossier.updated_at).toLocaleDateString()}</div>
        </div>
      </div>

      {targets.length === 0 ? (
        <div className="terminal-box text-center py-12">
          <Globe className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-500 mb-4">NO TARGETS IN THIS DOSSIER</p>
          <button onClick={() => setShowCreateTarget(true)} className="terminal-button-primary">
            ADD FIRST TARGET
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            {'>'} TARGET SUBJECTS ({targets.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {targets.map((target) => (
              <TargetCard
                key={target.id}
                target={target}
                onClick={() => setSelectedTargetId(target.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
