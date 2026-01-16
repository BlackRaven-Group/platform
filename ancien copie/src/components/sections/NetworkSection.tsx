import { useState, useEffect } from 'react';
import { Plus, Wifi, Trash2 } from 'lucide-react';
import { supabase, type NetworkData } from '../../lib/supabase';

interface NetworkSectionProps {
  targetId: string;
}

export default function NetworkSection({ targetId }: NetworkSectionProps) {
  const [networkData, setNetworkData] = useState<NetworkData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    ip_address: '',
    ip_type: 'unknown',
    isp: 'ND',
    location: 'ND',
    confidence: 'medium',
    notes: '',
  });

  useEffect(() => {
    loadNetworkData();
  }, [targetId]);

  const loadNetworkData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('network_data')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (data) setNetworkData(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('network_data').insert({
      target_id: targetId,
      ...formData,
    });

    if (!error) {
      setShowForm(false);
      setFormData({
        ip_address: '',
        ip_type: 'unknown',
        isp: 'ND',
        location: 'ND',
        confidence: 'medium',
        notes: '',
      });
      loadNetworkData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this network record?')) {
      await supabase.from('network_data').delete().eq('id', id);
      loadNetworkData();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {'>'} NETWORK DATA ({networkData.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="terminal-button-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>ADD IP</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-zinc-800 bg-black/50 p-4 mb-6 rounded-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="data-label block mb-2">IP Address</label>
              <input
                type="text"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                className="terminal-input w-full"
                required
                placeholder="192.168.1.1"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Type</label>
              <select
                value={formData.ip_type}
                onChange={(e) => setFormData({ ...formData, ip_type: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="unknown">Unknown</option>
                <option value="static">Static</option>
                <option value="dynamic">Dynamic</option>
                <option value="vpn">VPN</option>
                <option value="proxy">Proxy</option>
                <option value="tor">TOR</option>
              </select>
            </div>
            <div>
              <label className="data-label block mb-2">ISP</label>
              <input
                type="text"
                value={formData.isp}
                onChange={(e) => setFormData({ ...formData, isp: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Confidence</label>
              <select
                value={formData.confidence}
                onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
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
      ) : networkData.length === 0 ? (
        <p className="text-zinc-500">No network data recorded</p>
      ) : (
        <div className="space-y-3">
          {networkData.map((net) => (
            <div key={net.id} className="border border-zinc-800 bg-black/30 p-4 rounded-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-zinc-200 font-mono">{net.ip_address}</span>
                  <span className="status-badge status-active">{net.ip_type.toUpperCase()}</span>
                  <span className={`status-badge ${
                    net.confidence === 'high' ? 'status-active' :
                    net.confidence === 'medium' ? 'status-inactive' : 'status-critical'
                  }`}>
                    {net.confidence.toUpperCase()} CONFIDENCE
                  </span>
                </div>
                <button onClick={() => handleDelete(net.id)} className="terminal-button text-red-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="data-label">ISP</div>
                  <div className="data-value">{net.isp}</div>
                </div>
                <div>
                  <div className="data-label">Location</div>
                  <div className="data-value">{net.location}</div>
                </div>
                <div>
                  <div className="data-label">Last Seen</div>
                  <div className="data-value">{new Date(net.last_seen).toLocaleDateString()}</div>
                </div>
                {net.notes && (
                  <div className="col-span-3">
                    <div className="data-label">Notes</div>
                    <div className="text-zinc-200">{net.notes}</div>
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
