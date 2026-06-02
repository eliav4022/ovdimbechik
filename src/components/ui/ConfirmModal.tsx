import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  variant = 'info',
  isLoading = false
}) => {
  const colors = {
    danger: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
      icon: AlertTriangle
    },
    warning: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20',
      icon: AlertCircle
    }
  };

  const style = colors[variant];
  const Icon = style.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-2xl ${style.bg} ${style.text}`}>
            <Icon size={24} />
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-black text-slate-900 mb-1">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="font-bold">
            {cancelLabel}
          </Button>
          <Button 
            onClick={onConfirm} 
            isLoading={isLoading}
            className={`font-black rounded-xl px-6 ${style.button} shadow-lg text-white`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
