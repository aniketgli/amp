from pathlib import Path


def insert_after_line(text: str, marker: str, addition: str) -> str:
    start = text.find(marker)
    if start < 0:
        raise SystemExit(f"Missing anchor: {marker}")
    end = text.find("\n", start)
    if end < 0:
        end = len(text)
    return text[:end] + "\n" + addition + text[end:]


p = Path("server/repositories/profile-master-admin.repository.ts")
s = p.read_text()
for setter, deleter, table in [
    ("setEmploymentTypeStatus", "deleteEmploymentType", "profile_employment_types"),
    ("setOrgUnitStatus", "deleteOrgUnit", "profile_org_units"),
    ("setBankStatus", "deleteBank", "profile_bank_masters"),
    ("setDesignationStatus", "deleteDesignation", "profile_designation_masters"),
    ("setStreamStatus", "deleteStream", "profile_stream_masters"),
    ("setMscBatchStatus", "deleteMscBatch", "profile_msc_batches"),
    ("setCourseStatus", "deleteCourse", "profile_course_masters"),
    ("setTraineeBatchStatus", "deleteTraineeBatch", "profile_trainee_batches"),
]:
    if f"export async function {deleter}" not in s:
        s = insert_after_line(s, f"export async function {setter}", f"export async function {deleter}(id:number){{await db.query(`DELETE FROM {table} WHERE id=?`,[id]);}}")
p.write_text(s)

p = Path("server/services/profile-master-admin.service.ts")
s = p.read_text()
for old, new in [
    ("setEmploymentTypeStatus, createOrgUnit", "setEmploymentTypeStatus, deleteEmploymentType, createOrgUnit"),
    ("setOrgUnitStatus, createBank", "setOrgUnitStatus, deleteOrgUnit, createBank"),
    ("setBankStatus, createDesignation", "setBankStatus, deleteBank, createDesignation"),
    ("setDesignationStatus, createStream", "setDesignationStatus, deleteDesignation, createStream"),
    ("setStreamStatus, createMscBatch", "setStreamStatus, deleteStream, createMscBatch"),
    ("setMscBatchStatus, createCourse", "setMscBatchStatus, deleteMscBatch, createCourse"),
    ("setCourseStatus, createTraineeBatch", "setCourseStatus, deleteCourse, createTraineeBatch"),
    ("setTraineeBatchStatus }", "setTraineeBatchStatus, deleteTraineeBatch }"),
]:
    if new not in s:
        if old not in s: raise SystemExit(f"Missing service import anchor: {old}")
        s = s.replace(old, new, 1)
if "export const removeEmploymentType=" not in s:
    helper = '''async function removeRecord(removeFn:any,value:unknown,label:string){const recordId=id(value,label);try{await removeFn(recordId);}catch(error){const e=error as any;if(e?.code==='ER_ROW_IS_REFERENCED_2'||e?.errno===1451)throw new Error(`Cannot delete this ${label.toLowerCase()} because it is already used by another record. Deactivate it instead.`);throw error;}return{ id:recordId };}
export const removeEmploymentType=(value:unknown)=>removeRecord(deleteEmploymentType,value,"Employment Type ID");
'''
    s = s.replace("export async function addEmploymentType", helper + "export async function addEmploymentType", 1)
for fn, dbfn, label, anchor in [
    ("removeOrgUnit", "deleteOrgUnit", "Organization ID", "addOrgUnit"), ("removeBank", "deleteBank", "Bank ID", "addBank"),
    ("removeDesignation", "deleteDesignation", "Designation ID", "addDesignation"), ("removeStream", "deleteStream", "Stream ID", "addStream"),
    ("removeMscBatch", "deleteMscBatch", "MSc Batch ID", "addMscBatch"), ("removeCourse", "deleteCourse", "Course ID", "addCourse"),
    ("removeTraineeBatch", "deleteTraineeBatch", "Trainee Batch ID", "addTraineeBatch")]:
    if f"export const {fn}=" not in s:
        s = s.replace(f"export async function {anchor}", f'export const {fn}=(value:unknown)=>removeRecord({dbfn},value,"{label}");\nexport async function {anchor}', 1)
p.write_text(s)

