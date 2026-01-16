import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Shield, Database, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { calculateGlobalMetrics, type GlobalMetrics } from '../lib/analytics';
import { getAnomalies, runAllPatternDetection, type PatternMatch } from '../lib/patterns';
import { getQueueStatus } from '../lib/queue';
import { runCorrelationAnalysis } from '../lib/correlation';

interface DashboardProps {
  onNavigate?: (view: string, id?: string) => void;
}

export default function IntelligenceDashboard({ onNavigate }: DashboardProps) {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [anomalies, setAnomalies] = useState<PatternMatch[]>([]);
  const [queueStatus, setQueueStatus] = useState({ pending: 0, processing: 0, completed: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    const [metricsData, anomaliesData, queueData] = await Promise.all([
      calculateGlobalMetrics(),
      getAnomalies(),
      getQueueStatus()
    ]);

    setMetrics(metricsData);
    setAnomalies(anomaliesData);
    setQueueStatus(queueData);
    setLoading(false);
  };

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    await runAllPatternDetection();
    await loadDashboardData();
    setAnalyzing(false);
  };

  if (loading) {
    return (
      <div className="terminal-box flex items-center justify-center py-12">
        <div className="text-white animate-pulse">LOADING INTELLIGENCE DASHBOARD...</div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {'>'} INTELLIGENCE DASHBOARD
          </h2>
          <p className="text-sm text-zinc-500">System-wide analytics and insights</p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="terminal-button-primary flex items-center space-x-2"
        >
          <Activity className="w-4 h-4" />
          <span>{analyzing ? 'ANALYZING...' : 'RUN ANALYSIS'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="terminal-box">
          <div className="flex items-center justify-between mb-2">
            <Database className="w-6 h-6 text-amber-600" />
            <div className="text-xs text-zinc-500">DOSSIERS</div>
          </div>
          <div className="text-3xl font-bold text-zinc-200">{metrics.totalDossiers}</div>
          <div className="text-xs text-zinc-500 mt-1">Active investigations</div>
        </div>

        <div className="terminal-box">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-6 h-6 text-amber-600" />
            <div className="text-xs text-zinc-500">TARGETS</div>
          </div>
          <div className="text-3xl font-bold text-zinc-200">{metrics.totalTargets}</div>
          <div className="text-xs text-zinc-500 mt-1">
            +{metrics.recentActivity} last 30 days
          </div>
        </div>

        <div className="terminal-box">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            <div className="text-xs text-zinc-500">DATA POINTS</div>
          </div>
          <div className="text-3xl font-bold text-zinc-200">{metrics.totalDataPoints}</div>
          <div className="text-xs text-zinc-500 mt-1">
            Avg {Math.round(metrics.totalDataPoints / (metrics.totalTargets || 1))} per target
          </div>
        </div>

        <div className="terminal-box">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            <div className="text-xs text-zinc-500">QUALITY</div>
          </div>
          <div className="text-3xl font-bold text-zinc-200">{metrics.averageCompleteness}%</div>
          <div className="text-xs text-zinc-500 mt-1">Data completeness</div>
        </div>
      </div>

      {anomalies.length > 0 && (
        <div className="terminal-box border-yellow-900 bg-yellow-950/10">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <div>
              <h3 className="text-lg font-bold text-yellow-500">ANOMALIES DETECTED</h3>
              <p className="text-xs text-yellow-700">{anomalies.length} unusual patterns found</p>
            </div>
          </div>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((anomaly) => (
              <div
                key={anomaly.id}
                className="border border-yellow-900 p-3 bg-black/30"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-yellow-400 font-semibold">
                    {anomaly.pattern_type.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-yellow-700">
                    {anomaly.match_count} matches
                  </span>
                </div>
                <div className="text-sm text-yellow-600">{anomaly.pattern_value}</div>
                <div className="text-xs text-yellow-800 mt-1">
                  Confidence: {anomaly.confidence_score}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="terminal-box">
          <h3 className="text-lg font-bold text-white mb-4">
            {'>'} DATA BREAKDOWN
          </h3>
          <div className="space-y-3">
            {metrics.topCategories.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="text-zinc-200">{cat.category}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 h-2 bg-green-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(cat.count / metrics.totalDataPoints) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-zinc-500 text-sm w-12 text-right">{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="terminal-box">
          <h3 className="text-lg font-bold text-white mb-4">
            {'>'} OSINT QUEUE STATUS
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-green-900">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-zinc-200">Pending</span>
              </div>
              <span className="text-2xl font-bold text-yellow-500">{queueStatus.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-green-900">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
                <span className="text-zinc-200">Processing</span>
              </div>
              <span className="text-2xl font-bold text-blue-500">{queueStatus.processing}</span>
            </div>
            <div className="flex items-center justify-between p-3 border border-green-900">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <span className="text-zinc-200">Completed</span>
              </div>
              <span className="text-2xl font-bold text-white">{queueStatus.completed}</span>
            </div>
            {queueStatus.failed > 0 && (
              <div className="flex items-center justify-between p-3 border border-red-900 bg-red-950/20">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400">Failed</span>
                </div>
                <span className="text-2xl font-bold text-red-500">{queueStatus.failed}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="terminal-box">
        <h3 className="text-lg font-bold text-white mb-4">
          {'>'} 30-DAY GROWTH TREND
        </h3>
        <div className="h-48 flex items-end justify-between space-x-1">
          {metrics.growthTrend.slice(-30).map((point, index) => {
            const maxValue = Math.max(...metrics.growthTrend.map(p => p.targets), 1);
            const height = (point.targets / maxValue) * 100;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div
                  className="w-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer"
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black border border-green-500 p-2 text-xs whitespace-nowrap z-10">
                  <div className="text-zinc-200">{point.date}</div>
                  <div className="text-zinc-500">{point.targets} targets</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-2">
          <span>{metrics.growthTrend[0]?.date}</span>
          <span>{metrics.growthTrend[metrics.growthTrend.length - 1]?.date}</span>
        </div>
      </div>
    </div>
  );
}
