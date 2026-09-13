from pathlib import Path
import re

ROOT = Path('.').resolve()
page = ROOT / 'src/features/admin/pages/AdminControlPage.tsx'
text = page.read_text(encoding='utf-8')
if 'UserRoleAccountsSection' in text and '../components/ProfileMastersSection' in text:
    print('AdminControlPage already split; nothing to do.')
    raise SystemExit(0)

pm_start = text.index('type ProfileMasterTab =')
pm_marker = '/* =========================================================\n   COMPONENT\n========================================================= */'
pm_end = text.index(pm_marker, pm_start)
pm_block = text[pm_start:pm_end].rstrip() + '\n'

profile_file = ROOT / 'src/features/admin/components/ProfileMastersSection.tsx'
profile_file.parent.mkdir(parents=True, exist_ok=True)
profile_content = '''import React, { useEffect, useState } from "react";\nimport {\n  getAdminProfileEmploymentTypes,\n  createProfileEmploymentType,\n  updateProfileEmploymentType,\n  updateProfileEmploymentTypeStatus,\n  getAdminProfileOrgUnits,\n  getAdminProfileBanks,\n  getAdminProfileDesignations,\n  getAdminProfileStreams,\n  getAdminProfileMscBatches,\n  getAdminProfileCourses,\n  getAdminProfileTraineeBatches,\n  createProfileOrgUnit,\n  updateProfileOrgUnit,\n  updateProfileOrgUnitStatus,\n  createProfileBank,\n  updateProfileBank,\n  updateProfileBankStatus,\n  createProfileDesignation,\n  updateProfileDesignation,\n  updateProfileDesignationStatus,\n  createProfileStream,\n  updateProfileStream,\n  updateProfileStreamStatus,\n  createProfileMscBatch,\n  updateProfileMscBatch,\n  updateProfileMscBatchStatus,\n  createProfileCourse,\n  updateProfileCourse,\n  updateProfileCourseStatus,\n  createProfileTraineeBatch,\n  updateProfileTraineeBatch,\n  updateProfileTraineeBatchStatus,\n} from "@/api/profile.api";\nimport { Database, Edit3, PlusCircle, Trash2, X } from "lucide-react";\n\n''' + pm_block.replace('function ProfileMastersPanel()', 'export function ProfileMastersPanel()') + '\n'
profile_file.write_text(profile_content, encoding='utf-8')
text = text[:pm_start] + text[pm_end:]

def extract_conditional(src, tab, next_marker):
    start_marker = f'{{activeSubTab === "{tab}" && ('
    start = src.index(start_marker)
    end = src.index(next_marker, start)
    block = src[start:end]
    body = block[len(start_marker):]
    close = '\n      )}'
    idx = body.rfind(close)
    if idx == -1:
        raise RuntimeError(f'Cannot find conditional close for {tab}')
    return start, end, body[:idx].strip('\n')

markers = {
    'PROFILE_MASTERS': '      {/* =====================================================\n          PROFILE MASTERS\n      ===================================================== */}',
    'ACCESS_OVERRIDE': '      {/* =====================================================\n          ACCESS OVERRIDE\n      ===================================================== */}',
    'SYSTEM_CONFIG': '      {/* =====================================================\n          SYSTEM CONFIG\n      ===================================================== */}',
    'SECURITY_AUDIT': '      {/* =====================================================\n          SECURITY AUDIT\n      ===================================================== */}',
}

component_specs = [
    ('UserRoleAccountsSection', 'users', 'PROFILE_MASTERS'),
    ('FacilitiesServicesSection', 'masters', 'ACCESS_OVERRIDE'),
    ('AccessOverrideSection', 'requisitions_override', 'SYSTEM_CONFIG'),
    ('SystemMaintenanceSection', 'system_config', 'SECURITY_AUDIT'),
]

extracted = {}
for comp, tab, next_key in component_specs:
    _, _, inner = extract_conditional(text, tab, markers[next_key])
    extracted[comp] = inner

