import { useState, useEffect } from 'react';
import { Ticket, Lock, Clock, CheckCircle, AlertCircle, RefreshCw, ArrowLeft, MessageSquare, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClientTicketsDashboardProps {
  clientUserId: string;
  onBack: () => void;
}

interface GLPITicket {
  id: string;
  service_type: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  response: string | null;
  created_at: string;
  updated_at: string;
}

interface ServiceRequest {
  id: string;
  service_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const SERVICE_NAMES: Record<string, string> = {
  osint_person: 'Recherche Personne',
  osint_organization: 'Analyse Organisation',
  geolocation: 'Géolocalisation',
  social_footprint: 'Empreinte Numérique',
  network_analysis: 'Analyse Réseau',
  custom: 'Demande Personnalisée',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'text-amber-500 border-amber-500 bg-amber-500/10', icon: Clock },
  open: { label: 'Ouvert', color: 'text-blue-500 border-blue-500 bg-blue-500/10', icon: AlertCircle },
  in_progress: { label: 'En cours', color: 'text-cyan-500 border-cyan-500 bg-cyan-500/10', icon: RefreshCw },
  resolved: { label: 'Résolu', color: 'text-green-500 border-green-500 bg-green-500/10', icon: CheckCircle },
  closed: { label: 'Fermé', color: 'text-zinc-500 border-zinc-500 bg-zinc-500/10', icon: CheckCircle },
  completed: { label: 'Terminé', color: 'text-green-500 border-green-500 bg-green-500/10', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'text-red-500 border-red-500 bg-red-500/10', icon: AlertCircle },
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Très basse',
  2: 'Basse',
  3: 'Moyenne',
  4: 'Haute',
  5: 'Urgente',
};

export default function ClientTicketsDashboard({ clientUserId, onBack }: ClientTicketsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'glpi' | 'pgp'>('glpi');
  const [glpiTickets, setGlpiTickets] = useState<GLPITicket[]>([]);
  const [pgpRequests, setPgpRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<GLPITicket | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    
    // Set up real-time subscription
    const glpiChannel = supabase
      .channel('glpi_tickets_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'glpi_tickets',
        filter: `client_user_id=eq.${clientUserId}`
      }, () => {
        loadData();
      })
      .subscribe();

    const pgpChannel = supabase
      .channel('service_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_requests',
        filter: `client_id=eq.${clientUserId}`
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(glpiChannel);
      supabase.removeChannel(pgpChannel);
    };
  }, [clientUserId]);

  const loadData = async () => {
    try {
      // Load GLPI tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('glpi_tickets')
        .select('*')
        .eq('client_user_id', clientUserId)
        .order('created_at', { ascending: false });

      if (!ticketsError && tickets) {
        setGlpiTickets(tickets);
      }

      // Load PGP requests
      const { data: requests, error: requestsError } = await supabase
        .from('service_requests')
        .select('*')
        .eq('client_id', clientUserId)
        .order('created_at', { ascending: false });

      if (!requestsError && requests) {
        setPgpRequests(requests);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 border text-xs font-bold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 font-mono">CHARGEMENT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono">
      <div className="scanline"></div>

      {/* Header */}
      <header className="border-b-2 border-zinc-800 bg-black/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="terminal-button-small flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>[RETOUR]</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wider glitch" data-text="[MES_DEMANDES]">
                [MES_DEMANDES]
              </h1>
              <p className="text-zinc-500 text-sm">SUIVI EN TEMPS RÉEL</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="terminal-button-small flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>ACTUALISER</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-4 border-b-2 border-zinc-800">
          <button
            onClick={() => setActiveTab('glpi')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === 'glpi'
                ? 'border-amber-600 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Ticket className="w-5 h-5" />
            <span>TICKETS GLPI</span>
            {glpiTickets.length > 0 && (
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                {glpiTickets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pgp')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === 'pgp'
                ? 'border-amber-600 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span>DEMANDES PGP</span>
            {pgpRequests.length > 0 && (
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                {pgpRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'glpi' && (
          <div className="space-y-4">
            {glpiTickets.length === 0 ? (
              <div className="text-center py-16 border-2 border-zinc-800 bg-zinc-900/20">
                <Ticket className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">Aucun ticket GLPI</p>
                <p className="text-zinc-600 text-sm mt-1">Vos demandes identifiées apparaîtront ici</p>
              </div>
            ) : (
              glpiTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border-2 border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-amber-600 font-mono text-xs">
                            #{ticket.id.substring(0, 8).toUpperCase()}
                          </span>
                          {getStatusBadge(ticket.status)}
                          <span className="text-zinc-600 text-xs">
                            Priorité: {PRIORITY_LABELS[ticket.priority]}
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-lg">{ticket.title}</h3>
                        <p className="text-zinc-500 text-sm mt-1">
                          {SERVICE_NAMES[ticket.service_type] || ticket.service_type}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                        className="terminal-button-small flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{selectedTicket?.id === ticket.id ? 'MASQUER' : 'DÉTAILS'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Créé: {formatDate(ticket.created_at)}
                      </span>
                      {ticket.updated_at !== ticket.created_at && (
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" />
                          MAJ: {formatDate(ticket.updated_at)}
                        </span>
                      )}
                    </div>

                    {/* Expanded details */}
                    {selectedTicket?.id === ticket.id && (
                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="mb-4">
                          <h4 className="text-zinc-400 text-xs mb-2">DESCRIPTION</h4>
                          <pre className="text-zinc-300 text-sm whitespace-pre-wrap bg-black/50 p-3 border border-zinc-800">
                            {ticket.description}
                          </pre>
                        </div>

                        {ticket.response && (
                          <div className="mt-4">
                            <h4 className="text-green-500 text-xs mb-2 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              RÉPONSE DE L'ÉQUIPE
                            </h4>
                            <div className="bg-green-950/20 border border-green-900 p-3">
                              <pre className="text-green-300 text-sm whitespace-pre-wrap">
                                {ticket.response}
                              </pre>
                            </div>
                          </div>
                        )}

                        {!ticket.response && ticket.status === 'pending' && (
                          <div className="flex items-center gap-2 text-amber-500 text-sm">
                            <Clock className="w-4 h-4 animate-pulse" />
                            En attente de traitement par l'équipe...
                          </div>
                        )}

                        {!ticket.response && ticket.status === 'in_progress' && (
                          <div className="flex items-center gap-2 text-cyan-500 text-sm">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Votre demande est en cours de traitement...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'pgp' && (
          <div className="space-y-4">
            {pgpRequests.length === 0 ? (
              <div className="text-center py-16 border-2 border-zinc-800 bg-zinc-900/20">
                <Lock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">Aucune demande PGP</p>
                <p className="text-zinc-600 text-sm mt-1">Vos demandes anonymes apparaîtront ici</p>
              </div>
            ) : (
              pgpRequests.map((request) => (
                <div
                  key={request.id}
                  className="border-2 border-zinc-800 bg-zinc-900/30 p-4 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-amber-600 font-mono text-xs">
                          REF: {request.id.substring(0, 8).toUpperCase()}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <h3 className="text-white font-bold">
                        {SERVICE_NAMES[request.service_type] || request.service_type}
                      </h3>
                      <p className="text-zinc-600 text-xs mt-2 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Communication chiffrée PGP - Anonymat garanti
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500 text-xs">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2 text-amber-500 text-sm">
                      <Clock className="w-4 h-4 animate-pulse" />
                      En attente de réponse chiffrée...
                    </div>
                  )}

                  {request.status === 'in_progress' && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2 text-cyan-500 text-sm">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Traitement en cours...
                    </div>
                  )}

                  {request.status === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2 text-green-500 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Réponse envoyée - Vérifiez vos messages PGP
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-zinc-800 bg-black/90 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-zinc-500 text-xs">
            BLACKRAVEN // SUIVI TEMPS RÉEL // ACTUALISÉ AUTOMATIQUEMENT
          </p>
        </div>
      </footer>
    </div>
  );
}
