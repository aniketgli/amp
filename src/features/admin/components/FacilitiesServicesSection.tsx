import React, { useEffect, useMemo, useState } from "react";
import { Building2, Edit3, GitMerge, Pencil, Plus, Trash2, Wrench, X } from "lucide-react";
import { apiRequest } from "../../../api/apiClient";

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

interface LabFacilityRow {
  id: string;
  name: string;
  nodal: string;
  assocNodal: string;
  supervisor: string;
  status: "active" | "inactive";
}

interface OfficerOption {
  id: string | number;
  name: string;
}

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

function readLabRows(facility: any): LabFacilityRow[] {
  const configured = facility?.formConfig?.labFacilityRows;
  if (Array.isArray(configured)) {
    return configured
      .map((row: any, index: number) => ({
        id: String(row?.id || `LAB-${index + 1}`),
        name: String(row?.name || "").trim(),
        nodal: String(row?.nodal || "").trim(),
        assocNodal: String(row?.assocNodal || "").trim(),
        supervisor: String(row?.supervisor || "").trim(),
        status: String(row?.status || "active").toLowerCase() === "inactive" ? "inactive" : "active",
      }))
      .filter((row: LabFacilityRow) => row.name);
  }
  return Array.isArray(facility?.formConfig?.labNames)
    ? facility.formConfig.labNames.map((name: unknown, index: number) => ({ id: `LAB-${index + 1}`, name: String(name), nodal: "", assocNodal: "", supervisor: "", status: "active" as const }))
    : [];
}

