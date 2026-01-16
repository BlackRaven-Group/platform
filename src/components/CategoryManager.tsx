import { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Save, X, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCategories } from '../lib/mapPinsService';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  pin_type: string;
}

interface OtherPin {
  id: string;
  title: string;
  note: string;
  category: string;
}

interface CategoryManagerProps {
  onClose?: () => void;
  onUpdate?: () => void;
}

export default function CategoryManager({ onClose, onUpdate }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [otherPins, setOtherPins] = useState<OtherPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#64748b', icon: '📍' });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const cats = await getCategories();
    setCategories(cats);

    const { data: others } = await supabase
      .from('map_pins')
      .select('id, title, note, category')
      .eq('category', 'Other')
      .limit(50);

    setOtherPins(others || []);
    setLoading(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) return;

    const { error } = await supabase
      .from('map_categories')
      .insert([{ ...newCategory, pin_type: 'other' }]);

    if (!error) {
      setNewCategory({ name: '', color: '#64748b', icon: '📍' });
      setShowNewForm(false);
      await loadData();
      if (onUpdate) onUpdate();
    }
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase
      .from('map_categories')
      .update(updates)
      .eq('id', id);

    if (!error) {
      setEditingId(null);
      await loadData();
      if (onUpdate) onUpdate();
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Pins will be moved to "Other".`)) return;

    await supabase
      .from('map_pins')
      .update({ category: 'Other' })
      .eq('category', name);

    await supabase
      .from('map_categories')
      .delete()
      .eq('id', id);

    await loadData();
    if (onUpdate) onUpdate();
  };

  const handleRecategorizePin = async (pinId: string, newCategory: string) => {
    const { error } = await supabase
      .from('map_pins')
      .update({ category: newCategory })
      .eq('id', pinId);

    if (!error) {
      await loadData();
      if (onUpdate) onUpdate();
    }
  };

  const commonIcons = ['🎯', '🔒', '⚰️', '🚢', '🏭', '👤', '📍', '🏢', '🛡️', '⚡', '🌐', '🎖️', '🚁', '💼', '🔍'];
  const commonColors = [
    '#dc2626', '#2563eb', '#059669', '#7c2d12', '#9333ea', '#ea580c',
    '#0891b2', '#eab308', '#78350f', '#0c4a6e', '#991b1b', '#1e40af', '#475569'
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-900 rounded-lg p-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg shadow-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Category Manager</h2>
              <p className="text-sm text-slate-400">Manage categories and recategorize pins</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Categories ({categories.length})</h3>
              <button
                onClick={() => setShowNewForm(!showNewForm)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                New Category
              </button>
            </div>

            {showNewForm && (
              <div className="mb-4 p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    placeholder="Category name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {commonIcons.map(icon => (
                        <button
                          key={icon}
                          onClick={() => setNewCategory({ ...newCategory, icon })}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                            newCategory.icon === icon
                              ? 'bg-blue-600 ring-2 ring-blue-400'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {commonColors.map(color => (
                        <button
                          key={color}
                          onClick={() => setNewCategory({ ...newCategory, color })}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            newCategory.color === color ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateCategory}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-zinc-800 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Create
                  </button>
                  <button
                    onClick={() => setShowNewForm(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        {cat.icon}
                      </div>
                      <div>
                        <p className="font-medium text-white">{cat.name}</p>
                        <p className="text-xs text-slate-400">{cat.pin_type}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(cat.id)}
                        className="text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {cat.name !== 'Other' && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {otherPins.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">
                  Uncategorized Pins ({otherPins.length})
                </h3>
              </div>
              <div className="space-y-2">
                {otherPins.map(pin => (
                  <div
                    key={pin.id}
                    className="p-3 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{pin.title}</p>
                        <p className="text-sm text-slate-400 line-clamp-1">{pin.note}</p>
                      </div>
                      <select
                        onChange={(e) => handleRecategorizePin(pin.id, e.target.value)}
                        className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Move to...</option>
                        {categories.filter(c => c.name !== 'Other').map(cat => (
                          <option key={cat.id} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
