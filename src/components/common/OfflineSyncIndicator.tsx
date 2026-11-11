import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getOfflineOutbox, clearOfflineOutbox, OfflineQueueItem } from '../../utils/offlineSync';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  HardDrive,
  X,
} from 'lucide-react';

export const OfflineSyncIndicator: React.FC = () => {
  const { pushToSupabase, isSupabaseAutoSync, lastSupabaseSync } = useApp();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [outbox, setOutbox] = useState<OfflineQueueItem[]>(() => getOfflineOutbox());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when back online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleOutboxChange = () => {
      setOutbox(getOfflineOutbox());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('garment_os_outbox_changed', handleOutboxChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('garment_os_outbox_changed', handleOutboxChange);
    };
  }, []);

  const triggerSync = async () => {
    if (!navigator.onLine) {
      setSyncFeedback('Cannot sync while offline.');
      setTimeout(() => setSyncFeedback(null), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await pushToSupabase();
      clearOfflineOutbox();
      setOutbox([]);
      setSyncFeedback('Synced all transactions to cloud successfully!');
    } catch (e: any) {
      console.warn('Sync attempt notice:', e);
      setSyncFeedback('Local data saved. Cloud sync will retry automatically.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  return (
    <div className="relative">
      {/* Status Pill in Navbar */}
      <button
        type="button"
        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
          !isOnline
            ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
            : outbox.length > 0
            ? 'bg-sky-50 text-sky-800 border-sky-300'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}
        title={
          !isOnline
            ? 'Offline Mode: Local billing & thermal printing continue with 0% latency.'
            : outbox.length > 0
            ? `${outbox.length} local bills pending cloud sync`
            : 'Connected & Synced'
        }
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Offline Mode</span>
            {outbox.length > 0 && (
              <span className="bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                {outbox.length}
              </span>
            )}
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
            <span className="hidden sm:inline">Syncing...</span>
          </>
        ) : outbox.length > 0 ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Sync ({outbox.length})</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden md:inline">Online</span>
          </>
        )}
      </button>

      {/* Details Dropdown Drawer */}
      {isDetailsOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 z-50 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Offline-First Billing Engine</span>
            </span>
            <button
              onClick={() => setIsDetailsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-600">
              <span>Connection Status:</span>
              <span
                className={`font-bold capitalize flex items-center gap-1 ${
                  isOnline ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3" /> Online
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" /> Offline (Local Active)
                  </>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Offline Outbox:</span>
              <strong className="font-mono text-slate-900">
                {outbox.length} transactions queued
              </strong>
            </div>

            {lastSupabaseSync && (
              <div className="text-[10px] text-slate-400">
                Last Cloud Sync: {new Date(lastSupabaseSync).toLocaleTimeString('en-IN')}
              </div>
            )}
          </div>

          <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-snug">
            💡 <strong>Zero Downtime Guarantee:</strong> If the internet goes down, billing, barcode scanning, and thermal printing continue instantly with local persistent storage.
          </div>

          {syncFeedback && (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-medium">
              {syncFeedback}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={triggerSync}
              disabled={isSyncing || !isOnline}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now with Cloud'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

