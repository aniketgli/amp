import React, { useState, useEffect, useMemo } from 'react';
import { SecurityAuditLogEntry, UserRole } from '../../types/requisition';
import {
  getStoredAuditLogs,
  saveAuditLogs,
  recordSecurityAuditLog,
  getRoleHumanLabel,
} from '../../utils/auditLogger';
import {
  Activity,
  Shield,
  Search,
  Filter,
  User,
  Users,
  Calendar,
  Clock,
  Layers,
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Key,
  ShieldCheck,
  Building2,
  Cpu,
  Mail,
  Smartphone,
  Lock,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SecurityAuditTrailSectionProps {
  managedUsers?: any[];
}

export const SecurityAuditTrailSection: React.FC<SecurityAuditTrailSectionProps> = ({ managedUsers = [] }) => {
  const [logs, setLogs] = useState<SecurityAuditLogEntry[]>(() => getStoredAuditLogs());
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLogModal, setSelectedLogModal] = useState<SecurityAuditLogEntry | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync logs when localStorage or custom event updates
  useEffect(() => {
    const handleUpdate = () => {
      setLogs(getStoredAuditLogs());
    };
    window.addEventListener('wii_audit_logs_updated', handleUpdate);
    return () => window.removeEventListener('wii_audit_logs_updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Unique list of actors/users from logs & managedUsers for dropdown
  const allUsersList = useMemo(() => {
    const map = new Map<string, { name: string; email: string; role: string; roleLabel: string }>();

    // Add from managedUsers if available
    managedUsers.forEach((u) => {
      if (u.name) {
        map.set(u.name.toLowerCase(), {
          name: u.name,
          email: u.email,
          role: u.role,
          roleLabel: getRoleHumanLabel(u.role as UserRole),
        });
      }
    });

    // Add from existing log entries
    logs.forEach((log) => {
      if (log.actorName && !map.has(log.actorName.toLowerCase())) {
        map.set(log.actorName.toLowerCase(), {
          name: log.actorName,
          email: log.actorEmail,
          role: log.actorRole,
          roleLabel: log.actorRoleLabel || getRoleHumanLabel(log.actorRole),
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [logs, managedUsers]);

  // Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. User Name Filter
      if (selectedUserFilter !== 'ALL' && log.actorName.toLowerCase() !== selectedUserFilter.toLowerCase()) {
        return false;
      }

      // 2. Role Filter
      if (selectedRoleFilter !== 'ALL' && log.actorRole !== selectedRoleFilter) {
        return false;
      }

      // 3. Action Category Filter
      if (selectedActionFilter !== 'ALL' && log.actionType !== selectedActionFilter) {
        return false;
      }

      // 4. Search Query (Name, Email, Module, Summary, IP)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchName = log.actorName.toLowerCase().includes(q);
        const matchEmail = log.actorEmail.toLowerCase().includes(q);
        const matchModule = log.module.toLowerCase().includes(q);
        const matchSummary = log.summary.toLowerCase().includes(q);
        const matchAction = log.actionType.toLowerCase().includes(q);
        const matchIp = log.ipAddress.includes(q);
        const matchPrev = log.details?.previousValue?.toLowerCase().includes(q);
        const matchNew = log.details?.newValue?.toLowerCase().includes(q);

        if (!matchName && !matchEmail && !matchModule && !matchSummary && !matchAction && !matchIp && !matchPrev && !matchNew) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedUserFilter, selectedRoleFilter, selectedActionFilter, searchQuery]);

  // Selected User Meta
  const selectedUserData = useMemo(() => {
    if (selectedUserFilter === 'ALL') return null;
    return allUsersList.find((u) => u.name.toLowerCase() === selectedUserFilter.toLowerCase()) || null;
  }, [selectedUserFilter, allUsersList]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor Name', 'Actor Email', 'Actor Role', 'Action Type', 'Module (Kaha)', 'Summary (Kya)', 'Previous Value', 'New Value', 'IP Address', 'Status'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.actorName}"`,
      `"${l.actorEmail}"`,
      `"${l.actorRoleLabel || l.actorRole}"`,
      `"${l.actionType}"`,
      `"${l.module}"`,
      `"${l.summary.replace(/"/g, '""')}"`,
      `"${(l.details?.previousValue || '-').replace(/"/g, '""')}"`,
      `"${(l.details?.newValue || '-').replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${l.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WII_Security_Audit_Trail_${selectedUserFilter !== 'ALL' ? selectedUserFilter.replace(/\s+/g, '_') : 'All_Personnel'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Security Audit Log CSV report generated & downloaded.');
  };

  // Helper for action badge colors
  const getActionBadgeColor = (action: string) => {
    if (action.includes('PROFILE') || action.includes('ORDER')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('APPROVE') || action.includes('PROVISION') || action.includes('GRANT') || action.includes('ENROLL')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('REJECT') || action.includes('FAILED')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('ROLE') || action.includes('MASTER') || action.includes('CONFIG')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-bounce">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Main Container Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                <Shield className="w-3 h-3 text-purple-600" /> WII Security Governance
              </span>
              <span className="text-slate-400 text-[11px] font-medium">• Central Audit Trail Register</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Security Audit Trail (Kab / Kya / Kaha Log)
            </h2>
            <p className="text-slate-500 text-xs">
              Select any personnel name across all system roles to inspect complete activity logs, field modification records, location parameters, and cryptographic signatures.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setLogs(getStoredAuditLogs());
                showToast('Refreshed security audit records from storage.');
              }}
              className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Audit CSV
            </button>
          </div>
        </div>

        {/* ==================== SELECT PERSONNEL / NAME FILTER BAR ==================== */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Primary Selector: Select Personnel / User Name */}
            <div className="space-y-1 md:col-span-1">
              <label className="block text-[11px] font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-700" />
                Select Personnel Name ("kisi ka bhi name select kare")
              </label>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full p-2.5 bg-white border-2 border-purple-300 focus:border-purple-600 rounded-xl font-extrabold text-xs text-slate-900 shadow-xs cursor-pointer focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <option value="ALL">-- ALL PERSONNEL / SYSTEM-WIDE (Show All) --</option>
                {allUsersList.map((u) => (
                  <option key={u.email} value={u.name}>
                    {u.name} ({u.roleLabel}) — {u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Filter by Role */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                System Role Filter
              </label>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-800 cursor-pointer focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All System Roles (Every Role)</option>
                <option value="applicant">User / Applicant</option>
                <option value="supervisor">Reporting Manager / Supervisor (PI)</option>
                <option value="it_officer">Senior Technical Officer (IT Head)</option>
                <option value="hrms_officer">HRMS & Biometric Officer</option>
                <option value="lab_nodal">Lab Nodal Officer</option>
                <option value="assoc_lab_nodal">Associate Lab Nodal Officer</option>
                <option value="section_head">Manager / Section Head</option>
                <option value="admin">Director General & System Admin</option>
              </select>
            </div>

            {/* Filter 3: Search Box */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                Search Logs (Kab / Kya / Kaha / IP)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by action, module, IP, order ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-purple-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Filter className="w-3 h-3" /> Quick Filter Action:
            </span>
            <button
              onClick={() => setSelectedActionFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedActionFilter === 'ALL' ? 'bg-purple-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Actions ({logs.length})
            </button>
            <button
              onClick={() => setSelectedActionFilter('PROFILE_UPDATE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedActionFilter === 'PROFILE_UPDATE' ? 'bg-purple-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Profile & Order Edits
            </button>
            <button
              onClick={() => setSelectedActionFilter('PI_APPROVAL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedActionFilter === 'PI_APPROVAL' ? 'bg-purple-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Supervisor / PI Approvals
            </button>
            <button
              onClick={() => setSelectedActionFilter('IT_EMAIL_PROVISION')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedActionFilter === 'IT_EMAIL_PROVISION' ? 'bg-purple-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              IT Mail & Network Binding
            </button>
            <button
              onClick={() => setSelectedActionFilter('ROLE_CHANGE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedActionFilter === 'ROLE_CHANGE' ? 'bg-purple-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Role & Master Changes
            </button>
          </div>
        </div>

        {/* SELECTED USER IDENTITY CARD OVERVIEW */}
        {selectedUserData && (
          <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-purple-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center font-extrabold text-base border border-white/20 shrink-0 text-purple-200">
                {selectedUserData.name.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">{selectedUserData.name}</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 uppercase">
                    {selectedUserData.roleLabel}
                  </span>
                </div>
                <p className="text-[11px] text-purple-200 font-mono">{selectedUserData.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 shrink-0">
              <div>
                <span className="block text-[10px] text-purple-300 uppercase font-bold">Total Changes Recorded</span>
                <span className="text-sm font-extrabold text-emerald-300">{filteredLogs.length} Log Entries</span>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div>
                <span className="block text-[10px] text-purple-300 uppercase font-bold">Audit Status</span>
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Audited
                </span>
              </div>
            </div>
          </div>
        )}

        {/* LOG STATS COUNTER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-500 text-[11px] font-medium block">Total Filtered Logs</span>
            <span className="text-base font-extrabold text-slate-900">{filteredLogs.length} Events</span>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl">
            <span className="text-purple-700 text-[11px] font-medium block">Active Personnel Tracked</span>
            <span className="text-base font-extrabold text-purple-900">{allUsersList.length} Personnel</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
            <span className="text-emerald-700 text-[11px] font-medium block">Successful Operations</span>
            <span className="text-base font-extrabold text-emerald-900">
              {filteredLogs.filter((l) => l.status === 'SUCCESS').length} / {filteredLogs.length}
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
            <span className="text-amber-700 text-[11px] font-medium block">Active Roles Monitored</span>
            <span className="text-base font-extrabold text-amber-900">All 8 System Roles</span>
          </div>
        </div>

        {/* ==================== AUDIT LOG LISTING TABLE / CARDS ==================== */}
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
            <Activity className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-700 text-sm">No Security Audit Logs Found</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              No recorded changes match the selected personnel name or filter criteria. Try changing the user selector or clearing search filters.
            </p>
            <button
              onClick={() => {
                setSelectedUserFilter('ALL');
                setSelectedRoleFilter('ALL');
                setSelectedActionFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-purple-700 text-white rounded-xl font-bold hover:bg-purple-800 transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all p-4 space-y-3"
              >
                {/* Header Row: Person Name + Role Badge + Action + Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* User Identity */}
                    <button
                      onClick={() => setSelectedUserFilter(log.actorName)}
                      title="Click to filter logs by this person"
                      className="font-extrabold text-slate-900 text-xs hover:text-purple-700 hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      {log.actorName}
                    </button>

                    <span className="text-slate-300 font-bold">•</span>

                    {/* Email */}
                    <span className="font-mono text-[11px] text-slate-500">{log.actorEmail}</span>

                    {/* Role Badge */}
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                      {log.actorRoleLabel || getRoleHumanLabel(log.actorRole)}
                    </span>

                    {/* Action Category Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${getActionBadgeColor(log.actionType)}`}>
                      {log.actionType}
                    </span>
                  </div>

                  {/* Kab (Timestamp & IP) */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 font-mono text-purple-900 font-bold">
                      <Clock className="w-3 h-3 text-purple-600" />
                      {log.timestamp}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px]">
                      IP: {log.ipAddress}
                    </span>
                  </div>
                </div>

                {/* Body Row: Kaha (Module) & Kya (Summary) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                  {/* Kaha (Module/Entity) */}
                  <div className="md:col-span-4 bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-600" /> Module / Location (Kaha?)
                    </span>
                    <div className="font-extrabold text-slate-900 text-xs">{log.module}</div>
                    {log.details?.targetEntity && (
                      <div className="text-[11px] font-mono text-purple-700 font-semibold">
                        Target: {log.details.targetEntity}
                      </div>
                    )}
                  </div>

                  {/* Kya (Change Summary & Diff) */}
                  <div className="md:col-span-8 bg-purple-50/40 border border-purple-100 rounded-lg p-2.5 space-y-1.5">
                    <span className="text-[10px] font-extrabold text-purple-900 uppercase tracking-wider block flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-600" /> Action & Changes Performed (Kya?)
                    </span>
                    <p className="text-xs font-bold text-slate-900 leading-relaxed">{log.summary}</p>

                    {/* Diffs / Modifications */}
                    {(log.details?.previousValue || log.details?.newValue) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] border-t border-purple-200/60">
                        {log.details.previousValue && (
                          <div className="p-1.5 bg-rose-50 border border-rose-200 rounded text-rose-900">
                            <span className="font-bold text-[10px] text-rose-600 block uppercase">Previous Value:</span>
                            {log.details.previousValue}
                          </div>
                        )}
                        {log.details.newValue && (
                          <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
                            <span className="font-bold text-[10px] text-emerald-600 block uppercase">New Value:</span>
                            {log.details.newValue}
                          </div>
                        )}
                      </div>
                    )}

                    {log.details?.digitalSignature && (
                      <div className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1 pt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Digital Signature: {log.details.digitalSignature}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls: Inspect Detail Button */}
                <div className="flex justify-between items-center text-[11px] pt-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      Status: {log.status}
                    </span>
                    {log.details?.comments && (
                      <span className="text-slate-500 italic truncate max-w-md">
                        "{log.details.comments}"
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedLogModal(log)}
                    className="text-purple-700 font-extrabold hover:text-purple-900 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Log Audit Payload
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INSPECT LOG AUDIT MODAL */}
      {selectedLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-lg font-mono text-xs font-bold">
                  {selectedLogModal.id}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Security Audit Payload Inspector</h3>
                  <p className="text-[11px] text-slate-500">Full cryptographic record & system parameters</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Actor Details */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-extrabold text-slate-900 text-sm">{selectedLogModal.actorName}</div>
                <div className="font-mono text-purple-700 font-semibold">{selectedLogModal.actorEmail}</div>
                <div className="text-slate-600 font-bold">
                  Role: {selectedLogModal.actorRoleLabel || getRoleHumanLabel(selectedLogModal.actorRole)}
                </div>
              </div>

              {/* Parameters Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="font-bold text-slate-500">Kab (Timestamp):</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLogModal.timestamp}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="font-bold text-slate-500">Kaha (Module):</span>
                  <span className="font-bold text-slate-900">{selectedLogModal.module}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="font-bold text-slate-500">Action Type (Kya):</span>
                  <span className="font-extrabold text-purple-700 uppercase">{selectedLogModal.actionType}</span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="font-bold text-slate-500">Network IP Address:</span>
                  <span className="font-mono text-slate-800">{selectedLogModal.ipAddress} (WII Campus LAN)</span>
                </div>

                {selectedLogModal.details?.digitalSignature && (
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="font-bold text-slate-500">Digital Signature:</span>
                    <span className="font-mono text-emerald-700 font-extrabold">{selectedLogModal.details.digitalSignature}</span>
                  </div>
                )}
              </div>

              {/* Full Description Box */}
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <span className="font-extrabold text-purple-900 block text-[11px] uppercase">Complete Change Summary</span>
                <p className="text-slate-900 font-semibold leading-relaxed">{selectedLogModal.summary}</p>
                {selectedLogModal.details?.comments && (
                  <p className="text-slate-600 italic text-[11px] pt-1">
                    Officer Comments: "{selectedLogModal.details.comments}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedLogModal(null)}
                className="px-4 py-2 bg-purple-700 text-white rounded-xl font-bold cursor-pointer hover:bg-purple-800 transition-all"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
