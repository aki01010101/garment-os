import { CustomerDisplayPayload } from '../types';

const CHANNEL_NAME = 'garment_pos_customer_display';
const STORAGE_KEY = 'garment_customer_display_payload';

let channel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!('BroadcastChannel' in window)) return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      channel = null;
    }
  }
  return channel;
}

/**
 * Broadcast updated cart/payment/completion state to secondary customer display.
 */
export function broadcastCustomerDisplay(payload: CustomerDisplayPayload): void {
  if (typeof window === 'undefined') return;

  const payloadWithTime = {
    ...payload,
    timestamp: Date.now(),
  };

  // 1. Send via native BroadcastChannel (zero-latency in same browser)
  const bc = getBroadcastChannel();
  if (bc) {
    try {
      bc.postMessage(payloadWithTime);
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }

  // 2. Also write to localStorage for multi-window / tab fallback & storage events
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payloadWithTime));
    // Trigger custom event for same-tab subscribers
    window.dispatchEvent(
      new CustomEvent('garment_customer_display_update', { detail: payloadWithTime })
    );
  } catch (e) {
    console.warn('LocalStorage customer display write error:', e);
  }
}

/**
 * Listen for customer display payload updates on the secondary monitor/screen.
 */
export function listenCustomerDisplay(
  callback: (payload: CustomerDisplayPayload) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleMessage = (event: MessageEvent) => {
    if (event.data && typeof event.data === 'object' && 'state' in event.data) {
      callback(event.data as CustomerDisplayPayload);
    }
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        callback(parsed as CustomerDisplayPayload);
      } catch {}
    }
  };

  const handleCustomEvent = (event: Event) => {
    const custom = event as CustomEvent<CustomerDisplayPayload>;
    if (custom.detail) {
      callback(custom.detail);
    }
  };

  const bc = getBroadcastChannel();
  if (bc) {
    bc.addEventListener('message', handleMessage);
  }
  window.addEventListener('storage', handleStorage);
  window.addEventListener('garment_customer_display_update', handleCustomEvent);

  // Return unsubscribe cleanup function
  return () => {
    if (bc) {
      bc.removeEventListener('message', handleMessage);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('garment_customer_display_update', handleCustomEvent);
  };
}

/**
 * Retrieve the current or last known customer display state from local storage.
 */
export function getCurrentCustomerDisplay(): CustomerDisplayPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CustomerDisplayPayload;
  } catch {
    return null;
  }
}

/**
 * Open Customer Display in a dedicated secondary popup window to drag to the customer monitor.
 */
export function openCustomerDisplayWindow(): Window | null {
  if (typeof window === 'undefined') return null;
  const url = `${window.location.origin}${window.location.pathname}?display=customer`;
  const width = 1024;
  const height = 768;
  const left = window.screen.width ? window.screen.width : 0;
  const top = 0;

  const newWindow = window.open(
    url,
    'GarmentPOS_CustomerDisplay',
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
  );

  if (newWindow) {
    newWindow.focus();
  }
  return newWindow;
}

