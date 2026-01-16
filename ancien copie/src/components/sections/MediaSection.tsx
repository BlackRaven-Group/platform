import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { supabase, type MediaFile } from '../../lib/supabase';

interface MediaSectionProps {
  targetId: string;
}

export default function MediaSection({ targetId }: MediaSectionProps) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    file_type: 'photo',
    file_url: '',
    title: '',
    description: '',
    source: '',
    tags: '',
    files: [] as File[],
  });

  useEffect(() => {
    loadMedia();
  }, [targetId]);

  const loadMedia = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('media_files')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });

    if (data) setMedia(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);

    try {
      for (let i = 0; i < formData.files.length; i++) {
        const file = formData.files[i];

        const fileExt = file.name.split('.').pop();
        const fileName = `${targetId}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('target-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('target-images')
          .getPublicUrl(filePath);

        if (urlData.publicUrl) {
          await supabase.from('media_files').insert({
            target_id: targetId,
            file_type: formData.file_type,
            file_url: urlData.publicUrl,
            title: formData.title || file.name.replace(/\.[^/.]+$/, ''),
            description: formData.description,
            source: formData.source,
            tags: tagsArray,
          });
        }
      }

      setShowForm(false);
      setFormData({
        file_type: 'photo',
        file_url: '',
        title: '',
        description: '',
        source: '',
        tags: '',
        files: [],
      });
      loadMedia();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Failed to upload media files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this media file?')) {
      await supabase.from('media_files').delete().eq('id', id);
      loadMedia();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 5 * 1024 * 1024) return false;
      return true;
    });

    setFormData({ ...formData, files: fileArray });
    event.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          {'>'} MEDIA FILES ({media.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="terminal-button-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>ADD MEDIA</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border-2 border-zinc-800 bg-black/50 p-4 mb-6 rounded-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="data-label block mb-2">File Type</label>
              <select
                value={formData.file_type}
                onChange={(e) => setFormData({ ...formData, file_type: e.target.value })}
                className="terminal-input w-full"
              >
                <option value="photo">Photo</option>
                <option value="screenshot">Screenshot</option>
                <option value="satellite-image">Satellite Image</option>
                <option value="document">Document</option>
                <option value="video">Video</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="data-label block mb-2">Upload Images</label>
              <label className="terminal-button cursor-pointer flex items-center justify-center space-x-2 w-full">
                <Upload className="w-4 h-4" />
                <span>{formData.files.length > 0 ? `${formData.files.length} SELECTED` : 'SELECT FILES'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <label className="data-label block mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
              <label className="data-label block mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="terminal-input w-full"
                rows={2}
              />
            </div>
            <div className="col-span-2">
              <label className="data-label block mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="terminal-input w-full"
                placeholder="Comma-separated tags"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button type="button" onClick={() => setShowForm(false)} className="terminal-button">
              CANCEL
            </button>
            <button type="submit" disabled={uploading || formData.files.length === 0} className="terminal-button-primary">
              {uploading ? 'UPLOADING...' : 'SAVE'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : media.length === 0 ? (
        <p className="text-zinc-500">No media files recorded</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((file) => (
            <div key={file.id} className="border border-zinc-800 bg-black/30 rounded-sm overflow-hidden">
              {file.file_type === 'photo' || file.file_type === 'screenshot' || file.file_type === 'satellite-image' ? (
                <img
                  src={file.file_url}
                  alt={file.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23001a00" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23003300"%3EIMAGE%3C/text%3E%3C/svg%3E';
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-green-900/20 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-zinc-500" />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="status-badge status-active">{file.file_type.toUpperCase()}</span>
                  <button onClick={() => handleDelete(file.id)} className="terminal-button text-red-500 hover:text-red-400 text-xs">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {file.title && (
                  <div className="font-bold text-zinc-200 mb-1 text-sm">{file.title}</div>
                )}
                {file.description && (
                  <div className="text-xs text-zinc-500 mb-2 line-clamp-2">{file.description}</div>
                )}
                {file.source && (
                  <div className="text-xs text-green-800">Source: {file.source}</div>
                )}
                {file.tags && file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {file.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 bg-green-900/30 border border-zinc-800 rounded-sm">
                        {tag}
                      </span>
                    ))}
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
