import React from 'react';
import { RequisitionRecord } from '@/types/requisition';
import { Printer, Download, X, Building2, CheckCircle2 } from 'lucide-react';

interface OfficialFormReplicaProps {
  requisition: RequisitionRecord;
  onClose: () => void;
}

export const OfficialFormReplica: React.FC<OfficialFormReplicaProps> = ({ requisition, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const isLabForm = requisition.type === 'LAB_FACILITY' || requisition.type === 'COMBINED';
  const isItForm = requisition.type === 'IT_HRMS' || requisition.type === 'COMBINED';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden min-w-0">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-700 flex items-center justify-center text-white font-serif font-bold text-sm">
              WII
            </div>
            <div>
              <h3 className="text-sm font-bold">Official Registration Form Replica</h3>
              <p className="text-xs text-slate-300 font-mono">Requisition ID: {requisition.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto font-sans text-slate-900 bg-white space-y-8 print:p-0 print:overflow-visible">
          {/* ========================================================= */}
          {/* FORM 2 REPLICA: Email / Internet / HRMS / PMS Registration */}
          {/* ========================================================= */}
          {isItForm && (
            <div className="border border-slate-900 p-6 space-y-4 text-xs font-sans">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 border-2 border-slate-900 rounded-lg flex items-center justify-center font-serif font-black text-slate-900 text-lg">
                    WII
                  </div>
                  <div>
                    <div className="text-base font-bold tracking-tight text-slate-900 font-serif">
                      भारतीय वन्यजीव संस्थान
                    </div>
                    <div className="text-sm font-bold text-slate-900 font-serif">
                      Wildlife Institute of India
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold uppercase text-slate-900 tracking-wider">
                    REGISTRATION FORM
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    Email / Internet / HRMS / PMS
                  </div>
                </div>
              </div>

              {/* Grid Form Fields */}
              <table className="w-full border-collapse border border-slate-900 text-[11px] leading-tight">
                <tbody>
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80 w-1/4">
                      Name of the applicant
                    </td>
                    <td className="p-1.5 border-r border-slate-900 font-semibold w-1/4">
                      {requisition.applicant.applicantName}
                    </td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80 w-1/4">Gender</td>
                    <td className="p-1.5 font-semibold w-1/4">{requisition.applicant.gender}</td>
                  </tr>

                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Date of Birth</td>
                    <td className="p-1.5 border-r border-slate-900 font-mono">{requisition.applicant.dateOfBirth}</td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Blood Group</td>
                    <td className="p-1.5 font-bold">{requisition.applicant.bloodGroup}</td>
                  </tr>

                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Mobile No.</td>
                    <td className="p-1.5 border-r border-slate-900 font-mono">{requisition.applicant.mobileNo}</td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Personal Email</td>
                    <td className="p-1.5 font-mono">{requisition.applicant.personalEmail}</td>
                  </tr>

                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Account No. & Bank</td>
                    <td className="p-1.5 border-r border-slate-900">{requisition.applicant.accountNoBank}</td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">PAN No.</td>
                    <td className="p-1.5 font-mono uppercase font-bold">{requisition.applicant.panNo}</td>
                  </tr>

                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Designation</td>
                    <td className="p-1.5 border-r border-slate-900">{requisition.applicant.designation}</td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Date of Joining</td>
                    <td className="p-1.5 font-mono">{requisition.applicant.dateOfJoining}</td>
                  </tr>

                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Number of leaves per year</td>
                    <td className="p-1.5 border-r border-slate-900">{requisition.applicant.numberOfLeavesPerYear}</td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Valid Up to</td>
                    <td className="p-1.5 font-mono">{requisition.applicant.validUpTo}</td>
                  </tr>

                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Signature of applicant</td>
                    <td className="p-1.5 border-r border-slate-900 font-serif italic font-bold">
                      {requisition.history[0]?.digitalSignature || requisition.applicant.applicantName}
                    </td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Date</td>
                    <td className="p-1.5 font-mono">
                      {new Date(requisition.createdAt).toLocaleDateString()}
                    </td>
                  </tr>

                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">
                      Name of Department / Cell / Project
                    </td>
                    <td colSpan={3} className="p-1.5 font-bold">
                      {requisition.applicant.departmentCellProject}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">
                      Name of Supervising Officer / PI
                    </td>
                    <td className="p-1.5 border-r border-slate-900 font-semibold">
                      {requisition.applicant.supervisingOfficerName}
                    </td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">
                      Sign of Supervising Officer / PI
                    </td>
                    <td className="p-1.5 font-serif italic text-emerald-800 font-bold">
                      {requisition.piApproval?.status === 'approved'
                        ? requisition.piApproval.signature || 'Digitally Signed by PI'
                        : '[ Pending PI Sign ]'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* IT Cell Section */}
              <div className="border border-slate-900 p-2 space-y-2">
                <div className="font-extrabold uppercase underline text-slate-900">
                  IT, RS & GIS and Audio-Visual Cell use only:
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="font-bold border-b border-slate-400 pb-1">A. Email / Internet</div>
                  <table className="w-full border-collapse border border-slate-900">
                    <tbody>
                      <tr className="border-b border-slate-900">
                        <td className="p-1.5 font-bold border-r border-slate-900 w-1/4">WII Email id</td>
                        <td className="p-1.5 border-r border-slate-900 font-mono font-bold text-blue-900 w-1/4">
                          {requisition.itHrmsDetails?.assignedWiiEmail || '[ Unassigned ]'}
                        </td>
                        <td className="p-1.5 font-bold border-r border-slate-900 w-1/4">Email Groups</td>
                        <td className="p-1.5 text-[10px] w-1/4">
                          {requisition.itHrmsDetails?.assignedEmailGroups?.join(', ') ||
                            requisition.itHrmsDetails?.requestedEmailGroups?.join(', ') ||
                            'Standard Groups'}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold border-r border-slate-900">Device with MAC Address</td>
                        <td className="p-1.5 border-r border-slate-900 font-mono">
                          {requisition.itHrmsDetails?.verifiedMacAddress || requisition.itHrmsDetails?.macAddress || 'N/A'}
                        </td>
                        <td className="p-1.5 font-bold border-r border-slate-900">
                          Dinesh Singh Pundir,<br />
                          Senior Technical Officer – III
                        </td>
                        <td className="p-1.5 font-serif italic font-bold text-emerald-800">
                          {requisition.itCellVerification?.emailNetOfficer?.status === 'verified'
                            ? 'D. S. Pundir (Verified)'
                            : '[ Pending Tech Sign ]'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="font-bold border-b border-slate-400 pb-1 pt-1">
                    B. Biometric Access & HRMS / PMS
                  </div>
                  <table className="w-full border-collapse border border-slate-900">
                    <tbody>
                      <tr className="border-b border-slate-900">
                        <td className="p-1.5 font-bold border-r border-slate-900 w-1/4">Biometric – ID</td>
                        <td className="p-1.5 border-r border-slate-900 font-mono font-bold w-1/4">
                          {requisition.itHrmsDetails?.assignedBiometricId || requisition.applicant.biometricId || 'TBD'}
                        </td>
                        <td className="p-1.5 border-r border-slate-900 w-1/4 font-semibold">
                          Aniket Gupta, Technical Assistant
                        </td>
                        <td className="p-1.5 font-serif italic text-emerald-800 font-bold w-1/4">
                          {requisition.itCellVerification?.biometricOfficer?.status === 'verified'
                            ? 'Aniket Gupta'
                            : '[ Signed ]'}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold border-r border-slate-900">HRMS – PMS Access</td>
                        <td className="p-1.5 border-r border-slate-900 font-bold text-purple-900">
                          {requisition.itHrmsDetails?.hrmsAccessGranted ? 'GRANTED' : 'PENDING'}
                        </td>
                        <td className="p-1.5 border-r border-slate-900 font-semibold">
                          Harendra Kumar, Senior Technical Officer – III
                        </td>
                        <td className="p-1.5 font-serif italic text-emerald-800 font-bold">
                          {requisition.itCellVerification?.hrmsOfficer?.status === 'verified'
                            ? 'Harendra Kumar'
                            : '[ Pending HR Sign ]'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-right pt-2">
                  <div className="inline-block border border-slate-900 p-2 text-center min-w-[240px]">
                    <div className="font-serif italic font-bold text-slate-900 text-sm">
                      {requisition.sectionHeadApproval?.status === 'approved'
                        ? 'Dr. Panna Lal'
                        : '[ Pending Final Signature ]'}
                    </div>
                    <div className="font-bold text-[10px] uppercase text-slate-800 mt-1">
                      Dr. Panna Lal, Section Head,<br />
                      (IT, RS & GIS and AV Cell)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* FORM 1 REPLICA: Research Laboratory Facility Access Form */}
          {/* ========================================================= */}
          {isLabForm && (
            <div className="border border-slate-900 p-6 space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 border-2 border-slate-900 rounded-lg flex items-center justify-center font-serif font-black text-slate-900 text-lg">
                    WII
                  </div>
                  <div>
                    <div className="text-base font-bold tracking-tight text-slate-900 font-serif">
                      भारतीय वन्यजीव संस्थान
                    </div>
                    <div className="text-sm font-bold text-slate-900 font-serif">
                      Wildlife Institute of India
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold uppercase text-slate-900 tracking-wider">
                    REGISTRATION FORM
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    RESEARCH LABORATORY – FACILITY ACCESS
                  </div>
                </div>
              </div>

              {/* Grid Top Block */}
              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <tbody>
                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80 w-1/4">Name of the applicant</td>
                    <td className="p-1.5 border-r border-slate-900 font-semibold w-1/4">{requisition.applicant.applicantName}</td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80 w-1/4">Biometric - ID</td>
                    <td className="p-1.5 font-mono font-bold w-1/4">{requisition.applicant.biometricId || 'TBD'}</td>
                  </tr>

                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Signature of the applicant</td>
                    <td className="p-1.5 border-r border-slate-900 font-serif italic font-bold">
                      {requisition.history[0]?.digitalSignature || requisition.applicant.applicantName}
                    </td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Date</td>
                    <td className="p-1.5 font-mono">{new Date(requisition.createdAt).toLocaleDateString()}</td>
                  </tr>

                  <tr className="border-b border-slate-900">
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Name of Department / Cell / Project</td>
                    <td colSpan={3} className="p-1.5 font-bold">{requisition.applicant.departmentCellProject}</td>
                  </tr>

                  <tr>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Name of Supervising Officer / PI</td>
                    <td className="p-1.5 border-r border-slate-900 font-semibold">{requisition.applicant.supervisingOfficerName}</td>
                    <td className="p-1.5 font-bold border-r border-slate-900 bg-slate-100/80">Sign of Supervising Officer / PI</td>
                    <td className="p-1.5 font-serif italic text-emerald-800 font-bold">
                      {requisition.piApproval?.status === 'approved' ? requisition.piApproval.signature || 'Signed' : '[ Pending ]'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Research Facilities Table */}
              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-900 text-center font-bold">
                    <th className="p-2 border-r border-slate-900 w-1/3">Lab – Research Facility</th>
                    <th className="p-2 border-r border-slate-900 w-1/2">
                      Purpose / Equipment to be Used with Access Period (From & To Dates)
                    </th>
                    <th className="p-2 w-1/6">Sign of Nodal Officer / Associate Nodal Officer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Analytical Lab',
                    'Computer Lab',
                    'Forensic Lab',
                    'GIS Lab',
                    'Microscopy & Research Facility',
                    'Non-Invasive Research Facility',
                    'Teaching / Training Facility and National Wildlife Repository',
                    'Wildlife Endocrinology Lab',
                    'Conservation Genetics Facility',
                  ].map((facilityName) => {
                    const match = requisition.labAccessDetails?.find((l) => l.labName === facilityName && l.selected);
                    return (
                      <tr key={facilityName} className="border-b border-slate-900">
                        <td className="p-1.5 font-bold border-r border-slate-900 flex items-center gap-1.5">
                          <span className={`w-3.5 h-3.5 border border-slate-900 flex items-center justify-center font-bold text-[9px] ${match ? 'bg-slate-900 text-white' : ''}`}>
                            {match ? '✓' : ''}
                          </span>
                          {facilityName}
                        </td>
                        <td className="p-1.5 border-r border-slate-900 font-sans">
                          {match ? (
                            <div>
                              <div className="font-semibold">{match.purposeEquipment}</div>
                              <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                                Period: {match.fromDate} to {match.toDate}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>
                        <td className="p-1.5 text-center font-serif italic font-bold">
                          {match?.nodalApprovalStatus === 'approved' ? match.nodalOfficerName || 'Approved' : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* IT Cell Approval Box */}
              <div className="border border-slate-900 p-2 text-[11px] space-y-2">
                <div className="font-bold uppercase underline">IT, RS & GIS and Audio-Visual Cell use only:</div>
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <span className="font-bold">Access given by: </span>
                    <span className="font-semibold text-slate-800">
                      {requisition.itCellVerification?.biometricOfficer?.officerName || 'Mr. Aniket Gupta'}
                    </span>
                  </div>
                  <div className="border border-slate-900 px-3 py-1 font-bold">
                    Sign of Dr. Panna Lal, Section Head, (IT, RS & GIS and AV Cell):{' '}
                    <span className="font-serif italic text-emerald-800">
                      {requisition.sectionHeadApproval?.status === 'approved' ? 'Dr. Panna Lal' : '[ Pending ]'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Official Instructions Footer */}
          <div className="border-t-2 border-slate-900 pt-4 text-[10px] space-y-1.5 text-slate-700">
            <div className="font-bold uppercase text-slate-900">Official Instructions & Guidelines:</div>
            <ol className="list-decimal list-inside space-y-0.5 leading-tight">
              <li>Institute Laboratories and facilities shall be used only for authorized academic, research and official purposes in accordance with SOPs.</li>
              <li>On leaving WII or completion of tenure Laboratory/Common Facility Access will be deactivated. Ensure data is backed up before leaving.</li>
              <li>Send a scanned copy to Laboratory Supervisor / Technician and PI.</li>
              <li>Declaration: Certified that information furnished in this form is true and correct.</li>
              <li>
                <strong>Technical Support Contacts:</strong> Mr. Dinesh Singh Pundir (Intercom: 138) | Mr. Harendra Kumar (Intercom: 182) | Mr. Aniket Gupta (Intercom: 147)
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};