import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { ShieldAlert } from 'lucide-react';

interface TwoStepConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  message: string;
  confirmWord: string;
  requireReason?: boolean;
  isLoading?: boolean;
}

export const TwoStepConfirmModal: React.FC<TwoStepConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmWord,
  requireReason = true,
  isLoading = false
}) => {
  const [typedWord, setTypedWord] = useState('');
  const [reason, setReason] = useState('');

  const isConfirmed = typedWord.toLowerCase() === confirmWord.toLowerCase();
  const isValid = isConfirmed && (!requireReason || reason.length >= 5);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(reason);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-6">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 mb-6">
          <ShieldAlert className="text-red-500 shrink-0" size={24} />
          <div>
            <h4 className="text-red-900 font-black text-sm mb-1 uppercase tracking-tight">אזהרת אבטחה</h4>
            <p className="text-red-700 text-xs font-bold leading-normal">{message}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-tight">
              הקלד <span className="text-red-600 font-mono">"{confirmWord}"</span> לאישור:
            </label>
            <Input 
              value={typedWord}
              onChange={(e) => setTypedWord(e.target.value)}
              placeholder="..."
              className="font-mono text-center tracking-widest uppercase border-red-100 focus:ring-red-500"
              disabled={isLoading}
            />
          </div>

          {requireReason && (
            <div>
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-tight">
                סיבת הפעולה:
              </label>
              <Input 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="הסבר קצר על סיבת המחיקה/חסימה..."
                className="text-sm font-bold"
                disabled={isLoading}
              />
              <p className="text-[10px] text-slate-400 mt-1 font-medium">לפחות 5 תווים</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="font-bold">
            ביטול
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!isValid || isLoading}
            isLoading={isLoading}
            className="font-black rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 px-8"
          >
            אישור סופי
          </Button>
        </div>
      </div>
    </Modal>
  );
};
