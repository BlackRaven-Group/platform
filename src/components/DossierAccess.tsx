import { useState, useEffect } from 'react';
import { Lock, AlertTriangle, Skull } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { verifyCode } from '../lib/codename';
import DossierView from './DossierView';

interface DossierAccessProps {
  dossierId: string;
  codeName: string;
  onBack: () => void;
  onDeleted: () => void;
}

export default function DossierAccess({ dossierId, codeName, onBack, onDeleted }: DossierAccessProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [unlocked, setUnlocked] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    loadAttempts();
  }, [dossierId]);

  const loadAttempts = async () => {
    const { data } = await supabase
      .from('dossiers')
      .select('failed_attempts, is_locked')
      .eq('id', dossierId)
      .maybeSingle();

    if (data) {
      setAttemptsLeft(5 - (data.failed_attempts || 0));
      if (data.is_locked) {
        setError('LOCKED');
      }
    }
  };

  const deleteDossierPermanently = async () => {
    await supabase.from('intelligence_notes').delete().eq('target_id', dossierId);
    await supabase.from('social_media').delete().eq('target_id', dossierId);
    await supabase.from('network_data').delete().eq('target_id', dossierId);
    await supabase.from('credentials').delete().eq('target_id', dossierId);
    await supabase.from('addresses').delete().eq('target_id', dossierId);
    await supabase.from('media').delete().eq('target_id', dossierId);
    await supabase.from('employment').delete().eq('target_id', dossierId);
    await supabase.from('connections').delete().eq('target_id', dossierId);

    const { data: targets } = await supabase
      .from('targets')
      .select('id')
      .eq('dossier_id', dossierId);

    if (targets) {
      for (const target of targets) {
        await supabase.from('intelligence_notes').delete().eq('target_id', target.id);
        await supabase.from('social_media').delete().eq('target_id', target.id);
        await supabase.from('network_data').delete().eq('target_id', target.id);
        await supabase.from('credentials').delete().eq('target_id', target.id);
        await supabase.from('addresses').delete().eq('target_id', target.id);
        await supabase.from('media').delete().eq('target_id', target.id);
        await supabase.from('employment').delete().eq('target_id', target.id);
        await supabase.from('connections').delete().eq('target_id', target.id);
      }
      await supabase.from('targets').delete().eq('dossier_id', dossierId);
    }

    await supabase.from('osint_searches').delete().eq('dossier_id', dossierId);
    await supabase.from('dossiers').delete().eq('id', dossierId);

    setDeleted(true);
    setTimeout(() => {
      onDeleted();
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || loading) return;

    setLoading(true);
    setError('');

    const { data: dossier } = await supabase
      .from('dossiers')
      .select('access_code, failed_attempts, is_locked')
      .eq('id', dossierId)
      .maybeSingle();

    if (!dossier || dossier.is_locked) {
      setError('LOCKED');
      setLoading(false);
      return;
    }

    const isValid = await verifyCode(code, dossier.access_code);

    if (isValid) {
      await supabase
        .from('dossiers')
        .update({ failed_attempts: 0 })
        .eq('id', dossierId);

      setUnlocked(true);
    } else {
      const newAttempts = (dossier.failed_attempts || 0) + 1;
      const remaining = 5 - newAttempts;

      if (remaining <= 0) {
        // Silent deletion after 5 failed attempts
        await deleteDossierPermanently();
      } else {
        await supabase
          .from('dossiers')
          .update({
            failed_attempts: newAttempts,
            is_locked: remaining === 0
          })
          .eq('id', dossierId);

        setAttemptsLeft(remaining);
        setError(`INVALID CODE - ${remaining} ATTEMPT(S) REMAINING`);
      }
    }

    setCode('');
    setLoading(false);
  };

  if (deleted) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="terminal-box max-w-md border-red-900 bg-red-950/30 text-center">
          <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-500 mb-2">DOSSIER DELETED</h2>
          <p className="text-red-400 text-sm">All data permanently destroyed</p>
        </div>
      </div>
    );
  }

  if (unlocked) {
    return <DossierView dossierId={dossierId} onBack={onBack} />;
  }

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="terminal-box max-w-md">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-zinc-800">
          <Lock className="w-8 h-8 text-white" />
          <div>
            <div className="text-zinc-200 font-bold font-mono text-xl">{codeName}</div>
            <div className="text-xs text-zinc-500">SECURED DOSSIER</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="data-label block mb-2">ACCESS CODE</label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              placeholder="••••••"
              className="terminal-input w-full text-center text-2xl tracking-widest font-mono"
              autoFocus
              disabled={loading || error === 'LOCKED'}
            />
          </div>

          {error && (
            <div className={`border-2 p-4 ${
              error === 'LOCKED' ? 'border-red-900 bg-red-950/30' : 'border-yellow-900 bg-yellow-950/30'
            }`}>
              <div className="flex items-center space-x-2">
                {error === 'LOCKED' ? (
                  <Skull className="w-5 h-5 text-red-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                <span className={error === 'LOCKED' ? 'text-red-400' : 'text-yellow-400'}>{error}</span>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-zinc-500">
            {attemptsLeft > 0 ? (
              <span>{attemptsLeft} attempt(s) remaining</span>
            ) : (
              <span className="text-red-500">NO ATTEMPTS REMAINING</span>
            )}
          </div>

          <div className="flex space-x-3">
            <button type="button" onClick={onBack} className="terminal-button flex-1">
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || !code || error === 'LOCKED'}
              className="terminal-button-primary flex-1"
            >
              {loading ? 'VERIFYING...' : 'UNLOCK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
