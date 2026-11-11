/**
 * Offline-First PWA Synchronization Manager
 * Tracks online/offline status, buffers offline transactions in localStorage outbox,
 * and synchronizes automatically upon network recovery.
 */

const OFFLINE_OUTBOX_KEY = 'garment_os_offline_outbox_v1';

export interface OfflineQueueItem {
  id: string;
  type: 'sale' | 'customer' | 'payment';
  payload: any;
  queuedAt: number;
}

export function getOfflineOutbox(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed reading offline outbox:', e);
    return [];
  }
}

export function queueOfflineTransaction(type: 'sale' | 'customer' | 'payment', payload: any): void {
  try {
    const current = getOfflineOutbox();
    const item: OfflineQueueItem = {
      id: `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      payload,
      queuedAt: Date.now(),
    };
    current.push(item);
    localStorage.setItem(OFFLINE_OUTBOX_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('garment_os_outbox_changed'));
  } catch (e) {
    console.error('Failed to queue offline transaction:', e);
  }
}

export function clearOfflineOutbox(): void {
  try {
    localStorage.removeItem(OFFLINE_OUTBOX_KEY);
    window.dispatchEvent(new CustomEvent('garment_os_outbox_changed'));
  } catch (e) {
    console.error('Failed clearing offline outbox:', e);
  }
}

export function removeOfflineItem(id: string): void {
  try {
    const current = getOfflineOutbox().filter((i) => i.id !== id);
    localStorage.setItem(OFFLINE_OUTBOX_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('garment_os_outbox_changed'));
  } catch (e) {
    console.error('Failed to remove offline item:', e);
  }
}

