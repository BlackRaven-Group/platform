import { useState } from 'react';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateTargetProps {
  dossierId: string;
  onBack: () => void;
  onCreated: () => void;
}

export default function CreateTarget({ dossierId, onBack, onCreated }: CreateTargetProps) {
  const [codeName, setCodeName] = useState('');
  const [firstName, setFirstName] = useState('ND');
  const [lastName, setLastName] = useState('ND');
  const [aliases, setAliases] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('ND');
  const [nationality, setNationality] = useState('ND');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const aliasesArray = aliases.split(',').map(a => a.trim()).filter(Boolean);

    const { error } = await supabase
      .from('targets')
      .insert({
        dossier_id: dossierId,
        code_name: codeName,
        first_name: firstName || 'ND',
        last_name: lastName || 'ND',
        aliases: aliasesArray,
        date_of_birth: dateOfBirth || null,
        gender: gender || 'ND',
        nationality: nationality || 'ND',
        profile_image_url: profileImageUrl || null,
        bio: bio || '',
        status,
      });

    if (!error) {
      onCreated();
    } else {
      alert('Error creating target');
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="terminal-button">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {'>'} ADD NEW TARGET
          </h2>
          <p className="text-sm text-zinc-500">CREATE TARGET PROFILE</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="terminal-box max-w-4xl">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-zinc-800">
          <UserPlus className="w-8 h-8 text-amber-600" />
          <span className="text-white font-semibold">TARGET INTAKE FORM</span>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="data-label block mb-2">Code Name *</label>
              <input
                type="text"
                value={codeName}
                onChange={(e) => setCodeName(e.target.value)}
                required
                placeholder="SUBJECT-001"
                className="terminal-input w-full"
              />
            </div>

            <div>
              <label className="data-label block mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="ND if unknown"
                className="terminal-input w-full"
              />
            </div>

            <div>
              <label className="data-label block mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="ND if unknown"
                className="terminal-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="data-label block mb-2">Known Aliases</label>
            <input
              type="text"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="Comma-separated aliases..."
              className="terminal-input w-full"
            />
            <p className="text-xs text-zinc-500 mt-1">Separate multiple aliases with commas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="data-label block mb-2">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="terminal-input w-full"
              />
            </div>

            <div>
              <label className="data-label block mb-2">Gender</label>
              <input
                type="text"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="ND if unknown"
                className="terminal-input w-full"
              />
            </div>

            <div>
              <label className="data-label block mb-2">Nationality</label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="ND if unknown"
                className="terminal-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="data-label block mb-2">Profile Image URL</label>
            <input
              type="url"
              value={profileImageUrl}
              onChange={(e) => setProfileImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="terminal-input w-full"
            />
          </div>

          <div>
            <label className="data-label block mb-2">Biography / Notes</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Enter biographical information and intelligence notes..."
              rows={4}
              className="terminal-input w-full resize-none"
            />
          </div>

          <div>
            <label className="data-label block mb-2">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="terminal-input w-full"
            >
              <option value="active">ACTIVE</option>
              <option value="inactive">INACTIVE</option>
              <option value="deceased">DECEASED</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-zinc-800">
          <button type="button" onClick={onBack} className="terminal-button">
            CANCEL
          </button>
          <button
            type="submit"
            disabled={saving || !codeName}
            className="terminal-button-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'CREATING...' : 'CREATE TARGET'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
