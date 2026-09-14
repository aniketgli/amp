import React, { useEffect, useMemo, useState } from "react";
import { ApplicantProfile, RequisitionRecord, UserRole } from "@/types";
import { OFFICIAL_ROLES } from "@/constants/roles";
import { getFacilities, type FacilityApiRecord } from "@/api/facilities.api";
import { getServices, type ServiceApiRecord } from "@/api/services.api";
import { MasterDrivenQuickApplyModal, type ServiceScope } from "@/features/applicant/forms/MasterDrivenQuickApplyModal";
import { STATIC_ACCESS_ITEMS, type StaticAccessItem } from "@/features/access/components/StaticAccessCatalog";
import { BadgeCheck, Clock3, PlusCircle, RefreshCw } from "lucide-react";

interface Props {
  applicantProfile: ApplicantProfile;
  currentRole?: UserRole;
  requisitions: RequisitionRecord[];
  onSelectRequisition: (req: RequisitionRecord) => void;
  onSubmitRequisition?: (req: RequisitionRecord) => void;
  onNavigateTab?: (tab: string) => void;
}

type ModalState = { service?: ServiceApiRecord; facility?: FacilityApiRecord; scope: ServiceScope; mode: "new" | "renewal" } | null;

function normalize(value: unknown) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchesStaticService(item: StaticAccessItem, service: ServiceApiRecord) {
  const value = normalize(`${service.id} ${service.name}`);
  if (item.key === "official-wii-email") return /email|webmail|mail/.test(value);
  if (item.key === "campus-internet-mac") return /wifi|wi fi|internet|mac|network/.test(value);
  if (item.key === "hrms-biometric") return /hrms|pms|biometric|attendance/.test(value);
  if (item.key === "smart-id-card") return /smart.*identity|smart.*id|rfid|identity card/.test(value);
  return false;
}

function matchesStaticFacility(item: StaticAccessItem, facility: FacilityApiRecord) {
  if (item.key !== "research-laboratory") return false;
  return /lab|laboratory|research facility/.test(normalize(`${facility.id} ${facility.name}`));
}

function matchesService(req: RequisitionRecord, service: ServiceApiRecord, scope: ServiceScope) {
  if (req.selectedServiceKey === service.id || req.selectedRefId === service.id) return true;
  if (req.serviceName && req.serviceName === service.name) return true;
  if (scope === "email") return Boolean(req.itHrmsDetails?.requestEmail);
  if (scope === "mac") return Boolean(req.itHrmsDetails?.requestInternet);
  if (scope === "hrms") return Boolean(req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric);
  return req.type === "COMBINED";
}

function matchesFacility(req: RequisitionRecord, facility: FacilityApiRecord) {
  if (req.selectedRefId === facility.id || req.selectedServiceKey === facility.id) return true;
  return (req.labAccessDetails || []).some((lab) => lab.labId === facility.id);
}

function scopeForItem(item: StaticAccessItem): ServiceScope {
  return item.scope;
}

