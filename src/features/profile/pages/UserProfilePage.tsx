import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Camera,
  CheckCircle2,
  CreditCard,
  MapPin,
  Save,
  User,
} from "lucide-react";

import {
  ApplicantProfile,
  ProfileBank,
  ProfileBatch,
  ProfileEmploymentType,
  ProfileOfficer,
  ProfileOrgUnit,
  getBanks,
  getBatches,
  getEmploymentTypes,
  getMyProfile,
  getOrgUnits,
  getProfileOfficers,
  updateMyProfile,
  uploadProfilePhoto,
  getProfilePhotoUrl,
} from "@/api/profile.api";

import type { ApplicantProfile as LegacyApplicantProfile } from "@/types";

interface ProfileFormProps {
  initialProfile?: LegacyApplicantProfile;
  currentRole?: string;
  onSaveProfile?: (profile: LegacyApplicantProfile) => void;
}

type FormState = Partial<ApplicantProfile>;

const NO_BANK_EMPLOYMENT_TYPES = new Set([
  "msc_student",
  "diploma_trainee",
  "intern",
]);

const PERMANENT_CODE = "permanent";

function normalizeEmploymentCode(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[\/]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";

  const date = String(value).slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function emptyProfile(): FormState {
  return {
    userId: "",
    profilePhotoPath: null,
    salutation: "",
    applicantName: "",
    employmentType: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
    mobileNo: "",
    personalEmail: "",
    wiiOfficialEmail: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    designation: "",
    stream: "",
    courseName: "",
    departmentCellProject: "",
    departmentId: null,
    projectId: null,
    supervisingOfficerId: null,
    supervisingOfficerName: "",
    reportingOfficerId: null,
    reportingManagerId: null,
    piUserId: null,
    batchId: null,
    dateOfJoining: "",
    validUpTo: "",
    panNo: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
    officeOrderFileName: null,
    biometricId: null,
  };
}

function toFormState(profile: ApplicantProfile): FormState {
  return {
    ...profile,
    dateOfBirth: toDateInput(profile.dateOfBirth),
    dateOfJoining: toDateInput(profile.dateOfJoining),
    validUpTo: toDateInput(profile.validUpTo),
  };
}

function isAdminRole(role: string): boolean {
  return [
    "admin",
    "administrator",
    "super_admin",
    "system_administrator",
  ].includes(role.toLowerCase());
}

function isBankRequired(employmentType: string): boolean {
  return !NO_BANK_EMPLOYMENT_TYPES.has(normalizeEmploymentCode(employmentType));
}

function isPermanent(employmentType: string): boolean {
  return normalizeEmploymentCode(employmentType) === PERMANENT_CODE;
}

function getUnits(
  units: ProfileOrgUnit[],
  type: "department" | "cell" | "project",
): ProfileOrgUnit[] {
  return units.filter((unit) => unit.unitType === type);
}

function getOfficerName(
  officers: ProfileOfficer[],
  id: number | null | undefined,
): string {
  if (!id) return "";

  return officers.find((officer) => officer.id === id)?.fullName || "";
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  initialProfile,
  currentRole = "applicant",
  onSaveProfile,
}) => {
  const [profile, setProfile] = useState<FormState>(
    initialProfile
      ? toFormState(initialProfile as unknown as ApplicantProfile)
      : emptyProfile(),
  );

  const [employmentTypes, setEmploymentTypes] = useState<
    ProfileEmploymentType[]
  >([]);

  const [orgUnits, setOrgUnits] = useState<ProfileOrgUnit[]>([]);

  const [banks, setBanks] = useState<ProfileBank[]>([]);

  const [batches, setBatches] = useState<ProfileBatch[]>([]);

  const [officers, setOfficers] = useState<ProfileOfficer[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0);

  const adminCanEditOfficialFields = isAdminRole(currentRole);

  const isBankVisible = useMemo(
    () => isBankRequired(profile.employmentType || ""),
    [profile.employmentType],
  );

  const selectedEmployment = useMemo(
    () =>
      employmentTypes.find(
        (item) =>
          normalizeEmploymentCode(item.code) ===
          normalizeEmploymentCode(profile.employmentType),
      ),
    [employmentTypes, profile.employmentType],
  );

  const employmentCode = normalizeEmploymentCode(
    selectedEmployment?.code || profile.employmentType,
  );

  const departmentUnits = useMemo(
    () => getUnits(orgUnits, "department"),
    [orgUnits],
  );

  const cellUnits = useMemo(() => getUnits(orgUnits, "cell"), [orgUnits]);

  const projectUnits = useMemo(() => getUnits(orgUnits, "project"), [orgUnits]);

  const batchOptions = useMemo(() => {
    if (employmentCode === "msc_student") {
      return batches.filter((batch) => batch.seriesType === "msc");
    }

    if (employmentCode === "diploma_trainee") {
      return batches.filter((batch) => batch.seriesType === "diploma_trainee");
    }

    return [];
  }, [batches, employmentCode]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileData() {
      setLoading(true);
      setLoadError("");

      try {
        const [
          savedProfile,
          employment,
          units,
          bankList,
          batchList,
          officerList,
        ] = await Promise.all([
          getMyProfile(),
          getEmploymentTypes(),
          getOrgUnits(["department", "cell", "project"]),
          getBanks(),
          getBatches(),
          getProfileOfficers(),
        ]);

        if (cancelled) return;

        setEmploymentTypes(employment);
        setOrgUnits(units);
        setBanks(bankList);
        setBatches(batchList);
        setOfficers(officerList);

        if (savedProfile) {
          setProfile(toFormState(savedProfile));
        }
      } catch (error) {
        if (cancelled) return;

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load profile data.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfileData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (
    field: keyof FormState,
    value: string | number | null,
  ) => {
    setSaveError("");

    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleEmploymentChange = (value: string) => {
    const selected = employmentTypes.find((item) => item.code === value);

    setProfile((previous) => ({
      ...previous,
      employmentType: selected?.code || value,

      departmentId: null,
      projectId: null,
      supervisingOfficerId: null,
      supervisingOfficerName: "",
      reportingOfficerId: null,
      reportingManagerId: null,
      piUserId: null,
      batchId: null,

      designation: "",
      stream: "",
      courseName: "",

      bankName: isBankRequired(value) ? previous.bankName : null,
      accountNo: isBankRequired(value) ? previous.accountNo : null,
      ifscCode: isBankRequired(value) ? previous.ifscCode : null,
      panNo: isBankRequired(value) ? previous.panNo : null,

      validUpTo: isPermanent(value) ? "" : previous.validUpTo,
    }));

    setSaveError("");
  };

  const handleProfilePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    /*
     * Reset the input so selecting the same file again
     * can trigger the change event.
     */
    event.target.value = "";

    if (!file) {
      return;
    }

    setPhotoError("");

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!allowedTypes.has(file.type)) {
      setPhotoError("Please select a JPG, PNG, or WebP image.");
      return;
    }

    const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError("Profile photo must not exceed 5 MB.");
      return;
    }

    try {
      setIsPhotoUploading(true);

      await uploadProfilePhoto(file);

      /*
       * Force the authenticated photo endpoint to reload
       * after a successful replacement.
       */
      setPhotoRefreshKey((previous) => previous + 1);
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : "Unable to update profile photo.",
      );
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (saving || loading) return;

    setSaving(true);
    setSaveError("");
    setIsSaved(false);

    try {
      /*
       * IMPORTANT:
       * No client-side business validation is performed here.
       * Backend is the authoritative validator.
       *
       * The server must enforce:
       * - immutable user fields
       * - employment-type rules
       * - bank applicability
       * - master-record ownership
       * - officer/PI validity
       * - batch validity
       * - Permanent retirement-date calculation
       * - all other profile rules
       */

      const payload: Record<string, unknown> = {
        salutation: profile.salutation || null,
        applicantName: profile.applicantName || "",
        employmentType: profile.employmentType || "",

        gender: profile.gender || "",
        dateOfBirth: profile.dateOfBirth || "",

        bloodGroup: profile.bloodGroup || "",

        mobileNo: profile.mobileNo || "",

        personalEmail: profile.personalEmail || "",

        ...(adminCanEditOfficialFields
          ? { wiiOfficialEmail: profile.wiiOfficialEmail || null }
          : {}),

        address: profile.address || null,

        city: profile.city || null,

        state: profile.state || null,

        pincode: profile.pincode || null,

        designation: profile.designation || null,

        stream: profile.stream || null,

        courseName: profile.courseName || null,

        departmentId: profile.departmentId ?? null,

        projectId: profile.projectId ?? null,

        reportingOfficerId: profile.reportingOfficerId ?? null,

        reportingManagerId: profile.reportingManagerId ?? null,

        piUserId: profile.piUserId ?? null,

        batchId: profile.batchId ?? null,

        dateOfJoining: profile.dateOfJoining || "",

        validUpTo: profile.validUpTo || null,

        panNo: isBankVisible ? profile.panNo || null : null,

        bankName: isBankVisible ? profile.bankName || null : null,

        accountNo: isBankVisible ? profile.accountNo || null : null,

        ifscCode: isBankVisible ? profile.ifscCode || null : null,
      };

      const savedProfile = await updateMyProfile(payload);

      setProfile(toFormState(savedProfile));

      if (onSaveProfile) {
        onSaveProfile(savedProfile as unknown as LegacyApplicantProfile);
      }

      setIsSaved(true);

      window.setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const getFieldClass = (extra = "") =>
    `w-full text-xs px-3 py-2 border border-slate-300 rounded-md text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 ${extra}`;

  const renderOfficerOptions = (roleFilter?: string[]) => {
    const filtered = roleFilter
      ? officers.filter((officer) =>
          officer.roles.some((role) => roleFilter.includes(role.toLowerCase())),
        )
      : officers;

    return filtered.map((officer) => (
      <option key={officer.id} value={officer.id}>
        {officer.fullName}
      </option>
    ));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 flex justify-center">
        <div className="text-sm text-slate-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {isSaved && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs font-bold">Profile Updated Successfully</p>
            <p className="text-[11px] text-slate-300">
              The saved profile has been reloaded from the database.
            </p>
          </div>
        </div>
      )}

      {loadError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {saveError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div>
            <strong className="font-bold">Unable to save profile:</strong>{" "}
            {saveError}
          </div>
        </div>
      )}

      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md relative overflow-hidden min-h-[140px]">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 pointer-events-none blur-2xl" />

        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wider flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              Access Management Portal
            </span>

            <span className="text-xs text-slate-400">
              � Wildlife Institute of India
            </span>
          </div>

          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight">
            User Profile & Service Records
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Maintain official personal, employment, academic, project and bank
            records.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* =====================================================
            1. PERSONAL & EMPLOYMENT
        ====================================================== */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              1. Personal & Employment Details
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Photo */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="relative">
                {profile.profilePhotoPath ? (
                  <img
                    key={photoRefreshKey}
                    src={`${getProfilePhotoUrl()}?v=${photoRefreshKey}`}
                    alt="Profile"
                    className="w-32 h-32 rounded-2xl object-cover border-2 border-white shadow-xs ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-slate-200 border-2 border-white shadow-xs ring-1 ring-slate-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                )}

                {(currentRole === "applicant" ||
                  currentRole === "user" ||
                  adminCanEditOfficialFields) && (
                  <label
                    title={
                      isPhotoUploading
                        ? "Uploading profile photo..."
                        : "Change profile photo"
                    }
                    className={`absolute bottom-0 right-0 p-1.5 rounded-lg shadow-xs ${
                      isPhotoUploading
                        ? "bg-slate-200 text-slate-400 cursor-wait"
                        : "bg-white text-slate-600 hover:bg-slate-100 cursor-pointer"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isPhotoUploading}
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-700 block">
                  {profile.salutation} {profile.applicantName}
                </span>

                {profile.biometricId && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {profile.biometricId}
                  </span>
                )}

                {isPhotoUploading && (
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Uploading photo...
                  </span>
                )}

                {photoError && (
                  <span className="text-[10px] text-red-600 block mt-1 max-w-[180px]">
                    {photoError}
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {/* Salutation */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Salutation
                </label>

                <select
                  value={profile.salutation || ""}
                  onChange={(e) => handleChange("salutation", e.target.value)}
                  className={getFieldClass()}
                >
                  <option value="">Select</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name
                </label>

                <input
                  value={profile.applicantName || ""}
                  disabled={!adminCanEditOfficialFields}
                  onChange={(e) =>
                    handleChange("applicantName", e.target.value)
                  }
                  className={getFieldClass()}
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employment Type
                </label>

                <select
                  value={
                    selectedEmployment?.code || profile.employmentType || ""
                  }
                  onChange={(e) => handleEmploymentChange(e.target.value)}
                  className={getFieldClass()}
                >
                  <option value="">Select Employment Type</option>

                  {employmentTypes.map((item) => (
                    <option key={item.id} value={item.code}>
                      {item.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gender
                </label>

                <select
                  value={profile.gender || ""}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className={getFieldClass()}
                >
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* DOB */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Date of Birth
                </label>

                <input
                  type="date"
                  value={profile.dateOfBirth || ""}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  className={getFieldClass()}
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>

                <select
                  value={profile.bloodGroup || ""}
                  onChange={(e) => handleChange("bloodGroup", e.target.value)}
                  className={getFieldClass()}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Mobile */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile
                </label>

                <input
                  type="tel"
                  value={profile.mobileNo || ""}
                  disabled={!adminCanEditOfficialFields}
                  onChange={(e) => handleChange("mobileNo", e.target.value)}
                  className={getFieldClass("font-mono")}
                />
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Personal / Official Email
                </label>

                <input
                  type="email"
                  value={profile.personalEmail || ""}
                  disabled={!adminCanEditOfficialFields}
                  onChange={(e) =>
                    handleChange("personalEmail", e.target.value)
                  }
                  className={getFieldClass("font-mono")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            2. ADDRESS
        ====================================================== */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5">
          <div className="border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              2. Address & Communication Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Campus / Residential Address
              </label>

              <input
                value={profile.address || ""}
                onChange={(e) => handleChange("address", e.target.value)}
                className={getFieldClass()}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                City
              </label>

              <input
                value={profile.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                className={getFieldClass()}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                State
              </label>

              <input
                value={profile.state || ""}
                onChange={(e) => handleChange("state", e.target.value)}
                className={getFieldClass()}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pincode
              </label>

              <input
                value={profile.pincode || ""}
                onChange={(e) => handleChange("pincode", e.target.value)}
                className={getFieldClass("font-mono")}
              />
            </div>
          </div>
        </div>

        {/* =====================================================
            3. BANK & IDENTITY
        ====================================================== */}

        {isBankVisible && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5">
            <div className="border-b border-slate-100 pb-2.5">
              <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                3. Bank Account & Identity Records
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PAN
                </label>

                <input
                  value={profile.panNo || ""}
                  onChange={(e) =>
                    handleChange("panNo", e.target.value.toUpperCase())
                  }
                  className={getFieldClass("font-mono uppercase font-bold")}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank
                </label>

                <select
                  value={profile.bankName || ""}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  className={getFieldClass()}
                >
                  <option value="">Select Bank</option>

                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.bankName}>
                      {bank.bankName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account Number
                </label>

                <input
                  value={profile.accountNo || ""}
                  onChange={(e) => handleChange("accountNo", e.target.value)}
                  className={getFieldClass("font-mono")}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  IFSC Code
                </label>

                <input
                  value={profile.ifscCode || ""}
                  onChange={(e) =>
                    handleChange("ifscCode", e.target.value.toUpperCase())
                  }
                  maxLength={11}
                  className={getFieldClass("font-mono uppercase")}
                />
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            4. EMPLOYMENT-SPECIFIC DETAILS
        ====================================================== */}

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5">
          <div className="border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              4. Cadre / Project / Academic Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            {/* Permanent / Deputation */}
            {(employmentCode === "permanent" ||
              employmentCode === "deputation") && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Designation
                  </label>

                  <input
                    value={profile.designation || ""}
                    onChange={(e) =>
                      handleChange("designation", e.target.value)
                    }
                    className={getFieldClass("font-bold")}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department / Cell
                  </label>

                  <select
                    value={profile.departmentId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "departmentId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select Department / Cell</option>

                    {[...departmentUnits, ...cellUnits].map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reporting Officer
                  </label>

                  <select
                    value={profile.reportingOfficerId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "reportingOfficerId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select Reporting Officer</option>

                    {renderOfficerOptions()}
                  </select>
                </div>
              </>
            )}

            {/* Contractual */}
            {employmentCode === "contractual" && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Designation
                  </label>

                  <input
                    value={profile.designation || ""}
                    onChange={(e) =>
                      handleChange("designation", e.target.value)
                    }
                    className={getFieldClass()}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project / Department / Cell
                  </label>

                  <select
                    value={profile.projectId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "projectId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select Project / Department / Cell</option>

                    {[...projectUnits, ...departmentUnits, ...cellUnits].map(
                      (unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.unitName}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reporting Manager / PI
                  </label>

                  <select
                    value={profile.reportingManagerId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "reportingManagerId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select Reporting Manager / PI</option>

                    {renderOfficerOptions()}
                  </select>
                </div>
              </>
            )}

            {/* Researcher / Project Staff */}
            {employmentCode === "researcher_project_staff" && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Designation
                  </label>

                  <input
                    value={profile.designation || ""}
                    onChange={(e) =>
                      handleChange("designation", e.target.value)
                    }
                    className={getFieldClass()}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Project
                  </label>

                  <select
                    value={profile.projectId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "projectId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select Project</option>

                    {projectUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PI
                  </label>

                  <select
                    value={profile.piUserId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "piUserId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select PI</option>

                    {renderOfficerOptions()}
                  </select>
                </div>
              </>
            )}

            {/* PhD */}
            {employmentCode === "phd_scholar" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PI
                </label>

                <select
                  value={profile.piUserId ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "piUserId",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className={getFieldClass()}
                >
                  <option value="">Select PI</option>

                  {renderOfficerOptions()}
                </select>
              </div>
            )}

            {/* MSc */}
            {employmentCode === "msc_student" && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Stream
                  </label>

                  <input
                    value={profile.stream || ""}
                    onChange={(e) => handleChange("stream", e.target.value)}
                    className={getFieldClass()}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batch
                  </label>

                  <select
                    value={profile.batchId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "batchId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select MSc Batch</option>

                    {batchOptions.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batchLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PI
                  </label>

                  <select
                    value={profile.piUserId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "piUserId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select PI</option>

                    {renderOfficerOptions()}
                  </select>
                </div>
              </>
            )}

            {/* Diploma Trainee */}
            {employmentCode === "diploma_trainee" && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Course Name
                  </label>

                  <input
                    value={profile.courseName || ""}
                    onChange={(e) => handleChange("courseName", e.target.value)}
                    className={getFieldClass()}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batch
                  </label>

                  <select
                    value={profile.batchId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "batchId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select Diploma Batch</option>

                    {batchOptions.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batchLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PI
                  </label>

                  <select
                    value={profile.piUserId ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "piUserId",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    className={getFieldClass()}
                  >
                    <option value="">Select PI</option>

                    {renderOfficerOptions()}
                  </select>
                </div>
              </>
            )}

            {/* Intern */}
            {employmentCode === "intern" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PI
                </label>

                <select
                  value={profile.piUserId ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "piUserId",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  className={getFieldClass()}
                >
                  <option value="">Select PI</option>

                  {renderOfficerOptions()}
                </select>
              </div>
            )}

            {/* Common DOJ */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date of Joining
              </label>

              <input
                type="date"
                value={profile.dateOfJoining || ""}
                onChange={(e) => handleChange("dateOfJoining", e.target.value)}
                className={getFieldClass()}
              />
            </div>

            {/* Valid Up To */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Valid Up To
              </label>

              <input
                type="date"
                value={profile.validUpTo || ""}
                disabled={isPermanent(profile.employmentType || "")}
                onChange={(e) => handleChange("validUpTo", e.target.value)}
                className={getFieldClass(
                  isPermanent(profile.employmentType || "")
                    ? "font-semibold bg-slate-100"
                    : "",
                )}
              />

              {isPermanent(profile.employmentType || "") && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Automatically calculated by the server from Date of Birth as
                  the last day of the month in which the user turns 60.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
            SAVE
        ====================================================== */}

        <div className="flex items-center justify-end pt-2 pb-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-all text-xs"
          >
            <Save className="w-4 h-4" />

            {saving ? "Saving..." : "Save Profile Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
