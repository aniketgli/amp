import React from 'react';
import { BookOpen, ExternalLink, PhoneCall, ShieldAlert, Sparkles, Building2, CheckCircle2, UserCheck, FlaskConical, ShieldCheck, KeyRound, BadgeCheck } from 'lucide-react';

export const HelpdeskView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header Banner - Standardized Uniform Layout */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 min-h-[140px]">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 pointer-events-none blur-2xl" />

        <div className="space-y-1.5 max-w-2xl z-10 relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Access Management Portal
            </span>
            <span className="text-xs text-slate-400">• Wildlife Institute of India</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Official Guidelines, SOPs & Intercom Directory
          </h1>
          <p className="text-xs text-slate-300 truncate max-w-xl block">
            Operating rules, technical support contacts, and official approval hierarchy for WII IT, RS & GIS, and HRMS Services.
          </p>
        </div>

        {/* Support Contact Pill Badge */}
        <div className="bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-700/80 text-xs flex items-center gap-3 z-10 relative shrink-0">
          <div className="p-2 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold shrink-0">
            <PhoneCall className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-200">IT & Telecom Desk</span>
              <span className="text-[9px] font-mono uppercase font-black bg-slate-900 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700">
                EXT: 101/102
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium block">
              Mon - Fri • 09:00 - 17:30 IST
            </span>
          </div>
        </div>
      </div>

      {/* Official Approval Workflow Hierarchy */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-extrabold uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Official Approval Workflow Hierarchy
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sequence of approvals for requisition authorization and technical provisioning.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Automated Protocol
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Stage 1 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Stage 1
              </span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="font-extrabold text-slate-900">PI / Supervisor Review</div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Dr. R. K. Singh endorses fellow eligibility & project necessity.
            </p>
          </div>

          {/* Stage 2 */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-200 px-2 py-0.5 rounded">
                Stage 2 (Conditional)
              </span>
              <FlaskConical className="w-4 h-4 text-amber-600" />
            </div>
            <div className="font-extrabold text-slate-900">Lab Nodal Clearance</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Dr. S. K. Gupta clears equipment usage requests when research lab is requested.
            </p>
          </div>

          {/* Stage 3 */}
          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-rose-800 bg-rose-200 px-2 py-0.5 rounded">
                Stage 3
              </span>
              <ShieldCheck className="w-4 h-4 text-rose-600" />
            </div>
            <div className="font-extrabold text-slate-900">Section Head Authorization</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Dr. Panna Lal grants executive institute authorization.
            </p>
          </div>

          {/* Stage 4 */}
          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">
                Stage 4 (Final)
              </span>
              <KeyRound className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-extrabold text-slate-900">Technical Officers Provisioning</div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Mr. Dinesh Pundir & Mr. Harendra Kumar issue Email, MAC & HRMS credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Digitization & Organization Summary Suggestions */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-xs text-emerald-950 space-y-3">
        <h3 className="font-bold text-sm text-emerald-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Digital Requisition System Optimization Highlights
        </h3>
        <p className="text-emerald-900/90 leading-relaxed">
          The physical paper registration forms for <strong>Form 1 (Research Lab Access)</strong> and <strong>Form 2 (Email / Internet / HRMS / PMS)</strong> have been unified into this digital workflow system with the following enhancements:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. Master Applicant Profile
            </div>
            <p className="text-[11px] text-slate-600">
              Personal, banking, and designation details are stored once in the applicant master profile and automatically populate all new requisitions.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Multi-Role Automated Workflow
            </div>
            <p className="text-[11px] text-slate-600">
              Direct routing from Supervising Officer (PI) → Technical Officers (Email/MAC/HRMS) → Lab Nodal Officers → Section Head (Dr. Panna Lal) final sign-off.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              3. Dynamic Provisioning Controls
            </div>
            <p className="text-[11px] text-slate-600">
              Technical Officers can directly assign official <code>@wii.gov.in</code> email IDs, verify device MAC addresses, and register Biometric IDs.
            </p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              4. Official Paper-Replica Printing
            </div>
            <p className="text-[11px] text-slate-600">
              Generate and print pixel-perfect official paper replicas of WII Form 1 and Form 2 with populated signatures and approval stamps.
            </p>
          </div>
        </div>
      </div>

      {/* Official Intercom Directory */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <PhoneCall className="w-4 h-4 text-blue-600" />
          Technical Support Intercom Directory
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900">Email / Internet Support</div>
            <div className="text-slate-700 font-semibold">Mr. Dinesh Singh Pundir</div>
            <div className="text-slate-500 text-[11px]">Senior Technical Officer – III</div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
              <span className="text-slate-400">Intercom:</span>
              <span className="font-bold text-emerald-700 text-sm">138</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900">HRMS / PMS / Biometric Support</div>
            <div className="text-slate-700 font-semibold">Mr. Harendra Kumar</div>
            <div className="text-slate-500 text-[11px]">Senior Technical Officer – III</div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
              <span className="text-slate-400">Intercom:</span>
              <span className="font-bold text-emerald-700 text-sm">182</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900">Biometric & Laboratory Access</div>
            <div className="text-slate-700 font-semibold">Mr. Aniket Gupta</div>
            <div className="text-slate-500 text-[11px]">Technical Assistant</div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono">
              <span className="text-slate-400">Intercom:</span>
              <span className="font-bold text-emerald-700 text-sm">147</span>
            </div>
          </div>
        </div>
      </div>

      {/* Official Portals */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          Official WII Portals & External Links
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <a
            href="https://mail.wii.gov.in"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-slate-900">WII Webmail Portal</div>
              <div className="text-slate-500 font-mono text-[11px]">https://mail.wii.gov.in</div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>

          <a
            href="https://erp.wii.gov.in"
            target="_blank"
            rel="noreferrer"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-slate-900">WII HRMS / ERP Portal</div>
              <div className="text-slate-500 font-mono text-[11px]">https://erp.wii.gov.in</div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
