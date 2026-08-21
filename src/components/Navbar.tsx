import React, { useState, useEffect } from "react";
import { ApplicantProfile } from "../types/requisition";
import { WiiLogo } from "./common/WiiLogo";
import {
  FileText,
  Clock,
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
   USER ROLE TYPE
   ---------------------------------------------------------
   Ye roles database ke roles table ke role_code se match
   karte hain.
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
  /* Currently selected / active role */
  currentRole: string;

  /* Login ke baad backend se milne wale assigned roles */
  assignedRoles?: UserAssignedRole[];

  /* Role switch callback */
  onRoleChange: (role: string) => void;

  /* Existing profile data */
  userProfile?: ApplicantProfile;

  /* Current page/tab */
  activeTab:
    | "dashboard"
    | "profile"
    | "my_requests"
    | "new_request"
    | "approval_queue"
    | "helpdesk"
    | "super_admin_panel"
    | "auth";

  /* Page change callback */
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

  pendingApprovalsCount: number;

  onResetData: () => void;

  onSearch: (query: string) => void;

  onOpenAuth: () => void;

  onLogout?: () => void;
}

/* =========================================================
   ROLE DISPLAY NAMES
   ---------------------------------------------------------
   Agar backend sirf role_code bheje to bhi UI proper name
   show karega.
========================================================= */

