import { Database, Wifi, AlertCircle, CheckCircle } from 'lucide-react';

interface CameraStatusBarProps {
  visible: number;
  total: number;
  cached: boolean;
  loading: boolean;
  error: string | null;
  successRate: number;
  pinsCount?: number;
}

export default function CameraStatusBar({
  visible,
  total,
  cached,
  loading,
  error,
  successRate,
  pinsCount = 0
}: CameraStatusBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur rounded-lg shadow-lg border border-gray-200 px-4 py-2">
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          {cached ? (
            <>
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-gray-600">Cached</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-white" />
              <span className="text-gray-600">Live</span>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300"></div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900">{visible.toLocaleString()}</span>
          <span className="text-gray-500">visible</span>
        </div>

        <div className="h-4 w-px bg-gray-300"></div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>
          <span className="text-gray-500">cameras</span>
        </div>

        {pinsCount > 0 && (
          <>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-blue-600">{pinsCount.toLocaleString()}</span>
              <span className="text-gray-500">pins</span>
            </div>
          </>
        )}

        {successRate > 0 && (
          <>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-1.5">
              {successRate >= 80 ? (
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
              )}
              <span className="text-gray-600">{successRate}% uptime</span>
            </div>
          </>
        )}

        {loading && (
          <>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Loading...</span>
            </div>
          </>
        )}

        {error && !loading && (
          <>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-600">{error}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
