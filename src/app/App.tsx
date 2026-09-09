import React, { useState, useEffect } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { APP_ROUTES, getTabFromPath, type AppTab } from "./routes";

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
  getLoginSession,
  setStoredCurrentRole,
  clearLoginSession,
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

// =========================================================
// BACKEND ROLE -> FRONTEND ROLE MAP
// =========================================================
// Database roles use codes such as `user` and `administrator`.
// The existing UI uses frontend role codes such as `applicant` and `admin`.
// Keep this mapping in one place so API, state and Navbar stay consistent.
interface AssignedRoleInfo {
  id: number;
  code: UserRole;
  name: string;
}

const ROLE_META: Record<string, AssignedRoleInfo> = {
  applicant: { id: 1, code: "applicant", name: "User" },
  user: { id: 1, code: "applicant", name: "User" },
  reporting_manager: {
    id: 2,
    code: "supervisor",
    name: "Reporting Manager / Supervisor (P)",
  },
  nodal_officer: { id: 3, code: "lab_nodal", name: "Nodal Officer" },
  lab_nodal: { id: 3, code: "lab_nodal", name: "Nodal Officer" },
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
  it_head: { id: 5, code: "it_officer", name: "IT Head" },
  it_officer: { id: 5, code: "it_officer", name: "IT Head" },
  manager: { id: 6, code: "section_head", name: "Manager" },
  section_head: { id: 6, code: "section_head", name: "Manager" },
  supervisor: { id: 7, code: "supervisor", name: "Supervisor" },
  administrator: { id: 8, code: "admin", name: "Administrator" },
  admin: { id: 8, code: "admin", name: "Administrator" },
};

// Convert frontend role codes into the object structure expected by Navbar.
const toAssignedRoleObjects = (roles: UserRole[]): AssignedRoleInfo[] => {
  return [...new Set(roles)]
    .map((role) => ROLE_META[role])
    .filter((role): role is AssignedRoleInfo => Boolean(role));
};

