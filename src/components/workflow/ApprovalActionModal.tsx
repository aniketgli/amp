import React, { useState } from 'react';
import { RequisitionRecord, UserRole } from '../../types/requisition';
import { findFacility } from '../../utils/storage';
import { CheckCircle2, XCircle, ShieldCheck, Mail, Wifi, Fingerprint, Lock, X } from 'lucide-react';

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

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const copy: RequisitionRecord = JSON.parse(JSON.stringify(requisition));

    let effectiveRole = currentRole;
    if (currentRole === 'admin') {
      if (requisition.status === 'submitted_pending_pi') effectiveRole = 'supervisor';
      else if (requisition.status === 'in_lab_review') effectiveRole = 'lab_nodal';
      else if (requisition.status === 'pending_section_head') effectiveRole = 'section_head';
      else if (requisition.status === 'in_tech_verification') effectiveRole = 'it_officer';
      else effectiveRole = 'it_officer';
    }

    if (decision === 'deactivate') {
      copy.status = 'deactivated';
      copy.history.push({
        id: `h_${Date.now()}`,
        actorRole: currentRole,
        actorName: currentRole === 'admin' ? 'System Administrator' : 'Access Manager',
        actionType: 'deactivate',
        comments: comments || 'Access deactivated by Manager.',
        timestamp: now,
      });
    } else if (effectiveRole === 'supervisor') {
      copy.piApproval = {
        status: decision === 'approve' ? 'approved' : 'rejected',
        officerName: currentRole === 'admin' ? 'System Administrator (Override)' : 'Dr. R. K. Singh',
        comments: comments || (decision === 'approve' ? 'Approved as PI.' : 'Rejected by PI.'),
        timestamp: now,
        signature: currentRole === 'admin' ? 'Administrator Override Sign' : 'Dr. R. K. Singh (Digital Sign)',
      };

      if (decision === 'approve') {
        const hasLab = copy.type === 'LAB_FACILITY' || (copy.type === 'COMBINED' && copy.labAccessDetails && copy.labAccessDetails.some((l) => l.selected));
        copy.status = hasLab ? 'in_lab_review' : 'pending_section_head';
      } else {
        copy.status = 'rejected';
      }

      copy.history.push({
        id: `h_${Date.now()}`,
        actorRole: currentRole,
        actorName: currentRole === 'admin' ? 'System Administrator' : 'Dr. R. K. Singh',
        actionType: decision === 'approve' ? 'pi_approve' : 'pi_reject',
        comments,
        timestamp: now,
      });
    } else if (effectiveRole === 'lab_nodal' || effectiveRole === 'assoc_lab_nodal') {
      if (copy.labAccessDetails) {
        copy.labAccessDetails = copy.labAccessDetails.map((lab) => {
          if (lab.selected) {
            const fac = findFacility(lab.labId) || findFacility(lab.labName);
            return {
              ...lab,
              nodalApprovalStatus: decision === 'approve' ? 'approved' : 'rejected',
              nodalComments: labComments[lab.labId] || comments || 'Lab access granted.',
              nodalOfficerName:
                currentRole === 'admin'
                  ? 'System Admin (Lab Override)'
                  : fac?.nodal || lab.nodalOfficerName || 'Dr. S. K. Gupta',
              actionDate: now,
            };
          }
          return lab;
        });
      }

      if (decision === 'approve') {
        copy.status = 'pending_section_head';
      } else {
        copy.status = 'rejected';
      }

      copy.history.push({
        id: `h_${Date.now()}`,
        actorRole: currentRole,
        actorName: currentRole === 'admin' ? 'System Administrator' : 'Dr. S. K. Gupta',
        actionType: decision === 'approve' ? 'lab_approve' : 'lab_reject',
        comments,
        timestamp: now,
      });
    } else if (effectiveRole === 'section_head') {
      copy.sectionHeadApproval = {
        status: decision === 'approve' ? 'approved' : 'rejected',
        officerName: currentRole === 'admin' ? 'System Admin (Override)' : 'Dr. Panna Lal',
        comments: comments || (decision === 'approve' ? 'Authorized by Section Head.' : 'Rejected.'),
        timestamp: now,
        signature: currentRole === 'admin' ? 'System Admin Digital Sign' : 'Dr. Panna Lal (Section Head, IT Cell)',
      };

      if (decision === 'approve') {
        const hasIT = copy.type === 'IT_HRMS' || copy.type === 'COMBINED';
        copy.status = hasIT ? 'in_tech_verification' : 'approved_provisioned';
      } else {
        copy.status = 'rejected';
      }

      copy.history.push({
        id: `h_${Date.now()}`,
        actorRole: currentRole,
        actorName: currentRole === 'admin' ? 'System Administrator' : 'Dr. Panna Lal',
        actionType: decision === 'approve' ? 'section_head_authorize' : 'reject',
        comments,
        timestamp: now,
      });
    } else {
      // it_officer / hrms_officer / manager
      if (!copy.itCellVerification) copy.itCellVerification = {};
      copy.itCellVerification.emailNetOfficer = {
        officerName: 'Mr. Dinesh Singh Pundir',
        status: decision === 'approve' ? 'verified' : 'rejected',
        comments: comments || 'Email & Internet verified and provisioned.',
        timestamp: now,
      };

      if (copy.itHrmsDetails) {
        copy.itHrmsDetails.assignedWiiEmail = assignedEmail;
        copy.itHrmsDetails.verifiedMacAddress = verifiedMac;
        copy.itHrmsDetails.assignedBiometricId = assignedBioId;
        copy.itHrmsDetails.hrmsAccessGranted = decision === 'approve';
      }

      if (decision === 'reject') {
        copy.status = 'rejected';
      } else {
        copy.status = 'approved_provisioned';
      }

      copy.history.push({
        id: `h_${Date.now()}`,
        actorRole: currentRole,
        actorName: currentRole === 'admin' ? 'System Administrator' : 'Mr. Dinesh Singh Pundir',
        actionType: 'tech_provision',
        comments: `Assigned Email: ${assignedEmail}, Verified MAC: ${verifiedMac}, Bio ID: ${assignedBioId}. ${comments}`,
        timestamp: now,
      });
    }

    copy.updatedAt = now;
    onSaveAction(copy);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Workflow Action Panel — {currentRole.replace('_', ' ').toUpperCase()}
              </h3>
              <p className="text-xs text-slate-300">
                Requisition ID: <span className="font-mono text-emerald-400 font-bold">{requisition.id}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleExecuteAction} className="p-6 space-y-5 text-xs">
          {/* Applicant Summary */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap justify-between gap-2">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Applicant</span>
              <span className="font-bold text-slate-800 text-sm">{requisition.applicant.applicantName}</span>
              <span className="text-slate-500 block">
                {requisition.applicant.designation} ({requisition.applicant.departmentCellProject})
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">PI / Supervisor</span>
              <span className="font-semibold text-slate-800">{requisition.applicant.supervisingOfficerName}</span>
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Select Approval / Action Decision:</label>
            <div className="grid grid-cols-3 gap-2">
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
