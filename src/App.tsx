import { useState, useEffect } from 'react';
import { supabase, type Dossier } from './lib/supabase';
import DossierList from './components/DossierList';
import DossierAccess from './components/DossierAccess';
import CreateDossier from './components/CreateDossier';
import OSINTDashboard from './components/OSINTDashboard';
import GoogleMap from './components/GoogleMap';
import SurveillanceMap from './components/SurveillanceMap';
import AuthScreen from './components/AuthScreen';
import ClientAuth from './components/ClientAuth';
import LandingPage from './components/LandingPage';
import ServiceSelection from './components/ServiceSelection';
import CommunicationChoice from './components/CommunicationChoice';
import PGPMessaging from './components/PGPMessaging';
import GLPITicketing from './components/GLPITicketing';
import SupportDashboard from './components/SupportDashboard';
import AdminPanel from './components/AdminPanel';
import ClientTicketsDashboard from './components/ClientTicketsDashboard';
import { LogOut, Shield, FileText, Users, Menu, X, Key } from 'lucide-react';

type ViewType = 'landing' | 'clientAuth' | 'services' | 'commChoice' | 'pgp' | 'glpi' | 'clientTickets' | 'adminLogin' | 'support' | 'list' | 'create' | 'view' | 'osint' | 'map' | 'surveillance' | 'adminPanel';
type UserType = 'none' | 'client' | 'admin';