export default function App() {
  // ==========================================================
  // REACT ROUTER
  // ==========================================================
  //
  // navigate()
  //   Browser URL change karta hai without full page reload.
  //
  // location
  //   Current browser URL provide karta hai.
  //
  // Example:
  //
  // navigate("/admin");
  //
  // URL:
  // http://192.168.205.75:5000/admin
  //
  // ==========================================================

  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // CENTRAL NAVIGATION FUNCTION
  // =========================================================
  // All top-level page navigation goes through this function.
  // It updates BOTH the existing activeTab state and the browser URL.
  // This fixes the original problem where the UI changed but the URL
  // stayed at "/".
  // =========================================================
  const navigateToTab = (tab: AppTab) => {
    // Keep existing components compatible with activeTab.
    setActiveTab(tab);

    // Clear a selected request whenever the user changes top-level pages.
    if (tab !== "my_requests") {
      setSelectedRequisition(null);
    }

    // React Router changes the URL without a full page reload.
    const targetPath = APP_ROUTES[tab];

    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [currentRole, setCurrentRole] = useState<UserRole>("applicant");

  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>(["applicant"]);

  // Actual logged-in account information used by the Navbar.
  // This keeps the person's name separate from the currently selected role.
  const [loggedInUser, setLoggedInUser] = useState<{
    fullName: string;
    email: string;
    phone?: string;
  } | null>(null);

  // The URL is the initial source of truth for the current page.
  const [activeTab, setActiveTab] = useState<AppTab>(
    getTabFromPath(window.location.pathname),
  );

  // =========================================================
  // URL -> ACTIVE TAB SYNCHRONIZATION
  // =========================================================
  // Browser Back / Forward changes location.pathname. Keep the legacy
  // activeTab state synchronized so existing components continue to work.
  // =========================================================
  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    setActiveTab(tab);

    // A top-level route change should never leave an old requisition detail
    // selected, because that would hide the newly requested page.
    if (tab !== "my_requests") {
      setSelectedRequisition(null);
    }
  }, [location.pathname]);

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

  // =========================================================
  // RESTORE LOGIN SESSION
  // =========================================================
  // Authentication persistence is centralized in auth.api.ts.
  useEffect(() => {
    try {
      const session = getLoginSession();

      if (!session) {
        return;
      }

      const user = session.user;

      setLoggedInUser({
        fullName: user.fullName || "User",
        email: user.email || "",
        phone: user.phone || "",
      });

      const rawRoles = Array.isArray(user.roles)
        ? user.roles
            .map((role) => role?.code)
            .filter(Boolean)
            .map((code) => ROLE_META[String(code)]?.code)
            .filter(Boolean)
        : [];

      const restoredRoles: UserRole[] = [
        ...new Set<UserRole>(["applicant", ...rawRoles]),
      ];

      setAssignedRoles(restoredRoles);

      const savedCurrentRole = session.currentRole as UserRole | null;

      const restoredCurrentRole =
        savedCurrentRole && restoredRoles.includes(savedCurrentRole)
          ? savedCurrentRole
          : "applicant";

      setCurrentRole(restoredCurrentRole);
      setIsAuthenticated(true);
    } catch (error) {
      console.warn("Unable to restore saved login session:", error);
      clearLoginSession();
    }
  }, []);

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

  // =========================================================
  // THEME TOGGLE
  // =========================================================

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // =========================================================
  // ACTIVATION URL DETECTION
  // =========================================================

  useEffect(() => {
    const pathname = location.pathname;

    console.log("Current pathname:", pathname);

    // -------------------------------------------------------
    // Check whether current URL is:
    //
    // /activate/TOKEN
    // -------------------------------------------------------

    if (pathname.startsWith("/activate/")) {
      setIsActivationPage(true);

      const token = pathname.split("/activate/")[1]?.split("/")[0];

      console.log("Activation token:", token);

      if (!token) {
        setActivationLoading(false);

        setActivationSuccess(false);

        setActivationMessage("Activation token is missing.");

        return;
      }

      // -----------------------------------------------------
      // ACTIVATE ACCOUNT
      // -----------------------------------------------------

      const activateAccount = async () => {
        try {
          setActivationLoading(true);

          setActivationMessage("");

          console.log("Calling activation API...");

          const response = await fetch(
            `/api/activate/${encodeURIComponent(token)}`,
            {
              method: "GET",

              headers: {
                Accept: "application/json",
              },
            },
          );

          console.log("Activation HTTP status:", response.status);

          const data = await response.json();

          console.log("Activation API response:", data);

          if (response.ok && data.success) {
            setActivationSuccess(true);

            setActivationMessage(
              data.message || "Your account has been activated successfully.",
            );
          } else {
            setActivationSuccess(false);

            setActivationMessage(
              data.message || "Unable to activate your account.",
            );
          }
        } catch (error) {
          console.error("ACTIVATION ERROR:", error);

          setActivationSuccess(false);

          setActivationMessage(
            "Unable to connect to the server. Please make sure the WII Access Management Server is running.",
          );
        } finally {
          setActivationLoading(false);
        }
      };

      activateAccount();
    } else {
      setIsActivationPage(false);
    }
  }, [location.pathname]);

  // =========================================================
  // INITIAL LOAD
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
  // TAB PROTECTION
  // =========================================================

  useEffect(() => {
    // Do not run role protection before authentication has been restored.
    // Otherwise a valid saved Admin session can briefly look like the
    // default Applicant role during the first render and get redirected.
    if (!isAuthenticated) {
      return;
    }

    // Frontend guard for the Master/Admin page.
    // NOTE: Backend authorization is still required for real security.
    if (activeTab === "super_admin_panel" && currentRole !== "admin") {
      navigateToTab("dashboard");
      return;
    }

    // New requests are available only to the User/Applicant persona.
    if (activeTab === "new_request" && currentRole !== "applicant") {
      navigateToTab("dashboard");
    }
  }, [currentRole, activeTab, isAuthenticated]);

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const handleSaveProfile = (updatedProfile: ApplicantProfile) => {
    setApplicantProfile(updatedProfile);

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
    // Keep React state synchronized with the authoritative record returned
    // by the API/workflow layer. Database persistence is handled by the
    // relevant API endpoint before this callback is invoked.
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
  // ACTIVATION PAGE
  // =========================================================

  if (isActivationPage) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* HEADER */}

            <div className="bg-slate-900 text-white px-8 py-8 text-center">
              <h1 className="text-2xl font-bold">
                Wildlife Institute of India
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                Access Management Portal
              </p>
            </div>

            {/* BODY */}

            <div className="px-8 py-10 text-center">
              {activationLoading ? (
                <>
                  <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
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
                  {/* SUCCESS ICON */}

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
                    onClick={() => {
                      // Use React Router instead of manually editing history
                      // and forcing a full browser reload.
                      navigateToTab("auth");
                    }}
                    className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition"
                  >
                    Go to Login
                  </button>
                </>
              ) : (
                <>
                  {/* ERROR ICON */}

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
                    onClick={() => {
                      // Use React Router instead of manually editing history
                      // and forcing a full browser reload.
                      navigateToTab("auth");
                    }}
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
  // LOGIN / AUTH PAGE
  // =========================================================

  if (!isAuthenticated || activeTab === "auth") {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 transition-colors">
        <div className="flex-1">
          <AuthPage
            initialMode="login"
            isAuthenticated={isAuthenticated}
            onNavigateHome={
              isAuthenticated ? () => navigateToTab("dashboard") : undefined
            }
            onLoginSuccess={(
              _initialRole,
              newAssignedRoles,
              updatedProfileData,
            ) => {
              // Login successful: hydrate the complete frontend session.
              // The backend tells us all assigned roles; the first active persona is always User.
              setIsAuthenticated(true);

              // Keep the normal User role (`applicant`) on every account.
              const normalizedRoles: UserRole[] = [
                ...new Set<UserRole>([
                  "applicant",
                  ...(newAssignedRoles || []),
                ]),
              ];

              setAssignedRoles(normalizedRoles);

              // IMPORTANT: A successful LOGIN always starts in User persona.
              // Do NOT use a previously selected Admin role as the login role.
              // Admin/other roles remain available in the Navbar role switcher.
              const loginRole: UserRole = "applicant";

              setCurrentRole(loginRole);
              setStoredCurrentRole(loginRole);

              // Read the authenticated user through the centralized session helper.
              const session = getLoginSession();

              if (session?.user) {
                setLoggedInUser({
                  fullName: session.user.fullName || "User",
                  email: session.user.email || "",
                  phone: session.user.phone || "",
                });
              }

              if (updatedProfileData) {
                const merged = {
                  ...applicantProfile,
                  ...updatedProfileData,
                };

                setApplicantProfile(merged as ApplicantProfile);
                saveApplicantProfile(merged as ApplicantProfile);
              }

              setSelectedRequisition(null);
              navigateToTab("dashboard");
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
        // Navbar expects complete role objects, not only role strings.
        assignedRoles={toAssignedRoleObjects(assignedRoles)}
        onRoleChange={(role) => {
          const nextRole = role as UserRole;

          setCurrentRole(nextRole);
          setStoredCurrentRole(nextRole);

          // Switching persona always starts from that persona's dashboard.
          setSelectedRequisition(null);
          navigateToTab("dashboard");
        }}
        // Give Navbar the real account name/email.
        userProfile={
          {
            ...applicantProfile,
            fullName: loggedInUser?.fullName || applicantProfile.applicantName,
            personalEmail:
              loggedInUser?.email || applicantProfile.personalEmail,
          } as ApplicantProfile
        }
        activeTab={activeTab}
        // Navbar already exposes onTabChange. The App now connects it to
        // React Router so every top-level navigation also updates the URL.
        onTabChange={(tab) => navigateToTab(tab as AppTab)}
        pendingApprovalsCount={pendingApprovalsCount}
        onResetData={handleResetDemoData}
        onSearch={(query) => setSearchQuery(query)}
        onOpenAuth={() => navigateToTab("auth")}
        onLogout={() => {
          clearLoginSession();

          setLoggedInUser(null);
          setIsAuthenticated(false);
          setCurrentRole("applicant");
          setAssignedRoles(["applicant"]);
          setSelectedRequisition(null);
          navigateToTab("auth");
        }}
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
                onNavigateTab={(tab) => {
                  navigateToTab(tab as AppTab);
                }}
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

            {/* MY ACCESS */}

            {activeTab === "new_request" && (
              <MyAccessHub
                applicantProfile={applicantProfile}
                currentRole={currentRole}
                requisitions={requisitions}
                onSelectRequisition={(req) => {
                  setSelectedRequisition(req);
                }}
                onSubmitRequisition={handleCreateRequisition}
                onNavigateTab={(tab) => {
                  navigateToTab(tab as AppTab);
                }}
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
