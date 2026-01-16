import { useState, useEffect } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';
import { supabase, type Connection } from '../../lib/supabase';

interface ConnectionsSectionProps {
  targetId: string;
}

export default function ConnectionsSection({ targetId }: ConnectionsSectionProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    connection_name: '',
    relationship_type: 'friend',
    relationship_details: '',
    strength: 5,
    verified: false,
    notes: '',
  });

  useEffect(() => {
    loadConnections();
  }, [targetId]);

  const loadConnections = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('connections')
      .select('*')
      .eq('target_id', targetId)
      .order('strength', { ascending: false });

    if (data) setConnections(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('connections').insert({
      target_id: targetId,
      ...formData,
    });

    if (!error) {
      setShowForm(false);
      setFormData({
        connection_name: '',
        relationship_type: 'friend',
        relationship_details: '',
        strength: 5,
        verified: false,
        notes: '',
      });
      loadConnections();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this connection?')) {
      await supabase.from('connections').delete().eq('id', id);
      loadConnections();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {'>'} CONNECTIONS ({connections.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="terminal-button-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>ADD CONNECTION</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-zinc-800 bg-black/50 p-4 mb-6 rounded-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="data-label block mb-2">Name</label>
              <input
                type="text"
                value={formData.connection_name}
                onChange={(e) => setFormData({ ...formData, connection_name: e.target.value })}
                className="terminal-input w-full"
                required
              />
            </div>
            <div>
              <label className="data-label block mb-2">Relationship Type</label>
              <select
                value={formData.relationship_type}
                onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="family">Family</option>
                <option value="friend">Friend</option>
                <option value="colleague">Colleague</option>
                <option value="associate">Associate</option>
                <option value="romantic">Romantic</option>
                <option value="enemy">Enemy</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="data-label block mb-2">Relationship Details</label>
              <input
                type="text"
                value={formData.relationship_details}
                onChange={(e) => setFormData({ ...formData, relationship_details: e.target.value })}
                className="terminal-input w-full"
                placeholder="e.g., Brother, Former colleague, etc."
              />
            </div>
            <div>
              <label className="data-label block mb-2">Connection Strength (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) })}
                className="terminal-input w-full"
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="data-label">Verified Connection</label>
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
            <button type="button" onClick={() => setShowForm(false)} className="terminal-button">
              CANCEL
            </button>
            <button type="submit" className="terminal-button-primary">
              SAVE
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : connections.length === 0 ? (
        <p className="text-zinc-500">No connections recorded</p>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div key={conn.id} className="border border-zinc-800 bg-black/30 p-4 rounded-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-zinc-200">{conn.connection_name}</span>
                  <span className="status-badge status-active">{conn.relationship_type.toUpperCase()}</span>
                  {conn.verified && <span className="status-badge status-classified">VERIFIED</span>}
                </div>
                <button onClick={() => handleDelete(conn.id)} className="terminal-button text-red-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {conn.relationship_details && (
                  <div className="col-span-2">
                    <div className="data-label">Details</div>
                    <div className="data-value">{conn.relationship_details}</div>
                  </div>
                )}
                <div>
                  <div className="data-label">Strength</div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-green-900/30 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full"
                        style={{ width: `${conn.strength * 10}%` }}
                      />
                    </div>
                    <span className="data-value text-xs">{conn.strength}/10</span>
                  </div>
                </div>
                {conn.notes && (
                  <div className="col-span-3">
                    <div className="data-label">Notes</div>
                    <div className="text-zinc-200">{conn.notes}</div>
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
