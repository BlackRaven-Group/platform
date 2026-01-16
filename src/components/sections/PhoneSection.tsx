import { useState, useEffect } from 'react';
import { Plus, Phone, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import { supabase, type PhoneNumber } from '../../lib/supabase';

interface PhoneSectionProps {
  targetId: string;
}

export default function PhoneSection({ targetId }: PhoneSectionProps) {
  const [phones, setPhones] = useState<PhoneNumber[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    phone_number: '',
    number_type: 'unknown',
    country_code: '',
    carrier: '',
    verified: false,
    status: 'unknown',
    strength: 5,
    last_seen: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    loadPhones();
  }, [targetId]);

  const loadPhones = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (data) setPhones(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      last_seen: formData.last_seen || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('phone_numbers')
        .update(payload)
        .eq('id', editingId);

      if (!error) {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        loadPhones();
      }
    } else {
      const { error } = await supabase.from('phone_numbers').insert({
        target_id: targetId,
        ...payload,
      });

      if (!error) {
        setShowForm(false);
        resetForm();
        loadPhones();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      phone_number: '',
      number_type: 'unknown',
      country_code: '',
      carrier: '',
      verified: false,
      status: 'unknown',
      strength: 5,
      last_seen: '',
      source: '',
      notes: '',
    });
  };

  const handleEdit = (phone: PhoneNumber) => {
    setFormData({
      phone_number: phone.phone_number,
      number_type: phone.number_type,
      country_code: phone.country_code || '',
      carrier: phone.carrier || '',
      verified: phone.verified,
      status: phone.status,
      strength: phone.strength,
      last_seen: phone.last_seen ? phone.last_seen.split('T')[0] : '',
      source: phone.source || '',
      notes: phone.notes || '',
    });
    setEditingId(phone.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this phone number?')) {
      await supabase.from('phone_numbers').delete().eq('id', id);
      loadPhones();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'disconnected':
        return 'status-critical';
      default:
        return 'border-green-800 bg-green-900/20 text-amber-600';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {'>'} PHONE NUMBERS ({phones.length})
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
          <span>ADD PHONE</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-zinc-800 bg-black/50 p-4 mb-6 rounded-sm">
          <h4 className="text-white font-bold mb-4">{editingId ? 'EDIT PHONE' : 'NEW PHONE'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="data-label block mb-2">Phone Number *</label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="terminal-input w-full"
                required
                placeholder="+1234567890"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Number Type</label>
              <select
                value={formData.number_type}
                onChange={(e) => setFormData({ ...formData, number_type: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="unknown">Unknown</option>
                <option value="mobile">Mobile</option>
                <option value="landline">Landline</option>
                <option value="voip">VoIP</option>
              </select>
            </div>
            <div>
              <label className="data-label block mb-2">Country Code</label>
              <input
                type="text"
                value={formData.country_code}
                onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                className="terminal-input w-full"
                placeholder="US, UK, etc."
              />
            </div>
            <div>
              <label className="data-label block mb-2">Carrier</label>
              <input
                type="text"
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="terminal-input w-full"
                placeholder="Verizon, AT&T, etc."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="disconnected">Disconnected</option>
              </select>
            </div>
            <div>
              <label className="data-label block mb-2">Strength (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) || 5 })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Last Seen</label>
              <input
                type="date"
                value={formData.last_seen}
                onChange={(e) => setFormData({ ...formData, last_seen: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="terminal-input w-full"
                placeholder="Where this was obtained"
              />
            </div>
            <div className="col-span-2">
              <label className="data-label block mb-2">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  className="mr-2"
                />
                Verified
              </label>
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
      ) : phones.length === 0 ? (
        <p className="text-zinc-500">No phone numbers recorded</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phones.map((phone) => (
            <div key={phone.id} className="border border-zinc-800 bg-black/30 p-4 rounded-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-amber-600" />
                  {phone.verified ? (
                    <CheckCircle className="w-4 h-4 text-white" />
                  ) : (
                    <XCircle className="w-4 h-4 text-zinc-500" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleEdit(phone)} className="terminal-button text-white hover:text-zinc-200">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(phone.id)} className="terminal-button text-red-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="font-mono text-lg text-zinc-200 mb-2">{phone.phone_number}</div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="status-badge status-active">{phone.number_type.toUpperCase()}</span>
                <span className={`status-badge ${getStatusColor(phone.status)}`}>
                  {phone.status.toUpperCase()}
                </span>
                <span className="status-badge border-green-800 bg-green-900/20 text-amber-600">
                  STRENGTH: {phone.strength}/10
                </span>
              </div>

              <div className="space-y-1 text-sm">
                {phone.country_code && (
                  <div>
                    <span className="data-label">Country:</span>{' '}
                    <span className="text-zinc-500">{phone.country_code}</span>
                  </div>
                )}
                {phone.carrier && (
                  <div>
                    <span className="data-label">Carrier:</span>{' '}
                    <span className="text-zinc-500">{phone.carrier}</span>
                  </div>
                )}
                {phone.last_seen && (
                  <div>
                    <span className="data-label">Last Seen:</span>{' '}
                    <span className="text-zinc-500">{new Date(phone.last_seen).toLocaleDateString()}</span>
                  </div>
                )}
                {phone.source && (
                  <div>
                    <span className="data-label">Source:</span>{' '}
                    <span className="text-zinc-500">{phone.source}</span>
                  </div>
                )}
                {phone.notes && (
                  <div>
                    <span className="data-label">Notes:</span>{' '}
                    <span className="text-zinc-500">{phone.notes}</span>
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
