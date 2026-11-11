import React, { useState, useMemo } from 'react';
import { Customer, GarmentMeasurementProfile, GarmentFitType } from '../../types';
import { useApp } from '../../context/AppContext';
import { printThermalReceiptHtml } from '../../utils/printReceipt';
import {
  Ruler,
  X,
  Plus,
  Trash2,
  Printer,
  Share2,
  Save,
  Check,
  Scissors,
  Sparkles,
  User,
  Phone,
  Calendar,
  Layers,
  FileText,
  Copy,
} from 'lucide-react';

interface CustomerMeasurementModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCustomer: Customer) => void;
}

const GARMENT_TYPES: { id: GarmentFitType; label: string; icon: string }[] = [
  { id: 'Kurti / Ethnic Top', label: 'Kurti / Ethnic', icon: '👗' },
  { id: 'Shirt / Top', label: 'Shirt / Top', icon: '👔' },
  { id: 'Trouser / Jeans / Salwar', label: 'Trousers / Pants', icon: '👖' },
  { id: 'Blouse / Choli', label: 'Blouse / Choli', icon: '✨' },
  { id: 'Suit / Blazer', label: 'Suit / Blazer', icon: '🧥' },
  { id: 'Custom Dress', label: 'Custom Dress', icon: '🧵' },
];

const PRESET_STANDARDS: Record<string, Record<string, string>> = {
  '38 / M': {
    chest: '38',
    waist: '32',
    hip: '40',
    shoulder: '15',
    sleeveLength: '18',
    armhole: '17',
    collar: '15',
    topLength: '42',
    inseam: '30',
    outseam: '39',
    bottomOpening: '13',
  },
  '40 / L': {
    chest: '40',
    waist: '34',
    hip: '42',
    shoulder: '15.5',
    sleeveLength: '18.5',
    armhole: '18',
    collar: '15.5',
    topLength: '43',
    inseam: '31',
    outseam: '40',
    bottomOpening: '14',
  },
  '42 / XL': {
    chest: '42',
    waist: '36',
    hip: '44',
    shoulder: '16',
    sleeveLength: '19',
    armhole: '19',
    collar: '16',
    topLength: '44',
    inseam: '31',
    outseam: '41',
    bottomOpening: '14.5',
  },
  '44 / XXL': {
    chest: '44',
    waist: '38',
    hip: '46',
    shoulder: '16.5',
    sleeveLength: '19.5',
    armhole: '20',
    collar: '16.5',
    topLength: '44',
    inseam: '32',
    outseam: '42',
    bottomOpening: '15',
  },
};

