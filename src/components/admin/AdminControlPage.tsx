import React, { useEffect, useMemo, useState } from "react";
import { RequisitionRecord, UserRole } from "../../types/requisition";
import { recordSecurityAuditLog } from "../../utils/auditLogger";
import { SecurityAuditTrailSection } from "./SecurityAuditTrailSection";
import { DatabaseSchemaSection } from "./DatabaseSchemaSection";

import {
  Activity,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Database,
  Edit3,
  PlusCircle,
  Search,
  Sliders,
  Trash2,
  Users,
  Wrench,
  X,
  XCircle,
  Zap,
  ShieldCheck,
} from "lucide-react";

/* =========================================================
   ADMIN CONTROL PAGE
   =========================================================
   IMPORTANT DESIGN RULES

   1. Users come ONLY from MySQL -> /api/users
   2. Facilities come ONLY from MySQL -> /api/facilities
   3. Services come ONLY from MySQL -> /api/services
   4. No hardcoded users
   5. No localStorage master data
   6. Department is NOT shown in the UI
   7. Facility dropdowns are filtered by DB role
   8. Service Manager dropdown is filtered by DB role
   9. Add / Edit / Delete / Status changes go to backend
   10. After every CRUD operation data is reloaded from DB
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type FacilityStatus = "active" | "inactive" | "maintenance";
type ServiceStatus = "active" | "inactive";

interface FacilityRecord {
  id: string;

  // Frontend-friendly names
  name: string;

  // Kept internally only for backend compatibility.
  // It is NOT shown in Add/Edit UI.
  dept: string;

  nodal: string;
  assocNodal: string;
  supervisor: string;
  desc: string;

  status: FacilityStatus;
}

interface ServiceRecord {
  id: string;
  name: string;
  manager: string;
  quota: string;
  status: ServiceStatus;
}

interface AdminUser {
  id: string | number;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  intercomExtension?: string;
  intercom?: string;
  status?: string;
  roles?: {
    id: number;
    code: string;
    name: string;
  }[];
}

interface AdminControlPageProps {
  requisitions: RequisitionRecord[];

  onUpdateRequisition: (req: RequisitionRecord) => void;

  onRoleChange?: (role: UserRole) => void;
}

/* =========================================================
   DATABASE ROLE DEFINITIONS

   These are ROLE definitions, NOT users.

   Users themselves are NEVER hardcoded.
   Actual users always come from /api/users.
========================================================= */

