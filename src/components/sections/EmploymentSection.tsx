import { useState, useEffect } from 'react';
import { Plus, Briefcase, Trash2 } from 'lucide-react';
import { supabase, type Employment } from '../../lib/supabase';

interface EmploymentSectionProps {
  targetId: string;
}

export default function EmploymentSection({ targetId }: EmploymentSectionProps) {
  const [records, setRecords] = useState<Employment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    record_type: 'employment',
    organization: '',
    position: '',
    location: '',
    start_date: '',
    end_date: '',
    current: false,
    verified: false,
    notes: '',
  });

  useEffect(() => {
    loadRecords();
  }, [targetId]);

  const loadRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('employment')
      .select('*')
      .eq('target_id', targetId)
      .order('start_date', { ascending: false });

    if (data) setRecords(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('employment').insert({
      target_id: targetId,
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    });

    if (!error) {
      setShowForm(false);
      setFormData({
        record_type: 'employment',
        organization: '',
        position: '',
        location: '',
        start_date: '',
        end_date: '',
        current: false,
        verified: false,
        notes: '',
      });
      loadRecords();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this record?')) {
      await supabase.from('employment').delete().eq('id', id);
      loadRecords();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {'>'} EMPLOYMENT & EDUCATION ({records.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="terminal-button-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>ADD RECORD</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-zinc-800 bg-black/50 p-4 mb-6 rounded-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="data-label block mb-2">Type</label>
              <select
                value={formData.record_type}
                onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="employment">Employment</option>
                <option value="education">Education</option>
              </select>
            </div>
            <div>
              <label className="data-label block mb-2">Organization</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="terminal-input w-full"
                required
                placeholder="Company or School"
              />
            </div>
            <div>
              <label className="data-label block mb-2">Position/Degree</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
              <label className="data-label block mb-2">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="terminal-input w-full"
              />
            </div>
            <div>
              <label className="data-label block mb-2">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="terminal-input w-full"
                disabled={formData.current}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.current}
                  onChange={(e) => setFormData({ ...formData, current: e.target.checked, end_date: '' })}
                  className="w-4 h-4"
                />
                <label className="data-label">Current</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="data-label">Verified</label>
              </div>
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
      ) : records.length === 0 ? (
        <p className="text-zinc-500">No employment/education records</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="border border-zinc-800 bg-black/30 p-4 rounded-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-zinc-200">{record.organization}</span>
                  <span className="status-badge status-active">{record.record_type.toUpperCase()}</span>
                  {record.current && <span className="status-badge status-classified">CURRENT</span>}
                  {record.verified && <span className="status-badge status-classified">VERIFIED</span>}
                </div>
                <button onClick={() => handleDelete(record.id)} className="terminal-button text-red-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                {record.position && (
                  <div className="col-span-2">
                    <div className="data-label">Position/Degree</div>
                    <div className="data-value">{record.position}</div>
                  </div>
                )}
                {record.location && (
                  <div>
                    <div className="data-label">Location</div>
                    <div className="data-value">{record.location}</div>
                  </div>
                )}
                <div>
                  <div className="data-label">Start Date</div>
                  <div className="data-value">{record.start_date ? new Date(record.start_date).toLocaleDateString() : 'ND'}</div>
                </div>
                <div>
                  <div className="data-label">End Date</div>
                  <div className="data-value">{record.current ? 'Current' : record.end_date ? new Date(record.end_date).toLocaleDateString() : 'ND'}</div>
                </div>
                {record.notes && (
                  <div className="col-span-3">
                    <div className="data-label">Notes</div>
                    <div className="text-zinc-200">{record.notes}</div>
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
