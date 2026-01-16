import { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, AlertCircle, Ticket, Lock, RefreshCw, 
  Clock, CheckCircle, Eye, User, Mail, Phone, Filter, Search,
  ChevronDown, ArrowLeft, Menu, X, ChevronLeft, FileText, Key, Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendTicketResponseEmail } from '../lib/email';

interface ResponseTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
}

interface GLPITicket {
  id: string;
  service_type: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  client_email: string | null;
  client_phone: string | null;
  client_name: string | null;
  response: string | null;
  client_user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ServiceRequest {
  id: string;
  service_type: string;
  encrypted_message: string;
  client_public_key: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_id: string;
}

interface ServiceResponse {
  id: string;
  encrypted_response: string;
  created_at: string;
}

interface SupportDashboardProps {
  onBack?: () => void;
}

const SERVICE_NAMES: Record<string, string> = {
  osint_person: 'Recherche Personne',
  osint_organization: 'Analyse Organisation',
  geolocation: 'Géolocalisation',
  social_footprint: 'Empreinte Numérique',
  network_analysis: 'Analyse Réseau',
  custom: 'Demande Personnalisée',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'En attente', color: 'text-amber-500', bgColor: 'bg-amber-500/10 border-amber-500' },
  open: { label: 'Ouvert', color: 'text-blue-500', bgColor: 'bg-blue-500/10 border-blue-500' },
  in_progress: { label: 'En cours', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10 border-cyan-500' },
  resolved: { label: 'Résolu', color: 'text-green-500', bgColor: 'bg-green-500/10 border-green-500' },
  closed: { label: 'Fermé', color: 'text-zinc-500', bgColor: 'bg-zinc-500/10 border-zinc-500' },
  completed: { label: 'Terminé', color: 'text-green-500', bgColor: 'bg-green-500/10 border-green-500' },
  cancelled: { label: 'Annulé', color: 'text-red-500', bgColor: 'bg-red-500/10 border-red-500' },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'Très basse', color: 'text-zinc-400' },
  2: { label: 'Basse', color: 'text-blue-400' },
  3: { label: 'Moyenne', color: 'text-amber-400' },
  4: { label: 'Haute', color: 'text-orange-400' },
  5: { label: 'Urgente', color: 'text-red-400' },
};

