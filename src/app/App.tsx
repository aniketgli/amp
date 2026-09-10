import React, { useState, useEffect, useRef } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import {
  APP_ROUTES,
  buildLoginPath,
  getSafeReturnTo,
  getTabFromPath,
  isAuthRoute,
  isProtectedRoute,
  type AppTab,
} from "./routes";

import {
  ApplicantProfile,
  RequisitionRecord,
  UserRole,
} from "../types/requisition";

import {
  getSavedApplicantProfile,
  resetToInitialData,
  saveApplicantProfile,
} from "@/lib/storage";

import { createRequisition, getRequisitions } from "@/api/requisitions.api";

import {
  activateUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  type AuthenticatedUser,
} from "@/api/auth.api";

import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { OverviewDashboard } from "../features/dashboard/pages/DashboardPage";
import { MyAccessHub } from "../features/access/pages/AccessHubPage";
import { ProfileForm } from "../features/profile/pages/UserProfilePage";
import { RequisitionList } from "@/features/requisition/pages/RequisitionListPage";
import { RequisitionDetails } from "@/features/requisition/pages/RequisitionDetails";
import { ApprovalQueue } from "@/features/workflow/pages/ApprovalQueuePage";
import { HelpdeskView } from "../features/helpdesk/pages/HelpdeskPage";
import { SuperAdminControlPanel } from "@/features/admin/pages/AdminControlPage";
import { AuthPage } from "../features/auth/pages/AuthPage";

// ============================================================
// BACKEND ROLE -> FRONTEND ROLE MAP
// ============================================================
//
// IMPORTANT:
// Backend/database roles are authoritative.
// This map exists ONLY because the current UI components still
// use the older frontend role names.
//
// Backend:
//   user              -> applicant
//   administrator     -> admin
//
// No role is fabricated for security purposes.
// ============================================================

interface AssignedRoleInfo {
  id: number;
  code: UserRole;
  name: string;
}

const ROLE_META: Record<string, AssignedRoleInfo> = {
  user: {
    id: 1,
    code: "applicant",
    name: "User",
  },

  applicant: {
    id: 1,
    code: "applicant",
    name: "User",
  },

  reporting_manager: {
    id: 2,
    code: "supervisor",
    name: "Reporting Manager / Supervisor (P)",
  },

  supervisor: {
    id: 7,
    code: "supervisor",
    name: "Supervisor",
  },

  nodal_officer: {
    id: 3,
    code: "lab_nodal",
    name: "Nodal Officer",
  },

  lab_nodal: {
    id: 3,
    code: "lab_nodal",
    name: "Nodal Officer",
  },

  associate_nodal_officer: {
    id: 4,
    code: "assoc_lab_nodal",
    name: "Associate Nodal Officer",
  },

  assoc_lab_nodal: {
    id: 4,
    code: "assoc_lab_nodal",
    name: "Associate Nodal Officer",
  },

  it_head: {
    id: 5,
    code: "it_officer",
    name: "IT Head",
  },

  it_officer: {
    id: 5,
    code: "it_officer",
    name: "IT Head",
  },

  manager: {
    id: 6,
    code: "section_head",
    name: "Manager",
  },

  section_head: {
    id: 6,
    code: "section_head",
    name: "Manager",
  },

  hrms_officer: {
    id: 9,
    code: "hrms_officer",
    name: "HRMS Officer",
  },

  administrator: {
    id: 8,
    code: "admin",
    name: "Administrator",
  },

  admin: {
    id: 8,
    code: "admin",
    name: "Administrator",
  },

  super_admin: {
    id: 10,
    code: "super_admin",
    name: "Super Administrator",
  },
};

// ============================================================
// ROLE HELPERS
// ============================================================

const toFrontendRole = (
  backendRoleCode: string | null | undefined,
): UserRole | null => {
  if (!backendRoleCode) {
    return null;
  }

  const role = ROLE_META[String(backendRoleCode).trim().toLowerCase()];

  return role?.code || null;
};

const toAssignedRoleObjects = (roles: UserRole[]): AssignedRoleInfo[] => {
  return [...new Set(roles)]
    .map((role) => ROLE_META[role])
    .filter((role): role is AssignedRoleInfo => Boolean(role));
};

