import { useState } from 'react';
import { ArrowLeft, Save, FolderPlus, RefreshCw, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { generateCodeName, generateAccessCode, hashCode } from '../lib/codename';

interface CreateDossierProps {
  onBack: () => void;
}

export default function CreateDossier({ onBack }: CreateDossierProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [codeName, setCodeName] = useState(generateCodeName());
  const [accessCode, setAccessCode] = useState('');
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleGenerateCodeName = () => {
    setCodeName(generateCodeName());
  };

  const handleGenerateAccessCode = () => {
    const code = generateAccessCode();
    setAccessCode(code);
    setUseCustomCode(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Non authentifié');
      setSaving(false);
      return;
    }

    const finalAccessCode = useCustomCode && accessCode ? accessCode : generateAccessCode();
    const hashedAccessCode = await hashCode(finalAccessCode);

    const { error } = await supabase
      .from('dossiers')
      .insert({
        title,
        description,
        code_name: codeName,
        access_code: hashedAccessCode,
        classification: 'confidential',
        status: 'active',
        failed_attempts: 0,
        is_locked: false,
        user_id: user.id
      });

    if (!error) {
      setGeneratedCode(finalAccessCode);
    } else {
      alert('Erreur lors de la création du dossier');
      setSaving(false);
    }
  };

  if (generatedCode) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-mono">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {'>'} DOSSIER CRÉÉ
          </h2>
        </div>

        <div className="terminal-box max-w-2xl border-white bg-zinc-900/30">
          <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white">
            <Key className="w-8 h-8 text-white" />
            <span className="text-zinc-200 font-semibold">CODE D'ACCÈS</span>
          </div>

          <div className="space-y-4">
            <div className="bg-black border-2 border-white p-6 text-center">
              <div className="text-xs text-zinc-500 mb-2">NOM DE CODE</div>
              <div className="text-2xl font-bold text-zinc-200 mb-4 font-mono">{codeName}</div>

              <div className="text-xs text-zinc-500 mb-2">CODE D'ACCÈS</div>
              <div className="text-4xl font-bold text-white tracking-wider font-mono">{generatedCode}</div>
            </div>

            <div className="bg-red-950/30 border-2 border-red-900 p-4 text-red-400 text-sm">
              <div className="font-bold mb-2">⚠️ AVERTISSEMENT DE SÉCURITÉ</div>
              <ul className="space-y-1 text-xs">
                <li>• Conservez ce code en lieu sûr - il ne sera PLUS affiché</li>
                <li>• 5 tentatives d'accès échouées supprimeront définitivement ce dossier</li>
                <li>• Aucune récupération possible après suppression</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-zinc-800">
            <button onClick={onBack} className="terminal-button-primary">
              COMPRIS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="terminal-button">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {'>'} NOUVEAU DOSSIER
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="terminal-box max-w-2xl">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-zinc-800">
          <FolderPlus className="w-8 h-8 text-amber-600" />
          <span className="text-white font-semibold">INITIALISATION</span>
        </div>

        <div className="space-y-6">
          <div>
            <label className="data-label block mb-2">Référence Interne</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Usage interne uniquement..."
              className="terminal-input w-full"
            />
          </div>

          <div>
            <label className="data-label block mb-2">Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes internes..."
              rows={3}
              className="terminal-input w-full resize-none"
            />
          </div>

          <div>
            <label className="data-label block mb-2">Nom de Code</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={codeName}
                onChange={(e) => setCodeName(e.target.value.toUpperCase())}
                required
                className="terminal-input flex-1 font-mono font-bold"
              />
              <button
                type="button"
                onClick={handleGenerateCodeName}
                className="terminal-button flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="data-label block mb-2">Code d'Accès (Optionnel)</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setUseCustomCode(true);
                }}
                placeholder="Auto-généré si vide"
                className="terminal-input flex-1 font-mono"
                maxLength={6}
              />
              <button
                type="button"
                onClick={handleGenerateAccessCode}
                className="terminal-button flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-zinc-500 mt-1">Code numérique à 6 chiffres</div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-zinc-800">
          <button type="button" onClick={onBack} className="terminal-button">
            ANNULER
          </button>
          <button
            type="submit"
            disabled={saving || !title || !codeName}
            className="terminal-button-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'CRÉATION...' : 'CRÉER'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
