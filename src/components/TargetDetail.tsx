import { useState, useEffect } from 'react';
import { ArrowLeft, User, MapPin, Globe, Key, Wifi, Users, Briefcase, Image, FileText, Edit3, Save, Upload, X, Phone } from 'lucide-react';
import { supabase, type Target } from '../lib/supabase';
import AddressSection from './sections/AddressSection';
import SocialMediaSection from './sections/SocialMediaSection';
import CredentialsSection from './sections/CredentialsSection';
import NetworkSection from './sections/NetworkSection';
import ConnectionsSection from './sections/ConnectionsSection';
import EmploymentSection from './sections/EmploymentSection';
import MediaSection from './sections/MediaSection';
import NotesSection from './sections/NotesSection';
import PhoneSection from './sections/PhoneSection';

interface TargetDetailProps {
  targetId: string;
  onBack: () => void;
  onUpdate: () => void;
}

type Section = 'overview' | 'addresses' | 'social' | 'credentials' | 'network' | 'connections' | 'employment' | 'media' | 'notes' | 'phone';

export default function TargetDetail({ targetId, onBack, onUpdate }: TargetDetailProps) {
  const [target, setTarget] = useState<Target | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTarget, setEditedTarget] = useState<Target | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadTarget();
  }, [targetId]);

  const loadTarget = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('targets')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (data) {
      setTarget(data);
      setEditedTarget(data);
    }
    setLoading(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedTarget) return;
    setSaving(true);

    const { error } = await supabase
      .from('targets')
      .update({
        first_name: editedTarget.first_name,
        last_name: editedTarget.last_name,
        date_of_birth: editedTarget.date_of_birth,
        gender: editedTarget.gender,
        nationality: editedTarget.nationality,
        bio: editedTarget.bio,
        profile_image_url: editedTarget.profile_image_url,
        aliases: editedTarget.aliases,
        status: editedTarget.status
      })
      .eq('id', targetId);

    if (!error) {
      setTarget(editedTarget);
      setIsEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditedTarget(target);
    setIsEditing(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('target-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('target-images')
        .getPublicUrl(filePath);

      if (urlData.publicUrl) {
        setEditedTarget(prev => prev ? {...prev, profile_image_url: urlData.publicUrl} : null);
        setUploadProgress(100);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleRemoveImage = () => {
    setEditedTarget(prev => prev ? {...prev, profile_image_url: null} : null);
  };

  if (loading) {
    return (
      <div className="terminal-box">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-white animate-pulse">LOADING TARGET DATA...</span>
        </div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="terminal-box">
        <p className="text-red-500">ERROR: TARGET NOT FOUND</p>
        <button onClick={onBack} className="terminal-button mt-4">
          RETURN
        </button>
      </div>
    );
  }

  const displayName = target.first_name !== 'ND' && target.last_name !== 'ND'
    ? `${target.first_name} ${target.last_name}`
    : target.code_name;

  const sections = [
    { id: 'overview', label: 'OVERVIEW', icon: User },
    { id: 'phone', label: 'PHONE NUMBERS', icon: Phone },
    { id: 'addresses', label: 'LOCATIONS', icon: MapPin },
    { id: 'social', label: 'SOCIAL MEDIA', icon: Globe },
    { id: 'credentials', label: 'CREDENTIALS', icon: Key },
    { id: 'network', label: 'NETWORK DATA', icon: Wifi },
    { id: 'connections', label: 'CONNECTIONS', icon: Users },
    { id: 'employment', label: 'WORK/EDU', icon: Briefcase },
    { id: 'media', label: 'MEDIA', icon: Image },
    { id: 'notes', label: 'INTEL NOTES', icon: FileText },
  ];

  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onBack} className="terminal-button">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-2">
            {'>'} {displayName}
          </h2>
          <p className="text-sm text-zinc-500">TARGET ID: {target.code_name}</p>
        </div>
        {!isEditing ? (
          <button onClick={handleEdit} className="terminal-button flex items-center space-x-2">
            <Edit3 className="w-4 h-4" />
            <span>EDIT</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button onClick={handleCancel} className="terminal-button">
              CANCEL
            </button>
            <button onClick={handleSave} disabled={saving} className="terminal-button-primary flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>{saving ? 'SAVING...' : 'SAVE'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="terminal-box mb-6">
        <div className="flex items-start space-x-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              {editedTarget?.profile_image_url ? (
                <>
                  <img
                    src={editedTarget.profile_image_url}
                    alt={displayName}
                    className="w-32 h-32 rounded-sm object-cover border-2 border-zinc-800"
                  />
                  {isEditing && (
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-900 hover:bg-red-800 border border-red-600 rounded-full flex items-center justify-center transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4 text-red-200" />
                    </button>
                  )}
                </>
              ) : (
                <div className="w-32 h-32 rounded-sm bg-green-900/20 border-2 border-zinc-800 flex items-center justify-center">
                  <User className="w-16 h-16 text-zinc-500" />
                </div>
              )}
            </div>
            {isEditing && (
              <div className="w-full space-y-2">
                <label className="terminal-button cursor-pointer flex items-center justify-center space-x-2 w-full">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'UPLOADING...' : 'UPLOAD'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full h-1 bg-green-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="data-label mb-1">First Name</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTarget?.first_name || ''}
                  onChange={(e) => setEditedTarget(prev => prev ? {...prev, first_name: e.target.value} : null)}
                  className="terminal-input w-full"
                />
              ) : (
                <div className="data-value">{target.first_name}</div>
              )}
            </div>
            <div>
              <div className="data-label mb-1">Last Name</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTarget?.last_name || ''}
                  onChange={(e) => setEditedTarget(prev => prev ? {...prev, last_name: e.target.value} : null)}
                  className="terminal-input w-full"
                />
              ) : (
                <div className="data-value">{target.last_name}</div>
              )}
            </div>
            <div>
              <div className="data-label mb-1">DOB</div>
              {isEditing ? (
                <input
                  type="date"
                  value={editedTarget?.date_of_birth || ''}
                  onChange={(e) => setEditedTarget(prev => prev ? {...prev, date_of_birth: e.target.value} : null)}
                  className="terminal-input w-full"
                />
              ) : (
                <div className="data-value">{target.date_of_birth || 'ND'}</div>
              )}
            </div>
            <div>
              <div className="data-label mb-1">Gender</div>
              {isEditing ? (
                <select
                  value={editedTarget?.gender || ''}
                  onChange={(e) => setEditedTarget(prev => prev ? {...prev, gender: e.target.value} : null)}
                  className="terminal-input w-full"
                >
                  <option value="ND">ND</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="O">O</option>
                </select>
              ) : (
                <div className="data-value">{target.gender}</div>
              )}
            </div>
            <div>
              <div className="data-label mb-1">Nationality</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTarget?.nationality || ''}
                  onChange={(e) => setEditedTarget(prev => prev ? {...prev, nationality: e.target.value} : null)}
                  className="terminal-input w-full"
                />
              ) : (
                <div className="data-value">{target.nationality}</div>
              )}
            </div>
            <div>
              <div className="data-label mb-1">Status</div>
              {isEditing ? (
                <select
                  value={editedTarget?.status || 'active'}
                  onChange={(e) => setEditedTarget(prev => prev ? {...prev, status: e.target.value as 'active' | 'inactive'} : null)}
                  className="terminal-input w-full"
                >
                  <option value="active">ACTIVE</option>
                  <option value="inactive">INACTIVE</option>
                </select>
              ) : (
                <div className={`status-badge ${target.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                  {target.status.toUpperCase()}
                </div>
              )}
            </div>
            <div className="col-span-2">
              <div className="data-label mb-1">Aliases</div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTarget?.aliases?.join(', ') || ''}
                  onChange={(e) => setEditedTarget(prev => prev ? {...prev, aliases: e.target.value.split(',').map(a => a.trim()).filter(Boolean)} : null)}
                  className="terminal-input w-full"
                  placeholder="Comma-separated aliases"
                />
              ) : (
                <div className="data-value text-sm">
                  {target.aliases && target.aliases.length > 0 ? target.aliases.join(', ') : 'None'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="data-label mb-2">Biography / Notes</div>
          {isEditing ? (
            <textarea
              value={editedTarget?.bio || ''}
              onChange={(e) => setEditedTarget(prev => prev ? {...prev, bio: e.target.value} : null)}
              className="terminal-input w-full resize-none"
              rows={3}
              placeholder="Biography or notes..."
            />
          ) : (
            <div className="text-zinc-200 text-sm">{target.bio || 'No biography'}</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as Section)}
            className={`terminal-button flex items-center space-x-2 ${
              activeSection === id ? 'border-white bg-green-900/40' : ''
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="terminal-box min-h-[400px]">
        {activeSection === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {'>'} TARGET OVERVIEW
            </h3>
            <p className="text-zinc-500">
              Use the tabs above to view and manage detailed intelligence data for this target.
              Each section contains specific categories of OSINT information.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
              {sections.slice(1).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id as Section)}
                  className="terminal-box hover:border-green-700 transition-all flex items-center space-x-3"
                >
                  <Icon className="w-6 h-6 text-amber-600" />
                  <span className="text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'phone' && <PhoneSection targetId={targetId} />}
        {activeSection === 'addresses' && <AddressSection targetId={targetId} />}
        {activeSection === 'social' && <SocialMediaSection targetId={targetId} />}
        {activeSection === 'credentials' && <CredentialsSection targetId={targetId} />}
        {activeSection === 'network' && <NetworkSection targetId={targetId} />}
        {activeSection === 'connections' && <ConnectionsSection targetId={targetId} />}
        {activeSection === 'employment' && <EmploymentSection targetId={targetId} />}
        {activeSection === 'media' && <MediaSection targetId={targetId} />}
        {activeSection === 'notes' && <NotesSection targetId={targetId} dossierId={target.dossier_id} />}
      </div>
    </div>
  );
}
