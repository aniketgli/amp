import React, { useState } from 'react';
import {
  ApplicantProfile,
  ITHrmsDetails,
  LabFacilitySelection,
  RequisitionRecord,
  RequisitionType,
} from '../../types/requisition';
import { generateRequisitionId } from '../../utils/storage';
import { ProfileForm } from '../applicant/UserProfilePage';
import { ITHrmsForm } from './ITHrmsForm';
import { LabAccessForm } from './LabAccessForm';
import {
  FileCheck,
  Send,
  Layers,
  ShieldCheck,
  Building,
  CheckCircle2,
  Lock,
  ArrowLeft,
  RotateCw,
  PlusCircle,
  BadgeCheck,
} from 'lucide-react';

interface CombinedWizardProps {
  applicantProfile: ApplicantProfile;
  onSaveProfile: (profile: ApplicantProfile) => void;
  onSubmitRequisition: (requisition: RequisitionRecord) => void;
  onCancel: () => void;
  initialReqType?: RequisitionType;
  initialMode?: 'new' | 'renewal';
}

export const CombinedWizard: React.FC<CombinedWizardProps> = ({
  applicantProfile,
  onSaveProfile,
  onSubmitRequisition,
  onCancel,
  initialReqType = 'COMBINED',
  initialMode = 'new',
}) => {
  const [reqType, setReqType] = useState<RequisitionType>(initialReqType);
  const [activeStep, setActiveStep] = useState<number>(2); // Default to Step 2 Services Selection if profile exists

  // Local state for requisition details
  const [itHrmsDetails, setItHrmsDetails] = useState<ITHrmsDetails>({
    requisitionMode: initialMode,
    renewalReason: initialMode === 'renewal' ? 'Requesting extension for active project tenure 2026-2027' : '',
    requestEmail: true,
    requestedEmailGroups: ['All Staff', 'Researchers & Fellows'],
    requestInternet: true,
    deviceType: 'Laptop / Workstation',
    macAddress: '3C:D9:2B:1A:0F:8E',
    requestHrmsPms: true,
    requestBiometric: true,
  });

  const [labSelections, setLabSelections] = useState<LabFacilitySelection[]>([]);
  const [digitalSignature, setDigitalSignature] = useState<string>(applicantProfile.applicantName);
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!declarationAccepted) {
      alert('Please accept the official Institute Declaration to proceed.');
      return;
    }

    const newId = generateRequisitionId();
    const now = new Date().toISOString();

    const selectedLabsOnly = labSelections.filter((l) => l.selected);

    const newRequisition: RequisitionRecord = {
      id: newId,
      type: reqType,
      status: 'submitted_pending_pi',
      createdAt: now,
      updatedAt: now,
      applicant: { ...applicantProfile },
      itHrmsDetails: reqType === 'LAB_FACILITY' ? undefined : itHrmsDetails,
      labAccessDetails: reqType === 'IT_HRMS' ? undefined : selectedLabsOnly,
      history: [
        {
          id: `h_${Date.now()}`,
          actorRole: 'applicant',
          actorName: applicantProfile.applicantName,
          actionType: 'submit',
          comments: `Requisition submitted electronically for ${reqType} services (${initialMode.toUpperCase()} mode). Pending Supervising Officer (${applicantProfile.supervisingOfficerName}) approval.`,
          timestamp: now,
          digitalSignature,
        },
      ],
    };

    onSubmitRequisition(newRequisition);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Back & Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer border border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            Back to My Access & Services
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              WII Official Requisition
            </span>
            <span className="text-xs font-bold text-slate-500">
              Mode: {initialMode === 'renewal' ? 'Tenure Extension / Renewal' : 'New Service Requisition'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              {initialMode === 'renewal' ? (
                <>
                  <RotateCw className="w-5 h-5 text-blue-600" />
                  Service Access Renewal & Extension Form
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  New Access & Facilities Service Requisition
                </>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in your required service details below for Email, Campus Internet MAC, HRMS/PMS, or Research Lab passes.
            </p>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveStep(1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStep === 1
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Profile Verification
            </button>
            <button
              onClick={() => setActiveStep(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStep === 2
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Service Selection
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStep === 3
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Review & Declaration
            </button>
          </div>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
          Select Requisition Scope:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setReqType('COMBINED')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              reqType === 'COMBINED'
                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">Combined Scope</div>
              <div className="text-[11px] text-slate-500">Email, Net, HRMS/PMS + Research Labs</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setReqType('IT_HRMS')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              reqType === 'IT_HRMS'
                ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">Email, Net, HRMS / PMS</div>
              <div className="text-[11px] text-slate-500">Form 2 Only (IT Cell Services)</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setReqType('LAB_FACILITY')}
            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
              reqType === 'LAB_FACILITY'
                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Building className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">Research Lab Access</div>
              <div className="text-[11px] text-slate-500">Form 1 Only (9 Research Labs)</div>
            </div>
          </button>
        </div>
      </div>

      {/* STEP 1: Applicant Profile Master */}
      {activeStep === 1 && (
        <div className="space-y-4">
          <ProfileForm initialProfile={applicantProfile} onSaveProfile={onSaveProfile} />
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel & Return
            </button>
            <button
              onClick={() => setActiveStep(2)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Proceed to Service Configuration →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Service Configuration Forms */}
      {activeStep === 2 && (
        <div className="space-y-6">
          {(reqType === 'IT_HRMS' || reqType === 'COMBINED') && (
            <ITHrmsForm value={itHrmsDetails} onChange={setItHrmsDetails} />
          )}

          {(reqType === 'LAB_FACILITY' || reqType === 'COMBINED') && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                Research Laboratory & Facility Access Selection
              </h3>
              <LabAccessForm labs={labSelections} onChange={setLabSelections} />
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setActiveStep(1)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              ← Back to Profile
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Proceed to Review & Declaration →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Declaration & Digital Signature */}
      {activeStep === 3 && (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-600" />
              Requisition Summary Review
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Name & Designation</span>
                <span className="font-extrabold text-slate-900 block">{applicantProfile.applicantName}</span>
                <span className="text-slate-600 block text-[11px]">{applicantProfile.designation}</span>
                <div className="pt-1 mt-1 border-t border-slate-100 flex items-center gap-1 text-[10px]">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Valid Up To:</span>
                  <span className="font-bold text-slate-800">{applicantProfile.validUpTo || '31-Jan-2028'}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-0.5">
                <span className="text-slate-400 block text-[9px] font-bold uppercase tracking-wider">Project / Dept / Cell & Reporting Officer / PI</span>
                <span className="font-semibold text-slate-800 block text-[11px]">{applicantProfile.departmentCellProject}</span>
                <span className="font-extrabold text-blue-900 block text-[11px]">{applicantProfile.supervisingOfficerName}</span>
              </div>
            </div>

            {/* Requested items bullet */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase mb-1">
                Requested Facilities & Services
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {(reqType === 'IT_HRMS' || reqType === 'COMBINED') && (
                  <>
                    {itHrmsDetails.requestEmail && (
                      <li>
                        WII Email ID Creation ({itHrmsDetails.requestedEmailGroups?.join(', ') || 'Default groups'})
                      </li>
                    )}
                    {itHrmsDetails.requestInternet && (
                      <li>
                        Campus Internet MAC Registration ({itHrmsDetails.deviceType} - MAC:{' '}
                        <code className="font-mono bg-slate-100 px-1 rounded">{itHrmsDetails.macAddress || 'TBD'}</code>)
                      </li>
                    )}
                    {itHrmsDetails.requestHrmsPms && <li>HRMS / PMS Portal Account Setup</li>}
                    {itHrmsDetails.requestBiometric && <li>Biometric Attendance & Gate Access ID</li>}
                  </>
                )}
                {(reqType === 'LAB_FACILITY' || reqType === 'COMBINED') && (
                  <>
                    {labSelections.filter((l) => l.selected).map((lab) => (
                      <li key={lab.labId}>
                        <span className="font-semibold">{lab.labName}</span> ({lab.fromDate} to {lab.toDate})
                      </li>
                    ))}
                    {labSelections.filter((l) => l.selected).length === 0 && (
                      <li className="text-slate-400 italic">No research labs selected.</li>
                    )}
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Official Instructions & Declaration Box */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 text-xs space-y-3">
            <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Official Declaration & Institute Terms
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
              <li>
                Institute Laboratories, Email, and IT facilities shall be used ONLY for authorized academic, research, and official purposes in accordance with WII SOPs and safety guidelines.
              </li>
              <li>
                On leaving WII or completion of tenure, Laboratory access and WII Email/HRMS logins will be deactivated. Important documents and data must be backed up prior to leaving.
              </li>
              <li>
                <strong>Declaration:</strong> I hereby certify that the information furnished in this form is true and correct to the best of my knowledge. I agree to abide by the applicable Rules, Policies, and Information Security Guidelines of the Wildlife Institute of India.
              </li>
            </ol>

            <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-800 focus:ring-emerald-400"
              />
              <span className="font-semibold text-white text-xs">
                I accept the declaration terms and affirm the accuracy of the details provided.
              </span>
            </label>
          </div>

          {/* Digital Signature */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Applicant Digital Signature / Full Legal Name *
            </label>
            <input
              type="text"
              required
              value={digitalSignature}
              onChange={(e) => setDigitalSignature(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-serif text-slate-800"
              placeholder="e.g. Dr. Ananya Sharma"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              ← Back to Services
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Submit Requisition Electronically
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
