from pathlib import Path
import re

admin = Path("src/features/admin/pages/AdminControlPage.tsx")
text = admin.read_text(encoding="utf-8")

imports = {
    "  updateProfileEmploymentTypeStatus,\n": "  updateProfileEmploymentTypeStatus,\n  deleteProfileEmploymentType,\n",
    "  updateProfileOrgUnitStatus,\n": "  updateProfileOrgUnitStatus,\n  deleteProfileOrgUnit,\n",
    "  updateProfileBankStatus,\n": "  updateProfileBankStatus,\n  deleteProfileBank,\n",
    "  updateProfileDesignationStatus,\n": "  updateProfileDesignationStatus,\n  deleteProfileDesignation,\n",
    "  updateProfileStreamStatus,\n": "  updateProfileStreamStatus,\n  deleteProfileStream,\n",
    "  updateProfileMscBatchStatus,\n": "  updateProfileMscBatchStatus,\n  deleteProfileMscBatch,\n",
    "  updateProfileCourseStatus,\n": "  updateProfileCourseStatus,\n  deleteProfileCourse,\n",
    "  updateProfileTraineeBatchStatus,\n": "  updateProfileTraineeBatchStatus,\n  deleteProfileTraineeBatch,\n",
}
for old, new in imports.items():
    if new not in text:
        if old not in text:
            raise SystemExit(f"Missing import anchor: {old!r}")
        text = text.replace(old, new, 1)

old_action = re.compile(
    r"function ActionCell\(\{item,onEdit,onToggle\}:\{item:any;onEdit:\(\)=>void;onToggle:\(\)=>void\}\)\{.*?\nfunction ManagementTable",
    re.S,
)
new_action = """function ActionCell({item,onEdit,onToggle,onDelete}:{item:any;onEdit:()=>void;onToggle:()=>void;onDelete:()=>void}){
  const active=String(item.status).toLowerCase()==="active";
  return <td className="px-4 py-3"><div className="flex items-center justify-end gap-2">
    <button type="button" title={active?"Deactivate":"Activate"} aria-label={active?"Deactivate":"Activate"} onClick={onToggle} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${active?"bg-emerald-500":"bg-slate-300"}`}><span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${active?"translate-x-6":"translate-x-1"}`}/></button>
    <button type="button" title="Edit" aria-label="Edit" onClick={onEdit} className="p-1.5 rounded-md text-purple-700 hover:bg-purple-50"><Edit3 className="w-4 h-4"/></button>
    <button type="button" title="Delete" aria-label="Delete" onClick={onDelete} className="p-1.5 rounded-md text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
  </div></td>;
}
function ManagementTable"""
text, count = old_action.subn(new_action, text, count=1)
if count != 1:
    raise SystemExit("ActionCell replacement failed")

helper_anchor = '  const nextBatchNumber = (kind: "msc" | "trainee", parentId: string) => {'
helper = '''  const updateMasterState = (target: ProfileMasterTab, updater: (rows: any[]) => any[]) => {
    if (target === "employment") setEmploymentTypes(updater);
    else if (target === "banks") setBanks(updater);
    else if (target === "designations") setDesignations(updater);
    else if (target === "organizations") setOrganizations(updater);
    else if (target === "streams") setStreams(updater);
    else if (target === "msc_batches") setMscBatches(updater);
    else if (target === "courses") setCourses(updater);
    else if (target === "trainee_batches") setTraineeBatches(updater);
  };

  const deleteMaster = async (target: ProfileMasterTab, item: any) => {
    if (!window.confirm("Delete this master record? This action cannot be undone.")) return;
    setError(null);
    try {
      if (target === "employment") await deleteProfileEmploymentType(Number(item.id));
      else if (target === "banks") await deleteProfileBank(Number(item.id));
      else if (target === "organizations") await deleteProfileOrgUnit(Number(item.id));
      else if (target === "designations") await deleteProfileDesignation(Number(item.id));
      else if (target === "streams") await deleteProfileStream(Number(item.id));
      else if (target === "msc_batches") await deleteProfileMscBatch(Number(item.id));
      else if (target === "courses") await deleteProfileCourse(Number(item.id));
      else if (target === "trainee_batches") await deleteProfileTraineeBatch(Number(item.id));
      updateMasterState(target, (rows) => rows.filter((row) => Number(row.id) !== Number(item.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete profile master.");
    }
  };

'''
if helper not in text:
    if helper_anchor not in text:
        raise SystemExit("nextBatchNumber anchor missing")
    text = text.replace(helper_anchor, helper + helper_anchor, 1)

