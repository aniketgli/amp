import React, { useState, useEffect } from 'react';
import { ApplicantProfile, OfficeOrderVerificationResult, UserRole } from '../../types/requisition';
import { OFFICIAL_ROLES } from '../../data/initialData';
import { OfficeOrderVerificationCard } from './OfficeOrderVerificationCard';
import { recordSecurityAuditLog } from '../../utils/auditLogger';
import {
  User,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  CreditCard,
  Briefcase,
  MapPin,
  Camera,
  FileText,
  X,
  Upload,
  AlertCircle,
  Search,
  ChevronDown,
  UserCheck,
  BadgeCheck,
  Sparkles,
  Building2,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';

interface ProfileFormProps {
  initialProfile: ApplicantProfile;
  currentRole?: UserRole;
  onSaveProfile: (profile: ApplicantProfile) => void;
}

// Sample Institute Database of User Profiles for Directory Lookup
const SAMPLE_USER_PROFILES: Record<string, ApplicantProfile> = {
  'USR-001': {
    salutation: 'Dr.',
    applicantName: 'Pankaj Kumar',
    employmentType: 'Permanent',
    gender: 'Male',
    dateOfBirth: '1970-05-12',
    bloodGroup: 'A+',
    mobileNo: '9810293847',
    personalEmail: 'dg.pankaj@wii.gov.in',
    address: 'Directorate Bungalow #1, WII Campus',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248001',
    bankName: 'State Bank of India (WII Main Branch)',
    ifscCode: 'SBIN0000123',
    accountNo: '10928374651',
    accountNoBank: '10928374651 (SBI)',
    panNo: 'PKMPS9912A',
    designation: 'Director General & Central Security Admin',
    dateOfJoining: '2005-04-01',
    numberOfLeavesPerYear: '30 Days',
    validUpTo: '2030-05-31 (Central Cadre)',
    departmentCellProject: 'Directorate General & Central IT Cell',
    supervisingOfficerName: 'Governing Council (MoEFCC)',
    officeOrderFileName: 'WII_Director_General_Notification_2025.pdf',
    biometricId: 'WII-BIO-1001',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  },
  'USR-002': {
    salutation: 'Dr.',
    applicantName: 'Ananya Sharma',
    employmentType: 'Project employee',
    gender: 'Female',
    dateOfBirth: '1995-06-14',
    bloodGroup: 'O+',
    mobileNo: '9876512345',
    personalEmail: 'ananya.sharma@wii.gov.in',
    address: 'WII Campus Quarters, Chandrabani',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248001',
    bankName: 'HDFC Bank (Dehradun Main Branch)',
    ifscCode: 'HDFC0000123',
    accountNo: '50100234192',
    accountNoBank: '50100234192 (HDFC Bank)',
    panNo: 'ASHPR1928K',
    designation: 'Senior Research Fellow',
    dateOfJoining: '2026-02-01',
    numberOfLeavesPerYear: '12 Days',
    validUpTo: '2028-01-31',
    departmentCellProject: 'Dept. of Landscape Level Planning & GIS',
    supervisingOfficerName: 'Dr. R. K. Singh (Scientist - F / PI)',
    officeOrderFileName: 'WII_Office_Order_Engagement_2026.pdf',
    verifiedOfficeOrderLogs: [
      {
        id: 'LOG-002891',
        orderNumber: 'WII/ADMN/2026/ORD-891',
        orderDate: '2026-01-25',
        fileName: 'WII_Office_Order_Engagement_2026.pdf',
        designation: 'Senior Research Fellow',
        departmentCellProject: 'Dept. of Landscape Level Planning & GIS',
        supervisingOfficerName: 'Dr. R. K. Singh (Scientist - F / PI)',
        validFrom: '2026-02-01',
        validUpTo: '2028-01-31',
        verifiedAt: '2026-02-01T10:30:00Z',
        verifiedBy: 'AI Vision OCR Engine (WII Central Estt.)',
        status: 'active',
        monthlyEmoluments: '₹42,000/- per month + HRA',
        verificationConfidence: '100% OCR AI Verified',
        extractedTextSummary: 'Official Sanction Order issued by Wildlife Institute of India sanctioning the engagement of Dr. Ananya Sharma as Senior Research Fellow under DST Project with Dr. R. K. Singh as PI.',
      },
      {
        id: 'LOG-001420',
        orderNumber: 'WII/DST-PROJ/2024/ORD-142',
        orderDate: '2024-01-15',
        fileName: 'WII_JRF_Appointment_Order_2024.pdf',
        designation: 'Junior Research Fellow (JRF)',
        departmentCellProject: 'Dept. of Landscape Level Planning & GIS',
        supervisingOfficerName: 'Dr. R. K. Singh (Scientist - F / PI)',
        validFrom: '2024-02-01',
        validUpTo: '2026-01-31',
        verifiedAt: '2024-02-01T11:15:00Z',
        verifiedBy: 'Establishment Officer (Physical Verification)',
        status: 'superseded',
        monthlyEmoluments: '₹37,000/- per month + HRA',
        verificationConfidence: '100% Verified (Historical)',
        extractedTextSummary: 'Initial Sanction Order appointing Ms. Ananya Sharma as Junior Research Fellow (JRF) for 2 years tenure.',
      },
    ],
    biometricId: 'WII-BIO-1088',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  },
  'EMP-102': {
    salutation: 'Mr.',
    applicantName: 'Vikramaditya Roy',
    employmentType: 'Intern',
    gender: 'Male',
    dateOfBirth: '1997-09-22',
    bloodGroup: 'B+',
    mobileNo: '9411188321',
    personalEmail: 'vikram.roy@wii.gov.in',
    address: 'Subhash Nagar, Near IT Park',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248013',
    bankName: 'State Bank of India (WII Branch)',
    ifscCode: 'SBIN0002145',
    accountNo: '30988123451',
    accountNoBank: '30988123451 (SBI WII Branch)',
    panNo: 'BSKPR8821L',
    designation: 'Junior Research Fellow (JRF)',
    dateOfJoining: '2025-11-15',
    numberOfLeavesPerYear: '12 Days',
    validUpTo: '2027-11-14',
    departmentCellProject: 'Eco-Restoration & Wildlife Conservation',
    supervisingOfficerName: 'Dr. R. K. Singh (Scientist - F / PI)',
    officeOrderFileName: 'WII_JRF_Sanction_Order_2025.pdf',
    biometricId: 'WII-BIO-1092',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  'EMP-103': {
    salutation: 'Ms.',
    applicantName: 'Pooja Deshmukh',
    employmentType: 'Trainee',
    gender: 'Female',
    dateOfBirth: '1996-03-11',
    bloodGroup: 'A+',
    mobileNo: '9760044102',
    personalEmail: 'pooja.deshmukh@wii.gov.in',
    address: 'Clement Town Phase 2',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248002',
    bankName: 'Punjab National Bank',
    ifscCode: 'PUNB0102900',
    accountNo: '11029388120',
    accountNoBank: '11029388120 (PNB)',
    panNo: 'CKLPD9912M',
    designation: 'Project Associate - II',
    dateOfJoining: '2025-07-01',
    numberOfLeavesPerYear: '12 Days',
    validUpTo: '2027-06-30',
    departmentCellProject: 'Spatial Modelling & Remote Sensing Cell',
    supervisingOfficerName: 'Dr. R. K. Singh (Scientist - F / PI)',
    officeOrderFileName: 'WII_PA_Project_Order_2025.pdf',
    biometricId: 'WII-BIO-1074',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
  },
  'USR-003': {
    salutation: 'Dr.',
    applicantName: 'R. K. Singh',
    employmentType: 'Permanent',
    gender: 'Male',
    dateOfBirth: '1975-04-18',
    bloodGroup: 'O+',
    mobileNo: '9412058392',
    personalEmail: 'rksingh@wii.gov.in',
    address: 'Type V Officer Quarter #12, WII Campus',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248001',
    bankName: 'SBI WII Campus Branch',
    ifscCode: 'SBIN0000123',
    accountNo: '10982736450',
    accountNoBank: '10982736450 (SBI)',
    panNo: 'RKSPS8810P',
    designation: 'Scientist - F / Supervising Officer (PI)',
    dateOfJoining: '2010-08-01',
    numberOfLeavesPerYear: '30 Days',
    validUpTo: '2035-04-30 (Permanent Faculty)',
    departmentCellProject: 'Wildlife Ecology & Research Division',
    supervisingOfficerName: 'Director General (WII)',
    officeOrderFileName: 'WII_Faculty_Appointment_RKS.pdf',
    biometricId: 'WII-FAC-0042',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  'IT-101': {
    salutation: 'Mr.',
    applicantName: 'Suresh Verma',
    employmentType: 'Permanent',
    gender: 'Male',
    dateOfBirth: '1982-11-05',
    bloodGroup: 'B+',
    mobileNo: '9897123450',
    personalEmail: 'suresh.verma@wii.gov.in',
    address: 'Type IV Quarter #8, WII Colony',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248001',
    bankName: 'Union Bank of India',
    ifscCode: 'UBIN0532101',
    accountNo: '30129881023',
    accountNoBank: '30129881023 (UBI)',
    panNo: 'SVMPS3312Q',
    designation: 'Senior IT Nodal Officer & System Engineer',
    dateOfJoining: '2015-03-10',
    numberOfLeavesPerYear: '30 Days',
    validUpTo: '2040-11-30',
    departmentCellProject: 'Computer Center & IT Cell',
    supervisingOfficerName: 'Director General (WII)',
    officeOrderFileName: 'WII_IT_Officer_Engagement.pdf',
    biometricId: 'WII-BIO-1015',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  },
  'LAB-101': {
    salutation: 'Dr.',
    applicantName: 'Meenakshi Joshi',
    employmentType: 'Permanent',
    gender: 'Female',
    dateOfBirth: '1980-08-20',
    bloodGroup: 'AB+',
    mobileNo: '9719001122',
    personalEmail: 'meenakshi.j@wii.gov.in',
    address: 'Vasant Vihar Enclave',
    city: 'Dehradun',
    state: 'Uttarakhand',
    pincode: '248006',
    bankName: 'Axis Bank (Rajpur Road)',
    ifscCode: 'UTIB0000109',
    accountNo: '915010029384',
    accountNoBank: '915010029384 (Axis Bank)',
    panNo: 'MJSPK1029R',
    designation: 'Nodal Officer - Forensic & GIS Research Labs',
    dateOfJoining: '2012-09-01',
    numberOfLeavesPerYear: '30 Days',
    validUpTo: '2038-08-31',
    departmentCellProject: 'Wildlife Forensic & Spatial Lab Division',
    supervisingOfficerName: 'Director General (WII)',
    officeOrderFileName: 'WII_Lab_Nodal_Sanction.pdf',
    biometricId: 'WII-BIO-1022',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
  },
};

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialProfile,
  currentRole = 'applicant',
  onSaveProfile,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('USR-002');
  const [profileSearchQuery, setProfileSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const [profile, setProfile] = useState<ApplicantProfile>({
    profilePhotoUrl: initialProfile.profilePhotoUrl || SAMPLE_USER_PROFILES['USR-002'].profilePhotoUrl,
    salutation: initialProfile.salutation || 'Dr.',
    employmentType: initialProfile.employmentType || 'Project employee',
    address: initialProfile.address || 'WII Campus Quarters, Chandrabani',
    city: initialProfile.city || 'Dehradun',
    state: initialProfile.state || 'Uttarakhand',
    pincode: initialProfile.pincode || '248001',
    bankName: initialProfile.bankName || 'HDFC Bank (Dehradun Main Branch)',
    ifscCode: initialProfile.ifscCode || 'HDFC0000123',
    accountNo: initialProfile.accountNo || '50100234192',
    officeOrderFileName: initialProfile.officeOrderFileName || 'WII_Office_Order_Engagement_2026.pdf',
    ...initialProfile,
  });

  const [verificationResult, setVerificationResult] = useState<OfficeOrderVerificationResult | null>(() => {
    if (initialProfile.officeOrderVerification) {
      return initialProfile.officeOrderVerification;
    }
    // Default initial verified result for Ananya Sharma
    return {
      verifiedAt: new Date().toISOString(),
      status: 'verified',
      fileName: initialProfile.officeOrderFileName || 'WII_Office_Order_Engagement_2026.pdf',
      extractedData: {
        applicantName: initialProfile.applicantName || 'Dr. Ananya Sharma',
        orderNumber: 'WII/ADMN/2026/ORD-891',
        orderDate: '2026-01-25',
        designation: initialProfile.designation || 'Senior Research Fellow',
        departmentCellProject: initialProfile.departmentCellProject || 'Dept. of Landscape Level Planning & GIS',
        supervisingOfficerName: initialProfile.supervisingOfficerName || 'Dr. R. K. Singh (Scientist - F / PI)',
        dateOfJoining: initialProfile.dateOfJoining || '2026-02-01',
        validUpTo: initialProfile.validUpTo || '2028-01-31',
        employmentType: initialProfile.employmentType || 'Project employee',
        monthlyEmoluments: '₹42,000/- per month + HRA',
        extractedTextSummary: 'Official Sanction Order issued by Wildlife Institute of India sanctioning the engagement of Dr. Ananya Sharma as Senior Research Fellow under DST Project with Dr. R. K. Singh as PI.',
      },
      comparisons: [
        {
          field: 'applicantName',
          label: 'Applicant Full Name',
          formValue: initialProfile.applicantName || 'Dr. Ananya Sharma',
          docValue: 'Dr. Ananya Sharma',
          isMatch: true,
        },
        {
          field: 'designation',
          label: 'Designation / Cadre',
          formValue: initialProfile.designation || 'Senior Research Fellow',
          docValue: 'Senior Research Fellow',
          isMatch: true,
        },
        {
          field: 'supervisingOfficerName',
          label: 'Supervising Officer (PI)',
          formValue: initialProfile.supervisingOfficerName || 'Dr. R. K. Singh (Scientist - F / PI)',
          docValue: 'Dr. R. K. Singh (Scientist - F / PI)',
          isMatch: true,
        },
        {
          field: 'departmentCellProject',
          label: 'Department / Cell / Project',
          formValue: initialProfile.departmentCellProject || 'Dept. of Landscape Level Planning & GIS',
          docValue: 'Dept. of Landscape Level Planning & GIS',
          isMatch: true,
        },
        {
          field: 'validUpTo',
          label: 'Tenure Valid Up To',
          formValue: initialProfile.validUpTo || '2028-01-31',
          docValue: '2028-01-31',
          isMatch: true,
        },
      ],
      hasMismatches: false,
      mismatchCount: 0,
      mismatchesSummary: [],
      overallConfidence: 'OCR AI Engine Verified',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [docMismatchWarning, setDocMismatchWarning] = useState<string | null>(null);

  const isEditable = currentRole === 'applicant' || currentRole === 'admin' || currentRole === 'super_admin';

  // Dynamic filter for profiles in database
  const filteredUserEntries = Object.entries(SAMPLE_USER_PROFILES).filter(([id, p]) => {
    if (!profileSearchQuery.trim()) return true;
    const q = profileSearchQuery.toLowerCase();
    return (
      id.toLowerCase().includes(q) ||
      p.applicantName.toLowerCase().includes(q) ||
      (p.salutation && p.salutation.toLowerCase().includes(q)) ||
      p.designation.toLowerCase().includes(q) ||
      p.personalEmail.toLowerCase().includes(q) ||
      (p.mobileNo && p.mobileNo.includes(q)) ||
      (p.biometricId && p.biometricId.toLowerCase().includes(q)) ||
      (p.departmentCellProject && p.departmentCellProject.toLowerCase().includes(q)) ||
      (p.employmentType && p.employmentType.toLowerCase().includes(q)) ||
      (p.bankName && p.bankName.toLowerCase().includes(q)) ||
      (p.supervisingOfficerName && p.supervisingOfficerName.toLowerCase().includes(q))
    );
  });

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const targetProfile = SAMPLE_USER_PROFILES[userId] || SAMPLE_USER_PROFILES['USR-002'];
    setProfile(targetProfile);
    setErrors({});
    setDocMismatchWarning(null);

    // Reset verification for this selected user
    setVerificationResult({
      verifiedAt: new Date().toISOString(),
      status: 'verified',
      fileName: targetProfile.officeOrderFileName || 'WII_Sanction_Notification.pdf',
      extractedData: {
        applicantName: targetProfile.applicantName,
        orderNumber: `WII/ESTT/2026/ORD-${Math.floor(100 + Math.random() * 900)}`,
        orderDate: targetProfile.dateOfJoining || '2026-02-01',
        designation: targetProfile.designation,
        departmentCellProject: targetProfile.departmentCellProject,
        supervisingOfficerName: targetProfile.supervisingOfficerName,
        dateOfJoining: targetProfile.dateOfJoining,
        validUpTo: targetProfile.validUpTo,
        employmentType: targetProfile.employmentType,
        monthlyEmoluments: 'Official Grade Fellowship',
        extractedTextSummary: `Official notification appointing ${targetProfile.applicantName} as ${targetProfile.designation} under ${targetProfile.supervisingOfficerName}.`,
      },
      comparisons: [
        { field: 'applicantName', label: 'Applicant Full Name', formValue: targetProfile.applicantName, docValue: targetProfile.applicantName, isMatch: true },
        { field: 'designation', label: 'Designation / Cadre', formValue: targetProfile.designation, docValue: targetProfile.designation, isMatch: true },
        { field: 'supervisingOfficerName', label: 'Supervising Officer (PI)', formValue: targetProfile.supervisingOfficerName, docValue: targetProfile.supervisingOfficerName, isMatch: true },
        { field: 'departmentCellProject', label: 'Department / Cell / Project', formValue: targetProfile.departmentCellProject, docValue: targetProfile.departmentCellProject, isMatch: true },
        { field: 'validUpTo', label: 'Tenure Valid Up To', formValue: targetProfile.validUpTo, docValue: targetProfile.validUpTo, isMatch: true },
      ],
      hasMismatches: false,
      mismatchCount: 0,
      overallConfidence: 'OCR AI Engine Verified',
    });
  };

  const handleUpdateMultipleFields = (updates: Partial<ApplicantProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    setDocMismatchWarning(null);
    setErrors((prev) => {
      const copy = { ...prev };
      Object.keys(updates).forEach((k) => delete copy[k]);
      return copy;
    });
  };

  const validate = (data: ApplicantProfile): Record<string, string> => {
    const errs: Record<string, string> = {};

    // Full Name validation
    if (!data.applicantName?.trim()) {
      errs.applicantName = 'Full Name is required.';
    } else if (data.applicantName.trim().length < 2) {
      errs.applicantName = 'Name must be at least 2 characters.';
    }

    // Employment Type validation
    if (!data.employmentType) {
      errs.employmentType = 'Employment Type is required.';
    }

    // Mobile Number validation (Indian mobile or 10 digits)
    const cleanMobile = (data.mobileNo || '').replace(/[\s\-\+]/g, '');
    if (!data.mobileNo?.trim()) {
      errs.mobileNo = 'Mobile Number is required.';
    } else if (!/^[0-9]{10,12}$/.test(cleanMobile)) {
      errs.mobileNo = 'Enter a valid 10-digit mobile number.';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.personalEmail?.trim()) {
      errs.personalEmail = 'Email address is required.';
    } else if (!emailRegex.test(data.personalEmail.trim())) {
      errs.personalEmail = 'Enter a valid email address.';
    }

    // Date of Birth
    if (!data.dateOfBirth) {
      errs.dateOfBirth = 'Date of Birth is required.';
    }

    // PAN Card validation (Format: 5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!data.panNo?.trim()) {
      errs.panNo = 'PAN Card number is required.';
    } else if (!panRegex.test(data.panNo.trim().toUpperCase())) {
      errs.panNo = 'Invalid PAN format (e.g. ABCDE1234F).';
    }

    // Bank Name
    if (!data.bankName?.trim()) {
      errs.bankName = 'Bank name & branch is required.';
    }

    // IFSC Code validation (11 characters, 4 letters, 0, 6 alphanumeric)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!data.ifscCode?.trim()) {
      errs.ifscCode = 'IFSC Code is required.';
    } else if (!ifscRegex.test(data.ifscCode.trim().toUpperCase())) {
      errs.ifscCode = 'Enter a valid 11-character IFSC Code (e.g. HDFC0000123).';
    }

    // Bank Account Number (9-18 digits)
    if (!data.accountNo?.trim()) {
      errs.accountNo = 'Bank account number is required.';
    } else if (!/^\d{9,18}$/.test(data.accountNo.trim())) {
      errs.accountNo = 'Account number must be 9 to 18 digits.';
    }

    // Pincode validation (6 digits if provided)
    if (data.pincode?.trim() && !/^\d{6}$/.test(data.pincode.trim())) {
      errs.pincode = 'Pincode must be 6 digits.';
    }

    // Designation / Cadre
    if (!data.designation?.trim()) {
      errs.designation = 'Designation is required.';
    } else if (data.designation.trim().length < 2) {
      errs.designation = 'Designation must be at least 2 characters.';
    }

    // Project / Department / Cell
    if (!data.departmentCellProject?.trim()) {
      errs.departmentCellProject = 'Project / Department / Cell is required.';
    } else if (data.departmentCellProject.trim().length < 2) {
      errs.departmentCellProject = 'Project / Department name must be at least 2 characters.';
    }

    // Reporting Officer / Supervising Officer (PI)
    if (!data.supervisingOfficerName?.trim()) {
      errs.supervisingOfficerName = 'Reporting / Supervising Officer (PI) is required.';
    } else if (data.supervisingOfficerName.trim().length < 3) {
      errs.supervisingOfficerName = 'Officer name must be at least 3 characters.';
    }

    // Date of Joining
    if (!data.dateOfJoining) {
      errs.dateOfJoining = 'Date of Joining is required.';
    }

    // Valid Up To
    if (!data.validUpTo?.trim()) {
      errs.validUpTo = 'Validity period is required.';
    }

    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) {
      alert('You are currently viewing this profile in Read-Only mode.');
      return;
    }

    const formErrors = validate(profile);
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Check if uploaded office order has uncorrected mismatches
    if (verificationResult && verificationResult.hasMismatches) {
      setDocMismatchWarning(
        `Cannot save profile: There are ${verificationResult.mismatchCount} critical discrepancy(ies) between your entered Profile and the uploaded Office Order. Please resolve the mismatches or click 'Auto-Fix & Sync Form with Office Order' to continue.`
      );
      // Scroll to bottom warning or alert
      return;
    }

    setErrors({});
    setDocMismatchWarning(null);
    const updatedProfile = {
      ...profile,
      accountNoBank: `${profile.accountNo || ''} (${profile.bankName || ''})`,
      officeOrderVerification: verificationResult || undefined,
    };
    onSaveProfile(updatedProfile);

    // Record Security Audit Trail
    recordSecurityAuditLog({
      actorName: updatedProfile.applicantName || 'User',
      actorEmail: updatedProfile.personalEmail || 'user@wii.gov.in',
      actorRole: (currentRole === 'super_admin' ? 'admin' : (currentRole || 'applicant')) as UserRole,
      actionType: 'PROFILE_UPDATE',
      module: `User Profile [${updatedProfile.applicantName || 'User'}]`,
      summary: `Updated personal identity profile details & Sanction Order credentials (${updatedProfile.designation || 'Staff'}).`,
      details: {
        targetEntity: 'Applicant Profile Record',
        comments: `Designation: ${updatedProfile.designation}, Project: ${updatedProfile.departmentCellProject}`,
      },
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleChange = (field: keyof ApplicantProfile, value: string) => {
    if (!isEditable) return;
    setProfile((prev) => {
      const nextProfile = { ...prev, [field]: value };

      // Dynamically re-evaluate matching status against active verification result
      if (verificationResult && verificationResult.extractedData) {
        const cleanA = (value || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
        const docVal = verificationResult.extractedData[field as keyof typeof verificationResult.extractedData] as string;
        const cleanB = (docVal || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();

        if (docVal) {
          const isMatch = !cleanA || !cleanB || cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA);
          const updatedComparisons = verificationResult.comparisons.map((c) => {
            if (c.field === field) {
              return {
                ...c,
                formValue: value || '(Empty in form)',
                isMatch,
                mismatchMessage: isMatch ? undefined : `${c.label} does not match Office Order "${docVal}".`,
              };
            }
            return c;
          });

          const mismatches = updatedComparisons.filter((c) => !c.isMatch);
          setVerificationResult({
            ...verificationResult,
            status: mismatches.length > 0 ? 'mismatch' : 'verified',
            hasMismatches: mismatches.length > 0,
            mismatchCount: mismatches.length,
            mismatchesSummary: mismatches.map((m) => m.mismatchMessage || `${m.label} mismatch`),
            comparisons: updatedComparisons,
          });
        }
      }

      return nextProfile;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) return;
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, profilePhotoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Toast Notification */}
      {isSaved && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs font-bold">Profile Updated Successfully</p>
            <p className="text-[11px] text-slate-300">
              Personal profile details have been saved to the database.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 min-h-[140px]">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 pointer-events-none blur-2xl" />

        <div className="z-10 relative space-y-1.5 max-w-2xl min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1 shrink-0">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Access Management Portal
            </span>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">• Wildlife Institute of India</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white leading-snug sm:leading-tight break-words">
            {currentRole === 'applicant' ? 'User Profile & Service Records' : 'Directory Lookup & Profile Inspection'}
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl block">
            {currentRole === 'applicant'
              ? 'Maintain and inspect official employee profile records, cadre designations, bank accounts, and engagement orders.'
              : 'Search and inspect official employee profile records, cadre designations, bank accounts, and engagement orders.'}
          </p>
        </div>

        {/* Dynamic Right Side: Directory Search for Admins/Supervisors, or Nothing for Applicants */}
        {currentRole !== 'applicant' && (
          <div className="z-20 relative w-full lg:w-auto lg:min-w-[360px] shrink-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                Directory Search & Select
              </label>
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded shrink-0">
                OFFICIAL DIRECTORY
              </span>
            </div>

            <div className="relative space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2 bg-slate-800/90 border border-slate-700/90 rounded-xl p-2 sm:p-1.5 shadow-inner">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/60 rounded-lg sm:bg-transparent sm:p-0 flex-1 min-w-0">
                <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  value={profileSearchQuery}
                  onChange={(e) => {
                    setProfileSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Type name, designation, BIO-ID..."
                  className="bg-transparent text-white placeholder-slate-400 focus:outline-none w-full font-medium text-xs min-w-0"
                />
                {profileSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Direct Select Dropdown */}
              <div className="sm:pl-2 sm:border-l sm:border-slate-700 shrink-0 w-full sm:w-auto">
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    handleSelectUser(e.target.value);
                    setProfileSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="w-full sm:w-auto bg-slate-950 sm:bg-slate-900 border border-slate-700 text-emerald-400 text-[11px] font-bold rounded-lg px-2.5 py-1.5 sm:py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-full sm:max-w-[160px] truncate"
                  title="Quick Personnel Selection"
                >
                  {Object.entries(SAMPLE_USER_PROFILES).map(([id, p]) => (
                    <option key={id} value={id}>
                      {p.applicantName} ({id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Instant Suggestions Dropdown Popover */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                  <div className="p-2 border-b border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-between bg-slate-950">
                    <span>
                      {profileSearchQuery.trim()
                        ? `MATCHING PERSONNEL (${filteredUserEntries.length})`
                        : 'ALL PERSONNEL DIRECTORY'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(false)}
                      className="text-slate-400 hover:text-white text-[10px] cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-800"
                    >
                      Close ✕
                    </button>
                  </div>
                  {filteredUserEntries.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 text-center">
                      No matching personnel profile found for &quot;{profileSearchQuery}&quot;
                    </div>
                  ) : (
                    filteredUserEntries.map(([id, p]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          handleSelectUser(id);
                          setProfileSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        className={`w-full text-left p-2.5 hover:bg-slate-800 flex items-center gap-2.5 border-b border-slate-800/60 transition-colors cursor-pointer ${
                          selectedUserId === id ? 'bg-slate-800/90 border-l-4 border-l-emerald-400' : ''
                        }`}
                      >
                        <img
                          src={p.profilePhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100'}
                          alt={p.applicantName}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-white truncate">
                              {p.salutation} {p.applicantName}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/80">
                              {id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{p.designation} • {p.departmentCellProject}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Error Warning Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <div>
            <strong className="font-bold">Form validation error:</strong> Please correct the highlighted fields below before submitting.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Personal Details, Employment Type & Photograph */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1. Personal & Employment Details</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
            {/* Photo Upload Box */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="relative group">
                <img
                  src={profile.profilePhotoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80'}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-xs ring-1 ring-slate-200"
                />
                {isEditable && (
                  <label className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg shadow-xs cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-700 block">
                  {profile.salutation} {profile.applicantName}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {profile.biometricId || 'WII-BIO-1088'}
                </span>
              </div>
            </div>

            {/* Personal Details & Employment Type Fields */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Salutation</label>
                <select
                  value={profile.salutation || 'Dr.'}
                  disabled={!isEditable}
                  onChange={(e) => handleChange('salutation', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-bold text-slate-800 disabled:bg-slate-100 disabled:text-slate-600"
                >
                  <option value="Dr.">Dr.</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.applicantName}
                  disabled={!isEditable}
                  onChange={(e) => handleChange('applicantName', e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md font-bold text-slate-900 disabled:bg-slate-100 ${
                    errors.applicantName ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.applicantName && (
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.applicantName}</p>
                )}
              </div>

              {/* NEW FIELD: Employment Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employment Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={profile.employmentType || 'Project employee'}
                  disabled={!isEditable}
                  onChange={(e) => handleChange('employmentType', e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md font-bold text-slate-800 disabled:bg-slate-100 ${
                    errors.employmentType ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                  }`}
                >
                  <option value="Intern">Intern</option>
                  <option value="Project employee">Project employee</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Trainee">Trainee</option>
                  <option value="Student">Student</option>
                </select>
                {errors.employmentType && (
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.employmentType}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={profile.gender}
                  disabled={!isEditable}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-medium text-slate-800 disabled:bg-slate-100"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={profile.dateOfBirth}
                  disabled={!isEditable}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md font-medium text-slate-800 disabled:bg-slate-100 ${
                    errors.dateOfBirth ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                  }`}
                />
                {errors.dateOfBirth && (
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <input
                  type="text"
                  value={profile.bloodGroup}
                  disabled={!isEditable}
                  onChange={(e) => handleChange('bloodGroup', e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-medium text-slate-800 disabled:bg-slate-100"
                  placeholder="e.g. O+, B+"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={profile.mobileNo}
                  disabled={!isEditable}
                  onChange={(e) => handleChange('mobileNo', e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md font-mono text-slate-800 disabled:bg-slate-100 ${
                    errors.mobileNo ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                  }`}
                  placeholder="10-digit mobile no."
                />
                {errors.mobileNo && (
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.mobileNo}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Personal / Official Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={profile.personalEmail}
                  disabled={!isEditable}
                  onChange={(e) => handleChange('personalEmail', e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-md font-mono text-slate-800 disabled:bg-slate-100 ${
                    errors.personalEmail ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                  }`}
                  placeholder="email@wii.gov.in"
                />
                {errors.personalEmail && (
                  <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.personalEmail}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Address */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>2. Address & Communication Details</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Campus / Residential Address</label>
              <input
                type="text"
                value={profile.address || ''}
                disabled={!isEditable}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-medium text-slate-800 disabled:bg-slate-100"
                placeholder="Residential address"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={profile.city || ''}
                disabled={!isEditable}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md font-medium text-slate-800 disabled:bg-slate-100"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={profile.pincode || ''}
                disabled={!isEditable}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md font-mono text-slate-800 disabled:bg-slate-100 ${
                  errors.pincode ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
                placeholder="6-digit pincode"
              />
              {errors.pincode && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.pincode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Identity & Bank Account */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>3. Bank Account & Identity Records</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                PAN Card Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.panNo}
                disabled={!isEditable}
                onChange={(e) => handleChange('panNo', e.target.value.toUpperCase())}
                className={`w-full text-xs px-3 py-2 border rounded-md font-mono uppercase font-bold text-slate-800 disabled:bg-slate-100 ${
                  errors.panNo ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
                placeholder="ABCDE1234F"
              />
              {errors.panNo && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.panNo}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bank Name & Branch <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.bankName || ''}
                disabled={!isEditable}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md font-medium text-slate-800 disabled:bg-slate-100 ${
                  errors.bankName ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
                placeholder="e.g. HDFC Bank, Main Branch"
              />
              {errors.bankName && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.bankName}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                IFSC Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.ifscCode || ''}
                disabled={!isEditable}
                onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                className={`w-full text-xs px-3 py-2 border rounded-md font-mono uppercase font-bold text-slate-800 disabled:bg-slate-100 ${
                  errors.ifscCode ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
                placeholder="e.g. HDFC0000123"
                maxLength={11}
              />
              {errors.ifscCode && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.ifscCode}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Bank Account Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.accountNo || ''}
                disabled={!isEditable}
                onChange={(e) => handleChange('accountNo', e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md font-mono font-bold text-slate-800 disabled:bg-slate-100 ${
                  errors.accountNo ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
                placeholder="9 to 18 digits"
              />
              {errors.accountNo && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.accountNo}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Cadre, Tenure & PI */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>4. Cadre, Project Tenure & Supervising Officer (PI)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Designation / Cadre <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.designation}
                disabled={!isEditable}
                onChange={(e) => handleChange('designation', e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md font-bold text-slate-900 disabled:bg-slate-100 ${
                  errors.designation ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
                placeholder="e.g. Senior Research Fellow"
              />
              {errors.designation && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.designation}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Project / Department / Cell <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.departmentCellProject}
                disabled={!isEditable}
                onChange={(e) => handleChange('departmentCellProject', e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md font-medium text-slate-800 disabled:bg-slate-100 ${
                  errors.departmentCellProject ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
                placeholder="e.g. Landscape Level Planning & GIS"
              />
              {errors.departmentCellProject && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.departmentCellProject}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reporting Officer / Supervising Officer (PI) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.supervisingOfficerName}
                disabled={!isEditable}
                onChange={(e) => handleChange('supervisingOfficerName', e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md font-bold text-emerald-900 disabled:bg-slate-100 ${
                  errors.supervisingOfficerName ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
                placeholder="e.g. Dr. R. K. Singh (Scientist - F)"
              />
              {errors.supervisingOfficerName && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.supervisingOfficerName}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date of Joining (DOJ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={profile.dateOfJoining}
                disabled={!isEditable}
                onChange={(e) => handleChange('dateOfJoining', e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md font-medium text-slate-800 disabled:bg-slate-100 ${
                  errors.dateOfJoining ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
              />
              {errors.dateOfJoining && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.dateOfJoining}</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Project / Fellowship Valid Up To <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profile.validUpTo}
                disabled={!isEditable}
                onChange={(e) => handleChange('validUpTo', e.target.value)}
                className={`w-full text-xs px-3 py-2 border rounded-md font-medium text-slate-800 disabled:bg-slate-100 ${
                  errors.validUpTo ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-300'
                }`}
                placeholder="e.g. 2028-01-31"
              />
              {errors.validUpTo && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">{errors.validUpTo}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Office Order Document Intelligence & OCR Verification */}
        <OfficeOrderVerificationCard
          profile={profile}
          isEditable={isEditable}
          onUpdateProfileFields={handleUpdateMultipleFields}
          verificationResult={verificationResult}
          onSetVerificationResult={setVerificationResult}
        />

        {/* Blocking Discrepancy Error Alert before Save */}
        {docMismatchWarning && (
          <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-xl flex items-start gap-3 animate-shake">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                Profile Submission Blocked (Document Discrepancy)
              </h4>
              <p className="text-xs text-rose-800 font-medium leading-relaxed">
                {docMismatchWarning}
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        {isEditable && (
          <div className="flex items-center justify-end pt-2 pb-6">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Profile Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
