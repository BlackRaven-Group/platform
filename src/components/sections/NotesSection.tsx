import { useState, useEffect } from 'react';
import { Plus, FileText, Trash2, Edit2 } from 'lucide-react';
import { supabase, type IntelligenceNote } from '../../lib/supabase';

interface NotesSectionProps {
  targetId: string;
  dossierId: string;
}

export default function NotesSection({ targetId, dossierId }: NotesSectionProps) {
  const [notes, setNotes] = useState<IntelligenceNote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    category: 'observation',
    priority: 'medium',
    content: '',
    source: '',
  });

  useEffect(() => {
    loadNotes();
  }, [targetId]);

  const loadNotes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('intelligence_notes')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (data) setNotes(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const { error } = await supabase
        .from('intelligence_notes')
        .update(formData)
        .eq('id', editingId);

      if (!error) {
        setShowForm(false);
        setEditingId(null);
        resetForm();
        loadNotes();
      }
    } else {
      const { error } = await supabase.from('intelligence_notes').insert({
        dossier_id: dossierId,
        target_id: targetId,
        ...formData,
      });

      if (!error) {
        setShowForm(false);
        resetForm();
        loadNotes();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'observation',
      priority: 'medium',
      content: '',
      source: '',
    });
  };

  const handleEdit = (note: IntelligenceNote) => {
    setFormData({
      category: note.category || 'observation',
      priority: note.priority || 'medium',
      content: note.content,
      source: note.source || '',
    });
    setEditingId(note.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this note?')) {
      await supabase.from('intelligence_notes').delete().eq('id', id);
      loadNotes();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'status-critical';
      case 'high':
        return 'status-inactive';
      case 'medium':
        return 'status-active';
      case 'low':
        return 'border-green-800 bg-green-900/20 text-amber-600';
      default:
        return 'status-active';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {'>'} INTELLIGENCE NOTES ({notes.length})
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
          <span>ADD NOTE</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-zinc-800 bg-black/50 p-4 mb-6 rounded-sm">
          <h4 className="text-white font-bold mb-4">{editingId ? 'EDIT NOTE' : 'NEW NOTE'}</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="data-label block mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="observation">Observation</option>
                <option value="analysis">Analysis</option>
                <option value="source-intel">Source Intel</option>
                <option value="warning">Warning</option>
                <option value="update">Update</option>
              </select>
            </div>
            <div>
              <label className="data-label block mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="data-label block mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="terminal-input w-full"
                rows={4}
                required
                placeholder="Enter intelligence note content..."
              />
            </div>
            <div className="col-span-2">
              <label className="data-label block mb-2">Source</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="terminal-input w-full"
                placeholder="Intelligence source"
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
      ) : notes.length === 0 ? (
        <p className="text-zinc-500">No intelligence notes recorded</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="border border-zinc-800 bg-black/30 p-4 rounded-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span className="status-badge status-active">{note.category.toUpperCase()}</span>
                  <span className={`status-badge ${getPriorityColor(note.priority)}`}>
                    {note.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-green-800">
                    {new Date(note.created_at).toLocaleString()}
                  </span>
                  <button onClick={() => handleEdit(note)} className="terminal-button text-white hover:text-zinc-200">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(note.id)} className="terminal-button text-red-500 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-zinc-200 mb-3 whitespace-pre-wrap">{note.content}</div>
              {note.source && (
                <div className="text-sm">
                  <span className="data-label">Source:</span>{' '}
                  <span className="text-zinc-500">{note.source}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
