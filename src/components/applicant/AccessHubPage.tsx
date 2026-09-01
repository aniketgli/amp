import React, { useState } from 'react';
import {
  ApplicantProfile,
  RequisitionRecord,
  RequisitionType,
  UserRole,
} from '../../types/requisition';
import { OFFICIAL_ROLES } from '../../data/initialData';
import { getRequisitionServiceName } from '../../utils/storage';
import { QuickApplyModal, ServiceScope } from '../forms/QuickApplyModal';
import {
  Mail,
  Wifi,
  ShieldCheck,
  Fingerprint,
  Building2,
  RotateCw,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  KeyRound,
  BadgeCheck,
  FileText,
  ArrowRight,
  Sparkles,
  Info,
  UserCheck,
  Server,
  Layers,
  Settings,
  Activity,
  Award,
  FlaskConical,
} from 'lucide-react';

interface MyAccessHubProps {
  applicantProfile: ApplicantProfile;
  currentRole?: UserRole;
  requisitions: RequisitionRecord[];
  onSelectRequisition: (req: RequisitionRecord) => void;
  onRequestNewService?: (reqType: RequisitionType, mode: 'new' | 'renewal') => void;
  onSubmitRequisition?: (req: RequisitionRecord) => void;
  onNavigateTab?: (tab: string) => void;
}

export const LAB_FACILITIES_LIST = [
  { id: 'gis', name: 'GIS & Remote Sensing Laboratory', dept: 'RS & GIS Cell', desc: 'ArcGIS Pro, QGIS, High-performance Workstations & Satellite Datasets' },
  { id: 'forensic', name: 'Wildlife Forensic Laboratory', dept: 'Forensic Wing', desc: 'DNA Sequencer, STR Profiling, Illegal Wildlife Specimen Identification' },
  { id: 'conservation_genetics', name: 'Conservation Genetics Facility', dept: 'Genetics Cell', desc: 'Real-Time PCR, NGS Analysis, Non-Invasive Fecal DNA Extraction' },
  { id: 'analytical', name: 'Analytical & Spectrophotometry Lab', dept: 'Ecology Wing', desc: 'Atomic Absorption, HPLC, UV-Vis Spectrophotometer & Soil Analysis' },
  { id: 'microscopy', name: 'Microscopy & Electron Imaging Suite', dept: 'Habitat Ecology', desc: 'Stereo Zoom Microscopes, Digital Imaging Suite & Specimen Slides' },
  { id: 'herbarium', name: 'Herbarium & Museum Specimen Lab', dept: 'Botany & Museum', desc: 'Botanical Herbarium Preservation, Plant Taxonomy & Digital Archives' },
  { id: 'bioinformatics', name: 'Bio-Informatics & Data Suite', dept: 'IT & Bio-Info', desc: 'High-Performance Compute Clusters (HPC) for Genomic Sequencing' },
  { id: 'health_toxicology', name: 'Wildlife Health & Eco-Toxicology Lab', dept: 'Health Cell', desc: 'Pathology Equipment, Chemical Residue Analysis & Disease Surveillance' },
  { id: 'uav_remote_sensing', name: 'Drone / UAV & Spatial Modelling Suite', dept: 'Geomatics Cell', desc: 'Thermal Drone Processing, LiDAR Spatial Point Clouds & Flight Logs' },
];

