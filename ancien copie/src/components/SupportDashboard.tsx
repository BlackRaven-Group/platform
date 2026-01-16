import { useState, useEffect } from 'react';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ServiceRequest {
  id: string;
  service_type: string;
  encrypted_message: string;
  client_public_key: string;
  status: string;
  created_at: string;
  client_id: string;
}

interface ServiceResponse {
  id: string;
  encrypted_response: string;
  created_at: string;
}

const SERVICE_NAMES: Record<string, string> = {
  osint_person: 'Recherche de Personne',
  osint_organization: "Analyse d'Organisation",
  geolocation: 'Géolocalisation',
  social_footprint: 'Empreinte Numérique',
  network_analysis: 'Analyse de Réseau',
  custom: 'Demande Personnalisée',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900/20 text-yellow-300 border-yellow-700',
  in_progress: 'bg-blue-900/20 text-blue-300 border-blue-700',
  completed: 'bg-zinc-900/20 text-zinc-300 border-zinc-700',
  cancelled: 'bg-red-900/20 text-red-300 border-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export default function SupportDashboard() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [responses, setResponses] = useState<ServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      loadResponses(selectedRequest.id);
    }
  }, [selectedRequest]);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err: any) {
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadResponses = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_responses')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(data || []);
    } catch (err: any) {
      console.error('Error loading responses:', err);
    }
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      await loadRequests();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
    }
  };

  const sendResponse = async () => {
    if (!selectedRequest || !responseText.trim()) return;

    setError('');
    setSending(true);

    try {
      if (!responseText.includes('BEGIN PGP MESSAGE')) {
        throw new Error('Le message doit être chiffré au format PGP');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { error: insertError } = await supabase
        .from('service_responses')
        .insert({
          request_id: selectedRequest.id,
          support_user_id: user.id,
          encrypted_response: responseText,
        });

      if (insertError) throw insertError;

      await updateStatus(selectedRequest.id, 'in_progress');
      await loadResponses(selectedRequest.id);
      setResponseText('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex h-screen">
        <div className="w-96 border-r border-slate-800 bg-slate-950 overflow-y-auto">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Demandes de Service
            </h2>
            <p className="text-slate-400 text-sm mt-1">{requests.length} demande(s)</p>
          </div>

          <div className="divide-y divide-slate-800">
            {requests.map((request) => (
              <button
                key={request.id}
                onClick={() => setSelectedRequest(request)}
                className={`w-full p-4 text-left hover:bg-slate-900 transition-colors ${
                  selectedRequest?.id === request.id ? 'bg-slate-900 border-l-4 border-slate-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">
                    {SERVICE_NAMES[request.service_type]}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[request.status]}`}>
                    {STATUS_LABELS[request.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(request.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {selectedRequest ? (
            <div className="max-w-4xl mx-auto p-8">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">
                      {SERVICE_NAMES[selectedRequest.service_type]}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Reçu le{' '}
                      {new Date(selectedRequest.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(selectedRequest.id, 'in_progress')}
                      className="px-4 py-2 bg-blue-900/20 text-blue-300 border border-blue-700 rounded-lg text-sm hover:bg-blue-900/30 transition-colors"
                      disabled={selectedRequest.status === 'in_progress'}
                    >
                      En cours
                    </button>
                    <button
                      onClick={() => updateStatus(selectedRequest.id, 'completed')}
                      className="px-4 py-2 bg-zinc-900/20 text-zinc-300 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-900/30 transition-colors"
                      disabled={selectedRequest.status === 'completed'}
                    >
                      Terminer
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">
                      Message Chiffré du Client
                    </label>
                    <textarea
                      value={selectedRequest.encrypted_message}
                      readOnly
                      className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-sm font-medium mb-2">
                      Clé Publique du Client
                    </label>
                    <textarea
                      value={selectedRequest.client_public_key}
                      readOnly
                      className="w-full h-32 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {responses.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-slate-100 mb-4">Réponses envoyées</h4>
                  <div className="space-y-4">
                    {responses.map((response) => (
                      <div key={response.id} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                        <p className="text-slate-400 text-xs mb-2">
                          {new Date(response.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <textarea
                          value={response.encrypted_response}
                          readOnly
                          className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 font-mono text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h4 className="text-lg font-bold text-slate-100 mb-4">Envoyer une Réponse Chiffrée</h4>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="-----BEGIN PGP MESSAGE-----&#10;&#10;Collez votre réponse chiffrée ici...&#10;&#10;-----END PGP MESSAGE-----"
                  className="w-full h-48 bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-600 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 font-mono text-sm mb-4"
                />
                {error && (
                  <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-start gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
                <button
                  onClick={sendResponse}
                  disabled={sending || !responseText.trim()}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Envoi...' : 'Envoyer la Réponse'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-500">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une demande pour voir les détails</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
