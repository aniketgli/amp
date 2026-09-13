from pathlib import Path

root = Path('.')

p = root / 'src/features/admin/components/ProfileMastersSection.tsx'
s = p.read_text(encoding='utf-8')

# Add delete API imports.
s = s.replace(
'  updateProfileTraineeBatchStatus,\n} from "@/api/profile.api";',
'  updateProfileTraineeBatchStatus,\n  deleteProfileEmploymentType,\n  deleteProfileOrgUnit,\n  deleteProfileBank,\n  deleteProfileDesignation,\n  deleteProfileStream,\n  deleteProfileMscBatch,\n  deleteProfileCourse,\n  deleteProfileTraineeBatch,\n} from "@/api/profile.api";'
)

old_action_start = 'function ActionCell({item,onEdit,onToggle}:{item:any;onEdit:()=>void;onToggle:()=>void}){'
a = s.index(old_action_start)
a_end = s.index('\nfunction ManagementTable', a)
new_action = '''function ActionCell({item,onEdit,onToggle,onDelete}:{item:any;onEdit:()=>void;onToggle:()=>void;onDelete:()=>void}){\n  const active=String(item.status).toLowerCase()==="active";\n  return <td className="px-4 py-3"><div className="flex items-center justify-end gap-2">\n    <button type="button" title={active?"Deactivate":"Activate"} aria-label={active?"Deactivate":"Activate"} onClick={onToggle} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${active?"bg-emerald-500":"bg-slate-300"}`}><span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${active?"translate-x-6":"translate-x-1"}`}/></button>\n    <button type="button" title="Edit" aria-label="Edit" onClick={onEdit} className="p-1.5 rounded-md text-purple-700 hover:bg-purple-50"><Edit3 className="w-4 h-4"/></button>\n    <button type="button" title="Delete" aria-label="Delete" onClick={onDelete} className="p-1.5 rounded-md text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>\n  </div></td>;\n}'''
s = s[:a] + new_action + s[a_end:]

# Employment save was accidentally short-circuited.
s = s.replace('    if (!modal || modal === "employment") return;', '    if (!modal) return;')

# Add local delete handler before renderTable.
needle = '  const renderTable = () => {'
delete_fn = '''  const deleteMaster = async (target: ProfileMasterTab, item: any) => {\n    if (!window.confirm(`Delete ${item.displayName || item.bankName || item.designationName || item.unitName || item.streamName || item.batchName || item.courseName || "this master record"}? This action cannot be undone.`)) return;\n    try {\n      if (target === "employment") { await deleteProfileEmploymentType(item.id); setEmploymentTypes((rows) => rows.filter((row) => row.id !== item.id)); }\n      else if (target === "banks") { await deleteProfileBank(item.id); setBanks((rows) => rows.filter((row) => row.id !== item.id)); }\n      else if (target === "organizations") { await deleteProfileOrgUnit(item.id); setOrganizations((rows) => rows.filter((row) => row.id !== item.id)); }\n      else if (target === "designations") { await deleteProfileDesignation(item.id); setDesignations((rows) => rows.filter((row) => row.id !== item.id)); }\n      else if (target === "streams") { await deleteProfileStream(item.id); setStreams((rows) => rows.filter((row) => row.id !== item.id)); }\n      else if (target === "msc_batches") { await deleteProfileMscBatch(item.id); setMscBatches((rows) => rows.filter((row) => row.id !== item.id)); }\n      else if (target === "courses") { await deleteProfileCourse(item.id); setCourses((rows) => rows.filter((row) => row.id !== item.id)); }\n      else { await deleteProfileTraineeBatch(item.id); setTraineeBatches((rows) => rows.filter((row) => row.id !== item.id)); }\n      setError(null);\n    } catch (e) {\n      setError(e instanceof Error ? e.message : "Unable to delete master record.");\n    }\n  };\n\n  const updateLocalStatus = (target: ProfileMasterTab, id: number, status: string) => {\n    const update = (rows: any[]) => rows.map((row) => row.id === id ? { ...row, status } : row);\n    if (target === "employment") setEmploymentTypes(update(employmentTypes));\n    else if (target === "banks") setBanks(update(banks));\n    else if (target === "organizations") setOrganizations(update(organizations));\n    else if (target === "designations") setDesignations(update(designations));\n    else if (target === "streams") setStreams(update(streams));\n    else if (target === "msc_batches") setMscBatches(update(mscBatches));\n    else if (target === "courses") setCourses(update(courses));\n    else setTraineeBatches(update(traineeBatches));\n  };\n\n'''
s = s.replace(needle, delete_fn + needle, 1)

# Replace toggle reload with immediate local status update.
s = s.replace('      await load();\n    } catch (e) { setError(e instanceof Error ? e.message : "Unable to change status."); }', '      updateLocalStatus(target, Number(item.id), next);\n      setError(null);\n    } catch (e) { setError(e instanceof Error ? e.message : "Unable to change status."); }', 1)