export default function SupportDashboard({ onBack }: SupportDashboardProps) {
  const [activeTab, setActiveTab] = useState<'glpi' | 'pgp'>('glpi');
  const [glpiTickets, setGlpiTickets] = useState<GLPITicket[]>([]);
  const [pgpRequests, setPgpRequests] = useState<ServiceRequest[]>([]);
  const [pgpResponses, setPgpResponses] = useState<ServiceResponse[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<GLPITicket | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadData();
    loadTemplates();
    
    // Real-time subscriptions
    const glpiChannel = supabase
      .channel('admin_glpi_tickets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'glpi_tickets'
      }, () => {
        loadData();
      })
      .subscribe();

    const pgpChannel = supabase
      .channel('admin_service_requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_requests'
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(glpiChannel);
      supabase.removeChannel(pgpChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      loadPgpResponses(selectedRequest.id);
      // Reset decryption state when changing request
      setDecryptedMessage(null);
      setDecryptError(null);
    }
  }, [selectedRequest]);

  const loadData = async () => {
    try {
      // Load GLPI tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('glpi_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!ticketsError && tickets) {
        setGlpiTickets(tickets);
      }

      // Load PGP requests
      const { data: requests, error: requestsError } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!requestsError && requests) {
        setPgpRequests(requests);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('response_templates')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (!error && data) {
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const applyTemplate = (template: ResponseTemplate) => {
    setResponseText(template.content);
    setShowTemplates(false);
  };

  const loadPgpResponses = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_responses')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setPgpResponses(data);
      }
    } catch (err) {
      console.error('Error loading responses:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const updateGlpiStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('glpi_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      await loadData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const updatePgpStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
      await loadData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const sendGlpiResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return;

    setError('');
    setSending(true);

    try {
      const { error } = await supabase
        .from('glpi_tickets')
        .update({ 
          response: responseText,
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      // Envoyer email de notification si le client a un email
      if (selectedTicket.client_email || selectedTicket.client_user_id) {
        // Récupérer l'email du client si pas directement disponible
        let clientEmail = selectedTicket.client_email;
        let clientName = selectedTicket.client_name || 'Client';

        if (!clientEmail && selectedTicket.client_user_id) {
          const { data: clientData } = await supabase
            .from('client_users')
            .select('email, full_name')
            .eq('id', selectedTicket.client_user_id)
            .single();
          
          if (clientData) {
            clientEmail = clientData.email;
            clientName = clientData.full_name || clientName;
          }
        }

        if (clientEmail) {
          const ticketRef = selectedTicket.id.substring(0, 8).toUpperCase();
          await sendTicketResponseEmail(
            clientEmail,
            clientName,
            ticketRef,
            selectedTicket.title,
            responseText,
            selectedTicket.client_user_id || undefined
          );
        }
      }

      setSelectedTicket({ ...selectedTicket, response: responseText, status: 'resolved' });
      setResponseText('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const sendPgpResponse = async () => {
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

      await updatePgpStatus(selectedRequest.id, 'in_progress');
      await loadPgpResponses(selectedRequest.id);
      setResponseText('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
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

  const getFilteredGlpiTickets = () => {
    return glpiTickets.filter(ticket => {
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesSearch = searchQuery === '' || 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.client_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  };

  const getFilteredPgpRequests = () => {
    return pgpRequests.filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesStatus;
    });
  };

  const getStatusCounts = () => {
    const items = activeTab === 'glpi' ? glpiTickets : pgpRequests;
    const counts: Record<string, number> = { all: items.length };
    items.forEach(item => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return counts;
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

  const statusCounts = getStatusCounts();

  const handleSelectTicket = (ticket: GLPITicket) => {
    setSelectedTicket(ticket);
    setSidebarOpen(false);
  };

  const handleSelectRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono flex relative">
      <div className="scanline"></div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-zinc-950 border-b-2 border-zinc-800 p-3 z-30 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-zinc-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-500" />
          SUPPORT
        </h2>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[280px] sm:w-80 border-r-2 border-zinc-800 bg-zinc-950 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b-2 border-zinc-800">
          <div className="flex items-center justify-between lg:hidden mb-3">
            <span className="text-sm text-zinc-500">Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="terminal-button-small flex items-center gap-2 mb-3 w-full justify-center text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>[RETOUR]</span>
            </button>
          )}
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5 text-amber-500" />
            SUPPORT ADMIN
          </h2>
          <p className="text-zinc-500 text-[10px] sm:text-xs mt-1">Centre de gestion des demandes</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-zinc-800">
          <button
            onClick={() => { setActiveTab('glpi'); setSelectedTicket(null); setSelectedRequest(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-all ${
              activeTab === 'glpi'
                ? 'bg-amber-600/10 text-amber-500 border-b-2 border-amber-600'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            GLPI ({glpiTickets.length})
          </button>
          <button
            onClick={() => { setActiveTab('pgp'); setSelectedTicket(null); setSelectedRequest(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-all ${
              activeTab === 'pgp'
                ? 'bg-amber-600/10 text-amber-500 border-b-2 border-amber-600'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            PGP ({pgpRequests.length})
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-zinc-800 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-sm appearance-none focus:border-amber-600 focus:outline-none"
            >
              <option value="all">Tous ({statusCounts.all || 0})</option>
              <option value="pending">En attente ({statusCounts.pending || 0})</option>
              <option value="in_progress">En cours ({statusCounts.in_progress || 0})</option>
              <option value="resolved">Résolu ({statusCounts.resolved || 0})</option>
              <option value="completed">Terminé ({statusCounts.completed || 0})</option>
              <option value="closed">Fermé ({statusCounts.closed || 0})</option>
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'glpi' && (
            <div className="divide-y divide-zinc-800">
              {getFilteredGlpiTickets().length === 0 ? (
                <div className="p-8 text-center text-zinc-600">
                  <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun ticket</p>
                </div>
              ) : (
                getFilteredGlpiTickets().map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    className={`w-full p-2 sm:p-3 text-left hover:bg-zinc-900/50 transition-colors ${
                      selectedTicket?.id === ticket.id 
                        ? 'bg-zinc-900 border-l-2 border-amber-500' 
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-600 font-mono text-xs">
                        #{ticket.id.substring(0, 6)}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 border ${STATUS_CONFIG[ticket.status]?.bgColor || STATUS_CONFIG.pending.bgColor}`}>
                        {STATUS_CONFIG[ticket.status]?.label || ticket.status}
                      </span>
                    </div>
                    <h4 className="text-white text-sm font-medium truncate">{ticket.title}</h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${PRIORITY_CONFIG[ticket.priority]?.color || 'text-zinc-500'}`}>
                        P{ticket.priority}
                      </span>
                      <span className="text-zinc-600 text-xs">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {activeTab === 'pgp' && (
            <div className="divide-y divide-zinc-800">
              {getFilteredPgpRequests().length === 0 ? (
                <div className="p-8 text-center text-zinc-600">
                  <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Aucune demande</p>
                </div>
              ) : (
                getFilteredPgpRequests().map((request) => (
                  <button
                    key={request.id}
                    onClick={() => handleSelectRequest(request)}
                    className={`w-full p-2 sm:p-3 text-left hover:bg-zinc-900/50 transition-colors ${
                      selectedRequest?.id === request.id 
                        ? 'bg-zinc-900 border-l-2 border-amber-500' 
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-600 font-mono text-xs">
                        REF:{request.id.substring(0, 6)}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 border ${STATUS_CONFIG[request.status]?.bgColor || STATUS_CONFIG.pending.bgColor}`}>
                        {STATUS_CONFIG[request.status]?.label || request.status}
                      </span>
                    </div>
                    <h4 className="text-white text-sm font-medium">
                      {SERVICE_NAMES[request.service_type] || request.service_type}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-zinc-600 text-xs flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Chiffré
                      </span>
                      <span className="text-zinc-600 text-xs">
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Refresh button */}
        <div className="p-3 border-t border-zinc-800">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full terminal-button-small flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>ACTUALISER</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {/* GLPI Ticket Detail */}
        {activeTab === 'glpi' && selectedTicket && (
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Mobile back button */}
            <button
              onClick={() => { setSelectedTicket(null); setSidebarOpen(true); }}
              className="lg:hidden flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Retour à la liste</span>
            </button>

            <div className="border-2 border-zinc-800 bg-zinc-900/30 mb-6">
              <div className="p-4 sm:p-6 border-b border-zinc-800">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <span className="text-amber-600 font-mono text-sm">
                        #{selectedTicket.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-[10px] sm:text-xs px-2 py-1 border font-bold ${STATUS_CONFIG[selectedTicket.status]?.bgColor || STATUS_CONFIG.pending.bgColor}`}>
                        {STATUS_CONFIG[selectedTicket.status]?.label.toUpperCase() || selectedTicket.status}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">{selectedTicket.title}</h3>
                    <p className="text-zinc-500 text-xs sm:text-sm">
                      {SERVICE_NAMES[selectedTicket.service_type] || selectedTicket.service_type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateGlpiStatus(selectedTicket.id, 'in_progress')}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs border transition-all ${
                        selectedTicket.status === 'in_progress'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 cursor-not-allowed'
                          : 'border-zinc-700 text-zinc-400 hover:border-cyan-500 hover:text-cyan-400'
                      }`}
                      disabled={selectedTicket.status === 'in_progress'}
                    >
                      EN COURS
                    </button>
                    <button
                      onClick={() => updateGlpiStatus(selectedTicket.id, 'closed')}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs border transition-all ${
                        selectedTicket.status === 'closed'
                          ? 'bg-zinc-500/20 border-zinc-500 text-zinc-400 cursor-not-allowed'
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                      disabled={selectedTicket.status === 'closed'}
                    >
                      FERMER
                    </button>
                  </div>
                </div>

                {/* Client info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 pt-4 border-t border-zinc-800">
                  {selectedTicket.client_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">{selectedTicket.client_name}</span>
                    </div>
                  )}
                  {selectedTicket.client_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">{selectedTicket.client_email}</span>
                    </div>
                  )}
                  {selectedTicket.client_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-300">{selectedTicket.client_phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-300">{formatDate(selectedTicket.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`${PRIORITY_CONFIG[selectedTicket.priority]?.color}`}>
                      Priorité: {PRIORITY_CONFIG[selectedTicket.priority]?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-6">
                <h4 className="text-zinc-400 text-xs mb-3 font-bold">DESCRIPTION</h4>
                <pre className="text-zinc-300 whitespace-pre-wrap bg-black/50 p-4 border border-zinc-800">
                  {selectedTicket.description}
                </pre>
              </div>

              {/* Existing response */}
              {selectedTicket.response && (
                <div className="p-6 bg-green-950/10 border-t border-green-900">
                  <h4 className="text-green-500 text-xs mb-3 font-bold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    RÉPONSE ENVOYÉE
                  </h4>
                  <pre className="text-green-300 whitespace-pre-wrap bg-black/50 p-4 border border-green-900">
                    {selectedTicket.response}
                  </pre>
                </div>
              )}
            </div>

            {/* Response form */}
            {!selectedTicket.response && selectedTicket.status !== 'closed' && (
              <div className="border-2 border-zinc-800 bg-zinc-900/30 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <Send className="w-5 h-5 text-amber-500" />
                    RÉPONDRE AU CLIENT
                  </h4>
                  
                  {/* Template selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="px-3 py-2 border border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-all text-xs flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>TEMPLATES</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showTemplates && templates.length > 0 && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-zinc-900 border border-zinc-700 shadow-xl z-10 max-h-64 overflow-y-auto">
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => applyTemplate(template)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 border-b border-zinc-800 last:border-0"
                          >
                            <div className="text-white font-medium">{template.name}</div>
                            <div className="text-zinc-500 text-xs mt-0.5">{template.category}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Rédigez votre réponse au client..."
                  className="w-full h-40 bg-black border-2 border-zinc-800 px-4 py-3 text-zinc-300 placeholder-zinc-600 focus:border-amber-600 focus:outline-none resize-none mb-4 text-sm"
                />
                {error && (
                  <div className="bg-red-950/20 border border-red-900 p-3 flex items-start gap-2 mb-4">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
                <button
                  onClick={sendGlpiResponse}
                  disabled={sending || !responseText.trim()}
                  className="terminal-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'ENVOI EN COURS...' : 'ENVOYER LA RÉPONSE'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* PGP Request Detail */}
        {activeTab === 'pgp' && selectedRequest && (
          <div className="max-w-4xl mx-auto p-8">
            <div className="border-2 border-zinc-800 bg-zinc-900/30 mb-6">
              <div className="p-6 border-b border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-amber-600 font-mono">
                        REF:{selectedRequest.id.substring(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-1 border font-bold ${STATUS_CONFIG[selectedRequest.status]?.bgColor || STATUS_CONFIG.pending.bgColor}`}>
                        {STATUS_CONFIG[selectedRequest.status]?.label.toUpperCase() || selectedRequest.status}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {SERVICE_NAMES[selectedRequest.service_type] || selectedRequest.service_type}
                    </h3>
                    <p className="text-zinc-500 text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Communication PGP chiffrée - Client anonyme
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updatePgpStatus(selectedRequest.id, 'in_progress')}
                      className={`px-3 py-2 text-xs border transition-all ${
                        selectedRequest.status === 'in_progress'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 cursor-not-allowed'
                          : 'border-zinc-700 text-zinc-400 hover:border-cyan-500 hover:text-cyan-400'
                      }`}
                      disabled={selectedRequest.status === 'in_progress'}
                    >
                      EN COURS
                    </button>
                    <button
                      onClick={() => updatePgpStatus(selectedRequest.id, 'completed')}
                      className={`px-3 py-2 text-xs border transition-all ${
                        selectedRequest.status === 'completed'
                          ? 'bg-green-500/20 border-green-500 text-green-400 cursor-not-allowed'
                          : 'border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400'
                      }`}
                      disabled={selectedRequest.status === 'completed'}
                    >
                      TERMINER
                    </button>
                  </div>
                </div>
              </div>

              {/* Encrypted message */}
              <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-zinc-400 text-xs font-bold">MESSAGE CHIFFRÉ DU CLIENT</h4>
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedRequest.encrypted_message)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-zinc-600 text-zinc-400 hover:bg-zinc-600/10 transition-all text-xs"
                  >
                    <Copy className="w-3 h-3" />
                    <span>COPIER</span>
                  </button>
                </div>
                <textarea
                  value={selectedRequest.encrypted_message}
                  readOnly
                  className="w-full h-48 bg-black border-2 border-zinc-800 px-4 py-3 text-zinc-400 font-mono text-xs resize-none"
                />
                <p className="text-zinc-500 text-xs mt-2">
                  💡 Copiez ce message et déchiffrez-le manuellement avec GPG.
                </p>
              </div>

              {/* Client public key */}
              <div className="p-6">
                <h4 className="text-zinc-400 text-xs mb-3 font-bold">CLÉ PUBLIQUE DU CLIENT</h4>
                <textarea
                  value={selectedRequest.client_public_key}
                  readOnly
                  className="w-full h-32 bg-black border-2 border-zinc-800 px-4 py-3 text-zinc-400 font-mono text-xs resize-none"
                />
                <p className="text-zinc-600 text-xs mt-2">
                  Utilisez cette clé pour chiffrer votre réponse avec PGP
                </p>
              </div>
            </div>

            {/* Previous responses */}
            {pgpResponses.length > 0 && (
              <div className="border-2 border-zinc-800 bg-zinc-900/30 mb-6">
                <div className="p-4 border-b border-zinc-800">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    RÉPONSES ENVOYÉES ({pgpResponses.length})
                  </h4>
                </div>
                <div className="divide-y divide-zinc-800">
                  {pgpResponses.map((response) => (
                    <div key={response.id} className="p-4">
                      <p className="text-zinc-500 text-xs mb-2">{formatDate(response.created_at)}</p>
                      <textarea
                        value={response.encrypted_response}
                        readOnly
                        className="w-full h-24 bg-black border border-zinc-800 px-3 py-2 text-zinc-400 font-mono text-xs resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response form */}
            <div className="border-2 border-zinc-800 bg-zinc-900/30 p-6">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-500" />
                ENVOYER UNE RÉPONSE CHIFFRÉE
              </h4>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="-----BEGIN PGP MESSAGE-----&#10;&#10;Collez votre réponse chiffrée ici...&#10;&#10;-----END PGP MESSAGE-----"
                className="w-full h-48 bg-black border-2 border-zinc-800 px-4 py-3 text-zinc-300 placeholder-zinc-600 focus:border-amber-600 focus:outline-none font-mono text-sm resize-none mb-4"
              />
              {error && (
                <div className="bg-red-950/20 border border-red-900 p-3 flex items-start gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              <button
                onClick={sendPgpResponse}
                disabled={sending || !responseText.trim()}
                className="terminal-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {sending ? 'ENVOI EN COURS...' : 'ENVOYER LA RÉPONSE'}
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!selectedTicket && !selectedRequest && (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center text-zinc-600">
              <MessageSquare className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 opacity-30" />
              <p className="text-base sm:text-lg">Sélectionnez une demande</p>
              <p className="text-xs sm:text-sm mt-1">pour voir les détails et répondre</p>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mt-4 terminal-button-small flex items-center gap-2 mx-auto"
              >
                <Menu className="w-4 h-4" />
                <span>Voir la liste</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
