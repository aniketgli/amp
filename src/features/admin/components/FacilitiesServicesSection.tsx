import React, { useEffect, useMemo, useState } from "react";
import { Building2, Edit3, GitMerge, Pencil, Plus, Trash2, Wrench, X, ArrowUp, ArrowDown } from "lucide-react";
import { apiRequest } from "../../../api/apiClient";

type ApprovalMode = "all" | "any_one";

interface WorkflowStage {
  stageNumber: number;
  stageName: string;
  dealingRole: string;
  dealingOfficerName: string;
  actionType: "endorsement" | "verification" | "approval" | "provisioning";
  approvalMode: ApprovalMode;
  isMandatory: boolean;
}

const getDefaultFacilityWorkflow = (): WorkflowStage[] => [
  { stageNumber: 1, stageName: "Supervising Officer / PI Endorsement", dealingRole: "reporting_manager", dealingOfficerName: "Applicant's Supervising Officer (PI)", actionType: "endorsement", approvalMode: "all", isMandatory: true },
  { stageNumber: 2, stageName: "Technical Supervisor Verification", dealingRole: "supervisor", dealingOfficerName: "Selected Lab Supervisor", actionType: "verification", approvalMode: "all", isMandatory: true },
  { stageNumber: 3, stageName: "Lab NO / ANO Review", dealingRole: "lab_nodal_group", dealingOfficerName: "Selected Lab's NO + ANO", actionType: "approval", approvalMode: "any_one", isMandatory: true },
];

const getDefaultServiceWorkflow = (manager: string): WorkflowStage[] => [
  { stageNumber: 1, stageName: "Supervising Officer / PI Endorsement", dealingRole: "reporting_manager", dealingOfficerName: "Applicant's Supervising Officer (PI)", actionType: "endorsement", approvalMode: "all", isMandatory: true },
  { stageNumber: 2, stageName: "In-Charge Manager Verification", dealingRole: "manager", dealingOfficerName: manager || "Service In-Charge Manager", actionType: "verification", approvalMode: "all", isMandatory: true },
  { stageNumber: 3, stageName: "IT Head / Admin Provisioning", dealingRole: "it_head", dealingOfficerName: "IT Officer / System Admin", actionType: "provisioning", approvalMode: "all", isMandatory: true },
];

interface LabFacilityRow { id: string; name: string; nodal: string; assocNodal: string; supervisor: string; status: "active" | "inactive"; }
interface OfficerOption { id: string | number; name: string; }
interface FacilitiesServicesSectionProps {
  facilitiesList: any[]; facilitiesLoading: boolean; facilitiesError: string | null; fetchFacilities: () => void;
  servicesList: any[]; servicesLoading: boolean; servicesError: string | null; fetchServices: () => void;
  setIsAddFacilityModalOpen?: (open: boolean) => void;
  handleToggleFacilityStatus?: (facility: any) => void;
  handleOpenWorkflowModal?: (type: "facility" | "service", item: any) => void;
  setEditingFacility?: (facility: any) => void;
  handleDeleteFacility?: (id: any) => void;
  setIsAddServiceModalOpen?: (open: boolean) => void;
  handleToggleServiceStatus?: (service: any) => void;
  setEditingService?: (service: any) => void;
  handleDeleteService?: (id: any) => void;
}

function readLabRows(facility: any): LabFacilityRow[] {
  const rows = facility?.formConfig?.labFacilityRows;
  if (Array.isArray(rows)) return rows.map((row: any, i: number) => ({
    id: String(row?.id || `LAB-${i + 1}`), name: String(row?.name || "").trim(), nodal: String(row?.nodal || "").trim(), assocNodal: String(row?.assocNodal || "").trim(), supervisor: String(row?.supervisor || "").trim(), status: String(row?.status || "active").toLowerCase() === "inactive" ? "inactive" as const : "active" as const,
  })).filter((row: LabFacilityRow) => row.name);
  return Array.isArray(facility?.formConfig?.labNames) ? facility.formConfig.labNames.map((name: unknown, i: number) => ({ id: `LAB-${i + 1}`, name: String(name), nodal: "", assocNodal: "", supervisor: "", status: "active" as const })) : [];
}

