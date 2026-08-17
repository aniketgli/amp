import React, { useState } from 'react';
import { RequisitionRecord, UserRole } from '../../types/requisition';
import { OFFICIAL_ROLES } from '../../data/initialData';
import { getRequisitionServiceName } from '../../utils/storage';
import { ApprovalActionModal } from '../workflow/ApprovalActionModal';
import {
  Clock,
  CheckCircle2,
  PlusCircle,
  FileText,
  PhoneCall,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  BadgeCheck,
  Building2,
  RotateCw,
  KeyRound,
  Mail,
  Wifi,
  Fingerprint,
  FlaskConical,
  ChevronRight,
  Check,
  AlertCircle,
  SlidersHorizontal,
  Layers,
  Users,
  Briefcase,
  ShieldAlert,
  Server,
  Award,
} from 'lucide-react';

interface OverviewDashboardProps {
  requisitions: RequisitionRecord[];
  currentRole: UserRole;
  onNavigateTab: (tab: 'dashboard' | 'profile' | 'my_requests' | 'new_request' | 'approval_queue' | 'helpdesk' | 'super_admin_panel') => void;
  onSelectRequisition: (req: RequisitionRecord) => void;
  onUpdateRequisition: (req: RequisitionRecord) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  requisitions,
  currentRole,
  onNavigateTab,
  onSelectRequisition,
  onUpdateRequisition,
}) => {
  const [selectedForAction, setSelectedForAction] = useState<RequisitionRecord | null>(null);

  const activeRoleInfo = OFFICIAL_ROLES.find((r) => r.id === currentRole) || OFFICIAL_ROLES[0];

  // Logic to get pending items for the active role
  const rolePendingList = requisitions.filter((req) => {
    if (req.status === 'rejected' || req.status === 'approved_provisioned' || req.status === 'deactivated') {
      return false;
    }
    if (currentRole === 'admin' || currentRole === 'super_admin') return true;
    if (currentRole === 'supervisor') return req.status === 'submitted_pending_pi' || req.piApproval?.status === 'pending';
    if (currentRole === 'lab_nodal' || currentRole === 'assoc_lab_nodal') {
      return (
        req.status === 'in_lab_review' &&
        req.labAccessDetails &&
        req.labAccessDetails.some((l) => l.selected && l.nodalApprovalStatus === 'pending')
      );
    }
    if (currentRole === 'section_head') return req.status === 'pending_section_head';
    if (currentRole === 'it_officer') {
      return (
        req.status === 'in_tech_verification' &&
        (!req.itCellVerification?.emailNetOfficer || req.itCellVerification.emailNetOfficer.status === 'pending')
      );
    }
    if (currentRole === 'hrms_officer') {
      return (
        req.status === 'in_tech_verification' &&
        Boolean(req.itHrmsDetails?.requestHrmsPms) &&
        (!req.itCellVerification?.hrmsOfficer || req.itCellVerification.hrmsOfficer.status === 'pending')
      );
    }
    return false;
  });

  // Calculate General Metrics
  const totalCount = requisitions.length;
  const approvedCount = requisitions.filter((r) => r.status === 'approved_provisioned').length;
  const pendingCount = requisitions.filter(
    (r) => r.status !== 'approved_provisioned' && r.status !== 'rejected' && r.status !== 'deactivated'
  ).length;

  const emailsIssued = requisitions.filter((r) => r.itHrmsDetails?.assignedWiiEmail).length;
  const macsRegistered = requisitions.filter((r) => r.itHrmsDetails?.verifiedMacAddress).length;

  const latestApprovedEmail = requisitions.find(
    (r) => r.status === 'approved_provisioned' && r.itHrmsDetails?.assignedWiiEmail
  );
  const latestApprovedMac = requisitions.find(
    (r) => r.status === 'approved_provisioned' && r.itHrmsDetails?.verifiedMacAddress
  );
  const latestApprovedHrms = requisitions.find(
    (r) => r.status === 'approved_provisioned' && r.itHrmsDetails?.hrmsAccessGranted
  );
  const activeLabCount = requisitions.reduce((acc, r) => {
    if (r.status === 'approved_provisioned' && r.labAccessDetails) {
      const count = r.labAccessDetails.filter((l) => l.selected && l.nodalApprovalStatus === 'approved').length;
      return acc + count;
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner - Standardized Uniform Layout */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 min-h-[140px]">
        {/* Ambient subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 pointer-events-none blur-2xl" />

        <div className="space-y-1.5 z-10 relative max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Access Management Portal
            </span>
            <span className="text-xs text-slate-400">• Wildlife Institute of India</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {currentRole === 'applicant' && 'Personnel Requisition & Access Hub'}
            {currentRole === 'supervisor' && 'PI & Supervising Officer Desk'}
            {currentRole === 'lab_nodal' && 'Research Labs - Nodal Facility Desk'}
            {currentRole === 'section_head' && 'Section Head IT Cell - Executive Hub'}
            {currentRole === 'it_officer' && 'Network & Email Provisioning Desk'}
            {currentRole === 'hrms_officer' && 'HRMS & Biometric ERP Desk'}
            {currentRole === 'admin' && 'Master Requisition Control Panel'}
            {currentRole === 'super_admin' && 'Directorate Master Governance Desk'}
          </h1>

          <p className="text-xs text-slate-300 truncate max-w-xl block">
            {currentRole === 'applicant' && 'Submit and track official WII email IDs, campus Wi-Fi MACs, and lab access permissions.'}
            {currentRole === 'supervisor' && 'Review and endorse fellow requisitions and research facility access requests.'}
            {(currentRole === 'lab_nodal' || currentRole === 'assoc_lab_nodal') && 'Authorize access for specialized analytical research laboratories.'}
            {currentRole === 'section_head' && 'Executive clearance desk for IT credentials and biometric security accounts.'}
            {(currentRole === 'it_officer' || currentRole === 'hrms_officer') && 'Provision @wii.gov.in emails, MAC bindings, and HRMS ERP credentials.'}
            {currentRole === 'admin' && 'Administrative overview of system workflows, metrics, and approvals.'}
            {currentRole === 'super_admin' && 'Root governance console for live role assignments, fields, and overrides.'}
          </p>
        </div>

        {/* Role Action Buttons - Standardized Right Section */}
        <div className="flex flex-wrap items-center gap-3 z-10 relative shrink-0">
          {currentRole === 'applicant' && (
            <>
              <button
                onClick={() => onNavigateTab('new_request')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                Apply New Service
              </button>
              <button
                onClick={() => onNavigateTab('my_requests')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                My Applications ({requisitions.length})
              </button>
            </>
          )}

          {currentRole === 'supervisor' && (
            <>
              <button
                onClick={() => onNavigateTab('my_requests')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                Fellow Endorsements {rolePendingList.length > 0 && `(${rolePendingList.length})`}
              </button>
              <button
                onClick={() => onNavigateTab('new_request')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                New Access
              </button>
            </>
          )}

          {(currentRole === 'lab_nodal' || currentRole === 'assoc_lab_nodal') && (
            <>
              <button
                onClick={() => onNavigateTab('my_requests')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <FlaskConical className="w-4 h-4" />
                Lab Access Desk {rolePendingList.length > 0 && `(${rolePendingList.length})`}
              </button>
              <button
                onClick={() => onNavigateTab('new_request')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                New Access
              </button>
            </>
          )}

          {currentRole === 'section_head' && (
            <>
              <button
                onClick={() => onNavigateTab('my_requests')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                Executive Queue {rolePendingList.length > 0 && `(${rolePendingList.length})`}
              </button>
              <button
                onClick={() => onNavigateTab('new_request')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                New Access
              </button>
            </>
          )}

          {(currentRole === 'it_officer' || currentRole === 'hrms_officer') && (
            <>
              <button
                onClick={() => onNavigateTab('my_requests')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <Server className="w-4 h-4" />
                Provisioning Queue {rolePendingList.length > 0 && `(${rolePendingList.length})`}
              </button>
              <button
                onClick={() => onNavigateTab('new_request')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                New Access
              </button>
            </>
          )}

          {currentRole === 'admin' && (
            <>
              <button
                onClick={() => onNavigateTab('my_requests')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <FileText className="w-4 h-4" />
                All Requisitions ({requisitions.length})
              </button>
              <button
                onClick={() => onNavigateTab('super_admin_panel')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                Master Control
              </button>
            </>
          )}

          {currentRole === 'super_admin' && (
            <>
              <button
                onClick={() => onNavigateTab('super_admin_panel')}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Master Governance
              </button>
              <button
                onClick={() => onNavigateTab('my_requests')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                All Requisitions ({requisitions.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAILORED ROLE KPI METRICS */}
      {currentRole === 'applicant' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase">
              <span>My Total Submissions</span>
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Submitted Applications</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase">
              <span>Under Verification</span>
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">{pendingCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Under Officer Review</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-[11px] font-bold uppercase">
              <span>Approved & Active</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{approvedCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Issued Credentials</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 text-[11px] font-bold uppercase">
              <span>Active Facilities</span>
              <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">{emailsIssued + activeLabCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{emailsIssued} Email, {activeLabCount} Labs</p>
          </div>
        </div>
      )}

      {currentRole === 'supervisor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold uppercase">
              <span>Pending PI Endorsements</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-3xl font-extrabold text-amber-700">{rolePendingList.length}</p>
            <p className="text-xs text-amber-900 font-medium">Awaiting Dr. R. K. Singh Sign</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
              <span>Supervised Fellows</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{requisitions.length}</p>
            <p className="text-xs text-slate-500">Active Research Staff</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase">
              <span>Endorsed & Forwarded</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">
              {requisitions.filter((r) => r.piApproval?.status === 'approved').length}
            </p>
            <p className="text-xs text-slate-500">PI Signed Requisitions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-blue-700 text-[11px] font-bold uppercase">
              <span>Active Lab Projects</span>
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-blue-600">3 Projects</p>
            <p className="text-xs text-slate-500">Tiger & Elephant Cell</p>
          </div>
        </div>
      )}

      {(currentRole === 'lab_nodal' || currentRole === 'assoc_lab_nodal') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold uppercase">
              <span>Pending Lab Clearances</span>
              <FlaskConical className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-3xl font-extrabold text-amber-700">{rolePendingList.length}</p>
            <p className="text-xs text-amber-900 font-medium">Awaiting Dr. S. K. Gupta Approval</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
              <span>Total Lab Applications</span>
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {requisitions.filter((r) => r.labAccessDetails && r.labAccessDetails.length > 0).length}
            </p>
            <p className="text-xs text-slate-500">Research Facility Requests</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase">
              <span>Cleared Facilities</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">{activeLabCount}</p>
            <p className="text-xs text-slate-500">Nodal Permits Issued</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-blue-700 text-[11px] font-bold uppercase">
              <span>Active Laboratories</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-blue-600">4 Labs</p>
            <p className="text-xs text-slate-500">Forensics, GIS, Isotope, Health</p>
          </div>
        </div>
      )}

      {currentRole === 'section_head' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-rose-50/80 p-5 rounded-2xl border border-rose-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-rose-800 text-[11px] font-bold uppercase">
              <span>Pending Section Authorizations</span>
              <ShieldCheck className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-3xl font-extrabold text-rose-700">{rolePendingList.length}</p>
            <p className="text-xs text-rose-900 font-medium">Awaiting Dr. Panna Lal Sign</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
              <span>Authorized Requisitions</span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">
              {requisitions.filter((r) => r.sectionHeadApproval?.status === 'approved').length}
            </p>
            <p className="text-xs text-slate-500">Institute Sign-offs Issued</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase">
              <span>Active Credentials Issued</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">{approvedCount}</p>
            <p className="text-xs text-slate-500">Fully Provisioned</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-600 text-[11px] font-bold uppercase">
              <span>Security Compliance</span>
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">100%</p>
            <p className="text-xs text-slate-500">Verified Credentials</p>
          </div>
        </div>
      )}

      {(currentRole === 'it_officer' || currentRole === 'hrms_officer') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-blue-800 text-[11px] font-bold uppercase">
              <span>Pending Provisioning Jobs</span>
              <Server className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-blue-700">{rolePendingList.length}</p>
            <p className="text-xs text-blue-900 font-medium">Ready for Technical Action</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
              <span>Emails Assigned</span>
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{emailsIssued}</p>
            <p className="text-xs text-slate-500">@wii.gov.in Accounts</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase">
              <span>MAC IP Filter Bound</span>
              <Wifi className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">{macsRegistered}</p>
            <p className="text-xs text-slate-500">Device Hardware Addresses</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-purple-700 text-[11px] font-bold uppercase">
              <span>HRMS ERP Active</span>
              <Fingerprint className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-3xl font-extrabold text-purple-600">
              {requisitions.filter((r) => r.itHrmsDetails?.hrmsAccessGranted).length}
            </p>
            <p className="text-xs text-slate-500">Portal Accounts</p>
          </div>
        </div>
      )}

      {currentRole === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase">
              <span>Master Total Requests</span>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{totalCount}</p>
            <p className="text-xs text-slate-400">All Requisitions</p>
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold uppercase">
              <span>System Action Pending</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-3xl font-extrabold text-amber-700">{rolePendingList.length}</p>
            <p className="text-xs text-slate-600">In Workflow Stages</p>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase">
              <span>Active & Provisioned</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-700">{approvedCount}</p>
            <p className="text-xs text-slate-600">Live Accounts</p>
          </div>

          <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-purple-800 text-[11px] font-bold uppercase">
              <span>Admin Override Ready</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-3xl font-extrabold text-purple-700">Full Access</p>
            <p className="text-xs text-slate-600">Cross-Stage Control</p>
          </div>
        </div>
      )}

      {currentRole === 'super_admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950 text-white p-5 rounded-2xl border border-amber-500/40 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-amber-400 text-[11px] font-bold uppercase">
              <span>Tier-0 Governance</span>
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <p className="text-3xl font-extrabold text-white">Super Admin</p>
            <p className="text-xs text-amber-300 font-medium">Root Level Privilege</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
              <span>Role Authority Matrix</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{OFFICIAL_ROLES.length} Roles</p>
            <p className="text-xs text-slate-500">System Role Presets</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase">
              <span>System Health</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">100%</p>
            <p className="text-xs text-slate-500">All Modules Live</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-purple-700 text-[11px] font-bold uppercase">
              <span>Master Control Panel</span>
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
            </div>
            <button
              onClick={() => onNavigateTab('super_admin_panel')}
              className="text-xs font-extrabold text-purple-700 hover:text-purple-900 underline cursor-pointer mt-2 block"
            >
              Open Governance Console →
            </button>
            <p className="text-xs text-slate-500">Edit Roles & Overrides</p>
          </div>
        </div>
      )}

      {/* DYNAMIC ROLE REVIEW CONSOLE / WIDGET */}
      {currentRole !== 'applicant' && (
        <div className="bg-white p-6 rounded-2xl border border-amber-300 shadow-2xs space-y-4 relative">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  Officer Action Desk
                </span>
                <h2 className="text-base font-extrabold text-slate-900">
                  {currentRole === 'supervisor' && 'Requisitions Awaiting PI Endorsement (Stage 1)'}
                  {currentRole === 'lab_nodal' && 'Analytical Research Lab Access Requests (Stage 2)'}
                  {currentRole === 'section_head' && 'Requisitions Awaiting Section Head IT Authorization (Stage 3)'}
                  {currentRole === 'it_officer' && 'Requisitions Ready for Technical Email & Internet Provisioning (Stage 4)'}
                  {currentRole === 'hrms_officer' && 'Requisitions Ready for HRMS ERP Account Provisioning (Stage 4)'}
                  {currentRole === 'admin' && 'System Master Pending Approval Queue'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Take direct endorsement or provisioning action right from your role dashboard console.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('my_requests')}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Full Master Register ({requisitions.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {rolePendingList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-800">Your Action Inbox is Completely Clean!</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No requisitions are currently waiting at your stage. You can review all records in the Requisitions Register.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {rolePendingList.map((req, idx) => (
                <div
                  key={`${req.id}-${idx}`}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-mono font-bold flex items-center justify-center text-xs border border-amber-200 shrink-0">
                      {req.id.includes('/') ? req.id.split('/').pop() : req.id.split('-').pop()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{req.applicant.applicantName}</span>
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                          {req.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {req.applicant.designation} • {req.applicant.departmentCellProject}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {req.itHrmsDetails?.requestEmail && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-200">
                          Email
                        </span>
                      )}
                      {req.itHrmsDetails?.requestInternet && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200">
                          Wi-Fi MAC
                        </span>
                      )}
                      {req.labAccessDetails && req.labAccessDetails.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold rounded border border-amber-200">
                          {req.labAccessDetails.filter((l) => l.selected).length} Labs
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedForAction(req)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Action & Sign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* APPLICANT QUICK SERVICE ACCESS CARDS */}
      {currentRole === 'applicant' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Service Access Status & Fast Application
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quickly view active credentials or submit fresh requests for WII infrastructure.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('new_request')}
              className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open Full Service Hub <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Official Email */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl">
                    <Mail className="w-5 h-5" />
                  </div>
                  {latestApprovedEmail ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Not Requested
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Official WII Email ID</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">@wii.gov.in domain account for official communications.</p>
                </div>

                {latestApprovedEmail?.itHrmsDetails?.assignedWiiEmail && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-blue-700 dark:text-blue-400 truncate">
                    {latestApprovedEmail.itHrmsDetails.assignedWiiEmail}
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigateTab('new_request')}
                className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {latestApprovedEmail ? <RotateCw className="w-3.5 h-3.5 text-emerald-400" /> : <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />}
                {latestApprovedEmail ? 'Renew Email' : 'Apply Email ID'}
              </button>
            </div>

            {/* Card 2: Campus Wi-Fi MAC */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
                    <Wifi className="w-5 h-5" />
                  </div>
                  {latestApprovedMac ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Registered
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Not Registered
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Campus Internet MAC</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">High-speed wireless internet MAC filtering access.</p>
                </div>

                {latestApprovedMac?.itHrmsDetails?.verifiedMacAddress && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 truncate">
                    {latestApprovedMac.itHrmsDetails.verifiedMacAddress}
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigateTab('new_request')}
                className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {latestApprovedMac ? <RotateCw className="w-3.5 h-3.5 text-emerald-400" /> : <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />}
                {latestApprovedMac ? 'Renew MAC Filter' : 'Register Device MAC'}
              </button>
            </div>

            {/* Card 3: HRMS & Biometric */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 rounded-xl">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  {latestApprovedHrms ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Granted
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Not Active
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">HRMS Portal & Biometric</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Leave management, payroll & biometric attendance.</p>
                </div>

                {latestApprovedHrms && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-purple-800 dark:text-purple-400 truncate">
                    ERP HRMS Active
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigateTab('new_request')}
                className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {latestApprovedHrms ? <RotateCw className="w-3.5 h-3.5 text-emerald-400" /> : <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />}
                {latestApprovedHrms ? 'Renew HRMS' : 'Apply HRMS Access'}
              </button>
            </div>

            {/* Card 4: Research Labs */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  {activeLabCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> {activeLabCount} Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      0 Labs Cleared
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Analytical Research Labs</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Forensics, GIS, Isotope, Wildlife Health & Genetics.</p>
                </div>

                {activeLabCount > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-amber-800 dark:text-amber-400 truncate">
                    {activeLabCount} Laboratory Clearances
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigateTab('new_request')}
                className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                Apply Lab Facility Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Requisitions Log Summary
          </h3>
          <button
            onClick={() => onNavigateTab('my_requests')}
            className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Open Full Register <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {requisitions.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Requisitions Submitted Yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                Apply for WII Email ID, Campus Internet MAC registration, HRMS / PMS account, or Research Lab access.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('new_request')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Apply Fresh Service Access
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {requisitions.slice(0, 5).map((req, idx) => (
              <div
                key={`${req.id}-${idx}`}
                onClick={() => onSelectRequisition(req)}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 text-xs">
                    {req.id.includes('/') ? req.id.split('/').pop() : req.id.split('-').pop()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">{req.applicant.applicantName}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px]">{req.applicant.departmentCellProject}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {req.id}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {getRequisitionServiceName(req)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      req.status === 'approved_provisioned'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : req.status === 'rejected'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                    }`}
                  >
                    {req.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPROVAL ACTION MODAL */}
      {selectedForAction && (
        <ApprovalActionModal
          requisition={selectedForAction}
          currentRole={currentRole}
          onClose={() => setSelectedForAction(null)}
          onSaveAction={(updated) => {
            onUpdateRequisition(updated);
            setSelectedForAction(null);
          }}
        />
      )}
    </div>
  );
};
