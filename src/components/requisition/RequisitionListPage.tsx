import React, { useState } from 'react';
import { RequisitionRecord, UserRole, WII_LABS } from '../../types/requisition';
import { OFFICIAL_ROLES } from '../../data/initialData';
import { getRequisitionServiceName } from '../../utils/storage';
import { ApprovalActionModal } from '../workflow/ApprovalActionModal';
import { OfficialFormReplica } from './OfficialFormReplica';
import {
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  PlusCircle,
  Mail,
  Wifi,
  Fingerprint,
  FlaskConical,
  ShieldCheck,
  UserCheck,
  BadgeCheck,
  Printer,
  Sparkles,
  ChevronRight,
  ArrowRight,
  SlidersHorizontal,
  LayoutGrid,
  Table,
  Check,
  User,
} from 'lucide-react';

interface RequisitionListProps {
  requisitions: RequisitionRecord[];
  currentRole: UserRole;
  onSelectRequisition: (req: RequisitionRecord) => void;
  onUpdateRequisition: (req: RequisitionRecord) => void;
  onCreateNew: () => void;
  searchQuery: string;
  initialTab?: 'all' | 'in_progress' | 'closed';
}

export const RequisitionList: React.FC<RequisitionListProps> = ({
  requisitions,
  currentRole,
  onSelectRequisition,
  onUpdateRequisition,
  onCreateNew,
  searchQuery,
  initialTab = 'all',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'in_progress' | 'closed'>(
    initialTab === 'closed' || initialTab === 'in_progress' ? initialTab : 'all'
  );
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [selectedForAction, setSelectedForAction] = useState<{
    req: RequisitionRecord;
    decision?: 'approve' | 'reject' | 'deactivate';
  } | null>(null);
  const [selectedForReplica, setSelectedForReplica] = useState<RequisitionRecord | null>(null);

  const activeRoleInfo = OFFICIAL_ROLES.find((r) => r.id === currentRole) || OFFICIAL_ROLES[0];

  const isUserRole = currentRole === 'applicant';
  const isPiRole = currentRole === 'supervisor';
  const isItHeadRole = currentRole === 'section_head';
  const isManagerRole =
    currentRole === 'it_officer' ||
    currentRole === 'hrms_officer' ||
    currentRole === 'lab_nodal' ||
    currentRole === 'assoc_lab_nodal' ||
    currentRole === 'admin';

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getStageAndDealingOfficer = (req: RequisitionRecord, itemKey: string) => {
    if (req.status === 'rejected') {
      const rejectHist = req.history?.find((h) => h.actionType === 'reject' || h.actionType === 'pi_reject' || h.actionType === 'lab_reject');
      return {
        stageName: 'Rejected',
        stageBadgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
        dealingOfficer: rejectHist?.actorName || req.piApproval?.officerName || 'Reviewing Officer',
        officerRole: 'Decision Officer',
      };
    }

    if (req.status === 'deactivated') {
      return {
        stageName: 'Deactivated',
        stageBadgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dealingOfficer: 'IT & HRMS Cell',
        officerRole: 'System Admin',
      };
    }

    if (itemKey.startsWith('lab-')) {
      const labId = itemKey.replace('lab-', '');
      const lab = req.labAccessDetails?.find((l) => l.labId === labId);
      const nodalName = lab?.nodalOfficerName || WII_LABS.find((wl) => wl.id === labId)?.defaultNodal || 'Lab Nodal Officer';

      if (lab?.nodalApprovalStatus === 'approved') {
        return {
          stageName: 'Lab Pass Approved',
          stageBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dealingOfficer: nodalName,
          officerRole: 'Nodal Officer',
        };
      } else if (lab?.nodalApprovalStatus === 'rejected') {
        return {
          stageName: 'Lab Access Denied',
          stageBadgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dealingOfficer: nodalName,
          officerRole: 'Nodal Officer',
        };
      } else {
        if (req.status === 'submitted_pending_pi') {
          return {
            stageName: 'Stage 1: PI Endorsement',
            stageBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
            dealingOfficer: req.applicant.supervisingOfficerName || req.piApproval?.officerName || 'Supervising PI',
            officerRole: 'PI / Supervisor',
          };
        }
        return {
          stageName: 'Stage 2: Nodal Review',
          stageBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dealingOfficer: nodalName,
          officerRole: 'Lab Nodal Officer',
        };
      }
    }

    switch (req.status) {
      case 'submitted_pending_pi':
        return {
          stageName: 'Stage 1: PI Endorsement',
          stageBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dealingOfficer: req.applicant.supervisingOfficerName || req.piApproval?.officerName || 'Supervising PI',
          officerRole: 'Supervising PI',
        };

      case 'pi_approved':
      case 'in_tech_verification':
        if (itemKey === 'email' || itemKey === 'internet') {
          return {
            stageName: 'Stage 2: IT Provisioning',
            stageBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
            dealingOfficer: req.itCellVerification?.emailNetOfficer?.officerName || 'Mr. Dinesh Singh Pundir',
            officerRole: 'Sr. Tech Officer (IT)',
          };
        } else if (itemKey === 'hrms') {
          return {
            stageName: 'Stage 2: HRMS Verification',
            stageBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
            dealingOfficer: req.itCellVerification?.hrmsOfficer?.officerName || 'Mr. Harendra Kumar',
            officerRole: 'HRMS Officer',
          };
        } else if (itemKey === 'biometric') {
          return {
            stageName: 'Stage 2: Biometric Desk',
            stageBadgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
            dealingOfficer: req.itCellVerification?.biometricOfficer?.officerName || 'Mr. Aniket Gupta',
            officerRole: 'Biometric Officer',
          };
        }
        return {
          stageName: 'Stage 2: Tech Verification',
          stageBadgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
          dealingOfficer: 'Mr. Dinesh Singh Pundir',
          officerRole: 'IT Cell Officer',
        };

      case 'pending_section_head':
        return {
          stageName: 'Stage 3: Section Head Auth',
          stageBadgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
          dealingOfficer: req.sectionHeadApproval?.officerName || 'Dr. Panna Lal',
          officerRole: 'Section Head (IT/GIS)',
        };

      case 'approved_provisioned':
        if (itemKey === 'email') {
          return {
            stageName: 'Email Active',
            stageBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            dealingOfficer: req.itCellVerification?.emailNetOfficer?.officerName || 'Mr. Dinesh Singh Pundir',
            officerRole: 'IT Officer',
          };
        } else if (itemKey === 'internet') {
          return {
            stageName: 'MAC Whitelisted',
            stageBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            dealingOfficer: req.itCellVerification?.emailNetOfficer?.officerName || 'Mr. Dinesh Singh Pundir',
            officerRole: 'Network Officer',
          };
        } else if (itemKey === 'hrms') {
          return {
            stageName: 'ERP Account Active',
            stageBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            dealingOfficer: req.itCellVerification?.hrmsOfficer?.officerName || 'Mr. Harendra Kumar',
            officerRole: 'HRMS Officer',
          };
        } else if (itemKey === 'biometric') {
          return {
            stageName: 'Biometric Assigned',
            stageBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
            dealingOfficer: req.itCellVerification?.biometricOfficer?.officerName || 'Mr. Aniket Gupta',
            officerRole: 'Biometric Officer',
          };
        }
        return {
          stageName: 'Active & Provisioned',
          stageBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dealingOfficer: 'IT & HRMS Cell',
          officerRole: 'System Controller',
        };

      default:
        return {
          stageName: 'Under Processing',
          stageBadgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
          dealingOfficer: req.applicant.supervisingOfficerName || 'Assigned Officer',
          officerRole: 'Officer',
        };
    }
  };

  // Logic to test if a requisition is pending action for the current persona role
  const isPendingForRole = (req: RequisitionRecord, role: UserRole): boolean => {
    if (req.status === 'rejected' || req.status === 'approved_provisioned' || req.status === 'deactivated') {
      return false;
    }

    if (role === 'admin') {
      return (req.status as string) !== 'approved_provisioned' && (req.status as string) !== 'rejected';
    }

    if (role === 'supervisor') {
      return req.status === 'submitted_pending_pi' || req.piApproval?.status === 'pending';
    }

    if (role === 'lab_nodal' || role === 'assoc_lab_nodal') {
      if (req.status === 'in_lab_review' && req.labAccessDetails) {
        return req.labAccessDetails.some((l) => l.selected && l.nodalApprovalStatus === 'pending');
      }
      return false;
    }

    if (role === 'section_head') {
      return req.status === 'pending_section_head';
    }

    if (role === 'it_officer') {
      return (
        req.status === 'in_tech_verification' &&
        (req.type === 'IT_HRMS' || req.type === 'COMBINED') &&
        (!req.itCellVerification?.emailNetOfficer || req.itCellVerification.emailNetOfficer.status === 'pending')
      );
    }

    if (role === 'hrms_officer') {
      return (
        req.status === 'in_tech_verification' &&
        (req.type === 'IT_HRMS' || req.type === 'COMBINED') &&
        Boolean(req.itHrmsDetails?.requestHrmsPms) &&
        (!req.itCellVerification?.hrmsOfficer || req.itCellVerification.hrmsOfficer.status === 'pending')
      );
    }

    return false;
  };

  const filtered = requisitions.filter((req) => {
    // Tab Filter
    if (
      activeSubTab === 'in_progress' &&
      (req.status === 'approved_provisioned' || req.status === 'rejected' || req.status === 'deactivated')
    ) {
      return false;
    }
    if (
      activeSubTab === 'closed' &&
      req.status !== 'approved_provisioned' &&
      req.status !== 'rejected' &&
      req.status !== 'deactivated'
    ) {
      return false;
    }

    // Type Filter
    if (typeFilter !== 'all' && req.type !== typeFilter) {
      return false;
    }

    // Stage Filter
    if (stageFilter !== 'all' && req.status !== stageFilter) {
      return false;
    }

    // Search Query
    if (localSearch.trim() !== '') {
      const q = localSearch.toLowerCase();
      const matchId = req.id.toLowerCase().includes(q);
      const matchName = req.applicant.applicantName.toLowerCase().includes(q);
      const matchDept = req.applicant.departmentCellProject.toLowerCase().includes(q);
      const matchPI = req.applicant.supervisingOfficerName.toLowerCase().includes(q);
      const matchPan = req.applicant.panNo.toLowerCase().includes(q);
      const matchLab = req.labAccessDetails?.some((l) => l.labName.toLowerCase().includes(q));
      const matchMode = req.itHrmsDetails?.requisitionMode?.toLowerCase().includes(q);
      const matchRefSuffix = ['email', 'eml', 'wifi', 'net', 'hrm', 'hrms', 'bio', 'biometric', 'fresh', 'renewal'].some((term) => q.includes(term));

      if (!matchId && !matchName && !matchDept && !matchPI && !matchPan && !matchLab && !matchMode && !matchRefSuffix) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner - Standardized Uniform Layout */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 min-h-[140px]">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 pointer-events-none blur-2xl" />

        {/* Title & Badge Left Section */}
        <div className="space-y-1.5 z-10 relative max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Access Management Portal
            </span>
            <span className="text-xs text-slate-400">• Wildlife Institute of India</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            {initialTab === 'pending'
              ? 'Approval Queue & Pending Requisitions'
              : currentRole === 'applicant'
              ? 'Service Requisitions & Application Status'
              : currentRole === 'supervisor'
              ? 'PI Endorsement & Fellow Applications'
              : currentRole === 'lab_nodal'
              ? 'Research Lab Clearance Requisitions'
              : currentRole === 'section_head'
              ? 'Section Head IT Clearance Applications'
              : currentRole === 'it_officer'
              ? 'Email & Network Provisioning Queue'
              : currentRole === 'hrms_officer'
              ? 'HRMS & Biometric Provisioning Queue'
              : 'Master Requisition Management Portal'}
          </h1>

          <p className="text-xs text-slate-300 truncate max-w-xl block">
            {initialTab === 'pending'
              ? 'Review and process pending digital requisitions awaiting clearance in your active workflow stage.'
              : currentRole === 'applicant'
              ? 'Track, filter, and monitor the multi-tier approval progress of all your service applications.'
              : 'Inspect, filter, and manage digital requisitions for WII Email, Internet, HRMS, and Research Lab access.'}
          </p>
        </div>

        {/* Right Section: Action Button */}
        <div className="flex flex-wrap items-center gap-3 z-10 relative shrink-0">
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            New Access
          </button>
        </div>
      </div>

      {/* Primary Sub-Tabs & View Switcher Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            All ({requisitions.length})
          </button>

          <button
            onClick={() => setActiveSubTab('in_progress')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'in_progress'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            In Progress
          </button>

          <button
            onClick={() => setActiveSubTab('closed')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'closed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Closed
          </button>
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('table')}
            title="Compact Table View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            title="Card Grid View"
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Req ID, Applicant Name, PAN, Dept, PI, or Lab..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold bg-white"
            >
              <option value="all">All Service Types</option>
              <option value="COMBINED">Combined Requisition</option>
              <option value="IT_HRMS">IT / HRMS / PMS Only</option>
              <option value="LAB_FACILITY">Research Lab Access Only</option>
            </select>
          </div>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold bg-white"
          >
            <option value="all">All Workflow Stages</option>
            <option value="submitted_pending_pi">Stage 1: Pending PI Approval</option>
            <option value="in_lab_review">Stage 2: Pending Lab Nodal</option>
            <option value="pending_section_head">Stage 3: Pending Section Head IT</option>
            <option value="in_tech_verification">Stage 4: Pending Technical Officer</option>
            <option value="approved_provisioned">Stage 5: Fully Active & Provisioned</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* MAIN REGISTER DISPLAY: TABLE MODE OR CARDS MODE */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-slate-600 border-b border-slate-200 text-[10px] uppercase font-extrabold tracking-wider">
                  <th className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">Req ID & Date</th>
                  {!isUserRole && <th className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">Applicant</th>}
                  {(isItHeadRole || isManagerRole) && <th className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">Supervising PI</th>}
                  <th className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">Access Requested</th>
                  <th className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">From Date</th>
                  <th className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">To Date</th>
                  <th className="py-2.5 px-2.5 text-slate-600 whitespace-nowrap">Stage & Officer</th>
                  <th className="py-2.5 px-2.5 text-center text-slate-600 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isUserRole ? 6 : isPiRole ? 7 : 8} className="p-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800">No Requisitions Match Criteria</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Try clearing search terms or selecting a different tab filter above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.flatMap((req, reqIdx) => {
                    const needsAction = isPendingForRole(req, currentRole);

                    // Build array of access items requested for this requisition
                    const accessItems: {
                      key: string;
                      label: string;
                      refId: string;
                      modeTag: string;
                      icon: React.ReactNode;
                      fromDate: string;
                      toDate: string;
                      value: React.ReactNode;
                    }[] = [];

                    const isRenewal = req.itHrmsDetails?.requisitionMode === 'renewal';
                    const defaultFrom = formatDisplayDate(req.applicant.dateOfJoining || req.createdAt);
                    const defaultTo = formatDisplayDate(req.applicant.validUpTo);

                    const isRejected = req.status === 'rejected';
                    const isDeactivated = req.status === 'deactivated';

                    if (req.itHrmsDetails?.requestEmail) {
                      accessItems.push({
                        key: 'email',
                        label: 'Official WII Email ID',
                        refId: `${req.id}-EML`,
                        modeTag: isRenewal ? 'Renewal Email' : 'Fresh Email',
                        icon: <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
                        fromDate: defaultFrom,
                        toDate: defaultTo,
                        value: isRejected ? (
                          <span className="text-[9px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap inline-flex items-center gap-1">
                            ✕ Rejected
                          </span>
                        ) : isDeactivated ? (
                          <span className="text-[9px] text-slate-700 font-extrabold bg-slate-100 px-2 py-0.5 rounded border border-slate-300 whitespace-nowrap inline-flex items-center gap-1">
                            🔒 Deactivated
                          </span>
                        ) : req.itHrmsDetails.assignedWiiEmail ? (
                          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 truncate max-w-[150px] inline-block">
                            {req.itHrmsDetails.assignedWiiEmail}
                          </span>
                        ) : null,
                      });
                    }

                    if (req.itHrmsDetails?.requestInternet) {
                      accessItems.push({
                        key: 'internet',
                        label: 'Wi-Fi / Internet',
                        refId: `${req.id}-NET`,
                        modeTag: isRenewal ? 'Renewal Wi-Fi' : 'Fresh Wi-Fi',
                        icon: <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
                        fromDate: defaultFrom,
                        toDate: defaultTo,
                        value: isRejected ? (
                          <span className="text-[9px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap inline-flex items-center gap-1">
                            ✕ Rejected
                          </span>
                        ) : isDeactivated ? (
                          <span className="text-[9px] text-slate-700 font-extrabold bg-slate-100 px-2 py-0.5 rounded border border-slate-300 whitespace-nowrap inline-flex items-center gap-1">
                            🔒 Deactivated
                          </span>
                        ) : req.itHrmsDetails.macAddress ? (
                          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {req.itHrmsDetails.macAddress}
                          </span>
                        ) : null,
                      });
                    }

                    if (req.itHrmsDetails?.requestHrmsPms) {
                      accessItems.push({
                        key: 'hrms',
                        label: 'HRMS / PMS',
                        refId: `${req.id}-HRM`,
                        modeTag: isRenewal ? 'Renewal HRMS' : 'Fresh HRMS',
                        icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
                        fromDate: defaultFrom,
                        toDate: defaultTo,
                        value: isRejected ? (
                          <span className="text-[9px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap inline-flex items-center gap-1">
                            ✕ Rejected
                          </span>
                        ) : isDeactivated ? (
                          <span className="text-[9px] text-slate-700 font-extrabold bg-slate-100 px-2 py-0.5 rounded border border-slate-300 whitespace-nowrap inline-flex items-center gap-1">
                            🔒 Deactivated
                          </span>
                        ) : req.status === 'approved_provisioned' || req.itHrmsDetails?.hrmsAccessGranted ? (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 whitespace-nowrap inline-flex items-center gap-1">
                            ✓ Active
                          </span>
                        ) : null,
                      });
                    }

                    if (req.itHrmsDetails?.requestBiometric) {
                      accessItems.push({
                        key: 'biometric',
                        label: 'Biometric Access',
                        refId: `${req.id}-BIO`,
                        modeTag: 'Fresh Bio',
                        icon: <Fingerprint className="w-3.5 h-3.5 text-indigo-600 shrink-0" />,
                        fromDate: defaultFrom,
                        toDate: defaultTo,
                        value: isRejected ? (
                          <span className="text-[9px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap inline-flex items-center gap-1">
                            ✕ Rejected
                          </span>
                        ) : isDeactivated ? (
                          <span className="text-[9px] text-slate-700 font-extrabold bg-slate-100 px-2 py-0.5 rounded border border-slate-300 whitespace-nowrap inline-flex items-center gap-1">
                            🔒 Deactivated
                          </span>
                        ) : req.itHrmsDetails?.assignedBiometricId || req.applicant.biometricId ? (
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {req.itHrmsDetails?.assignedBiometricId || req.applicant.biometricId}
                          </span>
                        ) : null,
                      });
                    }

                    if (req.labAccessDetails) {
                      req.labAccessDetails
                        .filter((l) => l.selected)
                        .forEach((lab) => {
                          const code = lab.labId.substring(0, 3).toUpperCase();
                          accessItems.push({
                            key: `lab-${lab.labId}`,
                            label: lab.labName,
                            refId: `${req.id}-LAB-${code}`,
                            modeTag: 'Lab Access',
                            icon: <FlaskConical className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
                            fromDate: formatDisplayDate(lab.fromDate) || defaultFrom,
                            toDate: formatDisplayDate(lab.toDate) || defaultTo,
                            value: isRejected ? (
                              <span className="text-[9px] text-rose-700 font-extrabold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap inline-flex items-center gap-1">
                                ✕ Rejected
                              </span>
                            ) : isDeactivated ? (
                              <span className="text-[9px] text-slate-700 font-extrabold bg-slate-100 px-2 py-0.5 rounded border border-slate-300 whitespace-nowrap inline-flex items-center gap-1">
                                🔒 Deactivated
                              </span>
                            ) : lab.nodalApprovalStatus === 'approved' ? (
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded whitespace-nowrap inline-flex items-center gap-1">
                                ✓ Pass
                              </span>
                            ) : lab.nodalApprovalStatus === 'rejected' ? (
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded whitespace-nowrap inline-flex items-center gap-1">
                                ✕ Denied
                              </span>
                            ) : null,
                          });
                        });
                    }

                    if (accessItems.length === 0) {
                      accessItems.push({
                        key: 'none',
                        label: 'No Access Specified',
                        refId: req.id,
                        modeTag: 'General',
                        icon: null,
                        fromDate: defaultFrom,
                        toDate: defaultTo,
                        value: <span className="text-slate-400 text-[10px]">—</span>,
                      });
                    }

                    return accessItems.map((item, itemIdx) => {
                      const stageInfo = getStageAndDealingOfficer(req, item.key);

                      return (
                        <tr
                          key={`${req.id}-${item.key}-${reqIdx}-${itemIdx}`}
                          className={`hover:bg-slate-50/90 transition-colors ${
                            needsAction ? 'bg-amber-50/20' : 'bg-white'
                          }`}
                        >
                          {/* 1. Req ID & Date */}
                          <td className="py-2 px-2.5 font-mono text-xs align-middle">
                            <div className="font-extrabold text-blue-700 whitespace-nowrap">{item.refId}</div>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={`inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded border whitespace-nowrap ${
                                  item.modeTag.toLowerCase().includes('renewal')
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : item.modeTag.toLowerCase().includes('fresh')
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                }`}
                              >
                                {item.modeTag}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans whitespace-nowrap">
                                {formatDisplayDate(req.createdAt)}
                              </span>
                            </div>
                          </td>

                          {/* 2. Applicant (Hidden for User role) */}
                          {!isUserRole && (
                            <td className="py-2 px-2.5 align-middle">
                              <div className="font-bold text-slate-900 leading-snug whitespace-nowrap">{req.applicant.applicantName}</div>
                              <div className="text-slate-600 text-[11px] font-medium leading-tight whitespace-nowrap">{req.applicant.designation}</div>
                              <div className="text-slate-400 text-[10px] truncate max-w-[130px]" title={req.applicant.departmentCellProject}>
                                {req.applicant.departmentCellProject}
                              </div>
                            </td>
                          )}

                          {/* 3. PI (Shown for IT Head and Manager roles) */}
                          {(isItHeadRole || isManagerRole) && (
                            <td className="py-2 px-2.5 align-middle">
                              <div className="font-semibold text-slate-800 leading-snug whitespace-nowrap">{req.applicant.supervisingOfficerName}</div>
                              <span
                                className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mt-1 whitespace-nowrap ${
                                  req.piApproval?.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : req.piApproval?.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {req.piApproval?.status === 'approved'
                                  ? '✓ Endorsed'
                                  : req.piApproval?.status === 'rejected'
                                  ? '✕ Rejected'
                                  : '⏳ Pending PI'}
                              </span>
                            </td>
                          )}

                          {/* 4. Access Requested */}
                          <td className="py-2 px-2.5 align-middle">
                            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-800 whitespace-nowrap">
                              {item.icon}
                              <span>{item.label}</span>
                            </div>
                          </td>

                          {/* 5. From Date */}
                          <td className="py-2 px-2.5 align-middle font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            {item.fromDate}
                          </td>

                          {/* 6. To Date */}
                          <td className="py-2 px-2.5 align-middle font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            {item.toDate}
                          </td>

                          {/* 7. Stage & Officer */}
                          <td className="py-2 px-2.5 align-middle">
                            <div className="flex flex-col gap-1 text-[10px]">
                              <div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${stageInfo.stageBadgeClass}`}>
                                  {stageInfo.stageName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-500 whitespace-nowrap" title={`Dealing Officer: ${stageInfo.dealingOfficer} (${stageInfo.officerRole})`}>
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700 truncate max-w-[130px]">{stageInfo.dealingOfficer}</span>
                                <span className="text-[9px] text-slate-400 font-normal shrink-0">({stageInfo.officerRole})</span>
                              </div>
                            </div>
                          </td>

                          {/* 8. Actions (Row-Wise Separated for every row) */}
                          <td className="py-2.5 px-3 align-middle text-center">
                            <div className="flex items-center justify-center gap-1 shrink-0">
                              {/* Role-specific Quick Approval/Provision buttons if pending */}
                              {isPiRole && needsAction && (
                                <button
                                  onClick={() => setSelectedForAction({ req, decision: 'approve' })}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                                  title="Approve Requisition"
                                >
                                  <Check className="w-3 h-3" /> Approve
                                </button>
                              )}

                              {isItHeadRole && needsAction && (
                                <button
                                  onClick={() => setSelectedForAction({ req, decision: 'approve' })}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                                  title="Authorize Requisition"
                                >
                                  <ShieldCheck className="w-3 h-3" /> Authorize
                                </button>
                              )}

                              {isManagerRole && needsAction && (
                                <button
                                  onClick={() => setSelectedForAction({ req, decision: 'approve' })}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                                  title="Action & Provision Access"
                                >
                                  <SlidersHorizontal className="w-3 h-3" /> Action
                                </button>
                              )}

                              {/* Standard View Button */}
                              <button
                                onClick={() =>
                                  onSelectRequisition({
                                    ...req,
                                    selectedServiceKey: item.key,
                                    selectedRefId: item.refId,
                                    selectedServiceLabel: item.label,
                                  })
                                }
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-[10px] font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                                title="View Full Requisition Details"
                              >
                                <Eye className="w-3 h-3 text-slate-500" /> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW MODE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
              <FileText className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800">No Requisitions Found</p>
            </div>
          ) : (
            filtered.map((req, reqIdx) => {
              const needsAction = isPendingForRole(req, currentRole);
              const cardStageInfo = getStageAndDealingOfficer(req, 'general');
              return (
                <div
                  key={`${req.id}-${reqIdx}`}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-4 flex flex-col justify-between transition-all ${
                    needsAction ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs text-blue-700">{req.id}</span>
                        <h3 className="font-bold text-slate-900 text-sm">{req.applicant.applicantName}</h3>
                        <p className="text-xs text-slate-500">{req.applicant.departmentCellProject}</p>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          req.status === 'approved_provisioned'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs space-y-1.5 border border-slate-200/80">
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Supervising PI:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{req.applicant.supervisingOfficerName}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Stage:</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${cardStageInfo.stageBadgeClass}`}>
                          {cardStageInfo.stageName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span>Dealing Person:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {cardStageInfo.dealingOfficer}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 pt-0.5 border-t border-slate-200/60">
                        <span>Valid Up To:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatDisplayDate(req.applicant.validUpTo)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {req.itHrmsDetails?.requestEmail && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold border border-blue-200">
                          Email
                        </span>
                      )}
                      {req.itHrmsDetails?.requestInternet && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold border border-emerald-200">
                          Internet MAC
                        </span>
                      )}
                      {req.itHrmsDetails?.requestHrmsPms && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-bold border border-purple-200">
                          HRMS
                        </span>
                      )}
                      {req.labAccessDetails && req.labAccessDetails.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-bold border border-amber-200">
                          {req.labAccessDetails.filter((l) => l.selected).length} Labs
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectRequisition(req)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>

                      {needsAction && (
                        <button
                          onClick={() => setSelectedForAction({ req, decision: 'approve' })}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* APPROVAL ACTION MODAL */}
      {selectedForAction && (
        <ApprovalActionModal
          requisition={selectedForAction.req}
          currentRole={currentRole}
          initialDecision={selectedForAction.decision}
          onClose={() => setSelectedForAction(null)}
          onSaveAction={(updated) => {
            onUpdateRequisition(updated);
            setSelectedForAction(null);
          }}
        />
      )}

      {/* REPLICA FORM MODAL */}
      {selectedForReplica && (
        <OfficialFormReplica requisition={selectedForReplica} onClose={() => setSelectedForReplica(null)} />
      )}
    </div>
  );
};