p = Path("server/controllers/profile-master-admin.controller.ts")
s = p.read_text()
if "export async function deleteEmploymentType" not in s:
    s = s.replace("export async function createEmploymentType", 'export async function deleteEmploymentType(req:Request,res:Response){try{return ok(res,await service.removeEmploymentType(id(req)),"Employment type deleted successfully.");}catch(e){return fail(res,e,"Unable to delete employment type.");}}\nexport async function createEmploymentType', 1)
for fn, svc, label, anchor in [
    ("deleteOrgUnit", "removeOrgUnit", "Organization", "createOrgUnit"), ("deleteBank", "removeBank", "Bank", "createBank"),
    ("deleteDesignation", "removeDesignation", "Designation", "createDesignation"), ("deleteStream", "removeStream", "Stream", "createStream"),
    ("deleteMscBatch", "removeMscBatch", "MSc batch", "createMscBatch"), ("deleteCourse", "removeCourse", "Course", "createCourse"),
    ("deleteTraineeBatch", "removeTraineeBatch", "Trainee batch", "createTraineeBatch")]:
    if f"export async function {fn}" not in s:
        code = f'export async function {fn}(req:Request,res:Response){{try{{return ok(res,await service.{svc}(id(req)),"{label} deleted successfully.");}}catch(e){{return fail(res,e,"Unable to delete {label.lower()}.");}}}}\n'
        s = s.replace(f"export async function {anchor}", code + f"export async function {anchor}", 1)
p.write_text(s)

p = Path("server/routes/profile-master-admin.routes.ts")
s = p.read_text()
for path, fn in [
    ("employment-types", "deleteEmploymentType"), ("org-units", "deleteOrgUnit"), ("banks", "deleteBank"),
    ("designations", "deleteDesignation"), ("streams", "deleteStream"), ("msc-batches", "deleteMscBatch"),
    ("courses", "deleteCourse"), ("trainee-batches", "deleteTraineeBatch")]:
    route = f'  app.delete("/api/admin/profile-masters/{path}/:id", authenticateToken, administrator, controller.{fn});'
    if route not in s:
        status = f'  app.patch("/api/admin/profile-masters/{path}/:id/status", authenticateToken, administrator, controller.'
        pos = s.find(status)
        if pos < 0: raise SystemExit(f"Missing status route: {path}")
        s = s[:pos] + route + "\n" + s[pos:]
p.write_text(s)

p = Path("src/api/profile.api.ts")
s = p.read_text()
s = s.replace('method:"GET"|"POST"|"PUT"|"PATCH"', 'method:"GET"|"POST"|"PUT"|"PATCH"|"DELETE"', 1)
for suffix, path in [
    ("EmploymentType", "employment-types"), ("OrgUnit", "org-units"), ("Bank", "banks"), ("Designation", "designations"),
    ("Stream", "streams"), ("MscBatch", "msc-batches"), ("Course", "courses"), ("TraineeBatch", "trainee-batches")]:
    fn = f"deleteProfile{suffix}"
    if f"export const {fn}=" not in s:
        anchor = "export const getAdminProfileOrgUnits" if suffix == "EmploymentType" else f"export const createProfile{suffix}"
        if anchor not in s: raise SystemExit(f"Missing API anchor: {suffix}")
        code = f'export const {fn}=(id:number)=>adminRequest<{{id:number}}>(`/api/admin/profile-masters/{path}/${{id}}`,"DELETE");\n'
        s = s.replace(anchor, code + anchor, 1)
p.write_text(s)

