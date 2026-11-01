import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AlterationRecord } from '../../types';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import { TailorTagPreviewModal } from './TailorTagPreviewModal';
import { AlterationNotifyModal } from './AlterationNotifyModal';
import {
  Scissors,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Printer,
  Calendar,
  User,
  Phone,
  Filter,
  MessageCircle,
  Check,
  Camera,
} from 'lucide-react';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';

export const AlterationsManager: React.FC = () => {
  const {
    alterations,
    updateAlterationStatus,
    markAlterationNotified,
    addAlteration,
    products,
    activeCompany,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const printTagRef = useRef<HTMLDivElement>(null);
  const [activePrintTag, setActivePrintTag] = useState<AlterationRecord | null>(null);
  const [notifyAlt, setNotifyAlt] = useState<AlterationRecord | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const sampleAlterationCodes = alterations.slice(0, 4).map((alt) => ({
    label: `${alt.customerName} (${alt.invoiceNumber})`,
    code: alt.invoiceNumber,
    type: 'Tailor Ticket',
  }));

  const [form, setForm] = useState({
    invoiceNumber: 'INV-MANUAL',
    customerName: '',
    customerPhone: '',
    garmentName: products[0]?.name || 'Cotton Shirt',
    size: 'M',
    color: 'Navy Blue',
    alterationNotes: 'Shorten length by 1.5 inches',
    tailorName: '',
    promisedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  const filtered = alterations.filter((alt) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      alt.customerName.toLowerCase().includes(q) ||
      alt.customerPhone.includes(q) ||
      alt.invoiceNumber.toLowerCase().includes(q) ||
      alt.garmentName.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || alt.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handlePrintTag = (alt: AlterationRecord) => {
    setActivePrintTag(alt);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim()) return;

    addAlteration({
      saleId: `sale_${Date.now()}`,
      invoiceNumber: form.invoiceNumber,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      garmentName: form.garmentName,
      size: form.size,
      color: form.color,
      alterationNotes: form.alterationNotes,
      tailorName: form.tailorName,
      promisedDate: form.promisedDate,
      status: 'In Progress',
    });

    setIsAddModalOpen(false);
  };

  const pendingCount = alterations.filter((a) => a.status === 'In Progress' || a.status === 'Pending').length;
  const readyCount = alterations.filter((a) => a.status === 'Ready for Pickup').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-indigo-600" />
            In-Store Alteration & Tailoring Tracker
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track garment hemming, waist adjustments, tailor assignment, and customer pickup readiness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md font-semibold border border-amber-200">
              {pendingCount} with Tailor
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md font-semibold border border-emerald-200">
              {readyCount} Ready for Pickup
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Alteration Job</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, bill #, or garment..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            title="Scan tailoring ticket or customer invoice barcode"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Ticket</span>
          </button>
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
          {['all', 'In Progress', 'Ready for Pickup', 'Delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Jobs' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Alterations Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No alteration jobs found under this filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((alt) => (
              <div
                key={alt.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{alt.garmentName}</span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-800 rounded">
                      Size: {alt.size}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">({alt.color})</span>
                  </div>

                  <div className="text-slate-700 font-medium bg-amber-50/60 p-2 rounded-lg border border-amber-100 max-w-xl">
                    <strong className="text-amber-950 font-bold">Fitting Notes: </strong>
                    {alt.alterationNotes}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    <span className="font-mono text-slate-700 font-bold">{alt.invoiceNumber}</span>
                    <span>·</span>
                    <span className="font-medium text-slate-800">Customer: {alt.customerName} ({alt.customerPhone})</span>
                    <span>·</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Ready By: {alt.promisedDate}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {alt.customerNotifiedAt && (
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Notified ({alt.customerNotifiedAt})</span>
                    </span>
                  )}

                  {/* Status Picker */}
                  <select
                    value={alt.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      updateAlterationStatus(alt.id, newStatus);
                      if (newStatus === 'Ready for Pickup') {
                        setNotifyAlt({ ...alt, status: 'Ready for Pickup' });
                      }
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                      alt.status === 'Ready for Pickup'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : alt.status === 'In Progress'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : alt.status === 'Delivered'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-indigo-50 text-indigo-800 border-indigo-300'
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress with Tailor</option>
                    <option value="Ready for Pickup">Ready for Pickup</option>
                    <option value="Delivered">Delivered to Customer</option>
                  </select>

                  {/* Send WhatsApp / SMS Pickup Notification Button */}
                  {alt.status === 'Ready for Pickup' && (
                    <button
                      onClick={() => setNotifyAlt(alt)}
                      title="Send WhatsApp or SMS pickup notification"
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
                      <span>{alt.customerNotifiedAt ? 'Resend Msg' : 'Send Pickup Msg'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handlePrintTag(alt)}
                    title="Print 58mm Tailor Tag"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Tag</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Alteration Job Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-indigo-600" />
              <span>Record New In-Store Alteration</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. Rahul Gupta"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Phone *</label>
                  <input
                    type="tel"
                    required
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="e.g. 9812345678"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Garment Name</label>
                <input
                  type="text"
                  required
                  value={form.garmentName}
                  onChange={(e) => setForm({ ...form, garmentName: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Size & Color</label>
                <input
                  type="text"
                  value={`${form.size} - ${form.color}`}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tailoring Instructions *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.alterationNotes}
                  onChange={(e) => setForm({ ...form, alterationNotes: e.target.value })}
                  placeholder="e.g. Shorten length by 2 inches, tighten waist 1 inch"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Promised Delivery Date</label>
                <input
                  type="date"
                  value={form.promisedDate}
                  onChange={(e) => setForm({ ...form, promisedDate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 58mm Tailor Tag Preview Modal */}
      <TailorTagPreviewModal
        isOpen={Boolean(activePrintTag)}
        alteration={activePrintTag}
        onClose={() => setActivePrintTag(null)}
      />

      {/* Customer Alteration Pickup Notification Modal */}
      <AlterationNotifyModal
        isOpen={Boolean(notifyAlt)}
        alteration={notifyAlt}
        onClose={() => setNotifyAlt(null)}
        onMarkNotified={markAlterationNotified}
        activeCompany={activeCompany}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(code) => {
          setSearchQuery(code);
          setIsCameraScannerOpen(false);
        }}
        title="Tailoring Ticket & Invoice Scanner"
        subtitle="Point camera at tailor ticket tag or bill barcode to filter jobs"
        allowContinuous={false}
        defaultContinuous={false}
        sampleCodes={sampleAlterationCodes}
      />
    </div>
  );
};
