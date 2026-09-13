import React, { useEffect, useState } from "react";
import {
  getAdminProfileEmploymentTypes,
  createProfileEmploymentType,
  updateProfileEmploymentType,
  updateProfileEmploymentTypeStatus,
  getAdminProfileOrgUnits,
  getAdminProfileBanks,
  getAdminProfileDesignations,
  getAdminProfileStreams,
  getAdminProfileMscBatches,
  getAdminProfileCourses,
  getAdminProfileTraineeBatches,
  createProfileOrgUnit,
  updateProfileOrgUnit,
  updateProfileOrgUnitStatus,
  createProfileBank,
  updateProfileBank,
  updateProfileBankStatus,
  createProfileDesignation,
  updateProfileDesignation,
  updateProfileDesignationStatus,
  createProfileStream,
  updateProfileStream,
  updateProfileStreamStatus,
  createProfileMscBatch,
  updateProfileMscBatch,
  updateProfileMscBatchStatus,
  createProfileCourse,
  updateProfileCourse,
  updateProfileCourseStatus,
  createProfileTraineeBatch,
  updateProfileTraineeBatch,
  updateProfileTraineeBatchStatus,
  deleteProfileEmploymentType,
  deleteProfileOrgUnit,
  deleteProfileBank,
  deleteProfileDesignation,
  deleteProfileStream,
  deleteProfileMscBatch,
  deleteProfileCourse,
  deleteProfileTraineeBatch,
} from "@/api/profile.api";
import { Database, Edit3, PlusCircle, Trash2, X } from "lucide-react";

type ProfileMasterTab =
  | "employment"
  | "banks"
  | "designations"
  | "organizations"
  | "streams"
  | "msc_batches"
  | "courses"
  | "trainee_batches";

type MasterFormMode = "create" | "edit";

interface ProfileMasterFormState {
  mode: MasterFormMode;
  id: number | null;
}

const ORG_UNIT_TYPE_OPTIONS = [
  { id: "department", name: "Department" },
  { id: "cell", name: "Cell" },
  { id: "project", name: "Project" },
  { id: "section", name: "Section" },
  { id: "labs_facility", name: "Labs & Facility" },
];

const ORG_UNIT_TYPE_LABELS: Record<string, string> = Object.fromEntries(ORG_UNIT_TYPE_OPTIONS.map((item) => [item.id, item.name]));

const MASTER_TABS: { key: ProfileMasterTab; label: string }[] = [
  { key: "employment", label: "Employment Type" },
  { key: "banks", label: "Bank Master" },
  { key: "designations", label: "Designation Master" },
  { key: "organizations", label: "Organization Master" },
  { key: "streams", label: "Stream Master" },
  { key: "msc_batches", label: "MSc Batch Master" },
  { key: "courses", label: "Course Master" },
  { key: "trainee_batches", label: "Trainee Batch Master" },
];


