import { RoleInfo } from "@/types/requisition";

export const OFFICIAL_ROLES: RoleInfo[] = [
  {
    id: "applicant",
    name: "User Portal",
    title: "User",
    department: "General Portal User",
    avatarColor: "bg-emerald-600 font-bold",
  },
  {
    id: "supervisor",
    name: "Reporting Manager / Supervisor Desk",
    title: "Reporting Manager / Supervisor (PI)",
    department: "Reporting Manager / Principal Investigator Desk",
    avatarColor: "bg-indigo-600 font-bold",
  },
  {
    id: "lab_nodal",
    name: "Lab Nodal Officer Desk",
    title: "Nodal Officer",
    department: "Analytical & Research Laboratories",
    avatarColor: "bg-amber-600 font-bold",
  },
  {
    id: "assoc_lab_nodal",
    name: "Associate Lab Nodal Desk",
    title: "Associate Nodal Officer",
    department: "Analytical & Research Laboratories",
    avatarColor: "bg-amber-700 font-bold",
  },
  {
    id: "it_officer",
    name: "IT Head Technology Desk",
    title: "IT Head",
    department: "IT, RS & GIS Cell",
    intercom: "138",
    avatarColor: "bg-blue-600 font-bold",
  },
  {
    id: "section_head",
    name: "Facility Operations Desk",
    title: "Manager",
    department: "Facility & Operations Unit",
    intercom: "101",
    avatarColor: "bg-rose-700 font-bold",
  },
  {
    id: "hrms_officer",
    name: "Lab Supervisor Desk",
    title: "Lab Supervisor",
    department: "Lab Operations Unit",
    intercom: "102",
    avatarColor: "bg-purple-600 font-bold",
  },
  {
    id: "admin",
    name: "Master System Admin",
    title: "Admin",
    department: "Institute System Administration Desk",
    avatarColor: "bg-slate-800 font-bold",
  },
];