const SYSTEM_ROLES = [
  {
    id: 1,
    code: "user",
    name: "User",
  },
  {
    id: 2,
    code: "reporting_manager",
    name: "Reporting Manager / Supervisor",
  },
  {
    id: 3,
    code: "nodal_officer",
    name: "Nodal Officer",
  },
  {
    id: 4,
    code: "associate_nodal_officer",
    name: "Associate Nodal Officer",
  },
  {
    id: 5,
    code: "it_head",
    name: "IT Head",
  },
  {
    id: 6,
    code: "manager",
    name: "Manager",
  },
  {
    id: 7,
    code: "supervisor",
    name: "Supervisor",
  },
  {
    id: 8,
    code: "administrator",
    name: "Administrator",
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export const SuperAdminControlPanel: React.FC<AdminControlPageProps> = ({
  requisitions,
  onUpdateRequisition,
}) => {
  /* =======================================================
     ACTIVE ADMIN TAB
  ======================================================= */

  const [activeSubTab, setActiveSubTab] = useState<
    | "users"
    | "masters"
    | "requisitions_override"
    | "system_config"
    | "audit_logs"
    | "database_schema"
  >("users");

  /* =======================================================
     USERS
     -------------------------------------------------------
     Users are ALWAYS loaded from DB.
  ======================================================= */

  const [managedUsers, setManagedUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState("");

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  /* =======================================================
     FACILITIES
  ======================================================= */

  const [facilitiesList, setFacilitiesList] = useState<FacilityRecord[]>([]);

  const [facilitiesLoading, setFacilitiesLoading] = useState(false);

  const [facilitiesError, setFacilitiesError] = useState<string | null>(null);

  const [editingFacility, setEditingFacility] = useState<FacilityRecord | null>(
    null,
  );

  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false);

  const [newFacility, setNewFacility] = useState({
    name: "",
    nodal: "",
    assocNodal: "",
    supervisor: "",
    desc: "",
  });

  /* =======================================================
     SERVICES
  ======================================================= */

  const [servicesList, setServicesList] = useState<ServiceRecord[]>([]);

  const [servicesLoading, setServicesLoading] = useState(false);

  const [servicesError, setServicesError] = useState<string | null>(null);

  const [editingService, setEditingService] = useState<ServiceRecord | null>(
    null,
  );

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);

  const [newService, setNewService] = useState({
    name: "",
    manager: "",
    quota: "",
  });

  /* =======================================================
     SYSTEM CONFIG
  ======================================================= */

  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    emergencyApprovalBypass: false,
  });

  /* =======================================================
     TOAST
  ======================================================= */

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  /* =======================================================
     HELPER: GET USER NAME
  ======================================================= */

  const getDisplayName = (user: AdminUser) => {
    return String(user.fullName || user.name || "").trim() || "—";
  };

  /* =======================================================
     HELPER: GET USER ROLES
  ======================================================= */

  const getUserRoleCodes = (user: AdminUser): string[] => {
    if (!Array.isArray(user.roles)) {
      return [];
    }

    return user.roles
      .map((role) => String(role?.code || "").trim())
      .filter(Boolean);
  };

  const getUserRoleNames = (user: AdminUser): string[] => {
    if (!Array.isArray(user.roles)) {
      return [];
    }

    return user.roles
      .map((role) => String(role?.name || "").trim())
      .filter(Boolean);
  };

  /* =======================================================
     HELPER: CHECK DB ROLE
  ======================================================= */

  const hasDbRole = (user: AdminUser, ...roleCodes: string[]) => {
    const assignedRoles = getUserRoleCodes(user);

    return roleCodes.some((code) => assignedRoles.includes(code));
  };

  /* =======================================================
     HELPER: NORMALIZE FACILITY API RESPONSE

     Backend may return either:

     facility_name
     nodal_officer_name

     OR:

     name
     nodal

     This function supports both.
  ======================================================= */

  const normalizeFacility = (item: any): FacilityRecord => {
    return {
      id: String(item?.id ?? ""),

      name: String(item?.name ?? item?.facility_name ?? ""),

      dept: String(
        item?.dept ?? item?.department ?? "Research Laboratories Division",
      ),

      nodal: String(item?.nodal ?? item?.nodal_officer_name ?? ""),

      assocNodal: String(
        item?.assocNodal ?? item?.assoc_nodal_officer_name ?? "",
      ),

      supervisor: String(item?.supervisor ?? item?.supervisor_name ?? ""),

      desc: String(item?.desc ?? item?.description ?? ""),

      status:
        item?.status === "maintenance"
          ? "maintenance"
          : item?.status === "inactive"
            ? "inactive"
            : "active",
    };
  };

  /* =======================================================
     HELPER: NORMALIZE SERVICE API RESPONSE
  ======================================================= */

  const normalizeService = (item: any): ServiceRecord => {
    return {
      id: String(item?.id ?? ""),

      name: String(item?.name ?? item?.service_name ?? ""),

      manager: String(item?.manager ?? item?.manager_name ?? ""),

      quota: String(item?.quota ?? item?.quota_access_specs ?? ""),

      status: item?.status === "inactive" ? "inactive" : "active",
    };
  };

  /* =======================================================
     FETCH USERS
  ======================================================= */

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);

    try {
      const response = await fetch("/api/users", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load users from database.");
      }

      if (!Array.isArray(data.users)) {
        throw new Error("Invalid users response received.");
      }

      /*
        IMPORTANT:
        Replace complete list.

        NEVER merge with:
        - hardcoded users
        - localStorage users
        - initial users
      */

      setManagedUsers(data.users);
    } catch (error: any) {
      console.error("ADMIN USERS LOAD ERROR:", error);

      setUsersError(error?.message || "Unable to load users.");

      setManagedUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  /* =======================================================
     FETCH FACILITIES
  ======================================================= */

  const fetchFacilities = async () => {
    setFacilitiesLoading(true);
    setFacilitiesError(null);

    try {
      const response = await fetch("/api/facilities");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load facilities.");
      }

      const rows = Array.isArray(data.facilities) ? data.facilities : [];

      setFacilitiesList(rows.map(normalizeFacility));
    } catch (error: any) {
      console.error("FACILITIES LOAD ERROR:", error);

      setFacilitiesError(error?.message || "Unable to load facilities.");

      setFacilitiesList([]);
    } finally {
      setFacilitiesLoading(false);
    }
  };

  /* =======================================================
     FETCH SERVICES
  ======================================================= */

  const fetchServices = async () => {
    setServicesLoading(true);
    setServicesError(null);

    try {
      const response = await fetch("/api/services");

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load services.");
      }

      const rows = Array.isArray(data.services) ? data.services : [];

      setServicesList(rows.map(normalizeService));
    } catch (error: any) {
      console.error("SERVICES LOAD ERROR:", error);

      setServicesError(error?.message || "Unable to load services.");

      setServicesList([]);
    } finally {
      setServicesLoading(false);
    }
  };

  /* =======================================================
     INITIAL DATABASE LOAD
  ======================================================= */

  useEffect(() => {
    fetchUsers();
    fetchFacilities();
    fetchServices();
  }, []);

  /* =======================================================
     ROLE-BASED DROPDOWN OPTIONS

     IMPORTANT:
     There is NO fallback to all users.

     If database has no user with that role,
     dropdown will show "No matching users".
  ======================================================= */

  const nodalOptions = useMemo(() => {
    return managedUsers.filter((user) => hasDbRole(user, "nodal_officer"));
  }, [managedUsers]);

  const assocNodalOptions = useMemo(() => {
    return managedUsers.filter((user) =>
      hasDbRole(user, "associate_nodal_officer"),
    );
  }, [managedUsers]);

  const supervisorOptions = useMemo(() => {
    return managedUsers.filter((user) =>
      hasDbRole(user, "reporting_manager", "supervisor"),
    );
  }, [managedUsers]);

  const managerOptions = useMemo(() => {
    return managedUsers.filter((user) =>
      hasDbRole(user, "manager", "it_head", "administrator"),
    );
  }, [managedUsers]);

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();

    if (!search) {
      return managedUsers;
    }

    return managedUsers.filter((user) => {
      const roleText = getUserRoleNames(user).join(" ").toLowerCase();

      return (
        getDisplayName(user).toLowerCase().includes(search) ||
        String(user.email || "")
          .toLowerCase()
          .includes(search) ||
        String(user.designation || "")
          .toLowerCase()
          .includes(search) ||
        String(user.department || "")
          .toLowerCase()
          .includes(search) ||
        roleText.includes(search)
      );
    });
  }, [managedUsers, userSearch]);

  /* =======================================================
     SAVE USER ROLES
  ======================================================= */

  const handleSaveEditUser = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    try {
      const selectedRoleIds = Array.isArray(editingUser.roles)
        ? editingUser.roles.map((role) => Number(role.id))
        : [];

      /*
        Every account must retain User role.
      */

      const roleIds = Array.from(new Set([1, ...selectedRoleIds]));

      const response = await fetch(`/api/users/${editingUser.id}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update roles.");
      }

      await fetchUsers();

      setEditingUser(null);

      showToast(`Roles updated for ${getDisplayName(editingUser)}.`);
    } catch (error: any) {
      console.error("SAVE USER ERROR:", error);

      showToast(error?.message || "Unable to update user.");
    }
  };

  /* =======================================================
     DELETE USER
  ======================================================= */

  const handleDeleteUser = async (userId: string | number) => {
    const user = managedUsers.find(
      (item) => String(item.id) === String(userId),
    );

    if (!user) {
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete "${getDisplayName(user)}"?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(String(userId))}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete user.");
      }

      await fetchUsers();

      showToast("User deleted successfully.");
    } catch (error: any) {
      console.error("DELETE USER ERROR:", error);

      showToast(error?.message || "Unable to delete user.");
    }
  };

  /* =======================================================
     ADD FACILITY
     -------------------------------------------------------
     Department is deliberately NOT part of the UI.

     Backend compatibility:
     `dept` is sent with the existing/default value.
  ======================================================= */

  const handleAddFacility = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !newFacility.name.trim() ||
      !newFacility.nodal.trim() ||
      !newFacility.assocNodal.trim() ||
      !newFacility.supervisor.trim()
    ) {
      showToast("Please fill all required facility fields.");

      return;
    }

    try {
      const response = await fetch("/api/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFacility.name.trim(),

          /*
                Department hidden from UI.
                Keep backend compatible.
              */
          dept: "Research Laboratories Division",

          nodal: newFacility.nodal.trim(),

          assocNodal: newFacility.assocNodal.trim(),

          supervisor: newFacility.supervisor.trim(),

          desc: newFacility.desc.trim(),

          status: "active",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create facility.");
      }

      await fetchFacilities();

      setNewFacility({
        name: "",
        nodal: "",
        assocNodal: "",
        supervisor: "",
        desc: "",
      });

      setIsAddFacilityModalOpen(false);

      showToast("Facility added successfully.");
    } catch (error: any) {
      console.error("ADD FACILITY ERROR:", error);

      showToast(error?.message || "Unable to add facility.");
    }
  };

  /* =======================================================
     UPDATE FACILITY
  ======================================================= */

  const handleSaveEditFacility = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingFacility) {
      return;
    }

    try {
      const response = await fetch(
        `/api/facilities/${encodeURIComponent(editingFacility.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingFacility.name.trim(),

            /*
                Keep existing DB department value.
                User cannot edit it from UI.
              */
            dept: editingFacility.dept || "Research Laboratories Division",

            nodal: editingFacility.nodal.trim(),

            assocNodal: editingFacility.assocNodal.trim(),

            supervisor: editingFacility.supervisor.trim(),

            desc: editingFacility.desc.trim(),

            status: editingFacility.status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update facility.");
      }

      await fetchFacilities();

      setEditingFacility(null);

      showToast("Facility updated successfully.");
    } catch (error: any) {
      console.error("UPDATE FACILITY ERROR:", error);

      showToast(error?.message || "Unable to update facility.");
    }
  };

  /* =======================================================
     DELETE FACILITY
  ======================================================= */

  const handleDeleteFacility = async (id: string) => {
    const facility = facilitiesList.find((item) => item.id === id);

    if (!facility) {
      return;
    }

    if (
      !window.confirm(`Are you sure you want to delete "${facility.name}"?`)
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/facilities/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete facility.");
      }

      await fetchFacilities();

      showToast("Facility deleted successfully.");
    } catch (error: any) {
      console.error("DELETE FACILITY ERROR:", error);

      showToast(error?.message || "Unable to delete facility.");
    }
  };

  /* =======================================================
     TOGGLE FACILITY STATUS
  ======================================================= */

  const handleToggleFacilityStatus = async (facility: FacilityRecord) => {
    const nextStatus = facility.status === "active" ? "inactive" : "active";

    try {
      const response = await fetch(
        `/api/facilities/${encodeURIComponent(facility.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: facility.name,

            dept: facility.dept || "Research Laboratories Division",

            nodal: facility.nodal,

            assocNodal: facility.assocNodal,

            supervisor: facility.supervisor,

            desc: facility.desc,

            status: nextStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to change facility status.");
      }

      await fetchFacilities();

      showToast(`Facility status changed to ${nextStatus.toUpperCase()}.`);
    } catch (error: any) {
      console.error("FACILITY STATUS ERROR:", error);

      showToast(error?.message || "Unable to change status.");
    }
  };

  /* =======================================================
     ADD SERVICE
  ======================================================= */

  const handleAddService = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newService.name.trim() || !newService.manager.trim()) {
      showToast("Please fill all required service fields.");

      return;
    }

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newService.name.trim(),

          manager: newService.manager.trim(),

          quota: newService.quota.trim(),

          status: "active",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create service.");
      }

      await fetchServices();

      setNewService({
        name: "",
        manager: "",
        quota: "",
      });

      setIsAddServiceModalOpen(false);

      showToast("Service added successfully.");
    } catch (error: any) {
      console.error("ADD SERVICE ERROR:", error);

      showToast(error?.message || "Unable to add service.");
    }
  };

  /* =======================================================
     UPDATE SERVICE
  ======================================================= */

  const handleSaveEditService = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!editingService) {
      return;
    }

    try {
      const response = await fetch(
        `/api/services/${encodeURIComponent(editingService.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editingService.name.trim(),

            manager: editingService.manager.trim(),

            quota: editingService.quota.trim(),

            status: editingService.status,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update service.");
      }

      await fetchServices();

      setEditingService(null);

      showToast("Service updated successfully.");
    } catch (error: any) {
      console.error("UPDATE SERVICE ERROR:", error);

      showToast(error?.message || "Unable to update service.");
    }
  };

  /* =======================================================
     DELETE SERVICE
  ======================================================= */

  const handleDeleteService = async (id: string) => {
    const service = servicesList.find((item) => item.id === id);

    if (!service) {
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete service.");
      }

      await fetchServices();

      showToast("Service deleted successfully.");
    } catch (error: any) {
      console.error("DELETE SERVICE ERROR:", error);

      showToast(error?.message || "Unable to delete service.");
    }
  };

  /* =======================================================
     TOGGLE SERVICE STATUS
  ======================================================= */

  const handleToggleServiceStatus = async (service: ServiceRecord) => {
    const nextStatus = service.status === "active" ? "inactive" : "active";

    try {
      const response = await fetch(
        `/api/services/${encodeURIComponent(service.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: service.name,

            manager: service.manager,

            quota: service.quota,

            status: nextStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to change service status.");
      }

      await fetchServices();

      showToast(`Service status changed to ${nextStatus.toUpperCase()}.`);
    } catch (error: any) {
      console.error("SERVICE STATUS ERROR:", error);

      showToast(error?.message || "Unable to change status.");
    }
  };

  /* =======================================================
     FORCE APPROVE REQUISITION
  ======================================================= */

  const handleForceApprove = (req: RequisitionRecord) => {
    const updated: RequisitionRecord = {
      ...req,

      status: "approved_provisioned",

      history: [
        ...(req.history || []),
        {
          id: `act-${Date.now()}`,
          actorRole: "admin",
          actorName: "System Administrator",
          actionType: "tech_provision",
          comments: "FORCE APPROVED by System Admin Override.",
          timestamp: new Date().toISOString(),
          digitalSignature: "ADMIN_MASTER_BYPASS_SIG",
        },
      ],
    };

    onUpdateRequisition(updated);

    recordSecurityAuditLog({
      actorName: "System Administrator",

      actorEmail: "system@wii.gov.in",

      actorRole: "admin",

      actionType: "SECTION_HEAD_AUTHORIZATION",

      module: `Requisitions Override (${req.id})`,

      summary: `Administrative Override: Force Approved Requisition #${req.id}.`,
    });

    showToast(`Requisition #${req.id} approved.`);
  };

  /* =======================================================
     FORCE REJECT REQUISITION
  ======================================================= */

  const handleForceReject = (req: RequisitionRecord) => {
    const reason = window.prompt(
      "Enter Admin Rejection Reason:",
      "Administrative Override.",
    );

    if (!reason) {
      return;
    }

    const updated: RequisitionRecord = {
      ...req,

      status: "rejected",

      history: [
        ...(req.history || []),
        {
          id: `act-${Date.now()}`,
          actorRole: "admin",
          actorName: "System Administrator",
          actionType: "reject",
          comments: reason,
          timestamp: new Date().toISOString(),
          digitalSignature: "ADMIN_OVERRIDE_REJECT",
        },
      ],
    };

    onUpdateRequisition(updated);

    showToast(`Requisition #${req.id} rejected.`);
  };

  /* =======================================================
     SMALL REUSABLE DROPDOWN

     If there is no user with required DB role,
     dropdown stays empty.
  ======================================================= */

  const renderUserOptions = (users: AdminUser[], emptyText: string) => {
    if (users.length === 0) {
      return <option value="">{emptyText}</option>;
    }

    return users.map((user) => (
      <option key={user.id} value={getDisplayName(user)}>
        {getDisplayName(user)}
      </option>
    ));
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* =====================================================
          TOAST
      ===================================================== */}

      {toastMessage && (
        <div className="fixed top-5 right-5 z-[200] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />

          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              Access Management Portal
            </span>

            <span className="text-xs text-slate-400">
              • Wildlife Institute of India
            </span>
          </div>

          <h1 className="text-2xl font-extrabold">
            Central Governance & Master Data Control
          </h1>

          <p className="text-xs text-slate-300 mt-2">
            Complete administrative control over Users, Facilities, Services and
            system parameters.
          </p>
        </div>

        {/* QUICK STATISTICS */}

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 min-w-[260px] text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Total System Users</span>

            <b>{managedUsers.length}</b>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Facilities Master</span>

            <b className="text-emerald-300">{facilitiesList.length}</b>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Services Master</span>

            <b className="text-purple-300">{servicesList.length}</b>
          </div>
        </div>
      </div>

      {/* =====================================================
          ADMIN SUB NAVIGATION
      ===================================================== */}

      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          <button
            onClick={() => setActiveSubTab("users")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              activeSubTab === "users"
                ? "bg-purple-700 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            User Roles & Accounts ({managedUsers.length})
          </button>

          <button
            onClick={() => setActiveSubTab("masters")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              activeSubTab === "masters"
                ? "bg-purple-700 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Facilities & Services ({facilitiesList.length + servicesList.length}
            )
          </button>

          <button
            onClick={() => setActiveSubTab("requisitions_override")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              activeSubTab === "requisitions_override"
                ? "bg-purple-700 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Zap className="w-4 h-4" />
            Access Override
          </button>

          <button
            onClick={() => setActiveSubTab("system_config")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              activeSubTab === "system_config"
                ? "bg-purple-700 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Sliders className="w-4 h-4" />
            System Maintenance
          </button>

          <button
            onClick={() => setActiveSubTab("audit_logs")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              activeSubTab === "audit_logs"
                ? "bg-purple-700 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Activity className="w-4 h-4" />
            Security Audit
          </button>

          <button
            onClick={() => setActiveSubTab("database_schema")}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
              activeSubTab === "database_schema"
                ? "bg-purple-700 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Database className="w-4 h-4" />
            DB Schema
          </button>
        </div>
      </div>

      {/* =====================================================
          USERS TAB
      ===================================================== */}

      {activeSubTab === "users" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-5">
            <div>
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                User Roles & Account Master Directory
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Users displayed here come directly from the MySQL database.
              </p>
            </div>

            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />

              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user, email, role..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>
          </div>

          {usersLoading && (
            <div className="py-10 text-center text-sm text-slate-500">
              Loading users from database...
            </div>
          )}

          {usersError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
              {usersError}
            </div>
          )}

          {!usersLoading && !usersError && filteredUsers.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">
              No users found in database.
            </div>
          )}

          {!usersLoading && !usersError && filteredUsers.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3">User & Email</th>

                    <th className="p-3">Designation & Department</th>

                    <th className="p-3">Assigned Roles</th>

                    <th className="p-3">Status</th>

                    <th className="p-3">Intercom</th>

                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">
                          {getDisplayName(user)}
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {user.email || "—"}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold">
                          {user.designation || "—"}
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {user.department || "—"}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(user.roles) &&
                            user.roles.map((role) => (
                              <span
                                key={role.id}
                                className="px-2 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-bold"
                              >
                                {role.name}
                              </span>
                            ))}
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${
                            String(user.status).toLowerCase() === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {String(user.status || "inactive").toUpperCase()}
                        </span>
                      </td>

                      <td className="p-3 font-mono">
                        {user.intercomExtension || user.intercom || "—"}
                      </td>

                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Edit User Roles"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          FACILITIES + SERVICES MASTER
      ===================================================== */}

      {activeSubTab === "masters" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-8">
          {/* MASTER HEADER */}

          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Facilities & Services Master Directory
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                All records below are loaded directly from MySQL database.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAddFacilityModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold"
              >
                <PlusCircle className="w-4 h-4" />
                Add Facility
              </button>

              <button
                onClick={() => setIsAddServiceModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
              >
                <PlusCircle className="w-4 h-4" />
                Add Service
              </button>
            </div>
          </div>

          {/* =================================================
              FACILITIES
          ================================================= */}

          <section>
            <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-2 mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                Facilities Master Register
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-[10px]">
                  {facilitiesList.length} Total
                </span>
              </h3>

              <button
                onClick={fetchFacilities}
                className="text-xs text-purple-700 font-bold hover:underline"
              >
                Refresh
              </button>
            </div>

            {facilitiesLoading && (
              <div className="py-8 text-center text-xs text-slate-500">
                Loading facilities...
              </div>
            )}

            {facilitiesError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">
                {facilitiesError}
              </div>
            )}

            {!facilitiesLoading &&
              !facilitiesError &&
              facilitiesList.length === 0 && (
                <div className="py-10 text-center border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">
                  No facilities found in database.
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilitiesList.map((facility) => (
                <div
                  key={facility.id}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:border-purple-300 transition-all"
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        {facility.id}
                      </span>

                      <h3 className="font-bold text-slate-900 text-sm mt-2">
                        {facility.name}
                      </h3>
                    </div>

                    <span
                      className={`h-fit px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        facility.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : facility.status === "maintenance"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {facility.status}
                    </span>
                  </div>

                  {/* FACILITY INFORMATION */}

                  <div className="mt-3 text-xs text-slate-600 space-y-1.5">
                    <div>
                      <b>Nodal Officer:</b> {facility.nodal || "—"}
                    </div>

                    <div>
                      <b>Associate Nodal:</b> {facility.assocNodal || "—"}
                    </div>

                    <div>
                      <b>Supervisor:</b> {facility.supervisor || "—"}
                    </div>

                    {facility.desc && (
                      <div className="pt-1 text-slate-500">{facility.desc}</div>
                    )}
                  </div>

                  {/* ACTIONS */}

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => handleToggleFacilityStatus(facility)}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[11px] font-semibold"
                    >
                      Toggle Status
                    </button>

                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingFacility(facility)}
                        className="p-2 text-purple-700 hover:bg-purple-50 rounded"
                        title="Edit Facility"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteFacility(facility.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Delete Facility"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =================================================
              SERVICES
          ================================================= */}

          <section className="border-t border-slate-200 pt-6">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-2 mb-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                Services Master Directory
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px]">
                  {servicesList.length} Total
                </span>
              </h3>

              <button
                onClick={fetchServices}
                className="text-xs text-emerald-700 font-bold hover:underline"
              >
                Refresh
              </button>
            </div>

            {servicesLoading && (
              <div className="py-8 text-center text-xs text-slate-500">
                Loading services...
              </div>
            )}

            {servicesError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs mb-4">
                {servicesError}
              </div>
            )}

            {!servicesLoading &&
              !servicesError &&
              servicesList.length === 0 && (
                <div className="py-10 text-center border border-dashed border-slate-300 rounded-xl text-sm text-slate-500">
                  No services found in database.
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicesList.map((service) => (
                <div
                  key={service.id}
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:border-emerald-300 transition-all"
                >
                  <div className="flex justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {service.id}
                      </span>

                      <h3 className="font-bold text-slate-900 text-sm mt-2">
                        {service.name}
                      </h3>
                    </div>

                    <span
                      className={`h-fit px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        service.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 space-y-1.5">
                    <div>
                      <b>Manager:</b> {service.manager || "—"}
                    </div>

                    <div>
                      <b>Quota / Access:</b> {service.quota || "—"}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => handleToggleServiceStatus(service)}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[11px] font-semibold"
                    >
                      Toggle Status
                    </button>

                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingService(service)}
                        className="p-2 text-emerald-700 hover:bg-emerald-50 rounded"
                        title="Edit Service"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Delete Service"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================
          ACCESS OVERRIDE
      ===================================================== */}

      {activeSubTab === "requisitions_override" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-extrabold flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            Admin Master Approval Overrides
          </h2>

          <div className="space-y-3">
            {requisitions.map((req) => (
              <div
                key={req.id}
                className="border border-slate-200 rounded-xl p-4 flex flex-wrap justify-between items-center gap-4"
              >
                <div>
                  <b>#{req.id}</b>

                  <div className="text-xs text-slate-500 mt-1">
                    {req.applicant?.applicantName || "Applicant"}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Status: {req.status}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleForceApprove(req)}
                    disabled={req.status === "approved_provisioned"}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold disabled:bg-slate-300"
                  >
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    Approve
                  </button>

                  <button
                    onClick={() => handleForceReject(req)}
                    disabled={req.status === "rejected"}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold disabled:bg-slate-300"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================
          SYSTEM CONFIG
      ===================================================== */}

      {activeSubTab === "system_config" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-extrabold flex items-center gap-2 border-b border-slate-200 pb-3">
            <Sliders className="w-5 h-5 text-purple-600" />
            System Governance & Maintenance
          </h2>

          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex justify-between items-center">
                <b className="text-sm">Maintenance Mode</b>

                <button
                  onClick={() =>
                    setSystemConfig((current) => ({
                      ...current,
                      maintenanceMode: !current.maintenanceMode,
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    systemConfig.maintenanceMode
                      ? "bg-red-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {systemConfig.maintenanceMode ? "ENABLED" : "DISABLED"}
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                Maintenance mode can be used for system maintenance.
              </p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex justify-between items-center">
                <b className="text-sm">Emergency Approval</b>

                <button
                  onClick={() =>
                    setSystemConfig((current) => ({
                      ...current,
                      emergencyApprovalBypass: !current.emergencyApprovalBypass,
                    }))
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    systemConfig.emergencyApprovalBypass
                      ? "bg-amber-600 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {systemConfig.emergencyApprovalBypass ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SECURITY AUDIT
      ===================================================== */}

      {activeSubTab === "audit_logs" && (
        <SecurityAuditTrailSection managedUsers={managedUsers} />
      )}

      {/* =====================================================
          DATABASE SCHEMA
      ===================================================== */}

      {activeSubTab === "database_schema" && (
        <DatabaseSchemaSection
          managedUsersCount={managedUsers.length}
          facilitiesCount={facilitiesList.length}
          servicesCount={servicesList.length}
          requisitionsCount={requisitions.length}
        />
      )}

      {/* =====================================================
          EDIT USER ROLE MODAL
      ===================================================== */}

      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold">Edit User Roles</h3>

              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <b>{getDisplayName(editingUser)}</b>

                <div className="text-xs text-slate-500">
                  {editingUser.email || "—"}
                </div>
              </div>

              <div>
                <label className="font-bold text-xs">
                  Assigned System Roles
                </label>

                <div className="border border-slate-200 rounded-xl mt-2 p-3 space-y-1">
                  {SYSTEM_ROLES.map((role) => {
                    const assigned =
                      Array.isArray(editingUser.roles) &&
                      editingUser.roles.some((r) => Number(r.id) === role.id);

                    return (
                      <label
                        key={role.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={assigned}
                          disabled={role.id === 1}
                          onChange={(event) => {
                            const currentRoles = Array.isArray(
                              editingUser.roles,
                            )
                              ? editingUser.roles
                              : [];

                            if (event.target.checked) {
                              if (
                                currentRoles.some(
                                  (r) => Number(r.id) === role.id,
                                )
                              ) {
                                return;
                              }

                              setEditingUser({
                                ...editingUser,

                                roles: [...currentRoles, role],
                              });
                            } else {
                              setEditingUser({
                                ...editingUser,

                                roles: currentRoles.filter(
                                  (r) => Number(r.id) !== role.id,
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 accent-purple-700"
                        />

                        <span className="text-xs font-semibold">
                          {role.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold"
                >
                  Save Roles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD FACILITY MODAL
          -----------------------------------------------------
          DEPARTMENT REMOVED
      ===================================================== */}

      {isAddFacilityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                Add New Facility
              </h3>

              <button
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFacility} className="space-y-3 mt-4">
              {/* Facility Name */}

              <input
                required
                placeholder="Facility Name"
                value={newFacility.name}
                onChange={(e) =>
                  setNewFacility({
                    ...newFacility,
                    name: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

              {/* Nodal Officer */}

              <select
                required
                value={newFacility.nodal}
                onChange={(e) =>
                  setNewFacility({
                    ...newFacility,
                    nodal: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="">Select Nodal Officer</option>

                {renderUserOptions(nodalOptions, "No Nodal Officer available")}
              </select>

              {/* Associate Nodal Officer */}

              <select
                required
                value={newFacility.assocNodal}
                onChange={(e) =>
                  setNewFacility({
                    ...newFacility,
                    assocNodal: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="">Select Associate Nodal Officer</option>

                {renderUserOptions(
                  assocNodalOptions,
                  "No Associate Nodal Officer available",
                )}
              </select>

              {/* Supervisor */}

              <select
                required
                value={newFacility.supervisor}
                onChange={(e) =>
                  setNewFacility({
                    ...newFacility,
                    supervisor: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="">Select Supervisor</option>

                {renderUserOptions(
                  supervisorOptions,
                  "No Supervisor available",
                )}
              </select>

              {/* Description */}

              <textarea
                placeholder="Description"
                value={newFacility.desc}
                onChange={(e) =>
                  setNewFacility({
                    ...newFacility,
                    desc: e.target.value,
                  })
                }
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddFacilityModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD SERVICE MODAL
      ===================================================== */}

      {isAddServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                Add New Service
              </h3>

              <button
                onClick={() => setIsAddServiceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-3 mt-4">
              {/* Service Name */}

              <input
                required
                placeholder="Service Name"
                value={newService.name}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    name: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />

              {/* Manager */}

              <select
                required
                value={newService.manager}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    manager: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="">Select Manager</option>

                {renderUserOptions(managerOptions, "No Manager available")}
              </select>

              {/* Quota / Access */}

              <input
                placeholder="Quota / Access Specifications"
                value={newService.quota}
                onChange={(e) =>
                  setNewService({
                    ...newService,
                    quota: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT FACILITY MODAL
      ===================================================== */}

      {editingFacility && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold">Edit Facility</h3>

              <button
                onClick={() => setEditingFacility(null)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFacility} className="space-y-3 mt-4">
              <input
                required
                value={editingFacility.name}
                onChange={(e) =>
                  setEditingFacility({
                    ...editingFacility,
                    name: e.target.value,
                  })
                }
                placeholder="Facility Name"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />

              <select
                required
                value={editingFacility.nodal}
                onChange={(e) =>
                  setEditingFacility({
                    ...editingFacility,
                    nodal: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="">Select Nodal Officer</option>

                {renderUserOptions(nodalOptions, "No Nodal Officer available")}
              </select>

              <select
                required
                value={editingFacility.assocNodal}
                onChange={(e) =>
                  setEditingFacility({
                    ...editingFacility,
                    assocNodal: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="">Select Associate Nodal Officer</option>

                {renderUserOptions(
                  assocNodalOptions,
                  "No Associate Nodal Officer available",
                )}
              </select>

              <select
                required
                value={editingFacility.supervisor}
                onChange={(e) =>
                  setEditingFacility({
                    ...editingFacility,
                    supervisor: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="">Select Supervisor</option>

                {renderUserOptions(
                  supervisorOptions,
                  "No Supervisor available",
                )}
              </select>

              <textarea
                value={editingFacility.desc}
                onChange={(e) =>
                  setEditingFacility({
                    ...editingFacility,
                    desc: e.target.value,
                  })
                }
                placeholder="Description"
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-xl resize-none"
              />

              <select
                value={editingFacility.status}
                onChange={(e) =>
                  setEditingFacility({
                    ...editingFacility,
                    status: e.target.value as FacilityStatus,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="active">Active</option>

                <option value="inactive">Inactive</option>

                <option value="maintenance">Maintenance</option>
              </select>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingFacility(null)}
                  className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          EDIT SERVICE MODAL
      ===================================================== */}

      {editingService && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold">Edit Service</h3>

              <button
                onClick={() => setEditingService(null)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditService} className="space-y-3 mt-4">
              <input
                required
                value={editingService.name}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    name: e.target.value,
                  })
                }
                placeholder="Service Name"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />

              <select
                required
                value={editingService.manager}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    manager: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="">Select Manager</option>

                {renderUserOptions(managerOptions, "No Manager available")}
              </select>

              <input
                value={editingService.quota}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    quota: e.target.value,
                  })
                }
                placeholder="Quota / Access Specifications"
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />

              <select
                value={editingService.status}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    status: e.target.value as ServiceStatus,
                  })
                }
                className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
              >
                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </select>

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminControlPanel;
