import React, { useEffect, useState } from "react";
import { Building2, Edit3, GitMerge, Trash2, Wrench, X } from "lucide-react";

const getDefaultFacilityWorkflow = (supervisor: string, assocNodal: string, nodal: string): any[] => [
  { stageNumber: 1, stageName: "Supervising Officer / PI Endorsement", dealingOfficerName: "Applicant's Supervising Officer (PI)" },
  { stageNumber: 2, stageName: "Technical Supervisor Verification", dealingOfficerName: supervisor || "Lab Technical Supervisor" },
  { stageNumber: 3, stageName: "Associate Nodal Officer Review", dealingOfficerName: assocNodal || "Associate Nodal Officer" },
  { stageNumber: 4, stageName: "Nodal Officer Final Approval", dealingOfficerName: nodal || "Nodal Officer" },
];

const getDefaultServiceWorkflow = (manager: string): any[] => [
  { stageNumber: 1, stageName: "Supervising Officer / PI Endorsement", dealingOfficerName: "Applicant's Supervising Officer (PI)" },
  { stageNumber: 2, stageName: "In-Charge Manager Verification", dealingOfficerName: manager || "Service In-Charge Manager" },
  { stageNumber: 3, stageName: "IT Head / Admin Provisioning", dealingOfficerName: "IT Officer / System Admin" },
];

interface FacilitiesServicesSectionProps {
  facilitiesList: any[];
  facilitiesLoading: boolean;
  facilitiesError: string | null;
  fetchFacilities: () => void;
  setIsAddFacilityModalOpen: (open: boolean) => void;
  handleToggleFacilityStatus: (facility: any) => void;
  handleOpenWorkflowModal: (type: "facility" | "service", item: any) => void;
  setEditingFacility: (facility: any) => void;
  handleDeleteFacility: (id: any) => void;
  servicesList: any[];
  servicesLoading: boolean;
  servicesError: string | null;
  fetchServices: () => void;
  setIsAddServiceModalOpen: (open: boolean) => void;
  handleToggleServiceStatus: (service: any) => void;
  setEditingService: (service: any) => void;
  handleDeleteService: (id: any) => void;
}

interface ManagerOption {
  id: string | number;
  name: string;
}

