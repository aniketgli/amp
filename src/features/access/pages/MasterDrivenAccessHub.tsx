import React, { useEffect, useMemo, useState } from "react";
import {
  ApplicantProfile,
  RequisitionRecord,
  UserRole,
} from "@/types";
import { OFFICIAL_ROLES } from "@/constants/roles";
import { getFacilities, type FacilityApiRecord } from "@/api/facilities.api";
import { getServices, type ServiceApiRecord } from "@/api/services.api";
import {
  QuickApplyModal,
  type ServiceScope,
} from "@/features/applicant/forms/QuickApplyModal";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Fingerprint,
  FlaskConical,
  Mail,
  RefreshCw,
  ShieldCheck,
  Wifi,
  Wrench,
} from "lucide-react";

interface MasterDrivenAccessHubProps {
  applicantProfile: ApplicantProfile;
  currentRole?: UserRole;
  requisitions: RequisitionRecord[];
  onSelectRequisition: (req: RequisitionRecord) => void;
  onSubmitRequisition?: (req: RequisitionRecord) => void;
  onNavigateTab?: (tab: string) => void;
}

type ModalConfig = {
  serviceScope: ServiceScope;
  mode: "new" | "renewal";
  initialLabId?: string;
};

function getServiceScope(service: ServiceApiRecord): ServiceScope {
  const value = `${service.id} ${service.name}`.toLowerCase();
  if (value.includes("webmail") || value.includes("email") || value.includes("mail")) return "email";
  if (value.includes("wifi") || value.includes("wi-fi") || value.includes("internet") || value.includes("mac") || value.includes("network")) return "mac";
  if (value.includes("hrms") || value.includes("payroll") || value.includes("biometric") || value.includes("attendance")) return "hrms";
  return "combined";
}

function getServiceIcon(scope: ServiceScope) {
  if (scope === "email") return Mail;
  if (scope === "mac") return Wifi;
  if (scope === "hrms") return Fingerprint;
  return ShieldCheck;
}

function getServiceDescription(service: ServiceApiRecord, scope: ServiceScope) {
  if (service.quota) return service.quota;
  if (scope === "email") return "Institutional webmail, domain access and group mappings.";
  if (scope === "mac") return "Campus internet, device MAC binding and network access.";
  if (scope === "hrms") return "HRMS/PMS account and biometric attendance services.";
  return "Access request configured from the active Services Master record.";
}

function isActiveMasterRecord(status?: string) {
  return String(status || "active").toLowerCase() === "active";
}

