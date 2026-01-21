import { useState, useEffect } from 'react';
import { ArrowLeft, CheckSquare, AlertTriangle, UserPlus, FileText, Loader } from 'lucide-react';
import { getSearchResults, confirmSearchResults, extractTargetsFromResults, type OSINTResult, type OSINTSearchResponse, type ExtractedTarget } from '../lib/osint';
import { supabase } from '../lib/supabase';
import { encryptPassword } from '../lib/crypto';
import { generateAccessCode, hashCode } from '../lib/codename';

interface OSINTResultsProps {
  searchId: string;
  dossierId?: string;
  onBack: () => void;
  onDossierCreated?: (dossierId: string, accessCode: string) => void;
}

export default function OSINTResults({ searchId, dossierId, onBack, onDossierCreated }: OSINTResultsProps) {
  const [search, setSearch] = useState<OSINTSearchResponse | null>(null);
  const [results, setResults] = useState<OSINTResult[]>([]);
  const [extractedTargets, setExtractedTargets] = useState<ExtractedTarget[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    loadResults();
  }, [searchId]);

  const loadResults = async () => {
    setLoading(true);
    const searchData = await getSearchResults(searchId);

    if (searchData) {
      setSearch(searchData);

      if (searchData.parsed_results) {
        setResults(searchData.parsed_results);
        const targets = extractTargetsFromResults(searchData.parsed_results);
        setExtractedTargets(targets);
        setSelectedTargets(new Set(targets.map((_, idx) => idx)));
      }
    }

    setLoading(false);
  };

  const toggleTargetSelection = (index: number) => {
    setSelectedTargets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleConfirmAndCreate = async () => {
    if (selectedTargets.size === 0) {
      alert('Please select at least one target to create');
      return;
    }

    setProcessing(true);

    try {
      await confirmSearchResults(searchId);

      let targetDossierId = dossierId;

      let newDossierAccessCode: string | null = null;

      if (!targetDossierId) {
        // Generate access code for new dossier
        const accessCode = generateAccessCode();
        const hashedAccessCode = await hashCode(accessCode);
        newDossierAccessCode = accessCode;

        const { data: newDossier, error: dossierError } = await supabase
          .from('dossiers')
          .insert({
            title: `OSINT: ${search?.query || 'Investigation'}`,
            description: `Automated dossier from OSINT search query: "${search?.query}"`,
            classification: 'confidential',
            status: 'active',
            access_code: hashedAccessCode
          })
          .select()
          .single();

        if (dossierError || !newDossier) {
          throw new Error('Failed to create dossier');
        }

        targetDossierId = newDossier.id;

        await supabase
          .from('osint_searches')
          .update({ dossier_id: targetDossierId })
          .eq('id', searchId);
      }

      const selectedTargetsList = Array.from(selectedTargets).map(idx => extractedTargets[idx]);

      for (const target of selectedTargetsList) {
        const nameParts = target.name?.split(' ') || ['ND'];
        const firstName = nameParts[0] || 'ND';
        const lastName = nameParts.slice(1).join(' ') || 'ND';

        const { data: newTarget, error: targetError } = await supabase
          .from('targets')
          .insert({
            dossier_id: targetDossierId,
            first_name: firstName,
            last_name: lastName,
            code_name: target.username || target.email?.split('@')[0] || `TARGET_${Date.now()}`,
            status: 'active'
          })
          .select()
          .single();

        if (targetError || !newTarget) {
          console.error('Failed to create target:', targetError);
          continue;
        }

        if (target.email) {
          await supabase.from('credentials').insert({
            target_id: newTarget.id,
            service: 'Email',
            email: target.email,
            password_encrypted: target.password ? await encryptPassword(target.password) : null,
            status: 'active'
          });
        }

        if (target.phone) {
          // Store phone in phone_numbers table instead of network_data
          await supabase.from('phone_numbers').insert({
            target_id: newTarget.id,
            phone_number: target.phone,
            number_type: 'mobile',
            verified: false
          });
        }

        if (target.ip) {
          await supabase.from('network_data').insert({
            target_id: newTarget.id,
            ip_address: target.ip,
            ip_type: /:/.test(target.ip) ? 'ipv6' : 'ipv4',
            verified: false
          });
        }

        if (target.address) {
          const addressParts = target.address.split(',').map(p => p.trim());
          await supabase.from('addresses').insert({
            target_id: newTarget.id,
            address_type: 'other',
            street_address: addressParts[0] || target.address,
            city: addressParts[1] || null,
            verified: false
          });
        }

        if (target.social_media) {
          for (const social of target.social_media) {
            await supabase.from('social_media').insert({
              target_id: newTarget.id,
              platform: social.platform,
              username: social.username,
              profile_url: social.url,
              status: 'active'
            });
          }
        }

        const noteContent = Object.entries(target.raw_data)
          .filter(([key]) => key !== 'source')
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        if (noteContent) {
          await supabase.from('intelligence_notes').insert({
            target_id: newTarget.id,
            dossier_id: targetDossierId,
            category: 'osint',
            priority: 'medium',
            content: noteContent,
            source: 'OSINT Search'
          });
        }
      }

      // If new dossier was created, show access code and redirect
      if (newDossierAccessCode && onDossierCreated) {
        onDossierCreated(targetDossierId!, newDossierAccessCode);
      } else {
        alert(`Successfully created ${selectedTargets.size} target(s) in dossier`);
        onBack();
      }
    } catch (error: any) {
      console.error('Error creating targets:', error);
      alert('Failed to create targets: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!search) {
    return (
      <div className="text-center p-12">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-400">Search not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="terminal-button flex items-center space-x-2">
          <ArrowLeft className="w-5 h-5" />
          <span>BACK</span>
        </button>
        <div className="text-sm text-zinc-500">
          SEARCH ID: {searchId.substring(0, 8).toUpperCase()}
        </div>
      </div>

      <div className="border-2 border-zinc-800 p-6 mb-6 bg-zinc-900/20">
        <div className="data-label mb-2">SEARCH QUERY:</div>
        <div className="text-zinc-200 text-lg mb-4">{search.query}</div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Status:</span>
            <span className="ml-2 text-zinc-200">{search.status.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-zinc-500">Databases:</span>
            <span className="ml-2 text-zinc-200">{results.length}</span>
          </div>
          <div>
            <span className="text-zinc-500">Targets:</span>
            <span className="ml-2 text-zinc-200">{extractedTargets.length}</span>
          </div>
        </div>
      </div>

      {search.status === 'failed' && (
        <div className="border-2 border-red-900 p-6 mb-6 bg-red-950/20">
          <div className="flex items-center space-x-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Search failed: {search.error_message}</span>
          </div>
        </div>
      )}

      {extractedTargets.length > 0 && search.status === 'completed' && (
        <div className="border-2 border-zinc-800 p-6 mb-6 bg-zinc-900/20">
          <div className="flex items-center justify-between mb-4">
            <div className="data-label">EXTRACTED TARGETS ({extractedTargets.length}):</div>
            <button
              onClick={() => setShowConfirmation(!showConfirmation)}
              className="terminal-button-primary flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>CREATE TARGETS ({selectedTargets.size})</span>
            </button>
          </div>

          {showConfirmation && (
            <div className="border-2 border-yellow-900 p-4 mb-4 bg-yellow-950/20">
              <div className="flex items-center space-x-2 text-yellow-400 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold">CONFIRMATION REQUIRED</span>
              </div>
              <p className="text-yellow-400 text-sm mb-4">
                You are about to create {selectedTargets.size} target(s) {dossierId ? 'in the current dossier' : 'in a new dossier'}.
                This will extract and store all available information including emails, phones, addresses, and credentials.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmAndCreate}
                  disabled={processing}
                  className="terminal-button-primary flex items-center space-x-2"
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>PROCESSING...</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-5 h-5" />
                      <span>CONFIRM & CREATE</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="terminal-button"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {extractedTargets.map((target, index) => (
              <div
                key={index}
                className={`border p-4 cursor-pointer transition-colors ${
                  selectedTargets.has(index)
                    ? 'border-green-500 bg-zinc-900/30'
                    : 'border-zinc-800 hover:border-green-700'
                }`}
                onClick={() => toggleTargetSelection(index)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 border-2 flex items-center justify-center ${
                      selectedTargets.has(index) ? 'border-green-500 bg-green-500' : 'border-green-700'
                    }`}>
                      {selectedTargets.has(index) && (
                        <CheckSquare className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <span className="text-zinc-200 font-bold">
                      {target.name || target.email || target.username || `Target ${index + 1}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {target.email && (
                    <div>
                      <span className="text-zinc-500">Email:</span>
                      <span className="ml-2 text-zinc-200">{target.email}</span>
                    </div>
                  )}
                  {target.phone && (
                    <div>
                      <span className="text-zinc-500">Phone:</span>
                      <span className="ml-2 text-zinc-200">{target.phone}</span>
                    </div>
                  )}
                  {target.username && (
                    <div>
                      <span className="text-zinc-500">Username:</span>
                      <span className="ml-2 text-zinc-200">{target.username}</span>
                    </div>
                  )}
                  {target.password && (
                    <div>
                      <span className="text-zinc-500">Password:</span>
                      <span className="ml-2 text-zinc-200">***</span>
                    </div>
                  )}
                  {target.ip && (
                    <div>
                      <span className="text-zinc-500">IP:</span>
                      <span className="ml-2 text-zinc-200">{target.ip}</span>
                    </div>
                  )}
                  {target.address && (
                    <div className="col-span-2">
                      <span className="text-zinc-500">Address:</span>
                      <span className="ml-2 text-zinc-200">{target.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-2 border-zinc-800 p-6 bg-zinc-900/20">
        <div className="data-label mb-4">RAW DATABASE RESULTS ({results.length}):</div>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-200 font-bold">{result.database_name}</span>
                <span className="text-xs text-zinc-500">{result.data.length} RECORD(S)</span>
              </div>

              {result.info_leak && (
                <div className="text-sm text-amber-600 mb-3 pb-3 border-b border-zinc-800">
                  {result.info_leak}
                </div>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.data.map((record, recordIndex) => (
                  <div key={recordIndex} className="bg-black p-3 border border-zinc-800 text-xs">
                    {Object.entries(record).map(([key, value]) => (
                      <div key={key} className="mb-1">
                        <span className="text-zinc-500">{key}:</span>
                        <span className="ml-2 text-zinc-200">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
