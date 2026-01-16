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
      alert('Not authenticated');
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
      alert('Error creating dossier');
      setSaving(false);
    }
  };

  if (generatedCode) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {'>'} DOSSIER CREATED
          </h2>
        </div>

        <div className="terminal-box max-w-2xl border-white bg-zinc-900/30">
          <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white">
            <Key className="w-8 h-8 text-white" />
            <span className="text-zinc-200 font-semibold">ACCESS CODE</span>
          </div>

          <div className="space-y-4">
            <div className="bg-black border-2 border-white p-6 text-center">
              <div className="text-xs text-zinc-500 mb-2">CODE NAME</div>
              <div className="text-2xl font-bold text-zinc-200 mb-4 font-mono">{codeName}</div>

              <div className="text-xs text-zinc-500 mb-2">ACCESS CODE</div>
              <div className="text-4xl font-bold text-white tracking-wider font-mono">{generatedCode}</div>
            </div>

            <div className="bg-red-950/30 border-2 border-red-900 p-4 text-red-400 text-sm">
              <div className="font-bold mb-2">⚠️ SECURITY WARNING</div>
              <ul className="space-y-1 text-xs">
                <li>• Store this code securely - it will NOT be shown again</li>
                <li>• 5 failed access attempts will permanently delete this dossier</li>
                <li>• No recovery possible after deletion</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-zinc-800">
            <button onClick={onBack} className="terminal-button-primary">
              ACKNOWLEDGED
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="terminal-button">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {'>'} NEW DOSSIER
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="terminal-box max-w-2xl">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-zinc-800">
          <FolderPlus className="w-8 h-8 text-amber-600" />
          <span className="text-white font-semibold">INITIALIZATION</span>
        </div>

        <div className="space-y-6">
          <div>
            <label className="data-label block mb-2">Internal Reference</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Internal use only..."
              className="terminal-input w-full"
            />
          </div>

          <div>
            <label className="data-label block mb-2">Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Internal notes..."
              rows={3}
              className="terminal-input w-full resize-none"
            />
          </div>

          <div>
            <label className="data-label block mb-2">Code Name</label>
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
            <label className="data-label block mb-2">Access Code (Optional)</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setUseCustomCode(true);
                }}
                placeholder="Auto-generated if empty"
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
            <div className="text-xs text-zinc-500 mt-1">6-digit numeric code</div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-zinc-800">
          <button type="button" onClick={onBack} className="terminal-button">
            CANCEL
          </button>
          <button
            type="submit"
            disabled={saving || !title || !codeName}
            className="terminal-button-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'CREATING...' : 'CREATE'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
