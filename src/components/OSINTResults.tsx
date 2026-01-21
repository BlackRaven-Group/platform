import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckSquare, AlertTriangle, UserPlus, FileText, Loader, Square, CheckSquare2, Users, X } from 'lucide-react';
import { getSearchResults, confirmSearchResults, extractTargetsFromResults, type OSINTResult, type OSINTSearchResponse, type ExtractedTarget } from '../lib/osint';
import { supabase } from '../lib/supabase';
import { encryptPassword } from '../lib/crypto';
import { generateAccessCode, generateCodeName, hashCode } from '../lib/codename';

interface OSINTResultsProps {
  searchId: string;
  dossierId?: string;
  onBack: () => void;
  onDossierCreated?: (dossierId: string, accessCode: string) => void;
}

interface TargetGroup {
  indices: number[];
  isDuplicate: boolean;
  confidence: number;
  matchReason: string;
}

export default function OSINTResults({ searchId, dossierId, onBack, onDossierCreated }: OSINTResultsProps) {
  const [search, setSearch] = useState<OSINTSearchResponse | null>(null);
  const [results, setResults] = useState<OSINTResult[]>([]);
  const [extractedTargets, setExtractedTargets] = useState<ExtractedTarget[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [consolidateDuplicates, setConsolidateDuplicates] = useState(true);
  const [showDuplicateGroups, setShowDuplicateGroups] = useState(true);

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

  // Detect duplicate targets
  const duplicateGroups = useMemo(() => {
    const groups: TargetGroup[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < extractedTargets.length; i++) {
      if (processed.has(i)) continue;

      const group: TargetGroup = {
        indices: [i],
        isDuplicate: false,
        confidence: 0,
        matchReason: ''
      };

      const target1 = extractedTargets[i];

      for (let j = i + 1; j < extractedTargets.length; j++) {
        if (processed.has(j)) continue;

        const target2 = extractedTargets[j];
        const match = detectTargetMatch(target1, target2);

        if (match.isMatch) {
          group.indices.push(j);
          group.isDuplicate = true;
          group.confidence = Math.max(group.confidence, match.confidence);
          if (!group.matchReason) {
            group.matchReason = match.reason;
          }
          processed.add(j);
        }
      }

      if (group.isDuplicate) {
        groups.push(group);
        processed.add(i);
      }
    }

    return groups;
  }, [extractedTargets]);

  // Detect if two targets are the same person
  function detectTargetMatch(target1: ExtractedTarget, target2: ExtractedTarget): { isMatch: boolean; confidence: number; reason: string } {
    let confidence = 0;
    const reasons: string[] = [];

    // Email match (highest confidence)
    if (target1.email && target2.email && target1.email.toLowerCase() === target2.email.toLowerCase()) {
      confidence += 50;
      reasons.push('email');
    }

    // Phone match (normalize phone numbers)
    if (target1.phone && target2.phone) {
      const phone1 = target1.phone.replace(/\D/g, '');
      const phone2 = target2.phone.replace(/\D/g, '');
      if (phone1 === phone2 && phone1.length >= 8) {
        confidence += 40;
        reasons.push('phone');
      }
    }

    // Username match
    if (target1.username && target2.username && target1.username.toLowerCase() === target2.username.toLowerCase()) {
      confidence += 30;
      reasons.push('username');
    }

    // Name match (fuzzy)
    if (target1.name && target2.name) {
      const name1 = target1.name.toLowerCase().trim();
      const name2 = target2.name.toLowerCase().trim();
      if (name1 === name2) {
        confidence += 35;
        reasons.push('name');
      } else if (name1.split(' ').some(part => name2.includes(part)) || name2.split(' ').some(part => name1.includes(part))) {
        confidence += 20;
        reasons.push('name_partial');
      }
    }

    // IP match
    if (target1.ip && target2.ip && target1.ip === target2.ip) {
      confidence += 25;
      reasons.push('ip');
    }

    // Address match (partial)
    if (target1.address && target2.address) {
      const addr1 = target1.address.toLowerCase();
      const addr2 = target2.address.toLowerCase();
      if (addr1 === addr2) {
        confidence += 30;
        reasons.push('address');
      } else if (addr1.split(',').some(part => addr2.includes(part.trim())) || addr2.split(',').some(part => addr1.includes(part.trim()))) {
        confidence += 15;
        reasons.push('address_partial');
      }
    }

    return {
      isMatch: confidence >= 30, // Minimum threshold
      confidence: Math.min(100, confidence),
      reason: reasons.join(', ')
    };
  }

  // Consolidate duplicate targets into one
  function consolidateTargetGroup(groupIndices: number[]): ExtractedTarget {
    const targets = groupIndices.map(idx => extractedTargets[idx]);
    const consolidated: ExtractedTarget = {
      raw_data: {}
    };

    // Merge all data, keeping the most complete version
    for (const target of targets) {
      if (target.email && !consolidated.email) consolidated.email = target.email;
      if (target.phone && !consolidated.phone) consolidated.phone = target.phone;
      if (target.name && !consolidated.name) consolidated.name = target.name;
      if (target.username && !consolidated.username) consolidated.username = target.username;
      if (target.password && !consolidated.password) consolidated.password = target.password;
      if (target.ip && !consolidated.ip) consolidated.ip = target.ip;
      if (target.address && !consolidated.address) consolidated.address = target.address;

      // Merge social media
      if (target.social_media) {
        if (!consolidated.social_media) consolidated.social_media = [];
        for (const social of target.social_media) {
          if (!consolidated.social_media.some(s => s.platform === social.platform && s.username === social.username)) {
            consolidated.social_media.push(social);
          }
        }
      }

      // Merge raw_data
      consolidated.raw_data = { ...consolidated.raw_data, ...target.raw_data };
    }

    return consolidated;
  }

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

  const selectAll = () => {
    setSelectedTargets(new Set(extractedTargets.map((_, idx) => idx)));
  };

  const deselectAll = () => {
    setSelectedTargets(new Set());
  };

  const toggleGroupSelection = (group: TargetGroup) => {
    setSelectedTargets(prev => {
      const newSet = new Set(prev);
      const allSelected = group.indices.every(idx => newSet.has(idx));
      
      if (allSelected) {
        group.indices.forEach(idx => newSet.delete(idx));
      } else {
        group.indices.forEach(idx => newSet.add(idx));
      }
      
      return newSet;
    });
  };

  // Calculate consolidated targets count for display
  const consolidatedTargetsCount = useMemo(() => {
    if (!consolidateDuplicates || duplicateGroups.length === 0) {
      return selectedTargets.size;
    }

    const processedIndices = new Set<number>();
    let count = 0;

    for (const group of duplicateGroups) {
      const selectedInGroup = group.indices.filter(idx => selectedTargets.has(idx));
      if (selectedInGroup.length > 0) {
        count++;
        selectedInGroup.forEach(idx => processedIndices.add(idx));
      }
    }

    // Add non-duplicate selected targets
    Array.from(selectedTargets).forEach(idx => {
      if (!processedIndices.has(idx)) {
        count++;
      }
    });

    return count;
  }, [selectedTargets, consolidateDuplicates, duplicateGroups]);

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
        // Generate access code and code name for new dossier
        const accessCode = generateAccessCode();
        const hashedAccessCode = await hashCode(accessCode);
        const codeName = generateCodeName();
        newDossierAccessCode = accessCode;

        // Get current user for user_id
        const { data: { user } } = await supabase.auth.getUser();

        const { data: newDossier, error: dossierError } = await supabase
          .from('dossiers')
          .insert({
            title: `OSINT: ${search?.query || 'Investigation'}`,
            description: `Automated dossier from OSINT search query: "${search?.query}"`,
            code_name: codeName,
            classification: 'confidential',
            status: 'active',
            access_code: hashedAccessCode,
            user_id: user?.id || null,
            created_by: user?.id || null
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

      // Get selected targets, consolidating duplicates if enabled
      let targetsToCreate: ExtractedTarget[] = [];
      
      if (consolidateDuplicates && duplicateGroups.length > 0) {
        const processedIndices = new Set<number>();

        for (const group of duplicateGroups) {
          const selectedInGroup = group.indices.filter(idx => selectedTargets.has(idx));
          if (selectedInGroup.length > 0) {
            // If consolidating, create one target from the group
            const consolidated = consolidateTargetGroup(selectedInGroup);
            targetsToCreate.push(consolidated);
            selectedInGroup.forEach(idx => processedIndices.add(idx));
          }
        }

        // Add non-duplicate selected targets
        Array.from(selectedTargets).forEach(idx => {
          if (!processedIndices.has(idx)) {
            targetsToCreate.push(extractedTargets[idx]);
          }
        });
      } else {
        targetsToCreate = Array.from(selectedTargets).map(idx => extractedTargets[idx]);
      }

      for (const target of targetsToCreate) {
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
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="data-label">EXTRACTED TARGETS ({extractedTargets.length}):</div>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAll}
                className="terminal-button flex items-center space-x-2 text-xs"
                title="Sélectionner tout"
              >
                <CheckSquare2 className="w-4 h-4" />
                <span>TOUT</span>
              </button>
              <button
                onClick={deselectAll}
                className="terminal-button flex items-center space-x-2 text-xs"
                title="Tout désélectionner"
              >
                <Square className="w-4 h-4" />
                <span>RIEN</span>
              </button>
              {duplicateGroups.length > 0 && (
                <button
                  onClick={() => setShowDuplicateGroups(!showDuplicateGroups)}
                  className="terminal-button flex items-center space-x-2 text-xs"
                  title="Afficher/masquer les groupes de doublons"
                >
                  <Users className="w-4 h-4" />
                  <span>DOUBLONS ({duplicateGroups.length})</span>
                </button>
              )}
              <button
                onClick={() => setShowConfirmation(!showConfirmation)}
                className="terminal-button-primary flex items-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>CREATE TARGETS ({consolidatedTargetsCount})</span>
              </button>
            </div>
          </div>

          {duplicateGroups.length > 0 && (
            <div className="mb-4 p-3 bg-amber-950/20 border border-amber-800 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-amber-400 text-sm">
                  <Users className="w-4 h-4" />
                  <span>{duplicateGroups.length} groupe(s) de doublons détecté(s)</span>
                </div>
                <label className="flex items-center space-x-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consolidateDuplicates}
                    onChange={(e) => setConsolidateDuplicates(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Consolider les doublons</span>
                </label>
              </div>
              {showDuplicateGroups && (
                <div className="space-y-2 mt-3">
                  {duplicateGroups.map((group, groupIdx) => {
                    const allSelected = group.indices.every(idx => selectedTargets.has(idx));
                    const someSelected = group.indices.some(idx => selectedTargets.has(idx));
                    return (
                      <div
                        key={groupIdx}
                        className={`p-2 border rounded ${
                          allSelected ? 'border-green-600 bg-green-950/20' : 
                          someSelected ? 'border-yellow-600 bg-yellow-950/20' : 
                          'border-amber-800 bg-amber-950/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleGroupSelection(group)}
                              className={`w-4 h-4 border-2 flex items-center justify-center ${
                                allSelected ? 'border-green-500 bg-green-500' : 
                                someSelected ? 'border-yellow-500 bg-yellow-500' : 
                                'border-amber-700'
                              }`}
                            >
                              {allSelected && <CheckSquare className="w-3 h-3 text-black" />}
                              {someSelected && !allSelected && <div className="w-2 h-2 bg-black rounded" />}
                            </button>
                            <span className="text-xs text-amber-400">
                              Groupe {groupIdx + 1}: {group.indices.length} target(s) - {group.matchReason} ({group.confidence}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 ml-6">
                          Indices: {group.indices.join(', ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {showConfirmation && (
            <div className="border-2 border-yellow-900 p-4 mb-4 bg-yellow-950/20">
              <div className="flex items-center space-x-2 text-yellow-400 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold">CONFIRMATION REQUIRED</span>
              </div>
              <p className="text-yellow-400 text-sm mb-4">
                You are about to create {consolidatedTargetsCount} target(s) {dossierId ? 'in the current dossier' : 'in a new dossier'}.
                {consolidateDuplicates && duplicateGroups.length > 0 && selectedTargets.size > consolidatedTargetsCount && (
                  <span className="block mt-1 text-amber-500">
                    {selectedTargets.size - consolidatedTargetsCount} duplicate(s) will be consolidated.
                  </span>
                )}
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