# Remove refresh button from Profile Masters header.
refresh = '<button type="button" onClick={() => void load()} disabled={loading} className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{loading ? "Refreshing..." : "Refresh"}</button>'
s = s.replace(refresh, '', 1)

# Wire delete callbacks to every table action cell.
for target in ['employment','banks','designations','organizations','streams','msc_batches','courses','trainee_batches']:
    old = f'onToggle={{() => void toggle("{target}", item)}} />'
    new = f'onToggle={{() => void toggle("{target}", item)}} onDelete={{() => void deleteMaster("{target}", item)}} />'
    s = s.replace(old, new)

p.write_text(s, encoding='utf-8')

# Public master repository: only active employment types should be exposed to profile dropdowns.
p = root / 'server/repositories/profile-master.repository.ts'
s = p.read_text(encoding='utf-8')
s = s.replace('FROM profile_employment_types\n    ORDER BY id ASC', "FROM profile_employment_types\n    WHERE status = 'active'\n    ORDER BY id ASC", 1)
p.write_text(s, encoding='utf-8')

# User profile: make every master dropdown explicitly active-only and keep dependent links.
p = root / 'src/features/profile/pages/UserProfilePage.tsx'
s = p.read_text(encoding='utf-8')
needle = '  const designationOptions=useMemo(()=>designations.filter(x=>Number(x.employmentTypeId)===Number(profile.employmentTypeId)),[designations,profile.employmentTypeId]);'
replacement = '''  const activeEmploymentTypes = useMemo(() => employmentTypes.filter((x) => String((x as any).status ?? "active").toLowerCase() === "active"), [employmentTypes]);\n  const activeOrgUnits = useMemo(() => orgUnits.filter((x) => String((x as any).status ?? "active").toLowerCase() === "active"), [orgUnits]);\n  const activeBanks = useMemo(() => banks.filter((x) => String((x as any).status ?? "active").toLowerCase() === "active"), [banks]);\n  const activeDesignations = useMemo(() => designations.filter((x) => String((x as any).status ?? "active").toLowerCase() === "active"), [designations]);\n  const activeStreams = useMemo(() => streams.filter((x) => String((x as any).status ?? "active").toLowerCase() === "active"), [streams]);\n  const activeMscBatches = useMemo(() => mscBatches.filter((x) => String((x as any).status ?? "active").toLowerCase() === "active"), [mscBatches]);\n  const activeCourses = useMemo(() => courses.filter((x) => String((x as any).status ?? "active").toLowerCase() === "active"), [courses]);\n  const activeTraineeBatches = useMemo(() => traineeBatches.filter((x) => String((x as any).status ?? "active").toLowerCase() === "active"), [traineeBatches]);\n  const designationOptions=useMemo(()=>activeDesignations.filter(x=>Number(x.employmentTypeId)===Number(profile.employmentTypeId)),[activeDesignations,profile.employmentTypeId]);'''
if needle not in s:
    raise SystemExit('designation options marker not found')
s = s.replace(needle, replacement, 1)
s = s.replace('const mscBatchOptions=useMemo(()=>mscBatches.filter(x=>Number(x.streamId)===Number(profile.streamId)),[mscBatches,profile.streamId]);', 'const mscBatchOptions=useMemo(()=>activeMscBatches.filter(x=>Number(x.streamId)===Number(profile.streamId)),[activeMscBatches,profile.streamId]);')
s = s.replace('const traineeBatchOptions=useMemo(()=>traineeBatches.filter(x=>Number(x.courseId)===Number(profile.courseId)),[traineeBatches,profile.courseId]);', 'const traineeBatchOptions=useMemo(()=>activeTraineeBatches.filter(x=>Number(x.courseId)===Number(profile.courseId)),[activeTraineeBatches,profile.courseId]);')
# Dropdown sources.
s = s.replace('{employmentTypes.map((item)', '{activeEmploymentTypes.map((item)')
s = s.replace('{banks.map((bank)', '{activeBanks.map((bank)')
s = s.replace('{[...departmentUnits,...cellUnits].map((unit)', '{[...getUnits(activeOrgUnits, "department"),...getUnits(activeOrgUnits, "cell")].map((unit)')
s = s.replace('{[...projectUnits,...departmentUnits,...cellUnits].map((unit)', '{[...getUnits(activeOrgUnits, "project"),...getUnits(activeOrgUnits, "department"),...getUnits(activeOrgUnits, "cell")].map((unit)')
s = s.replace('{projectUnits.map((unit)', '{getUnits(activeOrgUnits, "project").map((unit)')
s = s.replace('{streams.map(x=>', '{activeStreams.map(x=>')
s = s.replace('{courses.map(x=>', '{activeCourses.map(x=>')
p.write_text(s, encoding='utf-8')

print('Profile master functionality patch applied.')
