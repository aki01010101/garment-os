import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  X,
  Laptop,
  Smartphone,
  ShieldCheck,
  Package,
  Receipt,
  Users,
  Database,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Lock,
  Sparkles,
  KeyRound,
  UploadCloud,
  DownloadCloud,
  Building2,
} from 'lucide-react';

export const CloudAuthModal: React.FC = () => {
  const {
    cloudUser,
    isCloudLoading,
    cloudAuthModalOpen,
    setCloudAuthModalOpen,
    signInWithGoogleCloud,
    signInWithEmailCloud,
    signUpWithEmailCloud,
    signOutCloudUser,
    migrateLocalDataToCloud,
    pullFromSupabase,
    cloudSyncState,
    companies,
    products,
    sales,
    customers,
    vendors,
    lastSupabaseSync,
  } = useApp();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!cloudAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your store username or email.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your store password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'signin') {
        const res = await signInWithEmailCloud(cleanId, password);
        if (res.error) {
          if (res.error.toLowerCase().includes('invalid login credentials')) {
            setErrorMessage('Incorrect username/email or password. If this is your first time, switch to "Create Store Account".');
          } else {
            setErrorMessage(res.error);
          }
        } else {
          setSuccessMessage('Successfully signed in! Your store data is now synced across your devices.');
          setTimeout(() => setCloudAuthModalOpen(false), 1400);
        }
      } else {
        const res = await signUpWithEmailCloud(cleanId, password);
        if (res.error) {
          if (res.error.toLowerCase().includes('user already registered')) {
            setErrorMessage('An account with this username/email already exists. Please switch to "Sign In".');
          } else {
            setErrorMessage(res.error);
          }
        } else {
          setSuccessMessage('Store account created! Your current inventory and sales have been backed up to the cloud.');
          setTimeout(() => setCloudAuthModalOpen(false), 1800);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please check network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const res = await signInWithGoogleCloud();
      if (res?.error) {
        setErrorMessage(res.error);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Sign-In failed.');
      setIsSubmitting(false);
    }
  };

  const handlePushOnly = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const pushRes = await migrateLocalDataToCloud();
      if (pushRes.success) {
        setSuccessMessage('Successfully uploaded all local billing entities, products, and settings to the cloud!');
      } else {
        setErrorMessage(pushRes.message || 'Push to cloud failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Push failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePullOnly = async () => {
    if (!confirm('Download latest records from cloud? Your local data will be updated with your account data.')) {
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const pullRes = await pullFromSupabase();
      if (pullRes.success) {
        setSuccessMessage('Successfully pulled latest cloud records to this terminal!');
      } else {
        setErrorMessage(pullRes.message || 'Download from cloud failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Download failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFullSync = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      // 1. PUSH FIRST so local data is permanently preserved in the cloud
      const pushRes = await migrateLocalDataToCloud();
      if (!pushRes.success) {
        setErrorMessage(
          pushRes.message || 'Push to cloud encountered an issue. Local store records were safely preserved.'
        );
        return;
      }
      // 2. THEN PULL updates from other devices
      const pullRes = await pullFromSupabase();
      if (pullRes.success) {
        setSuccessMessage('Full sync complete! All store records are synchronized with your account.');
      } else {
        setSuccessMessage(pullRes.message || 'Sync completed with warnings.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Sync failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Sign out from this terminal? Your local data will remain saved on this browser.')) {
      await signOutCloudUser();
      setSuccessMessage('Signed out successfully.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Multi-Device Cloud Sync</h3>
              <p className="text-xs text-indigo-200/80 font-medium">
                Access your store on laptops, tablets & phones
              </p>
            </div>
          </div>
          <button
            onClick={() => setCloudAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-slate-800">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {cloudUser ? (
            /* ===============================================================
               LOGGED IN STATE: Active Account & Cross-Device Controls
            =============================================================== */
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {cloudUser.username || cloudUser.name || 'Store Account'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Cloud Connected
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {cloudUser.email.endsWith('@garmentos.store')
                        ? `Username: @${cloudUser.username || cloudUser.email.replace('@garmentos.store', '')}`
                        : cloudUser.email}
                    </p>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                      ✓ Real-time sync active across all terminals
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi-Device Sync Stats Card */}
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Laptop className="w-4 h-4" />
                    <span>Synchronized Cloud Store Catalog</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {lastSupabaseSync
                      ? `Synced ${new Date(lastSupabaseSync).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Just now'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700/60">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-1">
                      <Building2 className="w-3 h-3 text-amber-400" />
                      Entities
                    </div>
                    <div className="text-base font-black text-white">{companies.length}</div>
                  </div>

                  <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700/60">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-1">
                      <Package className="w-3 h-3 text-indigo-400" />
                      Products
                    </div>
                    <div className="text-base font-black text-white">{products.length}</div>
                  </div>

                  <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700/60">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-1">
                      <Receipt className="w-3 h-3 text-emerald-400" />
                      Sales
                    </div>
                    <div className="text-base font-black text-white">{sales.length}</div>
                  </div>

                  <div className="bg-slate-800/80 rounded-lg p-2 border border-slate-700/60">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-1">
                      <Users className="w-3 h-3 text-sky-400" />
                      Customers
                    </div>
                    <div className="text-base font-black text-white">{customers.length}</div>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Multi-Terminal Sync Active
                  </span>
                  <span className="text-slate-400">{vendors.length} Vendors</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handlePushOnly}
                  disabled={isSubmitting || cloudSyncState === 'syncing'}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <UploadCloud
                    className={`w-4 h-4 ${
                      isSubmitting || cloudSyncState === 'syncing' ? 'animate-pulse' : ''
                    }`}
                  />
                  <span>
                    {isSubmitting || cloudSyncState === 'syncing'
                      ? 'Synchronizing Store Data...'
                      : 'Upload Local Data to Cloud (Push)'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleFullSync}
                    disabled={isSubmitting || cloudSyncState === 'syncing'}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-600 text-white rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isSubmitting || cloudSyncState === 'syncing' ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Full Sync (Push & Pull)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullOnly}
                    disabled={isSubmitting || cloudSyncState === 'syncing'}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <DownloadCloud className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download Cloud Data (Pull)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2 px-4 bg-transparent hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out from this Device</span>
                </button>
              </div>
            </div>
          ) : (
            /* ===============================================================
               NOT LOGGED IN: Simple Native Store Sign-In Experience
            =============================================================== */
            <div className="space-y-4">
              {/* Explanatory Banner */}
              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <Laptop className="w-4 h-4 text-indigo-600 shrink-0" />
                  <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Use your store on any laptop or phone</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Sign in with your store credentials. Opening this website on any other device will
                  instantly load your entire catalog, sales, customers, and invoices!
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In to Terminal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Store Account
                </button>
              </div>

              {/* Native Auth Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Store Name / Boutique Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Fantasy Sarees & Ethnic"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Store Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. admin, fantasyshop, or store@mybrand.com"
                      required
                      autoFocus
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: You can use a simple word like <code className="font-mono text-indigo-600 font-bold">admin</code> or your email.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>
                        {authMode === 'signin'
                          ? 'Sign In & Sync Store Data'
                          : 'Create Store Account & Sync'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Optional Google Sign-In as secondary alternative */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    or continue with
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google Account</span>
                </button>
              </div>

              {/* Security & Offline Feature note */}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Encrypted Row-Level Security. Offline POS billing continues with 0% latency.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
