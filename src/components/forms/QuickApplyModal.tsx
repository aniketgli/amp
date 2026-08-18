import React, { useState, useEffect } from 'react';
import {
  ApplicantProfile,
  FacilityMasterItem,
  ITHrmsDetails,
  LabFacilitySelection,
  RequisitionRecord,
  RequisitionType,
} from '../../types/requisition';
import { generateRequisitionId, getStoredFacilities, findFacility } from '../../utils/storage';
import {
  X,
  Send,
  Mail,
  Wifi,
  Fingerprint,
  Building2,
  RotateCw,
  PlusCircle,
  CheckCircle2,
  ShieldCheck,
  FileText,
  BadgeCheck,
  User,
  Building,
  CheckSquare,
  Info,
} from 'lucide-react';

export type ServiceScope = 'email' | 'mac' | 'hrms' | 'lab' | 'combined';

interface QuickApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceScope: ServiceScope;
  mode: 'new' | 'renewal';
  initialLabId?: string;
  applicantProfile: ApplicantProfile;
  existingRequisitions?: RequisitionRecord[];
  onSubmitRequisition: (requisition: RequisitionRecord) => void;
}

export const QuickApplyModal: React.FC<QuickApplyModalProps> = ({
  isOpen,
  onClose,
  serviceScope,
  mode,
  initialLabId,
  applicantProfile,
  existingRequisitions = [],
  onSubmitRequisition,
}) => {
  if (!isOpen) return null;

  // Facilities list from storage
  const [facilities, setFacilities] = useState<FacilityMasterItem[]>(() =>
    getStoredFacilities().filter((f) => f.status === 'active')
  );

  useEffect(() => {
    const handleUpdate = () => {
      setFacilities(getStoredFacilities().filter((f) => f.status === 'active'));
    };
    window.addEventListener('wii_masters_updated', handleUpdate);
    return () => window.removeEventListener('wii_masters_updated', handleUpdate);
  }, []);

  // Derive initial RequisitionType based on scope
  const derivedReqType: RequisitionType =
    serviceScope === 'lab'
      ? 'LAB_FACILITY'
      : serviceScope === 'combined'
      ? 'COMBINED'
      : 'IT_HRMS';

  // Form state
  const [renewalReason, setRenewalReason] = useState<string>(
    mode === 'renewal' ? 'Requesting extension for active project tenure 2026-2027' : ''
  );

  // Email state
  const [requestedEmailPrefix, setRequestedEmailPrefix] = useState<string>(
    applicantProfile.applicantName
      ? applicantProfile.applicantName.toLowerCase().replace(/\s+/g, '.')
      : 'ananya.sharma'
  );
  const [selectedGroups, setSelectedGroups] = useState<string[]>([
    'All Staff',
    'Researchers & Fellows',
  ]);

  // MAC State
  const [deviceType, setDeviceType] = useState<string>('Laptop Workstation');
  const [macAddress, setMacAddress] = useState<string>('3C:D9:2B:1A:0F:8E');

  // HRMS State
  const [reqHrms, setReqHrms] = useState<boolean>(true);
  const [reqBio, setReqBio] = useState<boolean>(true);

  // Lab State
  const [selectedLabId, setSelectedLabId] = useState<string>(() => {
    if (initialLabId) return initialLabId;
    const activeFacs = getStoredFacilities().filter((f) => f.status === 'active');
    return activeFacs[0]?.id || 'FAC-01';
  });
  const [fromDate, setFromDate] = useState<string>('2026-09-01');
  const [toDate, setToDate] = useState<string>('2027-08-31');
  const [researchPurpose, setResearchPurpose] = useState<string>(
    'Spatial modeling, ecological sample analysis and research data computing for assigned project'
  );
  const [hasBiometricId, setHasBiometricId] = useState<'yes' | 'no'>(
    applicantProfile.biometricId ? 'yes' : 'no'
  );
  const [biometricIdNum, setBiometricIdNum] = useState<string>(
    applicantProfile.biometricId || 'WII-BIO-1048'
  );

  // Signature & Declaration
  const [digitalSignature, setDigitalSignature] = useState<string>(
    applicantProfile.applicantName
  );
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!declarationAccepted) {
      alert('Please check the official declaration box to proceed.');
      return;
    }

    const newId = generateRequisitionId(existingRequisitions);
    const now = new Date().toISOString();

    // Prepare IT HRMS Details
    let itHrmsDetails: ITHrmsDetails | undefined = undefined;
    if (serviceScope !== 'lab' || hasBiometricId === 'no') {
      itHrmsDetails = {
        requisitionMode: mode,
        renewalReason: mode === 'renewal' ? renewalReason : undefined,
        requestEmail: serviceScope === 'email' || serviceScope === 'combined',
        requestedEmailGroups: selectedGroups,
        requestInternet: serviceScope === 'mac' || serviceScope === 'combined',
        deviceType,
        macAddress,
        requestHrmsPms: (reqHrms && (serviceScope === 'hrms' || serviceScope === 'combined')) || (serviceScope === 'lab' && hasBiometricId === 'no'),
        requestBiometric: (reqBio && (serviceScope === 'hrms' || serviceScope === 'combined')) || (serviceScope === 'lab' && hasBiometricId === 'no'),
        assignedBiometricId: hasBiometricId === 'yes' ? biometricIdNum : undefined,
      };
    }

    // Prepare Lab Access Details
    let labAccessDetails: LabFacilitySelection[] | undefined = undefined;
    if (serviceScope === 'lab' || serviceScope === 'combined') {
      const chosenLab = facilities.find((l) => l.id === selectedLabId) || findFacility(selectedLabId) || facilities[0];
      labAccessDetails = [
        {
          labId: chosenLab?.id || selectedLabId,
          labName: chosenLab?.name || 'Research Laboratory Access',
          selected: true,
          purposeEquipment: researchPurpose || chosenLab?.desc || 'Research equipment & instrument access',
          fromDate,
          toDate,
          hasBiometricId: hasBiometricId === 'yes',
          biometricIdNumber: hasBiometricId === 'yes' ? biometricIdNum : undefined,
          nodalApprovalStatus: 'pending',
          nodalOfficerName: chosenLab?.nodal || 'Dr. S. K. Gupta',
        },
      ];
    }

    const chosenLabInfo = facilities.find((l) => l.id === selectedLabId) || findFacility(selectedLabId);
    const titleService =
      serviceScope === 'email'
        ? 'Official WII Email ID'
        : serviceScope === 'mac'
        ? 'Campus Internet MAC Registration'
        : serviceScope === 'hrms'
        ? 'HRMS & Biometric Access'
        : serviceScope === 'lab'
        ? `Research Lab Pass (${chosenLabInfo?.name || 'Lab'})`
        : 'Combined Access & Facilities';

    const newRequisition: RequisitionRecord = {
      id: newId,
      type: derivedReqType,
      status: 'submitted_pending_pi',
      createdAt: now,
      updatedAt: now,
      applicant: { ...applicantProfile },
      itHrmsDetails,
      labAccessDetails,
      history: [
        {
          id: `h_${Date.now()}`,
          actorRole: 'applicant',
          actorName: applicantProfile.applicantName,
          actionType: 'submit',
          comments: `Requisition submitted electronically for ${titleService} (${mode.toUpperCase()} mode). Pending Supervising Officer / PI (${applicantProfile.supervisingOfficerName}) approval.`,
          timestamp: now,
          digitalSignature,
        },
      ],
    };

    onSubmitRequisition(newRequisition);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 min-w-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
              {serviceScope === 'email' && <Mail className="w-5 h-5" />}
              {serviceScope === 'mac' && <Wifi className="w-5 h-5" />}
              {serviceScope === 'hrms' && <Fingerprint className="w-5 h-5" />}
              {serviceScope === 'lab' && <Building2 className="w-5 h-5" />}
              {serviceScope === 'combined' && <ShieldCheck className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-white leading-tight truncate">
                  {serviceScope === 'email' && 'Apply Official WII Email ID'}
                  {serviceScope === 'mac' && 'Register Campus Internet MAC'}
                  {serviceScope === 'hrms' && 'Apply HRMS & Biometric Access'}
                  {serviceScope === 'lab' && 'Research Laboratory Access Pass'}
                  {serviceScope === 'combined' && 'Combined Access Application'}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                    mode === 'renewal'
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-emerald-400 text-slate-900'
                  }`}
                >
                  {mode === 'renewal' ? 'Renewal / Extension' : 'Fresh Application'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">Wildlife Institute of India • Access Application Form</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 min-w-0">
          {/* Applicant & PI Info Summary (Auto Filled) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 text-xs min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" /> Applicant Identity
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Verified Profile
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-700 dark:text-slate-300">
              <div className="space-y-0.5 min-w-0">
                <span className="text-slate-400 dark:text-slate-500 block text-[9px] font-bold uppercase tracking-wider">Name & Designation</span>
                <span className="font-extrabold text-slate-900 dark:text-white block truncate">{applicantProfile.applicantName}</span>
                <span className="text-slate-600 dark:text-slate-400 block truncate">{applicantProfile.designation}</span>
                <div className="pt-1 mt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1 text-[10px]">
                  <span className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[9px]">Valid Up To:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{applicantProfile.validUpTo || '31-Jan-2028'}</span>
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-slate-400 dark:text-slate-500 block text-[9px] font-bold uppercase tracking-wider">Project / Dept / Cell & Reporting Officer / PI</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{applicantProfile.departmentCellProject}</span>
                <span className="font-extrabold text-blue-900 dark:text-blue-300 block truncate">{applicantProfile.supervisingOfficerName}</span>
              </div>
            </div>
          </div>

          {/* RENEWAL REASON IF RENEWAL MODE */}
          {mode === 'renewal' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                Reason for Access Extension / Renewal *
              </label>
              <textarea
                required
                rows={2}
                value={renewalReason}
                onChange={(e) => setRenewalReason(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
                placeholder="Specify active research project extension or tenure dates..."
              />
            </div>
          )}

          {/* SCOPE SPECIFIC FIELDS */}

          {/* 1. EMAIL FIELDS */}
          {(serviceScope === 'email' || serviceScope === 'combined') && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Mail className="w-4 h-4 text-blue-600" />
                Official WII Email ID Preferences (@wii.gov.in)
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Requested Email Address Prefix *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      required
                      value={requestedEmailPrefix}
                      onChange={(e) => setRequestedEmailPrefix(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 font-mono text-slate-900"
                    />
                    <span className="bg-slate-200 text-slate-700 font-mono font-bold text-xs px-3 py-2 border border-l-0 border-slate-300 rounded-r-lg">
                      @wii.gov.in
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CAMPUS INTERNET MAC FIELDS */}
          {(serviceScope === 'mac' || serviceScope === 'combined') && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Wifi className="w-4 h-4 text-emerald-600" />
                Campus Wi-Fi & LAN Device MAC Binding
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hardware Device Type *
                  </label>
                  <select
                    value={deviceType}
                    onChange={(e) => setDeviceType(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="Laptop Workstation">Laptop Workstation</option>
                    <option value="Desktop Computer">Desktop Computer</option>
                    <option value="Mobile / Smartphone">Mobile / Smartphone</option>
                    <option value="Tablet / iPad">Tablet / iPad</option>
                    <option value="Research Instrument PC">Research Instrument PC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Physical MAC Hardware Address *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value.toUpperCase())}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 text-slate-900"
                    placeholder="3C:D9:2B:1A:0F:8E"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Format: XX:XX:XX:XX:XX:XX</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Note:</strong> Maximum concurrent login limit is restricted to <strong>2 devices</strong> per user.</span>
              </div>
            </div>
          )}

          {/* 3. HRMS & BIOMETRIC FIELDS */}
          {(serviceScope === 'hrms' || serviceScope === 'combined') && (
            <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <Fingerprint className="w-4 h-4 text-purple-600" />
                HRMS Portal & Biometric Punch Registration
              </div>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={reqHrms}
                    onChange={(e) => setReqHrms(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">HRMS / PMS ERP Portal Account</span>
                    <span className="text-[10px] text-slate-500">Access duty slips, leave applications & project logs</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={reqBio}
                    onChange={(e) => setReqBio(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Biometric ID Attendance Template Registration</span>
                    <span className="text-[10px] text-slate-500">Fingerprint & Gate Pass Mapping at Main Gate & Admin Block</span>
                  </div>
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-900 mt-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Note:</strong> When your requisition status reaches the <strong>Manager stage</strong>, please visit the <strong>IT Cell in person</strong> for Face Registration & Biometric Enrollment.</span>
              </div>
            </div>
          )}

          {/* 4. RESEARCH LAB PASS FIELDS */}
          {(serviceScope === 'lab' || serviceScope === 'combined') && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <Building2 className="w-4 h-4 text-emerald-600" />
                Select Research Laboratory Facility
              </div>

              <div className="space-y-3 text-xs">
                {/* BIOMETRIC ID VERIFICATION FIELD */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Do you already have a registered Biometric ID? *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setHasBiometricId('yes')}
                      className={`p-2.5 rounded-lg border font-semibold flex items-center justify-start sm:justify-center gap-2 transition-all cursor-pointer ${
                        hasBiometricId === 'yes'
                          ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500/30'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="biometric_check_modal"
                        checked={hasBiometricId === 'yes'}
                        onChange={() => setHasBiometricId('yes')}
                        className="text-blue-600 shrink-0"
                      />
                      <span className="text-xs">Yes, I have Biometric ID</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHasBiometricId('no')}
                      className={`p-2.5 rounded-lg border font-semibold flex items-center justify-start sm:justify-center gap-2 transition-all cursor-pointer ${
                        hasBiometricId === 'no'
                          ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500/30'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="biometric_check_modal"
                        checked={hasBiometricId === 'no'}
                        onChange={() => setHasBiometricId('no')}
                        className="text-amber-600 shrink-0"
                      />
                      <span className="text-xs">No, Biometric ID not created</span>
                    </button>
                  </div>

                  {hasBiometricId === 'yes' ? (
                    <div className="pt-1 animate-fade-in">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Biometric ID Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={biometricIdNum}
                        onChange={(e) => setBiometricIdNum(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-800"
                        placeholder="e.g. WII-BIO-1048"
                      />
                    </div>
                  ) : (
                    <div className="pt-1 animate-fade-in">
                      <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-purple-950">
                          <Fingerprint className="w-4 h-4 text-purple-600 shrink-0" />
                          HRMS / PMS & Biometric Attendance Registration Required
                        </div>
                        <p className="text-[11px] text-purple-800 leading-relaxed">
                          Since you do not have a Biometric ID yet, an <strong>HRMS / PMS Portal & Biometric Attendance Registration</strong> request will be automatically attached to this requisition so your official Biometric ID can be generated.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Target Research Laboratory *
                  </label>
                  <select
                    value={selectedLabId}
                    onChange={(e) => setSelectedLabId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-semibold bg-white dark:bg-slate-800"
                  >
                    {facilities.map((lab) => {
                      const existingReq = existingRequisitions?.find((r) =>
                        r.status !== 'rejected' &&
                        r.status !== 'deactivated' &&
                        r.labAccessDetails?.some((l) => (l.labId === lab.id || l.labName === lab.name) && l.selected)
                      );
                      const isApproved = existingReq?.status === 'approved_provisioned';
                      const isPending = existingReq && !isApproved;
                      const isDisabled = mode === 'new' && (isApproved || isPending);

                      let suffix = '';
                      if (isApproved) {
                        suffix = ' — [ACCESS ACTIVE / GRANTED]';
                      } else if (isPending) {
                        suffix = ' — [REQUISITION PENDING REVIEW]';
                      }

                      return (
                        <option
                          key={lab.id}
                          value={lab.id}
                          disabled={isDisabled}
                          className={isDisabled ? 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 italic font-normal' : 'text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 font-semibold'}
                        >
                          {lab.name} ({lab.dept || 'Facility'}){suffix}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Note: Laboratories with existing active access or pending requisitions are disabled in the dropdown to avoid duplicate applications.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Requested From Date *</label>
                    <input
                      type="date"
                      required
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Requested To Date *</label>
                    <input
                      type="date"
                      required
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Brief Equipment / Research Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    value={researchPurpose}
                    onChange={(e) => setResearchPurpose(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-800"
                    placeholder="Specify equipment usage or sample processing..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* DIGITAL SIGNATURE & DECLARATION */}
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl space-y-3 text-xs">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-800 focus:ring-emerald-400 mt-0.5"
              />
              <span className="text-[11px] leading-relaxed text-slate-300">
                I hereby declare that the requested facilities will be utilized strictly for authorized WII research / official duties under the supervision of <strong>{applicantProfile.supervisingOfficerName}</strong>.
              </span>
            </label>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Applicant Electronic Signature *
              </label>
              <input
                type="text"
                required
                value={digitalSignature}
                onChange={(e) => setDigitalSignature(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-serif focus:ring-2 focus:ring-blue-500"
                placeholder="Full Legal Name"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 shrink-0" />
              Submit Access Request Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