const formatDisplayDate = (dStr?: string) => {
  if (!dStr) return '—';
  const date = new Date(dStr);
  if (isNaN(date.getTime())) return dStr;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const MyAccessHub: React.FC<MyAccessHubProps> = ({
  applicantProfile,
  currentRole = 'applicant',
  requisitions,
  onSelectRequisition,
  onRequestNewService,
  onSubmitRequisition,
  onNavigateTab,
}) => {
  const activeRoleInfo = OFFICIAL_ROLES.find((r) => r.id === currentRole) || OFFICIAL_ROLES[0];

  // Modal State for Simple Quick Apply Form Dialog
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    serviceScope: ServiceScope;
    mode: 'new' | 'renewal';
    initialLabId?: string;
  } | null>(null);

  const handleOpenModal = (serviceScope: ServiceScope, mode: 'new' | 'renewal', initialLabId?: string) => {
    setModalConfig({
      isOpen: true,
      serviceScope,
      mode,
      initialLabId,
    });
  };

  // Filter current user's requisitions
  const userRequisitions = requisitions.filter(
    (r) =>
      r.applicant.personalEmail === applicantProfile.personalEmail ||
      r.applicant.applicantName === applicantProfile.applicantName
  );

  // Active Approved Requisitions
  const approvedReqs = userRequisitions.filter((r) => r.status === 'approved_provisioned');
  // Pending Requisitions
  const pendingReqs = userRequisitions.filter(
    (r) => r.status !== 'approved_provisioned' && r.status !== 'rejected' && r.status !== 'deactivated'
  );

  // Find specific provisioned services
  const approvedEmailReq = approvedReqs.find((r) => r.itHrmsDetails?.requestEmail);
  const pendingEmailReq = pendingReqs.find((r) => r.itHrmsDetails?.requestEmail);

  const approvedNetReq = approvedReqs.find((r) => r.itHrmsDetails?.requestInternet);
  const pendingNetReq = pendingReqs.find((r) => r.itHrmsDetails?.requestInternet);

  const approvedHrmsReq = approvedReqs.find((r) => r.itHrmsDetails?.requestHrmsPms || r.itHrmsDetails?.requestBiometric);
  const pendingHrmsReq = pendingReqs.find((r) => r.itHrmsDetails?.requestHrmsPms || r.itHrmsDetails?.requestBiometric);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 min-h-[140px]">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 pointer-events-none blur-2xl" />
        <div className="space-y-1.5 max-w-2xl min-w-0 flex-1 z-10 relative">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1 shrink-0">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Access Management Portal
            </span>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">• Wildlife Institute of India</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug sm:leading-tight break-words">
            {currentRole === 'applicant' && 'Personnel Requisition & Access Hub'}
            {currentRole === 'supervisor' && 'PI & Supervising Officer Access Management Hub'}
            {currentRole === 'lab_nodal' && 'WII Research Laboratories Nodal Operations Desk'}
            {currentRole === 'it_officer' && 'IT & Network Infrastructure Provisioning Desk'}
            {currentRole === 'hrms_officer' && 'HRMS ERP & Biometric Attendance Services Hub'}
            {currentRole === 'section_head' && 'Section Head Executive Access Oversight'}
            {currentRole === 'admin' && 'Central Security & System Access Command Center'}
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl block">
            {currentRole === 'applicant' &&
              'View active credentials, authorized service privileges, and facility passes across Wildlife Institute of India IT infrastructure and Research Laboratories.'}
            {currentRole === 'supervisor' &&
              'Monitor authorized access passes, lab allocations, and IT credentials for supervised research scholars.'}
            {currentRole === 'lab_nodal' &&
              'Manage facility schedules, instrument slots, and nodal clearances across 9 specialized Wildlife Institute research laboratories.'}
            {currentRole === 'it_officer' &&
              'Manage institutional webmail accounts (@wii.gov.in), campus Wi-Fi hardware MAC bindings, and network domain access.'}
            {currentRole === 'hrms_officer' &&
              'Control Personnel ERP accounts, biometric attendance punch IDs, and service book synchronization.'}
            {currentRole === 'section_head' &&
              'Executive oversight for division-wide access grants, compliance reviews, and departmental authorization credentials.'}
            {currentRole === 'admin' &&
              'Master central administration panel for user roles, security audit logs, and global access configuration.'}
          </p>
        </div>

        {/* Right Section Action Button */}
        <div className="flex flex-row items-center sm:flex-col sm:items-end gap-2 sm:gap-2.5 z-10 relative shrink-0 w-full sm:w-auto min-w-0">
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab('my_requests') : null}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 min-w-0 sm:w-44 text-center truncate"
          >
            <FileText className="w-4 h-4 text-white shrink-0" />
            <span className="truncate">All Requests</span>
            <ArrowRight className="w-4 h-4 text-emerald-200 ml-0.5 shrink-0" />
          </button>
        </div>
      </div>

      {/* Role Notice Banner */}
      {currentRole !== 'applicant' && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-blue-900">Official Role Mode Active: {activeRoleInfo.title}</span>
              <p className="text-blue-700 text-[11px]">
                You are viewing the Access Services Hub under <span className="font-semibold">{activeRoleInfo.title}</span> permissions. Actions and pass views are tailored for your administrative role.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal('email', 'new')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shrink-0 shadow-2xs"
          >
            Request Access Pass
          </button>
        </div>
      )}

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{approvedReqs.length}</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Active Authorized Access</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Issued & provisioned credentials</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{pendingReqs.length}</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Pending Requisitions</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">In verification approval chain</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800">
            <RotateCw className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{approvedReqs.length}</div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Eligible for Renewal</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Extend tenure for 2026–2027</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: WII EMAIL ID SERVICE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden min-w-0">
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-2xs shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">1. Official WII Email ID (@wii.gov.in)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Institute Webmail Account, Domain Access & Group Mappings</p>
            </div>
          </div>

          <div className="self-start sm:self-auto shrink-0">
            {approvedEmailReq ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-xs border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Active Service
              </span>
            ) : pendingEmailReq ? (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold rounded-full text-xs border border-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Requisition Pending
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs border border-slate-200">
                Not Provisioned
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-5 min-w-0">
          {approvedEmailReq ? (
            <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 text-xs min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Active Authorized Email Account
                </span>
                <button
                  onClick={() => handleOpenModal('email', 'renewal')}
                  className="w-full sm:w-auto px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs shrink-0"
                >
                  <RotateCw className="w-3 h-3 text-blue-600 shrink-0" />
                  Renew Email Access
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Webmail</span>
                  <span className="font-mono text-xs font-bold text-blue-700 break-all">
                    {approvedEmailReq.itHrmsDetails?.assignedWiiEmail || 'Issued by IT Cell'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Configured Groups</span>
                  <span className="text-slate-700 font-semibold">
                    {approvedEmailReq.itHrmsDetails?.assignedEmailGroups?.join(', ') || 'All Staff'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Validity Period (From - To)</span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {formatDisplayDate(approvedEmailReq.applicant.dateOfJoining || approvedEmailReq.createdAt)} → {formatDisplayDate(approvedEmailReq.applicant.validUpTo)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] pt-1 min-w-0">
                <span className="text-slate-500 font-medium">Requisition Ref: <code className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">{approvedEmailReq.id}-EML</code></span>
                <a href="https://mail.wii.gov.in" target="_blank" rel="noreferrer" className="text-blue-700 font-bold hover:underline flex items-center gap-1">
                  Open WII Webmail Portal <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : pendingEmailReq ? (
            <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" /> Email Requisition Pending Verification
                </span>
                <span className="self-start sm:self-auto px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] border border-amber-300 shrink-0">
                  Under Workflow Review
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Requisition <code className="font-mono bg-amber-100 px-1 rounded">{pendingEmailReq.id}</code> has been submitted and is currently being verified by your Supervising Officer / IT Cell.
              </p>
              <button
                onClick={() =>
                  onSelectRequisition({
                    ...pendingEmailReq,
                    selectedServiceKey: 'email',
                    selectedRefId: `${pendingEmailReq.id}-EML`,
                    selectedServiceLabel: 'Official WII Email ID',
                  })
                }
                className="text-blue-700 font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer pt-1"
              >
                View Requisition Status →
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-6 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">No Active WII Webmail Account</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5 leading-relaxed">
                  Apply for an official @wii.gov.in email address to access institutional communications, research groups, and domain resources.
                </p>
              </div>
              <button
                onClick={() => handleOpenModal('email', 'new')}
                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs transition-all cursor-pointer w-full sm:w-auto"
              >
                <PlusCircle className="w-4 h-4" />
                Apply for Official WII Email ID
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: CAMPUS INTERNET & MAC REGISTRATION */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden min-w-0">
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-2xs shrink-0">
              <Wifi className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">2. Campus Internet & Wi-Fi MAC Address Registration</h3>
              <p className="text-xs text-slate-500 mt-0.5">Device Hardware Address MAC Binding for High-Speed LAN & Campus Wi-Fi</p>
            </div>
          </div>

          <div className="self-start sm:self-auto shrink-0">
            {approvedNetReq ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-xs border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> MAC Bound
              </span>
            ) : pendingNetReq ? (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold rounded-full text-xs border border-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> MAC Registration Pending
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs border border-slate-200">
                Not Bound
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-5 min-w-0">
          {approvedNetReq ? (
            <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 text-xs min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Registered Device Hardware MAC
                </span>
                <button
                  onClick={() => handleOpenModal('mac', 'renewal')}
                  className="w-full sm:w-auto px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs shrink-0"
                >
                  <RotateCw className="w-3 h-3 text-blue-600 shrink-0" />
                  Renew Device MAC
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered Device</span>
                  <span className="font-bold text-slate-800">{approvedNetReq.itHrmsDetails?.deviceType || 'Workstation'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Verified Hardware MAC</span>
                  <code className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 break-all inline-block">
                    {approvedNetReq.itHrmsDetails?.verifiedMacAddress || approvedNetReq.itHrmsDetails?.macAddress || 'Registered'}
                  </code>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Validity Period (From - To)</span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {formatDisplayDate(approvedNetReq.applicant.dateOfJoining || approvedNetReq.createdAt)} → {formatDisplayDate(approvedNetReq.applicant.validUpTo)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] pt-1 min-w-0">
                <span className="text-slate-500 font-medium">Requisition Ref: <code className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">{approvedNetReq.id}-NET</code></span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> IT MAC Registration Verified
                </span>
              </div>
            </div>
          ) : pendingNetReq ? (
            <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" /> Campus Internet MAC Registration Pending
                </span>
                <span className="self-start sm:self-auto px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] border border-amber-300 shrink-0">
                  IT Cell Verification
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Device registration request <code className="font-mono bg-amber-100 px-1 rounded">{pendingNetReq.id}</code> is pending verification by IT Cell.
              </p>
              <button
                onClick={() =>
                  onSelectRequisition({
                    ...pendingNetReq,
                    selectedServiceKey: 'internet',
                    selectedRefId: `${pendingNetReq.id}-NET`,
                    selectedServiceLabel: 'Wi-Fi / Internet',
                  })
                }
                className="text-blue-700 font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer pt-1"
              >
                View Requisition Status →
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-6 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">No Campus Internet Device Bound</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5 leading-relaxed">
                  Register your laptop or workstation MAC hardware address to enable Wi-Fi and high-speed LAN access across WII campus.
                </p>
              </div>
              <button
                onClick={() => handleOpenModal('mac', 'new')}
                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs transition-all cursor-pointer w-full sm:w-auto"
              >
                <PlusCircle className="w-4 h-4" />
                Register MAC Hardware Device
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: BIOMETRIC & HRMS / PMS PORTAL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden min-w-0">
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 bg-purple-600 text-white rounded-lg shadow-2xs shrink-0">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">3. HRMS / PMS Portal & Biometric Attendance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Personnel Management System Portal Accounts & Biometric ID Mapping</p>
            </div>
          </div>

          <div className="self-start sm:self-auto shrink-0">
            {approvedHrmsReq ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-xs border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Active HRMS
              </span>
            ) : pendingHrmsReq ? (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold rounded-full text-xs border border-amber-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Pending Approval
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs border border-slate-200">
                Not Provisioned
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-5 min-w-0">
          {approvedHrmsReq ? (
            <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 text-xs min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Active HRMS Portal & Biometric Access
                </span>
                <button
                  onClick={() => handleOpenModal('hrms', 'renewal')}
                  className="w-full sm:w-auto px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs shrink-0"
                >
                  <RotateCw className="w-3 h-3 text-blue-600 shrink-0" />
                  Renew HRMS Access
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">ERP HRMS Portal</span>
                  <span className="font-bold text-slate-800">Account Active & Provisioned</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Biometric ID</span>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                    {approvedHrmsReq.itHrmsDetails?.assignedBiometricId || applicantProfile.biometricId || 'WII-BIO-1048'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Validity Period (From - To)</span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {formatDisplayDate(approvedHrmsReq.applicant.dateOfJoining || approvedHrmsReq.createdAt)} → {formatDisplayDate(approvedHrmsReq.applicant.validUpTo)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] pt-1 min-w-0">
                <span className="text-slate-500 font-medium">Requisition Ref: <code className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">{approvedHrmsReq.id}-HRM</code></span>
                <span className="text-purple-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> HRMS & Attendance Active
                </span>
              </div>
            </div>
          ) : pendingHrmsReq ? (
            <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" /> HRMS / Biometric Requisition Pending
                </span>
                <span className="self-start sm:self-auto px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] border border-amber-300 shrink-0 whitespace-nowrap">
                  Pending Verification
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Requisition <code className="font-mono bg-amber-100 px-1 rounded">{pendingHrmsReq.id}</code> is currently being reviewed for HRMS portal mapping and biometric punch template registration.
              </p>
              <button
                onClick={() =>
                  onSelectRequisition({
                    ...pendingHrmsReq,
                    selectedServiceKey: 'hrms',
                    selectedRefId: `${pendingHrmsReq.id}-HRM`,
                    selectedServiceLabel: 'HRMS / PMS Portal',
                  })
                }
                className="text-blue-700 font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer pt-1"
              >
                View Requisition Status →
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-6 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-200">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">No Active HRMS / Biometric Access</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5 leading-relaxed">
                  Apply for HRMS / PMS ERP portal access and Biometric Attendance registration for daily Institute duty logs.
                </p>
              </div>
              <button
                onClick={() => handleOpenModal('hrms', 'new')}
                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs transition-all cursor-pointer w-full sm:w-auto"
              >
                <PlusCircle className="w-4 h-4" />
                Apply for HRMS & Biometric ID
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: RESEARCH LABORATORY FACILITIES */}
      {(() => {
        const labRequisitions = userRequisitions.filter(
          (r) => r.type === 'LAB_FACILITY' || (r.labAccessDetails && r.labAccessDetails.some((l) => l.selected))
        );

        const activeLabCount = labRequisitions.filter((r) => r.status === 'approved_provisioned').length;
        const pendingLabCount = labRequisitions.filter((r) => r.status !== 'approved_provisioned' && r.status !== 'rejected').length;

        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden min-w-0">
            <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
              <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="p-2 bg-teal-600 text-white rounded-lg shadow-2xs shrink-0">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    4. WII Research Laboratory Access Facilities
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Equipment Usage Authorization & Nodal Approvals across 9 Specialized Research Labs
                  </p>
                </div>
              </div>

              <div className="self-start sm:self-auto shrink-0 flex flex-wrap items-center gap-2">
                {activeLabCount > 0 ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-full text-xs border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {activeLabCount} Active Lab Access
                  </span>
                ) : pendingLabCount > 0 ? (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-extrabold rounded-full text-xs border border-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Requisition Pending
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-full text-xs border border-slate-200">
                    Not Provisioned
                  </span>
                )}

                {labRequisitions.length > 0 && (
                  <button
                    onClick={() => handleOpenModal('lab', 'new')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Apply Additional Lab
                  </button>
                )}
              </div>
            </div>

            <div className="p-3.5 sm:p-5 space-y-4 min-w-0">
              {labRequisitions.length === 0 ? (
                <div className="p-4 sm:p-6 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-200">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">No Active Research Laboratory Access</div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5 leading-relaxed">
                      Apply for equipment usage authorization across specialized WII research labs (GIS & Remote Sensing, Wildlife Forensics, Conservation Genetics, Analytical Suite, etc.).
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenModal('lab', 'new')}
                    className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs transition-all cursor-pointer w-full sm:w-auto"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Apply for Research Laboratory Access
                  </button>
                </div>
              ) : (
                labRequisitions.map((req, idx) => {
                  const selectedLabs = req.labAccessDetails?.filter((l) => l.selected) || [];
                  const firstLab = selectedLabs[0];
                  const labNames = selectedLabs.length > 0
                    ? selectedLabs.map((l) => l.labName).join(', ')
                    : 'Research Laboratory Access';

                  if (req.status === 'approved_provisioned') {
                    return (
                      <div key={`${req.id}-${idx}`} className="p-3.5 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3 text-xs min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Active Authorized Laboratory Access
                          </span>
                          <div>
                            <button
                              onClick={() => handleOpenModal('lab', 'renewal', firstLab?.labId)}
                              className="w-full sm:w-auto px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-700 border border-blue-300 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs shrink-0"
                            >
                              <RotateCw className="w-3 h-3 text-blue-600 shrink-0" />
                              Renew Lab Access
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Authorized Laboratory</span>
                            <span className="font-bold text-slate-900">{labNames}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Nodal Officer</span>
                            <span className="text-slate-800 font-semibold">
                              {firstLab?.nodalOfficerName || 'Assigned Nodal Cell'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Validity Period (From - To)</span>
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {formatDisplayDate(firstLab?.fromDate || req.applicant.dateOfJoining || req.createdAt)} → {formatDisplayDate(firstLab?.toDate || req.applicant.validUpTo)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] pt-1 min-w-0">
                          <span className="text-slate-500 font-medium">Requisition Ref: <code className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">{req.id}-LAB</code></span>
                          <button
                            onClick={() =>
                              onSelectRequisition({
                                ...req,
                                selectedServiceKey: 'lab',
                                selectedRefId: `${req.id}-LAB`,
                                selectedServiceLabel: labNames || 'Research Lab Access',
                              })
                            }
                            className="text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            View Requisition Status →
                          </button>
                        </div>
                      </div>
                    );
                  } else if (req.status === 'rejected') {
                    return (
                      <div key={`${req.id}-${idx}`} className="p-3.5 sm:p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2 text-xs min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                          <span className="font-bold text-red-900 flex items-center gap-1.5 min-w-0">
                            <XCircle className="w-4 h-4 text-red-600 shrink-0" /> Lab Access Requisition Rejected
                          </span>
                          <span className="self-start sm:self-auto px-2.5 py-0.5 bg-red-100 text-red-800 font-bold rounded-full text-[10px] border border-red-300 shrink-0 whitespace-nowrap">
                            Rejected
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Requisition <code className="font-mono bg-red-100 px-1 rounded">{req.id}</code> for <span className="font-semibold">{labNames}</span> was rejected.
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] pt-1 min-w-0">
                          <span className="text-slate-500 font-medium">Requisition Ref: <code className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">{req.id}-LAB</code></span>
                          <button
                            onClick={() =>
                              onSelectRequisition({
                                ...req,
                                selectedServiceKey: 'lab',
                                selectedRefId: `${req.id}-LAB`,
                                selectedServiceLabel: labNames || 'Research Lab Access',
                              })
                            }
                            className="text-blue-700 font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            View Requisition Details →
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={`${req.id}-${idx}`} className="p-3.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2 text-xs min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5 min-w-0">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" /> Lab Access Requisition Pending Verification
                          </span>
                          <span className="self-start sm:self-auto px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] border border-amber-300 shrink-0 whitespace-nowrap">
                            Under Workflow Review
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Requisition <code className="font-mono bg-amber-100 px-1 rounded">{req.id}</code> for <span className="font-semibold">{labNames}</span> has been submitted and is currently being verified by your Supervising Officer / Nodal Officer.
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] pt-1 min-w-0">
                          <span className="text-slate-500 font-medium">Requisition Ref: <code className="font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800">{req.id}-LAB</code></span>
                          <button
                            onClick={() =>
                              onSelectRequisition({
                                ...req,
                                selectedServiceKey: 'lab',
                                selectedRefId: `${req.id}-LAB`,
                                selectedServiceLabel: labNames || 'Research Lab Access',
                              })
                            }
                            className="text-blue-700 font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            View Requisition Status →
                          </button>
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* QUICK APPLY DIALOG MODAL OVERLAY */}
      {modalConfig && modalConfig.isOpen && (
        <QuickApplyModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig(null)}
          serviceScope={modalConfig.serviceScope}
          mode={modalConfig.mode}
          initialLabId={modalConfig.initialLabId}
          applicantProfile={applicantProfile}
          existingRequisitions={userRequisitions}
          onSubmitRequisition={(newReq) => {
            if (onSubmitRequisition) {
              onSubmitRequisition(newReq);
            }
            setModalConfig(null);
          }}
        />
      )}
    </div>
  );
};
