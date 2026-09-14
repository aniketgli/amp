import React from "react";
import { CheckCircle2, Fingerprint, FlaskConical, Mail, PlusCircle, ShieldCheck, Wifi, XCircle } from "lucide-react";

export type StaticAccessItem = {
  key: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  description: string;
  buttonLabel: string;
  scope: "email" | "mac" | "hrms" | "combined" | "lab";
  kind: "service" | "facility";
  color: string;
  icon: React.ElementType;
};

export const STATIC_ACCESS_ITEMS: StaticAccessItem[] = [
  { key: "official-wii-email", title: "Official WII Email ID (@wii.gov.in)", subtitle: "Institute Webmail Account, Domain Access & Group Mappings", emptyTitle: "No Active WII Webmail Account", description: "Apply for an official @wii.gov.in email address to access institutional communications, research groups, and domain resources.", buttonLabel: "Apply for Official WII Email ID", scope: "email", kind: "service", color: "bg-blue-600", icon: Mail },
  { key: "campus-internet-mac", title: "Campus Internet & Wi-Fi MAC Address Registration", subtitle: "Device Hardware Address MAC Binding for High-Speed LAN & Campus Wi-Fi", emptyTitle: "No Campus Internet Device Bound", description: "Register your laptop or workstation MAC hardware address to enable Wi-Fi and high-speed LAN access across WII campus.", buttonLabel: "Register MAC Hardware Device", scope: "mac", kind: "service", color: "bg-emerald-600", icon: Wifi },
  { key: "hrms-biometric", title: "HRMS / PMS Portal & Biometric Attendance", subtitle: "Personnel Management System Portal Accounts & Biometric ID Mapping", emptyTitle: "No Active HRMS / Biometric Access", description: "Apply for HRMS / PMS ERP portal access and Biometric Attendance registration for daily Institute duty logs.", buttonLabel: "Apply for HRMS & Biometric ID", scope: "hrms", kind: "service", color: "bg-purple-600", icon: Fingerprint },
  { key: "smart-id-card", title: "Institute Smart Identity Card & RFID Campus Pass", subtitle: "Official Photo ID Badge, Contactless Turnstile RFID, & Library / Gate Access Card", emptyTitle: "No Active Smart ID Card Requisition", description: "Submit a requisition to issue an official WII Smart ID Card with RFID contactless access for turnstiles, main gates, and laboratory doors.", buttonLabel: "Apply for ID Card", scope: "combined", kind: "service", color: "bg-indigo-600", icon: ShieldCheck },
  { key: "research-laboratory", title: "WII Research Laboratory Access Facilities", subtitle: "Equipment Usage Authorization & Nodal Approvals across 9 Specialized Research Labs", emptyTitle: "No Active Research Laboratory Access", description: "Apply for equipment usage authorization across specialized WII research labs (GIS & Remote Sensing, Wildlife Forensics, Conservation Genetics, Analytical Suite, etc.).", buttonLabel: "Apply for Research Laboratory Access", scope: "lab", kind: "facility", color: "bg-teal-600", icon: FlaskConical },
];

export function StaticAccessCatalog({
  onApply,
  itemStates = {},
  onToggle,
}: {
  onApply: (item: StaticAccessItem) => void;
  itemStates?: Record<string, boolean>;
  onToggle?: (item: StaticAccessItem) => void;
}) {
  return (
    <div className="space-y-5">
      {STATIC_ACCESS_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = itemStates[item.key] !== false;
        return (
          <article key={item.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}><Icon className="w-5 h-5 text-white" /></div>
                <div className="min-w-0"><h3 className="text-sm font-extrabold text-slate-900 truncate">{item.title}</h3><p className="text-[11px] text-blue-700/80 mt-0.5 truncate">{item.subtitle}</p></div>
              </div>
              <button
                type="button"
                onClick={() => onToggle?.(item)}
                disabled={!onToggle}
                className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-extrabold transition-colors ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"} disabled:cursor-default disabled:opacity-100`}
                title={isActive ? "Deactivate this Access item" : "Activate this Access item"}
              >
                {isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {isActive ? "Active" : "Inactive"}
              </button>
            </div>
            {isActive ? (
              <div className="p-4">
                <div className="min-h-[190px] rounded-xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col items-center justify-center text-center px-5 py-7">
                  <div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-blue-600" /></div>
                  <div className="text-sm font-extrabold text-slate-900">{item.emptyTitle}</div>
                  <p className="max-w-[650px] text-[11px] leading-5 text-slate-500 mt-1.5">{item.description}</p>
                  <button type="button" onClick={() => onApply(item)} className={`mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white shadow-sm ${item.color}`}><PlusCircle className="w-3.5 h-3.5" />{item.buttonLabel}</button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="min-h-[120px] rounded-xl border border-dashed border-red-200 bg-red-50/50 flex flex-col items-center justify-center text-center px-5 py-7">
                  <XCircle className="w-6 h-6 text-red-500 mb-2" />
                  <div className="text-sm font-extrabold text-red-800">Access Disabled</div>
                  <p className="text-[11px] text-red-600 mt-1">This Access item is inactive in Master and is hidden from the applicant Access tab.</p>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
