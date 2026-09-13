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

  if (value.includes("webmail") || value.includes("email") || value.includes("mail")) {
    return "email";
  }

  if (
    value.includes("wifi") ||
    value.includes("wi-fi") ||
    value.includes("internet") ||
    value.includes("mac") ||
    value.includes("network")
  ) {
    return "mac";
  }

  if (
    value.includes("hrms") ||
    value.includes("payroll") ||
    value.includes("biometric") ||
    value.includes("attendance")
  ) {
    return "hrms";
  }

  // Existing requisition API supports IT/HRMS for service requests.
  // Unknown active services therefore use the combined service form
  // rather than silently hiding an administrator-created service.
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

  const activeRoleInfo =
    OFFICIAL_ROLES.find((role) => role.id === currentRole) || OFFICIAL_ROLES[0];

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

        setServices(
          (servicesResponse.services || []).filter(
            (item) => String(item.status || "active").toLowerCase() === "active",
          ),
        );
        setFacilities(
          (facilitiesResponse.facilities || []).filter(
            (item) => String(item.status || "active").toLowerCase() === "active",
          ),
        );
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
    () =>
      requisitions.filter(
        (req) =>
          req.applicant?.personalEmail === applicantProfile.personalEmail ||
          req.applicant?.applicantName === applicantProfile.applicantName,
      ),
    [requisitions, applicantProfile.personalEmail, applicantProfile.applicantName],
  );

  const approvedReqs = userRequisitions.filter(
    (req) => req.status === "approved_provisioned",
  );
  const pendingReqs = userRequisitions.filter(
    (req) =>
      req.status !== "approved_provisioned" &&
      req.status !== "rejected" &&
      req.status !== "deactivated",
  );

  const hasActiveRequestForService = (service: ServiceApiRecord) => {
    const scope = getServiceScope(service);

    return pendingReqs.some((req) => {
      if (scope === "email") return Boolean(req.itHrmsDetails?.requestEmail);
      if (scope === "mac") return Boolean(req.itHrmsDetails?.requestInternet);
      if (scope === "hrms") {
        return Boolean(
          req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric,
        );
      }
      return req.type === "COMBINED";
    });
  };

  const hasApprovedRequestForService = (service: ServiceApiRecord) => {
    const scope = getServiceScope(service);

    return approvedReqs.some((req) => {
      if (scope === "email") return Boolean(req.itHrmsDetails?.requestEmail);
      if (scope === "mac") return Boolean(req.itHrmsDetails?.requestInternet);
      if (scope === "hrms") {
        return Boolean(
          req.itHrmsDetails?.requestHrmsPms || req.itHrmsDetails?.requestBiometric,
        );
      }
      return req.type === "COMBINED";
    });
  };

  const openService = (service: ServiceApiRecord, mode: "new" | "renewal") => {
    if (hasActiveRequestForService(service) && mode === "new") return;

    setModalConfig({
      serviceScope: getServiceScope(service),
      mode,
    });
  };

  const openFacility = (facility: FacilityApiRecord) => {
    setModalConfig({
      serviceScope: "lab",
      mode: "new",
      initialLabId: facility.id,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[140px]">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 pointer-events-none blur-2xl" />
        <div className="space-y-1.5 max-w-3xl min-w-0 flex-1 z-10 relative">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" /> Access Management Portal
            </span>
            <span className="text-xs text-slate-400">• Wildlife Institute of India</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {currentRole === "applicant" ? "Personnel Requisition & Access Hub" : `${activeRoleInfo.title} Access Hub`}
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            Access forms are generated from the active Facilities & Services Master records. Admin changes to a master are reflected here automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab?.("my_requests")}
          className="z-10 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shrink-0"
        >
          <FileText className="w-4 h-4" /> All Requests <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {currentRole !== "applicant" && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-blue-900">Official Role Mode Active: {activeRoleInfo.title}</span>
              <p className="text-blue-700 text-[11px]">Master-driven access services are shown according to the current database configuration.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          <div><div className="text-2xl font-extrabold text-slate-900">{approvedReqs.length}</div><div className="text-xs font-bold text-slate-700">Active Authorized Access</div></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <Clock className="w-8 h-8 text-amber-600" />
          <div><div className="text-2xl font-extrabold text-slate-900">{pendingReqs.length}</div><div className="text-xs font-bold text-slate-700">Pending Requisitions</div></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-600" />
          <div><div className="text-2xl font-extrabold text-slate-900">{approvedReqs.length}</div><div className="text-xs font-bold text-slate-700">Eligible for Renewal</div></div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><Wrench className="w-5 h-5 text-emerald-600" /> Services</h2>
            <p className="text-xs text-slate-500">Only active Services Master records are available for application.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">Loading Services Master...</div>
        ) : services.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">No active services are configured in Services Master.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => {
              const scope = getServiceScope(service);
              const Icon = getServiceIcon(scope);
              const pending = hasActiveRequestForService(service);
              const approved = hasApprovedRequestForService(service);

              return (
                <div key={service.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"><Icon className="w-5 h-5" /></div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{service.id}</span>
                        {approved && <span className="text-[10px] font-bold text-emerald-700">Active</span>}
                        {pending && <span className="text-[10px] font-bold text-amber-700">Pending</span>}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-2">{service.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{getServiceDescription(service, scope)}</p>
                      <p className="text-[11px] text-slate-500 mt-2"><b>Service Manager:</b> {service.manager || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    {approved && (
                      <button type="button" onClick={() => openService(service, "renewal")} className="px-3 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold">Renew</button>
                    )}
                    <button type="button" disabled={pending} onClick={() => openService(service, "new")} className={`px-3 py-2 rounded-lg text-xs font-bold ${pending ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-500"}`}>
                      {pending ? "Requisition Pending" : "Apply for Access"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-600" /> Facilities</h2>
          <p className="text-xs text-slate-500">Only active Facilities Master records are available for laboratory/facility access.</p>
        </div>

        {loading ? (
          <div className="p-10 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500">Loading Facilities Master...</div>
        ) : facilities.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">No active facilities are configured in Facilities Master.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((facility) => (
              <div key={facility.id} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between gap-4">
                <div className="flex gap-3">
                  <div className="p-2.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 shrink-0"><FlaskConical className="w-5 h-5" /></div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">{facility.id}</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-2">{facility.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{facility.description || "Facility access and instrument usage request."}</p>
                    <p className="text-[11px] text-slate-500 mt-2"><b>Nodal Officer:</b> {facility.nodal || "—"}</p>
                  </div>
                </div>
                <button type="button" onClick={() => openFacility(facility)} className="w-full px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold">Apply for Facility Access</button>
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
