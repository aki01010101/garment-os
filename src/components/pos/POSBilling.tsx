import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ClothingCategory, AlterationDetails } from '../../types';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  UserPlus,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
  Printer,
  Building2,
  AlertCircle,
  Tag,
  X,
  UserCheck,
  Volume2,
  VolumeX,
  Scissors,
  Ticket,
  User,
  Keyboard,
  Camera,
  Crown,
  History,
  Users,
  Link2,
  Heart,
  CheckCircle2,
  PlusCircle,
  Pause,
  Layers,
  Bookmark,
  Clock,
  Wallet,
  ArrowDown,
} from 'lucide-react';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';
import { CustomerPurchasesModal } from '../crm/CustomerPurchasesModal';
import { CustomerProfileModal } from '../crm/CustomerProfileModal';
import { computeCustomerSpendMetrics } from '../../utils/crmUtils';
import { UpiPaymentQr } from '../common/UpiPaymentQr';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { StoreCreditNotesModal } from './StoreCreditNotesModal';

export const POSBilling: React.FC = () => {
  const {
    products,
    companies,
    activeCompanyId,
    activeCompany,
    setActiveCompanyId,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQty,
    updateCartItemDiscount,
    updateCartItemAlteration,
    clearCart,
    customers,
    selectedCustomerId,
    selectedCustomer,
    setSelectedCustomerId,
    addCustomer,
    updateCustomer,
    redeemedPoints,
    setRedeemedPoints,
    loyaltyConfig,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    appliedCreditNote,
    applyCreditNoteCode,
    removeCreditNote,
    creditNotes,
    selectedAssociate,
    setSelectedAssociate,
    salesAssociates,
    soundEnabled,
    setSoundEnabled,
    checkoutSale,
    sales,
    storeUpiId,
    storeUpiName,
    lastCompletedSale,
    startNextSale,
    activeReceipt,
    setActiveReceipt,
    setIsReceiptModalOpen,
    parkedCarts,
    parkCurrentCart,
    recallParkedCart,
    deleteParkedCart,
    clearAllParkedCarts,
    promotions,
    calculatePromotionsDiscount,
    storeGoogleReviewUrl,
  } = useApp();

  const [isDigitalReceiptModalOpen, setIsDigitalReceiptModalOpen] = useState(false);
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  const [isFamilySizingModalOpen, setIsFamilySizingModalOpen] = useState(false);
  const [isPosProfileModalOpen, setIsPosProfileModalOpen] = useState(false);
  const [isParkModalOpen, setIsParkModalOpen] = useState(false);
  const [isHoldCartPromptOpen, setIsHoldCartPromptOpen] = useState(false);
  const [parkTicketLabel, setParkTicketLabel] = useState('');
  const [ticketToRecall, setTicketToRecall] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Card' | 'UPI' | 'Split'>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitUpi, setSplitUpi] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Rate GST Tax Mode override (null = inherit from activeCompany.taxInclusive)
  const [taxInclusiveOverride, setTaxInclusiveOverride] = useState<boolean | null>(null);
  const isTaxInclusive = taxInclusiveOverride !== null ? taxInclusiveOverride : (activeCompany.taxInclusive !== false);

  useEffect(() => {
    setTaxInclusiveOverride(null);
  }, [activeCompanyId]);

  // Coupon & Credit Note inputs
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [creditNoteInput, setCreditNoteInput] = useState('');
  const [creditNoteError, setCreditNoteError] = useState<string | null>(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);

  // Alteration Modal on cart item
  const [alterationModalItem, setAlterationModalItem] = useState<{
    productId: string;
    productName: string;
    size: string;
    color: string;
    details: AlterationDetails;
  } | null>(null);

  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Shortcuts (F2 / Slash for Search, F4 for Payment mode, Ctrl+Enter for Checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when typing inside an input/textarea (except function keys)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'F2' || (!isInput && e.key === '/')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        setPaymentMode((prev) => {
          if (prev === 'Cash') return 'UPI';
          if (prev === 'UPI') return 'Card';
          if (prev === 'Card') return 'Split';
          return 'Cash';
        });
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsHoldCartPromptOpen(true);
        } else {
          setIsParkModalOpen(true);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (cart.length > 0) {
          handleCheckout();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Clear scan feedback after timeout
  useEffect(() => {
    if (scanFeedback) {
      const timer = setTimeout(() => setScanFeedback(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [scanFeedback]);

  // Search results for autocomplete dropdown
  const searchResults = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.color.toLowerCase().includes(q) ||
          p.subCategory.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, searchQuery]);

  // If a completed sale is being shown, adding a new item automatically resets for next sale
  const safeAddToCart = (product: Product, qty: number = 1) => {
    if (lastCompletedSale) {
      startNextSale();
    }
    addToCart(product, qty);
  };

  // Barcode / SKU quick-scan detector & Enter key handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const exactMatch = products.find(
        (p) => p.barcode.toLowerCase() === q || p.sku.toLowerCase() === q
      );

      if (exactMatch) {
        safeAddToCart(exactMatch, 1);
        setScanFeedback(`Added: ${exactMatch.name} (${exactMatch.size})`);
        setSearchQuery('');
        return;
      }

      if (searchResults.length > 0) {
        safeAddToCart(searchResults[0], 1);
        setScanFeedback(`Added: ${searchResults[0].name} (${searchResults[0].size})`);
        setSearchQuery('');
      }
    }
  };

  const handleSelectSearchResult = (product: Product) => {
    safeAddToCart(product, 1);
    setScanFeedback(`Added: ${product.name} (${product.size})`);
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const sampleBarcodes = useMemo(() => {
    return products.slice(0, 6).map((p) => ({
      label: `${p.name} (${p.size})`,
      code: p.barcode,
      type: 'EAN-13',
    }));
  }, [products]);

  // Parked Cart Handlers
  const handleHoldCart = (customLabel?: string) => {
    if (cart.length === 0) return;
    try {
      const ticket = parkCurrentCart(customLabel);
      setScanFeedback(`Bill held: ${ticket.label}`);
      setIsHoldCartPromptOpen(false);
      setParkTicketLabel('');
    } catch (err: any) {
      alert(err.message || 'Could not hold bill');
    }
  };

  const handleRecallTicket = (ticketId: string) => {
    const target = parkedCarts.find((p) => p.id === ticketId);
    if (!target) return;

    if (cart.length > 0) {
      setTicketToRecall(target);
      return;
    }

    recallParkedCart(ticketId);
    setIsParkModalOpen(false);
    setScanFeedback(`Resumed: ${target.label}`);
  };

  const confirmRecallWithHold = () => {
    if (!ticketToRecall) return;
    try {
      parkCurrentCart();
      recallParkedCart(ticketToRecall.id);
      setIsParkModalOpen(false);
      setTicketToRecall(null);
      setScanFeedback(`Current bill held & resumed ${ticketToRecall.label}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const confirmRecallWithDiscard = () => {
    if (!ticketToRecall) return;
    clearCart();
    recallParkedCart(ticketToRecall.id);
    setIsParkModalOpen(false);
    setTicketToRecall(null);
    setScanFeedback(`Resumed: ${ticketToRecall.label}`);
  };

  const handleCameraScan = (scannedText: string) => {
    const q = scannedText.trim().toLowerCase();
    const exactMatch = products.find(
      (p) => p.barcode.toLowerCase() === q || p.sku.toLowerCase() === q
    );

    if (exactMatch) {
      safeAddToCart(exactMatch, 1);
      setScanFeedback(`Scanned & Added: ${exactMatch.name} (${exactMatch.size})`);
    } else {
      setSearchQuery(scannedText);
      setIsSearchFocused(true);
      setScanFeedback(`Code: ${scannedText}`);
    }
  };

  // Cart financial computations
  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let discounts = 0;
    let taxes = 0;
    let taxableAmount = 0;
    let totalExclusiveTax = 0;
    let totalInclusiveTax = 0;

    cart.forEach((item) => {
      const itemGross = item.unitPrice * item.quantity;
      const itemDisc = (itemGross * item.discountPercent) / 100;
      const net = itemGross - itemDisc;
      
      const itemIsInclusive = item.product.taxInclusive !== undefined ? item.product.taxInclusive : isTaxInclusive;

      // Dynamic Indian Garment GST Slabs: <= ₹1000 attracts 5%, > ₹1000 attracts 12%
      let taxRate = activeCompany.type === 'billed' ? item.product.taxRate : 0;
      if (activeCompany.type === 'billed' && activeCompany.enableDynamicGarmentGst !== false) {
        const netPerUnit = net / (item.quantity || 1);
        taxRate = netPerUnit <= 1000 ? 5 : 12;
      }

      let tax = 0;
      if (activeCompany.type === 'billed') {
        if (itemIsInclusive) {
          tax = net - net / (1 + taxRate / 100);
          totalInclusiveTax += tax;
          taxableAmount += (net - tax);
        } else {
          tax = (net * taxRate) / 100;
          totalExclusiveTax += tax;
          taxableAmount += net;
        }
      } else {
        taxableAmount += net;
      }

      subtotal += itemGross;
      discounts += itemDisc;
      taxes += tax;
    });

    const maxRedeemablePoints = selectedCustomer
      ? Math.min(
        selectedCustomer.loyaltyPoints,
        Math.floor((subtotal - discounts) / loyaltyConfig.pointRedemptionValue)
      )
      : 0;

    const actualRedeemedPoints = Math.min(redeemedPoints, maxRedeemablePoints);
    const loyaltyDiscountAmount = actualRedeemedPoints * loyaltyConfig.pointRedemptionValue;

    // Coupon calculation
    let couponDiscountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'percentage') {
        couponDiscountAmount = ((subtotal - discounts) * appliedCoupon.discountValue) / 100;
      } else {
        couponDiscountAmount = appliedCoupon.discountValue;
      }
    }

    // Credit Note calculation
    let creditNoteDiscountAmount = 0;
    if (appliedCreditNote) {
      creditNoteDiscountAmount = Math.min(
        appliedCreditNote.remainingAmount,
        Math.max(0, subtotal - discounts - loyaltyDiscountAmount - couponDiscountAmount)
      );
    }

    // Promotional Engine Discounts (BOGO, Cart Slabs, Bundle Deals)
    const promoResult = calculatePromotionsDiscount(cart);
    const promoDiscountAmount = promoResult.discountAmount;

    const grandTotal = Math.max(
      0,
      Math.round(
        subtotal -
        discounts -
        promoDiscountAmount +
        totalExclusiveTax -
        loyaltyDiscountAmount -
        couponDiscountAmount -
        creditNoteDiscountAmount
      )
    );

    const pointsEarnedOnThisBill = Math.floor(grandTotal / 100) * loyaltyConfig.pointsPerHundredSpent;

    return {
      subtotal,
      discounts,
      taxes,
      taxableAmount,
      totalExclusiveTax,
      totalInclusiveTax,
      isTaxInclusive,
      promoDiscountAmount,
      appliedPromoRule: promoResult.appliedRule,
      promoExplanation: promoResult.explanation,
      loyaltyDiscountAmount,
      couponDiscountAmount,
      creditNoteDiscountAmount,
      grandTotal,
      maxRedeemablePoints,
      pointsEarnedOnThisBill,
    };
  }, [
    cart,
    activeCompany.type,
    activeCompany.enableDynamicGarmentGst,
    isTaxInclusive,
    selectedCustomer,
    redeemedPoints,
    loyaltyConfig,
    appliedCoupon,
    appliedCreditNote,
    calculatePromotionsDiscount,
    promotions,
  ]);

  const tenderedAmount = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedAmount - cartSummary.grandTotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const res = applyCouponCode(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput('');
    }
  };

  // Phone normalization for reliable matching
  const normalizePhone = (p?: string) => (p || '').replace(/[\s\-\+]/g, '').slice(-10);

  // Active store credit notes with positive remaining balance
  const activeCreditNotes = useMemo(() => {
    return creditNotes.filter((cn) => cn.status === 'active' && cn.remainingAmount > 0);
  }, [creditNotes]);

  // Credit notes specifically belonging to selected customer
  const customerCreditNotes = useMemo(() => {
    if (!selectedCustomer) return [];
    const cleanCustomerPhone = normalizePhone(selectedCustomer.phone);
    const cleanCustomerName = selectedCustomer.name.trim().toLowerCase();

    return activeCreditNotes.filter((cn) => {
      const cnPhone = normalizePhone(cn.customerPhone);
      const cnName = (cn.customerName || '').trim().toLowerCase();
      const phoneMatches = Boolean(cleanCustomerPhone && cnPhone && cleanCustomerPhone === cnPhone);
      const nameMatches = Boolean(cleanCustomerName && cnName && cleanCustomerName === cnName);
      return phoneMatches || nameMatches;
    });
  }, [activeCreditNotes, selectedCustomer]);

  const totalCustomerCredit = useMemo(() => {
    return customerCreditNotes.reduce((sum, cn) => sum + cn.remainingAmount, 0);
  }, [customerCreditNotes]);

  const getCustomerCreditBalance = (cust: { name: string; phone?: string }) => {
    const cleanPhone = normalizePhone(cust.phone);
    const cleanName = cust.name.trim().toLowerCase();
    return activeCreditNotes
      .filter((cn) => {
        const cnPhone = normalizePhone(cn.customerPhone);
        const cnName = (cn.customerName || '').trim().toLowerCase();
        return (cleanPhone && cnPhone && cleanPhone === cnPhone) || (cleanName && cnName && cleanName === cnName);
      })
      .reduce((sum, cn) => sum + cn.remainingAmount, 0);
  };

  const handleApplyCreditNoteDirect = (code: string) => {
    setCreditNoteError(null);
    const res = applyCreditNoteCode(code);
    if (!res.success) {
      setCreditNoteError(res.message);
    } else {
      setCreditNoteInput('');
      setScanFeedback(`Credit Note ${code} Applied!`);
    }
  };

  const handleSelectCreditNote = (cn: any) => {
    const res = applyCreditNoteCode(cn.code);
    if (res.success) {
      if (!selectedCustomerId) {
        const cnPhone = normalizePhone(cn.customerPhone);
        const matched = customers.find(
          (c) =>
            (cnPhone && normalizePhone(c.phone) === cnPhone) ||
            c.name.trim().toLowerCase() === cn.customerName.trim().toLowerCase()
        );
        if (matched) {
          setSelectedCustomerId(matched.id);
        }
      }
      setCreditNoteError(null);
      setScanFeedback(`Credit Note ${cn.code} Applied (₹${cn.remainingAmount})`);
    } else {
      setCreditNoteError(res.message);
    }
  };

  const handleApplyCreditNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNoteInput.trim()) return;
    setCreditNoteError(null);
    const res = applyCreditNoteCode(creditNoteInput);
    if (!res.success) {
      setCreditNoteError(res.message);
    } else {
      setCreditNoteInput('');
      setScanFeedback('Credit Note Applied!');
    }
  };

  // Split payment computations
  const splitCashVal = parseFloat(splitCash) || 0;
  const splitUpiVal = parseFloat(splitUpi) || 0;
  const splitCardVal = parseFloat(splitCard) || 0;
  const splitAllocatedTotal = Math.round((splitCashVal + splitUpiVal + splitCardVal) * 100) / 100;
  const splitRemaining = Math.max(0, Math.round((cartSummary.grandTotal - splitAllocatedTotal) * 100) / 100);
  const splitChangeDue = Math.max(0, Math.round((splitAllocatedTotal - cartSummary.grandTotal) * 100) / 100);

  const handleFillSplitRemaining = (tender: 'cash' | 'upi' | 'card') => {
    let otherSum = 0;
    if (tender === 'cash') otherSum = splitUpiVal + splitCardVal;
    else if (tender === 'upi') otherSum = splitCashVal + splitCardVal;
    else if (tender === 'card') otherSum = splitCashVal + splitUpiVal;

    const remainder = Math.max(0, Math.round((cartSummary.grandTotal - otherSum) * 100) / 100);
    if (tender === 'cash') setSplitCash(remainder > 0 ? remainder.toString() : '');
    else if (tender === 'upi') setSplitUpi(remainder > 0 ? remainder.toString() : '');
    else if (tender === 'card') setSplitCard(remainder > 0 ? remainder.toString() : '');
  };

  const handlePresetSplit = (mode: '50-cash-upi' | '50-cash-card' | '50-upi-card' | 'clear') => {
    if (mode === 'clear') {
      setSplitCash('');
      setSplitUpi('');
      setSplitCard('');
      return;
    }
    const half = Math.floor(cartSummary.grandTotal / 2);
    const rest = cartSummary.grandTotal - half;

    if (mode === '50-cash-upi') {
      setSplitCash(half.toString());
      setSplitUpi(rest.toString());
      setSplitCard('');
    } else if (mode === '50-cash-card') {
      setSplitCash(half.toString());
      setSplitCard(rest.toString());
      setSplitUpi('');
    } else if (mode === '50-upi-card') {
      setSplitUpi(half.toString());
      setSplitCard(rest.toString());
      setSplitCash('');
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMode === 'Split') {
      if (cartSummary.grandTotal > 0 && splitAllocatedTotal < cartSummary.grandTotal) {
        alert(
          `Please allocate the full bill total of ₹${cartSummary.grandTotal.toFixed(2)}. Unallocated remaining: ₹${splitRemaining.toFixed(2)}`
        );
        return;
      }
      if (cartSummary.grandTotal > 0 && splitAllocatedTotal === 0) {
        alert('Please enter split amounts across Cash, UPI, or Card.');
        return;
      }
    }

    try {
      const splitBreakdown =
        paymentMode === 'Split'
          ? {
            cash: splitCashVal,
            upi: splitUpiVal,
            card: splitCardVal,
          }
          : undefined;

      checkoutSale(
        paymentMode,
        paymentMode === 'Cash'
          ? tenderedAmount || cartSummary.grandTotal
          : paymentMode === 'Split' && splitCashVal > 0
            ? splitCashVal
            : undefined,
        saleNotes,
        splitBreakdown,
        isTaxInclusive
      );
      setCashTendered('');
      setSplitCash('');
      setSplitUpi('');
      setSplitCard('');
      setSaleNotes('');
    } catch (err: any) {
      alert(err.message || 'Error checking out sale');
    }
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
    });
    setSelectedCustomerId(created.id);
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  const handleSaveAlteration = () => {
    if (!alterationModalItem) return;
    updateCartItemAlteration(alterationModalItem.productId, {
      ...alterationModalItem.details,
      needed: true,
    });
    setAlterationModalItem(null);
  };

  const filteredCustomerList = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 6);
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, customerSearch]);

  return (
    <div className="space-y-4">
      {/* 1. ACTIVE BILLING COMPANY BAR & POS UTILITIES */}
      <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-semibold hidden xs:inline">Billing Entity:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {companies.map((comp) => {
              const isSelected = comp.id === activeCompanyId;
              const isBilled = comp.type === 'billed';
              return (
                <button
                  key={comp.id}
                  onClick={() => setActiveCompanyId(comp.id)}
                  className={`px-2.5 sm:px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold flex items-center gap-1.5 sm:gap-2 border transition-all cursor-pointer ${isSelected
                      ? isBilled
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${isBilled ? 'bg-indigo-300' : 'bg-emerald-300'
                      }`}
                  />
                  <span>{comp.name}</span>
                  <span className="font-mono text-[10px] opacity-80">
                    ({comp.invoicePrefix}{comp.currentInvoiceNumber})
                  </span>
                </button>
              );
            })}
          </div>

          {activeCompany.type === 'billed' && (
            <div className="flex items-center gap-1.5 sm:border-l sm:border-slate-200 sm:pl-3">
              <span className="text-[11px] font-medium text-slate-500 hidden md:inline">Rate Tax:</span>
              <button
                type="button"
                onClick={() => setTaxInclusiveOverride(!isTaxInclusive)}
                title={isTaxInclusive ? "Rate includes GST (MRP). Click to switch to GST Added Separately (+Tax)" : "Rate excludes GST (Added on top). Click to switch to GST Included in MRP"}
                className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isTaxInclusive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isTaxInclusive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{isTaxInclusive ? 'GST Inc (MRP)' : 'GST Added (+Tax)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Staff Associate & Scanner Beep Sound Toggle */}
        <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
          {/* Sales Associate Tagging */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 min-h-[36px] rounded-lg border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium hidden sm:inline">Associate:</span>
            <select
              value={selectedAssociate}
              onChange={(e) => setSelectedAssociate(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-hidden cursor-pointer"
            >
              {salesAssociates.map((staff) => (
                <option key={staff} value={staff}>
                  {staff}
                </option>
              ))}
            </select>
          </div>

          {/* Active Store Credit Notes Browser */}
          <button
            type="button"
            onClick={() => setIsCreditNoteModalOpen(true)}
            className={`px-2.5 py-1.5 min-h-[36px] rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeCreditNotes.length > 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title="Browse & apply active store credit notes"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Credit Notes</span>
            {activeCreditNotes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white font-mono">
                {activeCreditNotes.length}
              </span>
            )}
          </button>

          {/* Scanner Audio Beep Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Scanner Beep: ON (Click to Mute)' : 'Scanner Beep: OFF (Click to Enable)'}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${soundEnabled
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 1.5. COMPLETED SALE BANNER & START NEXT SALE ACTION */}
      {lastCompletedSale && (
        <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-base">
                  Sale Completed: {lastCompletedSale.invoiceNumber}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                  {lastCompletedSale.paymentMode}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Paid: <span className="font-extrabold text-slate-900 font-mono text-sm">₹{lastCompletedSale.grandTotal.toFixed(2)}</span> • Customer: <span className="font-semibold text-slate-800">{lastCompletedSale.customerName}</span> ({lastCompletedSale.items.reduce((s, i) => s + i.qty, 0)} items)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsDigitalReceiptModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Show Digital E-Receipt and QR Code on screen"
            >
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Digital E-Receipt QR</span>
            </button>
            <button
              onClick={() => {
                setActiveReceipt(lastCompletedSale);
                setIsReceiptModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Reprint Receipt</span>
            </button>
            <button
              onClick={startNextSale}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start Next Sale</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. CUSTOMER DETAILS & LOYALTY (Directly above search bar & below active company) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Customer Attachment Zone */}
          <div className="flex-1">
            {selectedCustomer ? (
              <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCustomerHistoryOpen(true)}
                        className="text-xs font-bold text-indigo-950 hover:text-indigo-600 hover:underline flex items-center gap-1"
                        title="Click to view previous garment sizes & purchases"
                      >
                        <span>{selectedCustomer.name}</span>
                        <History className="w-3 h-3 text-slate-400 hover:text-indigo-600" />
                      </button>

                      {computeCustomerSpendMetrics(selectedCustomer, sales, loyaltyConfig.vipMonthlyThreshold).isVip && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 flex items-center gap-0.5 shadow-2xs ring-1 ring-amber-300">
                          <Crown className="w-2.5 h-2.5 fill-current" />
                          <span>VIP Client</span>
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-500">
                        ({selectedCustomer.phone})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        · {selectedCustomer.totalVisits} visits
                      </span>

                      <button
                        type="button"
                        onClick={() => setIsCustomerHistoryOpen(true)}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 underline ml-1"
                      >
                        Past Purchases
                      </button>

                      {(selectedCustomer.profile?.preferredShirtSize || selectedCustomer.profile?.preferredTrouserWaist) && (
                        <span className="text-[10px] font-semibold text-indigo-900 bg-white px-1.5 py-0.2 rounded border border-indigo-200">
                          Fit: {selectedCustomer.profile.preferredShirtSize ? `Shirt ${selectedCustomer.profile.preferredShirtSize}` : ''} {selectedCustomer.profile.preferredTrouserWaist ? `· W${selectedCustomer.profile.preferredTrouserWaist}"` : ''}
                        </span>
                      )}

                      {selectedCustomer.profile?.familyMembers && selectedCustomer.profile.familyMembers.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setIsFamilySizingModalOpen(true)}
                          className="text-[10px] font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 px-2 py-0.5 rounded border border-pink-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs ml-1"
                          title="View family member garment sizing and preferences"
                        >
                          <Users className="w-3 h-3 text-pink-600" />
                          <span>Family Sizing ({selectedCustomer.profile.familyMembers.length})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsPosProfileModalOpen(true)}
                          className="text-[10px] font-semibold text-slate-500 hover:text-pink-600 flex items-center gap-0.5 hover:underline cursor-pointer ml-1"
                          title="Link family members"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>+ Family</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-indigo-800 flex items-center gap-1.5 font-medium mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Available Loyalty: </span>
                      <strong className="font-mono text-slate-900 font-bold">
                        {selectedCustomer.loyaltyPoints} pts
                      </strong>
                      <span className="text-slate-500 text-[10px]">
                        (₹{selectedCustomer.loyaltyPoints * loyaltyConfig.pointRedemptionValue} value)
                      </span>
                    </div>

                    {customerCreditNotes.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t border-indigo-200/60 flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                          <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Store Credit Available:</span>
                          <span className="font-mono font-extrabold text-emerald-950">
                            ₹{totalCustomerCredit.toFixed(2)}
                          </span>
                        </span>

                        {customerCreditNotes.map((cn) => {
                          const isApplied = appliedCreditNote?.code === cn.code;
                          return (
                            <div key={cn.id} className="flex items-center gap-1">
                              {isApplied ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded shadow-2xs">
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span className="font-mono">{cn.code}</span>
                                  <span>Applied (-₹{cartSummary.creditNoteDiscountAmount.toFixed(2)})</span>
                                  <button
                                    type="button"
                                    onClick={removeCreditNote}
                                    className="text-rose-600 hover:text-rose-800 text-[10px] ml-1 font-bold underline cursor-pointer"
                                    title="Remove this credit note"
                                  >
                                    Remove
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApplyCreditNoteDirect(cn.code)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-0.5 rounded shadow-2xs transition-colors cursor-pointer"
                                  title={`Redeem ${cn.code} (Remaining: ₹${cn.remainingAmount})`}
                                >
                                  <span>Apply {cn.code} (₹{cn.remainingAmount})</span>
                                </button>
                              )}
                            </div>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => setIsCreditNoteModalOpen(true)}
                          className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold underline cursor-pointer ml-1"
                        >
                          View Details →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loyalty Points Redemption Controls */}
                <div className="flex items-center gap-3">
                  {selectedCustomer.loyaltyPoints >= loyaltyConfig.minimumPointsToRedeem ? (
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-indigo-200 text-xs">
                      <span className="text-slate-600 font-medium">Redeem Pts:</span>
                      <input
                        type="number"
                        min="0"
                        max={cartSummary.maxRedeemablePoints}
                        value={redeemedPoints}
                        onChange={(e) =>
                          setRedeemedPoints(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="w-16 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded font-bold"
                      />
                      <button
                        onClick={() => setRedeemedPoints(cartSummary.maxRedeemablePoints)}
                        className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded cursor-pointer"
                      >
                        Max
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      (Min {loyaltyConfig.minimumPointsToRedeem} pts to redeem)
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setSelectedCustomerId(null);
                      setRedeemedPoints(0);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Change Customer
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onFocus={() => setIsCustomerSearchOpen(true)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerSearchOpen(true);
                    }}
                    placeholder="Attach Customer: Search by mobile number or name (or press F8)..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />

                  {/* Customer Quick Search Dropdown */}
                  {isCustomerSearchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      <div className="p-2 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>Select customer to link loyalty rewards:</span>
                        <button
                          onClick={() => setIsCustomerSearchOpen(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {filteredCustomerList.map((cust) => {
                        const custCredit = getCustomerCreditBalance(cust);
                        return (
                          <div
                            key={cust.id}
                            onClick={() => {
                              setSelectedCustomerId(cust.id);
                              setIsCustomerSearchOpen(false);
                              setCustomerSearch('');
                            }}
                            className="p-2.5 text-xs hover:bg-indigo-50/70 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <span className="font-bold text-slate-800">{cust.name}</span>
                              <span className="font-mono text-slate-500 ml-2">({cust.phone})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {custCredit > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono shadow-2xs">
                                  <Wallet className="w-2.5 h-2.5" />
                                  <span>₹{custCredit.toFixed(0)} Credit</span>
                                </span>
                              )}
                              <div className="text-[11px] font-mono text-indigo-700 flex items-center gap-1 font-semibold">
                                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                                <span>{cust.loyaltyPoints} pts</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setIsNewCustomerModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 border border-indigo-200 shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ New Customer</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. PRODUCT SEARCH & BARCODE SCANNER BAR */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs relative">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Scan garment barcode or type shirt, denim, SKU... (Enter to add)"
              className="w-full pl-9 pr-4 py-2 text-sm sm:text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            title="Scan Garment Barcode / QR Code with Device Camera"
            className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Camera Scanner</span>
          </button>

          {scanFeedback && (
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 animate-fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{scanFeedback}</span>
            </div>
          )}
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100">
            <div className="p-2 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Matching catalog garments ({searchResults.length} results):</span>
              <button
                onClick={() => setIsSearchFocused(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {searchResults.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectSearchResult(p)}
                  className="p-2.5 hover:bg-indigo-50/60 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded">
                      {p.size}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {p.sku} · {p.color} · Barcode: {p.barcode}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-bold font-mono text-slate-900">₹{p.sellingPrice}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.stock > 0 ? `${p.stock} in stock` : 'Out of Stock'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSearchResult(p);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN WORKSPACE: ADDED STOCK TABLE (LEFT 8 COLS) + CHECKOUT / TOTALS (RIGHT 4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ADDED STOCK TABLE */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Table Header Strip */}
          <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-700" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Current Bill Stock Items ({cart.reduce((s, i) => s + i.quantity, 0)} Units)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Held / Parked Carts Button */}
              <button
                type="button"
                onClick={() => setIsParkModalOpen(true)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  parkedCarts.length > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="View held/parked customer bills"
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>Held Bills</span>
                {parkedCarts.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                    {parkedCarts.length}
                  </span>
                )}
              </button>

              {/* Hold Current Cart Button */}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsHoldCartPromptOpen(true)}
                  className="text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                  title="Put current cart on hold to serve next customer (F6)"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Hold Bill (F6)</span>
                </button>
              )}

              {/* Clear All Items Button */}
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Parked Carts Strip */}
          {parkedCarts.length > 0 && (
            <div className="bg-amber-50/70 border-b border-amber-200/80 px-3 py-1.5 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1 shrink-0">
                <Bookmark className="w-3 h-3 text-amber-600" />
                On Hold:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {parkedCarts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 bg-white border border-amber-200 rounded-md px-2 py-0.5 shadow-2xs text-[11px] shrink-0"
                  >
                    <span className="font-semibold text-slate-800">{p.label}</span>
                    <span className="text-slate-400 font-mono">({p.items.length} pcs · ₹{p.grandTotal.toFixed(0)})</span>
                    <button
                      type="button"
                      onClick={() => handleRecallTicket(p.id)}
                      className="ml-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.2 rounded cursor-pointer"
                    >
                      Resume
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Body */}
          <div className="overflow-x-auto flex-1 min-h-[340px]">
            {cart.length === 0 ? (
              <div className="h-full py-16 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <ShoppingCart className="w-10 h-10 stroke-1 text-slate-300" />
                <div className="text-xs font-semibold text-slate-600">
                  No garments added to this bill yet.
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm">
                  Scan a garment barcode with your barcode reader, or type garment name / SKU in the search bar above to add items.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop & Tablet Multi-Column Cart Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-8">#</th>
                        <th className="py-2.5 px-3">Garment / SKU</th>
                        <th className="py-2.5 px-2">Size / Color</th>
                        <th className="py-2.5 px-3 text-right">{isTaxInclusive ? 'MRP (₹)' : 'Rate (₹)'}</th>
                        <th className="py-2.5 px-2 text-center w-28">Quantity</th>
                        <th className="py-2.5 px-2 text-center w-20">Disc %</th>
                        <th className="py-2.5 px-2 text-center">Tailor</th>
                        {activeCompany.type === 'billed' && (
                          <th className="py-2.5 px-2 text-right">{isTaxInclusive ? 'GST (Inc)' : 'GST (+)'}</th>
                        )}
                        <th className="py-2.5 px-3 text-right">Net Amount</th>
                        <th className="py-2.5 px-2 text-center w-10">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cart.map((item, idx) => {
                        const gross = item.unitPrice * item.quantity;
                        const discount = (gross * item.discountPercent) / 100;
                        const net = gross - discount;
                        const netPerUnit = net / (item.quantity || 1);
                        const isDynamicGstActive = activeCompany.type === 'billed' && activeCompany.enableDynamicGarmentGst !== false;
                        let taxRate = activeCompany.type === 'billed' ? item.product.taxRate : 0;
                        if (isDynamicGstActive) {
                          taxRate = netPerUnit <= 1000 ? 5 : 12;
                        }
                        const itemIsInclusive = item.product.taxInclusive !== undefined ? item.product.taxInclusive : isTaxInclusive;
                        let tax = 0;
                        let lineTotal = net;

                        if (activeCompany.type === 'billed') {
                          if (itemIsInclusive) {
                            tax = net - net / (1 + taxRate / 100);
                            lineTotal = net;
                          } else {
                            tax = (net * taxRate) / 100;
                            lineTotal = net + tax;
                          }
                        }

                        return (
                          <tr key={item.product.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {idx + 1}
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 text-xs">
                                {item.product.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                <span className="font-semibold text-slate-700">{item.product.sku}</span>
                                <span>·</span>
                                <span>{item.product.category}</span>
                              </div>
                              {item.alteration?.needed && (
                                <div className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 font-medium flex items-center gap-1">
                                  <Scissors className="w-3 h-3" />
                                  <span>Alteration: {item.alteration.notes}</span>
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded">
                                  {item.product.size}
                                </span>
                                <span className="text-slate-600 truncate max-w-[90px]">
                                  {item.product.color}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono text-slate-800">
                              ₹{item.unitPrice.toFixed(2)}
                            </td>

                            {/* Interactive Quantity Control */}
                            <td className="py-3 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => updateCartItemQty(item.product.id, item.quantity - 1)}
                                  className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateCartItemQty(
                                      item.product.id,
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                  }
                                  className="w-10 py-0.5 text-center font-mono font-bold text-xs border border-slate-200 rounded bg-white"
                                />
                                <button
                                  onClick={() => updateCartItemQty(item.product.id, item.quantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              {item.product.stock < item.quantity && (
                                <div className="text-[9px] text-rose-600 text-center font-medium mt-0.5">
                                  Stock: {item.product.stock}
                                </div>
                              )}
                            </td>

                            {/* Discount % */}
                            <td className="py-3 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discountPercent}
                                onChange={(e) =>
                                  updateCartItemDiscount(
                                    item.product.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-14 px-1 py-0.5 border border-slate-200 rounded text-center font-mono text-xs font-semibold"
                              />
                            </td>

                            {/* Tailoring Alteration Action */}
                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() =>
                                  setAlterationModalItem({
                                    productId: item.product.id,
                                    productName: item.product.name,
                                    size: item.product.size,
                                    color: item.product.color,
                                    details: item.alteration || {
                                      needed: false,
                                      notes: 'Shorten length by 1.5 inches',
                                      tailorName: '',
                                      promisedDate: new Date(Date.now() + 86400000)
                                        .toISOString()
                                        .split('T')[0],
                                    },
                                  })
                                }
                                title="Attach in-store alteration instructions"
                                className={`p-1.5 rounded transition-colors cursor-pointer ${item.alteration?.needed
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                                  }`}
                              >
                                <Scissors className="w-3.5 h-3.5" />
                              </button>
                            </td>

                            {/* GST Tax if billed */}
                            {activeCompany.type === 'billed' && (
                              <td className="py-3 px-2 text-right font-mono text-[11px] text-slate-600">
                                <div>
                                  {itemIsInclusive ? (
                                    <span className="text-slate-500">₹{tax.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-indigo-600 font-bold">+₹{tax.toFixed(2)}</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-0.5">
                                  <span>({taxRate}%)</span>
                                  <span className={`text-[8px] px-1 py-0.2 rounded font-semibold ${itemIsInclusive ? 'bg-slate-100 text-slate-600' : 'bg-indigo-50 text-indigo-700'}`}>
                                    {itemIsInclusive ? 'inc' : 'add'}
                                  </span>
                                  {isDynamicGstActive && (
                                    <span
                                      className={`px-1 py-0.2 rounded font-semibold ${
                                        taxRate === 5
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-indigo-100 text-indigo-800'
                                      }`}
                                      title={taxRate === 5 ? 'Item Net <= ₹1,000 (5% GST)' : 'Item Net > ₹1,000 (12% GST)'}
                                    >
                                      {taxRate === 5 ? '≤₹1k' : '>₹1k'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}

                            {/* Net Amount */}
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                              ₹{lineTotal.toFixed(2)}
                            </td>

                            <td className="py-3 px-2 text-center">
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cart Items Cards (< md screens) */}
                <div className="md:hidden p-2.5 sm:p-3 space-y-2.5">
                  {cart.map((item, idx) => {
                    const gross = item.unitPrice * item.quantity;
                    const discount = (gross * item.discountPercent) / 100;
                    const net = gross - discount;
                    const netPerUnit = net / (item.quantity || 1);
                    const isDynamicGstActive = activeCompany.type === 'billed' && activeCompany.enableDynamicGarmentGst !== false;
                    let taxRate = activeCompany.type === 'billed' ? item.product.taxRate : 0;
                    if (isDynamicGstActive) {
                      taxRate = netPerUnit <= 1000 ? 5 : 12;
                    }
                    const itemIsInclusive = item.product.taxInclusive !== undefined ? item.product.taxInclusive : isTaxInclusive;
                    let tax = 0;
                    let lineTotal = net;

                    if (activeCompany.type === 'billed') {
                      if (itemIsInclusive) {
                        tax = net - net / (1 + taxRate / 100);
                        lineTotal = net;
                      } else {
                        tax = (net * taxRate) / 100;
                        lineTotal = net + tax;
                      }
                    }

                    return (
                      <div
                        key={item.product.id}
                        className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5"
                      >
                        {/* Top: Name, SKU, and Delete */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs">
                                {idx + 1}. {item.product.name}
                              </span>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-800 rounded">
                                {item.product.size}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {item.product.color}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {item.product.sku} · {item.product.category}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                            title="Remove from cart"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price & Tax Tag */}
                        <div className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-500 text-[11px]">Unit:</span>
                            <span className="font-bold text-slate-800">₹{item.unitPrice.toFixed(2)}</span>
                            {activeCompany.type === 'billed' && (
                              <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${itemIsInclusive ? 'bg-slate-200 text-slate-700' : 'bg-indigo-100 text-indigo-800'}`}>
                                {itemIsInclusive ? `${taxRate}% inc` : `+${taxRate}%`}
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-right">
                            <span className="text-slate-400 text-[10px] mr-1">Net:</span>
                            <span className="font-black text-slate-900 text-sm">₹{lineTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Controls: Stepper, Disc %, Tailoring */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 transition-all cursor-pointer"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateCartItemQty(
                                  item.product.id,
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className="w-10 h-8 text-center font-mono font-bold text-xs border border-slate-200 rounded-lg bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => updateCartItemQty(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 active:scale-95 transition-all cursor-pointer"
                              title="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Discount % Input */}
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-500 text-[11px] font-medium">Disc%:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.discountPercent}
                              onChange={(e) =>
                                updateCartItemDiscount(
                                  item.product.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-12 h-8 px-1 border border-slate-200 rounded-lg text-center font-mono text-xs font-semibold bg-white"
                            />
                          </div>

                          {/* Tailoring Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setAlterationModalItem({
                                productId: item.product.id,
                                productName: item.product.name,
                                size: item.product.size,
                                color: item.product.color,
                                details: item.alteration || {
                                  needed: false,
                                  notes: 'Shorten length by 1.5 inches',
                                  tailorName: '',
                                  promisedDate: new Date(Date.now() + 86400000)
                                    .toISOString()
                                    .split('T')[0],
                                },
                              })
                            }
                            className={`h-8 px-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border ${
                              item.alteration?.needed
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Scissors className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{item.alteration?.needed ? 'Tailored' : 'Alter'}</span>
                          </button>
                        </div>

                        {/* Alteration Details Preview if attached */}
                        {item.alteration?.needed && (
                          <div className="text-[10px] text-indigo-800 bg-indigo-50/70 border border-indigo-200 px-2 py-1 rounded-md flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              <Scissors className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span className="truncate">Notes: {item.alteration.notes}</span>
                            </div>
                            <span className="font-mono text-slate-500 shrink-0 ml-1">
                              Due: {item.alteration.promisedDate}
                            </span>
                          </div>
                        )}

                        {/* Out of Stock Warning */}
                        {item.product.stock < item.quantity && (
                          <div className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Available stock: {item.product.stock} (Short by {item.quantity - item.product.stock})</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Quick Keyboard Shortcuts Footer Strip */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 hidden sm:flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-bold text-[10px]">F2</kbd> / <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-bold text-[10px]">/</kbd> Search
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-bold text-[10px]">F4</kbd> Tender Mode
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-bold text-[10px]">Ctrl+Enter</kbd> Print Bill
              </span>
            </div>
            <div className="text-slate-400 font-sans">
              Press Enter in search bar to auto-add item
            </div>
          </div>
        </div>

        {/* CHECKOUT & FINANCIAL SUMMARY PANEL (RIGHT 4 COLS) */}
        <div id="pos-checkout-section" className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Bill Summary & Settlement
            </h3>

            {/* Active Promotional Offer Banner */}
            {cartSummary.appliedPromoRule && (
              <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    %
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>{cartSummary.appliedPromoRule.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-semibold">APPLIED</span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-sans">{cartSummary.promoExplanation}</div>
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-emerald-800">
                  -₹{cartSummary.promoDiscountAmount.toFixed(0)}
                </div>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span>₹{cartSummary.subtotal.toFixed(2)}</span>
              </div>

              {cartSummary.discounts > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Item Discounts:</span>
                  <span>-₹{cartSummary.discounts.toFixed(2)}</span>
                </div>
              )}

              {cartSummary.promoDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Offer ({cartSummary.appliedPromoRule?.title}):</span>
                  </span>
                  <span className="font-bold font-mono text-emerald-700">-₹{cartSummary.promoDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {cartSummary.loyaltyDiscountAmount > 0 && (
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span>Loyalty Discount ({redeemedPoints} pts):</span>
                  <span>-₹{cartSummary.loyaltyDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <span>Coupon ({appliedCoupon.code}):</span>
                    <button
                      onClick={removeCoupon}
                      className="text-rose-500 hover:text-rose-700 text-[10px]"
                    >
                      (remove)
                    </button>
                  </span>
                  <span>-₹{cartSummary.couponDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {appliedCreditNote && (
                <div className="flex justify-between text-indigo-700 font-semibold">
                  <span className="flex items-center gap-1">
                    <span>Credit Note ({appliedCreditNote.code}):</span>
                    <button
                      onClick={removeCreditNote}
                      className="text-rose-500 hover:text-rose-700 text-[10px]"
                    >
                      (remove)
                    </button>
                  </span>
                  <span>-₹{cartSummary.creditNoteDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {activeCompany.type === 'billed' ? (
                <div className="space-y-1 bg-slate-50/80 p-2 rounded-lg border border-slate-200">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span>GST (CGST + SGST):</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                        isTaxInclusive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {isTaxInclusive ? 'Included in MRP' : 'Added Separately'}
                      </span>
                    </span>
                    <span className={`font-mono ${isTaxInclusive ? 'text-slate-600' : 'text-indigo-600 font-bold'}`}>
                      {isTaxInclusive ? `(₹${cartSummary.taxes.toFixed(2)})` : `+₹${cartSummary.taxes.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between font-mono pt-0.5 border-t border-slate-200/60">
                    <span>Taxable Base: ₹{cartSummary.taxableAmount.toFixed(2)}</span>
                    <span>CGST: ₹{(cartSummary.taxes / 2).toFixed(2)} | SGST: ₹{(cartSummary.taxes / 2).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-700 text-[11px] font-sans font-medium">
                  <span>Retail Cash Memo (0% Tax):</span>
                  <span>₹0.00</span>
                </div>
              )}

              <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Net Payable:</span>
                <span>₹{cartSummary.grandTotal.toFixed(2)}</span>
              </div>

              {selectedCustomer && (
                <div className="text-[10px] text-indigo-700 font-sans flex items-center justify-end gap-1 font-medium pt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Customer earns +{cartSummary.pointsEarnedOnThisBill} loyalty pts</span>
                </div>
              )}
            </div>

            {/* Applied Credit Note Active Card */}
            {appliedCreditNote && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between font-bold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span>Credit Note Applied: <strong className="font-mono">{appliedCreditNote.code}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={removeCreditNote}
                    className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex justify-between text-emerald-800 text-[11px]">
                  <span>Applied discount on this bill:</span>
                  <span className="font-mono font-bold">-₹{cartSummary.creditNoteDiscountAmount.toFixed(2)}</span>
                </div>
                {appliedCreditNote.remainingAmount > cartSummary.creditNoteDiscountAmount && (
                  <div className="text-[10px] text-emerald-700 italic border-t border-emerald-200/70 pt-1">
                    ₹{(appliedCreditNote.remainingAmount - cartSummary.creditNoteDiscountAmount).toFixed(2)} balance will remain on voucher after this checkout.
                  </div>
                )}
              </div>
            )}

            {/* Quick 1-Click Available Credit Note Alert (if customer has active notes and not yet applied) */}
            {customerCreditNotes.length > 0 && !appliedCreditNote && (
              <div className="p-2.5 bg-emerald-50/90 border border-emerald-300 rounded-lg flex items-center justify-between gap-2 text-xs animate-in fade-in">
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Credit Note Available:</span>
                    <strong className="font-mono text-emerald-700">₹{totalCustomerCredit.toFixed(2)}</strong>
                  </div>
                  <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                    {customerCreditNotes[0].code} · Bal: ₹{customerCreditNotes[0].remainingAmount}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApplyCreditNoteDirect(customerCreditNotes[0].code)}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    Apply (₹{customerCreditNotes[0].remainingAmount})
                  </button>
                  {customerCreditNotes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIsCreditNoteModalOpen(true)}
                      className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md cursor-pointer"
                      title="View all available vouchers"
                    >
                      +{customerCreditNotes.length - 1}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Promo Codes & Store Credit Voucher Input Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsPromoOpen(!isPromoOpen)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{isPromoOpen ? 'Hide Coupons & Vouchers' : '+ Apply Coupon or Credit Note'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(true)}
                  className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer font-medium"
                  title="Browse all active credit notes across store"
                >
                  <Wallet className="w-3 h-3 text-emerald-600" />
                  <span>Browse CN ({activeCreditNotes.length})</span>
                </button>
              </div>

              {isPromoOpen && (
                <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5 text-xs">
                  {/* Coupon Code Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Promotional Coupon Code:
                    </label>
                    <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="WELCOME10, FESTIVE20"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono uppercase"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded shrink-0 cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                    {couponError && (
                      <div className="text-[10px] text-rose-600 mt-0.5">{couponError}</div>
                    )}
                  </div>

                  {/* Store Credit Note Section */}
                  <div className="pt-1 border-t border-slate-200/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Wallet className="w-3 h-3 text-emerald-600" />
                        <span>Redeem Store Credit Note:</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCreditNoteModalOpen(true)}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                      >
                        Browse All ({activeCreditNotes.length}) →
                      </button>
                    </div>

                    {/* Customer's matching credit notes list */}
                    {customerCreditNotes.length > 0 && (
                      <div className="space-y-1.5 mb-2 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wide block">
                          Available for {selectedCustomer?.name || 'Customer'}:
                        </span>
                        {customerCreditNotes.map((cn) => {
                          const isApplied = appliedCreditNote?.code === cn.code;
                          return (
                            <div
                              key={cn.id}
                              className="flex items-center justify-between p-1.5 rounded bg-white border border-emerald-200 text-xs"
                            >
                              <div>
                                <span className="font-mono font-bold text-indigo-700 mr-2">{cn.code}</span>
                                <span className="font-mono text-emerald-700 font-bold">₹{cn.remainingAmount}</span>
                                <span className="text-[10px] text-slate-400 ml-1">· Exp: {cn.expiryDate}</span>
                              </div>
                              {isApplied ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Applied ✓
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApplyCreditNoteDirect(cn.code)}
                                  className="px-2 py-0.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded cursor-pointer shadow-2xs"
                                >
                                  Apply
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <form onSubmit={handleApplyCreditNote} className="flex gap-1.5">
                      <input
                        type="text"
                        value={creditNoteInput}
                        onChange={(e) => setCreditNoteInput(e.target.value.toUpperCase())}
                        placeholder="e.g. CN-1042"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded font-mono uppercase"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded shrink-0 cursor-pointer"
                      >
                        Redeem
                      </button>
                    </form>
                    {creditNoteError && (
                      <div className="text-[10px] text-rose-600 mt-0.5">{creditNoteError}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Mode Selector */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-sans">
                Payment Mode (Press F4 to Cycle):
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {[
                  { id: 'Cash', icon: Banknote, label: 'Cash' },
                  { id: 'UPI', icon: QrCode, label: 'UPI' },
                  { id: 'Card', icon: CreditCard, label: 'Card' },
                  { id: 'Split', icon: Tag, label: 'Split' },
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSelected = paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id as any)}
                      className={`py-2.5 px-1 min-h-[46px] rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px]">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Calculator if mode is Cash */}
            {paymentMode === 'Cash' && (
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Cash Received:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-500">₹</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      placeholder={cartSummary.grandTotal.toString()}
                      className="w-24 px-2 py-1 text-right font-mono font-bold text-xs border border-slate-200 rounded-md bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5">
                  {[cartSummary.grandTotal, 500, 1000, 2000, 5000]
                    .filter((v, i, a) => v >= cartSummary.grandTotal && a.indexOf(v) === i)
                    .slice(0, 4)
                    .map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCashTendered(amount.toString())}
                        className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        ₹{amount}
                      </button>
                    ))}
                </div>

                {tenderedAmount > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-mono font-bold">
                    <span className="text-slate-600">Change Due:</span>
                    <span className="text-emerald-700 text-sm">₹{changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic UPI Payment QR Code if mode is UPI */}
            {paymentMode === 'UPI' && (
              <div className="space-y-2 animate-in fade-in duration-150">
                <UpiPaymentQr
                  upiId={storeUpiId}
                  payeeName={storeUpiName || activeCompany.name}
                  amount={cartSummary.grandTotal}
                  transactionNote={`${activeCompany.name} Bill`}
                  size={140}
                  className="w-full"
                />
              </div>
            )}

            {/* Split Payment Distribution if mode is Split */}
            {paymentMode === 'Split' && (
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-3 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Split Payment Distribution</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">
                    Bill: ₹{cartSummary.grandTotal.toFixed(2)}
                  </span>
                </div>

                {/* Tender Inputs */}
                <div className="space-y-2">
                  {/* Cash */}
                  <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 min-w-[70px]">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cash:</span>
                    </div>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <span className="text-slate-400 font-mono">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={splitCash}
                        onChange={(e) => setSplitCash(e.target.value)}
                        placeholder="0"
                        className="w-20 px-2 py-0.5 text-right font-mono font-bold text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleFillSplitRemaining('cash')}
                        title="Fill remaining balance into Cash"
                        className="px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded cursor-pointer transition-colors"
                      >
                        + Bal
                      </button>
                    </div>
                  </div>

                  {/* UPI */}
                  <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 min-w-[70px]">
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                      <span>UPI:</span>
                    </div>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <span className="text-slate-400 font-mono">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={splitUpi}
                        onChange={(e) => setSplitUpi(e.target.value)}
                        placeholder="0"
                        className="w-20 px-2 py-0.5 text-right font-mono font-bold text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleFillSplitRemaining('upi')}
                        title="Fill remaining balance into UPI"
                        className="px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded cursor-pointer transition-colors"
                      >
                        + Bal
                      </button>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 min-w-[70px]">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      <span>Card:</span>
                    </div>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <span className="text-slate-400 font-mono">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={splitCard}
                        onChange={(e) => setSplitCard(e.target.value)}
                        placeholder="0"
                        className="w-20 px-2 py-0.5 text-right font-mono font-bold text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleFillSplitRemaining('card')}
                        title="Fill remaining balance into Card"
                        className="px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded cursor-pointer transition-colors"
                      >
                        + Bal
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Split Presets */}
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handlePresetSplit('50-cash-upi')}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-white hover:bg-indigo-50 border border-indigo-200 rounded text-indigo-800 cursor-pointer transition-colors"
                  >
                    50% Cash + UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSplit('50-cash-card')}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-white hover:bg-indigo-50 border border-indigo-200 rounded text-indigo-800 cursor-pointer transition-colors"
                  >
                    50% Cash + Card
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSplit('50-upi-card')}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-white hover:bg-indigo-50 border border-indigo-200 rounded text-indigo-800 cursor-pointer transition-colors"
                  >
                    50% UPI + Card
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSplit('clear')}
                    className="px-1.5 py-0.5 text-[10px] font-semibold bg-white hover:bg-red-50 border border-slate-200 text-slate-500 hover:text-red-700 rounded cursor-pointer transition-colors ml-auto"
                  >
                    Reset
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="pt-2 border-t border-indigo-100 font-mono text-[11px]">
                  {splitRemaining === 0 && splitAllocatedTotal > 0 ? (
                    <div className="flex items-center justify-between text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 font-bold">
                      <span className="flex items-center gap-1 font-sans text-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Exact Split Match:
                      </span>
                      <span>₹{splitAllocatedTotal.toFixed(2)}</span>
                    </div>
                  ) : splitRemaining > 0 ? (
                    <div className="flex items-center justify-between text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-bold">
                      <span className="flex items-center gap-1 font-sans text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Remaining to Collect:
                      </span>
                      <span>₹{splitRemaining.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 font-bold">
                      <span className="font-sans text-xs">Cash Change Due:</span>
                      <span>₹{splitChangeDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Dynamic UPI QR for Split Portion */}
                {splitUpiVal > 0 && (
                  <div className="pt-1">
                    <UpiPaymentQr
                      upiId={storeUpiId}
                      payeeName={storeUpiName || activeCompany.name}
                      amount={splitUpiVal}
                      transactionNote={`${activeCompany.name} Split Bill`}
                      size={120}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Complete Sale Button OR Start Next Sale Button */}
            {lastCompletedSale ? (
              <div className="space-y-2">
                <button
                  onClick={startNextSale}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Start Next Sale</span>
                </button>
                <button
                  onClick={() => {
                    setActiveReceipt(lastCompletedSale);
                    setIsReceiptModalOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Reprint Last Bill ({lastCompletedSale.invoiceNumber})</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={
                  cart.length === 0 ||
                  (paymentMode === 'Split' &&
                    cartSummary.grandTotal > 0 &&
                    splitAllocatedTotal < cartSummary.grandTotal)
                }
                className="w-full py-3.5 px-4 min-h-[48px] bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {paymentMode === 'Split' && splitRemaining > 0
                    ? `Allocate ₹${splitRemaining.toFixed(2)} to Complete`
                    : `Complete & Print Receipt (₹${cartSummary.grandTotal.toFixed(2)})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. MOBILE STICKY FLOATING CART DOCK */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 animate-in slide-in-from-bottom-3 duration-200 no-print">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-2.5 px-4 flex items-center justify-between border border-slate-800/80 backdrop-blur-md">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
                <span>{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
              </div>
              <div className="text-base font-black font-mono text-white leading-tight">
                ₹{cartSummary.grandTotal.toFixed(2)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('pos-checkout-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer transition-all"
            >
              <span>Pay & Settle</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Alteration Fitting Instructions Modal */}
      {alterationModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-indigo-600" />
              <span>Alteration: {alterationModalItem.productName}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tailoring Instructions *
                </label>
                <textarea
                  rows={2}
                  value={alterationModalItem.details.notes}
                  onChange={(e) =>
                    setAlterationModalItem({
                      ...alterationModalItem,
                      details: { ...alterationModalItem.details, notes: e.target.value },
                    })
                  }
                  placeholder="e.g. Shorten length 1.5 inches, waist taper 1 inch"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Promised Ready Date
                </label>
                <input
                  type="date"
                  value={alterationModalItem.details.promisedDate}
                  onChange={(e) =>
                    setAlterationModalItem({
                      ...alterationModalItem,
                      details: { ...alterationModalItem.details, promisedDate: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAlterationModalItem(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAlteration}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save Fitting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Quick Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add New CRM Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (10 Digits) *
                </label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="e.g. 9812345678"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. DEVICE CAMERA BARCODE / QR SCANNER MODAL */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleCameraScan}
        title="POS Garment Barcode Scanner"
        subtitle="Point camera at clothing price tag or SKU barcode to add to cart"
        allowContinuous={true}
        defaultContinuous={true}
        sampleCodes={sampleBarcodes}
      />

      {/* 9. CUSTOMER PAST PURCHASES MODAL */}
      <CustomerPurchasesModal
        customer={selectedCustomer}
        isOpen={isCustomerHistoryOpen}
        onClose={() => setIsCustomerHistoryOpen(false)}
      />

      {/* 10. POS FAMILY SIZING LOOKUP MODAL */}
      {isFamilySizingModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Family Sizing: {selectedCustomer.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quickly check garment sizes when customer shops for family members
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFamilySizingModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Family Members */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {selectedCustomer.profile?.familyMembers && selectedCustomer.profile.familyMembers.length > 0 ? (
                selectedCustomer.profile.familyMembers.map((member) => {
                  const linkedCust = member.linkedCustomerId
                    ? customers.find((c) => c.id === member.linkedCustomerId)
                    : null;

                  return (
                    <div
                      key={member.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{member.name}</span>
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-pink-100 text-pink-900 border border-pink-200">
                              {member.relation}
                            </span>
                          </div>
                          {member.phone && (
                            <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                              +91 {member.phone}
                            </span>
                          )}
                        </div>

                        {linkedCust && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerId(linkedCust.id);
                              setIsFamilySizingModalOpen(false);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                            title="Switch bill to this customer"
                          >
                            Switch Bill to Member →
                          </button>
                        )}
                      </div>

                      {/* Sizes */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {member.preferredShirtSize && (
                          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800">
                            Shirt / Kurti: <strong className="text-indigo-900">{member.preferredShirtSize}</strong>
                          </span>
                        )}
                        {member.preferredTrouserWaist && (
                          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800">
                            Trouser Waist: <strong className="text-indigo-900">{member.preferredTrouserWaist}"</strong>
                          </span>
                        )}
                        {member.birthday && (
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-[11px] font-medium text-rose-800 flex items-center gap-1">
                            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                            <span>Bday: {member.birthday}</span>
                          </span>
                        )}
                      </div>

                      {member.notes && (
                        <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-200/80">
                          "{member.notes}"
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No family members recorded for {selectedCustomer.name}.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsFamilySizingModalOpen(false);
                  setIsPosProfileModalOpen(true);
                }}
                className="text-xs font-bold text-pink-700 hover:text-pink-900 flex items-center gap-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Manage / Link Family Members</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFamilySizingModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. POS CUSTOMER PROFILE & FAMILY LINKING MODAL */}
      <CustomerProfileModal
        customer={selectedCustomer}
        isOpen={isPosProfileModalOpen}
        initialTab="family"
        onClose={() => setIsPosProfileModalOpen(false)}
        onSave={(updated, secondaryUpdates) => {
          updateCustomer(updated);
          if (secondaryUpdates && secondaryUpdates.length > 0) {
            secondaryUpdates.forEach((sec) => updateCustomer(sec));
          }
        }}
      />

      {/* 12. HOLD CURRENT BILL PROMPT MODAL */}
      {isHoldCartPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pause className="w-5 h-5" />
                <h3 className="font-bold text-sm">Hold Current Bill</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHoldCartPromptOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleHoldCart(parkTicketLabel);
              }}
              className="p-5 space-y-4"
            >
              <p className="text-xs text-slate-600 leading-relaxed">
                Put this customer's cart on hold to serve the next customer in line. You can resume this bill at any time.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ticket Label / Reference (Optional)
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder={selectedCustomer ? `${selectedCustomer.name} - ${selectedCustomer.phone}` : "e.g. Blue Sherwani / Waiting for Trial"}
                  value={parkTicketLabel}
                  onChange={(e) => setParkTicketLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Items to hold:</span>
                  <strong className="font-mono text-slate-900">{cart.reduce((s, i) => s + i.quantity, 0)} Units</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cart Total:</span>
                  <strong className="font-mono text-slate-900">₹{cartSummary.grandTotal.toFixed(2)}</strong>
                </div>
                {selectedCustomer && (
                  <div className="flex justify-between text-slate-600">
                    <span>Customer:</span>
                    <strong className="text-indigo-700">{selectedCustomer.name}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHoldCartPromptOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Confirm Hold Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. PARKED / HELD BILLS DIRECTORY MODAL */}
      {isParkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Held Customer Bills Directory</h3>
                  <p className="text-[11px] text-slate-400">
                    {parkedCarts.length} {parkedCarts.length === 1 ? 'ticket' : 'tickets'} currently suspended on hold
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsParkModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-4">
              {parkedCarts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Bookmark className="w-10 h-10 stroke-1 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No customer bills currently on hold.</p>
                  <p className="text-[11px] text-slate-400">
                    To hold a bill when a customer steps away, click <strong>Hold Bill (F6)</strong> during checkout.
                  </p>
                </div>
              ) : (
                parkedCarts.map((p) => {
                  const parkedDate = new Date(p.parkedAt);
                  const timeAgoMinutes = Math.max(0, Math.floor((Date.now() - parkedDate.getTime()) / 60000));
                  const timeFormatted = `${parkedDate.getHours().toString().padStart(2, '0')}:${parkedDate.getMinutes().toString().padStart(2, '0')}`;

                  return (
                    <div
                      key={p.id}
                      className="pt-4 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold rounded text-xs font-mono">
                            #{p.ticketNumber}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{p.label}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeFormatted} ({timeAgoMinutes === 0 ? 'just now' : `${timeAgoMinutes}m ago`})
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                          {p.customerName && (
                            <span className="font-medium text-indigo-700">
                              Client: {p.customerName} {p.customerPhone && `(+91 ${p.customerPhone})`}
                            </span>
                          )}
                          <span>·</span>
                          <span>Cashier: {p.cashierName}</span>
                          <span>·</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            Total: ₹{p.grandTotal.toFixed(2)}
                          </span>
                        </div>

                        {/* Garments Preview */}
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {p.items.map((i) => `${i.quantity}x ${i.product.name} (${i.product.size})`).join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => deleteParkedCart(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Discard held bill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecallTicket(p.id)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Resume Bill →</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {parkedCarts.length > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to discard ALL held bills?')) {
                      clearAllParkedCarts();
                    }
                  }}
                  className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                >
                  Clear All Held Bills
                </button>
                <button
                  type="button"
                  onClick={() => setIsParkModalOpen(false)}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 14. ACTIVE BILL CONFLICT RESOLUTION MODAL */}
      {ticketToRecall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Active Bill in Progress</h3>
              </div>
              <button
                type="button"
                onClick={() => setTicketToRecall(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Your current counter already has <strong>{cart.length} items (₹{cartSummary.grandTotal.toFixed(0)})</strong> in the active bill. How would you like to handle it before resuming <strong>{ticketToRecall.label}</strong>?
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={confirmRecallWithHold}
                  className="w-full text-left p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-indigo-950 group-hover:text-indigo-600">
                      Hold Current Bill & Resume #{ticketToRecall.ticketNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Safely suspends current cart to a new ticket, then opens {ticketToRecall.label}.
                    </div>
                  </div>
                  <Pause className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />
                </button>

                <button
                  type="button"
                  onClick={confirmRecallWithDiscard}
                  className="w-full text-left p-3 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-bold text-rose-950 group-hover:text-rose-600">
                      Discard Current Items & Resume #{ticketToRecall.ticketNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Clears current unsaved cart and restores {ticketToRecall.label}.
                    </div>
                  </div>
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0 ml-2" />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setTicketToRecall(null)}
                  className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital E-Receipt & QR Presentation Modal */}
      <DigitalReceiptModal
        isOpen={isDigitalReceiptModalOpen}
        onClose={() => setIsDigitalReceiptModalOpen(false)}
        receipt={lastCompletedSale || activeReceipt}
        googleReviewUrl={storeGoogleReviewUrl}
      />

      {/* Store Credit Notes Browser & Redemption Modal */}
      <StoreCreditNotesModal
        isOpen={isCreditNoteModalOpen}
        onClose={() => setIsCreditNoteModalOpen(false)}
        selectedCustomer={selectedCustomer}
        onSelectCreditNote={handleSelectCreditNote}
        appliedCreditNoteCode={appliedCreditNote?.code}
        onRemoveAppliedCreditNote={removeCreditNote}
      />
    </div>
  );
};
