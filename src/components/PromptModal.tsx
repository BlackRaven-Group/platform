import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  expectedValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function PromptModal({
  isOpen,
  title,
  message,
  placeholder = '',
  confirmText = 'CONFIRMER',
  cancelText = 'ANNULER',
  expectedValue,
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (expectedValue && value !== expectedValue) {
      return;
    }
    onConfirm(value);
  };

  if (!isOpen) return null;

  const isValid = !expectedValue || value === expectedValue;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-4">
      <div className="terminal-box max-w-md w-full border-red-900 bg-red-950/30">
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-red-900">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-red-400">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-red-400 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-red-400 text-sm mb-4 whitespace-pre-line">{message}</p>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="terminal-input w-full"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValid) {
                handleConfirm();
              } else if (e.key === 'Escape') {
                onCancel();
              }
            }}
          />
          {expectedValue && (
            <p className="text-xs text-red-300 mt-2">
              Tapez "{expectedValue}" pour confirmer
            </p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="terminal-button flex-1"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`terminal-button flex-1 ${
              isValid
                ? 'bg-red-900 hover:bg-red-800 text-white'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
