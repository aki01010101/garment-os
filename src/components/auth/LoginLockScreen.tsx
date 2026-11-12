import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_USERS } from '../../data/seedData';
import { UserRole } from '../../types';
import { GarmentOsLogo } from '../common/GarmentOsLogo';
import {
  Lock,
  Unlock,
  ShieldCheck,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Sparkles,
  Cloud,
} from 'lucide-react';

export const LoginLockScreen: React.FC = () => {
  const { currentUser, lockReason, login, unlockScreen, users, cloudUser, setCloudAuthModalOpen } = useApp();


  const [username, setUsername] = useState(currentUser.username);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password.trim()) {
      setErrorMessage('Please enter your staff password.');
      return;
    }

    setIsSubmitting(true);
    // If username matches current user, attempt quick unlock or login
    const result = login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials.');
    } else {
      setPassword('');
      setErrorMessage(null);
    }
  };

  const handleSelectDemoUser = (user: typeof users[0]) => {
    setUsername(user.username);
    setPassword(user.password);
    setErrorMessage(null);
  };

  const handleDirectLogin = (user: typeof users[0]) => {
    setUsername(user.username);
    setPassword(user.password);
    setErrorMessage(null);
    const res = login(user.username, user.password);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to authenticate');
    }
  };


  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Admin (Full Access)',
          color: 'bg-purple-900/60 text-purple-200 border-purple-500/30',
        };
      case 'store_manager':
        return {
          label: 'Store Manager (Operations)',
          color: 'bg-emerald-900/60 text-emerald-200 border-emerald-500/30',
        };
      case 'sales_cashier':
        return {
          label: 'Sales Cashier (POS Only)',
          color: 'bg-amber-900/60 text-amber-200 border-amber-500/30',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Atelier Security Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 px-6 pt-7 pb-5 border-b border-slate-800/80 text-center">
          <div className="flex justify-center mb-3.5">
            <div className="relative">
              <GarmentOsLogo size="lg" className="shadow-lg shadow-indigo-900/40" />
              <div className="absolute -bottom-1 -right-1 p-1 bg-slate-900 rounded-full border border-indigo-500/40 text-indigo-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Garment OS Terminal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Traditional Garments & Retail POS • Front Desk Terminal
          </p>

          {lockReason && (
            <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{lockReason}</span>
            </div>
          )}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Staff Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin, manager, cashier"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Security Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs font-mono font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                autoComplete="current-password"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Unlock Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Terminal</span>
          </button>
        </form>

        {/* Demo Fast Account Switcher */}
        <div className="bg-slate-950/50 p-5 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Fast Demo Staff Switcher (Click to fill)</span>
            </span>
            <span className="text-[10px] text-slate-500">1-click test</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {users.map((user) => {
              const badge = getRoleBadge(user.role);

              const isCurrent = username.toLowerCase() === user.username.toLowerCase();

              return (
                <div
                  key={user.id}
                  onClick={() => handleDirectLogin(user)}
                  className={`text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                    isCurrent
                      ? 'bg-slate-800/90 border-indigo-500/50 ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-950 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-700/50 shrink-0">
                      {user.avatar}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{user.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          (@{user.username})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Pass: <code className="text-indigo-300 font-mono">{user.password}</code>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${badge.color}`}
                    >
                      {user.role === 'admin'
                        ? 'Admin'
                        : user.role === 'store_manager'
                        ? 'Manager'
                        : 'Cashier'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDirectLogin(user);
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-2xs"
                    >
                      Login →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 truncate mr-2">
              <Cloud className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">
                {cloudUser ? `Cloud Synced: @${cloudUser.username || cloudUser.email}` : 'Access store on another laptop or phone?'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setCloudAuthModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-bold underline shrink-0 cursor-pointer"
            >
              {cloudUser ? 'Cloud Status' : 'Sign in to Sync'}
            </button>
          </div>

          <p className="text-[10px] text-slate-500 text-center pt-1">
            System automatically locks after 5 minutes of idle inactivity.
          </p>
        </div>
      </div>
    </div>
  );
};