function getApplyName(name: string): string {
  const value = String(name || "").trim();
  const cleaned = value.split(/[.(,]/)[0].trim();
  return cleaned || value;
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
      setServices(serviceResponse.services || []);
      setFacilities(facilityResponse.facilities || []);
    }).catch((loadError) => {
      console.error("Failed to load Access masters:", loadError);
      if (!cancelled) setError("Unable to load Facilities & Services Master records.");
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const configuredItems = useMemo(() => STATIC_ACCESS_ITEMS.map((item) => {
    const record = item.kind === "service"
      ? services.find((service) => matchesStaticService(item, service))
      : facilities.find((facility) => matchesStaticFacility(item, facility));
    const active = record ? String(record.status || "active").toLowerCase() === "active" : false;
    return { item, record, active };
  }).filter(({ active }) => active), [services, facilities]);

  const userRequisitions = useMemo(() => requisitions.filter((req) => req.applicant?.personalEmail === applicantProfile.personalEmail || req.applicant?.applicantName === applicantProfile.applicantName), [requisitions, applicantProfile.personalEmail, applicantProfile.applicantName]);
  const approvedReqs = userRequisitions.filter((req) => req.status === "approved_provisioned");
  const pendingReqs = userRequisitions.filter((req) => !["approved_provisioned", "rejected", "deactivated"].includes(req.status));

  const getRequest = (item: StaticAccessItem, record: ServiceApiRecord | FacilityApiRecord) => {
    if (item.kind === "service") {
      const service = record as ServiceApiRecord;
      const scope = scopeForItem(item);
      const approved = approvedReqs.find((req) => matchesService(req, service, scope));
      if (approved) return { state: "approved" as const, req: approved };
      const pending = pendingReqs.find((req) => matchesService(req, service, scope));
      return pending ? { state: "pending" as const, req: pending } : { state: "none" as const, req: undefined };
    }
    const facility = record as FacilityApiRecord;
    const approved = approvedReqs.find((req) => matchesFacility(req, facility));
    if (approved) return { state: "approved" as const, req: approved };
    const pending = pendingReqs.find((req) => matchesFacility(req, facility));
    return pending ? { state: "pending" as const, req: pending } : { state: "none" as const, req: undefined };
  };

  const renderState = (state: "pending" | "approved" | "none", req: RequisitionRecord | undefined, item: StaticAccessItem, record: ServiceApiRecord | FacilityApiRecord) => {
    const Icon = item.icon;
    if (state === "pending") return <div className="min-h-[190px] rounded-xl border border-amber-300 bg-amber-50 flex flex-col items-center justify-center text-center px-5 py-8"><div className="w-10 h-10 rounded-full bg-white border border-amber-200 flex items-center justify-center mb-3"><Clock3 className="w-5 h-5 text-amber-600" /></div><div className="text-sm font-extrabold text-amber-900">Requisition Pending Verification</div><p className="max-w-[650px] text-[11px] leading-5 text-slate-600 mt-1.5">Requisition <span className="font-mono font-bold">{req?.id}</span> has been submitted and is currently under workflow review.</p><button type="button" onClick={() => req && onSelectRequisition(req)} className="mt-4 text-xs font-extrabold text-blue-700">View Requisition Status →</button></div>;
    if (state === "approved") return <div className="min-h-[190px] rounded-xl border border-emerald-200 bg-emerald-50 flex flex-col items-center justify-center text-center px-5 py-8"><div className="w-10 h-10 rounded-full bg-white border border-emerald-200 flex items-center justify-center mb-3"><BadgeCheck className="w-5 h-5 text-emerald-600" /></div><div className="text-sm font-extrabold text-emerald-900">Active Access</div><p className="max-w-[650px] text-[11px] leading-5 text-slate-600 mt-1.5">Access is provisioned under requisition <span className="font-mono font-bold">{req?.id}</span>.</p><button type="button" onClick={() => setModal({ ...(item.kind === "service" ? { service: record as ServiceApiRecord } : { facility: record as FacilityApiRecord }), scope: item.scope, mode: "renewal" })} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-blue-200 bg-white text-blue-700 text-xs font-bold"><RefreshCw className="w-3.5 h-3.5" /> Renew</button></div>;
    return <div className="min-h-[190px] rounded-xl border border-dashed border-slate-300 bg-slate-50/70 flex flex-col items-center justify-center text-center px-5 py-8"><div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-blue-600" /></div><div className="text-sm font-extrabold text-slate-900">{item.emptyTitle}</div><p className="max-w-[650px] text-[11px] leading-5 text-slate-500 mt-1.5">{item.description}</p><button type="button" onClick={() => setModal({ ...(item.kind === "service" ? { service: record as ServiceApiRecord } : { facility: record as FacilityApiRecord }), scope: item.scope, mode: "new" })} className={`mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white shadow-sm ${item.color}`}><PlusCircle className="w-3.5 h-3.5" />{item.kind === "service" ? `Apply for ${getApplyName(record.name)}` : item.buttonLabel}</button></div>;
  };

  return <div className="space-y-5 max-w-[1520px] mx-auto pb-8">
    {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}
    {loading ? <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">Loading Access...</div> : <>
      {configuredItems.map(({ item, record }) => {
        if (!record) return null;
        const Icon = item.icon;
        const request = getRequest(item, record);
        return <article key={item.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"><div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4"><div className="flex items-center gap-4 min-w-0"><div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}><Icon className="w-5 h-5 text-white" /></div><div className="min-w-0"><h3 className="text-[15px] font-extrabold text-slate-900">{item.title}</h3><p className="text-[11px] text-blue-700/80 mt-1">{item.subtitle}</p></div></div><StatusBadge state={request.state} /></div><div className="p-5 sm:p-6">{renderState(request.state, request.req, item, record)}</div></article>;
      })}
      {configuredItems.length === 0 && <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">No active Access items are configured in Master.</div>}
    </>}
    {modal && <MasterDrivenQuickApplyModal isOpen={true} onClose={() => setModal(null)} serviceScope={modal.scope} mode={modal.mode} applicantProfile={applicantProfile} existingRequisitions={requisitions} onSubmitRequisition={(req) => onSubmitRequisition?.(req)} service={modal.service} facility={modal.facility} />}
    <div className="hidden">{roleInfo.title}</div>
  </div>;
};
