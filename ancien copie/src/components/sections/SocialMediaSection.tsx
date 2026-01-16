import { useState, useEffect } from 'react';
import { Plus, Globe, Trash2, ExternalLink, Edit2 } from 'lucide-react';
import { supabase, type SocialMedia } from '../../lib/supabase';

interface SocialMediaSectionProps {
  targetId: string;
}

export default function SocialMediaSection({ targetId }: SocialMediaSectionProps) {
  const [accounts, setAccounts] = useState<SocialMedia[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    platform: 'facebook',
    username: '',
    profile_url: '',
    follower_count: 0,
    status: 'active',
    notes: '',
  });

  useEffect(() => {
    loadAccounts();
  }, [targetId]);

  const loadAccounts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('social_media')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (data) setAccounts(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('social_media')
        .update(formData)
        .eq('id', editingId);

      if (!error) {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        loadAccounts();
      }
    } else {
      const { error } = await supabase.from('social_media').insert({
        target_id: targetId,
        ...formData,
      });

      if (!error) {
        setShowForm(false);
        resetForm();
        loadAccounts();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      platform: 'facebook',
      username: '',
      profile_url: '',
      follower_count: 0,
      status: 'active',
      notes: '',
    });
  };

  const handleEdit = (account: SocialMedia) => {
    setFormData({
      platform: account.platform,
      username: account.username || '',
      profile_url: account.profile_url || '',
      follower_count: account.follower_count || 0,
      status: account.status || 'active',
      notes: account.notes || '',
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this account?')) {
      await supabase.from('social_media').delete().eq('id', id);
      loadAccounts();
    }
  };

  const platforms = ['Facebook', 'Instagram', 'Twitter/X', 'LinkedIn', 'TikTok', 'Telegram', 'Discord', 'Reddit', 'YouTube', 'Other'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {'>'} SOCIAL MEDIA ACCOUNTS ({accounts.length})
        </h3>
        <button
          onClick={() => {
            if (showForm && !editingId) {
              setShowForm(false);
            } else {
              resetForm();
              setEditingId(null);
              setShowForm(true);
            }
          }}
          className="terminal-button-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>ADD ACCOUNT</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-zinc-800 bg-black/50 p-4 mb-6 rounded-sm">
          <h4 className="text-white font-bold mb-4">{editingId ? 'EDIT ACCOUNT' : 'NEW ACCOUNT'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="data-label block mb-2">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="terminal-input w-full"
              >
                {platforms.map(p => <option key={p} value={p.toLowerCase()}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="data-label block mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="terminal-input w-full"
                required
              />
            </div>
            <div>
              <label className="data-label block mb-2">Profile URL</label>
              <input
                type="url"
                value={formData.profile_url}
                onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Followers</label>
              <input
                type="number"
                value={formData.follower_count}
                onChange={(e) => setFormData({ ...formData, follower_count: parseInt(e.target.value) })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="data-label block mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="terminal-input w-full"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button type="button" onClick={() => {
              setShowForm(false);
              setEditingId(null);
              resetForm();
            }} className="terminal-button">
              CANCEL
            </button>
            <button type="submit" className="terminal-button-primary">
              {editingId ? 'UPDATE' : 'SAVE'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : accounts.length === 0 ? (
        <p className="text-zinc-500">No social media accounts recorded</p>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="border border-zinc-800 bg-black/30 p-4 rounded-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Globe className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-zinc-200">{account.platform.toUpperCase()}</span>
                  <span className={`status-badge ${account.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                    {account.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {account.profile_url && (
                    <a
                      href={account.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="terminal-button flex items-center space-x-1 text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>VISIT</span>
                    </a>
                  )}
                  <button onClick={() => handleEdit(account)} className="terminal-button text-white hover:text-zinc-200">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(account.id)} className="terminal-button text-red-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="data-label">Username</div>
                  <div className="data-value">@{account.username}</div>
                </div>
                <div>
                  <div className="data-label">Followers</div>
                  <div className="data-value">{account.follower_count.toLocaleString()}</div>
                </div>
                {account.notes && (
                  <div className="col-span-3">
                    <div className="data-label">Notes</div>
                    <div className="text-zinc-200">{account.notes}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
