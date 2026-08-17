import React, { useState } from 'react';
import { ITHrmsDetails } from '../../types/requisition';
import { Mail, Wifi, ShieldCheck, Fingerprint, Laptop, Check, AlertCircle, Info } from 'lucide-react';

interface ITHrmsFormProps {
  value: ITHrmsDetails;
  onChange: (details: ITHrmsDetails) => void;
}

export const ITHrmsForm: React.FC<ITHrmsFormProps> = ({ value, onChange }) => {
  const [availableGroups] = useState<string[]>([
    'All Staff',
    'Faculty & Scientists',
    'Researchers & Fellows',
    'CAMPA Project',
    'IT & GIS Cell',
    'Wildlife Conservation Group',
  ]);

  const handleGroupToggle = (group: string) => {
    const current = value.requestedEmailGroups || [];
    const updated = current.includes(group)
      ? current.filter((g) => g !== group)
      : [...current, group];
    onChange({ ...value, requestedEmailGroups: updated });
  };

  return (
    <div className="space-y-6">
      {/* Requisition Mode (New Creation vs Renewal / Extension) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
          Service Request Purpose:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...value, requisitionMode: 'new' })}
            className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
              (value.requisitionMode || 'new') === 'new'
                ? 'bg-blue-50 border-blue-500 font-bold text-blue-900 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div>
              <div className="text-xs font-bold">✨ New Service Creation</div>
              <p className="text-[11px] text-slate-500 font-normal">First-time account creation & MAC registration</p>
            </div>
            {(value.requisitionMode || 'new') === 'new' && <Check className="w-4 h-4 text-blue-600" />}
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...value, requisitionMode: 'renewal' })}
            className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
              value.requisitionMode === 'renewal'
                ? 'bg-purple-50 border-purple-500 font-bold text-purple-900 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div>
              <div className="text-xs font-bold">🔄 Renewal / Extension of Access</div>
              <p className="text-[11px] text-slate-500 font-normal">Extend tenure or renew email/MAC/HRMS credentials</p>
            </div>
            {value.requisitionMode === 'renewal' && <Check className="w-4 h-4 text-purple-600" />}
          </button>
        </div>

        {value.requisitionMode === 'renewal' && (
          <div className="pt-2 animate-fade-in">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Justification for Renewal or Extension *
            </label>
            <input
              type="text"
              required
              value={value.renewalReason || ''}
              onChange={(e) => onChange({ ...value, renewalReason: e.target.value })}
              placeholder="e.g. Project tenure extended by DST / Project DST-WII-2026 until Dec 2027"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
      </div>

      {/* Service A: WII Email ID & Mailing Groups */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">A. WII Official Email ID Requisition</h3>
              <p className="text-xs text-slate-500">
                Official @wii.gov.in domain account and institutional mailing list memberships.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value.requestEmail}
              onChange={(e) => onChange({ ...value, requestEmail: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {value.requestEmail && (
          <div className="pt-3 border-t border-slate-100 animate-fade-in">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              Final email alias (e.g. name@wii.gov.in) will be created and verified by Senior Technical Officer Mr. Dinesh Singh Pundir.
            </div>
          </div>
        )}
      </div>

      {/* Service B: Campus Internet & MAC Address Registration */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">B. Campus Internet / LAN MAC Address Registration</h3>
              <p className="text-xs text-slate-500">
                Register device hardware MAC address for high-speed WII LAN/Wi-Fi network access.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value.requestInternet}
              onChange={(e) => onChange({ ...value, requestInternet: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {value.requestInternet && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" /> Hardware Device Type *
                </label>
                <select
                  required
                  value={value.deviceType || 'Laptop Workstation'}
                  onChange={(e) => onChange({ ...value, deviceType: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-slate-800"
                >
                  <option value="Laptop Workstation">Laptop Workstation</option>
                  <option value="Desktop Computer">Desktop Computer</option>
                  <option value="Mobile / Smartphone">Mobile / Smartphone</option>
                  <option value="Tablet / iPad">Tablet / iPad</option>
                  <option value="Research Instrument PC">Research Instrument PC</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Device Hardware MAC Address *
                </label>
                <input
                  type="text"
                  required
                  value={value.macAddress}
                  onChange={(e) => onChange({ ...value, macAddress: e.target.value.toUpperCase() })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono tracking-wider"
                  placeholder="e.g. 3C:D9:2B:1A:0F:8E"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Format: XX:XX:XX:XX:XX:XX
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-center gap-2 text-[11px] text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Note:</strong> Maximum concurrent login limit is restricted to <strong>2 devices</strong> per user.</span>
            </div>
          </div>
        )}
      </div>

      {/* Service C: HRMS & PMS Portal Access & Biometric ID */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          C. HRMS / PMS Portal & Biometric ID Allocation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={value.requestHrmsPms}
              onChange={(e) => onChange({ ...value, requestHrmsPms: e.target.checked })}
              className="mt-1 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                HRMS / PMS Portal Access
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Grant access to official leave management, attendance tracking & appraisal portal (https://erp.wii.gov.in).
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={value.requestBiometric}
              onChange={(e) => onChange({ ...value, requestBiometric: e.target.checked })}
              className="mt-1 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-purple-600" />
                Biometric ID Allocation
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                New Biometric registration for attendance logging and electronic door access locks.
              </p>
            </div>
          </label>
        </div>

        <div className="mt-3 bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span><strong>Note:</strong> When your requisition status reaches the <strong>Manager stage</strong>, please visit the <strong>IT Cell in person</strong> for Face Registration & Biometric Enrollment.</span>
        </div>
      </div>
    </div>
  );
};
