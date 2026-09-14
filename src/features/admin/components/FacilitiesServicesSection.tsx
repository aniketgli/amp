import React, { useEffect, useMemo, useState } from "react";
import { Building2, Edit3, GitMerge, Pencil, Plus, Trash2, Wrench, X, ArrowUp, ArrowDown, Check } from "lucide-react";
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
}

function readLabRows(facility: any): LabFacilityRow[] {
  const rows = facility?.formConfig?.labFacilityRows;
  if (Array.isArray(rows)) return rows.map((row: any, i: number) => ({
    id: String(row?.id || `LAB-${i + 1}`), name: String(row?.name || "").trim(), nodal: String(row?.nodal || "").trim(), assocNodal: String(row?.assocNodal || "").trim(), supervisor: String(row?.supervisor || "").trim(), status: String(row?.status || "active").toLowerCase() === "inactive" ? "inactive" : "active",
  })).filter((row: LabFacilityRow) => row.name);
  return Array.isArray(facility?.formConfig?.labNames) ? facility.formConfig.labNames.map((name: unknown, i: number) => ({ id: `LAB-${i + 1}`, name: String(name), nodal: "", assocNodal: "", supervisor: "", status: "active" })) : [];
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
  const [editingService, setEditingService] = useState<any | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
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

  const openWorkflowEditor = (type: "facility" | "service", item: any) => {
    const initial = Array.isArray(item?.workflowStages) && item.workflowStages.length ? item.workflowStages : type === "facility" ? getDefaultFacilityWorkflow() : getDefaultServiceWorkflow(item?.manager || "");
    setWorkflowError(null);
    setEditingWorkflow({ type, item, stages: normalizeStages(initial, type, item?.manager || "") });
  };

  const updateStage = (index: number, patch: Partial<WorkflowStage>) => {
    if (!editingWorkflow) return;
    setEditingWorkflow({ ...editingWorkflow, stages: editingWorkflow.stages.map((stage, i) => i === index ? { ...stage, ...patch } : stage) });
  };

  const handleRoleChange = (index: number, role: string) => {
    if (!editingWorkflow) return;
    const item = editingWorkflow.item;
    let dealingOfficerName = "Dealing Officer / Supervisor";
    if (role === "reporting_manager") dealingOfficerName = "Applicant's Supervising Officer (PI)";
    else if (role === "supervisor") dealingOfficerName = item?.supervisor || "Selected Lab Supervisor";
    else if (role === "lab_nodal_group") dealingOfficerName = "Selected Lab's NO + ANO";
    else if (role === "manager") dealingOfficerName = item?.manager || "Service In-Charge Manager";
    else if (role === "it_head") dealingOfficerName = "IT Officer / System Admin";
    updateStage(index, { dealingRole: role, dealingOfficerName, approvalMode: role === "lab_nodal_group" ? "any_one" : "all", actionType: role === "lab_nodal_group" ? "approval" : index === 0 ? "endorsement" : "verification" });
  };

  const addStage = () => {
    if (!editingWorkflow) return;
    const n = editingWorkflow.stages.length + 1;
    setEditingWorkflow({ ...editingWorkflow, stages: [...editingWorkflow.stages, { stageNumber: n, stageName: "New Approval Stage", dealingRole: editingWorkflow.type === "facility" ? "supervisor" : "manager", dealingOfficerName: editingWorkflow.type === "facility" ? "Selected Lab Supervisor" : "Service In-Charge Manager", actionType: "verification", approvalMode: "all", isMandatory: true }] });
  };

  const removeStage = (index: number) => {
    if (!editingWorkflow || editingWorkflow.stages.length <= 1) return;
    setEditingWorkflow({ ...editingWorkflow, stages: editingWorkflow.stages.filter((_, i) => i !== index).map((stage, i) => ({ ...stage, stageNumber: i + 1 })) });
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    if (!editingWorkflow) return;
    const target = index + direction;
    if (target < 0 || target >= editingWorkflow.stages.length) return;
    const next = [...editingWorkflow.stages];
    [next[index], next[target]] = [next[target], next[index]];
    setEditingWorkflow({ ...editingWorkflow, stages: next.map((stage, i) => ({ ...stage, stageNumber: i + 1 })) });
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

  const saveService = async () => {
    if (!editingService) return;
    if (!String(editingService.manager || "").trim()) { setServiceError("Manager is required."); return; }
    setSavingService(true); setServiceError(null);
    try {
      const response = await fetch(`/api/services/${encodeURIComponent(String(editingService.id))}`, { method: "PUT", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ name: String(editingService.name || "").trim(), manager: String(editingService.manager || "").trim(), quota: showQuotaAccess(editingService) ? String(editingService.quota || "").trim() : "", status: editingService.status === "inactive" ? "inactive" : "active", workflowStages: Array.isArray(editingService.workflowStages) ? normalizeStages(editingService.workflowStages, "service", editingService.manager) : undefined }) });
      const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || "Unable to update service.");
      await fetchServices(); setEditingService(null);
    } catch (error: any) { setServiceError(error?.message || "Unable to update service."); }
    finally { setSavingService(false); }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{servicesList.filter(s => s.status !== "inactive").map(service => { const serviceStages = service.workflowStages?.length ? normalizeStages(service.workflowStages, "service", service.manager) : getDefaultServiceWorkflow(service.manager); return <div key={service.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5"><h4 className="font-bold text-slate-900 text-base leading-snug">{service.name}</h4><div className="mt-3 space-y-1.5 text-sm"><div><span className="font-bold text-slate-700">Manager:</span> <span className="text-slate-600">{service.manager || "Not Configured"}</span><button onClick={() => setEditingService({ ...service })} className="ml-2 inline-flex p-1 text-emerald-700 hover:bg-emerald-100 rounded" title="Edit Service"><Edit3 className="w-4 h-4" /></button></div>{showQuotaAccess(service) && <div><span className="font-bold text-slate-700">Quota / Access:</span> <span className="text-slate-600">{service.quota || "Not Configured"}</span></div>}</div><div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between"><div><div className="text-xs font-bold text-slate-700 flex items-center gap-1"><GitMerge className="w-3.5 h-3.5 text-emerald-600" />Approval Flow ({serviceStages.length} Stages)</div><div className="flex flex-wrap items-center gap-1 mt-1.5 text-[10px]">{serviceStages.map((stage, i) => <React.Fragment key={stage.stageNumber || i}><span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">{String(stage.stageName).split(" ")[0]}</span>{i < serviceStages.length - 1 && <span className="text-slate-400 font-bold">➔</span>}</React.Fragment>)}</div></div><button onClick={() => openWorkflowEditor("service", service)} className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded" title="Configure Approval Flow"><GitMerge className="w-4 h-4" /></button></div></div>; })}</div>
      </section>

      {editingRow && <div className="fixed inset-0 bg-slate-900/60 z-[170] flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl"><div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4"><div><h3 className="font-extrabold text-slate-900">{isAddingRow ? "Add Lab / Facility" : "Edit Lab / Facility"}</h3><p className="text-xs text-slate-500 mt-1">Set the current NO, ANO, Supervisor and status for this row.</p></div><button type="button" onClick={() => setEditingRow(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button></div><form onSubmit={saveLabRow} className="space-y-3"><input required value={editingRow.name} onChange={e => setEditingRow({ ...editingRow, name: e.target.value })} placeholder="Lab / Facility Name" className="w-full p-2.5 border border-slate-300 rounded-xl" /><select required value={editingRow.nodal} onChange={e => setEditingRow({ ...editingRow, nodal: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="">Select Nodal Officer (NO)</option>{officerOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select><select required value={editingRow.assocNodal} onChange={e => setEditingRow({ ...editingRow, assocNodal: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="">Select Associate Nodal Officer (ANO)</option>{officerOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select><select required value={editingRow.supervisor} onChange={e => setEditingRow({ ...editingRow, supervisor: e.target.value })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="">Select Supervisor</option>{officerOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select><select value={editingRow.status} onChange={e => setEditingRow({ ...editingRow, status: e.target.value as "active" | "inactive" })} className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"><option value="active">Active</option><option value="inactive">Inactive</option></select><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEditingRow(null)} className="px-4 py-2 rounded-lg bg-slate-100 font-semibold">Cancel</button><button type="submit" disabled={savingRows} className="px-4 py-2 rounded-lg bg-purple-700 text-white font-semibold disabled:opacity-50">{savingRows ? "Saving..." : "Save"}</button></div></form></div></div>}

      {editingService && <div className="fixed inset-0 bg-slate-900/60 z-[175] flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-xl p-7 shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5"><h3 className="font-extrabold text-slate-900 text-lg">{editingService.name}</h3><button type="button" onClick={() => setEditingService(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button></div><div className="space-y-4"><select value={editingService.manager || ""} onChange={e => setEditingService({ ...editingService, manager: e.target.value })} className="w-full p-3 border border-slate-300 rounded-xl bg-white"><option value="">Select Manager</option>{officerOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select>{showQuotaAccess(editingService) && <input value={editingService.quota || ""} onChange={e => setEditingService({ ...editingService, quota: e.target.value })} placeholder="Quota / Access" className="w-full p-3 border border-slate-300 rounded-xl" />}<label className="flex items-center justify-between gap-4 border border-slate-200 rounded-xl px-4 py-3"><span className="font-semibold text-slate-700">Status</span><button type="button" role="switch" aria-checked={editingService.status !== "inactive"} onClick={() => setEditingService({ ...editingService, status: editingService.status === "inactive" ? "active" : "inactive" })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${editingService.status === "inactive" ? "bg-slate-300" : "bg-emerald-600"}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${editingService.status === "inactive" ? "translate-x-1" : "translate-x-6"}`} /></button></label>{serviceError && <div className="text-xs text-red-600">{serviceError}</div>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEditingService(null)} className="px-4 py-2 rounded-lg bg-slate-100 font-semibold">Cancel</button><button type="button" onClick={() => void saveService()} disabled={savingService} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-50">{savingService ? "Saving..." : "Save Changes"}</button></div></div></div></div>}

      {editingWorkflow && <div className="fixed inset-0 bg-slate-900/60 z-[180] flex items-center justify-center p-4 overflow-y-auto"><div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-2xl my-8 max-h-[94vh] flex flex-col"><div className="flex justify-between items-center border-b border-slate-200 pb-3 flex-shrink-0"><div><h3 className="font-extrabold text-slate-900 text-base">Configure Approval Workflow Stages</h3><p className="text-xs text-slate-500 mt-1">Set sequence of dealing persons for <span className="font-bold text-slate-800">{editingWorkflow.item?.name}</span></p></div><button type="button" onClick={() => setEditingWorkflow(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button></div><div className="overflow-y-auto py-4 space-y-4 flex-grow pr-1">{editingWorkflow.stages.map((stage, index) => <div key={`${stage.stageNumber}-${index}`} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3 relative hover:border-slate-300 transition-all"><div className="flex justify-between items-center border-b border-slate-200 pb-2"><div className="flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center">{index + 1}</span><span className="font-bold text-sm text-slate-800">Stage {index + 1}: {stage.stageName || "Unnamed Stage"}</span></div><div className="flex items-center gap-1"><button type="button" onClick={() => moveStage(index, -1)} disabled={index === 0} className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-600" title="Move Stage Up"><ArrowUp className="w-4 h-4" /></button><button type="button" onClick={() => moveStage(index, 1)} disabled={index === editingWorkflow.stages.length - 1} className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 rounded text-slate-600" title="Move Stage Down"><ArrowDown className="w-4 h-4" /></button><button type="button" onClick={() => removeStage(index)} disabled={editingWorkflow.stages.length <= 1} className="p-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded ml-2 disabled:opacity-30" title="Delete Stage"><Trash2 className="w-4 h-4" /></button></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1"><label className="block"><span className="block text-[11px] font-bold text-slate-600 mb-1">Stage Name / Title</span><input type="text" value={stage.stageName} onChange={e => updateStage(index, { stageName: e.target.value })} placeholder="e.g. Supervising Officer / PI Endorsement" className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white" /></label><label className="block"><span className="block text-[11px] font-bold text-slate-600 mb-1">Dealing Person Role / Type</span><select value={stage.dealingRole} onChange={e => handleRoleChange(index, e.target.value)} className="w-full p-2.5 text-sm border border-slate-300 rounded-lg bg-white"><option value="reporting_manager">Reporting Manager / PI (Applicant Supervisor)</option><option value="supervisor">Lab Technical Supervisor</option><option value="lab_nodal_group">Lab NO + ANO (Any One Can Approve)</option><option value="assoc_nodal">Associate Nodal Officer</option><option value="nodal">Nodal Officer</option><option value="manager">Service In-Charge Manager</option><option value="it_head">IT Head / Admin Officer</option><option value="section_head">Section Head / Director</option><option value="custom">Specific Officer / User</option></select></label></div><div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 mt-2"><input type="checkbox" id={`mandatory-${editingWorkflow.type}-${index}`} checked={stage.isMandatory !== false} onChange={e => updateStage(index, { isMandatory: e.target.checked })} className="rounded text-purple-600 focus:ring-purple-500" /><label htmlFor={`mandatory-${editingWorkflow.type}-${index}`} className="text-xs font-semibold text-slate-700">Mandatory Stage (Request cannot skip this step)</label></div></div>)}{workflowError && <div className="text-xs text-red-600">{workflowError}</div>}</div><div className="flex flex-wrap justify-between items-center gap-2 border-t border-slate-200 pt-3 flex-shrink-0 mt-2"><button type="button" onClick={addStage} className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add Stage</button><div className="flex gap-2"><button type="button" onClick={() => setEditingWorkflow(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700">Cancel</button><button type="button" onClick={() => void saveWorkflow()} disabled={workflowSaving} className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Check className="w-4 h-4" />{workflowSaving ? "Saving..." : "Save Workflow Stages"}</button></div></div></div></div>}
    </div>
  );
}

export default FacilitiesServicesSection;
