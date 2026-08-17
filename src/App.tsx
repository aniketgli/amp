import React, { useState, useEffect } from 'react';
import {
  ApplicantProfile,
  RequisitionRecord,
  UserRole,
} from './types/requisition';
import {
  createNewRequisition,
  getSavedApplicantProfile,
  getStoredRequisitions,
  resetToInitialData,
  saveApplicantProfile,
  updateRequisitionRecord,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { OverviewDashboard } from './components/dashboard/DashboardPage';
import { MyAccessHub } from './components/applicant/AccessHubPage';
import { ProfileForm } from './components/applicant/UserProfilePage';
import { RequisitionList } from './components/requisition/RequisitionListPage';
import { RequisitionDetails } from './components/requisition/RequisitionDetails';
import { ApprovalQueue } from './components/workflow/ApprovalQueuePage';
import { HelpdeskView } from './components/helpdesk/HelpdeskPage';
import { SuperAdminControlPanel } from './components/admin/AdminControlPage';
import { AuthPage } from './components/auth/AuthPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('applicant');
  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>(['applicant']);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'my_requests' | 'new_request' | 'approval_queue' | 'helpdesk' | 'super_admin_panel' | 'auth'>('dashboard');
  
  const [requisitions, setRequisitions] = useState<RequisitionRecord[]>([]);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfile>(getSavedApplicantProfile());
  const [selectedRequisition, setSelectedRequisition] = useState<RequisitionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Global Theme State ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('wii_app_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('wii_app_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Initial load
  useEffect(() => {
    const loaded = getStoredRequisitions();
    setRequisitions(loaded);
  }, []);

  // Tab protection based on active user role
  useEffect(() => {
    if (activeTab === 'super_admin_panel' && currentRole !== 'admin') {
      setActiveTab('dashboard');
    }
  }, [currentRole, activeTab]);

  const handleSaveProfile = (updatedProfile: ApplicantProfile) => {
    setApplicantProfile(updatedProfile);
    saveApplicantProfile(updatedProfile);
  };

  const handleCreateRequisition = (newRecord: RequisitionRecord) => {
    const updated = createNewRequisition(newRecord);
    setRequisitions(updated);
    setSelectedRequisition(newRecord);
    setActiveTab('my_requests');
  };

  const handleUpdateRequisition = (updatedRecord: RequisitionRecord) => {
    const updated = updateRequisitionRecord(updatedRecord);
    setRequisitions(updated);
    if (selectedRequisition && selectedRequisition.id === updatedRecord.id) {
      setSelectedRequisition(updatedRecord);
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset system data back to default sample requisitions?')) {
      const initial = resetToInitialData();
      setRequisitions(initial);
      setSelectedRequisition(null);
      setActiveTab('dashboard');
    }
  };

  // Count pending approvals for badge
  const pendingApprovalsCount = requisitions.filter(
    (r) => r.status !== 'approved_provisioned' && r.status !== 'rejected' && r.status !== 'deactivated'
  ).length;

  // Main Page Constraint: If user is not authenticated OR Auth tab is active, render full-screen AuthPage
  if (!isAuthenticated || activeTab === 'auth') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 transition-colors">
        <div className="flex-1">
          <AuthPage
            currentRole={currentRole}
            initialMode="login"
            isAuthenticated={isAuthenticated}
            onNavigateHome={isAuthenticated ? () => setActiveTab('dashboard') : undefined}
            onLoginSuccess={(initialRole, newAssignedRoles, updatedProfileData) => {
              setIsAuthenticated(true);
              setCurrentRole('applicant'); // Requirement 1: Always default to normal user ('applicant') role on login
              setAssignedRoles(newAssignedRoles && newAssignedRoles.length > 0 ? newAssignedRoles : ['applicant']);
              if (updatedProfileData) {
                const merged = { ...applicantProfile, ...updatedProfileData };
                setApplicantProfile(merged as ApplicantProfile);
                saveApplicantProfile(merged as ApplicantProfile);
              }
              setActiveTab('dashboard');
            }}
          />
        </div>
        <footer className="py-4 border-t border-slate-800 bg-slate-900 text-slate-400 text-[11px] text-center font-medium">
          © {new Date().getFullYear()} Wildlife Institute of India. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 transition-colors">
      {/* Top Navbar Header */}
      <Navbar
        currentRole={currentRole}
        assignedRoles={assignedRoles}
        onRoleChange={(role) => {
          setCurrentRole(role);
          setActiveTab('dashboard');
        }}
        userProfile={applicantProfile}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'my_requests') setSelectedRequisition(null);
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        onResetData={handleResetDemoData}
        onSearch={(query) => setSearchQuery(query)}
        onOpenAuth={() => setActiveTab('auth')}
        onLogout={() => {
          setIsAuthenticated(false);
          setCurrentRole('applicant');
          setAssignedRoles(['applicant']);
          setActiveTab('auth');
        }}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* If a specific requisition is opened for detailed inspection */}
        {selectedRequisition ? (
          <RequisitionDetails
            requisition={selectedRequisition}
            currentRole={currentRole}
            onBack={() => setSelectedRequisition(null)}
            onUpdateRequisition={handleUpdateRequisition}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <OverviewDashboard
                requisitions={requisitions}
                currentRole={currentRole}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                }}
                onSelectRequisition={(req) => setSelectedRequisition(req)}
                onUpdateRequisition={handleUpdateRequisition}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileForm
                initialProfile={applicantProfile}
                currentRole={currentRole}
                onSaveProfile={handleSaveProfile}
              />
            )}

            {/* MY ACCESS TAB (Shows MyAccessHub - Access Catalogue & Credentials) */}
            {activeTab === 'new_request' && (
              <MyAccessHub
                applicantProfile={applicantProfile}
                currentRole={currentRole}
                requisitions={requisitions}
                onSelectRequisition={(req) => setSelectedRequisition(req)}
                onSubmitRequisition={handleCreateRequisition}
                onNavigateTab={(tab) => setActiveTab(tab as any)}
              />
            )}

            {activeTab === 'my_requests' && (
              <RequisitionList
                requisitions={requisitions}
                currentRole={currentRole}
                onSelectRequisition={(req) => setSelectedRequisition(req)}
                onUpdateRequisition={handleUpdateRequisition}
                onCreateNew={() => setActiveTab('new_request')}
                searchQuery={searchQuery}
                initialTab="all"
              />
            )}

            {activeTab === 'approval_queue' && (
              <ApprovalQueue
                requisitions={requisitions}
                currentRole={currentRole}
                onSelectRequisition={(req) => setSelectedRequisition(req)}
                onUpdateRequisition={handleUpdateRequisition}
                onCreateNew={() => setActiveTab('new_request')}
                searchQuery={searchQuery}
              />
            )}

            {activeTab === 'helpdesk' && <HelpdeskView />}

            {activeTab === 'super_admin_panel' && (
              <SuperAdminControlPanel
                requisitions={requisitions}
                onUpdateRequisition={handleUpdateRequisition}
                onRoleChange={(role) => setCurrentRole(role)}
              />
            )}
          </>
        )}
      </main>

      {/* Redesigned Official Footer - Only rendered when authenticated */}
      {isAuthenticated && <Footer />}
    </div>
  );
}