p = Path("src/features/admin/pages/AdminControlPage.tsx")
s = p.read_text()
old = 'function MasterStatusBadge({status}:{status:string}){return <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">{status}</span>;}\nfunction ManagementTable({headers,rows,render}:{headers:string[];rows:any[];render:(item:any)=>React.ReactNode}){return <div className="overflow-x-auto border rounded-xl"><table className="w-full text-left text-xs"><thead><tr>{headers.map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.length===0?<tr><td colSpan={headers.length} className="p-8 text-center">No records found.</td></tr>:rows.map(item=><tr key={item.id}>{render(item)}</tr>)}</tbody></table></div>;}'
new = '''function MasterStatusBadge({status}:{status:string}){const active=String(status).toLowerCase()==="active";return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${active?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}><span className={`w-1.5 h-1.5 rounded-full ${active?"bg-emerald-500":"bg-slate-400"}`}/>{active?"Active":"Inactive"}</span>;}\nfunction ActionCell({item,onEdit,onToggle}:{item:any;onEdit:()=>void;onToggle:()=>void}){const active=String(item.status).toLowerCase()==="active";const resource=item.displayName?"employment-types":item.bankName?"banks":item.designationName?"designations":item.unitName?"org-units":item.streamName?"streams":item.courseName&&item.batchName?"trainee-batches":item.courseName?"courses":item.batchName?"msc-batches":null;const onDelete=async()=>{if(!resource||!window.confirm("Delete this master record? This action cannot be undone."))return;try{const r=await fetch(`/api/admin/profile-masters/${resource}/${encodeURIComponent(String(item.id))}`,{method:"DELETE"});const d=await r.json();if(!r.ok||!d.success)throw new Error(d.message||"Unable to delete record.");window.location.reload();}catch(e){window.alert(e instanceof Error?e.message:"Unable to delete record.");}};return <td className="px-4 py-3"><div className="flex items-center justify-end gap-2"><button type="button" title={active?"Deactivate":"Activate"} aria-label={active?"Deactivate":"Activate"} onClick={onToggle} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${active?"bg-emerald-500":"bg-slate-300"}`}><span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${active?"translate-x-6":"translate-x-1"}`}/></button><button type="button" title="Edit" aria-label="Edit" onClick={onEdit} className="p-1.5 rounded-md text-purple-700 hover:bg-purple-50"><Edit3 className="w-4 h-4"/></button><button type="button" title="Delete" aria-label="Delete" onClick={onDelete} className="p-1.5 rounded-md text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button></div></td>;}\nfunction ManagementTable({headers,rows,render}:{headers:string[];rows:any[];render:(item:any)=>React.ReactNode}){return <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white"><table className="w-full text-left text-xs"><thead className="bg-slate-50 border-b border-slate-200"><tr>{headers.map((h,i)=><th key={h} className={`px-4 py-3 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 ${i===headers.length-1?"text-right":""}`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length===0?<tr><td colSpan={headers.length} className="px-4 py-12 text-center text-slate-400">No records found.</td></tr>:rows.map(item=><tr key={item.id} className="hover:bg-slate-50/70 transition-colors">{render(item)}</tr>)}</tbody></table></div>;}'''
if old not in s: raise SystemExit("UI master table anchor not found")
s = s.replace(old, new, 1)
legacy = '''function ActionCell({ item, onEdit, onToggle }: { item: any; onEdit: () => void; onToggle: () => void }) {\n  return <td className="p-3"><div className="flex justify-end gap-1"><button type="button" onClick={onEdit} className="p-2 text-purple-700 hover:bg-purple-50 rounded-lg" title="Edit"><Edit3 className="w-4 h-4" /></button><button type="button" onClick={onToggle} className={`px-2 py-1 rounded text-[10px] font-bold ${item.status === "active" ? "text-red-600 hover:bg-red-50" : "text-emerald-700 hover:bg-emerald-50"}`}>{item.status === "active" ? "Deactivate" : "Activate"}</button></div></td>;\n}\n'''
if legacy not in s: raise SystemExit("Legacy ActionCell anchor not found")
s = s.replace(legacy, "", 1)
p.write_text(s)

Path(".github/workflows/ci.yml").write_text('''name: CI\n\non:\n  push:\n    branches:\n      - security-hardening\n      - main\n      - production-readiness-cleanup\n  pull_request:\n    branches:\n      - security-hardening\n      - main\n      - production-readiness-cleanup\n\npermissions:\n  contents: read\n\njobs:\n  validate:\n    name: Lint, Test and Build\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n      - name: Setup Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: npm\n      - name: Install dependencies\n        run: npm ci\n      - name: TypeScript validation\n        run: npm run lint\n      - name: Run unit tests\n        run: npm test\n      - name: Production build\n        run: npm run build\n''')
Path(".github/workflows/apply-master-actions.yml").unlink(missing_ok=True)
Path(".github/workflows/profile-master-patch.yml").unlink(missing_ok=True)
Path("scripts/apply_profile_master_actions.py").unlink(missing_ok=True)