props = {
'UserRoleAccountsSection': '''interface UserRoleAccountsSectionProps {\n  userSearch: string;\n  setUserSearch: (value: string) => void;\n  usersLoading: boolean;\n  usersError: string | null;\n  filteredUsers: any[];\n  getDisplayName: (user: any) => string;\n  setEditingUser: (user: any) => void;\n  handleDeleteUser: (id: any) => void;\n}\n''',
'FacilitiesServicesSection': '''interface FacilitiesServicesSectionProps {\n  facilitiesList: any[];\n  facilitiesLoading: boolean;\n  facilitiesError: string | null;\n  fetchFacilities: () => void;\n  setIsAddFacilityModalOpen: (open: boolean) => void;\n  handleToggleFacilityStatus: (facility: any) => void;\n  handleOpenWorkflowModal: (type: "facility" | "service", item: any) => void;\n  setEditingFacility: (facility: any) => void;\n  handleDeleteFacility: (id: any) => void;\n  servicesList: any[];\n  servicesLoading: boolean;\n  servicesError: string | null;\n  fetchServices: () => void;\n  setIsAddServiceModalOpen: (open: boolean) => void;\n  handleToggleServiceStatus: (service: any) => void;\n  setEditingService: (service: any) => void;\n  handleDeleteService: (id: any) => void;\n}\n''',
'AccessOverrideSection': '''interface AccessOverrideSectionProps {\n  requisitions: any[];\n  handleForceApprove: (req: any) => void;\n  handleForceReject: (req: any) => void;\n}\n''',
'SystemMaintenanceSection': '''interface SystemMaintenanceSectionProps {\n  systemConfig: any;\n  setSystemConfig: React.Dispatch<React.SetStateAction<any>>;\n}\n''',
}
imports = {
'UserRoleAccountsSection': 'import React from "react";\nimport { Edit3, Search, Trash2, Users } from "lucide-react";\n',
'FacilitiesServicesSection': 'import React from "react";\nimport { Building2, Edit3, GitMerge, PlusCircle, Trash2, Wrench } from "lucide-react";\n',
'AccessOverrideSection': 'import React from "react";\nimport { CheckCircle2, XCircle, Zap } from "lucide-react";\n',
'SystemMaintenanceSection': 'import React from "react";\nimport { Sliders } from "lucide-react";\n',
}

def make_component(comp, inner):
    param_names = re.findall(r'^  (\w+):', props[comp], flags=re.M)
    destruct = ',\n  '.join(param_names)
    return imports[comp] + '\n' + props[comp] + f'\nexport function {comp}({{\n  {destruct}\n}}: {comp}Props) {{\n  return (\n{inner}\n  );\n}}\n'

for comp, inner in extracted.items():
    (ROOT / 'src/features/admin/components' / f'{comp}.tsx').write_text(make_component(comp, inner), encoding='utf-8')

replacements = [
 ('users', 'PROFILE_MASTERS', '''{activeSubTab === "users" && <UserRoleAccountsSection\n        userSearch={userSearch}\n        setUserSearch={setUserSearch}\n        usersLoading={usersLoading}\n        usersError={usersError}\n        filteredUsers={filteredUsers}\n        getDisplayName={getDisplayName}\n        setEditingUser={setEditingUser}\n        handleDeleteUser={handleDeleteUser}\n      />}\n\n'''),
 ('masters', 'ACCESS_OVERRIDE', '''{activeSubTab === "masters" && <FacilitiesServicesSection\n        facilitiesList={facilitiesList}\n        facilitiesLoading={facilitiesLoading}\n        facilitiesError={facilitiesError}\n        fetchFacilities={fetchFacilities}\n        setIsAddFacilityModalOpen={setIsAddFacilityModalOpen}\n        handleToggleFacilityStatus={handleToggleFacilityStatus}\n        handleOpenWorkflowModal={handleOpenWorkflowModal}\n        setEditingFacility={setEditingFacility}\n        handleDeleteFacility={handleDeleteFacility}\n        servicesList={servicesList}\n        servicesLoading={servicesLoading}\n        servicesError={servicesError}\n        fetchServices={fetchServices}\n        setIsAddServiceModalOpen={setIsAddServiceModalOpen}\n        handleToggleServiceStatus={handleToggleServiceStatus}\n        setEditingService={setEditingService}\n        handleDeleteService={handleDeleteService}\n      />}\n\n'''),
 ('requisitions_override', 'SYSTEM_CONFIG', '''{activeSubTab === "requisitions_override" && <AccessOverrideSection\n        requisitions={requisitions}\n        handleForceApprove={handleForceApprove}\n        handleForceReject={handleForceReject}\n      />}\n\n'''),
 ('system_config', 'SECURITY_AUDIT', '''{activeSubTab === "system_config" && <SystemMaintenanceSection\n        systemConfig={systemConfig}\n        setSystemConfig={setSystemConfig}\n      />}\n\n'''),
]
for tab, next_key, repl in reversed(replacements):
    start, end, _ = extract_conditional(text, tab, markers[next_key])
    text = text[:start] + repl + text[end:]

needle = 'import { LogoBrandingMasterSection } from "../components/LogoBrandingMasterSection";\n'
imports_block = needle + '''import { UserRoleAccountsSection } from "../components/UserRoleAccountsSection";\nimport { ProfileMastersPanel } from "../components/ProfileMastersSection";\nimport { FacilitiesServicesSection } from "../components/FacilitiesServicesSection";\nimport { AccessOverrideSection } from "../components/AccessOverrideSection";\nimport { SystemMaintenanceSection } from "../components/SystemMaintenanceSection";\n'''
text = text.replace(needle, imports_block)
page.write_text(text, encoding='utf-8')
print('AdminControlPage split completed.')
