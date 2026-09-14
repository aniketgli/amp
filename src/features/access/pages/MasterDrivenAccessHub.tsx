import React, { useEffect, useMemo, useState } from "react";
import { ApplicantProfile, RequisitionRecord, UserRole } from "@/types";
import { OFFICIAL_ROLES } from "@/constants/roles";
import { getFacilities, type FacilityApiRecord } from "@/api/facilities.api";
import { getServices, type ServiceApiRecord } from "@/api/services.api";
import { MasterDrivenQuickApplyModal, type ServiceScope } from "@/features/applicant/forms/MasterDrivenQuickApplyModal";
import { BadgeCheck, Building2, Clock3, Fingerprint, FlaskConical, Mail, PlusCircle, RefreshCw, ShieldCheck, Wifi, Wrench } from "lucide-react";

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

function getApplyName(name: string): string {
  const value = String(name || "").trim();
  const cleaned = value.split(/[.(,]/)[0].trim();
  return cleaned || value;
}

function iconFor(scope: ServiceScope) {
  if (scope === "email") return Mail;
  if (scope === "mac") return Wifi;
  if (scope === "hrms") return Fingerprint;
  if (scope === "lab") return FlaskConical;
  return ShieldCheck;
}

function iconStyleFor(scope: ServiceScope) {
  if (scope === "email") return "bg-blue-600 text-white";
  if (scope === "mac") return "bg-emerald-600 text-white";
  if (scope === "hrms") return "bg-purple-600 text-white";
  if (scope === "lab") return "bg-teal-600 text-white";
  return "bg-indigo-600 text-white";
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
  return null;
}

export const MasterDrivenAccessHub: React.FC<Props> = ({ applicantProfile, currentRole = "applicant", requisitions, onSelectRequisition, onSubmitRequisition }) => {
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
  const serviceRequest = (service: ServiceApiRecord) => { const scope = scopeForService(service); const approved = approvedReqs.find((req) => matchesService(req, service, scope)); if (approved) return { state: "approved" as const, req: approved }; const pending = pendingReqs.find((req) => matchesService(req, service, scope)); return pending ? { state: "pending" as const, req: pending } : { state: "none" as const, req: undefined }; };
  const facilityRequest = (facility: FacilityApiRecord) => { const approved = approvedReqs.find((req) => matchesFacility(req, facility)); if (approved) return { state: "approved" as const, req: approved }; const pending = pendingReqs.find((req) => matchesFacility(req, facility)); return pending ? { state: "pending" as const, req: pending } : { state: "none" as const, req: undefined }; };

  const renderState = (state: "pending" | "approved" | "none", req: RequisitionRecord | undefined, title: string, description: string, buttonLabel: string, Icon: React.ElementType, buttonClass: string, onApply: () => void, onRenew: () => void) => {
    if (state === "pending") return <div className="min-h-[190px] rounded-xl border border-amber-300 bg-amber-50 flex flex-col items-center justify-center text-center px-5 py-8"><div className="w-10 h-10 rounded-full bg-white border border-amber-200 flex items-center justify-center mb-3"><Clock3 className="w-5 h-5 text-amber-600" /></div><div className="text-sm font-extrabold text-amber-900">Requisition Pending Verification</div><p className="max-w-[650px] text-[11px] leading-5 text-slate-600 mt-1.5">Requisition <span className="font-mono font-bold">{req?.id}</span> has been submitted and is currently under workflow review.</p><button type="button" onClick={() => req && onSelectRequisition(req)} className="mt-4 text-xs font-extrabold text-blue-700">View Requisition Status →</button></div>;
    if (state === "approved") return <div className="min-h-[190px] rounded-xl border border-emerald-200 bg-emerald-50 flex flex-col items-center justify-center text-center px-5 py-8"><div className="w-10 h-10 rounded-full bg-white border border-emerald-200 flex items-center justify-center mb-3"><BadgeCheck className="w-5 h-5 text-emerald-600" /></div><div className="text-sm font-extrabold text-emerald-900">Active Access</div><p className="max-w-[650px] text-[11px] leading-5 text-slate-600 mt-1.5">Access is provisioned under requisition <span className="font-mono font-bold">{req?.id}</span>.</p><button type="button" onClick={onRenew} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-blue-200 bg-white text-blue-700 text-xs font-bold"><RefreshCw className="w-3.5 h-3.5" /> Renew</button></div>;
    return <div className="min-h-[190px] rounded-xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col items-center justify-center text-center px-5 py-8"><div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-blue-600" /></div><div className="text-sm font-extrabold text-slate-900">{title}</div><p className="max-w-[650px] text-[11px] leading-5 text-slate-500 mt-1.5">{description}</p><button type="button" onClick={onApply} className={`mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white shadow-sm ${buttonClass}`}><PlusCircle className="w-3.5 h-3.5" />{buttonLabel}</button></div>;
  };

  return <div className="space-y-6 max-w-[1520px] mx-auto pb-8">
    {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}
    {loading ? <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">Loading Facilities & Services Master...</div> : <>
      {services.map((service) => { const scope = scopeForService(service); const Icon = iconFor(scope); const request = serviceRequest(service); const subtitle = service.quota?.trim() || "Institute service access request"; return <article key={`service-${service.id}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"><div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4"><div className="flex items-center gap-4 min-w-0"><div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconStyleFor(scope)}`}><Icon className="w-5 h-5" /></div><div className="min-w-0"><h3 className="text-[15px] font-extrabold text-slate-900">{service.name}</h3><p className="text-[11px] text-blue-700/80 mt-1">{subtitle}</p></div></div><StatusBadge state={request.state} /></div><div className="p-5 sm:p-6">{renderState(request.state, request.req, "No Active Access", subtitle, `Apply for ${getApplyName(service.name)}`, Icon, "bg-blue-600 hover:bg-blue-500", () => setModal({ service, scope, mode: "new" }), () => setModal({ service, scope, mode: "renewal" }))}</div></article>; })}
      {facilities.map((facility) => { const request = facilityRequest(facility); const subtitle = facility.description?.trim() || facility.department?.trim() || "Research facility access and equipment authorization"; return <article key={`facility-${facility.id}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"><div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4"><div className="flex items-center gap-4 min-w-0"><div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-teal-600 text-white"><FlaskConical className="w-5 h-5" /></div><div className="min-w-0"><h3 className="text-[15px] font-extrabold text-slate-900">{facility.name}</h3><p className="text-[11px] text-blue-700/80 mt-1">{subtitle}</p></div></div><StatusBadge state={request.state} /></div><div className="p-5 sm:p-6">{renderState(request.state, request.req, "No Active Facility Access", subtitle, `Apply for ${getApplyName(facility.name)}`, FlaskConical, "bg-teal-600 hover:bg-teal-500", () => setModal({ facility, scope: "lab", mode: "new" }), () => setModal({ facility, scope: "lab", mode: "renewal" }))}</div></article>; })}
      {services.length === 0 && facilities.length === 0 && <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">No active Facilities or Services are configured in Master.</div>}
    </>}
    {modal && <MasterDrivenQuickApplyModal isOpen={true} onClose={() => setModal(null)} serviceScope={modal.scope} mode={modal.mode} applicantProfile={applicantProfile} existingRequisitions={requisitions} onSubmitRequisition={(req) => onSubmitRequisition?.(req)} service={modal.service} facility={modal.facility} />}
  </div>;
};
