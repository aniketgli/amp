import {
  ApplicantProfileRecord,
  getProfileByUserId,
  upsertProfile,
} from "../repositories/profile.repository";

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();

  return text || null;
}

function validateProfileInput(input: any): void {
  const applicantName = cleanString(input.applicantName);
  const mobileNo = cleanString(input.mobileNo);
  const personalEmail = cleanString(input.personalEmail);

  if (!applicantName) {
    throw new Error("Full Name is required.");
  }

  if (!mobileNo) {
    throw new Error("Mobile Number is required.");
  }

  if (!/^[0-9]{10,15}$/.test(mobileNo)) {
    throw new Error("Enter a valid mobile number.");
  }

  if (!personalEmail) {
    throw new Error("Personal Email is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
    throw new Error("Enter a valid email address.");
  }
}

export async function getApplicantProfile(userId: number | string) {
  return getProfileByUserId(userId);
}

export async function saveApplicantProfile(
  userId: number | string,
  input: any,
) {
  validateProfileInput(input);

  const profile: ApplicantProfileRecord = {
    userId,

    salutation: cleanString(input.salutation),
    applicantName: String(input.applicantName).trim(),
    gender: cleanString(input.gender),
    dateOfBirth: cleanString(input.dateOfBirth),
    bloodGroup: cleanString(input.bloodGroup),

    mobileNo: String(input.mobileNo).trim(),
    personalEmail: String(input.personalEmail).trim(),

    wiiOfficialEmail: cleanString(input.wiiOfficialEmail),

    address: cleanString(input.address),
    city: cleanString(input.city),
    state: cleanString(input.state),
    pincode: cleanString(input.pincode),

    designation: cleanString(input.designation),
    departmentCellProject: cleanString(input.departmentCellProject),

    supervisingOfficerId: input.supervisingOfficerId ?? null,

    supervisingOfficerName: cleanString(input.supervisingOfficerName),

    dateOfJoining: cleanString(input.dateOfJoining),

    validUpTo: cleanString(input.validUpTo),

    panNo: cleanString(input.panNo),
    bankName: cleanString(input.bankName),
    accountNo: cleanString(input.accountNo),
    ifscCode: cleanString(input.ifscCode),

    officeOrderFileName: cleanString(input.officeOrderFileName),

    biometricId: cleanString(input.biometricId),
  };

  return upsertProfile(profile);
}