export const CustomerMeasurementModal: React.FC<CustomerMeasurementModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSave,
}) => {
  const { activeCompany } = useApp();

  // Active Profile ID: 'primary' or custom ID
  const [selectedProfileId, setSelectedProfileId] = useState<string>('primary');
  const [copied, setCopied] = useState(false);

  // Local state for profiles
  const [profiles, setProfiles] = useState<GarmentMeasurementProfile[]>(() => {
    if (!customer?.profile?.measurementProfiles) return [];
    return customer.profile.measurementProfiles;
  });

  // Primary quick measurements
  const [primaryMeasurements, setPrimaryMeasurements] = useState<{
    chest?: string;
    waist?: string;
    shoulder?: string;
    inseam?: string;
    length?: string;
    collar?: string;
  }>(() => {
    return customer?.profile?.measurements || {};
  });

  // Current active profile form
  const [currentForm, setCurrentForm] = useState<GarmentMeasurementProfile>(() => {
    return {
      id: `prof_${Date.now()}`,
      customerId: customer?.id || '',
      profileName: 'Festive Kurti Fit',
      garmentType: 'Kurti / Ethnic Top',
      updatedAt: new Date().toISOString().split('T')[0],
      notes: '',
      values: {
        chest: '',
        waist: '',
        hip: '',
        shoulder: '',
        sleeveLength: '',
        armhole: '',
        collar: '',
        frontNeckDepth: '',
        backNeckDepth: '',
        topLength: '',
        inseam: '',
        outseam: '',
        thigh: '',
        bottomOpening: '',
        crotchRise: '',
      },
    };
  });

  // Sync state when customer changes
  React.useEffect(() => {
    if (customer && isOpen) {
      const existing = customer.profile?.measurementProfiles || [];
      setProfiles(existing);
      setPrimaryMeasurements(customer.profile?.measurements || {});

      if (existing.length > 0) {
        setSelectedProfileId(existing[0].id);
        setCurrentForm(existing[0]);
      } else {
        setSelectedProfileId('primary');
      }
    }
  }, [customer, isOpen]);

  // When switching profiles
  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    if (id === 'primary') return;
    const found = profiles.find((p) => p.id === id);
    if (found) {
      setCurrentForm(found);
    }
  };

  const handleAddNewProfile = () => {
    const newId = `prof_${Date.now()}`;
    const newProf: GarmentMeasurementProfile = {
      id: newId,
      customerId: customer?.id || '',
      profileName: `New Fit (${profiles.length + 1})`,
      garmentType: 'Kurti / Ethnic Top',
      updatedAt: new Date().toISOString().split('T')[0],
      notes: '',
      values: {
        chest: primaryMeasurements.chest || '',
        waist: primaryMeasurements.waist || '',
        shoulder: primaryMeasurements.shoulder || '',
        inseam: primaryMeasurements.inseam || '',
        topLength: primaryMeasurements.length || '',
        collar: primaryMeasurements.collar || '',
      },
    };

    setProfiles((prev) => [...prev, newProf]);
    setSelectedProfileId(newId);
    setCurrentForm(newProf);
  };

  const handleDeleteProfile = (id: string) => {
    if (id === 'primary') return;
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setSelectedProfileId('primary');
  };

  const updateFormValue = (key: keyof GarmentMeasurementProfile['values'], val: string) => {
    setCurrentForm((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [key]: val,
      },
    }));
  };

  const updatePrimaryValue = (key: keyof typeof primaryMeasurements, val: string) => {
    setPrimaryMeasurements((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleApplyPreset = (presetKey: string) => {
    const standard = PRESET_STANDARDS[presetKey];
    if (!standard) return;

    if (selectedProfileId === 'primary') {
      setPrimaryMeasurements({
        chest: standard.chest,
        waist: standard.waist,
        shoulder: standard.shoulder,
        inseam: standard.inseam,
        length: standard.topLength,
        collar: standard.collar,
      });
    } else {
      setCurrentForm((prev) => ({
        ...prev,
        values: {
          ...prev.values,
          ...standard,
        },
      }));
    }
  };

  const handleSaveAll = () => {
    if (!customer) return;

    let updatedProfiles = [...profiles];
    if (selectedProfileId !== 'primary') {
      const idx = updatedProfiles.findIndex((p) => p.id === selectedProfileId);
      if (idx >= 0) {
        updatedProfiles[idx] = {
          ...currentForm,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      } else {
        updatedProfiles.push(currentForm);
      }
    }

    const updatedCustomer: Customer = {
      ...customer,
      profile: {
        ...(customer.profile || {}),
        measurements: primaryMeasurements,
        measurementProfiles: updatedProfiles,
      },
    };

    onSave(updatedCustomer);
    onClose();
  };

  // Format Text for WhatsApp sharing
  const generateWhatsAppMessage = () => {
    if (!customer) return '';
    const dateStr = new Date().toLocaleDateString('en-IN');

    if (selectedProfileId === 'primary') {
      return `
*Bespoke Measurements Slip - ${activeCompany.name}*
Customer: ${customer.name} (${customer.phone})
Date: ${dateStr}
--------------------------------
• Chest / Bust: ${primaryMeasurements.chest || 'N/A'}"
• Waist: ${primaryMeasurements.waist || 'N/A'}"
• Shoulder: ${primaryMeasurements.shoulder || 'N/A'}"
• Garment Length: ${primaryMeasurements.length || 'N/A'}"
• Inseam: ${primaryMeasurements.inseam || 'N/A'}"
• Collar: ${primaryMeasurements.collar || 'N/A'}"
--------------------------------
Master Tailor Notes: Please verify fitting before final stitching.
Visit Us: ${activeCompany.name}, ${activeCompany.city}
      `.trim();
    }

    const v = currentForm.values;
    return `
*Bespoke Measurements Slip - ${activeCompany.name}*
Customer: ${customer.name} (${customer.phone})
Garment: ${currentForm.garmentType} (${currentForm.profileName})
Date: ${dateStr}
--------------------------------
${v.chest ? `• Chest / Bust: ${v.chest}"\n` : ''}${v.waist ? `• Waist: ${v.waist}"\n` : ''}${v.hip ? `• Hip: ${v.hip}"\n` : ''}${v.shoulder ? `• Shoulder: ${v.shoulder}"\n` : ''}${v.sleeveLength ? `• Sleeve Length: ${v.sleeveLength}"\n` : ''}${v.armhole ? `• Armhole: ${v.armhole}"\n` : ''}${v.frontNeckDepth ? `• Front Neck: ${v.frontNeckDepth}"\n` : ''}${v.backNeckDepth ? `• Back Neck: ${v.backNeckDepth}"\n` : ''}${v.topLength ? `• Full Length: ${v.topLength}"\n` : ''}${v.inseam ? `• Inseam: ${v.inseam}"\n` : ''}${v.outseam ? `• Outseam: ${v.outseam}"\n` : ''}${v.bottomOpening ? `• Bottom Opening: ${v.bottomOpening}"\n` : ''}--------------------------------
${currentForm.notes ? `*Notes:* ${currentForm.notes}\n--------------------------------\n` : ''}Master Tailor: ${activeCompany.name}
    `.trim();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    const cleanPhone = customer?.phone.replace(/[^0-9]/g, '');
    const url = cleanPhone && cleanPhone.length >= 10
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrintSlip = () => {
    const text = generateWhatsAppMessage();
    const html = `
      <div class="thermal-receipt-58mm thermal-receipt-50mm thermal-bold">
        <div class="receipt-title">${activeCompany.name.toUpperCase()}</div>
        <div class="receipt-sub">Bespoke Fitting Slip</div>
        <hr />
        <div class="receipt-row font-bold"><span>CUSTOMER:</span><span>${customer?.name}</span></div>
        <div class="receipt-row"><span>PHONE:</span><span>${customer?.phone}</span></div>
        <div class="receipt-row"><span>GARMENT:</span><span>${selectedProfileId === 'primary' ? 'Standard Fit' : currentForm.garmentType}</span></div>
        <hr />
        <pre style="font-family: inherit; font-size: 9px; white-space: pre-wrap; margin: 4px 0;">${text}</pre>
        <hr />
        <div class="text-center" style="font-size: 8px; text-align: center;">PIN TO CLOTH LOT</div>
      </div>
    `;
    printThermalReceiptHtml(html, true);
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-600 rounded-xl text-white">
              <Ruler className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Customer Measurement Cards</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                  Bespoke Fitting
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {customer.name} • {customer.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSlip}
              title="Print Tailor Slip on 58mm/80mm Thermal Printer"
              className="px-3 py-1.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              title="Share measurement slip with customer or tailor via WhatsApp"
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Selector Strip */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {/* Primary Quick Tab */}
            <button
              type="button"
              onClick={() => handleSelectProfile('primary')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedProfileId === 'primary'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Primary Fit</span>
            </button>

            {/* Custom Profiles */}
            {profiles.map((prof) => (
              <button
                key={prof.id}
                type="button"
                onClick={() => handleSelectProfile(prof.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedProfileId === prof.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                <span>{prof.profileName}</span>
                <span className="text-[10px] opacity-75">({prof.garmentType.split(' ')[0]})</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddNewProfile}
            className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Fit Card</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Standard Fill Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quick Standard Presets:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.keys(PRESET_STANDARDS).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleApplyPreset(key)}
                  className="px-2.5 py-1 text-xs font-mono font-bold text-slate-700 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  Fill {key}
                </button>
              ))}
            </div>
          </div>

          {/* ================= MODE 1: PRIMARY QUICK FIT ================= */}
          {selectedProfileId === 'primary' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                Primary quick measurements are instantly accessible by cashiers during POS billing and alter tailoring.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chest / Bust (Inches)</label>
                  <input
                    type="text"
                    value={primaryMeasurements.chest || ''}
                    onChange={(e) => updatePrimaryValue('chest', e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waist (Inches)</label>
                  <input
                    type="text"
                    value={primaryMeasurements.waist || ''}
                    onChange={(e) => updatePrimaryValue('waist', e.target.value)}
                    placeholder="e.g. 34"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shoulder (Inches)</label>
                  <input
                    type="text"
                    value={primaryMeasurements.shoulder || ''}
                    onChange={(e) => updatePrimaryValue('shoulder', e.target.value)}
                    placeholder="e.g. 16.5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Garment Length (Inches)</label>
                  <input
                    type="text"
                    value={primaryMeasurements.length || ''}
                    onChange={(e) => updatePrimaryValue('length', e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inseam / Trouser Length</label>
                  <input
                    type="text"
                    value={primaryMeasurements.inseam || ''}
                    onChange={(e) => updatePrimaryValue('inseam', e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Collar / Neck (Inches)</label>
                  <input
                    type="text"
                    value={primaryMeasurements.collar || ''}
                    onChange={(e) => updatePrimaryValue('collar', e.target.value)}
                    placeholder="e.g. 15.5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE 2: SPECIFIC GARMENT FIT PROFILE ================= */}
          {selectedProfileId !== 'primary' && (
            <div className="space-y-5">
              {/* Profile Config Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fit Profile Label</label>
                  <input
                    type="text"
                    value={currentForm.profileName}
                    onChange={(e) => setCurrentForm({ ...currentForm, profileName: e.target.value })}
                    placeholder="e.g. Festive Kurti, Linen Shirt"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Garment Category</label>
                  <select
                    value={currentForm.garmentType}
                    onChange={(e) => setCurrentForm({ ...currentForm, garmentType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                  >
                    {GARMENT_TYPES.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.icon} {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upper Body Measurements Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>👗 Upper Body & Torso (Inches)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Chest / Bust</label>
                    <input
                      type="text"
                      value={currentForm.values.chest || ''}
                      onChange={(e) => updateFormValue('chest', e.target.value)}
                      placeholder="e.g. 40"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Waist</label>
                    <input
                      type="text"
                      value={currentForm.values.waist || ''}
                      onChange={(e) => updateFormValue('waist', e.target.value)}
                      placeholder="e.g. 34"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Hip</label>
                    <input
                      type="text"
                      value={currentForm.values.hip || ''}
                      onChange={(e) => updateFormValue('hip', e.target.value)}
                      placeholder="e.g. 42"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Shoulder</label>
                    <input
                      type="text"
                      value={currentForm.values.shoulder || ''}
                      onChange={(e) => updateFormValue('shoulder', e.target.value)}
                      placeholder="e.g. 15.5"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Sleeve Length</label>
                    <input
                      type="text"
                      value={currentForm.values.sleeveLength || ''}
                      onChange={(e) => updateFormValue('sleeveLength', e.target.value)}
                      placeholder="e.g. 18"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Armhole</label>
                    <input
                      type="text"
                      value={currentForm.values.armhole || ''}
                      onChange={(e) => updateFormValue('armhole', e.target.value)}
                      placeholder="e.g. 17"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Front Neck Depth</label>
                    <input
                      type="text"
                      value={currentForm.values.frontNeckDepth || ''}
                      onChange={(e) => updateFormValue('frontNeckDepth', e.target.value)}
                      placeholder="e.g. 6.5"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Back Neck Depth</label>
                    <input
                      type="text"
                      value={currentForm.values.backNeckDepth || ''}
                      onChange={(e) => updateFormValue('backNeckDepth', e.target.value)}
                      placeholder="e.g. 7"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Lower Body & Pants Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>👖 Lower Body & Lengths (Inches)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Top Length</label>
                    <input
                      type="text"
                      value={currentForm.values.topLength || ''}
                      onChange={(e) => updateFormValue('topLength', e.target.value)}
                      placeholder="e.g. 42"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Inseam</label>
                    <input
                      type="text"
                      value={currentForm.values.inseam || ''}
                      onChange={(e) => updateFormValue('inseam', e.target.value)}
                      placeholder="e.g. 30"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Outseam (Pants Length)</label>
                    <input
                      type="text"
                      value={currentForm.values.outseam || ''}
                      onChange={(e) => updateFormValue('outseam', e.target.value)}
                      placeholder="e.g. 39"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Bottom Opening (Morhi)</label>
                    <input
                      type="text"
                      value={currentForm.values.bottomOpening || ''}
                      onChange={(e) => updateFormValue('bottomOpening', e.target.value)}
                      placeholder="e.g. 13"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Special Tailor Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Master Tailor Instructions & Style Notes
                </label>
                <textarea
                  rows={2}
                  value={currentForm.notes || ''}
                  onChange={(e) => setCurrentForm({ ...currentForm, notes: e.target.value })}
                  placeholder="e.g. Extra 1.5 inch margin inside, deep V-neck, lining required for sleeves."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* Delete profile option */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteProfile(selectedProfileId)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete This Fit Profile</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Profiles saved: <strong className="text-slate-800">{profiles.length + 1}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Measurements</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