function MasterStatusBadge({status}:{status:string}){const active=String(status).toLowerCase()==="active";return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}><span className={`w-1.5 h-1.5 rounded-full ${active?"bg-emerald-500":"bg-slate-400"}`}/>{active?"Active":"Inactive"}</span>;}
function ActionCell({item,onEdit,onToggle,onDelete}:{item:any;onEdit:()=>void;onToggle:()=>void;onDelete:()=>void}){
  const active=String(item.status).toLowerCase()==="active";
  return <td className="px-4 py-3"><div className="flex items-center justify-end gap-2">
    <button type="button" title={active?"Deactivate":"Activate"} aria-label={active?"Deactivate":"Activate"} onClick={onToggle} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${active?"bg-emerald-500":"bg-slate-300"}`}><span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${active?"translate-x-6":"translate-x-1"}`}/></button>
    <button type="button" title="Edit" aria-label="Edit" onClick={onEdit} className="p-1.5 rounded-md text-purple-700 hover:bg-purple-50"><Edit3 className="w-4 h-4"/></button>
    <button type="button" title="Delete" aria-label="Delete" onClick={onDelete} className="p-1.5 rounded-md text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
  </div></td>;
}
function ManagementTable({headers,rows,render}:{headers:string[];rows:any[];render:(item:any)=>React.ReactNode}){return <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white"><table className="w-full text-left text-xs"><thead className="bg-slate-50 border-b border-slate-200"><tr>{headers.map((h,i)=><th key={h} className={`px-4 py-3 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 ${i===headers.length-1?"text-right":""}`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length===0?<tr><td colSpan={headers.length} className="px-4 py-12 text-center text-slate-400">No records found.</td></tr>:rows.map(item=><tr key={item.id} className="hover:bg-slate-50/70 transition-colors">{render(item)}</tr>)}</tbody></table></div>;}

export function ProfileMastersPanel() {
  const [tab, setTab] = useState<ProfileMasterTab>("employment");
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [mscBatches, setMscBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [traineeBatches, setTraineeBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileMasterFormState>({ mode: "create", id: null });
  const [modal, setModal] = useState<ProfileMasterTab | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [et, b, d, o, s, mb, c, tb] = await Promise.all([
        getAdminProfileEmploymentTypes(),
        getAdminProfileBanks(),
        getAdminProfileDesignations(),
        getAdminProfileOrgUnits(),
        getAdminProfileStreams(),
        getAdminProfileMscBatches(),
        getAdminProfileCourses(),
        getAdminProfileTraineeBatches(),
      ]);
      setEmploymentTypes(et);
      setBanks(b);
      setDesignations(d);
      setOrganizations(o);
      setStreams(s);
      setMscBatches(mb);
      setCourses(c);
      setTraineeBatches(tb);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load profile masters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setForm({ mode: "create", id: null });
    setValues({});
  };

  const nextBatchNumber = (kind: "msc" | "trainee", parentId: string) => {
    if (!parentId) return "1";
    const source = kind === "msc" ? mscBatches : traineeBatches;
    const key = kind === "msc" ? "streamId" : "courseId";
    const numbers = source.filter((item) => String(item[key]) === parentId).map((item) => Number(item.batchNumber));
    return String(numbers.length ? Math.max(...numbers) + 1 : 1);
  };

  const openCreate = (target: ProfileMasterTab) => {
    setForm({ mode: "create", id: null });
    const base: Record<string, string> = {};
    if (target === "employment") { base.code = ""; base.displayName = ""; }
    if (target === "organizations") base.unitType = ORG_UNIT_TYPE_OPTIONS[0].id;
    if (target === "msc_batches") {
      base.streamId = streams[0] ? String(streams[0].id) : "";
      base.batchNumber = nextBatchNumber("msc", base.streamId);
      base.validityStartYear = String(new Date().getFullYear());
      base.validityEndYear = String(new Date().getFullYear() + 2);
    }
    if (target === "trainee_batches") {
      base.courseId = courses[0] ? String(courses[0].id) : "";
      base.batchNumber = nextBatchNumber("trainee", base.courseId);
      base.validityStartYear = String(new Date().getFullYear());
      base.validityEndYear = String(new Date().getFullYear() + 1);
    }
    if (target === "designations") base.employmentTypeId = employmentTypes[0] ? String(employmentTypes[0].id) : "";
    setValues(base);
    setModal(target);
  };

  const openEdit = (target: ProfileMasterTab, item: any) => {
    setForm({ mode: "edit", id: Number(item.id) });
    const v: Record<string, string> = {};
    if (target === "employment") { v.code = item.code; v.displayName = item.displayName; }
    if (target === "banks") { v.bankName = item.bankName; v.bankCode = item.bankCode; }
    if (target === "organizations") { v.unitType = item.unitType; v.unitName = item.unitName; v.unitCode = item.unitCode; v.description = item.description || ""; }
    if (target === "designations") { v.employmentTypeId = String(item.employmentTypeId); v.designationName = item.designationName; v.designationCode = item.designationCode; }
    if (target === "streams") { v.streamName = item.streamName; v.streamCode = item.streamCode; }
    if (target === "courses") { v.courseName = item.courseName; v.courseCode = item.courseCode; }
    if (target === "msc_batches") { v.streamId = String(item.streamId); v.batchNumber = String(item.batchNumber); v.batchName = item.batchName; v.batchCode = item.batchCode; v.validityStartYear = String(item.validityStartYear); v.validityEndYear = String(item.validityEndYear); }
    if (target === "trainee_batches") { v.courseId = String(item.courseId); v.batchNumber = String(item.batchNumber); v.batchName = item.batchName; v.batchCode = item.batchCode; v.validityStartYear = String(item.validityStartYear); v.validityEndYear = String(item.validityEndYear); }
    setValues(v);
    setModal(target);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!modal) return;
    setSaving(true);
    setError(null);
    try {
      const id = form.id as number;
      if (modal === "employment") {
        const p = { code: values.code?.trim() || "", displayName: values.displayName?.trim() || "" };
        if (!p.code || !p.displayName) throw new Error("Employment Type and Employment Type Code are required.");
        form.mode === "edit" ? await updateProfileEmploymentType(id, p) : await createProfileEmploymentType(p);
      } else if (modal === "banks") {
        const p = { bankName: values.bankName?.trim() || "", bankCode: values.bankCode?.trim() || "" };
        if (!p.bankName || !p.bankCode) throw new Error("Bank Name and Bank Code are required.");
        form.mode === "edit" ? await updateProfileBank(id, p) : await createProfileBank(p);
      } else if (modal === "organizations") {
        const p = { unitType: values.unitType as any, unitName: values.unitName?.trim() || "", unitCode: values.unitCode?.trim() || "", description: values.description?.trim() || null };
        if (!p.unitName || !p.unitCode) throw new Error("Organization Name and Organization Code are required.");
        form.mode === "edit" ? await updateProfileOrgUnit(id, p) : await createProfileOrgUnit(p);
      } else if (modal === "designations") {
        const p = { employmentTypeId: Number(values.employmentTypeId), designationName: values.designationName?.trim() || "", designationCode: values.designationCode?.trim() || "" };
        if (!p.employmentTypeId || !p.designationName || !p.designationCode) throw new Error("Employment Type, Designation Name and Designation Code are required.");
        form.mode === "edit" ? await updateProfileDesignation(id, p) : await createProfileDesignation(p);
      } else if (modal === "streams") {
        const p = { streamName: values.streamName?.trim() || "", streamCode: values.streamCode?.trim() || "" };
        if (!p.streamName || !p.streamCode) throw new Error("Stream Name and Stream Code are required.");
        form.mode === "edit" ? await updateProfileStream(id, p) : await createProfileStream(p);
      } else if (modal === "courses") {
        const p = { courseName: values.courseName?.trim() || "", courseCode: values.courseCode?.trim() || "" };
        if (!p.courseName || !p.courseCode) throw new Error("Course Name and Course Code are required.");
        form.mode === "edit" ? await updateProfileCourse(id, p) : await createProfileCourse(p);
      } else if (modal === "msc_batches") {
        const p = { streamId: Number(values.streamId), batchNumber: Number(values.batchNumber), batchName: values.batchName?.trim() || "", batchCode: values.batchCode?.trim() || "", validityStartYear: Number(values.validityStartYear), validityEndYear: Number(values.validityEndYear) };
        if (!p.streamId || !p.batchNumber || !p.batchName || !p.batchCode || !p.validityStartYear || !p.validityEndYear) throw new Error("All MSc batch fields are required.");
        form.mode === "edit" ? await updateProfileMscBatch(id, p) : await createProfileMscBatch(p);
      } else if (modal === "trainee_batches") {
        const p = { courseId: Number(values.courseId), batchNumber: Number(values.batchNumber), batchName: values.batchName?.trim() || "", batchCode: values.batchCode?.trim() || "", validityStartYear: Number(values.validityStartYear), validityEndYear: Number(values.validityEndYear) };
        if (!p.courseId || !p.batchNumber || !p.batchName || !p.batchCode || !p.validityStartYear || !p.validityEndYear) throw new Error("All trainee batch fields are required.");
        form.mode === "edit" ? await updateProfileTraineeBatch(id, p) : await createProfileTraineeBatch(p);
      }
      await load();
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save profile master.");
    } finally { setSaving(false); }
  };

  const toggle = async (target: ProfileMasterTab, item: any) => {
    const next = item.status === "active" ? "inactive" : "active";
    try {
      if (target === "employment") await updateProfileEmploymentTypeStatus(item.id, next);
      else if (target === "banks") await updateProfileBankStatus(item.id, next);
      else if (target === "organizations") await updateProfileOrgUnitStatus(item.id, next);
      else if (target === "designations") await updateProfileDesignationStatus(item.id, next);
      else if (target === "streams") await updateProfileStreamStatus(item.id, next);
      else if (target === "msc_batches") await updateProfileMscBatchStatus(item.id, next);
      else if (target === "courses") await updateProfileCourseStatus(item.id, next);
      else if (target === "trainee_batches") await updateProfileTraineeBatchStatus(item.id, next);
      updateLocalStatus(target, Number(item.id), next);
      setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to change status."); }
  };

  const input = (key: string, label: string, requiredField = true, type = "text") => (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1">{label}{requiredField ? " *" : ""}</label>
      <input required={requiredField} type={type} value={values[key] || ""} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white" />
    </div>
  );
  const select = (key: string, label: string, options: any[], valueKey: string, labelKey: string) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1">{label} *</label>
      <select required value={values[key] || ""} onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))} className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white">
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o.id} value={o[valueKey]}>{o[labelKey]}</option>)}
      </select>
    </div>
  );

  const deleteMaster = async (target: ProfileMasterTab, item: any) => {
    if (!window.confirm(`Delete ${item.displayName || item.bankName || item.designationName || item.unitName || item.streamName || item.batchName || item.courseName || "this master record"}? This action cannot be undone.`)) return;
    try {
      if (target === "employment") { await deleteProfileEmploymentType(item.id); setEmploymentTypes((rows) => rows.filter((row) => row.id !== item.id)); }
      else if (target === "banks") { await deleteProfileBank(item.id); setBanks((rows) => rows.filter((row) => row.id !== item.id)); }
      else if (target === "organizations") { await deleteProfileOrgUnit(item.id); setOrganizations((rows) => rows.filter((row) => row.id !== item.id)); }
      else if (target === "designations") { await deleteProfileDesignation(item.id); setDesignations((rows) => rows.filter((row) => row.id !== item.id)); }
      else if (target === "streams") { await deleteProfileStream(item.id); setStreams((rows) => rows.filter((row) => row.id !== item.id)); }
      else if (target === "msc_batches") { await deleteProfileMscBatch(item.id); setMscBatches((rows) => rows.filter((row) => row.id !== item.id)); }
      else if (target === "courses") { await deleteProfileCourse(item.id); setCourses((rows) => rows.filter((row) => row.id !== item.id)); }
      else { await deleteProfileTraineeBatch(item.id); setTraineeBatches((rows) => rows.filter((row) => row.id !== item.id)); }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete master record.");
    }
  };

  const updateLocalStatus = (target: ProfileMasterTab, id: number, status: string) => {
    const update = (rows: any[]) => rows.map((row) => row.id === id ? { ...row, status } : row);
    if (target === "employment") setEmploymentTypes(update(employmentTypes));
    else if (target === "banks") setBanks(update(banks));
    else if (target === "organizations") setOrganizations(update(organizations));
    else if (target === "designations") setDesignations(update(designations));
    else if (target === "streams") setStreams(update(streams));
    else if (target === "msc_batches") setMscBatches(update(mscBatches));
    else if (target === "courses") setCourses(update(courses));
    else setTraineeBatches(update(traineeBatches));
  };

  const renderTable = () => {
    if (tab === "employment") return <ManagementTable headers={["Employment Type", "Code", "Status", "Actions"]} rows={employmentTypes} render={(item) => <><td className="p-3 font-semibold">{item.displayName}</td><td className="p-3 font-mono text-slate-600">{item.code}</td><td className="p-3"><MasterStatusBadge status={item.status} /></td><ActionCell item={item} onEdit={() => openEdit("employment", item)} onToggle={() => void toggle("employment", item)} onDelete={() => void deleteMaster("employment", item)} /></>} />;
    if (tab === "banks") return <ManagementTable headers={["Bank Name", "Bank Code", "Status", "Actions"]} rows={banks} render={(item) => <><td className="p-3 font-semibold">{item.bankName}</td><td className="p-3 font-mono text-slate-600">{item.bankCode}</td><td className="p-3"><MasterStatusBadge status={item.status} /></td><ActionCell item={item} onEdit={() => openEdit("banks", item)} onToggle={() => void toggle("banks", item)} onDelete={() => void deleteMaster("banks", item)} /></>} />;
    if (tab === "designations") return <ManagementTable headers={["Type", "Designation Name", "Designation Code", "Status", "Actions"]} rows={designations} render={(item) => <><td className="p-3 font-semibold">{item.employmentTypeName}</td><td className="p-3 font-semibold">{item.designationName}</td><td className="p-3 font-mono text-slate-600">{item.designationCode}</td><td className="p-3"><MasterStatusBadge status={item.status} /></td><ActionCell item={item} onEdit={() => openEdit("designations", item)} onToggle={() => void toggle("designations", item)} onDelete={() => void deleteMaster("designations", item)} /></>} />;
    if (tab === "organizations") return <ManagementTable headers={["Type", "Organization Name", "Organization Code", "Status", "Actions"]} rows={organizations} render={(item) => <><td className="p-3">{ORG_UNIT_TYPE_LABELS[item.unitType] || item.unitType}</td><td className="p-3 font-semibold">{item.unitName}</td><td className="p-3 font-mono text-slate-600">{item.unitCode}</td><td className="p-3"><MasterStatusBadge status={item.status} /></td><ActionCell item={item} onEdit={() => openEdit("organizations", item)} onToggle={() => void toggle("organizations", item)} onDelete={() => void deleteMaster("organizations", item)} /></>} />;
    if (tab === "streams") return <ManagementTable headers={["Stream Name", "Stream Code", "Status", "Actions"]} rows={streams} render={(item) => <><td className="p-3 font-semibold">{item.streamName}</td><td className="p-3 font-mono text-slate-600">{item.streamCode}</td><td className="p-3"><MasterStatusBadge status={item.status} /></td><ActionCell item={item} onEdit={() => openEdit("streams", item)} onToggle={() => void toggle("streams", item)} onDelete={() => void deleteMaster("streams", item)} /></>} />;
    if (tab === "msc_batches") return <ManagementTable headers={["Stream", "Batch Name", "Batch Code", "Validity", "Status", "Actions"]} rows={mscBatches} render={(item) => <><td className="p-3 font-semibold">{item.streamName}</td><td className="p-3 font-semibold">{item.batchName}</td><td className="p-3 font-mono text-slate-600">{item.batchCode}</td><td className="p-3">{item.validityStartYear}–{item.validityEndYear}</td><td className="p-3"><MasterStatusBadge status={item.status} /></td><ActionCell item={item} onEdit={() => openEdit("msc_batches", item)} onToggle={() => void toggle("msc_batches", item)} onDelete={() => void deleteMaster("msc_batches", item)} /></>} />;
    if (tab === "courses") return <ManagementTable headers={["Course Name", "Course Code", "Status", "Actions"]} rows={courses} render={(item) => <><td className="p-3 font-semibold">{item.courseName}</td><td className="p-3 font-mono text-slate-600">{item.courseCode}</td><td className="p-3"><MasterStatusBadge status={item.status} /></td><ActionCell item={item} onEdit={() => openEdit("courses", item)} onToggle={() => void toggle("courses", item)} onDelete={() => void deleteMaster("courses", item)} /></>} />;
    return <ManagementTable headers={["Course", "Batch Name", "Batch Code", "Validity", "Status", "Actions"]} rows={traineeBatches} render={(item) => <><td className="p-3 font-semibold">{item.courseName}</td><td className="p-3 font-semibold">{item.batchName}</td><td className="p-3 font-mono text-slate-600">{item.batchCode}</td><td className="p-3">{item.validityStartYear}–{item.validityEndYear}</td><td className="p-3"><MasterStatusBadge status={item.status} /></td><ActionCell item={item} onEdit={() => openEdit("trainee_batches", item)} onToggle={() => void toggle("trainee_batches", item)} onDelete={() => void deleteMaster("trainee_batches", item)} /></>} />;
  };

  const modalTitle = tab === "employment" ? "Employment Type" : tab === "banks" ? "Bank" : tab === "designations" ? "Designation" : tab === "organizations" ? "Organization" : tab === "streams" ? "Stream" : tab === "msc_batches" ? "MSc Batch" : tab === "courses" ? "Course" : "Trainee Batch";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-200 pb-4">
        <div><h2 className="font-extrabold text-slate-900 flex items-center gap-2"><Database className="w-5 h-5 text-purple-600" />Profile Masters</h2><p className="text-xs text-slate-500 mt-1">Central database masters used by the user profile module.</p></div>
        
      </div>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">{error}</div>}
      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-slate-200">
        {MASTER_TABS.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`shrink-0 px-3 py-2.5 text-[11px] font-bold border-b-2 ${tab === item.key ? "border-purple-700 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{item.label}</button>)}
      </div>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div><h3 className="font-bold text-slate-800">{MASTER_TABS.find((x) => x.key === tab)?.label}</h3><p className="text-[11px] text-slate-500 mt-1">Manage active and inactive master records from the database.</p></div>
        {<button type="button" onClick={() => openCreate(tab)} className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"><PlusCircle className="w-4 h-4" />Add New</button>}
      </div>
      {loading ? <div className="py-12 text-center text-sm text-slate-500">Loading profile masters...</div> : renderTable()}

      {modal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[120] flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5"><div><h3 className="font-extrabold text-slate-900">{form.mode === "edit" ? `Edit ${modalTitle}` : `Add ${modalTitle}`}</h3><p className="text-[11px] text-slate-500 mt-1">Changes are saved to the database.</p></div><button type="button" onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button></div>
            <div className="space-y-4">
              {modal === "employment" && <>{input("displayName", "Employment Type")} {input("code", "Employment Type Code")}</>}
              {modal === "banks" && <>{input("bankName", "Bank Name")} {input("bankCode", "Bank Code")}</>}
              {modal === "organizations" && <>{select("unitType", "Type", ORG_UNIT_TYPE_OPTIONS, "id", "name")} {input("unitName", "Organization Name")} {input("unitCode", "Organization Code")} {input("description", "Description", false)}</>}
              {modal === "designations" && <>{select("employmentTypeId", "Type", employmentTypes.filter((x) => x.status === "active"), "id", "displayName")} {input("designationName", "Designation Name")} {input("designationCode", "Designation Code")}</>}
              {modal === "streams" && <>{input("streamName", "Stream Name")} {input("streamCode", "Stream Code")}</>}
              {modal === "courses" && <>{input("courseName", "Course Name")} {input("courseCode", "Course Code")}</>}
              {modal === "msc_batches" && <>{select("streamId", "Stream", streams.filter((x) => x.status === "active"), "id", "streamName")} {input("batchNumber", "Batch Number", true, "number")} {input("batchName", "Batch Name")} {input("batchCode", "Batch Code")} <div className="grid grid-cols-2 gap-3">{input("validityStartYear", "Validity From", true, "number")}{input("validityEndYear", "Validity To", true, "number")}</div></>}
              {modal === "trainee_batches" && <>{select("courseId", "Course", courses.filter((x) => x.status === "active"), "id", "courseName")} {input("batchNumber", "Batch Number", true, "number")} {input("batchName", "Batch Name")} {input("batchCode", "Batch Code")} <div className="grid grid-cols-2 gap-3">{input("validityStartYear", "Validity From", true, "number")}{input("validityEndYear", "Validity To", true, "number")}</div></>}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 mt-5"><button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold">Cancel</button><button type="submit" disabled={saving} className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold disabled:opacity-50">{saving ? "Saving..." : form.mode === "edit" ? "Save Changes" : "Add"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

