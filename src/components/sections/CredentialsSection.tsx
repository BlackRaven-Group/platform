import { useState, useEffect } from 'react';
import { Plus, Key, Trash2, Eye, EyeOff, Edit2 } from 'lucide-react';
import { supabase, type Credential } from '../../lib/supabase';
import { encryptPassword, decryptPassword, hashPassword } from '../../lib/crypto';

interface CredentialsSectionProps {
  targetId: string;
}

export default function CredentialsSection({ targetId }: CredentialsSectionProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    service: '',
    username: '',
    email: '',
    password: '',
    password_hash: '',
    status: 'unknown',
    notes: '',
  });

  useEffect(() => {
    loadCredentials();
  }, [targetId]);

  const loadCredentials = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('credentials')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (data) setCredentials(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const updateData: any = {
        service: formData.service,
        username: formData.username,
        email: formData.email,
        password_hash: formData.password_hash,
        status: formData.status,
        notes: formData.notes,
      };

      if (formData.password) {
        updateData.password_encrypted = encryptPassword(formData.password);
        if (!formData.password_hash) {
          updateData.password_hash = hashPassword(formData.password);
        }
      }

      const { error } = await supabase
        .from('credentials')
        .update(updateData)
        .eq('id', editingId);

      if (!error) {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        loadCredentials();
      }
    } else {
      const insertData: any = {
        target_id: targetId,
        service: formData.service,
        username: formData.username,
        email: formData.email,
        status: formData.status,
        notes: formData.notes,
        password_hash: formData.password_hash,
      };

      if (formData.password) {
        insertData.password_encrypted = encryptPassword(formData.password);
        if (!formData.password_hash) {
          insertData.password_hash = hashPassword(formData.password);
        }
      }

      const { error } = await supabase.from('credentials').insert(insertData);

      if (!error) {
        setShowForm(false);
        resetForm();
        loadCredentials();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      service: '',
      username: '',
      email: '',
      password: '',
      password_hash: '',
      status: 'unknown',
      notes: '',
    });
  };

  const handleEdit = (cred: Credential) => {
    setFormData({
      service: cred.service,
      username: cred.username || '',
      email: cred.email || '',
      password: '',
      password_hash: cred.password_hash || '',
      status: cred.status || 'unknown',
      notes: cred.notes || '',
    });
    setEditingId(cred.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this credential?')) {
      await supabase.from('credentials').delete().eq('id', id);
      loadCredentials();
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {'>'} CREDENTIALS ({credentials.length})
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
          <span>ADD CREDENTIAL</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-zinc-800 bg-black/50 p-4 mb-6 rounded-sm">
          <h4 className="text-white font-bold mb-4">{editingId ? 'EDIT CREDENTIAL' : 'NEW CREDENTIAL'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="data-label block mb-2">Service</label>
              <input
                type="text"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                className="terminal-input w-full"
                required
                placeholder="Gmail, Facebook, etc."
              />
            </div>
            <div>
              <label className="data-label block mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Password</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Password Hash</label>
              <input
                type="text"
                value={formData.password_hash}
                onChange={(e) => setFormData({ ...formData, password_hash: e.target.value })}
                className="terminal-input w-full"
                placeholder="Bcrypt, SHA256, etc."
              />
            </div>
            <div>
              <label className="data-label block mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="unknown">Unknown</option>
                <option value="valid">Valid</option>
                <option value="expired">Expired</option>
                <option value="changed">Changed</option>
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
      ) : credentials.length === 0 ? (
        <p className="text-zinc-500">No credentials recorded</p>
      ) : (
        <div className="space-y-3">
          {credentials.map((cred) => (
            <div key={cred.id} className="border border-zinc-800 bg-black/30 p-4 rounded-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Key className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-zinc-200">{cred.service}</span>
                  <span className={`status-badge ${cred.status === 'valid' ? 'status-active' : 'status-inactive'}`}>
                    {cred.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(cred)} className="terminal-button text-white hover:text-zinc-200">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cred.id)} className="terminal-button text-red-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {cred.username && (
                  <div>
                    <div className="data-label">Username</div>
                    <div className="data-value">{cred.username}</div>
                  </div>
                )}
                {cred.email && (
                  <div>
                    <div className="data-label">Email</div>
                    <div className="data-value">{cred.email}</div>
                  </div>
                )}
                {cred.password_encrypted && (
                  <div>
                    <div className="data-label">Password (Encrypted)</div>
                    <div className="flex items-center space-x-2">
                      <div className="data-value flex-1">
                        {visiblePasswords.has(cred.id)
                          ? decryptPassword(cred.password_encrypted)
                          : '••••••••••'}
                      </div>
                      <button
                        onClick={() => togglePasswordVisibility(cred.id)}
                        className="terminal-button"
                      >
                        {visiblePasswords.has(cred.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                )}
                {cred.password_hash && (
                  <div>
                    <div className="data-label">Password Hash</div>
                    <div className="data-value text-xs">{cred.password_hash}</div>
                  </div>
                )}
                {cred.notes && (
                  <div className="col-span-2">
                    <div className="data-label">Notes</div>
                    <div className="text-zinc-200">{cred.notes}</div>
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
