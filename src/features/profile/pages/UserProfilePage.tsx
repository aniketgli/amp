import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Briefcase, Camera, CheckCircle2, CreditCard, MapPin, Save, User } from "lucide-react";
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

const NO_BANK = new Set(["msc_student", "diploma_trainee", "intern"]);
const norm = (v: unknown) => String(v || "").trim().toLowerCase().replace(/&/g, "and").replace(/[\\/]/g, "_").replace(/\s+/g, "_").replace(/-+/g, "_");
const dateInput = (v: unknown) => { const s = String(v || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ""; };
const adminRole = (r: string) => ["admin", "administrator", "super_admin", "system_administrator"].includes(r.toLowerCase());
const bankRequired = (v: string) => !NO_BANK.has(norm(v));
const permanent = (v: string) => norm(v) === "permanent";

function emptyProfile(): FormState {
  return { userId: "", profilePhotoPath: null, salutation: "", applicantName: "", employmentType: "", gender: "", dateOfBirth: "", bloodGroup: "", mobileNo: "", personalEmail: "", wiiOfficialEmail: "", address: "", city: "", state: "", pincode: "", designation: "", stream: "", courseName: "", departmentCellProject: "", departmentId: null, projectId: null, supervisingOfficerId: null, supervisingOfficerName: "", reportingOfficerId: null, reportingManagerId: null, piUserId: null, batchId: null, dateOfJoining: "", validUpTo: "", panNo: "", bankName: "", accountNo: "", ifscCode: "", officeOrderFileName: null, biometricId: null };
}
function formState(p: ApplicantProfile): FormState { return { ...p, dateOfBirth: dateInput(p.dateOfBirth), dateOfJoining: dateInput(p.dateOfJoining), validUpTo: dateInput(p.validUpTo) }; }

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialProfile, currentRole = "applicant", onSaveProfile }) => {
  const [profile, setProfile] = useState<FormState>(initialProfile ? formState(initialProfile as unknown as ApplicantProfile) : emptyProfile());
  const [employmentTypes, setEmploymentTypes] = useState<ProfileEmploymentType[]>([]);
  const [orgUnits, setOrgUnits] = useState<ProfileOrgUnit[]>([]);
  const [banks, setBanks] = useState<ProfileBank[]>([]);
  const [batches, setBatches] = useState<ProfileBatch[]>([]);
  const [officers, setOfficers] = useState<ProfileOfficer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const isAdmin = adminRole(currentRole);
  const employmentCode = norm(profile.employmentType);
  const showBank = Boolean(employmentCode) && bankRequired(profile.employmentType || "");
  const departments = useMemo(() => orgUnits.filter(x => x.unitType === "department"), [orgUnits]);
  const cells = useMemo(() => orgUnits.filter(x => x.unitType === "cell"), [orgUnits]);
  const projects = useMemo(() => orgUnits.filter(x => x.unitType === "project"), [orgUnits]);
  const batchOptions = useMemo(() => batches.filter(x => x.seriesType === (employmentCode === "msc_student" ? "msc" : employmentCode === "diploma_trainee" ? "diploma_trainee" : "__none__")), [batches, employmentCode]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getMyProfile(), getEmploymentTypes(), getOrgUnits(["department", "cell", "project"]), getBanks(), getBatches(), getProfileOfficers()])
      .then(([p, e, o, b, ba, f]) => { if (cancelled) return; setEmploymentTypes(e); setOrgUnits(o); setBanks(b); setBatches(ba); setOfficers(f); if (p) setProfile(formState(p)); })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load profile data."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

  useEffect(() => {
    const pin = String(profile.pincode || "");
    if (pin.length !== 6) { setPincodeLoading(false); setPincodeError(""); return; }
    let cancelled = false;
    setPincodeLoading(true); setPincodeError("");
    void getPincodeDetails(pin).then(d => { if (!cancelled) setProfile(p => ({ ...p, city: d.district, state: d.state })); })
      .catch(e => { if (!cancelled) { const m = e instanceof Error ? e.message : "PIN code not found."; setPincodeError(m); setProfile(p => ({ ...p, city: "", state: "" })); } })
      .finally(() => { if (!cancelled) setPincodeLoading(false); });
    return () => { cancelled = true; };
  }, [profile.pincode]);

  const change = (field: keyof FormState, value: string | number | null) => {
    setError("");
    setProfile(p => ({ ...p, [field]: value, ...(field === "pincode" ? { city: "", state: "" } : {}) }));
  };

  const employmentChange = (value: string) => setProfile(p => ({ ...p, employmentType: value, departmentId: null, projectId: null, reportingOfficerId: null, reportingManagerId: null, piUserId: null, batchId: null, designation: "", stream: "", courseName: "", bankName: bankRequired(value) ? p.bankName : null, panNo: bankRequired(value) ? p.panNo : null, accountNo: bankRequired(value) ? p.accountNo : null, ifscCode: bankRequired(value) ? p.ifscCode : null, validUpTo: permanent(value) ? "" : p.validUpTo }));

  const choosePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
    setPhotoError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setPhotoError("Please select a JPG, PNG, or WebP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setPhotoError("Profile photo must not exceed 5 MB."); return; }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPendingPhoto(file); setPhotoPreview(URL.createObjectURL(file));
  };

  const officerOptions = officers.map(o => <option key={o.id} value={o.id}>{o.fullName}</option>);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving || loading) return;
    if (!e.currentTarget.checkValidity()) { e.currentTarget.reportValidity(); return; }
    if (pincodeError || pincodeLoading) { setError(pincodeLoading ? "Please wait for PIN code verification to finish." : pincodeError); return; }
    setSaving(true); setError(""); setSaved(false);
    try {
      const payload: Record<string, unknown> = {
        salutation: profile.salutation || null, applicantName: profile.applicantName || "", employmentType: profile.employmentType || "", gender: profile.gender || "", dateOfBirth: profile.dateOfBirth || "", bloodGroup: profile.bloodGroup || "", mobileNo: profile.mobileNo || "", personalEmail: profile.personalEmail || "",
        ...(isAdmin ? { wiiOfficialEmail: profile.wiiOfficialEmail || null } : {}),
        address: profile.address || null, city: profile.city || null, state: profile.state || null, pincode: profile.pincode || null, designation: profile.designation || null, stream: profile.stream || null, courseName: profile.courseName || null, departmentId: profile.departmentId ?? null, projectId: profile.projectId ?? null, reportingOfficerId: profile.reportingOfficerId ?? null, reportingManagerId: profile.reportingManagerId ?? null, piUserId: profile.piUserId ?? null, batchId: profile.batchId ?? null, dateOfJoining: profile.dateOfJoining || "", validUpTo: profile.validUpTo || null,
        panNo: showBank ? profile.panNo || null : null, bankName: showBank ? profile.bankName || null : null, accountNo: showBank ? profile.accountNo || null : null, ifscCode: showBank ? profile.ifscCode || null : null,
      };
      let result = await updateMyProfile(payload);
      if (pendingPhoto) { setPhotoSaving(true); try { result = await uploadProfilePhoto(pendingPhoto); setPendingPhoto(null); setPhotoPreview(null); setPhotoKey(k => k + 1); } finally { setPhotoSaving(false); } }
      setProfile(formState(result)); onSaveProfile?.(result as unknown as LegacyApplicantProfile); setSaved(true); window.setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save profile."); }
    finally { setSaving(false); }
  };

  const field = (extra = "") => `w-full text-xs px-3 py-2 border border-slate-300 rounded-md text-slate-800 disabled:bg-slate-100 disabled:text-slate-600 ${extra}`;
  if (loading) return <div className="max-w-7xl mx-auto py-12 flex justify-center text-sm text-slate-500">Loading profile...</div>;

  return <div className="space-y-6 max-w-7xl mx-auto pb-8">
    {saved && <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /><span className="text-xs font-bold">Profile Updated Successfully</span></div>}
    {error && <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex gap-2.5 text-xs"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    <form onSubmit={submit} className="space-y-5">
      <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-4">
        <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2"><User className="w-4 h-4 text-emerald-600" />1. Personal & Employment Details</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="relative">
              {photoPreview || profile.profilePhotoPath ? <img src={photoPreview || `${getProfilePhotoUrl()}?v=${photoKey}`} alt="Profile" className="w-36 h-36 rounded-2xl object-cover border-2 border-white shadow-xs ring-1 ring-slate-200" /> : <div className="w-36 h-36 rounded-2xl bg-slate-200 border-2 border-white shadow-xs ring-1 ring-slate-200 flex items-center justify-center"><User className="w-14 h-14 text-slate-400" /></div>}
              <label title={photoSaving ? "Saving profile photo..." : pendingPhoto ? "Photo selected — save profile to apply" : "Change profile photo"} className="absolute bottom-0 right-0 p-1.5 rounded-lg shadow-xs bg-white text-slate-600 hover:bg-slate-100 cursor-pointer"><Camera className="w-4 h-4" /><input type="file" accept="image/jpeg,image/png,image/webp" disabled={photoSaving} onChange={choosePhoto} className="hidden" /></label>
            </div>
            {photoSaving && <span className="text-[10px] text-slate-500">Saving photo...</span>}
            {photoError && <span className="text-[10px] text-red-600 text-center max-w-[210px]">{photoError}</span>}
          </div>
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div><label className="block font-semibold text-slate-700 mb-1">Salutation</label><select required value={profile.salutation || ""} onChange={e => change("salutation", e.target.value)} className={field()}><option value="">Select</option><option>Dr.</option><option>Mr.</option><option>Ms.</option><option>Prof.</option></select></div>
            <div><label className="block font-semibold text-slate-700 mb-1">Full Name</label><input required value={profile.applicantName || ""} disabled={!isAdmin} onChange={e => change("applicantName", e.target.value)} className={field()} /></div>
            <div><label className="block font-semibold text-slate-700 mb-1">Employment Type</label><select required value={profile.employmentType || ""} onChange={e => employmentChange(e.target.value)} className={field()}><option value="">Select Employment Type</option>{employmentTypes.map(x => <option key={x.id} value={x.code}>{x.displayName}</option>)}</select></div>
            <div><label className="block font-semibold text-slate-700 mb-1">Gender</label><select required value={profile.gender || ""} onChange={e => change("gender", e.target.value)} className={field()}><option value="">Select</option><option>Female</option><option>Male</option><option>Other</option></select></div>
            <div><label className="block font-semibold text-slate-700 mb-1">Date of Birth</label><input required type="date" value={profile.dateOfBirth || ""} onChange={e => change("dateOfBirth", e.target.value)} className={field()} /></div>
            <div><label className="block font-semibold text-slate-700 mb-1">Blood Group</label><select required value={profile.bloodGroup || ""} onChange={e => change("bloodGroup", e.target.value)} className={field()}><option value="">Select Blood Group</option>{["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(x => <option key={x}>{x}</option>)}</select></div>
            <div><label className="block font-semibold text-slate-700 mb-1">Mobile</label><input required type="tel" inputMode="numeric" maxLength={15} pattern="[0-9]{10,15}" value={profile.mobileNo || ""} disabled={!isAdmin} onChange={e => change("mobileNo", e.target.value.replace(/\D/g, "").slice(0,15))} className={field("font-mono")} /></div>
            <div className="sm:col-span-2"><label className="block font-semibold text-slate-700 mb-1">Personal / Official Email</label><input required type="email" value={profile.personalEmail || ""} disabled={!isAdmin} onChange={e => change("personalEmail", e.target.value)} className={field("font-mono")} /></div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5">
        <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-600" />2. Address & Communication Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
          <div className="sm:col-span-2 lg:col-span-2"><label className="block font-semibold text-slate-700 mb-1">Campus / Residential Address</label><input required value={profile.address || ""} onChange={e => change("address", e.target.value)} className={field()} /></div>
          <div><label className="block font-semibold text-slate-700 mb-1">City / District</label><input required readOnly value={profile.city || ""} className={field("bg-slate-50")} /></div>
          <div><label className="block font-semibold text-slate-700 mb-1">State</label><input required readOnly value={profile.state || ""} className={field("bg-slate-50")} /></div>
          <div><label className="block font-semibold text-slate-700 mb-1">Pincode</label><input required inputMode="numeric" maxLength={6} pattern="[0-9]{6}" value={profile.pincode || ""} onChange={e => change("pincode", e.target.value.replace(/\D/g, "").slice(0,6))} className={field("font-mono")} />{pincodeLoading && <p className="text-[10px] text-slate-500 mt-1">Finding location...</p>}{pincodeError && <p className="text-[10px] text-red-600 mt-1">{pincodeError}</p>}</div>
        </div>
      </section>

      {showBank && <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5"><h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-600" />3. Bank Account & Identity Records</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div><label className="block font-semibold text-slate-700 mb-1">PAN</label><input required maxLength={10} pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" value={profile.panNo || ""} onChange={e => change("panNo", e.target.value.toUpperCase())} className={field("font-mono uppercase font-bold")} /></div>
        <div><label className="block font-semibold text-slate-700 mb-1">Bank</label><select required value={profile.bankName || ""} onChange={e => change("bankName", e.target.value)} className={field()}><option value="">Select Bank</option>{banks.map(x => <option key={x.id} value={x.bankName}>{x.bankName}</option>)}</select></div>
        <div><label className="block font-semibold text-slate-700 mb-1">Account Number</label><input required inputMode="numeric" maxLength={30} pattern="[0-9]{6,30}" value={profile.accountNo || ""} onChange={e => change("accountNo", e.target.value.replace(/\D/g, ""))} className={field("font-mono")} /></div>
        <div><label className="block font-semibold text-slate-700 mb-1">IFSC Code</label><input required maxLength={11} pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" value={profile.ifscCode || ""} onChange={e => change("ifscCode", e.target.value.toUpperCase())} className={field("font-mono uppercase")} /></div>
      </div></section>}

      <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3.5 sm:p-5 space-y-3.5"><h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-600" />4. Cadre / Project / Academic Details</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
        {(employmentCode === "permanent" || employmentCode === "deputation") && <><div><label className="block font-semibold text-slate-700 mb-1">Designation</label><input required value={profile.designation || ""} onChange={e => change("designation", e.target.value)} className={field()} /></div><div><label className="block font-semibold text-slate-700 mb-1">Department / Cell</label><select required value={profile.departmentId ?? ""} onChange={e => change("departmentId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select Department / Cell</option>{[...departments,...cells].map(x => <option key={x.id} value={x.id}>{x.unitName}</option>)}</select></div><div><label className="block font-semibold text-slate-700 mb-1">Reporting Officer</label><select required value={profile.reportingOfficerId ?? ""} onChange={e => change("reportingOfficerId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select Reporting Officer</option>{officerOptions}</select></div></>}
        {employmentCode === "contractual" && <><div><label className="block font-semibold text-slate-700 mb-1">Designation</label><input required value={profile.designation || ""} onChange={e => change("designation", e.target.value)} className={field()} /></div><div><label className="block font-semibold text-slate-700 mb-1">Project / Department / Cell</label><select required value={profile.projectId ?? ""} onChange={e => change("projectId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select Project / Department / Cell</option>{[...projects,...departments,...cells].map(x => <option key={x.id} value={x.id}>{x.unitName}</option>)}</select></div><div><label className="block font-semibold text-slate-700 mb-1">Reporting Manager / PI</label><select required value={profile.reportingManagerId ?? ""} onChange={e => change("reportingManagerId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select Reporting Manager / PI</option>{officerOptions}</select></div></>}
        {employmentCode === "researcher_project_staff" && <><div><label className="block font-semibold text-slate-700 mb-1">Designation</label><input required value={profile.designation || ""} onChange={e => change("designation", e.target.value)} className={field()} /></div><div><label className="block font-semibold text-slate-700 mb-1">Project</label><select required value={profile.projectId ?? ""} onChange={e => change("projectId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select Project</option>{projects.map(x => <option key={x.id} value={x.id}>{x.unitName}</option>)}</select></div><div><label className="block font-semibold text-slate-700 mb-1">PI</label><select required value={profile.piUserId ?? ""} onChange={e => change("piUserId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select PI</option>{officerOptions}</select></div></>}
        {(employmentCode === "phd_scholar" || employmentCode === "intern") && <div><label className="block font-semibold text-slate-700 mb-1">PI</label><select required value={profile.piUserId ?? ""} onChange={e => change("piUserId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select PI</option>{officerOptions}</select></div>}
        {employmentCode === "msc_student" && <><div><label className="block font-semibold text-slate-700 mb-1">Stream</label><input required value={profile.stream || ""} onChange={e => change("stream", e.target.value)} className={field()} /></div><div><label className="block font-semibold text-slate-700 mb-1">Batch</label><select required value={profile.batchId ?? ""} onChange={e => change("batchId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select MSc Batch</option>{batchOptions.map(x => <option key={x.id} value={x.id}>{x.batchLabel}</option>)}</select></div><div><label className="block font-semibold text-slate-700 mb-1">PI</label><select required value={profile.piUserId ?? ""} onChange={e => change("piUserId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select PI</option>{officerOptions}</select></div></>}
        {employmentCode === "diploma_trainee" && <><div><label className="block font-semibold text-slate-700 mb-1">Course Name</label><input required value={profile.courseName || ""} onChange={e => change("courseName", e.target.value)} className={field()} /></div><div><label className="block font-semibold text-slate-700 mb-1">Batch</label><select required value={profile.batchId ?? ""} onChange={e => change("batchId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select Diploma Batch</option>{batchOptions.map(x => <option key={x.id} value={x.id}>{x.batchLabel}</option>)}</select></div><div><label className="block font-semibold text-slate-700 mb-1">PI</label><select required value={profile.piUserId ?? ""} onChange={e => change("piUserId", e.target.value ? Number(e.target.value) : null)} className={field()}><option value="">Select PI</option>{officerOptions}</select></div></>}
        <div><label className="block font-semibold text-slate-700 mb-1">Date of Joining</label><input required type="date" value={profile.dateOfJoining || ""} onChange={e => change("dateOfJoining", e.target.value)} className={field()} /></div>
        <div><label className="block font-semibold text-slate-700 mb-1">Valid Up To</label><input required type="date" value={profile.validUpTo || ""} disabled={permanent(profile.employmentType || "")} onChange={e => change("validUpTo", e.target.value)} className={field(permanent(profile.employmentType || "") ? "bg-slate-100 font-semibold" : "")} />{permanent(profile.employmentType || "") && <p className="text-[10px] text-slate-500 mt-1">Automatically calculated by the server for Permanent employment.</p>}</div>
      </div></section>

      <div className="flex justify-end pt-2 pb-6"><button type="submit" disabled={saving || photoSaving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs text-xs"><Save className="w-4 h-4" />{saving ? "Saving..." : "Save Profile Changes"}</button></div>
    </form>
  </div>;
};
export default ProfileForm;
