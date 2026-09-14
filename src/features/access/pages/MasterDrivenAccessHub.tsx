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
  if (/lab|research laboratory|facility/.test(value)) return "lab";
  return "combined";
}

function iconFor(scope: ServiceScope) {
  if (scope === "email") return Mail;
  if (scope === "mac") return Wifi;
  if (scope === "hrms") return Fingerprint;
  if (scope === "lab") return FlaskConical;
  return ShieldCheck;
}

function matchesService(req: RequisitionRecord, service: ServiceApiRecord, scope: ServiceScope) {
  if (req.selectedServiceKey === service.id || req.selectedRefId === service.id) return true;
  if (req.serviceName && req.serviceName === service.name) return true;
  if (scope === "email") return Boolean(req.itHrmsDetails?.requestEmail);
  if (scope === "mac") return Boolean(req.itHrmsDetails?.requestInternet);
  if (scope === "hrms") return Boolean(req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric);
  return scope === "lab" ? req.type === "LAB_FACILITY" : req.type === "COMBINED";
}

function matchesFacility(req: RequisitionRecord, facility: FacilityApiRecord) {
  if (req.selectedRefId === facility.id || req.selectedServiceKey === facility.id) return true;
  return (req.labAccessDetails || []).some((lab) => lab.labId === facility.id);
}

