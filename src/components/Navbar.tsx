import React, { useState } from "react";
import { ApplicantProfile } from "../types/requisition";
import { WiiLogo } from "./common/WiiLogo";

import {
  FileText,
  HelpCircle,
  UserCheck,
  ChevronDown,
  Search,
  RefreshCw,
  KeyRound,
  Shield,
  UserCog,
  LogOut,
  User,
  Lock,
  Check,
  X,
} from "lucide-react";

/* =========================================================
   ASSIGNED ROLE TYPE
   ---------------------------------------------------------
   Ye structure backend ke /api/login ya /api/users response
   se aane wale role object ke saath match karta hai.

   Example:
   {
     id: 1,
     code: "user",
     name: "User"
   }

   {
     id: 8,
     code: "administrator",
     name: "Administrator"
   }
========================================================= */

export interface UserAssignedRole {
  id: number;
  code: string;
  name: string;
}

/* =========================================================
   NAVBAR PROPS
========================================================= */

interface NavbarProps {
  /* Current active role */
  currentRole: string;

  /* Login user ke assigned roles */
  assignedRoles?: UserAssignedRole[];

  /* Role switch callback */
  onRoleChange: (role: string) => void;

  /* Logged-in user's profile */
  userProfile?: ApplicantProfile;

  /* Current application tab */
  activeTab:
    | "dashboard"
    | "profile"
    | "my_requests"
    | "new_request"
    | "approval_queue"
    | "helpdesk"
    | "super_admin_panel"
    | "auth";

  /* Tab change callback */
  onTabChange: (
    tab:
      | "dashboard"
      | "profile"
      | "my_requests"
      | "new_request"
      | "approval_queue"
      | "helpdesk"
      | "super_admin_panel"
      | "auth",
  ) => void;

  /* Pending request count */
  pendingApprovalsCount: number;

  /* Reset sample data */
  onResetData: () => void;

  /* Global search */
  onSearch: (query: string) => void;

  /* Auth page callback */
  onOpenAuth: () => void;

  /* Logout callback */
  onLogout?: () => void;
}

/* =========================================================
   ROLE DISPLAY NAMES
   ---------------------------------------------------------
   Database ke role_code ko readable name me convert karne
   ke liye fallback mapping.
========================================================= */

const ROLE_NAMES: Record<string, string> = {
  // Frontend canonical codes
  applicant: "User",
  admin: "Administrator",

  // Backend aliases (kept for compatibility)
  user: "User",
  reporting_manager: "Reporting Manager / Supervisor (P)",
  nodal_officer: "Nodal Officer",
  associate_nodal_officer: "Associate Nodal Officer",
  it_head: "IT Head",
  manager: "Manager",
  supervisor: "Supervisor",
  administrator: "Administrator",
};

/* =========================================================
   DASHBOARD NAMES
========================================================= */

const DASHBOARD_NAMES: Record<string, string> = {
  applicant: "Dashboard",
  admin: "Dashboard",
  user: "Dashboard",
  reporting_manager: "Dashboard",
  nodal_officer: "Dashboard",
  associate_nodal_officer: "Dashboard",
  it_head: "Dashboard",
  manager: "Dashboard",
  supervisor: "Dashboard",
  administrator: "Dashboard",
};

/* =========================================================
   ROLE CAPABILITIES
   ---------------------------------------------------------
   Yahan decide hota hai ki kaunsa role kaunsi navbar
   functionality dekh sakta hai.

   Future me permissions expand karni ho to yahi section
   modify karna hoga.
========================================================= */

const ROLE_CAPABILITIES: Record<
  string,
  {
    access: boolean;
    requests: boolean;
    master: boolean;
  }
