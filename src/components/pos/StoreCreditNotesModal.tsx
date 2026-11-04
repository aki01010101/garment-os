import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CreditNote, Customer } from '../../types';
import {
  X,
  Search,
  Wallet,
  Check,
  Calendar,
  FileText,
  User,
  Phone,
  Tag,
  AlertCircle,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface StoreCreditNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomer: Customer | null;
  onSelectCreditNote: (creditNote: CreditNote) => void;
  appliedCreditNoteCode?: string;
  onRemoveAppliedCreditNote?: () => void;
}

export const StoreCreditNotesModal: React.FC<StoreCreditNotesModalProps> = ({
  isOpen,
  onClose,
  selectedCustomer,
  onSelectCreditNote,
  appliedCreditNoteCode,
  onRemoveAppliedCreditNote,
}) => {
  const { creditNotes } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'customer'>('all');

  // Normalize phone number for consistent comparison
  const normalizePhone = (p?: string) => (p || '').replace(/[\s\-\+]/g, '').slice(-10);

  // Active credit notes with positive remaining balance
  const activeCreditNotes = useMemo(() => {
    return creditNotes.filter((cn) => cn.status === 'active' && cn.remainingAmount > 0);
  }, [creditNotes]);

  // Credit notes belonging specifically to the selected customer
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

  // Auto-switch filter mode to 'customer' when a customer with credit notes is selected
  React.useEffect(() => {
    if (selectedCustomer && customerCreditNotes.length > 0) {
      setFilterMode('customer');
    } else {
      setFilterMode('all');
    }
  }, [selectedCustomer, customerCreditNotes.length]);

  // Filtered and searched list
  const filteredNotes = useMemo(() => {
    const baseList = filterMode === 'customer' && selectedCustomer ? customerCreditNotes : activeCreditNotes;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseList;

    return baseList.filter(
      (cn) =>
        cn.code.toLowerCase().includes(q) ||
        cn.customerName.toLowerCase().includes(q) ||
        cn.customerPhone.includes(q) ||
        cn.originalInvoiceNumber.toLowerCase().includes(q) ||
        (cn.companyName && cn.companyName.toLowerCase().includes(q))
    );
  }, [filterMode, selectedCustomer, customerCreditNotes, activeCreditNotes, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Available Store Credit Notes</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {activeCreditNotes.length} Active
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Quickly select and redeem active customer credit notes on this bill
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-full sm:w-auto">
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => setFilterMode('customer')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    filterMode === 'customer'
                      ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Current Customer ({customerCreditNotes.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Store Active ({activeCreditNotes.length})
              </button>
            </div>

            {/* Total Balance Pill */}
            <div className="text-xs text-slate-600 font-medium self-end sm:self-center">
              Total Redeemable Credit:{' '}
              <strong className="font-mono text-emerald-700 font-extrabold text-sm">
                ₹
                {(filterMode === 'customer' && selectedCustomer
                  ? customerCreditNotes
                  : activeCreditNotes
                )
                  .reduce((s, c) => s + c.remainingAmount, 0)
                  .toFixed(2)}
              </strong>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by CN code (e.g. CN-1042), customer name, phone, or invoice..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
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
        </div>

        {/* Credit Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {filteredNotes.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">No active credit notes found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with a different name, phone number, or CN code.'
                  : filterMode === 'customer'
                  ? 'This customer has no active credit notes. Click "All Store Active" to view other customer vouchers.'
                  : 'Credit notes are automatically generated when processing customer garment exchanges or returns.'}
              </p>
              {filterMode === 'customer' && activeCreditNotes.length > 0 && (
                <button
                  onClick={() => setFilterMode('all')}
                  className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  View all {activeCreditNotes.length} store credit notes
                </button>
              )}
            </div>
          ) : (
            filteredNotes.map((cn) => {
              const isApplied = appliedCreditNoteCode === cn.code;
              const isCustomerMatch =
                selectedCustomer &&
                (normalizePhone(selectedCustomer.phone) === normalizePhone(cn.customerPhone) ||
                  selectedCustomer.name.trim().toLowerCase() === cn.customerName.trim().toLowerCase());

              return (
                <div
                  key={cn.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isApplied
                      ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Code & Customer Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                          {cn.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                          Active
                        </span>
                        {isCustomerMatch && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            ★ Matches Current Customer
                          </span>
                        )}
                        {isApplied && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                            <Check className="w-3 h-3" />
                            <span>Currently Applied</span>
                          </span>
                        )}
                      </div>

                      {/* Customer Name & Phone */}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cn.customerName}</span>
                        </span>
                        <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{cn.customerPhone}</span>
                        </span>
                      </div>

                      {/* Meta: Invoice & Dates */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>Orig Inv: {cn.originalInvoiceNumber}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Issued: {cn.issuedDate}</span>
                        </span>
                        <span className="text-slate-400">
                          Expires: {cn.expiryDate}
                        </span>
                      </div>

                      {/* Items Returned summary if available */}
                      {cn.itemsReturned && cn.itemsReturned.length > 0 && (
                        <div className="pt-1 text-[11px] text-slate-600">
                          <span className="font-medium text-slate-500">Return items: </span>
                          <span>
                            {cn.itemsReturned
                              .map((i) => `${i.productName} (${i.size || 'Std'}) x${i.qty}`)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Balances & Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Available Credit</div>
                        <div className="font-mono font-black text-lg text-emerald-700">
                          ₹{cn.remainingAmount.toFixed(2)}
                        </div>
                        {cn.amount !== cn.remainingAmount && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Orig: ₹{cn.amount.toFixed(2)}
                          </div>
                        )}
                      </div>

                      {isApplied ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onRemoveAppliedCreditNote) onRemoveAppliedCreditNote();
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          Remove from Bill
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectCreditNote(cn);
                            onClose();
                          }}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>Apply to Bill</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Active credit notes can be redeemed on any billing transaction</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
