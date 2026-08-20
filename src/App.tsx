import React, { useState, useEffect } from "react";

import {
  ApplicantProfile,
  RequisitionRecord,
  UserRole,
} from "./types/requisition";

import {
  createNewRequisition,
  getSavedApplicantProfile,
  getStoredRequisitions,
  resetToInitialData,
  saveApplicantProfile,
  updateRequisitionRecord,
} from "./utils/storage";

import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { OverviewDashboard } from "./components/dashboard/DashboardPage";
import { MyAccessHub } from "./components/applicant/AccessHubPage";
import { ProfileForm } from "./components/applicant/UserProfilePage";
import { RequisitionList } from "./components/requisition/RequisitionListPage";
import { RequisitionDetails } from "./components/requisition/RequisitionDetails";
import { ApprovalQueue } from "./components/workflow/ApprovalQueuePage";
import { HelpdeskView } from "./components/helpdesk/HelpdeskPage";
import { SuperAdminControlPanel } from "./components/admin/AdminControlPage";
import { AuthPage } from "./components/auth/AuthPage";

export default function App() {
  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [currentRole, setCurrentRole] = useState<UserRole>("applicant");

  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>(["applicant"]);

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "profile"
    | "my_requests"
    | "new_request"
    | "approval_queue"
    | "helpdesk"
    | "super_admin_panel"
    | "auth"
  >("dashboard");

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
    const pathname = window.location.pathname;

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
            `http://localhost:5000/api/activate/${encodeURIComponent(token)}`,
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
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const loaded = getStoredRequisitions();

    setRequisitions(loaded);
  }, []);

  // =========================================================
  // TAB PROTECTION
  // =========================================================

  useEffect(() => {
    if (activeTab === "super_admin_panel" && currentRole !== "admin") {
      setActiveTab("dashboard");
    }
  }, [currentRole, activeTab]);

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

  const handleCreateRequisition = (newRecord: RequisitionRecord) => {
    const updated = createNewRequisition(newRecord);

    setRequisitions(updated);

    setSelectedRequisition(newRecord);

    setActiveTab("my_requests");
  };

  // =========================================================
  // UPDATE REQUISITION
  // =========================================================

  const handleUpdateRequisition = (updatedRecord: RequisitionRecord) => {
    const updated = updateRequisitionRecord(updatedRecord);

    setRequisitions(updated);

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

      setActiveTab("dashboard");
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
                      window.history.replaceState({}, "", "/");

                      window.location.reload();
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
                      window.history.replaceState({}, "", "/");

                      window.location.reload();
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
            currentRole={currentRole}
            initialMode="login"
            isAuthenticated={isAuthenticated}
            onNavigateHome={
              isAuthenticated ? () => setActiveTab("dashboard") : undefined
            }
            onLoginSuccess={(
              initialRole,
              newAssignedRoles,
              updatedProfileData,
            ) => {
              setIsAuthenticated(true);

              setCurrentRole("applicant");

              setAssignedRoles(
                newAssignedRoles && newAssignedRoles.length > 0
                  ? newAssignedRoles
                  : ["applicant"],
              );

              if (updatedProfileData) {
                const merged = {
                  ...applicantProfile,
                  ...updatedProfileData,
                };

                setApplicantProfile(merged as ApplicantProfile);

                saveApplicantProfile(merged as ApplicantProfile);
              }

              setActiveTab("dashboard");
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
        assignedRoles={assignedRoles}
        onRoleChange={(role) => {
          setCurrentRole(role);

          setActiveTab("dashboard");
        }}
        userProfile={applicantProfile}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);

          if (tab !== "my_requests") {
            setSelectedRequisition(null);
          }
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        onResetData={handleResetDemoData}
        onSearch={(query) => setSearchQuery(query)}
        onOpenAuth={() => setActiveTab("auth")}
        onLogout={() => {
          setIsAuthenticated(false);

          setCurrentRole("applicant");

          setAssignedRoles(["applicant"]);

          setActiveTab("auth");
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
                  setActiveTab(tab);
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
                  setActiveTab(tab as any);
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
                onCreateNew={() => setActiveTab("new_request")}
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
                onCreateNew={() => setActiveTab("new_request")}
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
