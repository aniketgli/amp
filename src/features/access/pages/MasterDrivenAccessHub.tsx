import React, { useEffect, useMemo, useState } from "react";
import { ApplicantProfile, RequisitionRecord, UserRole } from "@/types";
import { OFFICIAL_ROLES } from "@/constants/roles";
import { getFacilities, type FacilityApiRecord } from "@/api/facilities.api";
import { getServices, type ServiceApiRecord } from "@/api/services.api";
import { QuickApplyModal, type ServiceScope } from "@/features/applicant/forms/QuickApplyModal";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Fingerprint,
  FlaskConical,
  Mail,
  PlusCircle,
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

function getServiceSubtitle(service: ServiceApiRecord, scope: ServiceScope) {
  if (service.quota) return service.quota;
  if (scope === "email") return "Institute Webmail Account, Domain Access & Group Mapping";
  if (scope === "mac") return "Device Hardware Address MAC Binding for High-Speed LAN & Campus Wi-Fi";
  if (scope === "hrms") return "HRMS/PMS account and biometric attendance services";
  return "Access request configured from the active Services Master record";
}

function getEmptyServiceText(scope: ServiceScope) {
  if (scope === "email") return "Apply for an official @wii.gov.in email address to access institutional communications, research groups, and domain resources.";
  if (scope === "mac") return "Register your device hardware address for High-Speed LAN and Campus Wi-Fi access.";
  if (scope === "hrms") return "Request HRMS/PMS and biometric attendance access for your official Institute activities.";
  return "Submit the access requisition configured for this active service.";
}