save_re = re.compile(r"  const save = async \(event: React\.FormEvent\) => \{.*?\n  const toggle = async", re.S)
new_save = '''  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!modal) return;
    setSaving(true);
    setError(null);
    try {
      const id = form.id as number;
      let saved: any;
      if (modal === "employment") {
        const p = { code: values.code?.trim() || "", displayName: values.displayName?.trim() || "" };
        if (!p.code || !p.displayName) throw new Error("Employment Type and Employment Type Code are required.");
        saved = form.mode === "edit" ? await updateProfileEmploymentType(id, p) : await createProfileEmploymentType(p);
      } else if (modal === "banks") {
        const p = { bankName: values.bankName?.trim() || "", bankCode: values.bankCode?.trim() || "" };
        if (!p.bankName || !p.bankCode) throw new Error("Bank Name and Bank Code are required.");
        saved = form.mode === "edit" ? await updateProfileBank(id, p) : await createProfileBank(p);
      } else if (modal === "organizations") {
        const p = { unitType: values.unitType as any, unitName: values.unitName?.trim() || "", unitCode: values.unitCode?.trim() || "", description: values.description?.trim() || null };
        if (!p.unitName || !p.unitCode) throw new Error("Organization Name and Organization Code are required.");
        saved = form.mode === "edit" ? await updateProfileOrgUnit(id, p) : await createProfileOrgUnit(p);
      } else if (modal === "designations") {
        const p = { employmentTypeId: Number(values.employmentTypeId), designationName: values.designationName?.trim() || "", designationCode: values.designationCode?.trim() || "" };
        if (!p.employmentTypeId || !p.designationName || !p.designationCode) throw new Error("Employment Type, Designation Name and Designation Code are required.");
        saved = form.mode === "edit" ? await updateProfileDesignation(id, p) : await createProfileDesignation(p);
      } else if (modal === "streams") {
        const p = { streamName: values.streamName?.trim() || "", streamCode: values.streamCode?.trim() || "" };
        if (!p.streamName || !p.streamCode) throw new Error("Stream Name and Stream Code are required.");
        saved = form.mode === "edit" ? await updateProfileStream(id, p) : await createProfileStream(p);
      } else if (modal === "courses") {
        const p = { courseName: values.courseName?.trim() || "", courseCode: values.courseCode?.trim() || "" };
        if (!p.courseName || !p.courseCode) throw new Error("Course Name and Course Code are required.");
        saved = form.mode === "edit" ? await updateProfileCourse(id, p) : await createProfileCourse(p);
      } else if (modal === "msc_batches") {
        const p = { streamId: Number(values.streamId), batchNumber: Number(values.batchNumber), batchName: values.batchName?.trim() || "", batchCode: values.batchCode?.trim() || "", validityStartYear: Number(values.validityStartYear), validityEndYear: Number(values.validityEndYear) };
        if (!p.streamId || !p.batchNumber || !p.batchName || !p.batchCode || !p.validityStartYear || !p.validityEndYear) throw new Error("All MSc batch fields are required.");
        saved = form.mode === "edit" ? await updateProfileMscBatch(id, p) : await createProfileMscBatch(p);
      } else if (modal === "trainee_batches") {
        const p = { courseId: Number(values.courseId), batchNumber: Number(values.batchNumber), batchName: values.batchName?.trim() || "", batchCode: values.batchCode?.trim() || "", validityStartYear: Number(values.validityStartYear), validityEndYear: Number(values.validityEndYear) };
        if (!p.courseId || !p.batchNumber || !p.batchName || !p.batchCode || !p.validityStartYear || !p.validityEndYear) throw new Error("All trainee batch fields are required.");
        saved = form.mode === "edit" ? await updateProfileTraineeBatch(id, p) : await createProfileTraineeBatch(p);
      }
      updateMasterState(modal, (rows) => form.mode === "edit" ? rows.map((row) => Number(row.id) === Number(saved.id) ? saved : row) : [saved, ...rows]);
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save profile master.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async'''
text, count = save_re.subn(new_save, text, count=1)
if count != 1:
    raise SystemExit("save replacement failed")

