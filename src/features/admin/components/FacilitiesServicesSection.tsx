import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Building2, Check, Edit3, GitMerge, Pencil, Plus, Trash2, Wrench, X } from "lucide-react";
import { apiRequest } from "../../../api/apiClient";

type ApprovalMode = "all" | "any_one";
type WorkflowType = "facility" | "service";
type WorkflowStage = { stageNumber: number; stageName: string; dealingRole: string; dealingOfficerName: string; actionType: "endorsement" | "verification" | "approval" | "provisioning"; approvalMode: ApprovalMode; isMandatory: boolean };
type LabFacilityRow = { id: string; name: string; nodal: string; assocNodal: string; supervisor: string; status: "active" | "inactive" };
type OfficerOption = { id: string | number; name: string };
type ServiceDefinition = { id: string; name: string; quota: string };

const DEFAULT_SERVICES: ServiceDefinition[] = [
  { id: "SRV-01", name: "Official WII Email ID (@wii.gov.in)", quota: "Institute Webmail Account, Domain Access & Group Mappings" },
  { id: "SRV-02", name: "Campus Internet & Wi-Fi MAC Address Registration", quota: "Device Hardware Address MAC Binding for High-Speed LAN & Campus Wi-Fi" },
  { id: "SRV-03", name: "HRMS / PMS Portal & Biometric Attendance", quota: "" },
  { id: "SRV-04", name: "Institute Smart Identity Card & RFID Campus Pass", quota: "" },
];

const getDefaultFacilityWorkflow = (): WorkflowStage[] => [
  { stageNumber: 1, stageName: "Supervising Officer / PI Endorsement", dealingRole: "reporting_manager", dealingOfficerName: "Applicant's Supervising Officer (PI)", actionType: "endorsement", approvalMode: "all", isMandatory: true },
  { stageNumber: 2, stageName: "Technical Supervisor Verification", dealingRole: "supervisor", dealingOfficerName: "Selected Lab Supervisor", actionType: "verification", approvalMode: "all", isMandatory: true },
  { stageNumber: 3, stageName: "Lab NO / ANO Review", dealingRole: "lab_nodal_group", dealingOfficerName: "Selected Lab's NO + ANO", actionType: "approval", approvalMode: "any_one", isMandatory: true },
];

const getDefaultServiceWorkflow = (manager = "", approver = ""): WorkflowStage[] => [
  { stageNumber: 1, stageName: "Supervising Officer / PI Endorsement", dealingRole: "reporting_manager", dealingOfficerName: "Applicant's Supervising Officer (PI)", actionType: "endorsement", approvalMode: "all", isMandatory: true },
  { stageNumber: 2, stageName: "In-Charge Manager Verification", dealingRole: "manager", dealingOfficerName: manager || "Service In-Charge Manager", actionType: "verification", approvalMode: "all", isMandatory: true },
  { stageNumber: 3, stageName: "Service Approver / IT Admin", dealingRole: "approver", dealingOfficerName: approver || "Selected Service Approver", actionType: "approval", approvalMode: "all", isMandatory: true },
];

function normalizeStages(stages: unknown, type: WorkflowType, manager = "", approver = ""): WorkflowStage[] {
  const defaults = type === "facility" ? getDefaultFacilityWorkflow() : getDefaultServiceWorkflow(manager, approver);
  if (!Array.isArray(stages) || stages.length === 0) return defaults;
  return stages.map((stage: any, index) => ({
    stageNumber: index + 1,
    stageName: String(stage?.stageName || "Review & Approval"),
    dealingRole: String(stage?.dealingRole || (type === "facility" ? "supervisor" : "manager")),
    dealingOfficerName: String(stage?.dealingOfficerName || "Dealing Officer / Supervisor"),
    actionType: ["endorsement", "verification", "approval", "provisioning"].includes(stage?.actionType) ? stage.actionType : "verification",
    approvalMode: stage?.approvalMode === "any_one" ? "any_one" : "all",
    isMandatory: stage?.isMandatory !== false,
  }));
}

