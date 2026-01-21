import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'CONFIRMER',
  cancelText = 'ANNULER',
  onConfirm,
  onCancel,
  type = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: 'border-red-900 bg-red-950/30',
    warning: 'border-yellow-900 bg-yellow-950/30',
    info: 'border-blue-900 bg-blue-950/30',
  };

  const buttonColors = {
    danger: 'bg-red-900 hover:bg-red-800 text-white',
    warning: 'bg-yellow-900 hover:bg-yellow-800 text-white',
    info: 'bg-blue-900 hover:bg-blue-800 text-white',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className={`terminal-box max-w-md w-full ${colors[type]}`}>
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-current">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-current" />
            <h2 className="text-xl font-bold text-current">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-current opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-current text-sm whitespace-pre-line">{message}</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="terminal-button flex-1"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`terminal-button flex-1 ${buttonColors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