export function FacilitiesServicesSection({
  facilitiesList,
  facilitiesLoading,
  facilitiesError,
  handleOpenWorkflowModal,
  servicesList,
  servicesLoading,
  servicesError,
  fetchServices,
  setEditingService,
  fetchFacilities,
}: FacilitiesServicesSectionProps) {
  const facility = facilitiesList[0];
  const [labRows, setLabRows] = useState<LabFacilityRow[]>(() => readLabRows(facility));
  const [editingRow, setEditingRow] = useState<LabFacilityRow | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [savingRows, setSavingRows] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [officerOptions, setOfficerOptions] = useState<OfficerOption[]>([]);
  const [editingServiceLocal, setEditingServiceLocal] = useState<any | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [serviceSaveError, setServiceSaveError] = useState<string | null>(null);

  useEffect(() => {
    setLabRows(readLabRows(facilitiesList[0]));
  }, [facilitiesList]);

  useEffect(() => {
    let cancelled = false;
    const loadOfficers = async () => {
      try {
        const response = await fetch("/api/users", { headers: { Accept: "application/json" } });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.users)) return;
        const users = data.users
          .map((user: any) => ({ id: user.id, name: String(user.fullName || user.name || "").trim() }))
          .filter((user: OfficerOption) => user.name);
        if (!cancelled) setOfficerOptions(users);
      } catch {
        // Keep the current values usable if the user directory is temporarily unavailable.
      }
    };
    loadOfficers();
    return () => { cancelled = true; };
  }, []);

  const showQuotaAccess = (service: any) => /email|internet/.test(
    String(`${service?.id} ${service?.name}`).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(),
  );

  const stages = useMemo(() => {
    if (!facility) return [];
    return facility.workflowStages?.length
      ? facility.workflowStages
      : getDefaultFacilityWorkflow(facility.supervisor, facility.assocNodal, facility.nodal);
  }, [facility]);

  const persistLabRows = async (nextRows: LabFacilityRow[]) => {
    if (!facility) return;
    setSavingRows(true);
    setRowError(null);
    try {
      const currentConfig = facility.formConfig && typeof facility.formConfig === "object" ? facility.formConfig : {};
      await apiRequest(`/api/facilities/${encodeURIComponent(String(facility.id))}`, {
        method: "PUT",
        body: JSON.stringify({
          name: facility.name,
          dept: facility.dept || null,
          nodal: facility.nodal || "Not Configured",
          assocNodal: facility.assocNodal || "Not Configured",
          supervisor: facility.supervisor || "Not Configured",
          desc: facility.desc || null,
          status: facility.status || "active",
          workflowStages: facility.workflowStages || stages,
          formConfig: { ...currentConfig, labFacilityRows: nextRows },
        }),
      });
      setLabRows(nextRows);
      await fetchFacilities();
      setEditingRow(null);
      setIsAddingRow(false);
    } catch (error) {
      setRowError(error instanceof Error ? error.message : "Unable to save lab/facility details.");
    } finally {
      setSavingRows(false);
    }
  };

  const handleDeleteRow = async (row: LabFacilityRow) => {
    if (!window.confirm(`Remove ${row.name} from Labs & Facility master?`)) return;
    await persistLabRows(labRows.filter((item) => item.id !== row.id));
  };

  const openAddRow = () => {
    setRowError(null);
    setEditingRow({ id: `LAB-${Date.now()}`, name: "", nodal: "", assocNodal: "", supervisor: "", status: "active" });
    setIsAddingRow(true);
  };

  const saveLabRow = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRow) return;
    const nextRows = isAddingRow
      ? [...labRows, editingRow]
      : labRows.map((item) => item.id === editingRow.id ? editingRow : item);
    await persistLabRows(nextRows);
  };

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
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-4 h-4 text-purple-600" />Labs & Facility Master <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px]">{facility ? labRows.length : 0} Total</span></h3>
            <p className="text-xs text-slate-500 mt-1">Each lab/facility has its own NO, ANO and Supervisor. All rows follow the same common approval workflow.</p>
          </div>
          <div className="flex items-center gap-2">
            {facility && <button onClick={() => handleOpenWorkflowModal("facility", facility)} className="px-3 py-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg text-xs font-bold flex items-center gap-1.5"><GitMerge className="w-3.5 h-3.5" />Approval Flow</button>}
            {facility && <button onClick={openAddRow} className="px-3 py-1.5 text-white bg-purple-700 hover:bg-purple-800 rounded-lg text-xs font-bold flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Add Lab / Facility</button>}
          </div>
        </div>

        {facilitiesLoading && <div className="py-8 text-center text-xs text-slate-500">Loading Labs & Facility...</div>}
        {facilitiesError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">{facilitiesError}</div>}
        {rowError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">{rowError}</div>}
        {!facilitiesLoading && !facilitiesError && !facility && <div className="py-10 text-center border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">Labs & Facility master record is not configured.</div>}

        {facility && <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-700">Labs & Facility</th>
                  <th className="px-4 py-3 font-bold text-slate-700">NO</th>
                  <th className="px-4 py-3 font-bold text-slate-700">ANO</th>
                  <th className="px-4 py-3 font-bold text-slate-700">Supervisor</th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {labRows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No labs/facilities configured yet. Click <b>Add Lab / Facility</b> to add a row.</td></tr>}
                {labRows.map((row) => <tr key={row.id} className={row.status === "inactive" ? "bg-slate-50 opacity-60" : "hover:bg-purple-50/30"}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                  <td className="px-4 py-3 text-slate-600">{row.nodal || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{row.assocNodal || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{row.supervisor || "—"}</td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => { setRowError(null); setEditingRow(row); setIsAddingRow(false); }} className="p-1.5 text-purple-700 hover:bg-purple-100 rounded" title="Edit Lab / Facility"><Pencil className="w-4 h-4" /></button><button onClick={() => void handleDeleteRow(row)} disabled={savingRows} className="p-1.5 text-red-500 hover:bg-red-50 rounded disabled:opacity-40" title="Remove Lab / Facility"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2"><span>Common Approval Flow: {stages.length} stages</span><span>Inactive rows remain in the master but can be excluded from applicant selection.</span></div>
        </div>}

        {editingRow && <div className="fixed inset-0 bg-slate-900/60 z-[170] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4"><div><h3 className="font-extrabold text-slate-900">{isAddingRow ? "Add Lab / Facility" : "Edit Lab / Facility"}</h3><p className="text-xs text-slate-500 mt-1">Set the current NO, ANO, Supervisor and status for this row.</p></div><button type="button" onClick={() => setEditingRow(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
            <form onSubmit={saveLabRow} className="space-y-3">
              <input required value={editingRow.name} onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })} placeholder="Lab / Facility Name" className="w-full p-2.5 border border-slate-300 rounded-xl" />
              <select required value={editingRow.nodal} onChange={(e) => setEditingRow({ ...editingRow, nodal: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="">Select Nodal Officer (NO)</option>{officerOptions.map((user) => <option key={user.id} value={user.name}>{user.name}</option>)}{editingRow.nodal && !officerOptions.some((user) => user.name === editingRow.nodal) && <option value={editingRow.nodal}>{editingRow.nodal}</option>}</select>
              <select required value={editingRow.assocNodal} onChange={(e) => setEditingRow({ ...editingRow, assocNodal: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="">Select Associate Nodal Officer (ANO)</option>{officerOptions.map((user) => <option key={user.id} value={user.name}>{user.name}</option>)}{editingRow.assocNodal && !officerOptions.some((user) => user.name === editingRow.assocNodal) && <option value={editingRow.assocNodal}>{editingRow.assocNodal}</option>}</select>
              <select required value={editingRow.supervisor} onChange={(e) => setEditingRow({ ...editingRow, supervisor: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="">Select Supervisor</option>{officerOptions.map((user) => <option key={user.id} value={user.name}>{user.name}</option>)}{editingRow.supervisor && !officerOptions.some((user) => user.name === editingRow.supervisor) && <option value={editingRow.supervisor}>{editingRow.supervisor}</option>}</select>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5"><div><div className="text-sm font-bold text-slate-800">Status</div><div className={`text-[11px] font-semibold mt-0.5 ${editingRow.status === "active" ? "text-emerald-700" : "text-slate-500"}`}>{editingRow.status === "active" ? "Active" : "Inactive"}</div></div><button type="button" role="switch" aria-checked={editingRow.status === "active"} onClick={() => setEditingRow({ ...editingRow, status: editingRow.status === "active" ? "inactive" : "active" })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingRow.status === "active" ? "bg-emerald-600" : "bg-slate-300"}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingRow.status === "active" ? "translate-x-6" : "translate-x-1"}`} /></button></div>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3"><button type="button" onClick={() => setEditingRow(null)} disabled={savingRows} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold disabled:opacity-50">Cancel</button><button type="submit" disabled={savingRows} className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold disabled:opacity-50">{savingRows ? "Saving..." : "Save Changes"}</button></div>
            </form>
          </div>
        </div>}
      </section>

      <section className="border-t border-slate-200 pt-6">
        <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-2 mb-4"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Wrench className="w-4 h-4 text-emerald-600" />Services Master Directory <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px]">{servicesList.length} Total</span></h3></div>
        {servicesLoading && <div className="py-8 text-center text-xs text-slate-500">Loading services...</div>}
        {servicesError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">{servicesError}</div>}
        {!servicesLoading && !servicesError && servicesList.length === 0 && <div className="py-10 text-center border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">No services found in database.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {servicesList.map((service) => {
            const serviceStages = service.workflowStages?.length ? service.workflowStages : getDefaultServiceWorkflow(service.manager);
            return <div key={service.id} className="p-4 border border-slate-200 bg-slate-50 rounded-xl transition-all hover:bg-white hover:border-emerald-300"><div className="space-y-3"><h3 className="font-bold text-slate-900 text-sm">{service.name}</h3><div className="flex items-center justify-between gap-3 text-xs text-slate-600"><div><b>Manager:</b> {service.manager || "—"}</div><button onClick={() => openServiceEditor(service)} className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded" title="Edit Service Manager / Details" aria-label={`Edit ${service.name}`}><Edit3 className="w-4 h-4" /></button></div>{showQuotaAccess(service) && <div className="text-xs text-slate-600"><b>Quota / Access:</b> {service.quota || "—"}</div>}<div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200"><div className="min-w-0"><span className="text-[11px] font-bold text-slate-700 flex items-center gap-1"><GitMerge className="w-3.5 h-3.5 text-emerald-600" />Approval Flow ({serviceStages.length} Stages)</span><div className="flex flex-wrap items-center gap-1 text-[10px] mt-1.5">{serviceStages.map((stg: any, idx: number) => <React.Fragment key={stg.stageNumber || idx}><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium" title={`Stage ${idx + 1}: ${stg.dealingOfficerName}`}>{idx + 1}. {String(stg.stageName || "").split(" ")[0]}</span>{idx < serviceStages.length - 1 && <span className="text-slate-400 font-bold">➔</span>}</React.Fragment>)}</div></div><button onClick={() => handleOpenWorkflowModal("service", service)} className="shrink-0 p-1.5 text-emerald-700 hover:bg-emerald-50 rounded" title="Configure Approval Flow" aria-label={`Configure approval flow for ${service.name}`}><GitMerge className="w-4 h-4" /></button></div></div></div>;
          })}
        </div>
      </section>

      {editingServiceLocal && <div className="fixed inset-0 bg-slate-900/60 z-[160] flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl"><div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4"><h3 className="font-extrabold text-slate-900 text-lg">{editingServiceLocal.name}</h3><button type="button" onClick={() => setEditingServiceLocal(null)} className="p-1.5 rounded-lg hover:bg-slate-100" aria-label="Close"><X className="w-5 h-5" /></button></div><div className="space-y-3"><div><label className="block text-[11px] font-bold text-slate-600 mb-1">Manager</label><select required value={editingServiceLocal.manager || ""} onChange={(e) => setEditingServiceLocal({ ...editingServiceLocal, manager: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white text-sm"><option value="">Select Manager</option></select></div>{showQuotaAccess(editingServiceLocal) && <div><label className="block text-[11px] font-bold text-slate-600 mb-1">Quota / Access</label><input value={editingServiceLocal.quota || ""} onChange={(e) => setEditingServiceLocal({ ...editingServiceLocal, quota: e.target.value })} placeholder="Enter quota / access details" className="w-full p-2.5 border border-slate-300 rounded-xl text-sm" /></div>}<div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-2"><div><div className="text-[11px] font-bold text-slate-700">Status</div><div className={`text-[10px] font-semibold mt-0.5 ${editingServiceLocal.status === "inactive" ? "text-slate-500" : "text-emerald-700"}`}>{editingServiceLocal.status === "inactive" ? "Inactive" : "Active"}</div></div><button type="button" role="switch" aria-checked={editingServiceLocal.status !== "inactive"} onClick={() => setEditingServiceLocal({ ...editingServiceLocal, status: editingServiceLocal.status === "inactive" ? "active" : "inactive" })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editingServiceLocal.status === "inactive" ? "bg-slate-300" : "bg-emerald-600"}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editingServiceLocal.status === "inactive" ? "translate-x-1" : "translate-x-6"}`} /></button></div>{serviceSaveError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{serviceSaveError}</div>}</div><div className="flex justify-end gap-2 border-t border-slate-200 pt-3 mt-4"><button type="button" onClick={() => setEditingServiceLocal(null)} disabled={savingService} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold disabled:opacity-50">Cancel</button><button type="button" onClick={saveService} disabled={savingService} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold disabled:opacity-50">{savingService ? "Saving..." : "Save Changes"}</button></div></div></div>}
    </div>
  );
}

export default FacilitiesServicesSection;
