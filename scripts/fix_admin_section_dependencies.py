from pathlib import Path
p = Path('src/features/admin/components/FacilitiesServicesSection.tsx')
s = p.read_text(encoding='utf-8')
if 'const getDefaultFacilityWorkflow' not in s:
    marker = 'interface FacilitiesServicesSectionProps {'
    helpers = '''const getDefaultFacilityWorkflow = (supervisor: string, assocNodal: string, nodal: string): any[] => [\n  { stageNumber: 1, stageName: "Supervising Officer / PI Endorsement", dealingOfficerName: "Applicant's Supervising Officer (PI)" },\n  { stageNumber: 2, stageName: "Technical Supervisor Verification", dealingOfficerName: supervisor || "Lab Technical Supervisor" },\n  { stageNumber: 3, stageName: "Associate Nodal Officer Review", dealingOfficerName: assocNodal || "Associate Nodal Officer" },\n  { stageNumber: 4, stageName: "Nodal Officer Final Approval", dealingOfficerName: nodal || "Nodal Officer" },\n];\n\nconst getDefaultServiceWorkflow = (manager: string): any[] => [\n  { stageNumber: 1, stageName: "Supervising Officer / PI Endorsement", dealingOfficerName: "Applicant's Supervising Officer (PI)" },\n  { stageNumber: 2, stageName: "In-Charge Manager Verification", dealingOfficerName: manager || "Service In-Charge Manager" },\n  { stageNumber: 3, stageName: "IT Head / Admin Provisioning", dealingOfficerName: "IT Officer / System Admin" },\n];\n\n'''
    s = s.replace(marker, helpers + marker, 1)
    p.write_text(s, encoding='utf-8')