function readLabRows(facility: any): LabFacilityRow[] {
  const configuredRows = facility?.formConfig?.labFacilityRows;
  if (Array.isArray(configuredRows)) {
    return configuredRows.map((row: any, index: number) => ({
      id: String(row?.id || `LAB-${index + 1}`),
      name: String(row?.name || "").trim(),
      nodal: String(row?.nodal || "").trim(),
      assocNodal: String(row?.assocNodal || "").trim(),
      supervisor: String(row?.supervisor || "").trim(),
      status: String(row?.status || "active").toLowerCase() === "inactive" ? "inactive" : "active",
    })).filter((row: LabFacilityRow) => row.name);
  }
  return Array.isArray(facility?.formConfig?.labNames)
    ? facility.formConfig.labNames.map((name: unknown, index: number) => ({ id: `LAB-${index + 1}`, name: String(name).trim(), nodal: String(facility?.nodal || "").trim(), assocNodal: String(facility?.assocNodal || "").trim(), supervisor: String(facility?.supervisor || "").trim(), status: "active" as const }))
    : [];
}

function serviceWithDefaults(service: any, definition: ServiceDefinition) {
  const formConfig = service?.formConfig && typeof service.formConfig === "object" ? service.formConfig : {};
  return {
    ...definition,
    ...service,
    id: definition.id,
    name: service?.name || definition.name,
    manager: service?.manager || "Not Configured",
    approver: service?.approver || formConfig.approver || "Not Configured",
    quota: definition.quota ? service?.quota || definition.quota : "",
    status: String(service?.status || "active").toLowerCase() === "inactive" ? "inactive" : "active",
    formConfig,
  };
}