interface UserPermissions {
  manage_dossiers: boolean;
  manage_tickets: boolean;
  manage_admins: boolean;
  full_access: boolean;
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [userType, setUserType] = useState<UserType>('none');
  const [clientUser, setClientUser] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('client');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newDossierAccessCode, setNewDossierAccessCode] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    manage_dossiers: false,
    manage_tickets: false,
    manage_admins: false,
    full_access: false,
  });

  useEffect(() => {
    // Vérifier les sessions
    checkSessions();
  }, []);

  useEffect(() => {
    if (authenticated && userType === 'admin') {
      checkUserRole();
    }
  }, [authenticated, userType]);

  const checkSessions = async () => {
    const clientToken = localStorage.getItem('client_session_token');
    const clientUserStr = localStorage.getItem('client_user');

    if (clientToken && clientUserStr) {
      try {
        const { data: session, error } = await supabase
          .from('client_sessions')
          .select('*')
          .eq('token', clientToken)
          .maybeSingle();

        if (!error && session && new Date(session.expires_at) > new Date()) {
          const user = JSON.parse(clientUserStr);
          setClientUser(user);
          setUserType('client');
          setAuthenticated(true);
          setCurrentView('services');
          setSessionLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking client session:', err);
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserType('admin');
      setAuthenticated(true);
    }
    setSessionLoading(false);
  };

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        setUserRole('client');
        return;
      }

      console.log('Checking role for user:', user.email, user.id);

      const { data, error } = await supabase
        .from('admin_roles')
        .select('role, permissions')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Admin role query result:', { data, error });

      if (!error && data) {
        const roleName = data.role || 'client';
        const permissions = data.permissions || {};
        console.log('Setting role to:', roleName, 'with permissions:', permissions);
        setUserRole(roleName);
        setUserPermissions({
          manage_dossiers: permissions.manage_dossiers || false,
          manage_tickets: permissions.manage_tickets || false,
          manage_admins: permissions.manage_admins || false,
          full_access: permissions.full_access || false,
        });

        if (roleName === 'support') {
          setCurrentView('support');
        } else if (roleName === 'super_admin' || roleName === 'admin') {
          loadDossiers();
          setCurrentView('list');
        } else {
          loadDossiers();
          setCurrentView('list');
        }
      } else {
        console.error('No admin role found or error:', error);
        setUserRole('client');
        loadDossiers();
        setCurrentView('list');
      }
    } catch (err) {
      console.error('Error checking user role:', err);
      setUserRole('client');
    }
  };

  const loadDossiers = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // For admin users, load all dossiers. For regular users, load only their own dossiers
    let query = supabase
      .from('dossiers')
      .select('*')
      .order('updated_at', { ascending: false });

    // If user is not admin, filter by user_id or null (for OSINT-created dossiers)
    if (userRole !== 'super_admin' && userRole !== 'admin') {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    }

    const { data, error } = await query;

    if (!error && data) {
      setDossiers(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (userType === 'client') {
      const token = localStorage.getItem('client_session_token');
      if (token) {
        await supabase
          .from('client_sessions')
          .delete()
          .eq('token', token);
      }
      localStorage.removeItem('client_session_token');
      localStorage.removeItem('client_user');
      setClientUser(null);
    } else {
      await supabase.auth.signOut();
    }
    setAuthenticated(false);
    setUserType('none');
    setDossiers([]);
    setUserRole('client');
    setCurrentView('clientAuth');
  };

  const handleClientAuthSuccess = (user: any) => {
    setClientUser(user);
    setUserType('client');
    setAuthenticated(true);
    setCurrentView('services');
  };

  const handleViewDossier = (id: string) => {
    setSelectedDossierId(id);
    setCurrentView('view');
  };

  const handleDossierDeleted = () => {
    setCurrentView('list');
    setSelectedDossierId(null);
    loadDossiers();
  };

  const handleDeleteDossier = async (dossierId: string) => {
    if (!window.confirm('⚠️ Êtes-vous ABSOLUMENT SÛR de vouloir supprimer ce dossier définitivement ?\n\nCette action est IRRÉVERSIBLE et supprimera :\n- Tous les targets\n- Toutes les notes\n- Toutes les données associées\n\nTapez "SUPPRIMER" pour confirmer.')) {
      return;
    }

    const confirmation = window.prompt('Tapez "SUPPRIMER" pour confirmer la suppression définitive :');
    if (confirmation !== 'SUPPRIMER') {
      return;
    }

    // Delete all related data
    const { supabase: supabaseClient } = await import('./lib/supabase');
    const { supabase } = supabaseClient;

    // Delete intelligence notes linked to dossier
    await supabase.from('intelligence_notes').delete().eq('dossier_id', dossierId);
    await supabase.from('intelligence_notes').delete().eq('target_id', dossierId);

    // Get all targets in this dossier
    const { data: targets } = await supabase
      .from('targets')
      .select('id')
      .eq('dossier_id', dossierId);

    if (targets) {
      for (const target of targets) {
        // Delete all data for each target
        await supabase.from('intelligence_notes').delete().eq('target_id', target.id);
        await supabase.from('social_media').delete().eq('target_id', target.id);
        await supabase.from('network_data').delete().eq('target_id', target.id);
        await supabase.from('credentials').delete().eq('target_id', target.id);
        await supabase.from('addresses').delete().eq('target_id', target.id);
        await supabase.from('phone_numbers').delete().eq('target_id', target.id);
        await supabase.from('media_files').delete().eq('target_id', target.id);
        await supabase.from('employment').delete().eq('target_id', target.id);
        await supabase.from('connections').delete().eq('target_id', target.id);
      }
      // Delete all targets
      await supabase.from('targets').delete().eq('dossier_id', dossierId);
    }

    // Delete OSINT searches
    await supabase.from('osint_searches').delete().eq('dossier_id', dossierId);

    // Finally delete the dossier
    const { error } = await supabase.from('dossiers').delete().eq('id', dossierId);

    if (error) {
      alert('Erreur lors de la suppression : ' + error.message);
    } else {
      alert('Dossier supprimé définitivement');
      loadDossiers();
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedDossierId(null);
    loadDossiers();
  };

  const handleCreateNew = () => {
    setCurrentView('create');
  };

  const handleAccessServices = () => {
    if (!authenticated) {
      setCurrentView('clientAuth');
    } else {
      setCurrentView('services');
    }
  };

  const handleSelectService = (serviceType: string) => {
    setSelectedServiceType(serviceType);
    setCurrentView('commChoice');
  };

  const handleSelectPGP = () => {
    setCurrentView('pgp');
  };

  const handleSelectGLPI = () => {
    setCurrentView('glpi');
  };

  const handleServiceSuccess = () => {
    setCurrentView('landing');
    setSelectedServiceType(null);
  };

  const handleBackToLanding = () => {
    if (userType === 'client') {
      handleLogout();
    } else {
      setCurrentView('landing');
      setSelectedServiceType(null);
    }
  };

  const handleBackToServices = () => {
    setCurrentView('services');
    setSelectedServiceType(null);
  };

  const handleBackToCommChoice = () => {
    setCurrentView('commChoice');
  };

  const handleGoToClientTickets = () => {
    setCurrentView('clientTickets');
  };

  const handleAdminAccess = () => {
    setCurrentView('adminLogin');
  };

  const handleAdminPanel = () => {
    setCurrentView('adminPanel');
  };

  const handleBackToOSINT = () => {
    loadDossiers();
    setCurrentView('list');
  };

  const handleOSINTDossierCreated = (dossierId: string, accessCode: string) => {
    setNewDossierAccessCode(accessCode);
    setSelectedDossierId(dossierId);
    setCurrentView('view');
    loadDossiers();
  };

  const handleGoToOSINT = () => {
    loadDossiers();
    setCurrentView('list');
  };

  const handleGoToSupport = () => {
    setCurrentView('support');
  };


  // Écran de chargement
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-white font-mono animate-pulse">CHARGEMENT...</div>
        </div>
      </div>
    );
  }

  if (currentView === 'clientAuth') {
    return <ClientAuth
      onAuthSuccess={handleClientAuthSuccess}
      onBack={() => setCurrentView('landing')}
    />;
  }

  if (currentView === 'adminLogin' && !authenticated) {
    return <AuthScreen
      onAuthenticated={() => {
        setAuthenticated(true);
        setUserType('admin');
      }}
      onBack={() => setCurrentView('landing')}
    />;
  }

  if (currentView === 'landing') {
    return <LandingPage onAccessServices={handleAccessServices} onAdminAccess={handleAdminAccess} />;
  }

  if (currentView === 'services') {
    return (
      <ServiceSelection 
        onSelectService={handleSelectService} 
        onBack={handleBackToLanding}
        onViewMyTickets={handleGoToClientTickets}
        hasTickets={true}
      />
    );
  }

  if (currentView === 'clientTickets' && clientUser?.id) {
    return (
      <ClientTicketsDashboard
        clientUserId={clientUser.id}
        onBack={handleBackToServices}
      />
    );
  }

  if (currentView === 'commChoice' && selectedServiceType) {
    return (
      <CommunicationChoice
        serviceType={selectedServiceType}
        onSelectPGP={handleSelectPGP}
        onSelectGLPI={handleSelectGLPI}
        onBack={handleBackToServices}
      />
    );
  }

  if (currentView === 'pgp' && selectedServiceType) {
    return (
      <PGPMessaging
        serviceType={selectedServiceType}
        onBack={handleBackToCommChoice}
        onSuccess={handleServiceSuccess}
        clientUserId={clientUser?.id}
      />
    );
  }

  if (currentView === 'glpi' && selectedServiceType) {
    return (
      <GLPITicketing
        serviceType={selectedServiceType}
        onBack={handleBackToCommChoice}
        onSuccess={handleServiceSuccess}
        clientUserId={clientUser?.id}
      />
    );
  }

  if (currentView === 'support') {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-mono">
        <div className="scanline"></div>
        <header className="border-b-2 border-green-900 bg-black/90 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <img src="/removal-190.png" alt="BlackRaven" className="w-10 h-10 sm:w-12 sm:h-12 opacity-90" />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white tracking-wider glitch" data-text="BLACKRAVEN">
                    BLACKRAVEN
                  </h1>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <p className="text-[10px] sm:text-xs text-zinc-500">DASHBOARD SUPPORT</p>
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 border border-amber-600 text-amber-500">
                      {userRole.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-zinc-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Desktop nav */}
              <div className="hidden lg:flex items-center gap-2">
                {(userPermissions.manage_dossiers || userPermissions.full_access) && (
                  <button
                    onClick={handleGoToOSINT}
                    className="px-3 py-2 border-2 border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400 transition-all font-bold text-xs flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>OSINT</span>
                  </button>
                )}

                {(userPermissions.manage_tickets || userPermissions.full_access) && (
                  <button
                    onClick={handleGoToSupport}
                    className="px-3 py-2 border-2 border-blue-500 bg-blue-500/20 text-blue-400 transition-all font-bold text-xs flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>SUPPORT</span>
                  </button>
                )}

                {(userPermissions.manage_admins || userPermissions.full_access) && (
                  <button
                    onClick={handleAdminPanel}
                    className="px-3 py-2 border-2 border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-all font-bold text-xs flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>ADMIN</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="terminal-button flex items-center space-x-2 text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">DÉCONNEXION</span>
                </button>
              </div>
            </div>

            {/* Mobile nav */}
            {mobileMenuOpen && (
              <div className="lg:hidden mt-4 pt-4 border-t border-zinc-800 space-y-2">
                {(userPermissions.manage_dossiers || userPermissions.full_access) && (
                  <button
                    onClick={() => { handleGoToOSINT(); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 border-2 border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400 transition-all font-bold text-sm flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>OSINT / DOSSIERS</span>
                  </button>
                )}

                {(userPermissions.manage_tickets || userPermissions.full_access) && (
                  <button
                    onClick={() => { handleGoToSupport(); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 border-2 border-blue-500 bg-blue-500/20 text-blue-400 transition-all font-bold text-sm flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>SUPPORT / TICKETS</span>
                  </button>
                )}

                {(userPermissions.manage_admins || userPermissions.full_access) && (
                  <button
                    onClick={() => { handleAdminPanel(); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 border-2 border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-400 transition-all font-bold text-sm flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>PANNEAU ADMIN</span>
                  </button>
                )}

                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full terminal-button flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>DÉCONNEXION</span>
                </button>
              </div>
            )}
          </div>
        </header>
        <SupportDashboard />
      </div>
    );
  }

  if (currentView === 'adminPanel') {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-mono">
        <div className="scanline"></div>
        <header className="border-b-2 border-green-900 bg-black/90 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <img src="/removal-190.png" alt="BlackRaven" className="w-10 h-10 sm:w-12 sm:h-12 opacity-90" />
                <div>
                  <h1 className="text-lg sm:text-2xl font-bold text-white tracking-wider glitch" data-text="BLACKRAVEN">
                    BLACKRAVEN
                  </h1>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <p className="text-[10px] sm:text-xs text-zinc-500">PANNEAU ADMIN</p>
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 border border-amber-600 text-amber-500">
                      {userRole.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-zinc-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Desktop nav */}
              <div className="hidden lg:flex items-center gap-2">
                {(userPermissions.manage_dossiers || userPermissions.full_access) && (
                  <button
                    onClick={handleGoToOSINT}
                    className="px-3 py-2 border-2 border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400 transition-all font-bold text-xs flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>OSINT</span>
                  </button>
                )}

                {(userPermissions.manage_tickets || userPermissions.full_access) && (
                  <button
                    onClick={handleGoToSupport}
                    className="px-3 py-2 border-2 border-zinc-700 text-zinc-400 hover:border-blue-500 hover:text-blue-400 transition-all font-bold text-xs flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>SUPPORT</span>
                  </button>
                )}

                {(userPermissions.manage_admins || userPermissions.full_access) && (
                  <button
                    onClick={handleAdminPanel}
                    className="px-3 py-2 border-2 border-amber-500 bg-amber-500/20 text-amber-400 transition-all font-bold text-xs flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>ADMIN</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="terminal-button flex items-center space-x-2 text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">DÉCONNEXION</span>
                </button>
              </div>
            </div>

            {/* Mobile nav */}
            {mobileMenuOpen && (
              <div className="lg:hidden mt-4 pt-4 border-t border-zinc-800 space-y-2">
                {(userPermissions.manage_dossiers || userPermissions.full_access) && (
                  <button
                    onClick={() => { handleGoToOSINT(); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 border-2 border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400 transition-all font-bold text-sm flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>OSINT / DOSSIERS</span>
                  </button>
                )}

                {(userPermissions.manage_tickets || userPermissions.full_access) && (
                  <button
                    onClick={() => { handleGoToSupport(); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 border-2 border-zinc-700 text-zinc-400 hover:border-blue-500 hover:text-blue-400 transition-all font-bold text-sm flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>SUPPORT / TICKETS</span>
                  </button>
                )}

                {(userPermissions.manage_admins || userPermissions.full_access) && (
                  <button
                    onClick={() => { handleAdminPanel(); setMobileMenuOpen(false); }}
                    className="w-full px-4 py-3 border-2 border-amber-500 bg-amber-500/20 text-amber-400 transition-all font-bold text-sm flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>PANNEAU ADMIN</span>
                  </button>
                )}

                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full terminal-button flex items-center justify-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>DÉCONNEXION</span>
                </button>
              </div>
            )}
          </div>
        </header>
        <AdminPanel onLogout={handleLogout} onBackToOSINT={handleBackToOSINT} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono">
      <div className="scanline"></div>

      <header className="border-b-2 border-green-900 bg-black/90 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img src="/removal-190.png" alt="BlackRaven" className="w-10 h-10 sm:w-12 sm:h-12 opacity-90" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-wider glitch" data-text="BLACKRAVEN">
                  BLACKRAVEN
                </h1>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <p className="text-[10px] sm:text-xs text-zinc-500">PLATEFORME OSINT</p>
                  {userType === 'admin' && (
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 border border-amber-600 text-amber-500">
                      {userRole.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            {userType === 'admin' && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-zinc-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-2">
              {userType === 'admin' && (
                <>
                  {(userPermissions.manage_dossiers || userPermissions.full_access) && (
                    <button
                      onClick={handleGoToOSINT}
                      className={`px-3 py-2 border-2 ${
                        currentView === 'list' || currentView === 'create' || currentView === 'view' || currentView === 'osint' || currentView === 'map' || currentView === 'surveillance'
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400'
                      } transition-all font-bold text-xs flex items-center gap-2`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>OSINT</span>
                    </button>
                  )}

                  {(userPermissions.manage_tickets || userPermissions.full_access) && (
                    <button
                      onClick={handleGoToSupport}
                      className={`px-3 py-2 border-2 ${
                        currentView === 'support'
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-zinc-700 text-zinc-400 hover:border-blue-500 hover:text-blue-400'
                      } transition-all font-bold text-xs flex items-center gap-2`}
                    >
                      <Users className="w-4 h-4" />
                      <span>SUPPORT</span>
                    </button>
                  )}

                  {(userPermissions.manage_admins || userPermissions.full_access) && (
                    <button
                      onClick={handleAdminPanel}
                      className={`px-3 py-2 border-2 ${
                        currentView === 'adminPanel'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                          : 'border-zinc-700 text-zinc-400 hover:border-amber-500 hover:text-amber-400'
                      } transition-all font-bold text-xs flex items-center gap-2`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>ADMIN</span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={handleLogout}
                className="terminal-button flex items-center space-x-2 text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xl:inline">DÉCONNEXION</span>
              </button>
            </div>

            {/* Logout only for non-admin on desktop */}
            {userType !== 'admin' && (
              <button
                onClick={handleLogout}
                className="terminal-button flex items-center space-x-2 text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">DÉCONNEXION</span>
              </button>
            )}
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && userType === 'admin' && (
            <div className="lg:hidden mt-4 pt-4 border-t border-zinc-800 space-y-2">
              {(userPermissions.manage_dossiers || userPermissions.full_access) && (
                <button
                  onClick={() => { handleGoToOSINT(); setMobileMenuOpen(false); }}
                  className={`w-full px-4 py-3 border-2 ${
                    currentView === 'list' || currentView === 'create' || currentView === 'view' || currentView === 'osint' || currentView === 'map' || currentView === 'surveillance'
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : 'border-zinc-700 text-zinc-400'
                  } transition-all font-bold text-sm flex items-center gap-2`}
                >
                  <FileText className="w-4 h-4" />
                  <span>OSINT / DOSSIERS</span>
                </button>
              )}

              {(userPermissions.manage_tickets || userPermissions.full_access) && (
                <button
                  onClick={() => { handleGoToSupport(); setMobileMenuOpen(false); }}
                  className={`w-full px-4 py-3 border-2 ${
                    currentView === 'support'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-zinc-700 text-zinc-400'
                  } transition-all font-bold text-sm flex items-center gap-2`}
                >
                  <Users className="w-4 h-4" />
                  <span>SUPPORT / TICKETS</span>
                </button>
              )}

              {(userPermissions.manage_admins || userPermissions.full_access) && (
                <button
                  onClick={() => { handleAdminPanel(); setMobileMenuOpen(false); }}
                  className={`w-full px-4 py-3 border-2 ${
                    currentView === 'adminPanel'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                      : 'border-zinc-700 text-zinc-400'
                  } transition-all font-bold text-sm flex items-center gap-2`}
                >
                  <Shield className="w-4 h-4" />
                  <span>PANNEAU ADMIN</span>
                </button>
              )}

              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full terminal-button flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>DÉCONNEXION</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {currentView === 'map' ? (
        <GoogleMap onBack={handleBackToList} />
      ) : currentView === 'surveillance' ? (
        <SurveillanceMap onBack={handleBackToList} />
      ) : (
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          {currentView === 'list' && (
            <DossierList
              dossiers={dossiers}
              loading={loading}
              onViewDossier={handleViewDossier}
              onCreateNew={handleCreateNew}
              onOpenOSINT={() => setCurrentView('osint')}
              onOpenMap={() => setCurrentView('map')}
              onOpenSurveillance={() => setCurrentView('surveillance')}
            />
          )}

          {currentView === 'create' && (
            <CreateDossier onBack={handleBackToList} />
          )}

          {currentView === 'view' && selectedDossierId && (
            <>
              {newDossierAccessCode && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur z-50 flex items-center justify-center p-4">
                  <div className="terminal-box max-w-2xl border-white bg-zinc-900/30 w-full">
                    <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-white">
                      <Key className="w-8 h-8 text-white" />
                      <span className="text-zinc-200 font-semibold">CODE D'ACCÈS GÉNÉRÉ</span>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-black border-2 border-white p-6 text-center">
                        <div className="text-xs text-zinc-500 mb-2">NOM DE CODE</div>
                        <div className="text-2xl font-bold text-zinc-200 mb-4 font-mono">
                          {dossiers.find(d => d.id === selectedDossierId)?.code_name || 'INCONNU'}
                        </div>

                        <div className="text-xs text-zinc-500 mb-2">CODE D'ACCÈS</div>
                        <div className="text-4xl font-bold text-white tracking-wider font-mono">{newDossierAccessCode}</div>
                      </div>

                      <div className="bg-red-950/30 border-2 border-red-900 p-4 text-red-400 text-sm">
                        <div className="font-bold mb-2">⚠️ AVERTISSEMENT DE SÉCURITÉ</div>
                        <ul className="space-y-1 text-xs">
                          <li>• Conservez ce code en lieu sûr - il ne sera PLUS affiché</li>
                          <li>• 5 tentatives d'accès échouées supprimeront définitivement ce dossier</li>
                          <li>• Aucune récupération possible après suppression</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex justify-end mt-6 pt-6 border-t border-zinc-800">
                      <button 
                        onClick={() => {
                          setNewDossierAccessCode(null);
                        }} 
                        className="terminal-button-primary"
                      >
                        COMPRIS
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <DossierAccess
                dossierId={selectedDossierId}
                codeName={dossiers.find(d => d.id === selectedDossierId)?.code_name || 'INCONNU'}
                onBack={handleBackToList}
                onDeleted={handleDossierDeleted}
              />
            </>
          )}

          {currentView === 'osint' && (
            <OSINTDashboard 
              onClose={handleBackToList}
              onDossierCreated={handleOSINTDossierCreated}
            />
          )}
        </main>
      )}

      <footer className="border-t-2 border-green-900 bg-black/90 backdrop-blur mt-8 sm:mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-center items-center text-[10px] sm:text-xs text-zinc-500">
            BLACKRAVEN - Plateforme de Renseignement
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
