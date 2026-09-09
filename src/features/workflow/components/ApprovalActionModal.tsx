import React, { useState } from 'react';
import { RequisitionRecord, UserRole } from "@/types";
import { findFacility } from '@/lib/storage';
import {
  executeWorkflowAction,
} from '@/api/workflow.api';
import {
  getRequisition,
} from '@/api/requisitions.api';
import { CheckCircle2, XCircle, ShieldCheck, Mail, Lock, X } from 'lucide-react';

interface ApprovalActionModalProps {
  requisition: RequisitionRecord;
  currentRole: UserRole;
  initialDecision?: 'approve' | 'reject' | 'deactivate';
  onClose: () => void;
  onSaveAction: (updated: RequisitionRecord) => void;
}

export const ApprovalActionModal: React.FC<ApprovalActionModalProps> = ({
  requisition,
  currentRole,
  initialDecision = 'approve',
  onClose,
  onSaveAction,
}) => {
  const [comments, setComments] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | 'deactivate'>(initialDecision);

  // IT Officer / Manager provisioning state inputs
  const [assignedEmail, setAssignedEmail] = useState(
    requisition.itHrmsDetails?.assignedWiiEmail ||
      `${requisition.applicant.applicantName.toLowerCase().replace(/\s+/g, '.')}@wii.gov.in`
  );
  const [verifiedMac, setVerifiedMac] = useState(
    requisition.itHrmsDetails?.verifiedMacAddress || requisition.itHrmsDetails?.macAddress || ''
  );
  const [assignedBioId, setAssignedBioId] = useState(
    requisition.itHrmsDetails?.assignedBiometricId ||
      requisition.applicant.biometricId ||
      `WII-BIO-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Lab Nodal state per lab
  const [labComments, setLabComments] = useState<Record<string, string>>({});

  const handleExecuteAction = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    try {
      const selectedLabs =
        requisition.labAccessDetails || [];

      const labFacilities =
        currentRole === "lab_nodal" ||
        currentRole === "assoc_lab_nodal"
          ? selectedLabs
              .filter((lab) => lab.selected)
              .map((lab) => ({
                facilityId: lab.labId,
                facilityName: lab.labName,
                purposeEquipment:
                  lab.purposeEquipment || null,
                fromDate:
                  lab.fromDate || null,
                toDate:
                  lab.toDate || null,
                hasBiometricId:
                  lab.hasBiometricId || false,
                biometricIdNumber:
                  lab.biometricIdNumber || null,
                assignedLabPassId:
                  lab.assignedLabPassId || null,
                nodalApprovalStatus:
                  decision === "approve"
                    ? "approved" as const
                    : "rejected" as const,
                remarks:
                  labComments[lab.labId] ||
                  comments ||
                  null,
                reviewedById: null,
                reviewedBy:
                  currentRole === "assoc_lab_nodal"
                    ? "Associate Nodal Officer"
                    : "Lab Nodal Officer",
                reviewedAt:
                  new Date().toISOString(),
                nodalOfficerName:
                  lab.nodalOfficerName || null,
                actionDate:
                  new Date()
                    .toISOString()
                    .split("T")[0],
              }))
          : undefined;

      const result =
        await executeWorkflowAction(
          requisition.id,
          {
            action:
              decision === "approve"
                ? "approve"
                : decision === "reject"
                ? "reject"
                : "deactivate",

            comments:
              comments ||
              null,

            labFacilities,

            provisionedEmail:
              decision === "approve" &&
              (
                currentRole === "it_officer" ||
                currentRole === "hrms_officer" ||
                currentRole === "admin"
              )
                ? assignedEmail
                : undefined,

            provisionedMac:
              decision === "approve" &&
              (
                currentRole === "it_officer" ||
                currentRole === "hrms_officer" ||
                currentRole === "admin"
              )
                ? verifiedMac
                : undefined,

            provisionedHrmsId:
              decision === "approve" &&
              (
                currentRole === "it_officer" ||
                currentRole === "hrms_officer" ||
                currentRole === "admin"
              )
                ? undefined
                : undefined,

            provisionedBiometricId:
              decision === "approve" &&
              (
                currentRole === "it_officer" ||
                currentRole === "hrms_officer" ||
                currentRole === "admin"
              )
                ? assignedBioId
                : undefined,
          },
        );

      // Reload the authoritative DB record after workflow action.
      const refreshed =
        await getRequisition(
          requisition.id,
        );

      onSaveAction(
        refreshed.requisition,
      );

      window.alert(
        result.message ||
          "Workflow action completed successfully.",
      );

      onClose();
    } catch (error) {
      console.error(
        "Workflow action failed:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to complete workflow action.",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 z-50 animate-fade-in overflow-hidden">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between shrink-0 min-w-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 bg-emerald-600 rounded-lg text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-base font-bold leading-tight truncate">
                Workflow Action Panel — {currentRole.replace('_', ' ').toUpperCase()}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-300 truncate mt-0.5">
                Requisition ID: <span className="font-mono text-emerald-400 font-bold">{requisition.id}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleExecuteAction} className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs overflow-y-auto flex-1 min-h-0 min-w-0">
          {/* Applicant Summary */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Applicant</span>
              <span className="font-bold text-slate-800 text-sm block truncate">{requisition.applicant.applicantName}</span>
              <span className="text-slate-500 block truncate">
                {requisition.applicant.designation} ({requisition.applicant.departmentCellProject})
              </span>
            </div>
            <div className="sm:text-right min-w-0">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">PI / Supervisor</span>
              <span className="font-semibold text-slate-800 block truncate">{requisition.applicant.supervisingOfficerName}</span>
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Select Approval / Action Decision:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision('approve')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  decision === 'approve'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Approve / Activate</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('deactivate')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  decision === 'deactivate'
                    ? 'bg-slate-200 border-slate-500 text-slate-900 ring-2 ring-slate-400/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Deactivate</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('reject')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                  decision === 'reject'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* IT Technical Officer / Manager Provisioning Controls */}
          {(currentRole === 'it_officer' || currentRole === 'hrms_officer' || currentRole === 'admin') && decision === 'approve' && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                <Mail className="w-4 h-4 text-blue-600" />
                Technical Provisioning Details & Resource Allocation
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Official Email</label>
                  <input
                    type="email"
                    value={assignedEmail}
                    onChange={(e) => setAssignedEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                    placeholder="username@wii.gov.in"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registered MAC Address</label>
                  <input
                    type="text"
                    value={verifiedMac}
                    onChange={(e) => setVerifiedMac(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                    placeholder="XX:XX:XX:XX:XX:XX"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Biometric ID</label>
                  <input
                    type="text"
                    value={assignedBioId}
                    onChange={(e) => setAssignedBioId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                    placeholder="WII-BIO-1088"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Comments and remarks */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Official Remarks & Officer Comments *</label>
            <textarea
              required
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter official approval notes, equipment slot allocation details, or rejection grounds..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-lg text-white font-bold transition-all shadow-xs ${
                decision === 'approve' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm & Save Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