export const MasterDrivenAccessHub: React.FC<MasterDrivenAccessHubProps> = ({
  applicantProfile,
  currentRole = "applicant",
  requisitions,
  onSelectRequisition,
  onSubmitRequisition,
  onNavigateTab,
}) => {
  const [services, setServices] = useState<ServiceApiRecord[]>([]);
  const [facilities, setFacilities] = useState<FacilityApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);

  const activeRoleInfo = OFFICIAL_ROLES.find((role) => role.id === currentRole) || OFFICIAL_ROLES[0];

  useEffect(() => {
    let cancelled = false;
    const loadMasters = async () => {
      setLoading(true);
      setError(null);
      try {
        const [servicesResponse, facilitiesResponse] = await Promise.all([
          getServices(),
          getFacilities(),
        ]);
        if (cancelled) return;
        setServices((servicesResponse.services || []).filter((item) => isActiveMasterRecord(item.status)));
        setFacilities((facilitiesResponse.facilities || []).filter((item) => isActiveMasterRecord(item.status)));
      } catch (loadError) {
        console.error("Failed to load Access tab masters:", loadError);
        if (!cancelled) {
          setServices([]);
          setFacilities([]);
          setError("Unable to load active Facilities & Services Master records.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadMasters();
    return () => {
      cancelled = true;
    };
  }, []);

  const userRequisitions = useMemo(
    () => requisitions.filter((req) => req.applicant?.personalEmail === applicantProfile.personalEmail || req.applicant?.applicantName === applicantProfile.applicantName),
    [requisitions, applicantProfile.personalEmail, applicantProfile.applicantName],
  );

  const approvedReqs = userRequisitions.filter((req) => req.status === "approved_provisioned");
  const pendingReqs = userRequisitions.filter((req) => req.status !== "approved_provisioned" && req.status !== "rejected" && req.status !== "deactivated");

  const hasActiveRequestForService = (service: ServiceApiRecord) => {
    const scope = getServiceScope(service);
    return pendingReqs.some((req) => {
      if (scope === "email") return Boolean(req.itHrmsDetails?.requestEmail);
      if (scope === "mac") return Boolean(req.itHrmsDetails?.requestInternet);
      if (scope === "hrms") return Boolean(req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric);
      return req.type === "COMBINED";
    });
  };

  const hasApprovedRequestForService = (service: ServiceApiRecord) => {
    const scope = getServiceScope(service);
    return approvedReqs.some((req) => {
      if (scope === "email") return Boolean(req.itHrmsDetails?.requestEmail);
      if (scope === "mac") return Boolean(req.itHrmsDetails?.requestInternet);
      if (scope === "hrms") return Boolean(req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric);
      return req.type === "COMBINED";
    });
  };

  const openService = (service: ServiceApiRecord, mode: "new" | "renewal") => {
    if (mode === "new" && hasActiveRequestForService(service)) return;
    setModalConfig({ serviceScope: getServiceScope(service), mode });
  };

  const openFacility = (facility: FacilityApiRecord) => {
    setModalConfig({ serviceScope: "lab", mode: "new", initialLabId: facility.id });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" /> Access Management Portal
            </span>
            <span className="text-xs text-slate-400">Wildlife Institute of India</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {currentRole === "applicant" ? "Personnel Requisition & Access Hub" : `${activeRoleInfo.title} Access Hub`}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Every available application starts from an active Facilities or Services Master record. Master status changes are reflected automatically in Access.
          </p>
        </div>
        <button type="button" onClick={() => onNavigateTab?.("my_requests")} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shrink-0">
          <FileText className="w-4 h-4" /> All Requests <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {currentRole !== "applicant" && (
        <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex items-center gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold text-blue-900">Official Role Mode Active: {activeRoleInfo.title}</span>
            <p className="text-blue-700 text-[11px] mt-0.5">Applications shown here are controlled by the database masters.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3"><CheckCircle2 className="w-7 h-7 text-emerald-600" /><div><div className="text-xl font-extrabold text-slate-900">{approvedReqs.length}</div><div className="text-[11px] font-bold text-slate-700">Active Authorized Access</div></div></div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3"><Clock className="w-7 h-7 text-amber-600" /><div><div className="text-xl font-extrabold text-slate-900">{pendingReqs.length}</div><div className="text-[11px] font-bold text-slate-700">Pending Requisitions</div></div></div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3"><RefreshCw className="w-7 h-7 text-blue-600" /><div><div className="text-xl font-extrabold text-slate-900">{approvedReqs.length}</div><div className="text-[11px] font-bold text-slate-700">Eligible for Renewal</div></div></div>
      </div>

      {error && <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><Wrench className="w-5 h-5 text-emerald-600" /> Services</h2>
            <p className="text-xs text-slate-500 mt-0.5">Only active Services Master records can create an application.</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1">{services.length} Active</span>
        </div>

        {loading ? <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">Loading Services Master...</div> : services.length === 0 ? <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">No active services are configured in Services Master.</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, index) => {
              const scope = getServiceScope(service);
              const Icon = getServiceIcon(scope);
              const pending = hasActiveRequestForService(service);
              const approved = hasApprovedRequestForService(service);
              return (
                <div key={service.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{index + 1}. {service.id}</div><h3 className="font-extrabold text-slate-900 text-sm mt-0.5">{service.name}</h3></div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${pending ? "bg-amber-50 text-amber-700 border border-amber-200" : approved ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>{pending ? "Pending" : approved ? "Provisioned" : "Not Provisioned"}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{getServiceDescription(service, scope)}</p>
                      <p className="text-[11px] text-slate-500 mt-2"><b>Manager:</b> {service.manager || "—"}</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                    {approved && <button type="button" onClick={() => openService(service, "renewal")} className="px-3 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold">Renew</button>}
                    <button type="button" disabled={pending} onClick={() => openService(service, "new")} className={`px-3 py-2 rounded-lg text-xs font-bold ${pending ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500"}`}>{pending ? "Requisition Pending" : approved ? "Apply Again" : "Apply for Access"}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-600" /> Facilities & Research Labs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Each active Facility Master record opens the laboratory access application.</p>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-1">{facilities.length} Active</span>
        </div>

        {loading ? <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">Loading Facilities Master...</div> : facilities.length === 0 ? <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">No active facilities are configured in Facilities Master.</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((facility, index) => (
              <div key={facility.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0"><FlaskConical className="w-5 h-5" /></div>
                  <div className="min-w-0 flex-1"><div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{index + 1}. {facility.id}</div><h3 className="font-extrabold text-slate-900 text-sm mt-0.5">{facility.name}</h3><p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{facility.description || "Equipment usage authorization and research facility access."}</p><p className="text-[11px] text-slate-500 mt-2"><b>Nodal Officer:</b> {facility.nodal || "—"}</p></div>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100"><button type="button" onClick={() => openFacility(facility)} className="w-full px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Apply for Facility Access</button></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalConfig && (
        <QuickApplyModal
          isOpen
          onClose={() => setModalConfig(null)}
          serviceScope={modalConfig.serviceScope}
          mode={modalConfig.mode}
          initialLabId={modalConfig.initialLabId}
          applicantProfile={applicantProfile}
          existingRequisitions={userRequisitions}
          onSubmitRequisition={(req) => {
            onSubmitRequisition?.(req);
            setModalConfig(null);
          }}
        />
      )}
    </div>
  );
};