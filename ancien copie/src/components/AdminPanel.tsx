import { useState, useEffect } from 'react';
import { Users, Shield, Activity, Settings, UserCheck, UserX, Clock, Eye, Edit2, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SnakeLogo from './SnakeLogo';

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

export default function AdminPanel({ onLogout, onBackToOSINT }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'admins' | 'activity'>('users');
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [adminRoles, setAdminRoles] = useState<AdminRole[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

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
                  user_email: result.email || 'Unknown'
                };
              } catch (err) {
                console.error('Error fetching email:', err);
                return {
                  ...role,
                  user_email: 'Unknown'
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
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateClientStatus = async (userId: string, newStatus: string) => {
    try {
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
        loadData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
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

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-mono">
      <div className="scanline"></div>

      <header className="border-b-2 border-green-900 bg-black/90 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <SnakeLogo size={48} className="text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white tracking-wider glitch" data-text="BLACKRAVEN">
                  BLACKRAVEN
                </h1>
                <p className="text-xs text-zinc-500">ADMIN MANAGEMENT PANEL</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onBackToOSINT && (
                <button
                  onClick={onBackToOSINT}
                  className="px-4 py-2 border-2 border-green-600 text-green-500 hover:bg-green-600 hover:text-black transition-all font-bold text-sm flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>OSINT DASHBOARD</span>
                </button>
              )}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="terminal-button flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>LOGOUT</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 glitch" data-text="[ADMIN_PANEL]">
            [ADMIN_PANEL]
          </h1>
          <p className="text-zinc-500 text-sm">SYSTEM MANAGEMENT INTERFACE</p>
        </div>

        <div className="flex gap-4 mb-6 border-b-2 border-zinc-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-amber-600 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>CLIENT USERS</span>
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === 'admins'
                ? 'border-amber-600 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span>ADMIN ROLES</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
              activeTab === 'activity'
                ? 'border-amber-600 text-amber-500'
                : 'border-transparent text-zinc-500 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>ACTIVITY LOG</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-zinc-800 border-t-amber-600 rounded-full"></div>
            <p className="mt-4 text-zinc-500">LOADING DATA...</p>
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="terminal-box">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">[CLIENT_USERS]</h2>
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
                                [{user.status.toUpperCase()}]
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
                                <span>Created: {formatDate(user.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Last login: {formatDate(user.last_login)}</span>
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
                                <span>APPROVE</span>
                              </button>
                            )}
                            {user.status === 'active' && (
                              <button
                                onClick={() => updateClientStatus(user.id, 'suspended')}
                                className="terminal-button-small flex items-center gap-1 text-red-500 hover:text-red-400 border-red-500"
                              >
                                <UserX className="w-4 h-4" />
                                <span>SUSPEND</span>
                              </button>
                            )}
                            {user.status === 'suspended' && (
                              <button
                                onClick={() => updateClientStatus(user.id, 'active')}
                                className="terminal-button-small flex items-center gap-1 text-green-500 hover:text-green-400 border-green-500"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>ACTIVATE</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {clientUsers.length === 0 && (
                      <div className="text-center py-8 text-zinc-500">
                        No client users found
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
                    <h2 className="text-xl font-bold text-white">[ADMIN_ROLES]</h2>
                    <span className="text-zinc-500 text-sm">Total: {adminRoles.length}</span>
                  </div>

                  <div className="space-y-3">
                    {adminRoles.map((admin) => (
                      <div key={admin.id} className="border-2 border-zinc-800 bg-zinc-950/50 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white font-bold">{admin.user_email}</h3>
                              <span className={`px-2 py-1 border text-xs font-bold ${getRoleColor(admin.role)}`}>
                                [{admin.role.toUpperCase()}]
                              </span>
                            </div>
                            <div className="text-sm text-zinc-500">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Created: {formatDate(admin.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="terminal-button-small flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>VIEW</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {adminRoles.length === 0 && (
                      <div className="text-center py-8 text-zinc-500">
                        No admin roles found
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
                    <h2 className="text-xl font-bold text-white">[ACTIVITY_LOG]</h2>
                    <span className="text-zinc-500 text-sm">Recent: {activityLogs.length}</span>
                  </div>

                  <div className="space-y-2">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="border border-zinc-800 bg-zinc-950/30 p-3 text-sm">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-amber-600 font-bold">[{log.action}]</span>
                          <span className="text-zinc-500 text-xs">{formatDate(log.created_at)}</span>
                        </div>
                        <div className="text-zinc-400 text-xs">
                          Target: {log.target_type} / {log.target_id?.substring(0, 8)}...
                        </div>
                      </div>
                    ))}

                    {activityLogs.length === 0 && (
                      <div className="text-center py-8 text-zinc-500">
                        No activity logs found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
