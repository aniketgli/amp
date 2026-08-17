import React, { useState } from 'react';
import { UserRole, RoleInfo, ApplicantProfile } from '../types/requisition';
import { OFFICIAL_ROLES } from '../data/initialData';
import { WiiLogo } from './common/WiiLogo';
import {
  FileText,
  PlusCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  ExternalLink,
  Search,
  Building2,
  RefreshCw,
  KeyRound,
  Sparkles,
  Shield,
  UserCog,
  LogOut,
  User,
  Lock,
  Check,
  X,
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  assignedRoles?: UserRole[];
  onRoleChange: (role: UserRole) => void;
  userProfile?: ApplicantProfile;
  activeTab: 'dashboard' | 'profile' | 'my_requests' | 'new_request' | 'approval_queue' | 'helpdesk' | 'super_admin_panel' | 'auth';
  onTabChange: (tab: 'dashboard' | 'profile' | 'my_requests' | 'new_request' | 'approval_queue' | 'helpdesk' | 'super_admin_panel' | 'auth') => void;
  pendingApprovalsCount: number;
  onResetData: () => void;
  onSearch: (query: string) => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  assignedRoles,
  onRoleChange,
  userProfile,
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  onResetData,
  onSearch,
  onOpenAuth,
  onLogout,
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Filter roles to display only assigned roles
  const rolesToDisplay = OFFICIAL_ROLES.filter((role) => {
    if (assignedRoles && assignedRoles.length > 0) {
      return assignedRoles.includes(role.id);
    }
    return role.id === 'applicant' || role.id === currentRole;
  });
  
  // Password change form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const activeRoleInfo = OFFICIAL_ROLES.find((r) => r.id === currentRole) || OFFICIAL_ROLES[0];

  const displayName = userProfile?.fullName || activeRoleInfo.name || 'User';
  const displayEmail = userProfile?.personalEmail || userProfile?.wiiOfficialEmail || 'user@wii.gov.in';

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword.trim()) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setPasswordSuccess('Password updated successfully!');
    setTimeout(() => {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(null);
      setIsPasswordModalOpen(false);
    }, 1500);
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-0 z-40 transition-colors">
        {/* Main Branding Header & Control Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Emblem & Portal Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => onTabChange('dashboard')}
            title="Return to Dashboard"
          >
            <WiiLogo size="md" />
            <div className="hidden sm:block border-l border-slate-200 dark:border-slate-800 pl-3">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                Access Management Portal
              </h1>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="relative flex-1 max-w-xs hidden lg:block">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search Requisition ID, Name or Lab..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Right side controls: User Menu & Role Popover */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Active User Account Menu */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left shadow-2xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold text-xs shrink-0">
                  <User className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                    <span>{displayName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold rounded-md uppercase border border-emerald-300 dark:border-emerald-800 shrink-0">
                      {activeRoleInfo.title}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
                    {displayEmail}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 ml-0.5 shrink-0" />
              </button>

              {/* User Account & Role Popover Menu */}
              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Account Info Header */}
                  <div className="p-3.5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{displayName}</div>
                      <div className="text-[10px] text-slate-300 font-medium truncate">{displayEmail}</div>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500 text-slate-950 rounded-md uppercase tracking-wider shrink-0">
                      {activeRoleInfo.title}
                    </span>
                  </div>

                  {/* Switch Active Role */}
                  <div className="p-2.5">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1">
                        <UserCog className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Switch Role Persona
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">Redirects to Dashboard</span>
                    </div>

                    <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                      {rolesToDisplay.map((role) => {
                        const isActive = currentRole === role.id;
                        return (
                          <button
                            key={role.id}
                            onClick={() => {
                              onRoleChange(role.id);
                              onTabChange('dashboard');
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer text-xs ${
                              isActive
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${role.avatarColor}`} />
                              <span className="truncate">{role.title}</span>
                            </div>
                            {isActive && (
                              <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-md shrink-0">
                                ACTIVE
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Account Controls */}
                  <div className="p-2 bg-slate-50 dark:bg-slate-950/80 space-y-1">
                    <button
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        setIsPasswordModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Change Password</span>
                    </button>

                    <button
                      onClick={() => {
                        onResetData();
                        setIsRoleDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Reset Sample Records</span>
                    </button>

                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsRoleDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-950/60 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>Sign Out / Logout</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-1.5">
            {/* 1. Dashboard */}
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>Dashboard</span>
            </button>

            {/* 2. Profile */}
            <button
              onClick={() => onTabChange('profile')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <UserCheck className={`w-4 h-4 ${activeTab === 'profile' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>Profile</span>
            </button>

            {/* 3. Access (ONLY VISIBLE TO NORMAL USERS / APPLICANTS) */}
            {currentRole === 'applicant' && (
              <button
                onClick={() => onTabChange('new_request')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'new_request'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <KeyRound className={`w-4 h-4 ${activeTab === 'new_request' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>Access</span>
              </button>
            )}

            {/* 4. Requests */}
            <button
              onClick={() => onTabChange('my_requests')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg transition-all whitespace-nowrap relative cursor-pointer ${
                activeTab === 'my_requests' || activeTab === 'approval_queue'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className={`w-4 h-4 ${activeTab === 'my_requests' || activeTab === 'approval_queue' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>Requests</span>
              {pendingApprovalsCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-black rounded-full ${
                  activeTab === 'my_requests' || activeTab === 'approval_queue' ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white'
                }`}>
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            {/* 5. Master (VISIBLE TO ADMIN) */}
            {(currentRole === 'admin' || (currentRole as string) === 'super_admin') && (
              <button
                onClick={() => onTabChange('super_admin_panel')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'super_admin_panel'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                }`}
              >
                <Shield className={`w-4 h-4 ${activeTab === 'super_admin_panel' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span>Master</span>
              </button>
            )}

            {/* 6. Helpdesk */}
            <button
              onClick={() => onTabChange('helpdesk')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'helpdesk'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <HelpCircle className={`w-4 h-4 ${activeTab === 'helpdesk' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
              <span>Helpdesk</span>
            </button>
          </div>
        </div>
      </header>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 font-bold text-sm">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Change Account Password</span>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
              {passwordError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-bold">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};


