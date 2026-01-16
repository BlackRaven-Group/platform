import { useState, useEffect } from 'react';
import { Plus, MapPin, Trash2, ExternalLink, Edit2 } from 'lucide-react';
import { supabase, type Address } from '../../lib/supabase';

interface AddressSectionProps {
  targetId: string;
}

export default function AddressSection({ targetId }: AddressSectionProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    address_type: 'residence',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    latitude: '',
    longitude: '',
    notes: '',
  });

  useEffect(() => {
    loadAddresses();
  }, [targetId]);

  const loadAddresses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (data) setAddresses(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('addresses')
        .update(submitData)
        .eq('id', editingId);

      if (!error) {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        loadAddresses();
      }
    } else {
      const { error } = await supabase.from('addresses').insert({
        target_id: targetId,
        ...submitData,
      });

      if (!error) {
        setShowForm(false);
        resetForm();
        loadAddresses();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      address_type: 'residence',
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      latitude: '',
      longitude: '',
      notes: '',
    });
  };

  const handleEdit = (address: Address) => {
    setFormData({
      address_type: address.address_type || 'residence',
      street_address: address.street_address || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || '',
      country: address.country || '',
      latitude: address.latitude?.toString() || '',
      longitude: address.longitude?.toString() || '',
      notes: address.notes || '',
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this address?')) {
      await supabase.from('addresses').delete().eq('id', id);
      loadAddresses();
    }
  };

  const getMapUrl = (address: Address) => {
    if (address.latitude && address.longitude) {
      return `https://www.google.com/maps?q=${address.latitude},${address.longitude}`;
    }
    const query = `${address.street_address} ${address.city} ${address.state} ${address.country}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {'>'} KNOWN LOCATIONS ({addresses.length})
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
          <span>ADD LOCATION</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-zinc-800 bg-black/50 p-4 mb-6 rounded-sm">
          <h4 className="text-white font-bold mb-4">{editingId ? 'EDIT LOCATION' : 'NEW LOCATION'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="data-label block mb-2">Type</label>
              <select
                value={formData.address_type}
                onChange={(e) => setFormData({ ...formData, address_type: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="residence">Residence</option>
                <option value="work">Work</option>
                <option value="temporary">Temporary</option>
                <option value="known-location">Known Location</option>
              </select>
            </div>
            <div>
              <label className="data-label block mb-2">Street Address</label>
              <input
                type="text"
                value={formData.street_address}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                className="terminal-input w-full"
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className="data-label block mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">State/Province</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Postal Code</label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Latitude</label>
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="terminal-input w-full"
                placeholder="40.7128"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Longitude</label>
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="terminal-input w-full"
                placeholder="-74.0060"
              />
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
      ) : addresses.length === 0 ? (
        <p className="text-zinc-500">No locations recorded</p>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div key={address.id} className="border border-zinc-800 bg-black/30 p-4 rounded-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <span className="status-badge status-active">{address.address_type.toUpperCase()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={getMapUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="terminal-button flex items-center space-x-1 text-xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>MAP</span>
                  </a>
                  <button onClick={() => handleEdit(address)} className="terminal-button text-white hover:text-zinc-200">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(address.id)} className="terminal-button text-red-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {address.street_address && (
                  <div>
                    <div className="data-label">Street</div>
                    <div className="data-value">{address.street_address}</div>
                  </div>
                )}
                {address.city && (
                  <div>
                    <div className="data-label">City</div>
                    <div className="data-value">{address.city}</div>
                  </div>
                )}
                {address.state && (
                  <div>
                    <div className="data-label">State</div>
                    <div className="data-value">{address.state}</div>
                  </div>
                )}
                {address.country && (
                  <div>
                    <div className="data-label">Country</div>
                    <div className="data-value">{address.country}</div>
                  </div>
                )}
                {address.latitude && address.longitude && (
                  <div className="col-span-2">
                    <div className="data-label">Coordinates</div>
                    <div className="data-value">{address.latitude}, {address.longitude}</div>
                  </div>
                )}
                {address.notes && (
                  <div className="col-span-2">
                    <div className="data-label">Notes</div>
                    <div className="text-zinc-200">{address.notes}</div>
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
