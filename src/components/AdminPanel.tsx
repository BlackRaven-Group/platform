import { useState, useEffect } from 'react';
import { Users, Shield, Activity, UserCheck, UserX, Clock, Eye, LogOut, LayoutDashboard, Plus, X, AlertCircle, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendAccountApprovedEmail } from '../lib/email';
import AnalyticsDashboard from './AnalyticsDashboard';

interface ClientUser {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  status: string;
  created_at: string;
  last_login: string;
}

interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  permissions: any;
  created_at: string;
  user_email?: string;
}

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
}

interface AdminPanelProps {
  onLogout?: () => void;
  onBackToOSINT?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'ACTIF',
  pending: 'EN ATTENTE',
  suspended: 'SUSPENDU',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'SUPER ADMIN',
  admin: 'ADMIN',
  support: 'SUPPORT',
  viewer: 'LECTEUR',
};

const ACTION_LABELS: Record<string, string> = {
  create_admin: 'Création admin',
  update_client_status_active: 'Activation client',
  update_client_status_suspended: 'Suspension client',
  update_client_status_pending: 'Mise en attente client',
};

export default function AdminPanel({ onLogout, onBackToOSINT }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'admins' | 'activity'>('analytics');
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');
  
  // Create Admin Modal State
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  
  // View Admin Modal State
  const [selectedAdmin, setSelectedAdmin] = useState<AdminRole | null>(null);
  const [newAdminRole, setNewAdminRole] = useState<'super_admin' | 'admin' | 'support' | 'viewer'>('admin');
  const [createAdminLoading, setCreateAdminLoading] = useState(false);
  const [createAdminError, setCreateAdminError] = useState('');
  const [createAdminSuccess, setCreateAdminSuccess] = useState('');

  useEffect(() => {
    loadCurrentUserRole();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setCurrentUserRole(data.role);
        }
      }
    } catch (error) {
      console.error('Erreur chargement rôle:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('client_users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setClientUsers(data);
        }
      } else if (activeTab === 'admins') {
        const { data: roles } = await supabase
          .from('admin_roles')
          .select('*')
          .order('created_at', { ascending: false });

        if (roles) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const rolesWithEmails = await Promise.all(
            roles.map(async (role) => {
              try {
                const response = await fetch(`${supabaseUrl}/functions/v1/get-admin-email`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                  },
                  body: JSON.stringify({ user_id: role.user_id })
                });

                const result = await response.json();
                return {
                  ...role,
                  user_email: result.email || 'Inconnu'
                };
              } catch (err) {
                console.error('Erreur récupération email:', err);
                return {
                  ...role,
                  user_email: 'Inconnu'
                };
              }
            })
          );
          setAdminRoles(rolesWithEmails);
        }
      } else if (activeTab === 'activity') {
        const { data, error } = await supabase
          .from('admin_activity_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data) {
          setActivityLogs(data);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateClientStatus = async (userId: string, newStatus: string) => {
    try {
      // Récupérer les infos du client d'abord
      const { data: clientData } = await supabase
        .from('client_users')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      const { error } = await supabase
        .from('client_users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (!error) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('admin_activity_log')
            .insert({
              admin_id: user.id,
              action: `update_client_status_${newStatus}`,
              target_type: 'client_user',
              target_id: userId,
              details: { new_status: newStatus }
            });
        }

        // Envoyer email si le compte est activé
        if (newStatus === 'active' && clientData?.email) {
          await sendAccountApprovedEmail(
            clientData.email,
            clientData.full_name || 'Client',
            window.location.origin
          );
        }

        loadData();
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 border-green-500';
      case 'pending': return 'text-amber-500 border-amber-500';
      case 'suspended': return 'text-red-500 border-red-500';
      default: return 'text-zinc-500 border-zinc-500';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'text-red-500 border-red-500';
      case 'admin': return 'text-amber-500 border-amber-500';
      case 'support': return 'text-blue-500 border-blue-500';
      case 'viewer': return 'text-zinc-500 border-zinc-500';
      default: return 'text-zinc-500 border-zinc-500';
    }
  };

  const createAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword) {
      setCreateAdminError('Email et mot de passe requis');
      return;
    }

    if (newAdminPassword.length < 8) {
      setCreateAdminError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setCreateAdminLoading(true);
    setCreateAdminError('');
    setCreateAdminSuccess('');

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/setup-admin-users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: newAdminEmail,
          password: newAdminPassword,
          role: newAdminRole,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('admin_activity_log').insert({
          admin_id: user.id,
          action: 'create_admin',
          target_type: 'admin_user',
          target_id: data.userId,
          details: { email: newAdminEmail, role: newAdminRole }
        });
      }

      setCreateAdminSuccess(`Admin créé: ${newAdminEmail}`);
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminRole('admin');
      
      setTimeout(() => {
        setShowCreateAdmin(false);
        setCreateAdminSuccess('');
        loadData();
      }, 2000);
    } catch (err: any) {
      setCreateAdminError(err.message || 'Erreur lors de la création');
    } finally {
      setCreateAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono">
      <div className="scanline"></div>

      <header className="border-b-2 border-green-900 bg-black/90 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="/removal-190.png"
                alt="BlackRaven"
                className="w-12 h-12 opacity-90"
              />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wider glitch" data-text="BLACKRAVEN">
                  BLACKRAVEN
                </h1>
                <p className="text-xs text-zinc-500">PANNEAU D'ADMINISTRATION</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onBackToOSINT && (
                <button
                  onClick={onBackToOSINT}
                  className="px-4 py-2 border-2 border-green-600 text-green-500 hover:bg-green-600 hover:text-black transition-all font-bold text-sm flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>DOSSIERS OSINT</span>
                </button>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="terminal-button flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>DÉCONNEXION</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 glitch" data-text="[PANNEAU_ADMIN]">
            [PANNEAU_ADMIN]
          </h1>
          <p className="text-zinc-500 text-sm">INTERFACE DE GESTION SYSTÈME</p>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 border-b-2 border-zinc-800">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 transition-all text-sm sm:text-base ${
              activeTab === 'analytics'
                ? 'border-amber-600 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">ANALYTICS</span>
            <span className="sm:hidden">STATS</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 transition-all text-sm sm:text-base ${
              activeTab === 'users'
                ? 'border-amber-600 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>CLIENTS</span>
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 transition-all text-sm sm:text-base ${
              activeTab === 'admins'
                ? 'border-amber-600 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">ADMINISTRATEURS</span>
            <span className="sm:hidden">ADMINS</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 transition-all text-sm sm:text-base ${
              activeTab === 'activity'
                ? 'border-amber-600 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">JOURNAL D'ACTIVITÉ</span>
            <span className="sm:hidden">JOURNAL</span>
          </button>
        </div>

        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}

        {loading && activeTab !== 'analytics' ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-zinc-800 border-t-amber-600 rounded-full"></div>
            <p className="mt-4 text-zinc-500">CHARGEMENT DES DONNÉES...</p>
          </div>
        ) : activeTab !== 'analytics' && (
          <>
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="terminal-box">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">[COMPTES_CLIENTS]</h2>
                    <span className="text-zinc-500 text-sm">Total: {clientUsers.length}</span>
                  </div>

                  <div className="space-y-3">
                    {clientUsers.map((user) => (
                      <div key={user.id} className="border-2 border-zinc-800 bg-zinc-950/50 p-4 hover:border-zinc-700 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white font-bold">{user.full_name}</h3>
                              <span className={`px-2 py-1 border text-xs font-bold ${getStatusColor(user.status)}`}>
                                [{STATUS_LABELS[user.status] || user.status.toUpperCase()}]
                              </span>
                            </div>
                            <div className="text-sm text-zinc-500 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-600">EMAIL:</span>
                                <span>{user.email}</span>
                              </div>
                              {user.organization && (
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-600">ORG:</span>
                                  <span>{user.organization}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Créé le: {formatDate(user.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Dernière connexion: {formatDate(user.last_login)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {user.status === 'pending' && (
                              <button
                                onClick={() => updateClientStatus(user.id, 'active')}
                                className="terminal-button-small flex items-center gap-1 text-green-500 hover:text-green-400 border-green-500"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>APPROUVER</span>
                              </button>
                            )}
                            {user.status === 'active' && (
                              <button
                                onClick={() => updateClientStatus(user.id, 'suspended')}
                                className="terminal-button-small flex items-center gap-1 text-red-500 hover:text-red-400 border-red-500"
                              >
                                <UserX className="w-4 h-4" />
                                <span>SUSPENDRE</span>
                              </button>
                            )}
                            {user.status === 'suspended' && (
                              <button
                                onClick={() => updateClientStatus(user.id, 'active')}
                                className="terminal-button-small flex items-center gap-1 text-green-500 hover:text-green-400 border-green-500"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>ACTIVER</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {clientUsers.length === 0 && (
                      <div className="text-center py-8 text-zinc-500">
                        Aucun compte client trouvé
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admins' && (
              <div className="space-y-4">
                <div className="terminal-box">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">[RÔLES_ADMIN]</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 text-sm">Total: {adminRoles.length}</span>
                      <button
                        onClick={() => setShowCreateAdmin(true)}
                        className="terminal-button-small flex items-center gap-1 text-green-500 hover:text-green-400 border-green-500"
                      >
                        <Plus className="w-4 h-4" />
                        <span>CRÉER ADMIN</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {adminRoles.map((admin) => (
                      <div key={admin.id} className="border-2 border-zinc-800 bg-zinc-950/50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white font-bold">{admin.user_email}</h3>
                              <span className={`px-2 py-1 border text-xs font-bold ${getRoleColor(admin.role)}`}>
                                [{ROLE_LABELS[admin.role] || admin.role.toUpperCase()}]
                              </span>
                            </div>
                            <div className="text-sm text-zinc-500">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Créé le: {formatDate(admin.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setSelectedAdmin(admin)}
                              className="terminal-button-small flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              <span>VOIR</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {adminRoles.length === 0 && (
                      <div className="text-center py-8 text-zinc-500">
                        Aucun rôle admin trouvé
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <div className="terminal-box">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">[JOURNAL_ACTIVITÉ]</h2>
                    <span className="text-zinc-500 text-sm">Récent: {activityLogs.length}</span>
                  </div>

                  <div className="space-y-2">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="border border-zinc-800 bg-zinc-950/30 p-3 text-sm">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-amber-600 font-bold">[{ACTION_LABELS[log.action] || log.action}]</span>
                          <span className="text-zinc-500 text-xs">{formatDate(log.created_at)}</span>
                        </div>
                        <div className="text-zinc-400 text-xs">
                          Cible: {log.target_type} / {log.target_id?.substring(0, 8)}...
                        </div>
                      </div>
                    ))}

                    {activityLogs.length === 0 && (
                      <div className="text-center py-8 text-zinc-500">
                        Aucune activité enregistrée
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="terminal-box w-full max-w-md relative">
            <button
              onClick={() => {
                setShowCreateAdmin(false);
                setCreateAdminError('');
                setCreateAdminSuccess('');
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              [CRÉER_ADMIN]
            </h2>

            {createAdminSuccess ? (
              <div className="text-center py-4">
                <div className="text-green-500 text-lg font-bold mb-2">✓ SUCCÈS</div>
                <p className="text-zinc-400">{createAdminSuccess}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Email *</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="terminal-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Mot de passe *</label>
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="terminal-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-sm mb-2">Rôle</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as 'super_admin' | 'admin' | 'support' | 'viewer')}
                    className="terminal-input w-full"
                  >
                    {currentUserRole === 'super_admin' && (
                      <option value="super_admin">SUPER ADMIN - Accès total + gestion admins</option>
                    )}
                    <option value="admin">ADMIN - Gestion complète</option>
                    <option value="support">SUPPORT - Tickets uniquement</option>
                    <option value="viewer">LECTEUR - Lecture seule</option>
                  </select>
                  {currentUserRole === 'super_admin' && (
                    <p className="text-amber-600 text-xs mt-1">
                      ⚠️ Super Admin: peut créer d'autres super admins
                    </p>
                  )}
                </div>

                {createAdminError && (
                  <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-900 rounded">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-red-400 text-sm">{createAdminError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowCreateAdmin(false)}
                    className="terminal-button flex-1"
                    disabled={createAdminLoading}
                  >
                    ANNULER
                  </button>
                  <button
                    onClick={createAdmin}
                    className="terminal-button-primary flex-1 flex items-center justify-center gap-2"
                    disabled={createAdminLoading}
                  >
                    {createAdminLoading ? 'CRÉATION...' : 'CRÉER'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Admin Modal */}
      {selectedAdmin && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="terminal-box w-full max-w-lg">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" />
                [DÉTAILS_ADMIN]
              </h3>
              <button
                onClick={() => setSelectedAdmin(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                <label className="block text-zinc-500 text-xs mb-1">EMAIL</label>
                <p className="text-white font-mono">{selectedAdmin.user_email || 'Non disponible'}</p>
              </div>

              <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                <label className="block text-zinc-500 text-xs mb-1">RÔLE</label>
                <span className={`inline-block px-3 py-1 border text-sm font-bold ${getRoleColor(selectedAdmin.role)}`}>
                  {ROLE_LABELS[selectedAdmin.role] || selectedAdmin.role.toUpperCase()}
                </span>
              </div>

              <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                <label className="block text-zinc-500 text-xs mb-2">PERMISSIONS</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedAdmin.permissions || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-zinc-400 text-xs">{key.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                  <label className="block text-zinc-500 text-xs mb-1">CRÉÉ LE</label>
                  <p className="text-white text-sm">{formatDate(selectedAdmin.created_at)}</p>
                </div>
                <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                  <label className="block text-zinc-500 text-xs mb-1">MODIFIÉ LE</label>
                  <p className="text-white text-sm">{formatDate(selectedAdmin.updated_at || selectedAdmin.created_at)}</p>
                </div>
              </div>

              <div className="border border-zinc-800 bg-zinc-950/50 p-4">
                <label className="block text-zinc-500 text-xs mb-1">USER ID</label>
                <p className="text-zinc-400 font-mono text-xs break-all">{selectedAdmin.user_id}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-6 mt-4 border-t border-zinc-800">
              <button
                onClick={() => setSelectedAdmin(null)}
                className="terminal-button flex-1"
              >
                FERMER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
