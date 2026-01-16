import { User, AlertCircle } from 'lucide-react';
import type { Target } from '../lib/supabase';

interface TargetCardProps {
  target: Target;
  onClick: () => void;
}

export default function TargetCard({ target, onClick }: TargetCardProps) {
  const displayName = target.first_name !== 'ND' && target.last_name !== 'ND'
    ? `${target.first_name} ${target.last_name}`
    : target.code_name;

  return (
    <button
      onClick={onClick}
      className="terminal-box text-left hover:border-zinc-600 transition-all group"
    >
      <div className="flex items-start space-x-4">
        {target.profile_image_url ? (
          <img
            src={target.profile_image_url}
            alt={displayName}
            className="w-16 h-16 rounded-sm object-cover border-2 border-zinc-800 group-hover:border-zinc-600"
          />
        ) : (
          <div className="w-16 h-16 rounded-sm bg-zinc-900/20 border-2 border-zinc-800 group-hover:border-zinc-600 flex items-center justify-center">
            <User className="w-8 h-8 text-zinc-500" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-zinc-200 mb-1 truncate group-hover:text-zinc-300">
            {displayName}
          </h3>
          <div className="data-label mb-2">CODE: {target.code_name}</div>
          {target.aliases && target.aliases.length > 0 && (
            <div className="text-xs text-zinc-500">
              AKA: {target.aliases.join(', ')}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
        <span className={`status-badge ${target.status === 'active' ? 'status-active' : 'status-inactive'}`}>
          {target.status.toUpperCase()}
        </span>
        {target.nationality !== 'ND' && (
          <span className="text-xs text-zinc-500">{target.nationality}</span>
        )}
      </div>
    </button>
  );
}