export function FacilitiesServicesSection({ facilitiesList, facilitiesLoading, facilitiesError, servicesList, servicesLoading, servicesError, fetchServices, fetchFacilities }: any) {
  const [masterFacility, setMasterFacility] = useState<any>(null);
  const [masterServices, setMasterServices] = useState<any[]>([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);
  const facility = masterFacility || facilitiesList?.[0];
  const [labRows, setLabRows] = useState<LabFacilityRow[]>(() => readLabRows(facility));
  const [editingRow, setEditingRow] = useState<LabFacilityRow | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [savingRows, setSavingRows] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [officerOptions, setOfficerOptions] = useState<OfficerOption[]>([]);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<{ type: WorkflowType; item: any; stages: WorkflowStage[] } | null>(null);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const refreshMasters = async () => {
    setMasterLoading(true); setMasterError(null);
    try {
      const [facilityData, serviceData] = await Promise.all([
        apiRequest<any>("/api/facilities"),
        apiRequest<any>("/api/services"),
      ]);
      if (facilityData?.success && Array.isArray(facilityData.facilities)) setMasterFacility(facilityData.facilities[0] || null);
      if (serviceData?.success && Array.isArray(serviceData.services)) setMasterServices(serviceData.services);
    } catch (error) {
      setMasterError(error instanceof Error ? error.message : "Unable to load master data.");
    } finally { setMasterLoading(false); }
  };

  useEffect(() => { void refreshMasters(); }, []);
  useEffect(() => { setLabRows(readLabRows(facility)); }, [facility]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest<any>("/api/users");
        if (!data?.success || !Array.isArray(data.users)) return;
        const users = data.users.map((user: any) => ({ id: user.id, name: String(user.fullName || user.name || user.displayName || "").trim() })).filter((user: OfficerOption) => user.name);
        if (!cancelled) setOfficerOptions(users);
      } catch { /* Not Configured remains available. */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayServices = useMemo(() => {
    const source = masterServices.length ? masterServices : servicesList || [];
    const byId = new Map(source.map((service: any) => [String(service.id), service]));
    return DEFAULT_SERVICES.map((definition) => serviceWithDefaults(byId.get(definition.id), definition));
  }, [masterServices, servicesList]);

  const facilityStages = useMemo(() => normalizeStages(facility?.workflowStages || facility?.formConfig?.approvalWorkflowStages, "facility"), [facility]);
  const showQuotaAccess = (service: any) => service?.id === "SRV-01" || service?.id === "SRV-02";

  const persistLabRows = async (nextRows: LabFacilityRow[]) => {
    if (!facility) return;
    setSavingRows(true); setRowError(null);
    try {
      const currentConfig = facility.formConfig && typeof facility.formConfig === "object" ? facility.formConfig : {};
      await apiRequest(`/api/facilities/${encodeURIComponent(String(facility.id))}`, {
        method: "PUT",
        body: JSON.stringify({ name: facility.name || "Labs & Facility", dept: facility.dept || null, nodal: facility.nodal || "Not Configured", assocNodal: facility.assocNodal || "Not Configured", supervisor: facility.supervisor || "Not Configured", desc: facility.desc || null, status: facility.status || "active", workflowStages: facility.workflowStages || facilityStages, formConfig: { ...currentConfig, labFacilityRows: nextRows } }),
      });
      setLabRows(nextRows);
      await refreshMasters();
      await fetchFacilities();
      setEditingRow(null); setIsAddingRow(false);
    } catch (error) { setRowError(error instanceof Error ? error.message : "Unable to save lab/facility details."); }
    finally { setSavingRows(false); }
  };

  const openAddRow = () => {
    setRowError(null);
    setEditingRow({ id: `LAB-${Date.now()}`, name: "", nodal: "Not Configured", assocNodal: "Not Configured", supervisor: "Not Configured", status: "active" });
    setIsAddingRow(true);
  };

  const saveLabRow = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRow || !editingRow.name.trim()) { setRowError("Lab / Facility Name is required."); return; }
    const row = { ...editingRow, name: editingRow.name.trim(), nodal: editingRow.nodal || "Not Configured", assocNodal: editingRow.assocNodal || "Not Configured", supervisor: editingRow.supervisor || "Not Configured" };
    await persistLabRows(isAddingRow ? [...labRows, row] : labRows.map((item) => item.id === row.id ? row : item));
  };

  const deleteLabRow = async (row: LabFacilityRow) => {
    if (!window.confirm(`Remove ${row.name} from Labs & Facility master?`)) return;
    await persistLabRows(labRows.filter((item) => item.id !== row.id));
  };

  const openWorkflowEditor = (type: WorkflowType, item: any) => {
    const config = item?.formConfig && typeof item.formConfig === "object" ? item.formConfig : {};
    const savedStages = item?.workflowStages || config.approvalWorkflowStages;
    const stages = Array.isArray(savedStages) && savedStages.length ? savedStages : type === "facility" ? getDefaultFacilityWorkflow() : getDefaultServiceWorkflow(item?.manager || "", item?.approver || config.approver || "");
    setWorkflowError(null);
    setEditingWorkflow({ type, item, stages: normalizeStages(stages, type, item?.manager || "", item?.approver || config.approver || "") });
  };

  const updateStage = (index: number, patch: Partial<WorkflowStage>) => {
    setEditingWorkflow((current) => current ? { ...current, stages: current.stages.map((stage, stageIndex) => stageIndex === index ? { ...stage, ...patch } : stage) } : current);
  };

  const handleRoleChange = (index: number, role: string) => {
    if (!editingWorkflow) return;
    const item = editingWorkflow.item;
    const config = item?.formConfig && typeof item.formConfig === "object" ? item.formConfig : {};
    let dealingOfficerName = "Dealing Officer / Supervisor";
    let actionType: WorkflowStage["actionType"] = "verification";
    let approvalMode: ApprovalMode = "all";
    if (role === "reporting_manager") { dealingOfficerName = "Applicant's Supervising Officer (PI)"; actionType = "endorsement"; }
    else if (role === "supervisor") dealingOfficerName = item?.supervisor || "Selected Lab Supervisor";
    else if (role === "lab_nodal_group") { dealingOfficerName = "Selected Lab's NO + ANO"; actionType = "approval"; approvalMode = "any_one"; }
    else if (role === "manager") dealingOfficerName = item?.manager || "Service In-Charge Manager";
    else if (role === "approver") { dealingOfficerName = item?.approver || config.approver || "Selected Service Approver"; actionType = "approval"; }
    else if (role === "it_head") { dealingOfficerName = "IT Officer / System Admin"; actionType = "provisioning"; }
    updateStage(index, { dealingRole: role, dealingOfficerName, approvalMode, actionType });
  };

  const addStage = () => {
    setEditingWorkflow((current) => {
      if (!current) return current;
      const stageNumber = current.stages.length + 1;
      const service = current.type === "service";
      return { ...current, stages: [...current.stages, { stageNumber, stageName: "New Approval Stage", dealingRole: service ? "manager" : "supervisor", dealingOfficerName: service ? "Service In-Charge Manager" : "Selected Lab Supervisor", actionType: "verification", approvalMode: "all", isMandatory: true }] };
    });
  };

  const removeStage = (index: number) => {
    setEditingWorkflow((current) => {
      if (!current || current.stages.length <= 1) return current;
      return { ...current, stages: current.stages.filter((_, stageIndex) => stageIndex !== index).map((stage, stageIndex) => ({ ...stage, stageNumber: stageIndex + 1 })) };
    });
  };

  const moveStage = (index: number, direction: -1 | 1) => {
    setEditingWorkflow((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.stages.length) return current;
      const next = [...current.stages];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, stages: next.map((stage, stageIndex) => ({ ...stage, stageNumber: stageIndex + 1 })) };
    });
  };

  const saveWorkflow = async () => {
    if (!editingWorkflow) return;
    setWorkflowSaving(true); setWorkflowError(null);
    try {
      const item = editingWorkflow.item;
      const stagesToSave = normalizeStages(editingWorkflow.stages, editingWorkflow.type, item?.manager || "", item?.approver || item?.formConfig?.approver || "");
      if (editingWorkflow.type === "facility") {
        const currentConfig = item?.formConfig && typeof item.formConfig === "object" ? item.formConfig : {};
        await apiRequest(`/api/facilities/${encodeURIComponent(String(item.id))}`, { method: "PUT", body: JSON.stringify({ name: item.name || "Labs & Facility", dept: item.dept || null, nodal: item.nodal || "Not Configured", assocNodal: item.assocNodal || "Not Configured", supervisor: item.supervisor || "Not Configured", desc: item.desc || null, status: item.status || "active", workflowStages: stagesToSave, formConfig: { ...currentConfig, approvalWorkflowStages: stagesToSave } }) });
      } else {
        const currentConfig = item?.formConfig && typeof item.formConfig === "object" ? item.formConfig : {};
        await apiRequest(`/api/services/${encodeURIComponent(String(item.id))}`, { method: "PUT", body: JSON.stringify({ name: item.name, manager: item.manager || "Not Configured", quota: showQuotaAccess(item) ? item.quota || "" : "", status: item.status === "inactive" ? "inactive" : "active", workflowStages: stagesToSave, formConfig: { ...currentConfig, approvalWorkflowStages: stagesToSave, approver: item.approver || "Not Configured" } }) });
      }
      await refreshMasters();
      await fetchFacilities();
      await fetchServices();
      setEditingWorkflow(null);
    } catch (error) { setWorkflowError(error instanceof Error ? error.message : "Unable to save approval workflow."); }
    finally { setWorkflowSaving(false); }
  };

  const toggleServiceStatus = async (service: any) => {
    const nextStatus = service.status === "inactive" ? "active" : "inactive";
    setServiceError(null);
    try {
      await apiRequest(`/api/services/${encodeURIComponent(String(service.id))}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      await refreshMasters();
      await fetchServices();
      setEditingService((current: any) =>
        current && String(current.id) === String(service.id) ? { ...current, status: nextStatus } : current,
      );
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : "Unable to update service status.");
    }
  };

  const saveService = async () => {
    if (!editingService) return;
    if (!String(editingService.manager || "").trim()) { setServiceError("Manager is required."); return; }
    if (!String(editingService.approver || "").trim()) { setServiceError("Approver is required."); return; }
    setSavingService(true); setServiceError(null);
    try {
      const currentConfig = editingService.formConfig && typeof editingService.formConfig === "object" ? editingService.formConfig : {};
      const workflowStages = Array.isArray(editingService.workflowStages) ? normalizeStages(editingService.workflowStages, "service", editingService.manager, editingService.approver) : getDefaultServiceWorkflow(editingService.manager, editingService.approver);
      await apiRequest(`/api/services/${encodeURIComponent(String(editingService.id))}`, { method: "PUT", body: JSON.stringify({ name: String(editingService.name || "").trim(), manager: String(editingService.manager || "").trim(), quota: showQuotaAccess(editingService) ? String(editingService.quota || "").trim() : "", status: editingService.status === "inactive" ? "inactive" : "active", workflowStages, formConfig: { ...currentConfig, approvalWorkflowStages: workflowStages, approver: String(editingService.approver || "").trim() } }) });
      await refreshMasters();
      await fetchServices();
      setEditingService(null);
    } catch (error) { setServiceError(error instanceof Error ? error.message : "Unable to update service."); }
    finally { setSavingService(false); }
  };

  const renderWorkflowPreview = (stages: WorkflowStage[], tone: "purple" | "emerald", type: WorkflowType, item: any) => (
    <div className="mt-4 w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/80">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-700">
          <GitMerge className={`h-4 w-4 shrink-0 ${tone === "purple" ? "text-purple-600" : "text-emerald-600"}`} />
          <span className="truncate">Approval Flow ({stages.length} Stages)</span>
        </div>
        <button type="button" onClick={() => openWorkflowEditor(type, item)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-purple-700 hover:bg-purple-50" title="Edit Approval Flow">
          <Pencil className="h-3 w-3" />Edit
        </button>
      </div>
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-1.5 px-4 py-3">
        {stages.map((stage, index) => (
          <React.Fragment key={`${stage.stageNumber}-${index}`}>
            <span className="max-w-full truncate rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-purple-800">{String(stage.stageName).split(" ")[0]}</span>
            {index < stages.length - 1 && <span className="shrink-0 font-bold text-slate-400">→</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return <div className="box-border w-full max-w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 space-y-7">
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between border-b border-slate-200 pb-2"><div className="flex items-center gap-2"><Wrench className="h-5 w-5 text-purple-600" /><h3 className="font-bold text-slate-800">Services Master Directory</h3><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">{displayServices.length} Total</span></div></div>
      {(servicesLoading || masterLoading) && <div className="py-8 text-center text-xs text-slate-500">Loading Services...</div>}
      {(servicesError || masterError) && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{servicesError || masterError}</div>}
      {!servicesLoading && !masterLoading && <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{displayServices.map((service: any) => { const serviceStages = service.workflowStages?.length ? normalizeStages(service.workflowStages, "service", service.manager, service.approver) : getDefaultServiceWorkflow(service.manager, service.approver); const active = service.status !== "inactive"; return <div key={service.id} className={`min-h-[220px] rounded-xl border bg-slate-50/70 p-5 shadow-none transition-colors ${active ? "border-slate-200" : "border-slate-200 opacity-60"}`}><div className="flex items-start justify-between gap-3"><h4 className="text-base font-bold leading-snug text-slate-900">{service.name}</h4><button type="button" onClick={() => void toggleServiceStatus(service)} className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${active ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`} title={active ? "Set service inactive" : "Set service active"}>{active ? "Active" : "Inactive"}</button></div><div className="mt-4 space-y-2 text-sm"><div><span className="font-bold text-slate-700">Manager:</span> <span className="text-slate-600">{service.manager}</span><button type="button" onClick={() => setEditingService({ ...service })} className="ml-2 inline-flex rounded p-1 text-emerald-700 hover:bg-emerald-100" title="Edit Service"><Edit3 className="h-4 w-4" /></button></div><div><span className="font-bold text-slate-700">Approver:</span> <span className="text-slate-600">{service.approver}</span></div>{showQuotaAccess(service) && <div><span className="font-bold text-slate-700">Quota / Access:</span> <span className="text-slate-600">{service.quota || "Not Configured"}</span></div>}</div>{renderWorkflowPreview(serviceStages, "emerald", "service", service)}</div>; })}</div>}
    </section>

    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between border-b border-slate-200 pb-2"><div><h3 className="flex items-center gap-2 font-bold text-slate-800"><Building2 className="h-5 w-5 text-purple-600" />Labs & Facility Master <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-800">{labRows.length} Total</span></h3><p className="mt-1 text-xs text-slate-500">Each lab/facility has its own NO, ANO and Supervisor. All rows follow the same common approval workflow.</p></div><button type="button" disabled={!facility || masterLoading} onClick={openAddRow} className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-3.5 w-3.5" />Add Lab / Facility</button></div>
      {facilitiesLoading && <div className="py-8 text-center text-xs text-slate-500">Loading Labs & Facility...</div>}
      {facilitiesError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{facilitiesError}</div>}
      {rowError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{rowError}</div>}
      {!facilitiesLoading && !masterLoading && !facility && <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">Labs & Facility master record is not configured.</div>}
      {facility && <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="w-full max-w-full overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-50/80"><tr><th className="px-5 py-3 text-left font-bold text-slate-700">Labs & Facility</th><th className="px-5 py-3 text-left font-bold text-slate-700">NO</th><th className="px-5 py-3 text-left font-bold text-slate-700">ANO</th><th className="px-5 py-3 text-left font-bold text-slate-700">Supervisor</th><th className="px-5 py-3 text-center font-bold text-slate-700">Status</th><th className="px-5 py-3 text-right font-bold text-slate-700">Edit</th></tr></thead><tbody className="divide-y divide-slate-100">{labRows.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No labs/facilities configured yet. Click <b>Add Lab / Facility</b> to add a row.</td></tr>}{labRows.map((row) => <tr key={row.id} className={row.status === "inactive" ? "bg-slate-50 opacity-60" : "bg-white"}><td className="px-5 py-4 font-semibold text-slate-900">{row.name}</td><td className="px-5 py-4 text-slate-600">{row.nodal || "Not Configured"}</td><td className="px-5 py-4 text-slate-600">{row.assocNodal || "Not Configured"}</td><td className="px-5 py-4 text-slate-600">{row.supervisor || "Not Configured"}</td><td className="px-5 py-4 text-center"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${row.status === "inactive" ? "bg-slate-100 text-slate-600" : "bg-purple-100 text-purple-800"}`}>{row.status === "inactive" ? "Inactive" : "Active"}</span></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => { setRowError(null); setEditingRow(row); setIsAddingRow(false); }} className="rounded-lg p-2 text-purple-600 hover:bg-purple-50" title="Edit Lab / Facility"><Pencil className="h-4 w-4" /></button><button type="button" disabled={savingRows} onClick={() => void deleteLabRow(row)} className="ml-1 rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50" title="Delete Lab / Facility"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>{renderWorkflowPreview(facilityStages, "purple", "facility", facility)}</div>}
    </section>

    {editingRow && <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3"><div><h3 className="font-extrabold text-slate-900">{isAddingRow ? "Add Lab / Facility" : "Edit Lab / Facility"}</h3><p className="mt-1 text-xs text-slate-500">Set the lab/facility name, NO, ANO, Supervisor and status.</p></div><button type="button" onClick={() => setEditingRow(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><form onSubmit={saveLabRow} className="space-y-3"><input required value={editingRow.name} onChange={(event) => setEditingRow({ ...editingRow, name: event.target.value })} placeholder="Lab / Facility Name" className="w-full rounded-xl border border-slate-300 p-2.5" /><select value={editingRow.nodal} onChange={(event) => setEditingRow({ ...editingRow, nodal: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-2.5"><option value="Not Configured">Not Configured</option>{officerOptions.map((user) => <option key={`no-${user.id}`} value={user.name}>{user.name}</option>)}</select><select value={editingRow.assocNodal} onChange={(event) => setEditingRow({ ...editingRow, assocNodal: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-2.5"><option value="Not Configured">Not Configured</option>{officerOptions.map((user) => <option key={`ano-${user.id}`} value={user.name}>{user.name}</option>)}</select><select value={editingRow.supervisor} onChange={(event) => setEditingRow({ ...editingRow, supervisor: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-2.5"><option value="Not Configured">Not Configured</option>{officerOptions.map((user) => <option key={`sup-${user.id}`} value={user.name}>{user.name}</option>)}</select><select value={editingRow.status} onChange={(event) => setEditingRow({ ...editingRow, status: event.target.value === "inactive" ? "inactive" : "active" })} className="w-full rounded-xl border border-slate-300 bg-white p-2.5"><option value="active">Active</option><option value="inactive">Inactive</option></select><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEditingRow(null)} className="rounded-lg bg-slate-100 px-4 py-2 font-semibold">Cancel</button><button type="submit" disabled={savingRows} className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{savingRows ? "Saving..." : "Save"}</button></div></form></div></div>}

    {editingService && <div className="fixed inset-0 z-[175] flex items-center justify-center bg-slate-900/60 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-7 shadow-2xl"><div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4"><div><h3 className="text-lg font-extrabold text-slate-900">Edit Service Master</h3><p className="mt-1 text-xs text-slate-500">{editingService.name}</p></div><button type="button" onClick={() => setEditingService(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="space-y-4"><div><label className="mb-1 block text-xs font-bold text-slate-600">Manager</label><select value={editingService.manager || ""} onChange={(event) => setEditingService({ ...editingService, manager: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3"><option value="">Select Manager</option><option value="Not Configured">Not Configured</option>{officerOptions.map((user) => <option key={`manager-${user.id}`} value={user.name}>{user.name}</option>)}</select></div><div><label className="mb-1 block text-xs font-bold text-slate-600">Approver</label><select value={editingService.approver || ""} onChange={(event) => setEditingService({ ...editingService, approver: event.target.value })} className="w-full rounded-xl border border-slate-300 bg-white p-3"><option value="">Select Approver</option><option value="Not Configured">Not Configured</option>{officerOptions.map((user) => <option key={`approver-${user.id}`} value={user.name}>{user.name}</option>)}</select></div>{showQuotaAccess(editingService) && <div><label className="mb-1 block text-xs font-bold text-slate-600">Quota / Access</label><input value={editingService.quota || ""} onChange={(event) => setEditingService({ ...editingService, quota: event.target.value })} placeholder="Quota / Access" className="w-full rounded-xl border border-slate-300 p-3" /></div>}<label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"><span className="font-semibold text-slate-700">Status</span><button type="button" role="switch" aria-checked={editingService.status !== "inactive"} onClick={() => setEditingService({ ...editingService, status: editingService.status === "inactive" ? "active" : "inactive" })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${editingService.status === "inactive" ? "bg-slate-300" : "bg-emerald-600"}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${editingService.status === "inactive" ? "translate-x-1" : "translate-x-6"}`} /></button></label>{serviceError && <div className="text-xs text-red-600">{serviceError}</div>}<div className="flex justify-end gap-2"><button type="button" onClick={() => setEditingService(null)} className="rounded-lg bg-slate-100 px-4 py-2 font-semibold">Cancel</button><button type="button" onClick={() => void saveService()} disabled={savingService} className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{savingService ? "Saving..." : "Save Changes"}</button></div></div></div></div>}

    {editingWorkflow && <div className="fixed inset-0 z-[180] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4"><div className="my-8 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white p-6 shadow-2xl"><div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 pb-3"><div><h3 className="text-base font-extrabold text-slate-900">Configure Approval Workflow Stages</h3><p className="mt-1 text-xs text-slate-500">Edit, add, remove and reorder stages for <span className="font-bold text-slate-800">{editingWorkflow.item?.name}</span></p></div><button type="button" onClick={() => setEditingWorkflow(null)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="flex-grow space-y-4 overflow-y-auto py-4 pr-1">{editingWorkflow.stages.map((stage, index) => <div key={`${stage.stageNumber}-${index}`} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between border-b border-slate-200 pb-2"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-700 text-xs font-bold text-white">{index + 1}</span><span className="text-sm font-bold text-slate-800">Stage {index + 1}: {stage.stageName || "Unnamed Stage"}</span></div><div className="flex items-center gap-1"><button type="button" onClick={() => moveStage(index, -1)} disabled={index === 0} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Move Stage Up"><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => moveStage(index, 1)} disabled={index === editingWorkflow.stages.length - 1} className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Move Stage Down"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => removeStage(index)} disabled={editingWorkflow.stages.length <= 1} className="ml-2 rounded border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-30" title="Delete Stage"><Trash2 className="h-4 w-4" /></button></div></div><div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2"><label className="block"><span className="mb-1 block text-[11px] font-bold text-slate-600">Stage Name / Title</span><input type="text" value={stage.stageName} onChange={(event) => updateStage(index, { stageName: event.target.value })} placeholder="e.g. Supervising Officer / PI Endorsement" className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm" /></label><label className="block"><span className="mb-1 block text-[11px] font-bold text-slate-600">Dealing Person Role / Type</span><select value={stage.dealingRole} onChange={(event) => handleRoleChange(index, event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"><option value="reporting_manager">Reporting Manager / PI (Applicant Supervisor)</option><option value="supervisor">Lab Technical Supervisor</option><option value="lab_nodal_group">Lab NO + ANO (Any One Can Approve)</option><option value="manager">Service In-Charge Manager</option><option value="approver">Service Approver</option><option value="assoc_nodal">Associate Nodal Officer</option><option value="nodal">Nodal Officer</option><option value="it_head">IT Head / Admin Officer</option><option value="section_head">Section Head / Director</option><option value="custom">Specific Officer / User</option></select></label></div><div className="mt-2 flex items-center gap-2 border-t border-slate-200/60 pt-1"><input type="checkbox" id={`mandatory-${editingWorkflow.type}-${index}`} checked={stage.isMandatory !== false} onChange={(event) => updateStage(index, { isMandatory: event.target.checked })} className="rounded text-purple-600 focus:ring-purple-500" /><label htmlFor={`mandatory-${editingWorkflow.type}-${index}`} className="text-xs font-semibold text-slate-700">Mandatory Stage (Request cannot skip this step)</label></div></div>)}{workflowError && <div className="text-xs text-red-600">{workflowError}</div>}</div><div className="mt-2 flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3"><button type="button" onClick={addStage} className="flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100"><Plus className="h-3.5 w-3.5" />Add Stage</button><div className="flex gap-2"><button type="button" onClick={() => setEditingWorkflow(null)} className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">Cancel</button><button type="button" onClick={() => void saveWorkflow()} disabled={workflowSaving} className="flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"><Check className="h-4 w-4" />{workflowSaving ? "Saving..." : "Save Workflow Stages"}</button></div></div></div></div>}
  </div>;
}

export default FacilitiesServicesSection;
