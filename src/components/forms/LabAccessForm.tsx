import React, { useState, useEffect } from 'react';
import { LabFacilitySelection } from '../../types/requisition';
import { getStoredFacilities, findFacility } from '../../utils/storage';
import { FlaskConical, Calendar, Info, Check, Microchip, Fingerprint } from 'lucide-react';

interface LabAccessFormProps {
  labs: LabFacilitySelection[];
  onChange: (labs: LabFacilitySelection[]) => void;
}

export const LabAccessForm: React.FC<LabAccessFormProps> = ({ labs, onChange }) => {
  const [hasBiometricId, setHasBiometricId] = useState<'yes' | 'no'>('no');
  const [biometricIdNumber, setBiometricIdNumber] = useState<string>('WII-BIO-1048');
  const [storedFacilities, setStoredFacilities] = useState(() =>
    getStoredFacilities().filter((f) => f.status === 'active')
  );

  useEffect(() => {
    const handleUpdate = () => {
      setStoredFacilities(getStoredFacilities().filter((f) => f.status === 'active'));
    };
    window.addEventListener('wii_masters_updated', handleUpdate);
    return () => window.removeEventListener('wii_masters_updated', handleUpdate);
  }, []);

  // Ensure all active stored facilities exist in state
  const currentLabs = storedFacilities.map((fac) => {
    const existing = labs.find(
      (l) => l.labId === fac.id || l.labName?.toLowerCase() === fac.name.toLowerCase()
    );
    if (existing) {
      return {
        ...existing,
        labId: fac.id,
        labName: fac.name,
        nodalOfficerName: fac.nodal,
      };
    }
    return {
      labId: fac.id,
      labName: fac.name,
      selected: false,
      purposeEquipment: '',
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0], // 6 months default
      nodalApprovalStatus: 'pending' as const,
      nodalOfficerName: fac.nodal,
      hasBiometricId: hasBiometricId === 'yes',
      biometricIdNumber: hasBiometricId === 'yes' ? biometricIdNumber : undefined,
    };
  });

  const handleToggle = (labId: string) => {
    const updated = currentLabs.map((l) =>
      l.labId === labId ? { ...l, selected: !l.selected } : l
    );
    onChange(updated);
  };

  const handleFieldChange = (labId: string, field: keyof LabFacilitySelection, value: any) => {
    const updated = currentLabs.map((l) => (l.labId === labId ? { ...l, [field]: value } : l));
    onChange(updated);
  };

  const handleBioChange = (status: 'yes' | 'no', numVal?: string) => {
    setHasBiometricId(status);
    const num = numVal !== undefined ? numVal : biometricIdNumber;
    const updated = currentLabs.map((l) => ({
      ...l,
      hasBiometricId: status === 'yes',
      biometricIdNumber: status === 'yes' ? num : undefined,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Research Facilities Access Policy:</span> Select the specific laboratory facilities required for your research or official project work. Each requested facility will be routed to its respective Nodal Officer for authorization.
        </div>
      </div>

      {/* BIOMETRIC ID VERIFICATION FIELD */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
          <Fingerprint className="w-4 h-4 text-purple-600" />
          Biometric ID Registration Verification
        </div>

        <div className="text-xs font-semibold text-slate-700">
          Do you already have an assigned / registered Biometric ID? *
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleBioChange('yes')}
            className={`p-3 rounded-lg border font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              hasBiometricId === 'yes'
                ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500/20'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <input
              type="radio"
              name="lab_bio_check"
              checked={hasBiometricId === 'yes'}
              onChange={() => handleBioChange('yes')}
              className="text-blue-600"
            />
            <span>Yes, I have a Biometric ID</span>
          </button>

          <button
            type="button"
            onClick={() => handleBioChange('no')}
            className={`p-3 rounded-lg border font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
              hasBiometricId === 'no'
                ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <input
              type="radio"
              name="lab_bio_check"
              checked={hasBiometricId === 'no'}
              onChange={() => handleBioChange('no')}
              className="text-amber-600"
            />
            <span>No, Biometric ID not created yet</span>
          </button>
        </div>

        {hasBiometricId === 'yes' ? (
          <div className="pt-2 animate-fade-in">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Existing Biometric ID Number *
            </label>
            <input
              type="text"
              required
              value={biometricIdNumber}
              onChange={(e) => {
                setBiometricIdNumber(e.target.value);
                handleBioChange('yes', e.target.value);
              }}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. WII-BIO-1048"
            />
          </div>
        ) : (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1 animate-fade-in">
            <span className="font-bold flex items-center gap-1.5 text-purple-950">
              <Fingerprint className="w-4 h-4 text-purple-600" /> HRMS / PMS & Biometric Registration Included
            </span>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Since you do not have a Biometric ID yet, HRMS/PMS Portal & Biometric Attendance registration will be automatically enabled and processed with this requisition.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {currentLabs.map((lab) => {
          const facInfo = findFacility(lab.labId) || findFacility(lab.labName);
          return (
            <div
              key={lab.labId}
              className={`border rounded-xl transition-all overflow-hidden ${
                lab.selected
                  ? 'border-emerald-500 bg-white shadow-xs ring-1 ring-emerald-500'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
              }`}
            >
              <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                      lab.selected
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {lab.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <h4
                      className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-2"
                      onClick={() => handleToggle(lab.labId)}
                    >
                      <FlaskConical className="w-4 h-4 text-emerald-600" />
                      {lab.labName}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Nodal Officer:{' '}
                      <span className="font-semibold text-slate-700">{facInfo?.nodal || lab.nodalOfficerName || 'Dr. S. K. Gupta'}</span>
                      {facInfo?.assocNodal && (
                        <span className="ml-2 text-slate-400">
                          (Assoc: <span className="font-medium text-slate-600">{facInfo.assocNodal}</span>)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(lab.labId)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    lab.selected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {lab.selected ? 'Selected for Access' : '+ Add Facility'}
                </button>
              </div>

              {lab.selected && (
                <div className="p-4 space-y-4 bg-white animate-fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Microchip className="w-3.5 h-3.5 text-slate-400" />
                      Purpose & Equipment / Instrument to be Used *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={lab.purposeEquipment}
                      onChange={(e) => handleFieldChange(lab.labId, 'purposeEquipment', e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      placeholder="Specify research purpose, equipment/instruments (e.g. Workstation #3, Spectrophotometer, Sequencer) and sample details..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Access Period - From Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={lab.fromDate}
                        onChange={(e) => handleFieldChange(lab.labId, 'fromDate', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Access Period - To Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={lab.toDate}
                        onChange={(e) => handleFieldChange(lab.labId, 'toDate', e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
