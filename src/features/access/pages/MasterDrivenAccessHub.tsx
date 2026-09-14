import React, { useEffect, useMemo, useState } from "react";
import { ApplicantProfile, RequisitionRecord, UserRole } from "@/types";
import { OFFICIAL_ROLES } from "@/constants/roles";
import { getFacilities, type FacilityApiRecord } from "@/api/facilities.api";
import { getServices, type ServiceApiRecord } from "@/api/services.api";
import { MasterDrivenQuickApplyModal, type ServiceScope } from "@/features/applicant/forms/MasterDrivenQuickApplyModal";
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, Clock3, FileText, Fingerprint, FlaskConical, Mail, PlusCircle, RefreshCw, ShieldCheck, Wifi, Wrench } from "lucide-react";

interface Props {
  applicantProfile: ApplicantProfile;
  currentRole?: UserRole;
  requisitions: RequisitionRecord[];
  onSelectRequisition: (req: RequisitionRecord) => void;
  onSubmitRequisition?: (req: RequisitionRecord) => void;
  onNavigateTab?: (tab: string) => void;
}

type ModalState = { service?: ServiceApiRecord; facility?: FacilityApiRecord; scope: ServiceScope; mode: "new" | "renewal" } | null;

function scopeForService(service: ServiceApiRecord): ServiceScope {
  const configured = service.formConfig?.scope;
  if (configured) return configured;
  const value = `${service.id} ${service.name}`.toLowerCase();
  if (/email|webmail|mail/.test(value)) return "email";
  if (/wifi|wi-fi|internet|mac|network/.test(value)) return "mac";
  if (/hrms|payroll|biometric|attendance/.test(value)) return "hrms";
  return "combined";
}

function iconFor(scope: ServiceScope) {
  if (scope === "email") return Mail;
  if (scope === "mac") return Wifi;
  if (scope === "hrms") return Fingerprint;
  if (scope === "lab") return FlaskConical;
  return ShieldCheck;
}

