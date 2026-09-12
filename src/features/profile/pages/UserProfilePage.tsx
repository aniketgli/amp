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
  getPincodeDetails,
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
    .replace(/[\\/]/g, "_")
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
  const [employmentTypes, setEmploymentTypes] = useState<ProfileEmploymentType[]>([]);
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
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoRefreshKey, setPhotoRefreshKey] = useState(0);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [validationAttempted, setValidationAttempted] = useState(false);

  const adminCanEditOfficialFields = isAdminRole(currentRole);
  const employmentCode = normalizeEmploymentCode(profile.employmentType);
  const isBankVisible = useMemo(
    () => Boolean(employmentCode) && isBankRequired(profile.employmentType || ""),
    [employmentCode, profile.employmentType],
  );

  const departmentUnits = useMemo(() => getUnits(orgUnits, "department"), [orgUnits]);
  const cellUnits = useMemo(() => getUnits(orgUnits, "cell"), [orgUnits]);
  const projectUnits = useMemo(() => getUnits(orgUnits, "project"), [orgUnits]);
  const batchOptions = useMemo(() => {
    const series =
      employmentCode === "msc_student"
        ? "msc"
        : employmentCode === "diploma_trainee"
          ? "diploma_trainee"
          : "__none__";
    return batches.filter((batch) => batch.seriesType === series);
  }, [batches, employmentCode]);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileData() {
      setLoading(true);
      setLoadError("");

      try {
        const [savedProfile, employment, units, bankList, batchList, officerList] =
          await Promise.all([
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

        if (savedProfile) setProfile(toFormState(savedProfile));
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load profile data.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfileData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    const pin = String(profile.pincode || "").replace(/\D/g, "").slice(0, 6);

    if (pin !== profile.pincode) {
      setProfile((previous) => ({
        ...previous,
        pincode: pin,
        ...(pin.length < 6 ? { city: "", state: "" } : {}),
      }));
      return;
    }

    if (pin.length !== 6) {
      setPincodeLoading(false);
      setPincodeError("");
      return;
    }

    let cancelled = false;
    setPincodeLoading(true);
    setPincodeError("");

    void getPincodeDetails(pin)
      .then((details) => {
        if (!cancelled) {
          setProfile((previous) => ({
            ...previous,
            city: details.district,
            state: details.state,
          }));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Unable to verify PIN code.";
          setPincodeError(message);
          setSaveError(message);
          setProfile((previous) => ({ ...previous, city: "", state: "" }));
        }
      })
      .finally(() => {
        if (!cancelled) setPincodeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile.pincode]);

  const handleChange = (
    field: keyof FormState,
    value: string | number | null,
  ) => {
    setSaveError("");
    setPhotoError("");
    setValidationAttempted(false);
    setProfile((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "pincode" ? { city: "", state: "" } : {}),
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
    setPhotoError("");
    setValidationAttempted(false);
  };

  const handleProfilePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoError("");
    setSaveError("");
    setValidationAttempted(false);
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!allowedTypes.has(file.type)) {
      setPhotoError("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Profile photo must not exceed 5 MB.");
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPendingPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (saving || loading) return;

    setValidationAttempted(true);

    if (pincodeError || pincodeLoading) {
      setSaveError(
        pincodeLoading
          ? "Please wait for PIN code verification to finish."
          : pincodeError,
      );
      return;
    }

    if (!event.currentTarget.checkValidity()) {
      setSaveError("Please fill all mandatory fields marked with *.");
      return;
    }

    setSaving(true);
    setSaveError("");
    setIsSaved(false);

    try {
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

      let savedProfile = await updateMyProfile(payload);

      if (pendingPhoto) {
        setIsPhotoUploading(true);
        try {
          savedProfile = await uploadProfilePhoto(pendingPhoto);
          setPendingPhoto(null);
          if (photoPreview) URL.revokeObjectURL(photoPreview);
          setPhotoPreview(null);
          setPhotoRefreshKey((previous) => previous + 1);
        } finally {
          setIsPhotoUploading(false);
        }
      }

      setProfile(toFormState(savedProfile));
      onSaveProfile?.(savedProfile as unknown as LegacyApplicantProfile);
      setIsSaved(true);
      setValidationAttempted(false);
      window.setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const getFieldClass = (extra = "") =>
    `w-full text-xs px-3 py-2 border border-slate-300 rounded-md text-slate-800 disabled:cursor-not-allowed ${extra}`;

  const getImmutableFieldClass = (extra = "") =>
    `${getFieldClass(extra)} bg-slate-200 text-slate-600 cursor-not-allowed`;

  const getAutoFieldClass = (extra = "") =>
    `${getFieldClass(extra)} bg-white text-slate-800`;

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

  const topError = photoError || saveError || loadError;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <style>{`
        .profile-form.validation-attempted input:invalid:not(:disabled),
        .profile-form.validation-attempted select:invalid:not(:disabled) {
          border-color: #fca5a5;
          box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.12);
        }
        .profile-form input:read-only {
          cursor: not-allowed;
        }
        .profile-form .immutable-field {
          background-color: #e2e8f0;
          color: #475569;
          cursor: not-allowed;
        }
        .profile-form .normal-disabled-field {
          background-color: #ffffff;
          color: #1e293b;
          opacity: 1;
        }
      `}</style>

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

      {topError && !isSaved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,720px)] bg-rose-600 text-white px-4 py-3 rounded-xl shadow-lg border border-rose-700 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <strong className="font-bold">Unable to save profile:</strong>{" "}
            <span>{topError}</span>
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
            <span className="text-xs text-slate-400">Wildlife Institute of India</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight">
            User Profile & Service Records
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Maintain official personal, employment, academic, project and bank records.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`profile-form space-y-5 ${validationAttempted ? "validation-attempted" : ""}`}
        noValidate
      >
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              1. Personal & Employment Details
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="relative">
                {photoPreview || profile.profilePhotoPath ? (
                  <img
                    key={photoRefreshKey}
                    src={photoPreview || `${getProfilePhotoUrl()}?v=${photoRefreshKey}`}
                    alt="Profile"
                    className="w-36 h-36 rounded-2xl object-cover border-2 border-white shadow-xs ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-36 h-36 rounded-2xl bg-slate-200 border-2 border-white shadow-xs ring-1 ring-slate-200 flex items-center justify-center">
                    <User className="w-14 h-14 text-slate-400" />
                  </div>
                )}

                {(currentRole === "applicant" || currentRole === "user" || adminCanEditOfficialFields) && (
                  <label
                    title={isPhotoUploading ? "Saving profile photo..." : "Change profile photo"}
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
                      disabled={isPhotoUploading || saving}
                      onChange={handleProfilePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {isPhotoUploading && (
                <span className="text-[10px] text-slate-500">Saving photo...</span>
              )}
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Salutation</label>
                <select required value={profile.salutation || ""} onChange={(e) => handleChange("salutation", e.target.value)} className={getFieldClass()}>
                  <option value="">Select</option><option value="Dr.">Dr.</option><option value="Mr.">Mr.</option><option value="Ms.">Ms.</option><option value="Prof.">Prof.</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Name</label>
                <input required value={profile.applicantName || ""} disabled={!adminCanEditOfficialFields} onChange={(e) => handleChange("applicantName", e.target.value)} className={`${getImmutableFieldClass()} immutable-field`} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                <select required value={profile.employmentType || ""} onChange={(e) => handleEmploymentChange(e.target.value)} className={getFieldClass()}>
                  <option value="">Select Employment Type</option>
                  {employmentTypes.map((item) => <option key={item.id} value={item.code}>{item.displayName}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select required value={profile.gender || ""} onChange={(e) => handleChange("gender", e.target.value)} className={getFieldClass()}>
                  <option value="">Select</option><option>Female</option><option>Male</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input required type="date" value={profile.dateOfBirth || ""} onChange={(e) => handleChange("dateOfBirth", e.target.value)} className={getFieldClass()} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select required value={profile.bloodGroup || ""} onChange={(e) => handleChange("bloodGroup", e.target.value)} className={getFieldClass()}>
                  <option value="">Select Blood Group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group}>{group}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile</label>
                <input required type="tel" inputMode="numeric" maxLength={15} pattern="[0-9]{10,15}" value={profile.mobileNo || ""} disabled={!adminCanEditOfficialFields} onChange={(e) => handleChange("mobileNo", e.target.value.replace(/\D/g, "").slice(0, 15))} className={`${getImmutableFieldClass("font-mono")} immutable-field`} />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Personal Email</label>
                <input required type="email" value={profile.personalEmail || ""} disabled={!adminCanEditOfficialFields} onChange={(e) => handleChange("personalEmail", e.target.value)} className={`${getImmutableFieldClass("font-mono")} immutable-field`} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5">
          <div className="border-b border-slate-100 pb-2.5">
            <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              2. Permanent Address
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Permanent Address</label>
              <input required value={profile.address || ""} onChange={(e) => handleChange("address", e.target.value)} className={getFieldClass()} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pin Code</label>
              <input required inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={profile.pincode || ""} onChange={(e) => handleChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} className={getFieldClass("font-mono")} />
              {pincodeLoading && <p className="text-[10px] text-slate-500 mt-1">Finding location...</p>}
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City / District</label>
              <input required readOnly value={profile.city || ""} className={`${getImmutableFieldClass()} immutable-field`} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input required readOnly value={profile.state || ""} className={`${getImmutableFieldClass()} immutable-field`} />
            </div>
          </div>
        </div>

        {isBankVisible && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5">
            <div className="border-b border-slate-100 pb-2.5"><h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-600" />3. Bank Account & Identity Records</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              <div><label className="block font-semibold text-slate-700 mb-1">PAN</label><input required maxLength={10} pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" value={profile.panNo || ""} onChange={(e) => handleChange("panNo", e.target.value.toUpperCase())} className={getFieldClass("font-mono uppercase")} /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Bank</label><select required value={profile.bankName || ""} onChange={(e) => handleChange("bankName", e.target.value)} className={getFieldClass()}><option value="">Select Bank</option>{banks.map((bank) => <option key={bank.id} value={bank.bankName}>{bank.bankName}</option>)}</select></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Account Number</label><input required inputMode="numeric" maxLength={30} pattern="[0-9]{6,30}" value={profile.accountNo || ""} onChange={(e) => handleChange("accountNo", e.target.value.replace(/\D/g, ""))} className={getFieldClass("font-mono")} /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">IFSC Code</label><input required maxLength={11} pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" value={profile.ifscCode || ""} onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase())} className={getFieldClass("font-mono uppercase")} /></div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5">
          <div className="border-b border-slate-100 pb-2.5"><h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-600" />4. Cadre / Project / Academic Details</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            {(employmentCode === "permanent" || employmentCode === "deputation") && <>
              <div><label className="block font-semibold text-slate-700 mb-1">Designation</label><input required value={profile.designation || ""} onChange={(e) => handleChange("designation", e.target.value)} className={getFieldClass()} /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Department / Cell</label><select required value={profile.departmentId ?? ""} onChange={(e) => handleChange("departmentId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select Department / Cell</option>{[...departmentUnits, ...cellUnits].map((unit) => <option key={unit.id} value={unit.id}>{unit.unitName}</option>)}</select></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Reporting Officer</label><select required value={profile.reportingOfficerId ?? ""} onChange={(e) => handleChange("reportingOfficerId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select Reporting Officer</option>{renderOfficerOptions()}</select></div>
            </>}

            {employmentCode === "contractual" && <>
              <div><label className="block font-semibold text-slate-700 mb-1">Designation</label><input required value={profile.designation || ""} onChange={(e) => handleChange("designation", e.target.value)} className={getFieldClass()} /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Project / Department / Cell</label><select required value={profile.projectId ?? ""} onChange={(e) => handleChange("projectId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select Project / Department / Cell</option>{[...projectUnits, ...departmentUnits, ...cellUnits].map((unit) => <option key={unit.id} value={unit.id}>{unit.unitName}</option>)}</select></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Reporting Manager / PI</label><select required value={profile.reportingManagerId ?? ""} onChange={(e) => handleChange("reportingManagerId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select Reporting Manager / PI</option>{renderOfficerOptions()}</select></div>
            </>}

            {employmentCode === "researcher_project_staff" && <>
              <div><label className="block font-semibold text-slate-700 mb-1">Designation</label><input required value={profile.designation || ""} onChange={(e) => handleChange("designation", e.target.value)} className={getFieldClass()} /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Project</label><select required value={profile.projectId ?? ""} onChange={(e) => handleChange("projectId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select Project</option>{projectUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.unitName}</option>)}</select></div>
              <div><label className="block font-semibold text-slate-700 mb-1">PI</label><select required value={profile.piUserId ?? ""} onChange={(e) => handleChange("piUserId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select PI</option>{renderOfficerOptions()}</select></div>
            </>}

            {(employmentCode === "phd_scholar" || employmentCode === "intern") && <div><label className="block font-semibold text-slate-700 mb-1">PI</label><select required value={profile.piUserId ?? ""} onChange={(e) => handleChange("piUserId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select PI</option>{renderOfficerOptions()}</select></div>}

            {employmentCode === "msc_student" && <>
              <div><label className="block font-semibold text-slate-700 mb-1">Stream</label><input required value={profile.stream || ""} onChange={(e) => handleChange("stream", e.target.value)} className={getFieldClass()} /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Batch</label><select required value={profile.batchId ?? ""} onChange={(e) => handleChange("batchId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select MSc Batch</option>{batchOptions.map((batch) => <option key={batch.id} value={batch.id}>{batch.batchLabel}</option>)}</select></div>
              <div><label className="block font-semibold text-slate-700 mb-1">PI</label><select required value={profile.piUserId ?? ""} onChange={(e) => handleChange("piUserId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select PI</option>{renderOfficerOptions()}</select></div>
            </>}

            {employmentCode === "diploma_trainee" && <>
              <div><label className="block font-semibold text-slate-700 mb-1">Course Name</label><input required value={profile.courseName || ""} onChange={(e) => handleChange("courseName", e.target.value)} className={getFieldClass()} /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Batch</label><select required value={profile.batchId ?? ""} onChange={(e) => handleChange("batchId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select Diploma Batch</option>{batchOptions.map((batch) => <option key={batch.id} value={batch.id}>{batch.batchLabel}</option>)}</select></div>
              <div><label className="block font-semibold text-slate-700 mb-1">PI</label><select required value={profile.piUserId ?? ""} onChange={(e) => handleChange("piUserId", e.target.value ? Number(e.target.value) : null)} className={getFieldClass()}><option value="">Select PI</option>{renderOfficerOptions()}</select></div>
            </>}

            <div><label className="block font-semibold text-slate-700 mb-1">Date of Joining</label><input required type="date" value={profile.dateOfJoining || ""} onChange={(e) => handleChange("dateOfJoining", e.target.value)} className={getFieldClass()} /></div>
            <div><label className="block font-semibold text-slate-700 mb-1">Valid Up To</label><input required type="date" value={profile.validUpTo || ""} readOnly={isPermanent(profile.employmentType || "")} onChange={(e) => handleChange("validUpTo", e.target.value)} className={getAutoFieldClass(isPermanent(profile.employmentType || "") ? "font-semibold" : "")} />{isPermanent(profile.employmentType || "") && <p className="text-[10px] text-slate-500 mt-1">Automatically calculated by the server from Date of Birth as the last day of the month in which the user turns 60.</p>}</div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 pb-6">
          <button type="submit" disabled={saving || isPhotoUploading} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-all text-xs">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Profile Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