export function FacilitiesServicesSection({
  facilitiesList,
  facilitiesLoading,
  facilitiesError,
  handleToggleFacilityStatus,
  handleOpenWorkflowModal,
  setEditingFacility,
  handleDeleteFacility,
  servicesList,
  servicesLoading,
  servicesError,
  fetchServices,
}: FacilitiesServicesSectionProps) {
  const [editingServiceLocal, setEditingServiceLocal] = useState<any | null>(null);
  const [managerOptions, setManagerOptions] = useState<ManagerOption[]>([]);
  const [savingService, setSavingService] = useState(false);
  const [serviceSaveError, setServiceSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadManagers = async () => {
      try {
        const response = await fetch("/api/users", { headers: { Accept: "application/json" } });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.users)) return;
        const managers = data.users
          .filter((user: any) => Array.isArray(user.roles) && user.roles.some((role: any) => ["manager", "it_head", "administrator"].includes(String(role?.code || ""))))
          .map((user: any) => ({ id: user.id, name: String(user.fullName || user.name || "").trim() }))
          .filter((user: ManagerOption) => user.name);
        if (!cancelled) setManagerOptions(managers);
      } catch {
        // Existing manager value remains usable if the options cannot be loaded.
      }
    };
    loadManagers();
    return () => { cancelled = true; };
  }, []);

  const showQuotaAccess = (service: any) => /email|internet/.test(
    String(`${service?.id} ${service?.name}`).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
  );

  const openServiceEditor = (service: any) => {
    setServiceSaveError(null);
    setEditingServiceLocal({ ...service });
  };

  const saveService = async () => {
    if (!editingServiceLocal) return;
    if (!String(editingServiceLocal.manager || "").trim()) {
      setServiceSaveError("Manager is required.");
      return;
    }
    setSavingService(true);
    setServiceSaveError(null);
    try {
      const response = await fetch(`/api/services/${encodeURIComponent(String(editingServiceLocal.id))}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: String(editingServiceLocal.name || "").trim(),
          manager: String(editingServiceLocal.manager || "").trim(),
          quota: showQuotaAccess(editingServiceLocal) ? String(editingServiceLocal.quota || "").trim() : "",
          status: editingServiceLocal.status === "inactive" ? "inactive" : "active",
          ...(Array.isArray(editingServiceLocal.workflowStages) ? { workflowStages: editingServiceLocal.workflowStages } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to update service.");
      await fetchServices();
      setEditingServiceLocal(null);
    } catch (error: any) {
      setServiceSaveError(error?.message || "Unable to update service.");
    } finally {
      setSavingService(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-extrabold text-slate-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-purple-600" />Facilities & Services Master Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Active records are published directly to the applicant Access tab. Inactive records are hidden there.</p>
        </div>
      </div>

      <section>
        <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-2 mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-4 h-4 text-purple-600" />Labs & Facility Master <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px]">{facilitiesList.length} Total</span></h3>
        </div>
        {facilitiesLoading && <div className="py-8 text-center text-xs text-slate-500">Loading Labs & Facility...</div>}
        {facilitiesError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">{facilitiesError}</div>}
        {!facilitiesLoading && !facilitiesError && facilitiesList.length === 0 && <div className="py-10 text-center border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">No Labs & Facility record found in database.</div>}
        <div className="grid grid-cols-1 gap-4">
          {facilitiesList.map((facility) => {
            const stages = facility.workflowStages?.length ? facility.workflowStages : getDefaultFacilityWorkflow(facility.supervisor, facility.assocNodal, facility.nodal);
            const isActive = String(facility.status || "active").toLowerCase() === "active";
            return (
              <div key={facility.id} className={`w-full p-4 border rounded-xl transition-all flex flex-col justify-between ${isActive ? "border-slate-200 bg-slate-50 hover:bg-white hover:border-purple-300" : "border-slate-300 bg-slate-100 opacity-65"}`}>
                <div>
                  <div className="flex justify-between gap-2"><div><h3 className="font-bold text-slate-900 text-sm">{facility.name}</h3></div><span className={`h-fit px-2 py-1 rounded text-[10px] font-bold uppercase ${isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>{isActive ? "ACTIVE" : "INACTIVE"}</span></div>
                  <div className="mt-3 text-xs text-slate-600 space-y-1.5"><div><b>Nodal Officer:</b> {facility.nodal || "—"}</div><div><b>Associate Nodal:</b> {facility.assocNodal || "—"}</div><div><b>Supervisor:</b> {facility.supervisor || "—"}</div>{facility.desc && <div className="pt-1 text-slate-500">{facility.desc}</div>}</div>
                  <div className="mt-3 pt-3 border-t border-slate-200"><span className="text-[11px] font-bold text-slate-700 flex items-center gap-1"><GitMerge className="w-3.5 h-3.5 text-purple-600" />Approval Flow ({stages.length} Stages)</span><div className="flex flex-wrap items-center gap-1 text-[10px] mt-1.5">{stages.map((stg: any, idx: number) => <React.Fragment key={stg.stageNumber || idx}><span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-medium" title={`Stage ${idx + 1}: ${stg.dealingOfficerName}`}>{idx + 1}. {String(stg.stageName || "").split(" ")[0]}</span>{idx < stages.length - 1 && <span className="text-slate-400 font-bold">➔</span>}</React.Fragment>)}</div></div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200"><button onClick={() => handleToggleFacilityStatus(facility)} className={`px-2.5 py-1 rounded text-[11px] font-semibold ${isActive ? "bg-slate-200 hover:bg-slate-300" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"}`}>{isActive ? "Set Inactive" : "Set Active"}</button><div className="flex gap-1"><button onClick={() => handleOpenWorkflowModal("facility", facility)} className="p-1.5 text-purple-700 hover:bg-purple-50 rounded" title="Configure Workflow Flow/Stages"><GitMerge className="w-4 h-4" /></button><button onClick={() => setEditingFacility(facility)} className="p-1.5 text-purple-700 hover:bg-purple-50 rounded" title="Edit Labs & Facility"><Edit3 className="w-4 h-4" /></button><button onClick={() => handleDeleteFacility(facility.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete Labs & Facility"><Trash2 className="w-4 h-4" /></button></div></div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-2 mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Wrench className="w-4 h-4 text-emerald-600" />Services Master Directory <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px]">{servicesList.length} Total</span></h3></div>
        {servicesLoading && <div className="py-8 text-center text-xs text-slate-500">Loading services...</div>}
        {servicesError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">{servicesError}</div>}
        {!servicesLoading && !servicesError && servicesList.length === 0 && <div className="py-10 text-center border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">No services found in database.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicesList.map((service) => {
            const stages = service.workflowStages?.length ? service.workflowStages : getDefaultServiceWorkflow(service.manager);
            const hasQuota = showQuotaAccess(service);
            return (
              <div key={service.id} className="p-4 border border-slate-200 bg-slate-50 rounded-xl transition-all hover:bg-white hover:border-emerald-300">
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">{service.name}</h3>

                  <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
                    <div><b>Manager:</b> {service.manager || "—"}</div>
                    <button onClick={() => openServiceEditor(service)} className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded" title="Edit Service Manager / Details" aria-label={`Edit ${service.name}`}><Edit3 className="w-4 h-4" /></button>
                  </div>

                  {hasQuota && <div className="text-xs text-slate-600"><b>Quota / Access:</b> {service.quota || "—"}</div>}

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1"><GitMerge className="w-3.5 h-3.5 text-emerald-600" />Approval Flow ({stages.length} Stages)</span>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] mt-1.5">{stages.map((stg: any, idx: number) => <React.Fragment key={stg.stageNumber || idx}><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium" title={`Stage ${idx + 1}: ${stg.dealingOfficerName}`}>{idx + 1}. {String(stg.stageName || "").split(" ")[0]}</span>{idx < stages.length - 1 && <span className="text-slate-400 font-bold">➔</span>}</React.Fragment>)}</div>
                    </div>
                    <button onClick={() => handleOpenWorkflowModal("service", service)} className="shrink-0 p-1.5 text-emerald-700 hover:bg-emerald-50 rounded" title="Configure Approval Flow" aria-label={`Configure approval flow for ${service.name}`}><GitMerge className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {editingServiceLocal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[160] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg">{editingServiceLocal.name}</h3>
              <button type="button" onClick={() => setEditingServiceLocal(null)} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Manager</label>
                <select required value={editingServiceLocal.manager || ""} onChange={(e) => setEditingServiceLocal({ ...editingServiceLocal, manager: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-sm">
                  <option value="">Select Manager</option>
                  {managerOptions.map((manager) => <option key={manager.id} value={manager.name}>{manager.name}</option>)}
                  {editingServiceLocal.manager && !managerOptions.some((manager) => manager.name === editingServiceLocal.manager) && <option value={editingServiceLocal.manager}>{editingServiceLocal.manager}</option>}
                </select>
              </div>

              {showQuotaAccess(editingServiceLocal) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Quota / Access</label>
                  <input value={editingServiceLocal.quota || ""} onChange={(e) => setEditingServiceLocal({ ...editingServiceLocal, quota: e.target.value })} placeholder="Enter quota / access details" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm" />
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-700">Status</div>
                  <div className={`text-[10px] font-semibold mt-0.5 ${editingServiceLocal.status === "inactive" ? "text-slate-500" : "text-emerald-700"}`}>{editingServiceLocal.status === "inactive" ? "Inactive" : "Active"}</div>
                </div>
                <button type="button" role="switch" aria-checked={editingServiceLocal.status !== "inactive"} onClick={() => setEditingServiceLocal({ ...editingServiceLocal, status: editingServiceLocal.status === "inactive" ? "active" : "inactive" })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingServiceLocal.status === "inactive" ? "bg-slate-300" : "bg-emerald-600"}`} title="Toggle Active / Inactive">
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingServiceLocal.status === "inactive" ? "translate-x-1" : "translate-x-6"}`} />
                </button>
              </div>

              {serviceSaveError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{serviceSaveError}</div>}
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 mt-4">
              <button type="button" onClick={() => setEditingServiceLocal(null)} disabled={savingService} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold disabled:opacity-50">Cancel</button>
              <button type="button" onClick={saveService} disabled={savingService} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold disabled:opacity-50">{savingService ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