export const MasterDrivenAccessHub: React.FC<MasterDrivenAccessHubProps> = ({
  applicantProfile,
  currentRole = "applicant",
  requisitions,
  onSelectRequisition: _onSelectRequisition,
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
        const [servicesResponse, facilitiesResponse] = await Promise.all([getServices(), getFacilities()]);
        if (cancelled) return;
        setServices((servicesResponse.services || []).filter((item) => String(item.status || "active").toLowerCase() === "active"));
        setFacilities((facilitiesResponse.facilities || []).filter((item) => String(item.status || "active").toLowerCase() === "active"));
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
    if (hasActiveRequestForService(service) && mode === "new") return;
    setModalConfig({ serviceScope: getServiceScope(service), mode });
  };

  const openFacility = (facility: FacilityApiRecord) => {
    setModalConfig({ serviceScope: "lab", mode: "new", initialLabId: facility.id });
  };

  return (
    <div className="space-y-6 max-w-[1220px] mx-auto pb-8">
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5 min-h-[150px]">
        <div className="absolute top-0 right-0 w-96 h-full bg-emerald-500/5 pointer-events-none blur-2xl" />
        <div className="space-y-1.5 max-w-3xl min-w-0 flex-1 z-10 relative">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" /> Access Management Portal
            </span>
            <span className="text-xs text-slate-400">• Wildlife Institute of India</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{currentRole === "applicant" ? "Personnel Requisition & Access Hub" : `${activeRoleInfo.title} Access Hub`}</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">View active credentials, authorized service privileges, and facility passes across Wildlife Institute of India IT infrastructure and Research Laboratories.</p>
        </div>
        <button type="button" onClick={() => onNavigateTab?.("my_requests")} className="z-10 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shrink-0">
          <FileText className="w-4 h-4" /> All Requests <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600"><CheckCircle2 className="w-7 h-7" /></div>
          <div><div className="text-2xl font-extrabold text-slate-900 leading-none">{approvedReqs.length}</div><div className="text-xs font-bold text-slate-800 mt-1">Active Authorized Access</div><div className="text-[10px] text-slate-500">Issued & provisioned credentials</div></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600"><Clock3 className="w-7 h-7" /></div>
          <div><div className="text-2xl font-extrabold text-slate-900 leading-none">{pendingReqs.length}</div><div className="text-xs font-bold text-slate-800 mt-1">Pending Requisitions</div><div className="text-[10px] text-slate-500">In verification approval chain</div></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600"><RefreshCw className="w-7 h-7" /></div>
          <div><div className="text-2xl font-extrabold text-blue-700 leading-none">{approvedReqs.length}</div><div className="text-xs font-bold text-slate-800 mt-1">Eligible for Renewal</div><div className="text-[10px] text-slate-500">Extend tenure for 2026–2027</div></div>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><Wrench className="w-5 h-5 text-emerald-600" /> Services</h2>
            <p className="text-xs text-slate-500 mt-0.5">Only active Services Master records can create an application.</p>
          </div>
          <span className="px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-bold">{services.length} Active</span>
        </div>

        {loading ? (
          <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">Loading Services Master...</div>
        ) : services.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">No active services are configured in Services Master.</div>
        ) : (
          <div className="space-y-5">
            {services.map((service, index) => {
              const scope = getServiceScope(service);
              const Icon = getServiceIcon(scope);
              const pending = hasActiveRequestForService(service);
              const approved = hasApprovedRequestForService(service);
              return (
                <article key={service.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="px-4 py-4 sm:px-5 flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900"><span className="mr-1.5">{index + 1}.</span>{service.name}</h3>
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{getServiceSubtitle(service, scope)}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-3 py-1.5 rounded-full border text-[10px] font-bold ${approved ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-700"}`}>{approved ? "Provisioned" : "Not Provisioned"}</span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="min-h-[190px] rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-center px-5 py-8">
                      <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4"><Icon className="w-5 h-5" /></div>
                      <div className="text-sm font-extrabold text-slate-900">{approved ? `Active ${service.name} Access` : `No Active ${service.name} Access`}</div>
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed max-w-xl mt-1.5">{approved ? "Your current access is active. You can use Renew when an extension is required." : getEmptyServiceText(scope)}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                        {approved && <button type="button" onClick={() => openService(service, "renewal")} className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Renew</button>}
                        <button type="button" disabled={pending} onClick={() => openService(service, "new")} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${pending ? "bg-slate-200 text-slate-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
                          <PlusCircle className="w-3.5 h-3.5" /> {pending ? "Requisition Pending" : `Apply for ${service.name}`}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-600" /> Facilities & Research Labs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Each active Facility Master record opens the laboratory access application.</p>
          </div>
          <span className="px-3 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-[11px] font-bold">{facilities.length} Active</span>
        </div>

        {loading ? (
          <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">Loading Facilities Master...</div>
        ) : facilities.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">No active facilities are configured in Facilities Master.</div>
        ) : (
          <div className="space-y-5">
            {facilities.map((facility, index) => (
              <article key={facility.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="px-4 py-4 sm:px-5 flex items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0"><FlaskConical className="w-5 h-5" /></div>
                    <div className="min-w-0"><h3 className="text-sm sm:text-base font-extrabold text-slate-900"><span className="mr-1.5">{index + 1}.</span>{facility.name}</h3><p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{facility.description || "Equipment usage authorization and research facility access."}</p></div>
                  </div>
                  <span className="shrink-0 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-[10px] font-bold">Available</span>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="min-h-[150px] rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-center px-5 py-7">
                    <div className="w-11 h-11 rounded-full bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mb-3"><FlaskConical className="w-5 h-5" /></div>
                    <div className="text-sm font-extrabold text-slate-900">{facility.name} Access</div>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xl">{facility.description || "Equipment usage authorization and research facility access."}</p>
                    <p className="text-[11px] text-slate-500 mt-2"><b>Nodal Officer:</b> {facility.nodal || "—"}</p>
                    <button type="button" onClick={() => openFacility(facility)} className="mt-4 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"><PlusCircle className="w-3.5 h-3.5" /> Apply for Facility Access</button>
                  </div>
                </div>
              </article>
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