toggle_re = re.compile(r"  const toggle = async \(target: ProfileMasterTab, item: any\) => \{.*?\n  const input =", re.S)
new_toggle = '''  const toggle = async (target: ProfileMasterTab, item: any) => {
    const next = item.status === "active" ? "inactive" : "active";
    setError(null);
    try {
      let result: any;
      if (target === "employment") result = await updateProfileEmploymentTypeStatus(item.id, next);
      else if (target === "banks") result = await updateProfileBankStatus(item.id, next);
      else if (target === "organizations") result = await updateProfileOrgUnitStatus(item.id, next);
      else if (target === "designations") result = await updateProfileDesignationStatus(item.id, next);
      else if (target === "streams") result = await updateProfileStreamStatus(item.id, next);
      else if (target === "msc_batches") result = await updateProfileMscBatchStatus(item.id, next);
      else if (target === "courses") result = await updateProfileCourseStatus(item.id, next);
      else if (target === "trainee_batches") result = await updateProfileTraineeBatchStatus(item.id, next);
      updateMasterState(target, (rows) => rows.map((row) => Number(row.id) === Number(item.id) ? { ...row, status: result.status ?? next } : row));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to change status.");
    }
  };

  const input ='''
text, count = toggle_re.subn(new_toggle, text, count=1)
if count != 1:
    raise SystemExit("toggle replacement failed")

for target in ["employment", "banks", "designations", "organizations", "streams", "msc_batches", "courses", "trainee_batches"]:
    old = f'onToggle={{() => void toggle("{target}", item)}} />'
    new = f'onToggle={{() => void toggle("{target}", item)}} onDelete={{() => void deleteMaster("{target}", item)}} />'
    if old not in text:
        raise SystemExit(f"Missing ActionCell call for {target}")
    text = text.replace(old, new, 1)

refresh = '        <button type="button" onClick={() => void load()} disabled={loading} className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{loading ? "Refreshing..." : "Refresh"}</button>\n'
if refresh not in text:
    raise SystemExit("Refresh button not found")
text = text.replace(refresh, "", 1)
admin.write_text(text, encoding="utf-8")

# Carry master status in the frontend types so the UI can defensively filter inactive values.
types = Path("src/types/profile.ts")
t = types.read_text(encoding="utf-8")
changes = {
    "export interface ProfileOrgUnit { id:number; unitType:ProfileOrgUnitType; unitName:string; unitCode:string; description:string|null; }": "export interface ProfileOrgUnit { id:number; unitType:ProfileOrgUnitType; unitName:string; unitCode:string; description:string|null; status?:MasterStatus; }",
    "export interface ProfileBank { id:number; bankName:string; bankCode:string; }": "export interface ProfileBank { id:number; bankName:string; bankCode:string; status?:MasterStatus; }",
    "export interface ProfileDesignation { id:number; employmentTypeId:number; employmentTypeCode:string; employmentTypeName:string; designationName:string; designationCode:string; }": "export interface ProfileDesignation { id:number; employmentTypeId:number; employmentTypeCode:string; employmentTypeName:string; designationName:string; designationCode:string; status?:MasterStatus; }",
    "export interface ProfileStream { id:number; streamName:string; streamCode:string; }": "export interface ProfileStream { id:number; streamName:string; streamCode:string; status?:MasterStatus; }",
    "export interface ProfileMscBatch { id:number; streamId:number; streamName:string; streamCode:string; batchNumber:number; batchName:string; batchCode:string; validityStartYear:number; validityEndYear:number; }": "export interface ProfileMscBatch { id:number; streamId:number; streamName:string; streamCode:string; batchNumber:number; batchName:string; batchCode:string; validityStartYear:number; validityEndYear:number; status?:MasterStatus; }",
    "export interface ProfileCourse { id:number; courseName:string; courseCode:string; }": "export interface ProfileCourse { id:number; courseName:string; courseCode:string; status?:MasterStatus; }",
    "export interface ProfileTraineeBatch { id:number; courseId:number; courseName:string; courseCode:string; batchNumber:number; batchName:string; batchCode:string; validityStartYear:number; validityEndYear:number; }": "export interface ProfileTraineeBatch { id:number; courseId:number; courseName:string; courseCode:string; batchNumber:number; batchName:string; batchCode:string; validityStartYear:number; validityEndYear:number; status?:MasterStatus; }",
}
for old, new in changes.items():
    if old in t:
        t = t.replace(old, new, 1)