// ============================================================
// AUTH USER -> FRONTEND PROFILE DATA
// ============================================================

const getUserProfileFromAuthenticatedUser = (
  user: AuthenticatedUser,
): Partial<ApplicantProfile> => {
  return {
    applicantName: user.fullName,
    personalEmail: user.email,
    mobileNo: user.phone,
  };
};

// ============================================================
// APP
// ============================================================

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigateToTab = (tab: AppTab) => {
    setActiveTab(tab);

    if (tab !== "my_requests") {
      setSelectedRequisition(null);
    }

    const targetPath = APP_ROUTES[tab];

    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // =========================================================
  // AUTHENTICATION STATE
  // =========================================================

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  /**
   * True until the first backend /api/me verification completes.
   *
   * This prevents the application from incorrectly treating a
   * protected URL as logged out for a short moment on startup.
   */
  const [authInitializing, setAuthInitializing] = useState<boolean>(true);

  const [currentRole, setCurrentRole] = useState<UserRole>("applicant");

  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>([]);

  const [loggedInUser, setLoggedInUser] = useState<{
    fullName: string;
    email: string;
    phone?: string;
  } | null>(null);

  // =========================================================
  // ACTIVE TAB / URL
  // =========================================================

  const [activeTab, setActiveTab] = useState<AppTab>(
    getTabFromPath(window.location.pathname),
  );

  // =========================================================
  // APPLICATION DATA
  // =========================================================

  const [requisitions, setRequisitions] = useState<RequisitionRecord[]>([]);

  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile>(
    getSavedApplicantProfile(),
  );

  const [selectedRequisition, setSelectedRequisition] =
    useState<RequisitionRecord | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");

  // =========================================================
  // THEME
  // =========================================================

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("wii_app_theme");

    if (saved === "dark" || saved === "light") {
      return saved;
    }

    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // =========================================================
  // ACTIVATION STATE
  // =========================================================

  const [isActivationPage, setIsActivationPage] = useState<boolean>(false);

  const [activationLoading, setActivationLoading] = useState<boolean>(false);

  const [activationSuccess, setActivationSuccess] = useState<boolean>(false);

  const [activationMessage, setActivationMessage] = useState<string>("");

  // ============================================================
  // ACTIVATION REQUEST GUARD
  // ============================================================
  //
  // Prevents the same activation token from being submitted more
  // than once during the lifetime of this App instance.
  //
  // This is especially important in React development mode where
  // effects may be intentionally executed more than once.
  //
  // The backend remains authoritative; this is only a frontend
  // duplicate-request prevention mechanism.
  // ============================================================

  const activationInFlightToken = useRef<string | null>(null);

  // =========================================================
  // URL -> ACTIVE TAB
  // =========================================================

  useEffect(() => {
    const tab = getTabFromPath(location.pathname);

    setActiveTab(tab);

    if (tab !== "my_requests") {
      setSelectedRequisition(null);
    }
  }, [location.pathname]);

  // =========================================================
  // RESTORE AUTHENTICATION FROM BACKEND
  // =========================================================
  //
  // NEVER read authentication state from localStorage.
  //
  // Backend /api/me:
  //   HttpOnly cookie
  //       ↓
  //   authenticateToken
  //       ↓
  //   MySQL user
  //       ↓
  //   MySQL roles
  //
  // This is the authoritative authentication restore flow.
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const restoreAuthentication = async () => {
      try {
        const response = await getCurrentUser();

        if (cancelled || !response?.success || !response.user) {
          return;
        }

        const user = response.user;

        const frontendRoles = (user.roles || [])
          .map((role) => toFrontendRole(role?.code))
          .filter((role): role is UserRole => Boolean(role));

        const uniqueRoles = [...new Set<UserRole>(frontendRoles)];

        if (cancelled) {
          return;
        }

        setLoggedInUser({
          fullName: user.fullName || "User",
          email: user.email || "",
          phone: user.phone || "",
        });

        setAssignedRoles(uniqueRoles);

        // Backend-selected current role is authoritative.
        //
        // /api/me currently returns all roles, so use "user"
        // as the preferred persona when present, otherwise
        // use the first DB-assigned frontend role.
        const preferredRole = toFrontendRole(
          user.roles?.find(
            (role) =>
              String(role?.code || "")
                .trim()
                .toLowerCase() === "user",
          )?.code,
        );

        const restoredRole = preferredRole || uniqueRoles[0] || "applicant";

        setCurrentRole(restoredRole);

        setIsAuthenticated(true);

        // Keep the current logged-in user's identity available
        // to the existing UI without treating it as authority.
        setApplicantProfile(
          (previous) =>
            ({
              ...previous,
              ...getUserProfileFromAuthenticatedUser(user),
            }) as ApplicantProfile,
        );
      } catch (error) {
        const status = (
          error as Error & {
            status?: number;
          }
        )?.status;

        // ----------------------------------------------------------
        // IMPORTANT:
        //
        // A failed initial /api/me request only means that there was
        // no existing browser session when the application started.
        //
        // It must NOT forcibly reset authentication state here,
        // because the user may have logged in while this initial
        // request was still pending.
        //
        // The login flow itself is responsible for establishing the
        // authenticated frontend state after successful backend login.
        // ----------------------------------------------------------

        if (status !== 401 && status !== 403) {
          console.warn("Unable to restore backend authentication:", error);
        }
      } finally {
        if (!cancelled) {
          setAuthInitializing(false);
        }
      }
    };

    restoreAuthentication();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // AUTH EXPIRED EVENT
  // =========================================================
  //
  // apiClient emits amp:auth-expired when a protected API
  // returns 401.
  // =========================================================

  useEffect(() => {
    const handleAuthExpired = () => {
      // ----------------------------------------------------------
      // IMPORTANT:
      //
      // /api/me is also used as the initial session probe.
      // A 401 from that probe must not destroy a successful login
      // that may have completed meanwhile.
      //
      // The normal protected-API 401 flow will still log the user
      // out when an authenticated session actually expires.
      // ----------------------------------------------------------

      if (!isAuthenticated) {
        return;
      }

      setIsAuthenticated(false);
      setLoggedInUser(null);
      setAssignedRoles([]);
      setCurrentRole("applicant");
      setSelectedRequisition(null);
    };

    window.addEventListener("amp:auth-expired", handleAuthExpired);

    return () => {
      window.removeEventListener("amp:auth-expired", handleAuthExpired);
    };
  }, [isAuthenticated]);
  // =========================================================
  // AUTHENTICATION + DIRECT URL BUSINESS RULES
  // =========================================================
  //
  // 1. Logged out + protected URL
  //       -> /login?returnTo=<original path>
  //
  // 2. Logged in + /login or /register
  //       -> requested returnTo or dashboard
  //
  // 3. Logged in + protected deep URL
  //       -> remain on requested URL
  //
  // 4. Authorization for sensitive operations remains backend.
  // =========================================================

  useEffect(() => {
    if (authInitializing || isActivationPage) {
      return;
    }

    const pathname = location.pathname;

    // -------------------------------------------------------
    // LOGGED OUT
    // -------------------------------------------------------

    if (!isAuthenticated) {
      if (isProtectedRoute(pathname)) {
        const returnTo = `${pathname}${location.search}${location.hash}`;

        const loginPath = buildLoginPath(returnTo);

        if (
          pathname !== "/login" &&
          window.location.pathname !== loginPath.split("?")[0]
        ) {
          navigate(loginPath, {
            replace: true,
          });
        }
      }

      return;
    }

    // -------------------------------------------------------
    // LOGGED IN
    // -------------------------------------------------------

    if (isAuthRoute(pathname)) {
      const returnTo = getSafeReturnTo(
        new URLSearchParams(location.search).get("returnTo"),
      );

      navigate(returnTo || APP_ROUTES.dashboard, {
        replace: true,
      });

      return;
    }
  }, [
    authInitializing,
    isAuthenticated,
    isActivationPage,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);

  // =========================================================
  // THEME EFFECT
  // =========================================================

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("wii_app_theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((previous) => (previous === "light" ? "dark" : "light"));
  };
  // =========================================================
  // ACTIVATION URL
  // =========================================================

  useEffect(() => {
    const pathname = location.pathname;

    // ---------------------------------------------------------
    // Not an activation route
    // ---------------------------------------------------------

    if (!pathname.startsWith("/activate/")) {
      setIsActivationPage(false);
      setActivationLoading(false);
      return;
    }

    setIsActivationPage(true);
    setActivationSuccess(false);
    setActivationMessage("");

    // ---------------------------------------------------------
    // Extract token
    // ---------------------------------------------------------

    const token = pathname.slice("/activate/".length).split("/")[0]?.trim();

    if (!token) {
      setActivationLoading(false);
      setActivationSuccess(false);
      setActivationMessage("Activation token is missing.");
      return;
    }

    // ---------------------------------------------------------
    // React StrictMode protection
    // ---------------------------------------------------------
    //
    // If the same token is already being processed, DO NOT
    // start another request.
    //
    // IMPORTANT:
    // We also do NOT cancel the original request in cleanup.
    // This allows the original request to finish and update the
    // activation result correctly.
    // ---------------------------------------------------------

    if (activationInFlightToken.current === token) {
      return;
    }

    activationInFlightToken.current = token;

    const activateAccount = async () => {
      const controller = new AbortController();

      // -------------------------------------------------------
      // Safety timeout.
      //
      // The UI must never remain on the spinner indefinitely.
      // -------------------------------------------------------

      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, 15000);

      try {
        setActivationLoading(true);
        setActivationSuccess(false);
        setActivationMessage("");

        // -----------------------------------------------------
        // PUBLIC activation endpoint.
        //
        // No JWT/localStorage dependency.
        // -----------------------------------------------------

        const response = await fetch(
          `/api/activate/${encodeURIComponent(token)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "same-origin",
            signal: controller.signal,
          },
        );

        const contentType = response.headers.get("content-type") || "";

        let data: {
          success?: boolean;
          message?: string;
          alreadyActivated?: boolean;
        } = {};

        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();

          data = {
            success: false,
            message: text || "Invalid response received from the server.",
          };
        }

        // -----------------------------------------------------
        // SUCCESS
        // -----------------------------------------------------

        if (response.ok && data.success === true) {
          setActivationSuccess(true);

          setActivationMessage(
            data.message ||
              (data.alreadyActivated
                ? "Your account is already activated. You can now log in."
                : "Your account has been activated successfully."),
          );

          return;
        }

        // -----------------------------------------------------
        // FAILED
        // -----------------------------------------------------

        setActivationSuccess(false);

        setActivationMessage(
          data.message || "Invalid or expired activation link.",
        );
      } catch (error) {
        console.error("ACTIVATION ERROR:", error);

        // -----------------------------------------------------
        // Timeout
        // -----------------------------------------------------

        if (error instanceof DOMException && error.name === "AbortError") {
          setActivationSuccess(false);

          setActivationMessage(
            "The activation server did not respond in time. Please try again.",
          );

          return;
        }

        // -----------------------------------------------------
        // Network/server error
        // -----------------------------------------------------

        setActivationSuccess(false);

        setActivationMessage(
          "Unable to connect to the activation server. Please try again.",
        );
      } finally {
        window.clearTimeout(timeoutId);

        setActivationLoading(false);

        // -----------------------------------------------------
        // Clear the guard only after the request has completely
        // finished.
        // -----------------------------------------------------

        if (activationInFlightToken.current === token) {
          activationInFlightToken.current = null;
        }
      }
    };

    void activateAccount();

    // ---------------------------------------------------------
    // IMPORTANT:
    //
    // Do NOT abort/cancel the activation request here.
    //
    // React StrictMode may call this cleanup immediately during
    // development and then execute the effect again.
    // ---------------------------------------------------------
  }, [location.pathname]);

  // =========================================================
  // LOAD REQUISITIONS
  // =========================================================

  useEffect(() => {
    if (!isAuthenticated) {
      setRequisitions([]);
      return;
    }

    let cancelled = false;

    const loadRequisitions = async () => {
      try {
        const response = await getRequisitions();

        if (!cancelled) {
          setRequisitions(response.requisitions || []);
        }
      } catch (error) {
        console.error("Failed to load requisitions from API:", error);

        if (!cancelled) {
          setRequisitions([]);
        }
      }
    };

    loadRequisitions();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // =========================================================
  // FRONTEND ROUTE UX GUARDS
  // =========================================================
  //
  // These are NOT security controls.
  // Backend authorization remains authoritative.
  // =========================================================

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Admin/super-admin UI route.
    if (
      activeTab === "super_admin_panel" &&
      currentRole !== "admin" &&
      currentRole !== "super_admin"
    ) {
      navigateToTab("dashboard");

      return;
    }

    // New request is available to the User/Applicant persona.
    if (activeTab === "new_request" && currentRole !== "applicant") {
      navigateToTab("dashboard");
    }
  }, [currentRole, activeTab, isAuthenticated]);

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSaveProfile = (updatedProfile: ApplicantProfile) => {
    setApplicantProfile(updatedProfile);

    // Existing profile storage remains temporarily for the
    // profile-module migration. It is NOT authentication state.
    saveApplicantProfile(updatedProfile);
  };

  // =========================================================
  // CREATE REQUISITION
  // =========================================================

  const handleCreateRequisition = async (newRecord: RequisitionRecord) => {
    try {
      const response = await createRequisition({
        requisitionType: newRecord.type,

        requisitionMode: newRecord.itHrmsDetails?.requisitionMode || "new",

        renewalReason: newRecord.itHrmsDetails?.renewalReason || null,

        remarks:
          newRecord.history?.[newRecord.history.length - 1]?.comments || null,

        itHrmsDetails: newRecord.itHrmsDetails
          ? {
              requestEmail: newRecord.itHrmsDetails.requestEmail,

              requestedEmailGroups:
                newRecord.itHrmsDetails.requestedEmailGroups,

              requestInternet: newRecord.itHrmsDetails.requestInternet,

              deviceType: newRecord.itHrmsDetails.deviceType,

              macAddress: newRecord.itHrmsDetails.macAddress,

              requestHrmsPms: newRecord.itHrmsDetails.requestHrmsPms,

              requestBiometric: newRecord.itHrmsDetails.requestBiometric,
            }
          : undefined,

        labFacilities: newRecord.labAccessDetails?.map((lab) => ({
          facilityId: lab.labId,

          facilityName: lab.labName,

          purposeEquipment: lab.purposeEquipment || null,

          fromDate: lab.fromDate || null,

          toDate: lab.toDate || null,

          hasBiometricId: lab.hasBiometricId || false,

          biometricIdNumber: lab.biometricIdNumber || null,

          assignedLabPassId: lab.assignedLabPassId || null,

          nodalApprovalStatus: lab.nodalApprovalStatus || "pending",

          remarks: lab.nodalComments || null,

          reviewedById: null,

          reviewedBy: lab.nodalOfficerName || null,

          reviewedAt: lab.actionDate ? `${lab.actionDate} 00:00:00` : null,

          nodalOfficerName: lab.nodalOfficerName || null,

          actionDate: lab.actionDate || null,
        })),
      });

      const refreshed = await getRequisitions();

      setRequisitions(refreshed.requisitions || []);

      const created =
        refreshed.requisitions?.find((item) => item.id === response.id) || null;

      setSelectedRequisition(created);

      navigateToTab("my_requests");
    } catch (error) {
      console.error("Failed to create requisition through API:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to create requisition.",
      );
    }
  };

  // =========================================================
  // UPDATE REQUISITION
  // =========================================================

  const handleUpdateRequisition = (updatedRecord: RequisitionRecord) => {
    setRequisitions((previous) =>
      previous.map((record) =>
        record.id === updatedRecord.id ? updatedRecord : record,
      ),
    );

    if (selectedRequisition && selectedRequisition.id === updatedRecord.id) {
      setSelectedRequisition(updatedRecord);
    }
  };

  // =========================================================
  // RESET DEMO DATA
  // =========================================================
  //
  // Existing legacy/demo feature is retained temporarily.
  // It will be removed in the later cleanup phase.
  // =========================================================

  const handleResetDemoData = () => {
    if (
      window.confirm("Reset system data back to default sample requisitions?")
    ) {
      const initial = resetToInitialData();

      setRequisitions(initial);

      setSelectedRequisition(null);

      navigateToTab("dashboard");
    }
  };

  // =========================================================
  // PENDING APPROVALS
  // =========================================================

  const pendingApprovalsCount = requisitions.filter(
    (r) =>
      r.status !== "approved_provisioned" &&
      r.status !== "rejected" &&
      r.status !== "deactivated",
  ).length;

  // =========================================================
  // AUTH CALLBACK
  // =========================================================
  //
  // Login has already been completed by AuthPage.
  //
  // IMPORTANT:
  // - JWT is NOT read by frontend.
  // - JWT is NOT stored in localStorage/sessionStorage.
  // - /api/me is the backend/database source of truth.
  // - Default backend role "user" maps to the existing
  //   frontend "applicant" persona.
  // - Default "user" login always redirects to Dashboard.
  // =========================================================

  const handleLoginSuccess = (
    loginUserData: AuthenticatedUser,
    backendCurrentRole?: string,
  ) => {
    // ---------------------------------------------------------
    // BACKEND ROLES -> FRONTEND UI ROLES
    // ---------------------------------------------------------

    const frontendRoles = (loginUserData.roles || [])
      .map((role) => toFrontendRole(role?.code))
      .filter((role): role is UserRole => Boolean(role));

    const uniqueRoles = [...new Set<UserRole>(frontendRoles)];

    // ---------------------------------------------------------
    // LOGGED-IN USER
    // ---------------------------------------------------------

    setLoggedInUser({
      fullName: loginUserData.fullName || "User",
      email: loginUserData.email || "",
      phone: loginUserData.phone || "",
    });

    setAssignedRoles(uniqueRoles);

    // ---------------------------------------------------------
    // CHECK BACKEND DEFAULT USER ROLE
    // ---------------------------------------------------------

    const normalizedBackendCurrentRole = String(backendCurrentRole || "")
      .trim()
      .toLowerCase();

    const hasDatabaseUserRole = Boolean(
      loginUserData.roles?.some(
        (role) =>
          String(role?.code || "")
            .trim()
            .toLowerCase() === "user",
      ),
    );

    // ---------------------------------------------------------
    // DEFAULT USER ROLE
    // ---------------------------------------------------------
    //
    // Backend/database:
    //
    //     user
    //
    // Existing frontend UI:
    //
    //     applicant
    //
    // Therefore:
    //
    //     DB user -> UI applicant -> Dashboard
    // ---------------------------------------------------------

    const isDefaultUserLogin =
      normalizedBackendCurrentRole === "user" || hasDatabaseUserRole;

    const requestedFrontendRole = toFrontendRole(normalizedBackendCurrentRole);

    const loginRole: UserRole = isDefaultUserLogin
      ? "applicant"
      : requestedFrontendRole || uniqueRoles[0] || "applicant";

    setCurrentRole(loginRole);

    // ---------------------------------------------------------
    // AUTHENTICATED
    // ---------------------------------------------------------

    setIsAuthenticated(true);

    // ---------------------------------------------------------
    // PROFILE DATA
    // ---------------------------------------------------------

    const profileData = getUserProfileFromAuthenticatedUser(loginUserData);

    const mergedProfile = {
      ...applicantProfile,
      ...profileData,
    };

    setApplicantProfile(mergedProfile as ApplicantProfile);

    // This is only the existing profile cache.
    // It is NOT authentication or authorization state.
    saveApplicantProfile(mergedProfile as ApplicantProfile);

    setSelectedRequisition(null);

    // ---------------------------------------------------------
    // FINAL LOGIN REDIRECT
    // ---------------------------------------------------------
    //
    // Newly registered/default users:
    //
    //     Login successful
    //            ↓
    //       DB role = user
    //            ↓
    //     UI role = applicant
    //            ↓
    //        Dashboard (/)
    //
    // replace=true prevents the login page from remaining
    // immediately in browser history.
    // ---------------------------------------------------------

    if (isDefaultUserLogin) {
      navigate(APP_ROUTES.dashboard, {
        replace: true,
      });

      return;
    }

    // ---------------------------------------------------------
    // OTHER AUTHENTICATED ROLES
    // ---------------------------------------------------------
    //
    // Existing non-user role behaviour remains available.
    // Dashboard is the safe default if no specific role route
    // is defined.
    // ---------------------------------------------------------

    navigate(APP_ROUTES.dashboard, {
      replace: true,
    });
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    try {
      await logoutUser();

      setLoggedInUser(null);

      setIsAuthenticated(false);

      setCurrentRole("applicant");

      setAssignedRoles([]);

      setSelectedRequisition(null);

      setRequisitions([]);

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("LOGOUT ERROR:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to complete logout. Please try again.",
      );
    }
  };

  // =========================================================
  // AUTH INITIALIZATION UI
  // =========================================================

  if (authInitializing && !isActivationPage) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin" />

          <h2 className="text-lg font-bold text-slate-800">
            Verifying Session...
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Please wait while the WII Access Management Portal verifies your
            account.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // ACTIVATION PAGE
  // =========================================================

  if (isActivationPage) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-slate-900 text-white px-8 py-8 text-center">
              <h1 className="text-2xl font-bold">
                Wildlife Institute of India
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                Access Management Portal
              </p>
            </div>

            <div className="px-8 py-10 text-center">
              {activationLoading ? (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Activating Your Account...
                  </h2>

                  <p className="mt-3 text-sm text-slate-500">
                    Please wait while we activate your WII Access Management
                    Portal account.
                  </p>
                </>
              ) : activationSuccess ? (
                <>
                  <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                    <span className="text-3xl text-emerald-600">✓</span>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800">
                    Account Activated Successfully
                  </h2>

                  <p className="mt-4 text-slate-600">{activationMessage}</p>

                  <p className="mt-3 text-sm text-slate-500">
                    You can now login to the WII Access Management Portal.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/login", {
                        replace: true,
                      })
                    }
                    className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Go to Login
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                    <span className="text-3xl text-red-600">!</span>
                  </div>

                  <h2 className="text-2xl font-bold text-slate-800">
                    Activation Failed
                  </h2>

                  <p className="mt-4 text-red-600">{activationMessage}</p>

                  <p className="mt-3 text-sm text-slate-500">
                    The activation link may be invalid, expired, or already
                    used.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/login", {
                        replace: true,
                      })
                    }
                    className="mt-8 w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Go to Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // LOGIN / REGISTER PAGE
  // =========================================================

  if (!isAuthenticated || activeTab === "auth") {
    const initialMode =
      location.pathname === "/register" ? "register" : "login";

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 transition-colors">
        <div className="flex-1">
          <AuthPage
            initialMode={initialMode}
            isAuthenticated={isAuthenticated}
            onNavigateHome={
              isAuthenticated ? () => navigateToTab("dashboard") : undefined
            }
            onLoginSuccess={(
              _initialRole,
              _newAssignedRoles,
              _updatedProfileData,
            ) => {
              // ------------------------------------------------
              // IMPORTANT:
              //
              // AuthPage has already called the login API.
              // We intentionally do not read or store a browser
              // token here.
              //
              // Reload /api/me so the backend remains the
              // source of truth.
              // ------------------------------------------------

              getCurrentUser()
                .then((response) => {
                  if (response.success && response.user) {
                    handleLoginSuccess(
                      response.user,
                      // The login API itself selected the current
                      // role, but AuthPage's current callback does
                      // not expose it yet. /api/me is therefore used
                      // to restore the assigned DB roles.
                      undefined,
                    );
                  }
                })
                .catch((error) => {
                  console.error(
                    "Unable to reload authenticated user after login:",
                    error,
                  );

                  setIsAuthenticated(false);

                  setLoggedInUser(null);

                  setAssignedRoles([]);
                });
            }}
          />
        </div>

        <footer className="py-4 border-t border-slate-800 bg-slate-900 text-slate-400 text-[11px] text-center font-medium">
          © {new Date().getFullYear()} Wildlife Institute of India. All rights
          reserved.
        </footer>
      </div>
    );
  }

  // =========================================================
  // AUTHENTICATED APPLICATION
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 transition-colors">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <Navbar
        currentRole={currentRole}
        assignedRoles={toAssignedRoleObjects(assignedRoles)}
        onRoleChange={(role) => {
          const nextRole = role as UserRole;

          // Role switching is currently a frontend persona
          // change only. Sensitive backend operations continue
          // to validate actual DB-assigned roles.
          setCurrentRole(nextRole);

          setSelectedRequisition(null);

          navigateToTab("dashboard");
        }}
        userProfile={
          {
            ...applicantProfile,
            fullName: loggedInUser?.fullName || applicantProfile.applicantName,
            personalEmail:
              loggedInUser?.email || applicantProfile.personalEmail,
          } as ApplicantProfile
        }
        activeTab={activeTab}
        onTabChange={(tab) => navigateToTab(tab as AppTab)}
        pendingApprovalsCount={pendingApprovalsCount}
        onResetData={handleResetDemoData}
        onSearch={(query) => setSearchQuery(query)}
        onOpenAuth={() => navigateToTab("auth")}
        onLogout={handleLogout}
      />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {selectedRequisition ? (
          <RequisitionDetails
            requisition={selectedRequisition}
            currentRole={currentRole}
            onBack={() => setSelectedRequisition(null)}
            onUpdateRequisition={handleUpdateRequisition}
          />
        ) : (
          <>
            {/* DASHBOARD */}

            {activeTab === "dashboard" && (
              <OverviewDashboard
                requisitions={requisitions}
                currentRole={currentRole}
                onNavigateTab={(tab) => navigateToTab(tab as AppTab)}
                onSelectRequisition={(req) => {
                  setSelectedRequisition(req);
                }}
                onUpdateRequisition={handleUpdateRequisition}
              />
            )}

            {/* PROFILE */}

            {activeTab === "profile" && (
              <ProfileForm
                initialProfile={applicantProfile}
                currentRole={currentRole}
                onSaveProfile={handleSaveProfile}
              />
            )}

            {/* MY ACCESS / NEW REQUEST */}

            {activeTab === "new_request" && (
              <MyAccessHub
                applicantProfile={applicantProfile}
                currentRole={currentRole}
                requisitions={requisitions}
                onSelectRequisition={(req) => {
                  setSelectedRequisition(req);
                }}
                onSubmitRequisition={handleCreateRequisition}
                onNavigateTab={(tab) => navigateToTab(tab as AppTab)}
              />
            )}

            {/* MY REQUESTS */}

            {activeTab === "my_requests" && (
              <RequisitionList
                requisitions={requisitions}
                currentRole={currentRole}
                onSelectRequisition={(req) => {
                  setSelectedRequisition(req);
                }}
                onUpdateRequisition={handleUpdateRequisition}
                onCreateNew={() => navigateToTab("new_request")}
                searchQuery={searchQuery}
                initialTab="all"
              />
            )}

            {/* APPROVAL QUEUE */}

            {activeTab === "approval_queue" && (
              <ApprovalQueue
                requisitions={requisitions}
                currentRole={currentRole}
                onSelectRequisition={(req) => {
                  setSelectedRequisition(req);
                }}
                onUpdateRequisition={handleUpdateRequisition}
                onCreateNew={() => navigateToTab("new_request")}
                searchQuery={searchQuery}
              />
            )}

            {/* HELPDESK */}

            {activeTab === "helpdesk" && <HelpdeskView />}

            {/* SUPER ADMIN */}

            {activeTab === "super_admin_panel" && (
              <SuperAdminControlPanel
                requisitions={requisitions}
                onUpdateRequisition={handleUpdateRequisition}
                onRoleChange={(role) => setCurrentRole(role)}
              />
            )}
          </>
        )}
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      {isAuthenticated && <Footer />}
    </div>
  );
}
