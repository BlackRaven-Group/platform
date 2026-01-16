import { useState } from 'react';
import { Ticket, Send, ArrowLeft, AlertCircle, CheckCircle, User, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendTicketCreatedEmail } from '../lib/email';

interface GLPITicketingProps {
  serviceType: string;
  onBack: () => void;
  onSuccess: () => void;
  clientUserId?: string; // ID du client connecté
}

const SERVICE_NAMES: Record<string, string> = {
  osint_person: 'RECHERCHE_PERSONNE',
  osint_organization: 'ANALYSE_ORGANISATION',
  geolocation: 'GÉOLOCALISATION',
  social_footprint: 'EMPREINTE_NUMÉRIQUE',
  network_analysis: 'ANALYSE_RÉSEAU',
  custom: 'DEMANDE_PERSONNALISÉE',
};

const PRIORITY_LEVELS = [
  { value: 1, label: '[PRIORITÉ_TRÈS_BASSE]', color: 'text-zinc-500' },
  { value: 2, label: '[PRIORITÉ_BASSE]', color: 'text-zinc-500' },
  { value: 3, label: '[PRIORITÉ_MOYENNE]', color: 'text-white' },
  { value: 4, label: '[PRIORITÉ_HAUTE]', color: 'text-orange-500' },
  { value: 5, label: '[PRIORITÉ_TRÈS_HAUTE]', color: 'text-red-500' },
];

export default function GLPITicketing({ serviceType, onBack, onSuccess, clientUserId }: GLPITicketingProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!title.trim() || !description.trim() || !contactName.trim() || !contactEmail.trim()) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        throw new Error('Format d\'email invalide');
      }

      // Get client user ID from localStorage if not provided
      let userId = clientUserId;
      if (!userId) {
        const clientUserStr = localStorage.getItem('client_user');
        if (clientUserStr) {
          const clientUser = JSON.parse(clientUserStr);
          userId = clientUser.id;
        }
      }

      // Build full description with contact info
      const fullDescription = `
[CONTACT]
Nom: ${contactName}
Email: ${contactEmail}
${contactPhone ? `Téléphone: ${contactPhone}` : ''}

[DESCRIPTION]
${description}
      `.trim();

      // Save ticket to database
      const { data: ticket, error: insertError } = await supabase
        .from('glpi_tickets')
        .insert({
          client_user_id: userId || null,
          service_type: serviceType,
          title: title,
          description: fullDescription,
          priority: priority,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setTicketId(ticket.id);
      setSuccess(true);

      // Envoyer email de confirmation
      const ticketRef = ticket.id.substring(0, 8).toUpperCase();
      await sendTicketCreatedEmail(
        contactEmail,
        contactName,
        ticketRef,
        title,
        SERVICE_NAMES[serviceType] || serviceType,
        userId || undefined
      );
      
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono relative overflow-hidden">
      <div className="scanline"></div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDI1NSwwLDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60"></div>

      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>

      <div className="relative z-10 min-h-screen">
        <header className="border-b-2 border-zinc-800 bg-black/90 backdrop-blur">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={onBack}
              className="terminal-button-small flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>[RETOUR]</span>
            </button>
            <div className="flex items-center justify-center gap-4">
              <img
                src="/removal-190.png"
                alt="BlackRaven"
                className="w-10 h-10 opacity-90"
              />
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-zinc-900/50 border border-zinc-800 mb-3">
                  <span className="text-white text-xs font-bold tracking-wider">[{SERVICE_NAMES[serviceType]}]</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider glitch" data-text="[TICKETING_GLPI]">
                  [TICKETING_GLPI]
                </h1>
                <p className="text-zinc-500 text-sm tracking-wider mt-1">SUIVI TEMPS RÉEL</p>
              </div>
            </div>
          </div>
        </header>

        <main className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {success ? (
              <div className="border-2 border-green-700 bg-zinc-900/20 p-8 text-center">
                <CheckCircle className="w-16 h-16 text-zinc-200 mx-auto mb-4 animate-pulse" />
                <h3 className="text-2xl font-bold text-white mb-2">[TICKET_CRÉÉ]</h3>
                {ticketId && (
                  <p className="text-amber-500 font-mono text-sm mb-4">
                    ID: {ticketId.substring(0, 8).toUpperCase()}
                  </p>
                )}
                <p className="text-zinc-500">
                  {'>'} Demande transmise à l'équipe<br />
                  {'>'} Vous serez contacté dans les plus brefs délais<br />
                  {'>'} Conservez l'ID pour le suivi
                </p>
              </div>
            ) : (
              <>
                <div className="terminal-card mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 border-2 border-zinc-800 flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">[SYSTÈME_TICKETING]</h3>
                      <p className="text-zinc-500 leading-relaxed text-sm">
                        {'>'} Suivi transparent de votre demande<br />
                        {'>'} Communication directe avec l'équipe<br />
                        {'>'} Notifications d'avancement en temps réel
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="terminal-card">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      [INFORMATIONS_CONTACT]
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white font-bold mb-2 text-sm">
                          [NOM_COMPLET] <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Jean Dupont"
                          className="terminal-input w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-white font-bold mb-2 text-sm">
                          [EMAIL] <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="jean.dupont@example.com"
                            className="terminal-input w-full pl-11"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white font-bold mb-2 text-sm">
                          [TÉLÉPHONE] <span className="text-zinc-500">(optionnel)</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                          <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+33 6 12 34 56 78"
                            className="terminal-input w-full pl-11"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-2 text-sm">
                      [TITRE_DEMANDE] <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Résumé concis de votre demande"
                      className="terminal-input w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-2 text-sm">
                      [PRIORITÉ]
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="terminal-input w-full"
                    >
                      {PRIORITY_LEVELS.map((level) => (
                        <option key={level.value} value={level.value} className="bg-black">
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-bold mb-2 text-sm">
                      [DESCRIPTION_DÉTAILLÉE] <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez votre demande en détail : objectifs, informations disponibles, délais souhaités, etc."
                      className="terminal-input w-full h-48 resize-none"
                      required
                    />
                  </div>

                  {error && (
                    <div className="border-2 border-red-700 bg-red-950/20 p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm">[ERREUR] {error}</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={onBack}
                      className="terminal-button flex-1"
                      disabled={loading}
                    >
                      [ANNULER]
                    </button>
                    <button
                      type="submit"
                      className="terminal-button-large flex-1 flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        '[ENVOI_EN_COURS...]'
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>[CRÉER_TICKET]</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </main>

        <footer className="border-t-2 border-zinc-800 bg-black/90 backdrop-blur py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-zinc-500 text-xs tracking-wider">
              BLACKRAVEN INTELLIGENCE PLATFORM // GLPI TICKETING SYSTEM
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