> = {
  applicant: {
    access: true,
    requests: true,
    master: false,
  },

  reporting_manager: {
    access: true,
    requests: true,
    master: false,
  },

  nodal_officer: {
    access: true,
    requests: true,
    master: false,
  },

  associate_nodal_officer: {
    access: true,
    requests: true,
    master: false,
  },

  it_head: {
    access: true,
    requests: true,
    master: false,
  },

  manager: {
    access: true,
    requests: true,
    master: false,
  },

  supervisor: {
    access: true,
    requests: true,
    master: false,
  },

  // Frontend canonical Administrator role.
  admin: {
    access: true,
    requests: true,
    master: true,
  },

  // Backend alias kept for compatibility.
  administrator: {
    access: true,
    requests: true,
    master: true,
  },
};

/* =========================================================
   NAVBAR COMPONENT
========================================================= */

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  assignedRoles = [],
  onRoleChange,
  userProfile,
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  onResetData,
  onSearch,
  onLogout,
}) => {
  /* =======================================================
     LOCAL UI STATES
  ======================================================= */

  /* User dropdown open / close */
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  /* Change password modal */
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  /* Password form */
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  /* =======================================================
     ASSIGNED ROLES
     -------------------------------------------------------
     IMPORTANT:
     Yahan koi hardcoded role add nahi kiya gaya.

     Jo roles backend se aayenge wahi UI me show honge.
  ======================================================= */

  const rolesToDisplay = assignedRoles;

  /* =========================================================
   ACTIVE ROLE INFORMATION
   ---------------------------------------------------------
   Current role ko backend se aaye assigned roles me search
   karte hain.

   Agar exact role object na mile to safe fallback use hoga.
========================================================= */

  const activeRoleInfo = rolesToDisplay.find(
    (role) => role.code === currentRole,
  ) || {
    id: 0,
    code: currentRole,
    name:
      ROLE_NAMES[currentRole] ||
      (currentRole === "applicant" ? "User" : currentRole) ||
      "User",
  };

  /* =======================================================
     USER INFORMATION
     -------------------------------------------------------
     Name DB/profile se aayega.
  ======================================================= */

  const displayName = userProfile?.fullName || "User";

  /* Email display ke liye profile fields */
  const displayEmail =
    userProfile?.personalEmail || userProfile?.wiiOfficialEmail || "";

  /* =======================================================
     CURRENT ROLE CAPABILITIES
  ======================================================= */

  const capabilities = ROLE_CAPABILITIES[currentRole] || {
    access: true,
    requests: true,
    master: false,
  };

  /* =======================================================
     DASHBOARD NAME
  ======================================================= */

  const dashboardName = DASHBOARD_NAMES[currentRole] || "Dashboard";

  /* =======================================================
     ROLE SWITCH
     -------------------------------------------------------
     User ke assigned roles me se hi role select hoga.

     Example:
       User
       Administrator

     User click karega Administrator par:
       currentRole = administrator
       dashboard open
  ======================================================= */

  const handleRoleSwitch = (roleCode: string) => {
    // Security/UI guard: only a role received from the backend may be selected.
    const isAssigned = rolesToDisplay.some((role) => role.code === roleCode);

    if (!isAssigned) {
      console.warn("Blocked unassigned role switch:", roleCode);
      setIsRoleDropdownOpen(false);
      return;
    }

    /* Same role par click hua to sirf dropdown close */
    if (roleCode === currentRole) {
      setIsRoleDropdownOpen(false);
      return;
    }

    /* Parent/App ko new role batao */
    onRoleChange(roleCode);

    /* Role change ke baad dashboard par redirect */
    onTabChange("dashboard");

    /* Dropdown close */
    setIsRoleDropdownOpen(false);
  };

  /* =======================================================
     CHANGE PASSWORD
     -------------------------------------------------------
     NOTE:
     Abhi ye UI validation hai.

     Actual backend API:
       POST /api/change-password

     baad me connect ki ja sakti hai.
  ======================================================= */

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordError(null);
    setPasswordSuccess(null);

    /* Current password validation */
    if (!oldPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }

    /* New password validation */
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    /* Confirm password validation */
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    /*
      Temporary UI success.

      Future:
      POST /api/change-password
    */

    setPasswordSuccess("Password updated successfully!");

    setTimeout(() => {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess(null);
      setIsPasswordModalOpen(false);
    }, 1500);
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* =====================================================
          MAIN HEADER
      ===================================================== */}

      <header
        className="
          bg-white dark:bg-slate-900
          border-b border-slate-200
          dark:border-slate-800
          shadow-sm
          sticky top-0
          z-40
        "
      >
        {/* ===================================================
            TOP HEADER
        =================================================== */}

        <div
          className="
            max-w-7xl mx-auto
            px-2.5 sm:px-6 lg:px-8
            py-2
            flex items-center
            justify-between
            gap-2
          "
        >
          {/* =================================================
              WII LOGO + PORTAL NAME
          ================================================= */}

          <div
            className="
              flex items-center
              gap-2 sm:gap-3
              cursor-pointer
              min-w-0
              shrink
            "
            onClick={() => onTabChange("dashboard")}
          >
            <WiiLogo size="sm" />

            <div
              className="
                hidden sm:block
                border-l
                border-slate-200
                dark:border-slate-800
                pl-3
              "
            >
              <h1
                className="
                  text-base
                  font-extrabold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                Access Management Portal
              </h1>
            </div>
          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <div
            className="
              relative
              flex-1
              max-w-xs
              hidden lg:block
            "
          >
            <Search
              className="
                w-4 h-4
                absolute
                left-3 top-2.5
                text-slate-400
              "
            />

            <input
              type="text"
              placeholder="Search Access ID, Name or Lab..."
              onChange={(e) => onSearch(e.target.value)}
              className="
                w-full
                pl-9 pr-3
                py-1.5
                text-xs
                bg-slate-50
                dark:bg-slate-800
                border
                border-slate-300
                dark:border-slate-700
                rounded-lg
                focus:outline-none
                focus:ring-2
                focus:ring-emerald-500
                text-slate-900
                dark:text-slate-100
              "
            />
          </div>

          {/* =================================================
              USER PROFILE BUTTON
          ================================================= */}

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="
                flex items-center
                gap-1.5 sm:gap-2.5
                px-2 sm:px-3
                py-1.5
                rounded-xl
                border
                border-slate-300
                dark:border-slate-700
                bg-slate-50
                dark:bg-slate-800
                text-left
                cursor-pointer
              "
            >
              {/* User icon */}

              <div
                className="
                  w-7 h-7
                  sm:w-8 sm:h-8
                  rounded-full
                  bg-emerald-100
                  dark:bg-emerald-950
                  border
                  border-emerald-300
                  dark:border-emerald-700
                  flex items-center
                  justify-center
                  shrink-0
                "
              >
                <User
                  className="
                    w-3.5 h-3.5
                    text-emerald-700
                    dark:text-emerald-400
                  "
                />
              </div>

              {/* User name + active role */}

              <div className="min-w-0 text-left">
                {/* User Name */}

                <div
                  className="
                    text-[11px]
                    sm:text-xs
                    font-extrabold
                    text-slate-900
                    dark:text-slate-100
                    truncate
                    leading-tight
                  "
                >
                  {displayName}
                </div>

                {/* Active Role */}

                <div
                  className="
                    text-[9px]
                    sm:text-[10px]
                    font-bold
                    text-emerald-700
                    dark:text-emerald-400
                    uppercase
                    tracking-wider
                    truncate
                    leading-tight
                    mt-0.5
                  "
                >
                  {activeRoleInfo.name}
                </div>
              </div>

              <ChevronDown
                className="
                  w-4 h-4
                  text-slate-400
                  shrink-0
                "
              />
            </button>

            {/* =================================================
                USER DROPDOWN
            ================================================= */}

            {isRoleDropdownOpen && (
              <div
                className="
                  absolute
                  right-0
                  mt-2
                  w-80
                  max-w-[calc(100vw-1rem)]
                  bg-white
                  dark:bg-slate-900
                  rounded-2xl
                  shadow-2xl
                  border
                  border-slate-200
                  dark:border-slate-800
                  z-50
                  overflow-hidden
                "
              >
                {/* =============================================
                    USER INFORMATION HEADER
                ============================================= */}

                <div
                  className="
                    p-3.5
                    bg-slate-900
                    dark:bg-slate-950
                    text-white
                    flex items-center
                    justify-between
                    gap-3
                  "
                >
                  <div className="min-w-0">
                    <div
                      className="
                        text-xs
                        font-black
                        truncate
                      "
                    >
                      {displayName}
                    </div>

                    {displayEmail && (
                      <div
                        className="
                          text-[10px]
                          text-slate-300
                          truncate
                        "
                      >
                        {displayEmail}
                      </div>
                    )}
                  </div>

                  {/* Current role badge */}

                  <span
                    className="
                      px-2
                      py-0.5
                      text-[9px]
                      font-bold
                      bg-emerald-500
                      text-slate-950
                      rounded-md
                      uppercase
                      shrink-0
                    "
                  >
                    {activeRoleInfo.name}
                  </span>
                </div>

                {/* =============================================
                    SWITCH ROLE PERSONA
                ============================================= */}

                <div className="p-2.5">
                  <div
                    className="
                      px-2 py-1
                      text-[10px]
                      font-bold
                      text-slate-400
                      uppercase
                      tracking-wider
                      flex items-center
                      justify-between
                    "
                  >
                    <span
                      className="
                        flex items-center
                        gap-1
                      "
                    >
                      <UserCog
                        className="
                          w-3.5 h-3.5
                          text-emerald-600
                        "
                      />
                      SWITCH ROLE PERSONA
                    </span>

                    <span
                      className="
                        text-[9px]
                        text-emerald-600
                        font-semibold
                      "
                    >
                      Redirects to Dashboard
                    </span>
                  </div>

                  {/* =========================================
                      ONLY DATABASE ASSIGNED ROLES
                  ========================================= */}

                  <div className="space-y-1">
                    {rolesToDisplay.length === 0 ? (
                      <div
                        className="
                          px-3 py-3
                          text-xs
                          text-slate-500
                        "
                      >
                        No roles assigned.
                      </div>
                    ) : (
                      rolesToDisplay.map((role) => {
                        const isActive = currentRole === role.code;

                        return (
                          <button
                            type="button"
                            key={role.id}
                            onClick={() => handleRoleSwitch(role.code)}
                            className={`
                              w-full
                              flex items-center
                              justify-between
                              px-2.5 py-2
                              rounded-lg
                              text-xs
                              transition-all
                              cursor-pointer
                              ${
                                isActive
                                  ? `
                                    bg-emerald-50
                                    dark:bg-emerald-950/40
                                    text-emerald-800
                                    dark:text-emerald-300
                                  `
                                  : `
                                    text-slate-700
                                    dark:text-slate-300
                                    hover:bg-slate-100
                                    dark:hover:bg-slate-800
                                  `
                              }
                            `}
                          >
                            <span
                              className="
                                flex items-center
                                gap-2
                              "
                            >
                              {/* Active indicator */}

                              <span
                                className={`
                                  w-2 h-2
                                  rounded-full
                                  ${
                                    isActive ? "bg-emerald-600" : "bg-slate-400"
                                  }
                                `}
                              />

                              {/* Role Name */}

                              <span className="font-semibold">
                                {role.name ||
                                  ROLE_NAMES[role.code] ||
                                  role.code}
                              </span>
                            </span>

                            {/* Active badge */}

                            {isActive && (
                              <span
                                className="
                                  px-1.5
                                  py-0.5
                                  text-[9px]
                                  font-black
                                  rounded-full
                                  bg-emerald-500
                                  text-white
                                "
                              >
                                ACTIVE
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* =============================================
                    ACCOUNT OPTIONS
                ============================================= */}

                <div
                  className="
                    p-2
                    bg-slate-50
                    dark:bg-slate-950/80
                    space-y-1
                  "
                >
                  {/* Change Password */}

                  <button
                    type="button"
                    onClick={() => {
                      setIsRoleDropdownOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="
                      w-full
                      text-left
                      px-3 py-2
                      rounded-xl
                      text-xs
                      font-bold
                      flex items-center
                      gap-2
                      hover:bg-emerald-50
                      dark:hover:bg-slate-800
                    "
                  >
                    <Lock
                      className="
                        w-4 h-4
                        text-emerald-600
                      "
                    />
                    Change Password
                  </button>

                  {/* Reset Sample Data */}

                  <button
                    type="button"
                    onClick={() => {
                      onResetData();
                      setIsRoleDropdownOpen(false);
                    }}
                    className="
                      w-full
                      text-left
                      px-3 py-2
                      rounded-xl
                      text-xs
                      font-medium
                      flex items-center
                      gap-2
                      hover:bg-slate-200
                      dark:hover:bg-slate-800
                    "
                  >
                    <RefreshCw
                      className="
                        w-4 h-4
                        text-slate-500
                      "
                    />
                    Reset Sample Records
                  </button>

                  {/* Logout */}

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRoleDropdownOpen(false);
                        onLogout();
                      }}
                      className="
                        w-full
                        text-left
                        px-3 py-2
                        rounded-xl
                        text-xs
                        font-bold
                        text-rose-700
                        flex items-center
                        gap-2
                        hover:bg-rose-100
                      "
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out / Logout
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            MAIN NAVIGATION
        ===================================================== */}

        <div
          className="
            bg-slate-50
            dark:bg-slate-900/90
            border-t
            border-slate-200
            dark:border-slate-800
          "
        >
          <div
            className="
              max-w-7xl mx-auto
              flex items-center
              gap-1 sm:gap-2
              overflow-x-auto
              py-1.5 sm:py-2
              px-2 sm:px-6
              no-scrollbar
            "
          >
            {/* =================================================
                DASHBOARD
            ================================================= */}

            <button
              type="button"
              onClick={() => onTabChange("dashboard")}
              className={`
                nav-button
                ${
                  activeTab === "dashboard"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-700 dark:text-slate-300"
                }
              `}
            >
              <UserCheck className="w-4 h-4" />

              {dashboardName}
            </button>

            {/* =================================================
                PROFILE
            ================================================= */}

            <button
              type="button"
              onClick={() => onTabChange("profile")}
              className={`
                nav-button
                ${
                  activeTab === "profile"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-700 dark:text-slate-300"
                }
              `}
            >
              <UserCheck className="w-4 h-4" />
              Profile
            </button>

            {/* =================================================
                ACCESS
            ================================================= */}

            {capabilities.access && (
              <button
                type="button"
                onClick={() => onTabChange("new_request")}
                className={`
                  nav-button
                  ${
                    activeTab === "new_request"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-700 dark:text-slate-300"
                  }
                `}
              >
                <KeyRound className="w-4 h-4" />
                Access
              </button>
            )}

            {/* =================================================
                REQUESTS
            ================================================= */}

            {capabilities.requests && (
              <button
                type="button"
                onClick={() => onTabChange("my_requests")}
                className={`
                  nav-button relative
                  ${
                    activeTab === "my_requests" ||
                    activeTab === "approval_queue"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-700 dark:text-slate-300"
                  }
                `}
              >
                <FileText className="w-4 h-4" />
                Requests
                {/* Pending count */}
                {pendingApprovalsCount > 0 && (
                  <span
                    className="
                      ml-1
                      px-1.5 py-0.5
                      text-[10px]
                      font-black
                      rounded-full
                      bg-amber-500
                      text-white
                    "
                  >
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            )}

            {/* =================================================
                MASTER
                -------------------------------------------------
                Sirf Administrator role.
            ================================================= */}

            {capabilities.master && (
              <button
                type="button"
                onClick={() => onTabChange("super_admin_panel")}
                className={`
                  nav-button
                  ${
                    activeTab === "super_admin_panel"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-700 dark:text-slate-300"
                  }
                `}
              >
                <Shield className="w-4 h-4" />
                Master
              </button>
            )}

            {/* =================================================
                HELPDESK
            ================================================= */}

            <button
              type="button"
              onClick={() => onTabChange("helpdesk")}
              className={`
                nav-button
                ${
                  activeTab === "helpdesk"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-700 dark:text-slate-300"
                }
              `}
            >
              <HelpCircle className="w-4 h-4" />
              Helpdesk
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}

      {isPasswordModalOpen && (
        <div
          className="
            fixed inset-0
            bg-slate-950/70
            backdrop-blur-sm
            z-50
            flex items-center
            justify-center
            p-4
          "
        >
          <div
            className="
              bg-white
              dark:bg-slate-900
              rounded-2xl
              shadow-2xl
              max-w-md
              w-full
              overflow-hidden
            "
          >
            {/* Modal Header */}

            <div
              className="
                p-4
                bg-slate-900
                dark:bg-slate-950
                text-white
                flex items-center
                justify-between
              "
            >
              <div
                className="
                  flex items-center
                  gap-2
                "
              >
                <Lock
                  className="
                    w-4 h-4
                    text-emerald-400
                  "
                />

                <span className="font-bold text-sm">
                  Change Account Password
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Password Form */}

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
              {/* Error */}

              {passwordError && (
                <div
                  className="
                    p-3
                    bg-rose-50
                    border border-rose-200
                    rounded-xl
                    text-rose-800
                    text-xs
                    font-bold
                  "
                >
                  {passwordError}
                </div>
              )}

              {/* Success */}

              {passwordSuccess && (
                <div
                  className="
                    p-3
                    bg-emerald-50
                    border border-emerald-200
                    rounded-xl
                    text-emerald-800
                    text-xs
                    font-bold
                    flex items-center
                    gap-2
                  "
                >
                  <Check className="w-4 h-4" />

                  {passwordSuccess}
                </div>
              )}

              {/* Current Password */}

              <div>
                <label className="block text-xs font-bold mb-1">
                  Current Password *
                </label>

                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="
                    w-full
                    px-3 py-2.5
                    border
                    rounded-xl
                    text-sm
                  "
                />
              </div>

              {/* New Password */}

              <div>
                <label className="block text-xs font-bold mb-1">
                  New Password *
                </label>

                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="
                    w-full
                    px-3 py-2.5
                    border
                    rounded-xl
                    text-sm
                  "
                />
              </div>

              {/* Confirm Password */}

              <div>
                <label className="block text-xs font-bold mb-1">
                  Confirm New Password *
                </label>

                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="
                    w-full
                    px-3 py-2.5
                    border
                    rounded-xl
                    text-sm
                  "
                />
              </div>

              {/* Modal Buttons */}

              <div
                className="
                  flex justify-end
                  gap-2
                  pt-2
                "
              >
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="
                    px-4 py-2
                    rounded-xl
                    border
                    text-xs
                    font-bold
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="
                    px-5 py-2
                    rounded-xl
                    bg-emerald-600
                    text-white
                    text-xs
                    font-bold
                  "
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          COMMON NAV BUTTON CSS
      ===================================================== */}

      <style>
        {`
          .nav-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.875rem;
            font-size: 0.75rem;
            border-radius: 0.75rem;
            white-space: nowrap;
            flex-shrink: 0;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .nav-button:hover {
            background-color: rgba(226,232,240,0.7);
          }
        `}
      </style>
    </>
  );
};