function normalizeStages(stages: any[], type: "facility" | "service", manager = ""): WorkflowStage[] {
  const defaults = type === "facility" ? getDefaultFacilityWorkflow() : getDefaultServiceWorkflow(manager);
  if (!Array.isArray(stages) || stages.length === 0) return defaults;
  return stages.map((s: any, i: number) => ({
    stageNumber: i + 1,
    stageName: String(s?.stageName || "Review & Approval"),
    dealingRole: String(s?.dealingRole || "supervisor"),
    dealingOfficerName: String(s?.dealingOfficerName || "Dealing Officer / Supervisor"),
    actionType: ["endorsement", "verification", "approval", "provisioning"].includes(s?.actionType) ? s.actionType : "verification",
    approvalMode: s?.approvalMode === "any_one" ? "any_one" : "all",
    isMandatory: s?.isMandatory !== false,
  }));
}

export function FacilitiesServicesSection({ facilitiesList, facilitiesLoading, facilitiesError, servicesList, servicesLoading, servicesError, fetchServices, fetchFacilities }: FacilitiesServicesSectionProps) {
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
  const [editingWorkflow, setEditingWorkflow] = useState<{ type: "facility" | "service"; item: any; stages: WorkflowStage[] } | null>(null);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  useEffect(() => { setLabRows(readLabRows(facilitiesList[0])); }, [facilitiesList]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/users", { headers: { Accept: "application/json" } });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.users)) return;
        const users = data.users.map((u: any) => ({ id: u.id, name: String(u.fullName || u.name || "").trim() })).filter((u: OfficerOption) => u.name);
        if (!cancelled) setOfficerOptions(users);
      } catch { /* keep current values usable */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const showQuotaAccess = (service: any) => /email|internet/.test(String(`${service?.id} ${service?.name}`).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
  const facilityStages = useMemo(() => facility?.workflowStages?.length ? normalizeStages(facility.workflowStages, "facility") : getDefaultFacilityWorkflow(), [facility]);

  const persistLabRows = async (nextRows: LabFacilityRow[]) => {
    if (!facility) return;
    setSavingRows(true); setRowError(null);
    try {
      const currentConfig = facility.formConfig && typeof facility.formConfig === "object" ? facility.formConfig : {};
      await apiRequest(`/api/facilities/${encodeURIComponent(String(facility.id))}`, { method: "PUT", body: JSON.stringify({ name: facility.name, dept: facility.dept || null, nodal: facility.nodal || "Not Configured", assocNodal: facility.assocNodal || "Not Configured", supervisor: facility.supervisor || "Not Configured", desc: facility.desc || null, status: facility.status || "active", workflowStages: facility.workflowStages || facilityStages, formConfig: { ...currentConfig, labFacilityRows: nextRows } }) });
      setLabRows(nextRows); await fetchFacilities(); setEditingRow(null); setIsAddingRow(false);
    } catch (error) { setRowError(error instanceof Error ? error.message : "Unable to save lab/facility details."); }
    finally { setSavingRows(false); }
  };

  const openAddRow = () => { setRowError(null); setEditingRow({ id: `LAB-${Date.now()}`, name: "", nodal: "", assocNodal: "", supervisor: "", status: "active" }); setIsAddingRow(true); };
  const saveLabRow = async (e: React.FormEvent) => { e.preventDefault(); if (!editingRow) return; await persistLabRows(isAddingRow ? [...labRows, editingRow] : labRows.map(r => r.id === editingRow.id ? editingRow : r)); };
  const deleteLabRow = async (row: LabFacilityRow) => { if (window.confirm(`Remove ${row.name} from Labs & Facility master?`)) await persistLabRows(labRows.filter(r => r.id !== row.id)); };

  const openServiceEditor = (service: any) => { setServiceSaveError(null); setEditingServiceLocal({ ...service }); };
  const saveService = async () => {
    if (!editingServiceLocal) return;
    if (!String(editingServiceLocal.manager || "").trim()) { setServiceSaveError("Manager is required."); return; }
    setSavingService(true); setServiceSaveError(null);
    try {
      const response = await fetch(`/api/services/${encodeURIComponent(String(editingServiceLocal.id))}`, { method: "PUT", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ name: String(editingServiceLocal.name || "").trim(), manager: String(editingServiceLocal.manager || "").trim(), quota: showQuotaAccess(editingServiceLocal) ? String(editingServiceLocal.quota || "").trim() : "", status: editingServiceLocal.status === "inactive" ? "inactive" : "active", ...(Array.isArray(editingServiceLocal.workflowStages) ? { workflowStages: normalizeStages(editingServiceLocal.workflowStages, "service", editingServiceLocal.manager) } : {}) }) });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || "Unable to update service.");
      await fetchServices(); setEditingServiceLocal(null);
    } catch (error: any) { setServiceSaveError(error?.message || "Unable to update service."); }
    finally { setSavingService(false); }
  };

  const openWorkflowEditor = (type: "facility" | "service", item: any) => {
    const initial = Array.isArray(item?.workflowStages) && item.workflowStages.length ? item.workflowStages : type === "facility" ? getDefaultFacilityWorkflow() : getDefaultServiceWorkflow(item?.manager || "");
    setWorkflowError(null);
    setEditingWorkflow({ type, item, stages: normalizeStages(initial, type, item?.manager || "") });
  };
  const updateStage = (index: number, patch: Partial<WorkflowStage>) => {
    if (!editingWorkflow) return;
    setEditingWorkflow({ ...editingWorkflow, stages: editingWorkflow.stages.map((s, i) => i === index ? { ...s, ...patch } : s) });
  };
  const addStage = () => {
    if (!editingWorkflow) return;
    const n = editingWorkflow.stages.length + 1;
    setEditingWorkflow({ ...editingWorkflow, stages: [...editingWorkflow.stages, { stageNumber: n, stageName: "Review & Approval", dealingRole: "supervisor", dealingOfficerName: "Dealing Officer / Supervisor", actionType: "verification", approvalMode: "all", isMandatory: true }] });
  };
  const removeStage = (index: number) => {
    if (!editingWorkflow) return;
    setEditingWorkflow({ ...editingWorkflow, stages: editingWorkflow.stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, stageNumber: i + 1 })) });
  };
  const moveStage = (index: number, direction: -1 | 1) => {
    if (!editingWorkflow) return;
    const target = index + direction;
    if (target < 0 || target >= editingWorkflow.stages.length) return;
    const next = [...editingWorkflow.stages]; [next[index], next[target]] = [next[target], next[index]];
    setEditingWorkflow({ ...editingWorkflow, stages: next.map((s, i) => ({ ...s, stageNumber: i + 1 })) });
  };
  const saveWorkflow = async () => {
    if (!editingWorkflow) return;
    setWorkflowSaving(true); setWorkflowError(null);
    try {
      const stagesToSave = normalizeStages(editingWorkflow.stages, editingWorkflow.type, editingWorkflow.item?.manager || "");
      const path = editingWorkflow.type === "facility" ? `/api/facilities/${encodeURIComponent(String(editingWorkflow.item.id))}` : `/api/services/${encodeURIComponent(String(editingWorkflow.item.id))}`;
      const body = editingWorkflow.type === "facility"
        ? { name: editingWorkflow.item.name, dept: editingWorkflow.item.dept || null, nodal: editingWorkflow.item.nodal || "Not Configured", assocNodal: editingWorkflow.item.assocNodal || "Not Configured", supervisor: editingWorkflow.item.supervisor || "Not Configured", desc: editingWorkflow.item.desc || null, status: editingWorkflow.item.status || "active", workflowStages: stagesToSave, formConfig: editingWorkflow.item.formConfig || {} }
        : { name: editingWorkflow.item.name, manager: editingWorkflow.item.manager || "Not Configured", quota: showQuotaAccess(editingWorkflow.item) ? editingWorkflow.item.quota || "" : "", status: editingWorkflow.item.status === "inactive" ? "inactive" : "active", workflowStages: stagesToSave };
      const response = await fetch(path, { method: "PUT", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || "Unable to save approval workflow.");
      if (editingWorkflow.type === "facility") await fetchFacilities(); else await fetchServices();
      setEditingWorkflow(null);
    } catch (error: any) { setWorkflowError(error?.message || "Unable to save approval workflow."); }
    finally { setWorkflowSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-8">
      <section>
        <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-2 mb-4">
          <div><h3 className="font-bold text-slate-800 flex items-center gap-2"><Building2 className="w-4 h-4 text-purple-600" />Labs & Facility Master <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px]">{facility ? labRows.length : 0} Total</span></h3><p className="text-xs text-slate-500 mt-1">Each lab/facility has its own NO, ANO and Supervisor. All rows follow the same common approval workflow.</p></div>
          <button disabled={!facility} onClick={openAddRow} className="px-3 py-1.5 text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 rounded-lg text-xs font-bold flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Add Lab / Facility</button>
        </div>
        {facilitiesLoading && <div className="py-8 text-center text-xs text-slate-500">Loading Labs & Facility...</div>}
        {facilitiesError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">{facilitiesError}</div>}
        {rowError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">{rowError}</div>}
        {!facilitiesLoading && !facilitiesError && !facility && <div className="py-10 text-center border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">Labs & Facility master record is not configured.</div>}
        {facility && <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-4 py-3 font-bold text-slate-700">Labs & Facility</th><th className="px-4 py-3 font-bold text-slate-700">NO</th><th className="px-4 py-3 font-bold text-slate-700">ANO</th><th className="px-4 py-3 font-bold text-slate-700">Supervisor</th><th className="px-4 py-3 font-bold text-slate-700 text-right">Edit</th></tr></thead>
          <tbody className="divide-y divide-slate-200">{labRows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No labs/facilities configured yet. Click <b>Add Lab / Facility</b> to add a row.</td></tr>}{labRows.map(row => <tr key={row.id} className={row.status === "inactive" ? "bg-slate-50 opacity-60" : "hover:bg-purple-50/30"}><td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td><td className="px-4 py-3 text-slate-600">{row.nodal || "—"}</td><td className="px-4 py-3 text-slate-600">{row.assocNodal || "—"}</td><td className="px-4 py-3 text-slate-600">{row.supervisor || "—"}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => { setRowError(null); setEditingRow(row); setIsAddingRow(false); }} className="p-1.5 text-purple-700 hover:bg-purple-100 rounded" title="Edit Lab / Facility"><Pencil className="w-4 h-4" /></button><button onClick={() => void deleteLabRow(row)} disabled={savingRows} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Remove Lab / Facility"><Trash2 className="w-4 h-4" /></button></div></td></tr>)}</tbody></table></div>
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-50 border-t border-slate-200"><div><span className="text-[11px] font-bold text-slate-700 flex items-center gap-1"><GitMerge className="w-3.5 h-3.5 text-purple-600" />Approval Flow ({facilityStages.length} Stages)</span><div className="flex flex-wrap items-center gap-1 text-[10px] mt-1.5">{facilityStages.map((stage, i) => <React.Fragment key={stage.stageNumber || i}><span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-medium">{String(stage.stageName).split(" ")[0]}</span>{i < facilityStages.length - 1 && <span className="text-slate-400 font-bold">➔</span>}</React.Fragment>)}</div></div><button onClick={() => openWorkflowEditor("facility", facility)} className="shrink-0 p-1.5 text-purple-700 hover:bg-purple-100 rounded" title="Configure Approval Flow"><GitMerge className="w-4 h-4" /></button></div>
        </div>}
      </section>

      <section>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4"><div className="flex items-center gap-2"><Wrench className="w-4 h-4 text-emerald-600" /><h3 className="font-bold text-slate-800">Services Master Directory</h3><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px]">{servicesList.filter(s => s.status !== "inactive").length} Total</span></div></div>
        {servicesLoading && <div className="py-8 text-center text-xs text-slate-500">Loading Services...</div>}
        {servicesError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">{servicesError}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{servicesList.filter(s => s.status !== "inactive").map(service => { const serviceStages = service.workflowStages?.length ? normalizeStages(service.workflowStages, "service", service.manager) : getDefaultServiceWorkflow(service.manager); return <div key={service.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5"><h4 className="font-bold text-slate-900 text-base leading-snug">{service.name}</h4><div className="mt-3 space-y-1.5 text-sm"><div><span className="font-bold text-slate-700">Manager:</span> <span className="text-slate-600">{service.manager || "Not Configured"}</span><button onClick={() => openServiceEditor(service)} className="ml-2 inline-flex p-1 text-emerald-700 hover:bg-emerald-100 rounded" title="Edit Service"><Edit3 className="w-4 h-4" /></button></div>{showQuotaAccess(service) && <div><span className="font-bold text-slate-700">Quota / Access:</span> <span className="text-slate-600">{service.quota || "Not Configured"}</span></div>}</div><div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between"><div><div className="text-xs font-bold text-slate-700 flex items-center gap-1"><GitMerge className="w-3.5 h-3.5 text-emerald-600" />Approval Flow ({serviceStages.length} Stages)</div><div className="flex flex-wrap items-center gap-1 mt-1.5 text-[10px]">{serviceStages.map((stage, i) => <React.Fragment key={stage.stageNumber || i}><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">{String(stage.stageName).split(" ")[0]}</span>{i < serviceStages.length - 1 && <span className="text-slate-400 font-bold">➔</span>}</React.Fragment>)}</div></div><button onClick={() => openWorkflowEditor("service", service)} className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded" title="Configure Approval Flow"><GitMerge className="w-4 h-4" /></button></div></div>; })}</div>
      </section>

      {editingRow && <div className="fixed inset-0 bg-slate-900/60 z-[170] flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl"><div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4"><div><h3 className="font-extrabold text-slate-900">{isAddingRow ? "Add Lab / Facility" : "Edit Lab / Facility"}</h3><p className="text-xs text-slate-500 mt-1">Set the current NO, ANO, Supervisor and status for this row.</p></div><button type="button" onClick={() => setEditingRow(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button></div><form onSubmit={saveLabRow} className="space-y-3"><input required value={editingRow.name} onChange={e => setEditingRow({ ...editingRow, name: e.target.value })} placeholder="Lab / Facility Name" className="w-full p-2.5 border border-slate-300 rounded-xl" /><select required value={editingRow.nodal} onChange={e => setEditingRow({ ...editingRow, nodal: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="">Select Nodal Officer (NO)</option>{officerOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select><select required value={editingRow.assocNodal} onChange={e => setEditingRow({ ...editingRow, assocNodal: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="">Select Associate Nodal Officer (ANO)</option>{officerOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select><select required value={editingRow.supervisor} onChange={e => setEditingRow({ ...editingRow, supervisor: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="">Select Supervisor</option>{officerOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select><select value={editingRow.status} onChange={e => setEditingRow({ ...editingRow, status: e.target.value as "active" | "inactive" })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="active">Active</option><option value="inactive">Inactive</option></select><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEditingRow(null)} className="px-4 py-2 rounded-lg bg-slate-100 font-semibold">Cancel</button><button type="submit" disabled={savingRows} className="px-4 py-2 rounded-lg bg-purple-700 text-white font-semibold disabled:opacity-50">{savingRows ? "Saving..." : "Save"}</button></div></form></div></div>}

      {editingServiceLocal && <div className="fixed inset-0 bg-slate-900/60 z-[175] flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-xl p-7 shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5"><h3 className="font-extrabold text-slate-900 text-lg">{editingServiceLocal.name}</h3><button type="button" onClick={() => setEditingServiceLocal(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button></div><div className="space-y-4"><select value={editingServiceLocal.manager || ""} onChange={e => setEditingServiceLocal({ ...editingServiceLocal, manager: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl bg-white"><option value="">Select Manager</option>{officerOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>{showQuotaAccess(editingServiceLocal) && <input value={editingServiceLocal.quota || ""} onChange={e => setEditingServiceLocal({ ...editingServiceLocal, quota: e.target.value })} placeholder="Quota / Access" className="w-full p-3 border border-slate-300 rounded-xl" />}<label className="flex items-center justify-between gap-4 border border-slate-200 rounded-xl px-4 py-3"><span className="font-semibold text-slate-700">Status</span><button type="button" role="switch" aria-checked={editingServiceLocal.status !== "inactive"} onClick={() => setEditingServiceLocal({ ...editingServiceLocal, status: editingServiceLocal.status === "inactive" ? "active" : "inactive" })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${editingServiceLocal.status === "inactive" ? "bg-slate-300" : "bg-emerald-600"}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${editingServiceLocal.status === "inactive" ? "translate-x-1" : "translate-x-6"}`} /></button></label>{serviceSaveError && <div className="text-xs text-red-600">{serviceSaveError}</div>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEditingServiceLocal(null)} className="px-4 py-2 rounded-lg bg-slate-100 font-semibold">Cancel</button><button type="button" onClick={() => void saveService()} disabled={savingService} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50">{savingService ? "Saving..." : "Save Changes"}</button></div></div></div></div>}

      {editingWorkflow && <div className="fixed inset-0 bg-slate-900/60 z-[180] flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><div><h3 className="font-extrabold text-slate-900 text-lg">Approval Flow</h3><p className="text-xs text-slate-500 mt-1">{editingWorkflow.item?.name || "Workflow"}</p></div><button type="button" onClick={() => setEditingWorkflow(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button></div><div className="p-5 max-h-[calc(92vh-140px)] overflow-y-auto space-y-4">{editingWorkflow.stages.map((stage, index) => <div key={`${stage.stageNumber}-${index}`} className="border border-slate-200 rounded-xl p-5 bg-slate-50/40"><div className="flex items-center justify-end gap-1 mb-4"><button type="button" onClick={() => moveStage(index, -1)} disabled={index === 0} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-30" title="Move up"><ArrowUp className="w-4 h-4" /></button><button type="button" onClick={() => moveStage(index, 1)} disabled={index === editingWorkflow.stages.length - 1} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-30" title="Move down"><ArrowDown className="w-4 h-4" /></button><button type="button" onClick={() => removeStage(index)} disabled={editingWorkflow.stages.length <= 1} className="p-2 rounded-lg border border-red-200 bg-white text-red-600 disabled:opacity-30" title="Delete stage"><Trash2 className="w-4 h-4" /></button></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="block"><span className="block text-xs font-bold text-slate-600 mb-1.5">Stage Name / Title</span><input value={stage.stageName} onChange={e => updateStage(index, { stageName: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl bg-white" placeholder="Stage Name" /></label><label className="block"><span className="block text-xs font-bold text-slate-600 mb-1.5">Dealing Person</span><input value={stage.dealingOfficerName} onChange={e => updateStage(index, { dealingOfficerName: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl bg-white" placeholder="Dealing Person" /></label></div></div>)}{workflowError && <div className="text-xs text-red-600">{workflowError}</div>}<button type="button" onClick={addStage} className="w-full border border-dashed border-purple-300 text-purple-700 rounded-xl py-3 font-semibold hover:bg-purple-50">+ Add Stage</button></div><div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 bg-white"><button type="button" onClick={() => setEditingWorkflow(null)} className="px-4 py-2 rounded-lg bg-slate-100 font-semibold">Cancel</button><button type="button" onClick={() => void saveWorkflow()} disabled={workflowSaving} className="px-4 py-2 rounded-lg bg-purple-700 text-white font-semibold disabled:opacity-50">{workflowSaving ? "Saving..." : "Save Changes"}</button></div></div></div>}
    </div>
  );
}
