/**
 * NPCI UPI (Unified Payments Interface) Deep-Link URI Builder
 * 
 * Standard UPI URI format recognized by all Indian UPI payment apps:
 * Google Pay, PhonePe, Paytm, BHIM, Cred, Amazon Pay, WhatsApp Pay, Navi,
 * and Indian banking apps (iMobile, YONO, HDFC, Axis, etc.).
 * 
 * Protocol:
 * upi://pay?pa=<VPA>&pn=<PayeeName>&am=<Amount>&cu=INR&tn=<Note>&tr=<TransactionRef>
 */

export interface UpiUriParams {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  transactionRef?: string;
}

/**
 * Validates whether a string resembles a valid UPI ID (e.g. name@bank, 9876543210@paytm)
 */
export function isValidUpiId(upiId: string): boolean {
  if (!upiId) return false;
  const trimmed = upiId.trim();
  // Standard format: [handle]@[provider] (e.g. store@icici, mobile@paytm)
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(trimmed);
}

/**
 * Constructs an NPCI-compliant UPI payment deep link string.
 * Keeps '@' unencoded for maximum compatibility with all smartphone QR decoders.
 */
export function buildUpiPaymentUri(params: UpiUriParams): string {
  const { upiId, payeeName, amount, transactionNote = 'Garment OS Purchase', transactionRef } = params;

  const cleanUpiId = (upiId || '').trim();
  if (!cleanUpiId) return '';

  const cleanAmount = Math.max(0, amount).toFixed(2);
  const cleanPayee = encodeURIComponent((payeeName || 'Store Merchant').trim());
  const cleanNote = encodeURIComponent((transactionNote || 'POS Bill').trim());

  let uri = `upi://pay?pa=${cleanUpiId}&pn=${cleanPayee}&am=${cleanAmount}&cu=INR&tn=${cleanNote}`;

  if (transactionRef) {
    uri += `&tr=${encodeURIComponent(transactionRef.trim())}`;
  }

  return uri;
}