types.write_text(t, encoding="utf-8")

# Defensively expose only active master records to profile dropdowns.
profile = Path("src/features/profile/pages/UserProfilePage.tsx")
p = profile.read_text(encoding="utf-8")
old_memos = '''  const departmentUnits = useMemo(() => getUnits(orgUnits, "department"), [orgUnits]);
  const cellUnits = useMemo(() => getUnits(orgUnits, "cell"), [orgUnits]);
  const projectUnits = useMemo(() => getUnits(orgUnits, "project"), [orgUnits]);
  const designationOptions=useMemo(()=>designations.filter(x=>Number(x.employmentTypeId)===Number(profile.employmentTypeId)),[designations,profile.employmentTypeId]);
  const mscBatchOptions=useMemo(()=>mscBatches.filter(x=>Number(x.streamId)===Number(profile.streamId)),[mscBatches,profile.streamId]);
  const traineeBatchOptions=useMemo(()=>traineeBatches.filter(x=>Number(x.courseId)===Number(profile.courseId)),[traineeBatches,profile.courseId]);'''
new_memos = '''  const activeEmploymentTypes = useMemo(() => employmentTypes.filter((x) => x.status !== "inactive"), [employmentTypes]);
  const activeOrgUnits = useMemo(() => orgUnits.filter((x) => x.status !== "inactive"), [orgUnits]);
  const activeBanks = useMemo(() => banks.filter((x) => x.status !== "inactive"), [banks]);
  const activeDesignations = useMemo(() => designations.filter((x) => x.status !== "inactive"), [designations]);
  const activeStreams = useMemo(() => streams.filter((x) => x.status !== "inactive"), [streams]);
  const activeMscBatches = useMemo(() => mscBatches.filter((x) => x.status !== "inactive"), [mscBatches]);
  const activeCourses = useMemo(() => courses.filter((x) => x.status !== "inactive"), [courses]);
  const activeTraineeBatches = useMemo(() => traineeBatches.filter((x) => x.status !== "inactive"), [traineeBatches]);
  const departmentUnits = useMemo(() => getUnits(activeOrgUnits, "department"), [activeOrgUnits]);
  const cellUnits = useMemo(() => getUnits(activeOrgUnits, "cell"), [activeOrgUnits]);
  const projectUnits = useMemo(() => getUnits(activeOrgUnits, "project"), [activeOrgUnits]);
  const designationOptions=useMemo(()=>activeDesignations.filter(x=>Number(x.employmentTypeId)===Number(profile.employmentTypeId)),[activeDesignations,profile.employmentTypeId]);
  const mscBatchOptions=useMemo(()=>activeMscBatches.filter(x=>Number(x.streamId)===Number(profile.streamId)),[activeMscBatches,profile.streamId]);
  const traineeBatchOptions=useMemo(()=>activeTraineeBatches.filter(x=>Number(x.courseId)===Number(profile.courseId)),[activeTraineeBatches,profile.courseId]);'''
if old_memos not in p:
    raise SystemExit("User profile master memo block not found")
p = p.replace(old_memos, new_memos, 1)
p = p.replace('employmentTypes.map((item) => <option key={item.id} value={item.displayName}>{item.displayName}</option>)', 'activeEmploymentTypes.map((item) => <option key={item.id} value={item.displayName}>{item.displayName}</option>)')
p = p.replace('{banks.map((bank) => <option key={bank.id} value={bank.bankName}>{bank.bankName}</option>)}', '{activeBanks.map((bank) => <option key={bank.id} value={bank.bankName}>{bank.bankName}</option>)}')
p = p.replace('{streams.map(x=><option key={x.id} value={x.id}>{x.streamName}</option>)}', '{activeStreams.map(x=><option key={x.id} value={x.id}>{x.streamName}</option>)}')
p = p.replace('{courses.map(x=><option key={x.id} value={x.id}>{x.courseName}</option>)}', '{activeCourses.map(x=><option key={x.id} value={x.id}>{x.courseName}</option>)}')
profile.write_text(p, encoding="utf-8")

print("Profile master UX patch applied successfully.")
