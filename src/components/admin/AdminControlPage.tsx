import React, { useState, useEffect } from 'react';
import { FacilityMasterItem, ManagedUser, RequisitionRecord, ServiceMasterItem, UserRole } from '../../types/requisition';
import { INITIAL_MANAGED_USERS, OFFICIAL_ROLES } from '../../data/initialData';
import {
  getStoredFacilities,
  getStoredServices,
  saveFacilities,
  saveServices,
} from '../../utils/storage';
import { recordSecurityAuditLog } from '../../utils/auditLogger';
import { SecurityAuditTrailSection } from './SecurityAuditTrailSection';
import { DatabaseSchemaSection } from './DatabaseSchemaSection';
import {
  Shield,
  UserCheck,
  BadgeCheck,
  UserCog,
  Settings,
  Database,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Server,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Key,
  ShieldCheck,
  Zap,
  Globe,
  Sliders,
  Users,
  Building2,
  FlaskConical,
  Wrench,
} from 'lucide-react';

interface SuperAdminControlPanelProps {
  requisitions: RequisitionRecord[];
  onUpdateRequisition: (req: RequisitionRecord) => void;
  onRoleChange: (role: UserRole) => void;
}

export const SuperAdminControlPanel: React.FC<SuperAdminControlPanelProps> = ({
  requisitions,
  onUpdateRequisition,
  onRoleChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'users' | 'masters' | 'facilities' | 'labs' | 'services' | 'requisitions_override' | 'system_config' | 'audit_logs'
  >('users');

  // Managed Users State
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(() => {
    const saved = localStorage.getItem('wii_managed_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        return INITIAL_MANAGED_USERS;
      }
    }
    return INITIAL_MANAGED_USERS;
  });

  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  // Sync users from backend API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.users)) {
            setManagedUsers((prev) => {
              const map = new Map<string, ManagedUser>();
              INITIAL_MANAGED_USERS.forEach((u) => map.set(u.email.toLowerCase(), u));
              prev.forEach((u) => map.set(u.email.toLowerCase(), u));
              data.users.forEach((u: any) => {
                const existing = map.get(u.email?.toLowerCase());
                map.set(u.email.toLowerCase(), {
                  id: existing?.id || `USR-${u.id}`,
                  name: u.name || existing?.name || '',
                  email: u.email,
                  designation: u.designation || existing?.designation || '',
                  department: u.department || existing?.department || '',
                  role: (u.role as UserRole) || existing?.role || 'applicant',
                  intercom: u.intercom || existing?.intercom || '',
                  status: (u.status as 'active' | 'suspended') || existing?.status || 'active',
                  permissions: existing?.permissions || ['GENERIC_ACCESS'],
                  lastActive: u.lastActive || existing?.lastActive || 'Active',
                });
              });
              const combined = Array.from(map.values());
              localStorage.setItem('wii_managed_users', JSON.stringify(combined));
              return combined;
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch users from /api/users:', err);
      }
    };
    fetchUsers();
  }, []);

  // Facilities Master State (Synced with localStorage)
  const [facilitiesList, setFacilitiesList] = useState<FacilityMasterItem[]>(() => getStoredFacilities());
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState(false);
  const [newFacility, setNewFacility] = useState({ name: '', nodal: '', assocNodal: '', supervisor: '', dept: '', desc: '' });

  // Services Master State (Synced with localStorage)
  const [servicesList, setServicesList] = useState<ServiceMasterItem[]>(() => getStoredServices());
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newService, setNewService] = useState({ name: '', manager: '', quota: '' });

  // Listen to external updates if any
  useEffect(() => {
    const syncFromStorage = () => {
      setFacilitiesList(getStoredFacilities());
      setServicesList(getStoredServices());
    };
    window.addEventListener('wii_masters_updated', syncFromStorage);
    return () => window.removeEventListener('wii_masters_updated', syncFromStorage);
  }, []);

  // Masters Edit States
  const [editingFacility, setEditingFacility] = useState<FacilityMasterItem | null>(null);
  const [editingService, setEditingService] = useState<ServiceMasterItem | null>(null);

  // Role-filtered lists for Facility & Service Master dropdowns
  const nodalOfficersList = managedUsers.filter((u) => u.role === 'lab_nodal');
  const nodalOptions = nodalOfficersList.length > 0 ? nodalOfficersList : managedUsers;

  const assocNodalOfficersList = managedUsers.filter((u) => u.role === 'assoc_lab_nodal');
  const assocNodalOptions = assocNodalOfficersList.length > 0 ? assocNodalOfficersList : managedUsers;

  const supervisorOfficersList = managedUsers.filter((u) => u.role === 'supervisor' || u.role === 'hrms_officer');
  const supervisorOptions = supervisorOfficersList.length > 0 ? supervisorOfficersList : managedUsers;

  const managerOfficersList = managedUsers.filter((u) => u.role === 'section_head' || u.role === 'it_officer' || u.role === 'admin');
  const managerOptions = managerOfficersList.length > 0 ? managerOfficersList : managedUsers;

  // System Master Config State
  const [systemConfig, setSystemConfig] = useState({
    maintenanceMode: false,
    autoApproveEmail: true,
    maxWifiDevicesPerUser: 3,
    biometricSyncIntervalMinutes: 15,
    labSlotMaxDaysAhead: 30,
    emergencyApprovalBypass: false,
    requirePiApprovalFirst: true,
    portalVersion: '3.2.0-STABLE',
    lastBackupTimestamp: '2026-08-08 08:30 IST',
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveUsersToStorage = (users: ManagedUser[]) => {
    setManagedUsers(users);
    localStorage.setItem('wii_managed_users', JSON.stringify(users));
  };

  const saveFacilitiesToStorage = (facs: FacilityMasterItem[]) => {
    setFacilitiesList(facs);
    saveFacilities(facs);
  };

  const saveServicesToStorage = (srvs: ServiceMasterItem[]) => {
    setServicesList(srvs);
    saveServices(srvs);
  };

  // Handle Changing User Role
  const handleRoleChangeUser = (userId: string, newRole: UserRole) => {
    const updated = managedUsers.map((u) => {
      if (u.id === userId) {
        return { ...u, role: newRole };
      }
      return u;
    });
    saveUsersToStorage(updated);
    showToast(`Role updated successfully for User ${userId} -> ${newRole.toUpperCase()}`);
  };

  // Handle Delete System User
  const handleDeleteUser = (userId: string) => {
    const userToDelete = managedUsers.find((u) => u.id === userId);
    if (!userToDelete) return;
    if (confirm(`Are you sure you want to delete master record for "${userToDelete.name}" (${userToDelete.email})?`)) {
      const updated = managedUsers.filter((u) => u.id !== userId);
      saveUsersToStorage(updated);
      showToast(`Master Record deleted for ${userToDelete.name}`);
    }
  };

  // Handle Editing User Details
  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const oldUser = managedUsers.find((u) => u.id === editingUser.id);
    const updated = managedUsers.map((u) => (u.id === editingUser.id ? editingUser : u));
    saveUsersToStorage(updated);

    recordSecurityAuditLog({
      actorName: 'Dr. Virendra Kumar',
      actorEmail: 'virendrakumar@wii.gov.in',
      actorRole: 'admin',
      actionType: 'ROLE_CHANGE',
      module: `Master User Roles (${editingUser.name})`,
      summary: `Updated Master User details for ${editingUser.name}. System Role set to ${editingUser.role}.`,
      details: {
        previousValue: `Role: ${oldUser?.role || 'N/A'}, Intercom: ${oldUser?.intercom || 'N/A'}`,
        newValue: `Role: ${editingUser.role}, Intercom: ${editingUser.intercom}`,
        targetEntity: `User Record ${editingUser.id}`,
      },
    });

    setEditingUser(null);
    showToast(`Master Record updated for ${editingUser.name}`);
  };

  // Facility Edit & Delete handlers
  const handleSaveEditFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFacility) return;
    const oldFac = facilitiesList.find((f) => f.id === editingFacility.id);
    const updated = facilitiesList.map((f) => (f.id === editingFacility.id ? editingFacility : f));
    saveFacilitiesToStorage(updated);

    recordSecurityAuditLog({
      actorName: 'Dr. Virendra Kumar',
      actorEmail: 'virendrakumar@wii.gov.in',
      actorRole: 'admin',
      actionType: 'FACILITY_MASTER_EDIT',
      module: `Facility Master (${editingFacility.name})`,
      summary: `Updated Facility Master details for "${editingFacility.name}". Nodal: ${editingFacility.nodal}.`,
      details: {
        previousValue: `Nodal: ${oldFac?.nodal || 'N/A'}, Status: ${oldFac?.status || 'N/A'}`,
        newValue: `Nodal: ${editingFacility.nodal}, Status: ${editingFacility.status}`,
        targetEntity: `Facility ${editingFacility.id}`,
      },
    });

    showToast(`Facility Master updated & saved: ${editingFacility.name}`);
    setEditingFacility(null);
  };

  const handleDeleteFacility = (id: string) => {
    const fac = facilitiesList.find((f) => f.id === id);
    if (!fac) return;
    if (confirm(`Are you sure you want to delete Facility "${fac.name}" (${fac.id})?`)) {
      const updated = facilitiesList.filter((f) => f.id !== id);
      saveFacilitiesToStorage(updated);

      recordSecurityAuditLog({
        actorName: 'Dr. Virendra Kumar',
        actorEmail: 'virendrakumar@wii.gov.in',
        actorRole: 'admin',
        actionType: 'FACILITY_MASTER_EDIT',
        module: `Facility Master (${fac.name})`,
        summary: `Deleted Facility Master entry "${fac.name}" (${id}).`,
      });

      showToast(`Facility deleted: ${fac.name}`);
    }
  };

  // Service Edit & Delete handlers
  const handleSaveEditService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    const updated = servicesList.map((s) => (s.id === editingService.id ? editingService : s));
    saveServicesToStorage(updated);

    recordSecurityAuditLog({
      actorName: 'Dr. Virendra Kumar',
      actorEmail: 'virendrakumar@wii.gov.in',
      actorRole: 'admin',
      actionType: 'SERVICE_MASTER_EDIT',
      module: `Service Master (${editingService.name})`,
      summary: `Updated Service Master details for "${editingService.name}". Quota: ${editingService.quota}.`,
    });

    showToast(`Service Master updated & saved: ${editingService.name}`);
    setEditingService(null);
  };

  const handleDeleteService = (id: string) => {
    const srv = servicesList.find((s) => s.id === id);
    if (!srv) return;
    if (confirm(`Are you sure you want to delete Service "${srv.name}" (${srv.id})?`)) {
      const updated = servicesList.filter((s) => s.id !== id);
      saveServicesToStorage(updated);

      recordSecurityAuditLog({
        actorName: 'Dr. Virendra Kumar',
        actorEmail: 'virendrakumar@wii.gov.in',
        actorRole: 'admin',
        actionType: 'SERVICE_MASTER_EDIT',
        module: `Service Master (${srv.name})`,
        summary: `Deleted Service Master entry "${srv.name}" (${id}).`,
      });

      showToast(`Service deleted: ${srv.name}`);
    }
  };

  // Handle Toggle Account Status
  const handleToggleStatus = (userId: string) => {
    let targetUser: ManagedUser | undefined;
    const updated = managedUsers.map((u) => {
      if (u.id === userId) {
        targetUser = u;
        const nextStatus = u.status === 'active' ? 'suspended' : 'active';
        return { ...u, status: nextStatus as 'active' | 'suspended' };
      }
      return u;
    });
    saveUsersToStorage(updated);

    if (targetUser) {
      const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
      recordSecurityAuditLog({
        actorName: 'Dr. Virendra Kumar',
        actorEmail: 'virendrakumar@wii.gov.in',
        actorRole: 'admin',
        actionType: 'USER_STATUS_TOGGLE',
        module: `Master User Roles (${targetUser.name})`,
        summary: `Toggled Master Account status for ${targetUser.name} to ${newStatus.toUpperCase()}.`,
        details: {
          previousValue: `Status: ${targetUser.status}`,
          newValue: `Status: ${newStatus}`,
          targetEntity: `User Record ${targetUser.id}`,
        },
      });
    }

    showToast(`User status toggled successfully.`);
  };

  // Admin Force Approve Requisition
  const handleForceApprove = (req: RequisitionRecord) => {
    const updated: RequisitionRecord = {
      ...req,
      status: 'approved_provisioned',
      history: [
        ...(req.history || []),
        {
          id: `act-${Date.now()}`,
          actorRole: 'admin',
          actorName: 'Director General / Admin',
          actionType: 'tech_provision',
          comments: 'FORCE APPROVED by System Admin Override.',
          timestamp: new Date().toISOString(),
          digitalSignature: 'ADMIN_MASTER_BYPASS_SIG',
        },
      ],
    };
    onUpdateRequisition(updated);

    recordSecurityAuditLog({
      actorName: 'Dr. Virendra Kumar',
      actorEmail: 'virendrakumar@wii.gov.in',
      actorRole: 'admin',
      actionType: 'SECTION_HEAD_AUTHORIZATION',
      module: `Requisitions Override (${req.id})`,
      summary: `Administrative Override: Force Approved & Provisioned Requisition #${req.id} for ${req.applicant.applicantName}.`,
      details: {
        previousValue: `Status: ${req.status}`,
        newValue: 'Status: approved_provisioned',
        targetEntity: `Requisition ${req.id}`,
        digitalSignature: 'ADMIN_MASTER_BYPASS_SIG',
      },
    });

    showToast(`Requisition #${req.id} Force Approved & Provisioned by Admin.`);
  };

  // Admin Force Reject Requisition
  const handleForceReject = (req: RequisitionRecord) => {
    const reason = prompt('Enter Admin Rejection Reason:', 'Administrative Override by Directorate Order.');
    if (!reason) return;
    const updated: RequisitionRecord = {
      ...req,
      status: 'rejected',
      history: [
        ...(req.history || []),
        {
          id: `act-${Date.now()}`,
          actorRole: 'admin',
          actorName: 'Director General / Admin',
          actionType: 'reject',
          comments: `FORCE REJECTED by Admin: ${reason}`,
          timestamp: new Date().toISOString(),
          digitalSignature: 'ADMIN_OVERRIDE_REJECT',
        },
      ],
    };
    onUpdateRequisition(updated);

    recordSecurityAuditLog({
      actorName: 'Dr. Virendra Kumar',
      actorEmail: 'virendrakumar@wii.gov.in',
      actorRole: 'admin',
      actionType: 'PI_REJECTION',
      module: `Requisitions Override (${req.id})`,
      summary: `Administrative Override: Force Rejected Requisition #${req.id}. Reason: ${reason}`,
      details: {
        previousValue: `Status: ${req.status}`,
        newValue: 'Status: rejected',
        targetEntity: `Requisition ${req.id}`,
        comments: reason,
      },
    });

    showToast(`Requisition #${req.id} Force Rejected.`);
  };


  const filteredUsers = managedUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-bounce">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 min-h-[140px]">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 pointer-events-none blur-2xl" />
        <div className="space-y-1.5 max-w-2xl min-w-0 flex-1 z-10 relative">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1 shrink-0">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Access Management Portal
            </span>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">• Wildlife Institute of India</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug sm:leading-tight break-words">
            Central Governance & Master Data Control
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl block">
            Complete administrative control over User Roles & Accounts, Facilities Master, Services Master, system parameters, and emergency overrides.
          </p>
        </div>

        {/* Quick System Status Badges */}
        <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-xl text-xs space-y-1.5 w-full sm:w-auto min-w-0 sm:min-w-[280px] shadow-xs relative z-10 shrink-0">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-medium text-slate-400">Total System Users:</span>
            <span className="font-extrabold text-white text-xs">{managedUsers.length}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-medium text-slate-400">Facilities Master:</span>
            <span className="font-extrabold text-emerald-300 text-xs">{facilitiesList.length}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-medium text-slate-400">Services Master:</span>
            <span className="font-extrabold text-purple-300 text-xs">{servicesList.length}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-700">
            <span className="font-medium text-slate-400">Maintenance Mode:</span>
            <span
              className={`font-bold text-[10px] px-2 py-0.5 rounded ${
                systemConfig.maintenanceMode
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {systemConfig.maintenanceMode ? 'ENABLED' : 'NORMAL OPERATIONAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs (Strict Order: 1. Users, 2. Facilities, Labs & Services Master, 3. Override, 4. Config, 5. Audit) */}
      <div className="relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1.5 shadow-xs overflow-hidden">
        {/* Subtle Mobile Scroll Right Indicator Overlay */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent sm:hidden z-10" />

        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pr-10 sm:pr-1.5 touch-pan-x">
          {/* 1. User Roles & Accounts */}
          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">1. Users ({managedUsers.length})</span>
            <span className="hidden sm:inline">1. User Roles & Accounts ({managedUsers.length})</span>
          </button>

          {/* 2. Facilities, Labs & Services Master */}
          <button
            onClick={() => setActiveSubTab('masters')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'masters' || activeSubTab === 'facilities' || activeSubTab === 'labs' || activeSubTab === 'services'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">2. Facilities ({facilitiesList.length + servicesList.length})</span>
            <span className="hidden sm:inline">2. Facilities & Services Master ({facilitiesList.length + servicesList.length})</span>
          </button>

          {/* 3. Master Requisitions Override */}
          <button
            onClick={() => setActiveSubTab('requisitions_override')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'requisitions_override'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">3. Override ({requisitions.length})</span>
            <span className="hidden sm:inline">3. Access Override ({requisitions.length})</span>
          </button>

          {/* 4. System Maintenance & Parameters */}
          <button
            onClick={() => setActiveSubTab('system_config')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'system_config'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">4. Config</span>
            <span className="hidden sm:inline">4. System Maintenance</span>
          </button>

          {/* 5. Global Security Audit Trail */}
          <button
            onClick={() => setActiveSubTab('audit_logs')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'audit_logs'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">5. Audit Log</span>
            <span className="hidden sm:inline">5. Security Audit Trail</span>
          </button>

          {/* 6. Database Schema (9 Tables) */}
          <button
            onClick={() => setActiveSubTab('database_schema')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'database_schema'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">6. Schema (9)</span>
            <span className="hidden sm:inline">6. DB Schema (9 Tables)</span>
          </button>
        </div>
      </div>

      {/* ==================== SUB-TAB 1: USER ROLES & ACCOUNTS ==================== */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-purple-600" />
                User Roles & Account Master Directory
              </h2>
              <p className="text-xs text-slate-500">
                Official designations, assigned system authority roles, and access statuses for all personnel.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user, email, designation, role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Mobile Card List (< sm) */}
          <div className="block sm:hidden space-y-3">
            {filteredUsers.map((user) => {
              const roleObj = OFFICIAL_ROLES.find((r) => r.id === user.role);
              const roleTitleMap: Record<string, string> = {
                applicant: 'User',
                supervisor: 'Reporting Manager / Supervisor (PI)',
                lab_nodal: 'Nodal Officer',
                assoc_lab_nodal: 'Associate Nodal Officer',
                it_officer: 'IT Head',
                section_head: 'Manager',
                hrms_officer: 'Lab Supervisor',
                admin: 'Admin',
              };
              const roleBadgeColorMap: Record<string, string> = {
                admin: 'bg-purple-100 text-purple-900 border-purple-300',
                applicant: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                supervisor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                it_officer: 'bg-blue-50 text-blue-800 border-blue-200',
                section_head: 'bg-cyan-50 text-cyan-800 border-cyan-200',
                hrms_officer: 'bg-purple-50 text-purple-800 border-purple-200',
                lab_nodal: 'bg-amber-50 text-amber-800 border-amber-200',
                assoc_lab_nodal: 'bg-orange-50 text-orange-800 border-orange-200',
              };
              const displayTitle = roleTitleMap[user.role] || roleObj?.title || user.role || 'User';
              const colorClass = roleBadgeColorMap[user.role] || 'bg-slate-100 text-slate-800 border-slate-200';

              const displayName = user.name?.trim() ? user.name : '—';
              const displayEmail = user.email?.trim() ? user.email : '—';
              const displayDesignation = user.designation?.trim() ? user.designation : '—';
              const displayDept = user.department?.trim() ? user.department : '—';
              const displayIntercom = user.intercom?.trim() ? user.intercom : '—';

              return (
                <div key={user.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full ${
                          roleObj?.avatarColor || 'bg-slate-700'
                        } text-white font-bold flex items-center justify-center shrink-0 text-sm`}
                      >
                        {displayName !== '—' ? displayName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{displayName}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">{displayEmail}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 transition-all cursor-pointer ${
                        user.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {user.status || 'ACTIVE'}
                    </button>
                  </div>

                  <div className="text-[11px] space-y-1 bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <div>
                      <span className="font-semibold text-slate-500">Designation:</span>{' '}
                      <span className="font-bold text-slate-800">{displayDesignation}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Department:</span>{' '}
                      <span className="text-slate-700">{displayDept}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Intercom:</span>{' '}
                      <span className="font-mono text-slate-700">{displayIntercom}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-2xs ${colorClass}`}>
                      {displayTitle}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1.5 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Edit Master Record"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Delete Master Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (≥ sm) */}
          <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-xl relative">
            <table className="w-full min-w-[650px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Designation & Dept</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Intercom</th>
                  <th className="p-3 text-right sticky right-0 bg-slate-50 z-10 border-l border-slate-200/80 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.05)]">Master Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const roleObj = OFFICIAL_ROLES.find((r) => r.id === user.role);
                  const roleTitleMap: Record<string, string> = {
                    applicant: 'User',
                    supervisor: 'Reporting Manager / Supervisor (PI)',
                    lab_nodal: 'Nodal Officer',
                    assoc_lab_nodal: 'Associate Nodal Officer',
                    it_officer: 'IT Head',
                    section_head: 'Manager',
                    hrms_officer: 'Lab Supervisor',
                    admin: 'Admin',
                  };
                  const roleBadgeColorMap: Record<string, string> = {
                    admin: 'bg-purple-100 text-purple-900 border-purple-300',
                    applicant: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    supervisor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                    it_officer: 'bg-blue-50 text-blue-800 border-blue-200',
                    section_head: 'bg-cyan-50 text-cyan-800 border-cyan-200',
                    hrms_officer: 'bg-purple-50 text-purple-800 border-purple-200',
                    lab_nodal: 'bg-amber-50 text-amber-800 border-amber-200',
                    assoc_lab_nodal: 'bg-orange-50 text-orange-800 border-orange-200',
                  };

                  const displayTitle = roleTitleMap[user.role] || roleObj?.title || user.role || 'User';
                  const colorClass = roleBadgeColorMap[user.role] || 'bg-slate-100 text-slate-800 border-slate-200';

                  const displayName = user.name?.trim() ? user.name : '—';
                  const displayEmail = user.email?.trim() ? user.email : '—';
                  const displayDesignation = user.designation?.trim() ? user.designation : '—';
                  const displayDept = user.department?.trim() ? user.department : '—';
                  const displayIntercom = user.intercom?.trim() ? user.intercom : '—';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full ${
                              roleObj?.avatarColor || 'bg-slate-700'
                            } text-white font-bold flex items-center justify-center shrink-0`}
                          >
                            {displayName !== '—' ? displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{displayName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{displayEmail}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 max-w-[220px]">
                        <div className="font-semibold text-slate-800">{displayDesignation}</div>
                        <div className="text-[11px] text-slate-500 truncate" title={displayDept}>
                          {displayDept}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-lg border shadow-2xs ${colorClass}`}>
                          {displayTitle}
                        </span>
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {user.status || 'ACTIVE'}
                        </button>
                      </td>

                      <td className="p-3 font-mono text-slate-600">{displayIntercom}</td>

                      <td className="p-3 text-right sticky right-0 bg-white z-10 border-l border-slate-200/80 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Master Record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Master Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: INTEGRATED FACILITIES & SERVICES MASTER ==================== */}
      {(activeSubTab === 'masters' || activeSubTab === 'facilities' || activeSubTab === 'labs' || activeSubTab === 'services') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Facilities & Services Master Directory
              </h2>
              <p className="text-xs text-slate-500">
                Central management directory for official research facilities, nodal officers, supervisors, and institutional services.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsAddFacilityModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Facility
              </button>
              <button
                onClick={() => setIsAddServiceModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Service
              </button>
            </div>
          </div>

          {/* SECTION 1: FACILITIES MASTER */}
          <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  Facilities Master Register
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {facilitiesList.length} Total
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {facilitiesList.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:border-purple-300 transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                          {fac.id}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 mt-1">{fac.name}</h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                          fac.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {fac.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="font-semibold text-slate-700">Nodal Officer:</span> {fac.nodal}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Associate Nodal Officer:</span> {fac.assocNodal}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Supervisor:</span> {fac.supervisor}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const updated = facilitiesList.map((f) => (f.id === fac.id ? { ...f, status: f.status === 'active' ? ('inactive' as const) : ('active' as const) } : f));
                          saveFacilitiesToStorage(updated);
                          showToast(`Facility status updated for ${fac.name}`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 rounded text-slate-700 cursor-pointer"
                      >
                        Toggle Status
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingFacility(fac)}
                          className="px-2 py-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 flex items-center gap-1 cursor-pointer"
                          title="Edit Facility"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFacility(fac.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Facility"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: SERVICES MASTER */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  Services Master Directory
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full">
                    {servicesList.length} Total
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servicesList.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white hover:border-emerald-300 transition-all space-y-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {srv.id}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 mt-1">{srv.name}</h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                          srv.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {srv.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="font-semibold text-slate-700">Manager:</span> {srv.manager}
                      </div>
                      {srv.quota && (
                        <div>
                          <span className="font-semibold text-slate-700">Quota / Specs:</span> {srv.quota}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const updated = servicesList.map((s) => (s.id === srv.id ? { ...s, status: s.status === 'active' ? ('inactive' as const) : ('active' as const) } : s));
                          saveServicesToStorage(updated);
                          showToast(`Service status updated for ${srv.name}`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 rounded text-slate-700 cursor-pointer"
                      >
                        Toggle Status
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingService(srv)}
                          className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 flex items-center gap-1 cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </div>
      )}

      {/* ==================== SUB-TAB 5: REQUISITIONS OVERRIDE ==================== */}
      {activeSubTab === 'requisitions_override' && (
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-6 shadow-xs space-y-4 min-w-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3 min-w-0">
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2 min-w-0">
                <Zap className="w-5 h-5 text-purple-600 shrink-0" />
                <span className="truncate">Admin Master Approval Overrides</span>
              </h2>
              <p className="text-xs text-slate-500">
                Directly force-approve, force-reject, or modify any submitted access request regardless of its current workflow stage.
              </p>
            </div>
          </div>

          <div className="space-y-3 min-w-0">
            {requisitions.map((req, idx) => (
              <div
                key={`${req.id}-${idx}`}
                className="p-3.5 sm:p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0 overflow-hidden"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-extrabold text-slate-900 text-xs shrink-0">#{req.id}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded shrink-0">{req.type}</span>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded uppercase break-all max-w-full">
                      Status: {req.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate">{req.applicant.applicantName}</div>
                  <div className="text-[11px] text-slate-500 break-words leading-relaxed">
                    Dept: {req.applicant.departmentCellProject} • PI: {req.applicant.supervisingOfficerName}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/80 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleForceApprove(req)}
                    disabled={req.status === 'approved_provisioned'}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      req.status === 'approved_provisioned'
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Force Approve
                  </button>

                  <button
                    onClick={() => handleForceReject(req)}
                    disabled={req.status === 'rejected'}
                    className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      req.status === 'rejected'
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    Force Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 6: SYSTEM MAINTENANCE ==================== */}
      {activeSubTab === 'system_config' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-purple-600" />
            System Governance & Maintenance Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Maintenance Mode Card */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Maintenance Mode Switch</span>
                <button
                  onClick={() => {
                    setSystemConfig({ ...systemConfig, maintenanceMode: !systemConfig.maintenanceMode });
                    showToast(`Maintenance mode toggled.`);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    systemConfig.maintenanceMode ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {systemConfig.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
              <p className="text-slate-500 text-[11px]">
                When enabled, non-admin users will see a system maintenance alert notice.
              </p>
            </div>

            {/* Emergency Approval Bypass */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">Emergency Approval Fast-Track</span>
                <button
                  onClick={() => {
                    setSystemConfig({ ...systemConfig, emergencyApprovalBypass: !systemConfig.emergencyApprovalBypass });
                    showToast(`Emergency bypass toggled.`);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    systemConfig.emergencyApprovalBypass ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {systemConfig.emergencyApprovalBypass ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>
              <p className="text-slate-500 text-[11px]">
                Allows urgent requisitions to auto-bypass step 1 PI review during field expeditions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 5: SECURITY AUDIT TRAIL ==================== */}
      {activeSubTab === 'audit_logs' && (
        <SecurityAuditTrailSection managedUsers={managedUsers} />
      )}

      {/* ==================== SUB-TAB 6: DATABASE SCHEMA (9 TABLES) ==================== */}
      {activeSubTab === 'database_schema' && (
        <DatabaseSchemaSection
          managedUsersCount={managedUsers.length}
          facilitiesCount={facilitiesList.length}
          servicesCount={servicesList.length}
          requisitionsCount={requisitions.length}
        />
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden min-w-0">
            <div className="flex justify-between items-center border-b pb-3 shrink-0 min-w-0">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2 truncate">
                <Edit3 className="w-4 h-4 text-purple-600 shrink-0" />
                Edit Master User Record
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer shrink-0">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs overflow-y-auto flex-1 min-h-0 min-w-0 pt-2">
              {/* User Identity Info Card (Read-Only) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-extrabold text-slate-900 text-xs">{editingUser.name}</div>
                <div className="font-mono text-[11px] text-purple-700 font-semibold">{editingUser.email}</div>
                <div className="text-[11px] text-slate-600">{editingUser.designation}</div>
                <div className="text-[11px] text-slate-500 font-medium">{editingUser.department}</div>
              </div>

              {/* Editable Field 1: System Role */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">System Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full p-2.5 border border-purple-300 rounded-xl font-bold text-xs bg-purple-50 text-purple-900 cursor-pointer focus:ring-2 focus:ring-purple-500"
                >
                  <option value="applicant">User</option>
                  <option value="supervisor">Reporting Manager / Supervisor (PI)</option>
                  <option value="lab_nodal">Nodal Officer</option>
                  <option value="assoc_lab_nodal">Associate Nodal Officer</option>
                  <option value="it_officer">IT Head</option>
                  <option value="section_head">Manager</option>
                  <option value="hrms_officer">Lab Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Editable Field 2: Intercom Number */}
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">Intercom Extension Number</label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={editingUser.intercom || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, intercom: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 text-white rounded-lg font-bold shadow-xs hover:bg-purple-800 cursor-pointer"
                >
                  Save Master User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD FACILITY MODAL */}
      {isAddFacilityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden min-w-0">
            <div className="flex justify-between items-center border-b pb-3 shrink-0 min-w-0">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                Add New Facility Master
              </h3>
              <button
                onClick={() => setIsAddFacilityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newFacility.name) return;
                const id = `FAC-0${facilitiesList.length + 1}`;
                const updated = [
                  ...facilitiesList,
                  {
                    id,
                    name: newFacility.name,
                    nodal: newFacility.nodal || 'Dr. S. K. Gupta',
                    assocNodal: newFacility.assocNodal || 'Dr. Neha Verma',
                    supervisor: newFacility.supervisor || 'Er. Vikas Mehta',
                    dept: newFacility.dept || 'Research Cell',
                    desc: newFacility.desc || 'Research equipment & instrument access',
                    status: 'active' as const,
                  },
                ];
                saveFacilitiesToStorage(updated);
                setIsAddFacilityModalOpen(false);
                setNewFacility({ name: '', nodal: '', assocNodal: '', supervisor: '', dept: '', desc: '' });
                showToast(`New facility added: ${newFacility.name}`);
              }}
              className="space-y-3 text-xs overflow-y-auto flex-1 min-h-0 min-w-0 pt-2"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wildlife Genetics & Genomics Facility"
                  value={newFacility.name}
                  onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nodal Officer</label>
                <select
                  required
                  value={newFacility.nodal}
                  onChange={(e) => setNewFacility({ ...newFacility, nodal: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">-- Select Nodal Officer --</option>
                  {nodalOptions.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.designation || u.email})
                    </option>
                  ))}
                  {newFacility.nodal && !nodalOptions.some((u) => u.name === newFacility.nodal) && (
                    <option value={newFacility.nodal}>{newFacility.nodal}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Associate Nodal Officer</label>
                <select
                  required
                  value={newFacility.assocNodal}
                  onChange={(e) => setNewFacility({ ...newFacility, assocNodal: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">-- Select Associate Nodal Officer --</option>
                  {assocNodalOptions.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.designation || u.email})
                    </option>
                  ))}
                  {newFacility.assocNodal && !assocNodalOptions.some((u) => u.name === newFacility.assocNodal) && (
                    <option value={newFacility.assocNodal}>{newFacility.assocNodal}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supervisor</label>
                <select
                  required
                  value={newFacility.supervisor}
                  onChange={(e) => setNewFacility({ ...newFacility, supervisor: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">-- Select Supervisor --</option>
                  {supervisorOptions.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.designation || u.email})
                    </option>
                  ))}
                  {newFacility.supervisor && !supervisorOptions.some((u) => u.name === newFacility.supervisor) && (
                    <option value={newFacility.supervisor}>{newFacility.supervisor}</option>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddFacilityModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 text-white rounded-xl font-bold shadow-xs hover:bg-purple-800 cursor-pointer"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden min-w-0">
            <div className="flex justify-between items-center border-b pb-3 shrink-0 min-w-0">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2 truncate">
                <Wrench className="w-4 h-4 text-emerald-600 shrink-0" />
                Add New Service Master
              </h3>
              <button
                onClick={() => setIsAddServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newService.name) return;
                const id = `SRV-0${servicesList.length + 1}`;
                const updated = [
                  ...servicesList,
                  {
                    id,
                    name: newService.name,
                    manager: newService.manager || 'Mr. Dinesh Singh Pundir',
                    quota: newService.quota || 'Standard Quota',
                    status: 'active' as const,
                  },
                ];
                saveServicesToStorage(updated);
                setIsAddServiceModalOpen(false);
                setNewService({ name: '', manager: '', quota: '' });
                showToast(`New service added: ${newService.name}`);
              }}
              className="space-y-3 text-xs overflow-y-auto flex-1 min-h-0 min-w-0 pt-2"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Institutional Webmail (@wii.gov.in)"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Manager</label>
                <select
                  required
                  value={newService.manager}
                  onChange={(e) => setNewService({ ...newService, manager: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- Select Manager --</option>
                  {managerOptions.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.designation || u.email})
                    </option>
                  ))}
                  {newService.manager && !managerOptions.some((u) => u.name === newService.manager) && (
                    <option value={newService.manager}>{newService.manager}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quota / Access Specs</label>
                <input
                  type="text"
                  placeholder="e.g. 10 GB / user or Slot Basis"
                  value={newService.quota}
                  onChange={(e) => setNewService({ ...newService, quota: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold shadow-xs hover:bg-emerald-800 cursor-pointer"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FACILITY MODAL */}
      {editingFacility && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden min-w-0">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg font-mono text-xs font-bold shrink-0">
                  {editingFacility.id}
                </div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">Edit Facility Master</h3>
              </div>
              <button
                onClick={() => setEditingFacility(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditFacility} className="space-y-3 text-xs overflow-y-auto flex-1 min-h-0 min-w-0 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={editingFacility.name}
                  onChange={(e) => setEditingFacility({ ...editingFacility, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nodal Officer</label>
                <select
                  required
                  value={editingFacility.nodal}
                  onChange={(e) => setEditingFacility({ ...editingFacility, nodal: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">-- Select Nodal Officer --</option>
                  {nodalOptions.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.designation || u.email})
                    </option>
                  ))}
                  {editingFacility.nodal && !nodalOptions.some((u) => u.name === editingFacility.nodal) && (
                    <option value={editingFacility.nodal}>{editingFacility.nodal}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Associate Nodal Officer</label>
                <select
                  required
                  value={editingFacility.assocNodal}
                  onChange={(e) => setEditingFacility({ ...editingFacility, assocNodal: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">-- Select Associate Nodal Officer --</option>
                  {assocNodalOptions.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.designation || u.email})
                    </option>
                  ))}
                  {editingFacility.assocNodal && !assocNodalOptions.some((u) => u.name === editingFacility.assocNodal) && (
                    <option value={editingFacility.assocNodal}>{editingFacility.assocNodal}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supervisor</label>
                <select
                  required
                  value={editingFacility.supervisor}
                  onChange={(e) => setEditingFacility({ ...editingFacility, supervisor: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">-- Select Supervisor --</option>
                  {supervisorOptions.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.designation || u.email})
                    </option>
                  ))}
                  {editingFacility.supervisor && !supervisorOptions.some((u) => u.name === editingFacility.supervisor) && (
                    <option value={editingFacility.supervisor}>{editingFacility.supervisor}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editingFacility.status}
                  onChange={(e) => setEditingFacility({ ...editingFacility, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFacility(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 text-white rounded-xl font-bold shadow-xs hover:bg-purple-800 cursor-pointer transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SERVICE MODAL */}
      {editingService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden min-w-0">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg font-mono text-xs font-bold shrink-0">
                  {editingService.id}
                </div>
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">Edit Service Master</h3>
              </div>
              <button
                onClick={() => setEditingService(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditService} className="space-y-3 text-xs overflow-y-auto flex-1 min-h-0 min-w-0 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Manager</label>
                <select
                  required
                  value={editingService.manager}
                  onChange={(e) => setEditingService({ ...editingService, manager: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- Select Manager --</option>
                  {managerOptions.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({u.designation || u.email})
                    </option>
                  ))}
                  {editingService.manager && !managerOptions.some((u) => u.name === editingService.manager) && (
                    <option value={editingService.manager}>{editingService.manager}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quota / Access Specs</label>
                <input
                  type="text"
                  value={editingService.quota}
                  onChange={(e) => setEditingService({ ...editingService, quota: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editingService.status}
                  onChange={(e) => setEditingService({ ...editingService, status: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold shadow-xs hover:bg-emerald-800 cursor-pointer transition-colors"
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