export const MasterDrivenAccessHub: React.FC<Props> = ({ applicantProfile, currentRole = "applicant", requisitions, onSelectRequisition: _onSelectRequisition, onSubmitRequisition, onNavigateTab }) => {
  const [services, setServices] = useState<ServiceApiRecord[]>([]);
  const [facilities, setFacilities] = useState<FacilityApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const roleInfo = OFFICIAL_ROLES.find((role) => role.id === currentRole) || OFFICIAL_ROLES[0];

  useEffect(() => {
    let cancelled = false;
    Promise.all([getServices(), getFacilities()]).then(([serviceResponse, facilityResponse]) => {
      if (cancelled) return;
      setServices((serviceResponse.services || []).filter((item) => String(item.status || "active").toLowerCase() === "active"));
      setFacilities((facilityResponse.facilities || []).filter((item) => String(item.status || "active").toLowerCase() === "active"));
    }).catch((loadError) => {
      console.error("Failed to load Access masters:", loadError);
      if (!cancelled) setError("Unable to load active Facilities & Services Master records.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const userRequisitions = useMemo(() => requisitions.filter((req) => req.applicant?.personalEmail === applicantProfile.personalEmail || req.applicant?.applicantName === applicantProfile.applicantName), [requisitions, applicantProfile.personalEmail, applicantProfile.applicantName]);
  const approvedReqs = userRequisitions.filter((req) => req.status === "approved_provisioned");
  const pendingReqs = userRequisitions.filter((req) => !["approved_provisioned", "rejected", "deactivated"].includes(req.status));

  const hasPending = (service: ServiceApiRecord) => {
    const scope = scopeForService(service);
    return pendingReqs.some((req) => scope === "email" ? Boolean(req.itHrmsDetails?.requestEmail) : scope === "mac" ? Boolean(req.itHrmsDetails?.requestInternet) : scope === "hrms" ? Boolean(req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric) : req.type === "COMBINED");
  };

  const hasApproved = (service: ServiceApiRecord) => {
    const scope = scopeForService(service);
    return approvedReqs.some((req) => scope === "email" ? Boolean(req.itHrmsDetails?.requestEmail) : scope === "mac" ? Boolean(req.itHrmsDetails?.requestInternet) : scope === "hrms" ? Boolean(req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric) : req.type === "COMBINED");
  };

  return <div className="space-y-6 max-w-[1220px] mx-auto pb-8">
    <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-5 min-h-[150px]">
      <div className="space-y-1.5 max-w-3xl"><div className="flex flex-wrap items-center gap-2"><span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Access Management Portal</span><span className="text-xs text-slate-400">• Wildlife Institute of India</span></div><h1 className="text-2xl sm:text-3xl font-extrabold">{currentRole === "applicant" ? "Personnel Requisition & Access Hub" : `${roleInfo.title} Access Hub`}</h1><p className="text-xs sm:text-sm text-slate-300">Active Facilities & Services Master records control which applications and popup form fields are available.</p></div>
      <button type="button" onClick={() => onNavigateTab?.("my_requests")} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl"><FileText className="w-4 h-4" /> All Requests <ArrowRight className="w-4 h-4" /></button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4"><CheckCircle2 className="w-8 h-8 text-emerald-600" /><div><div className="text-2xl font-extrabold">{approvedReqs.length}</div><div className="text-xs font-bold">Active Authorized Access</div></div></div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4"><Clock3 className="w-8 h-8 text-amber-600" /><div><div className="text-2xl font-extrabold">{pendingReqs.length}</div><div className="text-xs font-bold">Pending Requisitions</div></div></div>
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4"><RefreshCw className="w-8 h-8 text-blue-600" /><div><div className="text-2xl font-extrabold text-blue-700">{approvedReqs.length}</div><div className="text-xs font-bold">Eligible for Renewal</div></div></div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}

    <section className="space-y-4"><div className="flex items-end justify-between"><div><h2 className="text-lg font-extrabold flex items-center gap-2"><Wrench className="w-5 h-5 text-emerald-600" /> Services</h2><p className="text-xs text-slate-500">Only active Services Master records can create an application.</p></div><span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">{services.length} Active</span></div>
      {loading ? <div className="p-10 text-center bg-white border rounded-xl text-xs text-slate-500">Loading Services Master...</div> : services.length === 0 ? <div className="p-10 text-center bg-white border border-dashed rounded-xl text-xs text-slate-500">No active services are configured.</div> : <div className="space-y-4">{services.map((service, index) => { const scope = scopeForService(service); const Icon = iconFor(scope); const pending = hasPending(service); const approved = hasApproved(service); return <article key={service.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="px-4 py-4 flex items-center justify-between gap-3 border-b bg-slate-50"><div className="flex items-center gap-3 min-w-0"><div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Icon className="w-5 h-5" /></div><div className="min-w-0"><h3 className="text-sm font-extrabold truncate">{index + 1}. {service.name}</h3><p className="text-[11px] text-slate-500 truncate">{service.quota || "Configured from Services Master"}</p></div></div><span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100">{approved ? "Provisioned" : "Not Provisioned"}</span></div><div className="p-5"><div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-7 text-center"><div className="text-sm font-extrabold">{approved ? `Active ${service.name} Access` : `No Active ${service.name} Access`}</div><p className="text-xs text-slate-500 mt-1">{service.formConfig?.fields?.length ? `${service.formConfig.fields.length} form field(s) configured in Services Master.` : "This service uses the master configuration available for this service."}</p><div className="flex justify-center gap-2 mt-4">{approved && <button type="button" onClick={() => setModal({ service, scope, mode: "renewal" })} className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 text-xs font-bold"><RefreshCw className="inline w-3.5 h-3.5 mr-1" /> Renew</button>}<button type="button" disabled={pending} onClick={() => !pending && setModal({ service, scope, mode: "new" })} className={`px-4 py-2 rounded-lg text-xs font-bold ${pending ? "bg-slate-200 text-slate-500" : "bg-blue-600 text-white hover:bg-blue-500"}`}><PlusCircle className="inline w-3.5 h-3.5 mr-1" /> {pending ? "Requisition Pending" : `Apply for ${service.name}`}</button></div></div></div></article>; })}</div>}
    </section>

    <section className="space-y-4"><div className="flex items-end justify-between"><div><h2 className="text-lg font-extrabold flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-600" /> Facilities & Research Labs</h2><p className="text-xs text-slate-500">Facility details and popup fields are loaded from Facilities Master.</p></div><span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold">{facilities.length} Active</span></div>
      {loading ? <div className="p-10 text-center bg-white border rounded-xl text-xs text-slate-500">Loading Facilities Master...</div> : facilities.length === 0 ? <div className="p-10 text-center bg-white border border-dashed rounded-xl text-xs text-slate-500">No active facilities are configured.</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{facilities.map((facility) => <article key={facility.id} className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">{facility.id}</span><h3 className="font-bold mt-2">{facility.name}</h3></div><FlaskConical className="w-5 h-5 text-purple-600" /></div><div className="mt-3 text-xs text-slate-600 space-y-1"><div><b>Nodal:</b> {facility.nodal || "—"}</div><div><b>Associate Nodal:</b> {facility.assocNodal || "—"}</div><div><b>Supervisor:</b> {facility.supervisor || "—"}</div><div className="text-slate-500">{facility.description || ""}</div></div><button type="button" onClick={() => setModal({ facility, scope: "lab", mode: "new" })} className="mt-4 w-full px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"><PlusCircle className="inline w-3.5 h-3.5 mr-1" /> Apply for Facility Access</button></article>)}</div>}
    </section>

    {modal && <MasterDrivenQuickApplyModal isOpen={true} onClose={() => setModal(null)} serviceScope={modal.scope} mode={modal.mode} applicantProfile={applicantProfile} existingRequisitions={requisitions} onSubmitRequisition={(req) => onSubmitRequisition?.(req)} service={modal.service} facility={modal.facility} />}
  </div>;
};