const ROLE_NAMES: Record<string, string> = {
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
   DASHBOARD LABELS
========================================================= */

const DASHBOARD_NAMES: Record<string, string> = {
  user: "User Portal",
  reporting_manager: "Reporting Manager Desk",
  nodal_officer: "Nodal Officer Desk",
  associate_nodal_officer: "Associate Nodal Desk",
  it_head: "IT Head Desk",
  manager: "Manager Desk",
  supervisor: "Supervisor Desk",
  administrator: "Admin Desk",
};

/* =========================================================
   ROLE CAPABILITIES
   ---------------------------------------------------------
   Yahan decide hota hai ki kaunsa role kya dekh sakta hai.

   Baad mein permissions change karni ho to mainly isi
   section ko modify karna hoga.
========================================================= */

const ROLE_CAPABILITIES: Record<
  string,
  {
    access: boolean;
    requests: boolean;
    approvals: boolean;
    master: boolean;
  }
> = {
  user: {
    access: true,
    requests: true,
    approvals: false,
    master: false,
  },

  reporting_manager: {
    access: false,
    requests: true,
    approvals: true,
    master: false,
  },

  nodal_officer: {
    access: false,
    requests: true,
    approvals: true,
    master: false,
  },

  associate_nodal_officer: {
    access: false,
    requests: true,
    approvals: true,
    master: false,
  },

  it_head: {
    access: false,
    requests: true,
    approvals: true,
    master: false,
  },

  manager: {
    access: false,
    requests: true,
    approvals: true,
    master: false,
  },

  supervisor: {
    access: false,
    requests: true,
    approvals: true,
    master: false,
  },

  administrator: {
    access: false,
    requests: true,
    approvals: true,
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
  onOpenAuth,
  onLogout,
}) => {
  /* =======================================================
     LOCAL UI STATES
  ======================================================= */

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

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
     Backend se roles directly aa rahe hain.

     Example:
     [
       { id: 1, code: "user", name: "User" },
       { id: 8, code: "administrator", name: "Administrator" }
     ]
  ======================================================= */

  const rolesToDisplay = assignedRoles;

  /* =======================================================
     ACTIVE ROLE INFORMATION
  ======================================================= */

  const activeRoleInfo = rolesToDisplay.find(
    (role) => role.code === currentRole,
  ) || {
    id: 0,
    code: currentRole,
    name: ROLE_NAMES[currentRole] || currentRole || "User",
  };

  /* =======================================================
     USER NAME / EMAIL
     -------------------------------------------------------
     Profile available ho to usse use karega.
  ======================================================= */

  const displayName = userProfile?.fullName || "User";

  const displayEmail =
    userProfile?.personalEmail ||
    userProfile?.wiiOfficialEmail ||
    "user@wii.gov.in";

  /* =======================================================
     CURRENT ROLE CAPABILITIES
  ======================================================= */

  const capabilities = ROLE_CAPABILITIES[currentRole] || {
    access: false,
    requests: true,
    approvals: false,
    master: false,
  };

  /* =======================================================
     DASHBOARD NAME
  ======================================================= */

  const dashboardName =
    DASHBOARD_NAMES[currentRole] || activeRoleInfo.name || "Dashboard";

  /* =======================================================
     PASSWORD CHANGE
  ======================================================= */

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setPasswordError(null);
    setPasswordSuccess(null);

    if (!oldPassword.trim()) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    /*
      IMPORTANT:
      Abhi ye sirf UI success hai.

      Actual password update ke liye baad mein:
      POST /api/change-password

      API connect karenge.
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

  /* =======================================================
     ROLE SWITCH HANDLER
     -------------------------------------------------------
     User kisi assigned role par click karega:
       1. active role change
       2. dashboard open
       3. dropdown close
  ======================================================= */

  const handleRoleSwitch = (roleCode: string) => {
    if (roleCode === currentRole) {
      setIsRoleDropdownOpen(false);
      return;
    }

    onRoleChange(roleCode);

    /* Role switch ke baad dashboard */
    onTabChange("dashboard");

    setIsRoleDropdownOpen(false);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <header
        className="
          bg-white dark:bg-slate-900
          border-b border-slate-200 dark:border-slate-800
          shadow-xs sticky top-0 z-40
        "
      >
        {/* =================================================
            TOP HEADER
        ================================================= */}

        <div
          className="
            max-w-7xl mx-auto
            px-2.5 sm:px-6 lg:px-8
            py-2
            flex items-center justify-between
            gap-2
          "
        >
          {/* ===============================================
              WII LOGO + PORTAL NAME
          =============================================== */}

          <div
            className="
              flex items-center gap-2 sm:gap-3
              cursor-pointer
              min-w-0 shrink
            "
            onClick={() => onTabChange("dashboard")}
          >
            <WiiLogo size="sm" />

            <div
              className="
                hidden sm:block
                border-l border-slate-200
                dark:border-slate-800
                pl-3
              "
            >
              <h1
                className="
                  text-base font-extrabold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                Access Management Portal
              </h1>
            </div>
          </div>

          {/* ===============================================
              SEARCH
          =============================================== */}

          <div
            className="
              relative flex-1
              max-w-xs hidden lg:block
            "
          >
            <Search
              className="
                w-4 h-4
                absolute left-3 top-2.5
                text-slate-400
              "
            />

            <input
              type="text"
              placeholder="Search Access ID, Name or Lab..."
              onChange={(e) => onSearch(e.target.value)}
              className="
                w-full
                pl-9 pr-3 py-1.5
                text-xs
                bg-slate-50 dark:bg-slate-800
                border border-slate-300
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

          {/* ===============================================
              USER PROFILE BUTTON
          =============================================== */}

          <div className="relative shrink-0">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="
                flex items-center
                gap-1.5 sm:gap-2.5
                px-2 sm:px-3
                py-1.5
                rounded-xl
                border border-slate-300
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
                  w-7 h-7 sm:w-8 sm:h-8
                  rounded-full
                  bg-emerald-100
                  dark:bg-emerald-950
                  border border-emerald-300
                  dark:border-emerald-700
                  flex items-center justify-center
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

              {/* =====================================================
                  USER NAME + ACTIVE ROLE + EMAIL
              ===================================================== */}
              <div className="min-w-0 text-left">
                {/* User Name */}
                <div className="text-[11px] sm:text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate leading-tight">
                  {displayName}
                </div>

                {/* Active Role */}
                <div className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase truncate leading-tight mt-0.5">
                  {activeRoleInfo.title}
                </div>

                {/* Current / Active Role */}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {activeRoleInfo?.name || activeRoleInfo?.title || "User"}
                </div>
              </div>
              <ChevronDown
                className="
                  w-4 h-4
                  text-slate-400
                "
              />
            </button>

            {/* =================================================
                USER DROPDOWN
            ================================================= */}

            {isRoleDropdownOpen && (
              <div
                className="
                  absolute right-0 mt-2
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
                {/* =========================================
                    USER INFORMATION
                ========================================= */}

                <div
                  className="
                    p-3.5
                    bg-slate-900
                    dark:bg-slate-950
                    text-white
                    flex items-center
                    justify-between
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

                    <div
                      className="
                        text-[10px]
                        text-slate-300
                        truncate
                      "
                    >
                      {displayEmail}
                    </div>
                  </div>

                  <span
                    className="
                      px-2 py-0.5
                      text-[9px]
                      font-bold
                      bg-emerald-500
                      text-slate-950
                      rounded-md
                      uppercase
                    "
                  >
                    {activeRoleInfo.name}
                  </span>
                </div>

                {/* =========================================
                    ROLE SWITCH
                ========================================= */}

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
                  </div>

                  {/* Assigned roles */}

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

                              {/* Role name */}

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
                                  px-1.5 py-0.5
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

                {/* =========================================
                    ACCOUNT OPTIONS
                ========================================= */}

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

                  {/* Reset */}

                  <button
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
                      <LogOut
                        className="
                          w-4 h-4
                        "
                      />
                      Sign Out / Logout
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            MAIN NAVIGATION
        ================================================= */}

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
              <Clock className="w-4 h-4" />

              {dashboardName}
            </button>

            {/* =================================================
                PROFILE
                -------------------------------------------------
                Har role ke liye available
            ================================================= */}

            <button
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
                -------------------------------------------------
                Sirf USER role
            ================================================= */}

            {capabilities.access && (
              <button
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
                APPROVAL QUEUE
                -------------------------------------------------
                Future mein isko separate tab banana ho to
                yahan se easily kar sakte hain.
            ================================================= */}

            {capabilities.approvals && (
              <button
                onClick={() => onTabChange("approval_queue")}
                className={`
                  nav-button
                  ${
                    activeTab === "approval_queue"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-700 dark:text-slate-300"
                  }
                `}
              >
                <Shield className="w-4 h-4" />
                Approval Queue
              </button>
            )}

            {/* =================================================
                MASTER
                -------------------------------------------------
                Sirf ADMINISTRATOR
            ================================================= */}

            {capabilities.master && (
              <button
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
                -------------------------------------------------
                Sabhi roles ke liye
            ================================================= */}

            <button
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
          PASSWORD MODAL
      ===================================================== */}

      {isPasswordModalOpen && (
        <div
          className="
            fixed inset-0
            bg-slate-950/70
            backdrop-blur-xs
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
            {/* Modal header */}

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
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />

                <span className="font-bold text-sm">
                  Change Account Password
                </span>
              </div>

              <button onClick={() => setIsPasswordModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Password form */}

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
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
                    flex items-center gap-2
                  "
                >
                  <Check className="w-4 h-4" />

                  {passwordSuccess}
                </div>
              )}

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
          NAV BUTTON COMMON STYLE
          -----------------------------------------------------
          Isko CSS/Tailwind utility ke through use kar rahe hain.
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