function StatusBadge({ state }: { state: "pending" | "approved" | "none" }) {
  if (state === "pending") return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Requisition Pending</span>;
  if (state === "approved") return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Provisioned</span>;
  return <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Not Provisioned</span>;
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

  const serviceRequest = (service: ServiceApiRecord) => {
    const scope = scopeForService(service);
    const approved = approvedReqs.find((req) => matchesService(req, service, scope));
    if (approved) return { state: "approved" as const, req: approved };
    const pending = pendingReqs.find((req) => matchesService(req, service, scope));
    return pending ? { state: "pending" as const, req: pending } : { state: "none" as const, req: undefined };
  };

  const facilityRequest = (facility: FacilityApiRecord) => {
    const approved = approvedReqs.find((req) => matchesFacility(req, facility));
    if (approved) return { state: "approved" as const, req: approved };
    const pending = pendingReqs.find((req) => matchesFacility(req, facility));
    return pending ? { state: "pending" as const, req: pending } : { state: "none" as const, req: undefined };
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

    <section className="space-y-4">
      <div className="flex items-end justify-between"><div><h2 className="text-lg font-extrabold flex items-center gap-2"><Wrench className="w-5 h-5 text-emerald-600" /> Services</h2><p className="text-xs text-slate-500">Only active Services Master records can create an application.</p></div><span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">{services.length} Active</span></div>
      {loading ? <div className="p-10 text-center bg-white border rounded-xl text-xs text-slate-500">Loading Services Master...</div> : services.length === 0 ? <div className="p-10 text-center bg-white border border-dashed rounded-xl text-xs text-slate-500">No active services are configured.</div> : <div className="space-y-4">{services.map((service) => {
        const scope = scopeForService(service); const Icon = iconFor(scope); const request = serviceRequest(service);
        return <article key={service.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-4 flex items-center justify-between gap-3 border-b bg-slate-50"><div className="flex items-center gap-3 min-w-0"><div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Icon className="w-5 h-5" /></div><div className="min-w-0"><h3 className="text-sm font-extrabold truncate">{service.name}</h3><p className="text-[11px] text-slate-500 truncate">{service.quota || "Configured from Services Master"}</p></div></div><StatusBadge state={request.state} /></div>
          <div className="p-5">
            {request.state === "pending" ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-extrabold text-amber-900 flex items-center gap-2"><Clock3 className="w-4 h-4" /> Requisition Pending Verification</div><p className="text-[11px] text-slate-600 mt-2">Requisition <span className="font-mono font-bold">{request.req?.id}</span> has been submitted and is currently under workflow review.</p></div><span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white text-amber-700 border border-amber-200">Under Workflow Review</span></div><button type="button" onClick={() => request.req && _onSelectRequisition(request.req)} className="mt-4 text-xs font-extrabold text-blue-700 hover:text-blue-900">View Requisition Status →</button></div> : request.state === "approved" ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6"><div className="text-sm font-extrabold text-emerald-900">Active Access</div><p className="text-xs text-slate-600 mt-1">Access is provisioned under requisition <span className="font-mono font-bold">{request.req?.id}</span>.</p><div className="flex flex-wrap gap-2 mt-4"><button type="button" onClick={() => setModal({ service, scope, mode: "renewal" })} className="px-4 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 text-xs font-bold"><RefreshCw className="inline w-3.5 h-3.5 mr-1" /> Renew</button></div></div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-7 text-center"><div className="text-sm font-extrabold">No Active Access</div><p className="text-xs text-slate-500 mt-1">{service.formConfig?.fields?.length ? `${service.formConfig.fields.length} form field(s) configured in Services Master.` : "This service uses the master configuration available for this service."}</p><button type="button" onClick={() => setModal({ service, scope, mode: "new" })} className="mt-4 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"><PlusCircle className="inline w-3.5 h-3.5 mr-1" /> Apply</button></div>}
          </div>
        </article>;
      })}</div>}
    </section>

    <section className="space-y-4">
      <div className="flex items-end justify-between"><div><h2 className="text-lg font-extrabold flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-600" /> Facilities & Research Labs</h2><p className="text-xs text-slate-500">Only active Facilities Master records create individual facility access forms. Each lab request is tracked separately.</p></div><span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold">{facilities.length} Active</span></div>
      {loading ? <div className="p-10 text-center bg-white border rounded-xl text-xs text-slate-500">Loading Facilities Master...</div> : facilities.length === 0 ? <div className="p-10 text-center bg-white border border-dashed rounded-xl text-xs text-slate-500">No active facilities are configured.</div> : <div className="space-y-4">{facilities.map((facility) => {
        const request = facilityRequest(facility);
        return <article key={facility.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-4 flex items-center justify-between gap-3 border-b bg-slate-50"><div className="flex items-center gap-3 min-w-0"><div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center"><FlaskConical className="w-5 h-5" /></div><div className="min-w-0"><h3 className="text-sm font-extrabold truncate">{facility.name}</h3><p className="text-[11px] text-slate-500 truncate">{facility.id} · Facility / Research Lab</p></div></div><StatusBadge state={request.state} /></div>
          <div className="p-5">
            {request.state === "pending" ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-extrabold text-amber-900 flex items-center gap-2"><Clock3 className="w-4 h-4" /> Lab Access Requisition Pending Verification</div><p className="text-[11px] text-slate-600 mt-2">Requisition <span className="font-mono font-bold">{request.req?.id}</span> for {facility.name} has been submitted and is currently under workflow review.</p></div><span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white text-amber-700 border border-amber-200">Under Workflow Review</span></div><button type="button" onClick={() => request.req && _onSelectRequisition(request.req)} className="mt-4 text-xs font-extrabold text-blue-700 hover:text-blue-900">View Requisition Status →</button></div> : request.state === "approved" ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6"><div className="text-sm font-extrabold text-emerald-900">Active Facility Access</div><p className="text-xs text-slate-600 mt-1">Access for {facility.name} is provisioned under requisition <span className="font-mono font-bold">{request.req?.id}</span>.</p><button type="button" onClick={() => setModal({ facility, scope: "lab", mode: "renewal" })} className="mt-4 px-4 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 text-xs font-bold"><RefreshCw className="inline w-3.5 h-3.5 mr-1" /> Renew</button></div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-7 text-center"><div className="text-sm font-extrabold">No Active Access</div><p className="text-xs text-slate-500 mt-1">{facility.formConfig?.fields?.length ? `${facility.formConfig.fields.length} form field(s) configured in Facilities Master.` : "This facility uses the master configuration available for this facility."}</p><button type="button" onClick={() => setModal({ facility, scope: "lab", mode: "new" })} className="mt-4 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"><PlusCircle className="inline w-3.5 h-3.5 mr-1" /> Apply</button></div>}
          </div>
        </article>;
      })}</div>}
    </section>

    {modal && <MasterDrivenQuickApplyModal isOpen={true} onClose={() => setModal(null)} serviceScope={modal.scope} mode={modal.mode} applicantProfile={applicantProfile} existingRequisitions={requisitions} onSubmitRequisition={(req) => onSubmitRequisition?.(req)} service={modal.service} facility={modal.facility} />}
  </div>;
};
