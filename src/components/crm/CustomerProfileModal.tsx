import React, { useState, useEffect, useMemo } from 'react';
import { Customer, CustomerProfile, FamilyMember, FamilyRelation } from '../../types';
import { useApp } from '../../context/AppContext';
import { getReciprocalRelation } from '../../utils/crmUtils';
import {
  X,
  User,
  Sparkles,
  Save,
  Calendar,
  Ruler,
  MapPin,
  Palette,
  Heart,
  CheckCircle2,
  FileText,
  Users,
  Link2,
  Trash2,
  Plus,
  Phone,
  Edit2,
  AlertCircle,
  Search,
  UserPlus,
  Unlink,
  Crown,
  Check,
} from 'lucide-react';

interface CustomerProfileModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedCustomer: Customer, secondaryUpdates?: Customer[]) => void;
  initialTab?: 'sizes' | 'measurements' | 'occasions' | 'address' | 'style' | 'family';
  initialMemberToEdit?: FamilyMember | null;
}

const RELATION_OPTIONS: FamilyRelation[] = [
  'Spouse',
  'Son',
  'Daughter',
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'In-Law',
  'Other',
];

const SHIRT_SIZE_PRESETS = ['S (38)', 'M (40)', 'L (42)', 'XL (44)', 'XXL (46)', 'Kids 4Y', 'Kids 6Y', 'Kids 8Y', 'Free Size'];
const WAIST_SIZE_PRESETS = ['28', '30', '32', '34', '36', '38'];

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSave,
  initialTab = 'sizes',
  initialMemberToEdit = null,
}) => {
  const { customers, addCustomer } = useApp();

  const [activeTab, setActiveTab] = useState<'sizes' | 'measurements' | 'occasions' | 'address' | 'style' | 'family'>(
    initialTab
  );

  // Basic info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Profile optional fields
  const [profile, setProfile] = useState<CustomerProfile>({});

  // Family Member sub-form state
  const [familyMembersList, setFamilyMembersList] = useState<FamilyMember[]>([]);
  const [linkMode, setLinkMode] = useState<'new' | 'link_existing'>('new');
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState<string>('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [reciprocalLink, setReciprocalLink] = useState(true);
  const [reciprocalRelation, setReciprocalRelation] = useState<string>('Spouse');
  const [createStandaloneCustomer, setCreateStandaloneCustomer] = useState(false);
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [secondaryUpdatesList, setSecondaryUpdatesList] = useState<Customer[]>([]);

  const [familyForm, setFamilyForm] = useState({
    name: '',
    relation: 'Spouse' as FamilyRelation | string,
    phone: '',
    birthday: '',
    anniversary: '',
    preferredShirtSize: '',
    preferredTrouserWaist: '',
    notes: '',
  });

  useEffect(() => {
    if (customer && isOpen) {
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email || '');
      setNotes(customer.notes || '');
      setProfile(customer.profile || {});
      setFamilyMembersList(customer.profile?.familyMembers || []);
      setActiveTab(initialTab);
      setLinkSearchQuery('');
      setSecondaryUpdatesList([]);
      setCreateStandaloneCustomer(false);

      if (initialMemberToEdit) {
        setEditingFamilyId(initialMemberToEdit.id);
        setFamilyForm({
          name: initialMemberToEdit.name,
          relation: initialMemberToEdit.relation,
          phone: initialMemberToEdit.phone || '',
          birthday: initialMemberToEdit.birthday || '',
          anniversary: initialMemberToEdit.anniversary || '',
          preferredShirtSize: initialMemberToEdit.preferredShirtSize || '',
          preferredTrouserWaist: initialMemberToEdit.preferredTrouserWaist || '',
          notes: initialMemberToEdit.notes || '',
        });
        if (initialMemberToEdit.linkedCustomerId) {
          setLinkMode('link_existing');
          setSelectedExistingCustomerId(initialMemberToEdit.linkedCustomerId);
        } else {
          setLinkMode('new');
          setSelectedExistingCustomerId('');
        }
      } else {
        setEditingFamilyId(null);
        setFamilyForm({
          name: '',
          relation: 'Spouse',
          phone: '',
          birthday: '',
          anniversary: '',
          preferredShirtSize: '',
          preferredTrouserWaist: '',
          notes: '',
        });
        setSelectedExistingCustomerId('');
        setLinkMode('new');
      }
    }
  }, [customer, initialTab, initialMemberToEdit, isOpen]);

  if (!isOpen || !customer) return null;

  // Other customers available for linking (exclude current customer and already linked members)
  const availableCrmCustomers = useMemo(() => {
    const q = linkSearchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      if (c.id === customer.id) return false;
      const alreadyLinked = familyMembersList.some(
        (m) => m.linkedCustomerId === c.id && m.id !== editingFamilyId
      );
      if (alreadyLinked) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    });
  }, [customers, customer.id, familyMembersList, editingFamilyId, linkSearchQuery]);

  const handleSelectExistingCustomer = (targetId: string) => {
    setSelectedExistingCustomerId(targetId);
    const target = customers.find((c) => c.id === targetId);
    if (target) {
      setFamilyForm((prev) => ({
        ...prev,
        name: target.name,
        phone: target.phone || '',
        birthday: target.profile?.birthday || '',
        anniversary: target.profile?.anniversary || '',
        preferredShirtSize: target.profile?.preferredShirtSize || '',
        preferredTrouserWaist: target.profile?.preferredTrouserWaist || '',
        notes: target.notes || '',
      }));
      setReciprocalRelation(getReciprocalRelation(familyForm.relation));
    }
  };

  const handleRelationChange = (newRelation: string) => {
    setFamilyForm((prev) => ({ ...prev, relation: newRelation }));
    setReciprocalRelation(getReciprocalRelation(newRelation));
  };

  const handleSaveFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyForm.name.trim()) return;

    let targetLinkedId = linkMode === 'link_existing' && selectedExistingCustomerId ? selectedExistingCustomerId : undefined;

    // Handle reciprocal link if enabled and linking an existing CRM customer
    if (targetLinkedId && reciprocalLink && customer) {
      const targetCust = customers.find((c) => c.id === targetLinkedId);
      if (targetCust) {
        const targetExistingFamily = targetCust.profile?.familyMembers || [];
        const alreadyLinkedToMe = targetExistingFamily.some((m) => m.linkedCustomerId === customer.id);

        if (!alreadyLinkedToMe) {
          const reciprocalMember: FamilyMember = {
            id: `fam_${Date.now()}_recip`,
            name: customer.name,
            relation: reciprocalRelation || getReciprocalRelation(familyForm.relation),
            phone: customer.phone,
            linkedCustomerId: customer.id,
            preferredShirtSize: customer.profile?.preferredShirtSize,
            preferredTrouserWaist: customer.profile?.preferredTrouserWaist,
            birthday: customer.profile?.birthday,
            anniversary: customer.profile?.anniversary,
          };

          const updatedTargetCust: Customer = {
            ...targetCust,
            profile: {
              ...targetCust.profile,
              familyMembers: [...targetExistingFamily, reciprocalMember],
            },
          };

          setSecondaryUpdatesList((prev) => [
            ...prev.filter((c) => c.id !== updatedTargetCust.id),
            updatedTargetCust,
          ]);
        }
      }
    }

    // Handle creating a new standalone customer if selected
    if (linkMode === 'new' && createStandaloneCustomer && customer) {
      const newCust = addCustomer({
        name: familyForm.name.trim(),
        phone: familyForm.phone.trim() || `${customer.phone.slice(0, 6)}${Math.floor(1000 + Math.random() * 9000)}`,
        notes: familyForm.notes.trim() ? `Family of ${customer.name}. ${familyForm.notes.trim()}` : `Family of ${customer.name}`,
        profile: {
          birthday: familyForm.birthday || undefined,
          anniversary: familyForm.anniversary || undefined,
          preferredShirtSize: familyForm.preferredShirtSize.trim() || undefined,
          preferredTrouserWaist: familyForm.preferredTrouserWaist.trim() || undefined,
          familyMembers: [
            {
              id: `fam_${Date.now()}_recip`,
              name: customer.name,
              relation: getReciprocalRelation(familyForm.relation),
              phone: customer.phone,
              linkedCustomerId: customer.id,
              preferredShirtSize: customer.profile?.preferredShirtSize,
              preferredTrouserWaist: customer.profile?.preferredTrouserWaist,
            },
          ],
        },
      });
      targetLinkedId = newCust.id;
    }

    if (editingFamilyId) {
      // Update existing family member
      setFamilyMembersList((prev) =>
        prev.map((m) =>
          m.id === editingFamilyId
            ? {
                ...m,
                name: familyForm.name.trim(),
                relation: familyForm.relation,
                phone: familyForm.phone.trim() || undefined,
                birthday: familyForm.birthday || undefined,
                anniversary: familyForm.anniversary || undefined,
                preferredShirtSize: familyForm.preferredShirtSize.trim() || undefined,
                preferredTrouserWaist: familyForm.preferredTrouserWaist.trim() || undefined,
                notes: familyForm.notes.trim() || undefined,
                linkedCustomerId: targetLinkedId !== undefined ? targetLinkedId : m.linkedCustomerId,
              }
            : m
        )
      );
      setEditingFamilyId(null);
    } else {
      // Add new family member
      const newMember: FamilyMember = {
        id: `fam_${Date.now()}`,
        name: familyForm.name.trim(),
        relation: familyForm.relation,
        phone: familyForm.phone.trim() || undefined,
        birthday: familyForm.birthday || undefined,
        anniversary: familyForm.anniversary || undefined,
        preferredShirtSize: familyForm.preferredShirtSize.trim() || undefined,
        preferredTrouserWaist: familyForm.preferredTrouserWaist.trim() || undefined,
        notes: familyForm.notes.trim() || undefined,
        linkedCustomerId: targetLinkedId,
      };

      setFamilyMembersList((prev) => [...prev, newMember]);
    }

    // Reset sub-form
    setFamilyForm({
      name: '',
      relation: 'Spouse',
      phone: '',
      birthday: '',
      anniversary: '',
      preferredShirtSize: '',
      preferredTrouserWaist: '',
      notes: '',
    });
    setSelectedExistingCustomerId('');
    setLinkMode('new');
    setCreateStandaloneCustomer(false);
  };

  const handleEditFamilyMember = (member: FamilyMember) => {
    setEditingFamilyId(member.id);
    setFamilyForm({
      name: member.name,
      relation: member.relation,
      phone: member.phone || '',
      birthday: member.birthday || '',
      anniversary: member.anniversary || '',
      preferredShirtSize: member.preferredShirtSize || '',
      preferredTrouserWaist: member.preferredTrouserWaist || '',
      notes: member.notes || '',
    });
    setReciprocalRelation(getReciprocalRelation(member.relation));
    if (member.linkedCustomerId) {
      setLinkMode('link_existing');
      setSelectedExistingCustomerId(member.linkedCustomerId);
    } else {
      setLinkMode('new');
      setSelectedExistingCustomerId('');
    }
  };

  const handleRemoveFamilyMember = (memberId: string) => {
    setFamilyMembersList((prev) => prev.filter((m) => m.id !== memberId));
    if (editingFamilyId === memberId) {
      setEditingFamilyId(null);
      setFamilyForm({
        name: '',
        relation: 'Spouse',
        phone: '',
        birthday: '',
        anniversary: '',
        preferredShirtSize: '',
        preferredTrouserWaist: '',
        notes: '',
      });
      setSelectedExistingCustomerId('');
      setLinkMode('new');
    }
  };

  const handleUnlinkFamilyMember = (memberId: string) => {
    setFamilyMembersList((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, linkedCustomerId: undefined } : m))
    );
  };

  const handleConvertToCrmAccount = (member: FamilyMember) => {
    if (member.linkedCustomerId) return;
    const newCust = addCustomer({
      name: member.name,
      phone: member.phone || `${customer.phone.slice(0, 6)}${Math.floor(1000 + Math.random() * 9000)}`,
      notes: member.notes ? `Family member of ${customer.name}. ${member.notes}` : `Family member of ${customer.name}`,
      profile: {
        birthday: member.birthday,
        anniversary: member.anniversary,
        preferredShirtSize: member.preferredShirtSize,
        preferredTrouserWaist: member.preferredTrouserWaist,
        familyMembers: [
          {
            id: `fam_${Date.now()}_recip`,
            name: customer.name,
            relation: getReciprocalRelation(member.relation),
            phone: customer.phone,
            linkedCustomerId: customer.id,
            preferredShirtSize: customer.profile?.preferredShirtSize,
            preferredTrouserWaist: customer.profile?.preferredTrouserWaist,
          },
        ],
      },
    });

    setFamilyMembersList((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, linkedCustomerId: newCust.id } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCustomer: Customer = {
      ...customer,
      name: name.trim() || customer.name,
      phone: phone.trim() || customer.phone,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      profile: {
        ...profile,
        birthday: profile.birthday?.trim() || undefined,
        anniversary: profile.anniversary?.trim() || undefined,
        address: profile.address?.trim() || undefined,
        city: profile.city?.trim() || undefined,
        pincode: profile.pincode?.trim() || undefined,
        preferredShirtSize: profile.preferredShirtSize?.trim() || undefined,
        preferredTrouserWaist: profile.preferredTrouserWaist?.trim() || undefined,
        preferredFit: profile.preferredFit?.trim() || undefined,
        alternatePhone: profile.alternatePhone?.trim() || undefined,
        gstin: profile.gstin?.trim() || undefined,
        specialInstructions: profile.specialInstructions?.trim() || undefined,
        familyMembers: familyMembersList.length > 0 ? familyMembersList : undefined,
        measurements: profile.measurements
          ? {
              chest: profile.measurements.chest?.trim() || undefined,
              waist: profile.measurements.waist?.trim() || undefined,
              shoulder: profile.measurements.shoulder?.trim() || undefined,
              inseam: profile.measurements.inseam?.trim() || undefined,
              length: profile.measurements.length?.trim() || undefined,
              collar: profile.measurements.collar?.trim() || undefined,
            }
          : undefined,
      },
    };

    onSave(updatedCustomer, secondaryUpdatesList);
    onClose();
  };

  const updateMeasurement = (key: keyof NonNullable<CustomerProfile['measurements']>, val: string) => {
    setProfile((prev) => ({
      ...prev,
      measurements: {
        ...(prev.measurements || {}),
        [key]: val,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto no-print">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Build Customer Profile: {customer.name}</span>
              </h3>
              <p className="text-xs text-slate-300">
                All fields are optional. Fill whichever sizing, measurements, or family links the customer shares.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('family')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'family'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-pink-600" />
            <span>Family Members ({familyMembersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sizes')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'sizes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 text-indigo-600" />
            <span>Garment Sizes & Fit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('measurements')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'measurements'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Body Measurements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('occasions')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'occasions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>Occasions & Dates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'address'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Address & GST</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'style'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-purple-600" />
            <span>Style & Notes</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* TAB 0: FAMILY MEMBERS (ADD / LINK) */}
          {activeTab === 'family' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Informative Banner */}
              <div className="p-3 bg-pink-50/70 rounded-xl border border-pink-200 flex items-start gap-2.5 text-pink-950">
                <Users className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-xs">Family & Household Sizing Profile</div>
                  <p className="text-[11px] text-pink-900/80">
                    Add family members (spouse, children, parents) or link them to existing CRM profiles.
                    Store their sizes, birthdays, and clothing tastes so staff can assist when customers shop for the family.
                  </p>
                </div>
              </div>

              {/* Existing Family Members List */}
              {familyMembersList.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>Linked Family Members ({familyMembersList.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Click edit to update or delete</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {familyMembersList.map((member) => {
                      const linkedCrmCust = member.linkedCustomerId
                        ? customers.find((c) => c.id === member.linkedCustomerId)
                        : null;

                      return (
                        <div
                          key={member.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-pink-300 transition-colors flex flex-col justify-between space-y-2.5"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                                  <span>{member.name}</span>
                                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${
                                    member.relation === 'Spouse'
                                      ? 'bg-rose-100 text-rose-900 border-rose-200'
                                      : member.relation === 'Son' || member.relation === 'Daughter'
                                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                                      : member.relation === 'Father' || member.relation === 'Mother'
                                      ? 'bg-indigo-100 text-indigo-900 border-indigo-200'
                                      : member.relation === 'Brother' || member.relation === 'Sister'
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                                      : 'bg-slate-100 text-slate-800 border-slate-200'
                                  }`}>
                                    {member.relation}
                                  </span>
                                </div>
                                {member.phone && (
                                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    <span>{member.phone}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleEditFamilyMember(member)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Edit family member details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFamilyMember(member.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove from family"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Sizing & Milestones */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {member.preferredShirtSize && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-800">
                                  Shirt: {member.preferredShirtSize}
                                </span>
                              )}
                              {member.preferredTrouserWaist && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-800">
                                  Waist: {member.preferredTrouserWaist}"
                                </span>
                              )}
                              {member.birthday && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-1">
                                  <Heart className="w-2.5 h-2.5 text-rose-500" />
                                  <span>Bday: {member.birthday}</span>
                                </span>
                              )}
                              {member.anniversary && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 border border-purple-200 text-purple-800 flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5 text-purple-500" />
                                  <span>Anniv: {member.anniversary}</span>
                                </span>
                              )}
                            </div>

                            {member.notes && (
                              <p className="text-[11px] text-slate-600 mt-1.5 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                                "{member.notes}"
                              </p>
                            )}
                          </div>

                          {/* CRM Connection Status */}
                          <div className="pt-2 border-t border-slate-100">
                            {linkedCrmCust ? (
                              <div className="flex items-center justify-between text-[10px] bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100">
                                <div className="flex items-center gap-1 text-indigo-900 font-medium">
                                  <Link2 className="w-3 h-3 text-indigo-600" />
                                  <span>Linked CRM: <strong>{linkedCrmCust.name}</strong></span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUnlinkFamilyMember(member.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                                  title="Unlink from CRM account"
                                >
                                  <Unlink className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                <span className="text-slate-400">Household contact</span>
                                <button
                                  type="button"
                                  onClick={() => handleConvertToCrmAccount(member)}
                                  className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                                  title="Create full independent CRM customer account"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  <span>Convert to CRM</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-form: Add / Link Family Member */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    {editingFamilyId ? <Edit2 className="w-3.5 h-3.5 text-indigo-600" /> : <Plus className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{editingFamilyId ? 'Edit Family Member Details' : 'Add / Link a Family Member'}</span>
                  </div>

                  {editingFamilyId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFamilyId(null);
                        setFamilyForm({
                          name: '',
                          relation: 'Spouse',
                          phone: '',
                          birthday: '',
                          anniversary: '',
                          preferredShirtSize: '',
                          preferredTrouserWaist: '',
                          notes: '',
                        });
                        setSelectedExistingCustomerId('');
                        setLinkMode('new');
                      }}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Switch between: Add New or Link Existing Customer */}
                {!editingFamilyId && (
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setLinkMode('new');
                        setSelectedExistingCustomerId('');
                      }}
                      className={`py-1.5 px-2 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        linkMode === 'new'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5 text-pink-600" />
                      <span>+ Add New Member</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkMode('link_existing')}
                      className={`py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        linkMode === 'link_existing'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Link Existing CRM Customer</span>
                    </button>
                  </div>
                )}

                {/* If Linking Existing Customer: Search & Pick */}
                {linkMode === 'link_existing' && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-2.5 animate-in fade-in">
                    <div>
                      <label className="block font-bold text-indigo-950 text-xs mb-1">
                        Search CRM Directory to Link Account
                      </label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={linkSearchQuery}
                          onChange={(e) => setLinkSearchQuery(e.target.value)}
                          placeholder="Search customer by name, mobile, or email..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-indigo-500"
                        />
                      </div>
                    </div>

                    {selectedExistingCustomerId ? (
                      (() => {
                        const target = customers.find((c) => c.id === selectedExistingCustomerId);
                        if (!target) return null;
                        return (
                          <div className="p-2.5 bg-white border border-indigo-300 rounded-lg space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Selected: {target.name}</span>
                                  {target.isVip && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950 flex items-center gap-0.5">
                                      <Crown className="w-2.5 h-2.5 fill-current" />
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  +91 {target.phone} · ₹{target.totalSpend.toLocaleString('en-IN')} spend · {target.loyaltyPoints} pts
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedExistingCustomerId('')}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                              >
                                Change
                              </button>
                            </div>

                            {/* Reciprocal Linking Settings */}
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={reciprocalLink}
                                  onChange={(e) => setReciprocalLink(e.target.checked)}
                                  className="rounded text-indigo-600 cursor-pointer"
                                />
                                <span className="text-[11px] font-semibold text-indigo-950">
                                  Reciprocal link: Also add <strong>{customer.name}</strong> to <strong>{target.name}</strong>'s profile
                                </span>
                              </label>

                              {reciprocalLink && (
                                <div className="flex items-center gap-2 pl-5 text-[11px]">
                                  <span className="text-slate-600">Their relationship to {customer.name}:</span>
                                  <select
                                    value={reciprocalRelation}
                                    onChange={(e) => setReciprocalRelation(e.target.value)}
                                    className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-xs font-semibold text-indigo-900"
                                  >
                                    {RELATION_OPTIONS.map((r) => (
                                      <option key={r} value={r}>
                                        {r}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-indigo-200 rounded-lg bg-white">
                        {availableCrmCustomers.length === 0 ? (
                          <div className="p-3 text-center text-[11px] text-slate-400">
                            No matching customers found.
                          </div>
                        ) : (
                          availableCrmCustomers.slice(0, 10).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectExistingCustomer(c.id)}
                              className="w-full p-2 text-left hover:bg-indigo-50/70 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                  <span>{c.name}</span>
                                  {c.isVip && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-400 text-slate-950">
                                      VIP
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {c.phone} {c.profile?.preferredShirtSize ? `· Size ${c.profile.preferredShirtSize}` : ''}
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                                Select & Link
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Relationship <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={familyForm.relation}
                      onChange={(e) => handleRelationChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium cursor-pointer"
                    >
                      {RELATION_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Family Member Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={familyForm.name}
                      onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                      placeholder="e.g. Priya Malhotra"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={familyForm.phone}
                      onChange={(e) => setFamilyForm({ ...familyForm, phone: e.target.value })}
                      placeholder="e.g. 9812345678"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Birth Date <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={familyForm.birthday}
                      onChange={(e) => setFamilyForm({ ...familyForm, birthday: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">
                        Shirt / Top Size <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={familyForm.preferredShirtSize}
                      onChange={(e) => setFamilyForm({ ...familyForm, preferredShirtSize: e.target.value })}
                      placeholder="e.g. M, 38, Kids 6Y, XL"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {SHIRT_SIZE_PRESETS.slice(0, 6).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setFamilyForm({ ...familyForm, preferredShirtSize: sz })}
                          className="px-1.5 py-0.5 text-[10px] font-medium bg-white hover:bg-slate-100 border border-slate-200 rounded cursor-pointer transition-colors"
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700">
                        Trouser / Waist <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={familyForm.preferredTrouserWaist}
                      onChange={(e) => setFamilyForm({ ...familyForm, preferredTrouserWaist: e.target.value })}
                      placeholder="e.g. 30, 32, Free Size"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {WAIST_SIZE_PRESETS.map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setFamilyForm({ ...familyForm, preferredTrouserWaist: w })}
                          className="px-1.5 py-0.5 text-[10px] font-medium bg-white hover:bg-slate-100 border border-slate-200 rounded cursor-pointer transition-colors"
                        >
                          {w}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Clothing / Style Notes <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={familyForm.notes}
                    onChange={(e) => setFamilyForm({ ...familyForm, notes: e.target.value })}
                    placeholder="e.g. Loves pastel silk kurtis, allergic to pure wool, preferred collar: Mandarin"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                {linkMode === 'new' && !editingFamilyId && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createStandaloneCustomer}
                        onChange={(e) => setCreateStandaloneCustomer(e.target.checked)}
                        className="rounded text-emerald-600 mt-0.5 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">
                          Create dedicated CRM Customer account
                        </span>
                        <span className="text-[10px] text-emerald-800 block">
                          Creates an independent customer profile for {familyForm.name || 'this member'} with shared reciprocal household link.
                        </span>
                      </div>
                    </label>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveFamilyMember}
                    disabled={!familyForm.name.trim()}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingFamilyId ? 'Save Member Updates' : 'Add to Family'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: SIZES & FIT */}
          {activeTab === 'sizes' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-2 text-indigo-900">
                <Ruler className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Save preferred off-the-rack garment sizes for quick cashier lookup during billing.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preferred Shirt / Kurti Size <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={profile.preferredShirtSize || ''}
                    onChange={(e) => setProfile({ ...profile, preferredShirtSize: e.target.value })}
                    placeholder="e.g. L, 40, 42, XL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {['S (38)', 'M (40)', 'L (42)', 'XL (44)', 'XXL (46)'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setProfile({ ...profile, preferredShirtSize: sz })}
                        className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium cursor-pointer"
                      >
                        {sz.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preferred Trouser / Denim Waist <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={profile.preferredTrouserWaist || ''}
                    onChange={(e) => setProfile({ ...profile, preferredTrouserWaist: e.target.value })}
                    placeholder="e.g. 32, 34, 36"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {['28', '30', '32', '34', '36', '38'].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setProfile({ ...profile, preferredTrouserWaist: w })}
                        className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium cursor-pointer"
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Preferred Fit Style <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={profile.preferredFit || ''}
                  onChange={(e) => setProfile({ ...profile, preferredFit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">-- Select Preferred Fit (Optional) --</option>
                  <option value="Slim Fit">Slim Fit</option>
                  <option value="Regular Fit">Regular Fit</option>
                  <option value="Relaxed Fit">Relaxed Fit</option>
                  <option value="Comfort / Traditional">Comfort / Traditional</option>
                  <option value="Tailored / Bespoke">Tailored / Bespoke</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: MEASUREMENTS */}
          {activeTab === 'measurements' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center gap-2 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Store exact tailor measurements (in inches) to make bespoke fittings seamless.</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chest (inches)</label>
                  <input
                    type="text"
                    value={profile.measurements?.chest || ''}
                    onChange={(e) => updateMeasurement('chest', e.target.value)}
                    placeholder="e.g. 40.5"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Waist (inches)</label>
                  <input
                    type="text"
                    value={profile.measurements?.waist || ''}
                    onChange={(e) => updateMeasurement('waist', e.target.value)}
                    placeholder="e.g. 34"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shoulder (inches)</label>
                  <input
                    type="text"
                    value={profile.measurements?.shoulder || ''}
                    onChange={(e) => updateMeasurement('shoulder', e.target.value)}
                    placeholder="e.g. 18"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inseam (inches)</label>
                  <input
                    type="text"
                    value={profile.measurements?.inseam || ''}
                    onChange={(e) => updateMeasurement('inseam', e.target.value)}
                    placeholder="e.g. 31"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Garment Length (inches)</label>
                  <input
                    type="text"
                    value={profile.measurements?.length || ''}
                    onChange={(e) => updateMeasurement('length', e.target.value)}
                    placeholder="e.g. 29.5"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Collar / Neck (inches)</label>
                  <input
                    type="text"
                    value={profile.measurements?.collar || ''}
                    onChange={(e) => updateMeasurement('collar', e.target.value)}
                    placeholder="e.g. 16"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OCCASIONS */}
          {activeTab === 'occasions' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center gap-2 text-rose-900">
                <Heart className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Track birthdays and wedding anniversaries to send greetings and celebratory discounts.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Birth Date <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={profile.birthday || ''}
                    onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-400">Used for birthday month privilege coupons.</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Wedding Anniversary <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={profile.anniversary || ''}
                    onChange={(e) => setProfile({ ...profile, anniversary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-400">Used for anniversary festive offers.</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADDRESS & GST */}
          {activeTab === 'address' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center gap-2 text-emerald-900">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Optional residential address, delivery location, or business GSTIN.</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Street Address / Landmark</label>
                  <input
                    type="text"
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="e.g. 42 Model Town, Near Sector 14"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      value={profile.city || ''}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="e.g. Karnal, Haryana"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={profile.pincode || ''}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                      placeholder="e.g. 132001"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alternate Contact Phone</label>
                    <input
                      type="tel"
                      value={profile.alternatePhone || ''}
                      onChange={(e) => setProfile({ ...profile, alternatePhone: e.target.value })}
                      placeholder="e.g. 9812000000"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customer / Business GSTIN</label>
                    <input
                      type="text"
                      value={profile.gstin || ''}
                      onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                      placeholder="e.g. 06AAAAA0000A1Z5"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STYLE & NOTES */}
          {activeTab === 'style' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 flex items-center gap-2 text-purple-900">
                <Palette className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Record customer styling tastes, fabric sensitivities, or preferences.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  General Customer Notes / Brand Preferences
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Buys formal shirts for office, prefers pure cotton weaves, dislikes synthetic fabrics."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Special Tailoring or Handling Instructions
                </label>
                <input
                  type="text"
                  value={profile.specialInstructions || ''}
                  onChange={(e) => setProfile({ ...profile, specialInstructions: e.target.value })}
                  placeholder="e.g. Always keep extra margin in sleeves, prefer double stitch"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">All fields are completely optional.</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Customer Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
