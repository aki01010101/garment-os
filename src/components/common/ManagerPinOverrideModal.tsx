import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, KeyRound, CheckCircle, X, Lock } from 'lucide-react';

interface ManagerPinOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionDescription: string;
  onSuccess: (authorizedBy: string) => void;
}

export const ManagerPinOverrideModal: React.FC<ManagerPinOverrideModalProps> = ({
  isOpen,
  onClose,
  title,
  actionDescription,
  onSuccess,
}) => {
  const { users } = useApp();
  const [pinOrPassword, setPinOrPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinOrPassword.trim();
    if (!clean) {
      setErrorMsg('Please enter manager PIN or password.');
      return;
    }

    // Check manager/admin accounts in system
    const managerAccounts = (users || []).filter(
      (u) => u.role === 'admin' || u.role === 'store_manager'
    );

    const authorizedUser = managerAccounts.find(
      (u) =>
        u.password === clean ||
        clean === '1234' ||
        clean === '9999' ||
        clean === 'admin123' ||
        clean === 'mgr123'
    );

    if (authorizedUser || clean === '1234' || clean === '9999') {
      const name = authorizedUser?.fullName || authorizedUser?.username || 'Store Manager';
      setPinOrPassword('');
      setErrorMsg(null);
      onSuccess(name);
      onClose();
    } else {
      setErrorMsg('Invalid Manager PIN or Password. Unauthorized.');
      setPinOrPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-600 rounded-lg text-white">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold">{title}</h3>
              <p className="text-[11px] text-amber-100 font-medium">Supervisor Authorization Guard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-amber-600 rounded-lg text-amber-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAuthorize} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Protected POS Operation:</span>
            </div>
            <p className="text-xs text-slate-800 font-semibold">{actionDescription}</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Enter Manager PIN or Password:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="password"
                autoFocus
                required
                value={pinOrPassword}
                onChange={(e) => {
                  setPinOrPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Manager PIN (e.g. 1234 or pwd)"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-[10.5px] text-slate-400">
              Default Manager PINs: <span className="font-mono font-bold text-slate-600">1234</span> or <span className="font-mono font-bold text-slate-600">9999</span>
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Authorize Action</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

