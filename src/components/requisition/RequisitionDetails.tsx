import React, { useState } from 'react';
import { RequisitionRecord, UserRole } from '../../types/requisition';
import { getRequisitionServiceName, getRequisitionRefId } from '../../utils/storage';
import { OfficialFormReplica } from './OfficialFormReplica';
import {
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck,
  Mail,
  Wifi,
  ShieldCheck,
  Building,
  Printer,
  History,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowLeft,
  FlaskConical,
  Info,
  Calendar,
  Activity,
  Award,
  User,
  Briefcase,
  Phone,
  Fingerprint,
  CheckSquare,
  Tag,
  KeyRound,
  Shield,
  FileCheck,
} from 'lucide-react';

interface RequisitionDetailsProps {
  requisition: RequisitionRecord;
  currentRole: UserRole;
  onBack: () => void;
  onUpdateRequisition: (req: RequisitionRecord) => void;
}

export const RequisitionDetails: React.FC<RequisitionDetailsProps> = ({
  requisition,
  currentRole,
  onBack,
  onUpdateRequisition,
}) => {
  const [showReplicaModal, setShowReplicaModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Password visibility states (Only toggleable by Applicant)
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [showWifiKey, setShowWifiKey] = useState(false);
  const [showBiometricPin, setShowBiometricPin] = useState(false);
  const [showHrmsPass, setShowHrmsPass] = useState(false);

  // Officer Action Form States
  const [officerComments, setOfficerComments] = useState('');
  const [officerSign, setOfficerSign] = useState('');
  
  // IT / HRMS Provisioning form fields for IT/HRMS Officers
  const [provWiiEmail, setProvWiiEmail] = useState(
    requisition.itHrmsDetails?.assignedWiiEmail ||
      `${requisition.applicant.applicantName.toLowerCase().replace(/[^a-z]/g, '.')}@wii.gov.in`
  );
  const [provEmailPassword, setProvEmailPassword] = useState(
    requisition.itHrmsDetails?.assignedEmailPassword || `WII@2026#${requisition.id.slice(-4)}`
  );
  const [provMac, setProvMac] = useState(
    requisition.itHrmsDetails?.verifiedMacAddress || requisition.itHrmsDetails?.macAddress || 'FC:FB:FB:12:34:56'
  );
  const [provWifiKey, setProvWifiKey] = useState(
    requisition.itHrmsDetails?.wifiAccessKey || 'WII-WiFi#Sec8912'
  );
  const [provBioId, setProvBioId] = useState(
    requisition.itHrmsDetails?.assignedBiometricId || requisition.applicant.biometricId || 'WII-BIO-1088'
  );
  const [provBioPin, setProvBioPin] = useState(
    requisition.itHrmsDetails?.biometricPin || '4091'
  );
  const [provHrmsCode, setProvHrmsCode] = useState(
    requisition.itHrmsDetails?.assignedHrmsEmpCode || `WII-EMP-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [provHrmsPassword, setProvHrmsPassword] = useState(
    requisition.itHrmsDetails?.hrmsPassword || 'Hrms#2026Secret'
  );

  const isApplicantView = currentRole === 'applicant';

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hasLab =
    requisition.type === 'LAB_FACILITY' ||
    (requisition.type === 'COMBINED' &&
      requisition.labAccessDetails &&
      requisition.labAccessDetails.some((l) => l.selected));

  // Determine workflow step list
  const steps = [
    {
      key: 'submitted_pending_pi',
      title: 'PI Endorsement',
      actor: requisition.applicant.supervisingOfficerName || 'Supervisor / PI',
    },
    {
      key: 'in_lab_review',
      title: 'Lab NO & ANO Review',
      actor: hasLab ? 'Lab NO & ANO Officers' : 'N/A (Services Request Direct to IT Head)',
    },
    {
      key: 'pending_section_head',
      title: 'IT Head Clearance',
      actor: 'Dr. Panna Lal (Section Head IT)',
    },
    {
      key: 'in_tech_verification',
      title: 'Manager Action',
      actor: 'IT & HRMS Technical Managers',
    },
    {
      key: 'approved_provisioned',
      title: 'Active & Provisioned',
      actor: 'All Systems Ready & Supervisor Informed',
    },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'submitted_pending_pi':
        return 0;
      case 'in_lab_review':
        return 1;
      case 'pending_section_head':
        return 2;
      case 'in_tech_verification':
        return 3;
      case 'approved_provisioned':
        return 4;
      case 'rejected':
      case 'deactivated':
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(requisition.status);

  // Helper to test if it's the active role's turn to take action
  const canCurrentRoleAct = (req: RequisitionRecord, role: UserRole): boolean => {
    if (req.status === 'rejected' || req.status === 'approved_provisioned' || req.status === 'deactivated') {
      return false;
    }
    if (role === 'admin' || role === 'super_admin') return true;
    if (role === 'supervisor') {
      return req.status === 'submitted_pending_pi' || req.piApproval?.status === 'pending';
    }
    if (role === 'lab_nodal' || role === 'assoc_lab_nodal') {
      return req.status === 'in_lab_review' && Boolean(req.labAccessDetails?.some((l) => l.selected && l.nodalApprovalStatus === 'pending'));
    }
    if (role === 'section_head') {
      return req.status === 'pending_section_head';
    }
    if (role === 'it_officer' || role === 'hrms_officer') {
      return req.status === 'in_tech_verification';
    }
    return false;
  };

  // Workflow action handlers for Officers
  const handleOfficerAction = (action: 'approve' | 'reject' | 'provision') => {
    const updated: RequisitionRecord = { ...requisition };
    const now = new Date().toISOString();
    const actorName =
      currentRole === 'supervisor'
        ? requisition.applicant.supervisingOfficerName || 'Dr. R. K. Singh (Supervising Officer)'
        : currentRole === 'lab_nodal'
        ? 'Dr. S. K. Gupta (Lab Nodal Officer - NO)'
        : currentRole === 'assoc_lab_nodal'
        ? 'Dr. Associate Nodal Officer (ANO - Lab Cell)'
        : currentRole === 'section_head'
        ? 'Dr. Panna Lal (Section Head IT)'
        : currentRole === 'it_officer'
        ? 'Mr. Dinesh Singh Pundir (Senior Technical Officer - IT)'
        : currentRole === 'hrms_officer'
        ? 'Mr. Harendra Kumar (Senior Technical Officer - HRMS)'
        : 'System Admin';

    if (action === 'reject') {
      updated.status = 'rejected';
      updated.history = [
        ...updated.history,
        {
          id: `hist-${Date.now()}`,
          actorRole: currentRole,
          actorName,
          actionType: 'reject',
          comments: officerComments || 'Requisition rejected with official remarks.',
          timestamp: now,
          digitalSignature: officerSign || actorName,
        },
      ];
    } else if (currentRole === 'supervisor') {
      updated.piApproval = {
        status: 'approved',
        officerName: actorName,
        comments: officerComments || 'Endorsed by Supervising Officer.',
        timestamp: now,
        signature: officerSign || actorName,
      };
      // Services request goes directly to IT Head; Lab request goes to NO/ANO Lab
      updated.status = hasLab ? 'in_lab_review' : 'pending_section_head';
      updated.history = [
        ...updated.history,
        {
          id: `hist-${Date.now()}`,
          actorRole: 'supervisor',
          actorName,
          actionType: 'pi_approve',
          comments: officerComments || 'Supervising Officer endorsement completed.',
          timestamp: now,
          digitalSignature: officerSign || actorName,
        },
      ];
    } else if (currentRole === 'lab_nodal' || currentRole === 'assoc_lab_nodal') {
      if (updated.labAccessDetails) {
        updated.labAccessDetails = updated.labAccessDetails.map((lab) => {
          if (lab.selected) {
            return {
              ...lab,
              nodalApprovalStatus: 'approved',
              nodalComments: officerComments || 'Lab facility access approved.',
              nodalOfficerName: actorName,
              actionDate: now.split('T')[0],
              assignedLabPassId: lab.assignedLabPassId || `LAB-PASS-${lab.labId.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
            };
          }
          return lab;
        });
      }
      // Either NO or ANO can forward to IT Head
      updated.status = 'pending_section_head';
      updated.history = [
        ...updated.history,
        {
          id: `hist-${Date.now()}`,
          actorRole: currentRole,
          actorName,
          actionType: 'lab_approve',
          comments: officerComments || `Research laboratory access pass cleared by ${currentRole === 'assoc_lab_nodal' ? 'ANO' : 'NO'}.`,
          timestamp: now,
          digitalSignature: officerSign || actorName,
        },
      ];
    } else if (currentRole === 'section_head') {
      updated.sectionHeadApproval = {
        status: 'approved',
        officerName: actorName,
        comments: officerComments || 'Authorized by Section Head IT.',
        timestamp: now,
        signature: officerSign || actorName,
      };
      const hasIT = updated.type === 'IT_HRMS' || updated.type === 'COMBINED';
      updated.status = hasIT ? 'in_tech_verification' : 'approved_provisioned';
      updated.history = [
        ...updated.history,
        {
          id: `hist-${Date.now()}`,
          actorRole: 'section_head',
          actorName,
          actionType: 'section_head_authorize',
          comments: officerComments || 'Section Head IT clearance granted.',
          timestamp: now,
          digitalSignature: officerSign || actorName,
        },
      ];
    } else if (currentRole === 'it_officer' || currentRole === 'hrms_officer' || currentRole === 'admin' || action === 'provision') {
      if (!updated.itHrmsDetails) {
        updated.itHrmsDetails = {
          requestEmail: true,
          requestedEmailGroups: ['research-scholars'],
          requestInternet: true,
          deviceType: 'Laptop / PC',
          macAddress: provMac,
          requestHrmsPms: true,
          requestBiometric: true,
        };
      }
      updated.itHrmsDetails = {
        ...updated.itHrmsDetails,
        assignedWiiEmail: provWiiEmail,
        assignedEmailPassword: provEmailPassword,
        verifiedMacAddress: provMac,
        wifiAccessKey: provWifiKey,
        assignedBiometricId: provBioId,
        biometricPin: provBioPin,
        hrmsAccessGranted: true,
        assignedHrmsEmpCode: provHrmsCode,
        hrmsPassword: provHrmsPassword,
      };
      updated.status = 'approved_provisioned';
      updated.history = [
        ...updated.history,
        {
          id: `hist-${Date.now()}`,
          actorRole: currentRole,
          actorName,
          actionType: 'tech_provision',
          comments: officerComments || 'Technical identifiers provisioned and activated in core systems by Manager.',
          timestamp: now,
          digitalSignature: officerSign || actorName,
        },
      ];
    }

    updated.updatedAt = now;
    onUpdateRequisition(updated);
  };

  // Extract created IDs for display
  const createdEmail = requisition.itHrmsDetails?.assignedWiiEmail;
  const createdMac = requisition.itHrmsDetails?.verifiedMacAddress || requisition.itHrmsDetails?.macAddress;
  const createdBioId = requisition.itHrmsDetails?.assignedBiometricId || requisition.applicant.biometricId;
  const createdHrmsCode = requisition.itHrmsDetails?.assignedHrmsEmpCode || (requisition.status === 'approved_provisioned' ? 'WII-EMP-2026-894' : undefined);
  const approvedLabPasses = requisition.labAccessDetails?.filter((l) => l.selected && l.nodalApprovalStatus === 'approved') || [];

  // Determine requested service scope flags
  const hasItHrmsDetails = Boolean(requisition.itHrmsDetails);
  const selectedKey = requisition.selectedServiceKey;

  const isEmailRequested = selectedKey
    ? selectedKey === 'email'
    : hasItHrmsDetails
    ? Boolean(requisition.itHrmsDetails?.requestEmail)
    : Boolean(
        requisition.serviceScope === 'email' ||
        requisition.serviceScope === 'combined' ||
        (requisition.serviceName && requisition.serviceName.toLowerCase().includes('email'))
      );

  const isInternetRequested = selectedKey
    ? selectedKey === 'internet'
    : hasItHrmsDetails
    ? Boolean(requisition.itHrmsDetails?.requestInternet)
    : Boolean(
        requisition.serviceScope === 'mac' ||
        requisition.serviceScope === 'combined' ||
        (requisition.serviceName &&
          (requisition.serviceName.toLowerCase().includes('wifi') ||
            requisition.serviceName.toLowerCase().includes('internet') ||
            requisition.serviceName.toLowerCase().includes('mac')))
      );

  const isBiometricRequested = selectedKey
    ? selectedKey === 'biometric'
    : hasItHrmsDetails
    ? Boolean(requisition.itHrmsDetails?.requestBiometric)
    : Boolean(
        requisition.serviceName && requisition.serviceName.toLowerCase().includes('biometric')
      );

  const isHrmsRequested = selectedKey
    ? selectedKey === 'hrms'
    : hasItHrmsDetails
    ? Boolean(requisition.itHrmsDetails?.requestHrmsPms)
    : Boolean(
        requisition.serviceScope === 'hrms' ||
        requisition.serviceScope === 'combined' ||
        (requisition.serviceName &&
          (requisition.serviceName.toLowerCase().includes('hrms') ||
            requisition.serviceName.toLowerCase().includes('pms')))
      );

  const hasLabDetails = selectedKey
    ? selectedKey === 'lab' || selectedKey.startsWith('lab-')
    : Boolean(
        requisition.labAccessDetails &&
        requisition.labAccessDetails.length > 0 &&
        requisition.labAccessDetails.some((l) => l.selected)
      );

  // Check if this is an HRMS/PMS Fresh Registration forwarded from IT Head to Manager stage
  const isHrmsPmsRequest =
    Boolean(requisition.itHrmsDetails?.requestHrmsPms) ||
    Boolean(requisition.itHrmsDetails?.requestBiometric) ||
    requisition.type === 'IT_HRMS';
  const isFreshRegistration = requisition.itHrmsDetails?.requisitionMode !== 'renewal';
  const isAtManagerStage = requisition.status === 'in_tech_verification';
  const showManagerStageNotice = isHrmsPmsRequest && isFreshRegistration && isAtManagerStage;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* 1. Theme-Matched Top Header Navigation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shadow-2xs shrink-0"
            title="Back to List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-extrabold font-mono text-white tracking-wide">
                {getRequisitionRefId(requisition)}
              </h1>
              <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {getRequisitionServiceName(requisition)}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Applicant: <strong className="text-white font-semibold">{requisition.applicant.applicantName}</strong> ({requisition.applicant.designation}) • Submitted {new Date(requisition.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* STATUS BADGE (Replaced Role pill as requested) */}
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-2xs ${
              requisition.status === 'approved_provisioned'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : requisition.status === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            {requisition.status === 'approved_provisioned' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : requisition.status === 'rejected' ? (
              <XCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400" />
            )}
            {requisition.status === 'submitted_pending_pi'
              ? 'Pending PI Approval'
              : requisition.status === 'in_lab_review'
              ? 'Lab Nodal Clearance'
              : requisition.status === 'pending_section_head'
              ? 'Section Head Review'
              : requisition.status === 'in_tech_verification'
              ? 'Technical Provisioning'
              : requisition.status === 'approved_provisioned'
              ? 'Active & Provisioned'
              : requisition.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* 2. Workflow Progress Stepper 바로 below header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Requisition Approval & Provisioning Workflow
          </h2>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIdx > idx || requisition.status === 'approved_provisioned';
            const isCurrent = currentStepIdx === idx && requisition.status !== 'approved_provisioned';
            const isRejected = requisition.status === 'rejected';

            return (
              <div
                key={step.key}
                className={`p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : isCurrent
                    ? 'bg-blue-50/70 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20 text-blue-950 dark:text-blue-100'
                    : isRejected
                    ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span>Step {idx + 1}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      <Clock className="w-3.5 h-3.5 animate-pulse" /> Forwarded
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                      Forwarding Awaited
                    </span>
                  )}
                </div>
                <div className="font-semibold text-xs leading-tight">{step.title}</div>
                <div className="text-[10px] opacity-80 mt-1 truncate">{step.actor}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* HRMS/PMS Fresh Registration Notice - ONLY shown when application is forwarded from IT Head to Manager stage */}
      {showManagerStageNotice && (
        <div className="bg-amber-50/90 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700/80 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong className="font-bold text-amber-950 dark:text-amber-100 text-sm block mb-0.5">
              Action Required at Manager Stage:
            </strong>
            When your requisition status reaches the <strong className="font-bold text-amber-950 dark:text-amber-100">Manager stage</strong>, please visit the <strong className="font-bold text-amber-950 dark:text-amber-100">IT Cell in person</strong> for Face Registration & Biometric Enrollment.
          </div>
        </div>
      )}

      {/* 3. TWO-COLUMN ROW matching image.png design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (lg:col-span-7): Applicant Personal Record */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* APPLICANT PERSONAL & INSTITUTIONAL MASTER RECORD */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              APPLICANT PERSONAL & INSTITUTIONAL MASTER RECORD
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              {/* Box 1: Applicant Name */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                  <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>Applicant Name</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {requisition.applicant.applicantName}
                </div>
              </div>

              {/* Box 2: Designation */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Designation</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {requisition.applicant.designation}
                </div>
              </div>

              {/* Box 3: Department / Cell */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                  <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Department / Cell</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-snug">
                  {requisition.applicant.departmentCellProject}
                </div>
              </div>

              {/* Box 4: Supervising Officer / PI */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                  <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Supervising Officer / PI</span>
                </div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {requisition.applicant.supervisingOfficerName || 'Dr. R. K. Singh'}
                </div>
              </div>

              {/* Box 5: Contact Mobile & Email */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Contact Mobile & Email</span>
                </div>
                <div className="font-mono text-slate-800 dark:text-slate-200 text-[11px]">
                  {requisition.applicant.mobileNo}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {requisition.applicant.personalEmail}
                </div>
              </div>

              {/* Box 6: Valid Up To */}
              <div className="bg-slate-50/70 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                  <Calendar className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Valid Up To</span>
                </div>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                  {requisition.applicant.validUpTo || '2028-01-31'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Official WII Pass Validity
                </div>
              </div>
            </div>
          </div>

          {/* REQUESTED IT & HRMS TECHNICAL SPECIFICATIONS */}
          {(() => {
            return (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Requested IT & HRMS Technical Specifications
                    </h3>
                  </div>
                  {/* Role & Privacy Indicator */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    {isApplicantView ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                        Applicant View: User ID & Secrets Accessible
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {currentRole.toUpperCase()} View: User ID Only (Passwords Protected)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* 1. Official WII Email Account */}
                  {isEmailRequested && (
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-800/80 space-y-2">
                      <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/50 pb-2">
                        <span className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          Official WII Email Account
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          createdEmail ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {createdEmail ? 'Active' : 'Requested'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">User ID / Allotted Email:</span>
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 mt-0.5">
                            <span className="truncate">
                              {createdEmail || `${requisition.applicant.applicantName.toLowerCase().replace(/[^a-z]/g, '.')}@wii.gov.in`}
                            </span>
                            <button
                              onClick={() => handleCopy(createdEmail || `${requisition.applicant.applicantName.toLowerCase().replace(/[^a-z]/g, '.')}@wii.gov.in`, 'email')}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy User ID"
                            >
                              {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Mailbox Password:</span>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs mt-0.5">
                            {isApplicantView ? (
                              <>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {showEmailPass ? (requisition.itHrmsDetails?.assignedEmailPassword || 'WII@2026#PassKey') : '••••••••••••'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setShowEmailPass(!showEmailPass)}
                                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {showEmailPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleCopy(requisition.itHrmsDetails?.assignedEmailPassword || 'WII@2026#PassKey', 'emailPass')}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {copiedKey === 'emailPass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1.5 italic">
                                <Lock className="w-3 h-3 text-amber-500" /> Protected (Visible to Applicant Only)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. LAN / Wi-Fi Registered MAC */}
                  {isInternetRequested && (
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
                      <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/50 pb-2">
                        <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          LAN / Wi-Fi Registered MAC
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          createdMac ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {createdMac ? 'Whitelisted' : 'Requested'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Whitelisted MAC Address / ID:</span>
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 mt-0.5">
                            <span>{createdMac || 'FC:FB:FB:12:34:56'}</span>
                            <button
                              onClick={() => handleCopy(createdMac || 'FC:FB:FB:12:34:56', 'mac')}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy MAC Address"
                            >
                              {copiedKey === 'mac' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Wi-Fi WPA2 Security Key:</span>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs mt-0.5">
                            {isApplicantView ? (
                              <>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {showWifiKey ? (requisition.itHrmsDetails?.wifiAccessKey || 'WII-WiFi#Sec8912') : '••••••••••••'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setShowWifiKey(!showWifiKey)}
                                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {showWifiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleCopy(requisition.itHrmsDetails?.wifiAccessKey || 'WII-WiFi#Sec8912', 'wifiKey')}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {copiedKey === 'wifiKey' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1.5 italic">
                                <Lock className="w-3 h-3 text-amber-500" /> Protected (Visible to Applicant Only)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Biometric & Gate Attendance */}
                  {isBiometricRequested && (
                    <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3.5 rounded-xl border border-purple-200/80 dark:border-purple-800/80 space-y-2">
                      <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/50 pb-2">
                        <span className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                          <Fingerprint className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          Biometric Attendance ID
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          createdBioId ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {createdBioId ? 'Enrolled' : 'Requested'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Allotted Biometric Punch ID:</span>
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 mt-0.5">
                            <span>{createdBioId || 'WII-BIO-1088'}</span>
                            <button
                              onClick={() => handleCopy(createdBioId || 'WII-BIO-1088', 'bio')}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy Punch ID"
                            >
                              {copiedKey === 'bio' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Biometric Security PIN:</span>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs mt-0.5">
                            {isApplicantView ? (
                              <>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {showBiometricPin ? (requisition.itHrmsDetails?.biometricPin || '4091') : '••••'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setShowBiometricPin(!showBiometricPin)}
                                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {showBiometricPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleCopy(requisition.itHrmsDetails?.biometricPin || '4091', 'bioPin')}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {copiedKey === 'bioPin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1.5 italic">
                                <Lock className="w-3 h-3 text-amber-500" /> Protected (Visible to Applicant Only)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. HRMS ERP Employee Account */}
                  {isHrmsRequested && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-800/80 space-y-2">
                      <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-900/50 pb-2">
                        <span className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          HRMS ERP Portal Code
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          createdHrmsCode ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {createdHrmsCode ? 'Active' : 'Requested'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Allotted HRMS Emp Code / User ID:</span>
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1 mt-0.5">
                            <span>{createdHrmsCode || 'WII-EMP-2026-894'}</span>
                            <button
                              onClick={() => handleCopy(createdHrmsCode || 'WII-EMP-2026-894', 'hrmsCode')}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              title="Copy Emp Code"
                            >
                              {copiedKey === 'hrmsCode' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">HRMS ERP Passcode:</span>
                          <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs mt-0.5">
                            {isApplicantView ? (
                              <>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                  {showHrmsPass ? (requisition.itHrmsDetails?.hrmsPassword || 'Hrms#2026Secret') : '••••••••••••'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setShowHrmsPass(!showHrmsPass)}
                                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {showHrmsPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleCopy(requisition.itHrmsDetails?.hrmsPassword || 'Hrms#2026Secret', 'hrmsPass')}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    {copiedKey === 'hrmsPass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1.5 italic">
                                <Lock className="w-3 h-3 text-amber-500" /> Protected (Visible to Applicant Only)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback Notice if no IT/HRMS cards match */}
                  {!isEmailRequested && !isInternetRequested && !isBiometricRequested && !isHrmsRequested && !hasLabDetails && (
                    <div className="col-span-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs italic text-center">
                      No specific technical specifications or lab access requested for this requisition scope ({getRequisitionServiceName(requisition)}).
                    </div>
                  )}
                </div>

                {/* Research Lab Facilities if present */}
                {hasLabDetails && requisition.labAccessDetails && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Requested Research Labs & Facilities
                    </span>
                    <div className="space-y-2">
                      {requisition.labAccessDetails.map((lab) => (
                        <div key={lab.labId} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap justify-between items-center gap-2">
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{lab.labName}</div>
                            <div className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                              Equipment: {lab.purposeEquipment} • Tenure: {lab.fromDate} to {lab.toDate}
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                            lab.nodalApprovalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {lab.nodalApprovalStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* RIGHT COLUMN (lg:col-span-5): Officer Action Desk + Audit Trail & Workflow History */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* OFFICER ACTION DESK (Only shown to Officers when action is required for their active stage) */}
          {currentRole !== 'applicant' && requisition.status !== 'approved_provisioned' && requisition.status !== 'rejected' && (
            canCurrentRoleAct(requisition, currentRole) ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Officer Approval & Review Desk</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Action required for <strong className="text-emerald-600 dark:text-emerald-400 uppercase">{currentRole}</strong></p>
                  </div>
                </div>

                {/* Technical Provisioning Inputs if IT or HRMS Manager and service is requested */}
                {(() => {
                  const showEmailInput = (currentRole === 'it_officer' || currentRole === 'admin') && isEmailRequested;
                  const showMacInput = (currentRole === 'it_officer' || currentRole === 'admin') && isInternetRequested;
                  const showBioInput = (currentRole === 'hrms_officer' || currentRole === 'admin') && isBiometricRequested;
                  const showHrmsInput = (currentRole === 'hrms_officer' || currentRole === 'admin') && isHrmsRequested;

                  const showProvisioningSection = showEmailInput || showMacInput || showBioInput || showHrmsInput;

                  if (!showProvisioningSection) return null;

                  return (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block border-b border-slate-200 dark:border-slate-700 pb-1">
                        System Account Provisioning
                      </span>

                      {showEmailInput && (
                        <div>
                          <label className="text-[10px] text-slate-600 dark:text-slate-300 font-medium block mb-0.5">Assigned WII Email</label>
                          <input
                            type="text"
                            value={provWiiEmail}
                            onChange={(e) => setProvWiiEmail(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      )}

                      {showMacInput && (
                        <div>
                          <label className="text-[10px] text-slate-600 dark:text-slate-300 font-medium block mb-0.5">Verified Hardware MAC</label>
                          <input
                            type="text"
                            value={provMac}
                            onChange={(e) => setProvMac(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      )}

                      {showBioInput && (
                        <div>
                          <label className="text-[10px] text-slate-600 dark:text-slate-300 font-medium block mb-0.5">Biometric Attendance ID</label>
                          <input
                            type="text"
                            value={provBioId}
                            onChange={(e) => setProvBioId(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      )}

                      {showHrmsInput && (
                        <div>
                          <label className="text-[10px] text-slate-600 dark:text-slate-300 font-medium block mb-0.5">HRMS Employee Code</label>
                          <input
                            type="text"
                            value={provHrmsCode}
                            onChange={(e) => setProvHrmsCode(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Remarks Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">Officer Remarks & Findings</label>
                  <textarea
                    value={officerComments}
                    onChange={(e) => setOfficerComments(e.target.value)}
                    placeholder="Enter endorsement notes, verification findings, or rejection reasons..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Digital Signature Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">Digital Signature Sign-off</label>
                  <input
                    type="text"
                    value={officerSign}
                    onChange={(e) => setOfficerSign(e.target.value)}
                    placeholder="Type your full name as Digital Sign-off..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleOfficerAction('reject')}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleOfficerAction('approve')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Endorse & Advance
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Info className="w-4 h-4 text-blue-500" />
                  Read-Only Workflow Tracking Mode
                </div>
                <p className="text-[11px] leading-relaxed">
                  This requisition is currently at stage: <strong className="text-blue-600 dark:text-blue-400 uppercase">{requisition.status.replace(/_/g, ' ')}</strong>. Action is currently pending with the designated officer for that stage.
                </p>
              </div>
            )
          )}

          {/* AUDIT TRAIL & WORKFLOW HISTORY CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              AUDIT TRAIL & WORKFLOW HISTORY
            </h3>

            <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-5 text-xs">
              {requisition.history.map((event) => (
                <div key={event.id} className="relative group">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-emerald-100 dark:border-emerald-900" />
                  <div className="text-[10px] font-mono text-slate-400">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {event.actorName} <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">({event.actorRole})</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-1 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
                    {event.comments || event.actionType}
                  </p>
                  {event.digitalSignature && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 italic font-serif mt-1">
                      Signed: {event.digitalSignature}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Official Form Replica Modal */}
      {showReplicaModal && (
        <OfficialFormReplica requisition={requisition} onClose={() => setShowReplicaModal(false)} />
      )}
    </div>
  );
};
