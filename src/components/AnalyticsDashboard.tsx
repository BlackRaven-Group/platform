import { useState, useEffect } from 'react';
import { 
  BarChart3, Users, Ticket, Clock, TrendingUp, 
  CheckCircle, AlertCircle, Activity, Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Skeleton } from './Skeleton';

interface Stats {
  totalClients: number;
  activeClients: number;
  pendingClients: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResponseTime: string;
  ticketsThisWeek: number;
  ticketsLastWeek: number;
}

interface RecentActivity {
  id: string;
  type: 'ticket' | 'client' | 'response';
  description: string;
  timestamp: string;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Load client stats
      const { data: clients } = await supabase
        .from('client_users')
        .select('status, created_at');

      const totalClients = clients?.length || 0;
      const activeClients = clients?.filter(c => c.status === 'active').length || 0;
      const pendingClients = clients?.filter(c => c.status === 'pending').length || 0;

      // Load ticket stats
      const { data: tickets } = await supabase
        .from('glpi_tickets')
        .select('status, created_at, updated_at');

      const totalTickets = tickets?.length || 0;
      const openTickets = tickets?.filter(t => 
        ['pending', 'open', 'in_progress'].includes(t.status)
      ).length || 0;
      const resolvedTickets = tickets?.filter(t => 
        ['resolved', 'closed'].includes(t.status)
      ).length || 0;

      // Calculate tickets this week vs last week
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const ticketsThisWeek = tickets?.filter(t => 
        new Date(t.created_at) >= oneWeekAgo
      ).length || 0;

      const ticketsLastWeek = tickets?.filter(t => 
        new Date(t.created_at) >= twoWeeksAgo && new Date(t.created_at) < oneWeekAgo
      ).length || 0;

      // Calculate average response time (simplified)
      const resolvedWithTime = tickets?.filter(t => 
        t.status === 'resolved' || t.status === 'closed'
      ) || [];
      
      let avgHours = 0;
      if (resolvedWithTime.length > 0) {
        const totalHours = resolvedWithTime.reduce((acc, t) => {
          const created = new Date(t.created_at).getTime();
          const updated = new Date(t.updated_at).getTime();
          return acc + (updated - created) / (1000 * 60 * 60);
        }, 0);
        avgHours = totalHours / resolvedWithTime.length;
      }

      const avgResponseTime = avgHours < 24 
        ? `${Math.round(avgHours)}h` 
        : `${Math.round(avgHours / 24)}j`;

      setStats({
        totalClients,
        activeClients,
        pendingClients,
        totalTickets,
        openTickets,
        resolvedTickets,
        avgResponseTime: avgHours === 0 ? '-' : avgResponseTime,
        ticketsThisWeek,
        ticketsLastWeek
      });

      // Build recent activity
      const activities: RecentActivity[] = [];

      // Recent tickets
      const recentTickets = tickets?.slice(0, 5) || [];
      recentTickets.forEach(t => {
        activities.push({
          id: t.created_at + '-ticket',
          type: 'ticket',
          description: 'Nouveau ticket créé',
          timestamp: t.created_at
        });
      });

      // Recent clients
      const recentClients = clients?.slice(0, 3) || [];
      recentClients.forEach(c => {
        activities.push({
          id: c.created_at + '-client',
          type: 'client',
          description: `Nouveau client inscrit (${c.status})`,
          timestamp: c.created_at
        });
      });

      // Sort by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setRecentActivity(activities.slice(0, 8));
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ticket': return <Ticket className="w-4 h-4 text-amber-500" />;
      case 'client': return <Users className="w-4 h-4 text-blue-500" />;
      case 'response': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getTrendIcon = () => {
    if (!stats) return null;
    const trend = stats.ticketsThisWeek - stats.ticketsLastWeek;
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="terminal-box p-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="terminal-box p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Clients */}
        <div className="terminal-box p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs sm:text-sm">CLIENTS</span>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{stats?.totalClients || 0}</div>
          <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">
            {stats?.activeClients} actifs · {stats?.pendingClients} en attente
          </div>
        </div>

        {/* Total Tickets */}
        <div className="terminal-box p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs sm:text-sm">TICKETS</span>
            <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{stats?.totalTickets || 0}</div>
          <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">
            {stats?.openTickets} ouverts · {stats?.resolvedTickets} résolus
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="terminal-box p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs sm:text-sm">TEMPS RÉPONSE</span>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{stats?.avgResponseTime || '-'}</div>
          <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">Moyenne</div>
        </div>

        {/* Weekly Trend */}
        <div className="terminal-box p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs sm:text-sm">CETTE SEMAINE</span>
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold text-white">{stats?.ticketsThisWeek || 0}</span>
            {getTrendIcon()}
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-500 mt-1">
            vs {stats?.ticketsLastWeek || 0} semaine dernière
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="terminal-box p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-white">ACTIVITÉ RÉCENTE</h3>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center text-zinc-500 py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune activité récente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{activity.description}</p>
                  <p className="text-xs text-zinc-500">{formatDate(activity.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
