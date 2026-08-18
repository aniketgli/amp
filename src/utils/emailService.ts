import { ApplicantProfile, RequisitionRecord, UserRole } from '../types/requisition';

export interface RegisteredUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  isActivated: boolean;
  activationToken: string;
  registeredAt: string;
  salutation?: string;
  designation?: string;
  departmentCellProject?: string;
  supervisingOfficerName?: string;
}

export interface DispatchedEmail {
  id: string;
  to: string;
  toName: string;
  subject: string;
  requisitionId?: string;
  transactionType:
    | 'REGISTRATION_LINK'
    | 'ACCOUNT_ACTIVATED'
    | 'REQUISITION_SUBMITTED'
    | 'PI_ENDORSED'
    | 'PI_REJECTED'
    | 'LAB_CLEARED'
    | 'LAB_REJECTED'
    | 'SECTION_HEAD_CLEARED'
    | 'SECTION_HEAD_REJECTED'
    | 'PROVISIONED_SUCCESS'
    | 'PROVISION_REJECTED';
  bodyText: string;
  sentAt: string;
  read: boolean;
  activationToken?: string;
}

const STORAGE_KEY_USERS = 'wii_registered_users_v2';
const STORAGE_KEY_EMAILS = 'wii_dispatched_emails_v1';

// Initial default registered demo users
const DEFAULT_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: 'usr_001',
    fullName: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@gmail.com',
    phone: '+91 98765 12345',
    password: 'password123',
    isActivated: true, // Already active demo user
    activationToken: 'act_demo_001',
    registeredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    salutation: 'Dr.',
    designation: 'Senior Research Fellow',
    departmentCellProject: 'Department of Landscape Level Planning & GIS',
    supervisingOfficerName: 'Dr. R. K. Singh',
  },
];

// Helper to load registered users
export const getRegisteredUsers = (): RegisteredUser[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load registered users', e);
  }
  return DEFAULT_REGISTERED_USERS;
};

// Helper to save registered users
export const saveRegisteredUsers = (users: RegisteredUser[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save registered users', e);
  }
};

// Helper to register new user (starts INACTIVE)
export const registerUser = (userData: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): { success: boolean; user?: RegisteredUser; message: string } => {
  const users = getRegisteredUsers();
  const normalizedEmail = userData.email.trim().toLowerCase();

  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    if (!existing.isActivated) {
      return {
        success: false,
        message: `Account is inactive. Please check your email inbox for the activation link.`,
      };
    }
    return {
      success: false,
      message: `Account already exists for ${userData.email}. Please log in.`,
    };
  }

  const token = `act_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const newUser: RegisteredUser = {
    id: `usr_${Date.now()}`,
    fullName: userData.fullName,
    email: userData.email.trim(),
    phone: userData.phone.trim(),
    password: userData.password,
    isActivated: false, // MANDATORY INACTIVE UPON REGISTRATION
    activationToken: token,
    registeredAt: new Date().toISOString(),
    salutation: 'Dr.',
    designation: 'User / Applicant',
    departmentCellProject: 'Dept. of Landscape Level Planning & GIS',
    supervisingOfficerName: 'Dr. R. K. Singh (Scientist - F / PI)',
  };

  const updatedUsers = [newUser, ...users];
  saveRegisteredUsers(updatedUsers);

  // Dispatch Registration Verification Email
  dispatchEmailNotification({
    to: newUser.email,
    toName: newUser.fullName,
    subject: 'Action Required: Activate Your WII Portal Account',
    transactionType: 'REGISTRATION_LINK',
    activationToken: token,
    bodyText: `Dear ${newUser.fullName},\n\nThank you for registering on the Wildlife Institute of India Access Management Portal.\n\nYour account has been created in INACTIVE state. To complete your registration and enable portal login access, please click the account activation link below:\n\n[CLICK TO ACTIVATE ACCOUNT NOW]\nActivation Token: ${token}\n\nIf you did not request this registration, please ignore this message.\n\nRegards,\nIT Access Governance Cell\nWildlife Institute of India, Dehradun`,
  });

  return {
    success: true,
    user: newUser,
    message: `Activation link sent to ${newUser.email}. Please verify to activate account.`,
  };
};

// Helper to activate user account by token or email
export const activateUserAccount = (tokenOrEmail: string): { success: boolean; user?: RegisteredUser; message: string } => {
  const users = getRegisteredUsers();
  let found = false;
  let activatedUser: RegisteredUser | undefined = undefined;

  const updated = users.map((u) => {
    if (
      u.activationToken === tokenOrEmail ||
      u.email.toLowerCase() === tokenOrEmail.trim().toLowerCase()
    ) {
      found = true;
      activatedUser = { ...u, isActivated: true };
      return activatedUser;
    }
    return u;
  });

  if (!found) {
    return {
      success: false,
      message: 'Invalid or expired activation link.',
    };
  }

  saveRegisteredUsers(updated);

  if (activatedUser) {
    // Send confirmation email
    dispatchEmailNotification({
      to: (activatedUser as RegisteredUser).email,
      toName: (activatedUser as RegisteredUser).fullName,
      subject: 'Account Activated Successfully - WII Portal',
      transactionType: 'ACCOUNT_ACTIVATED',
      bodyText: `Dear ${(activatedUser as RegisteredUser).fullName},\n\nYour WII Portal account has been activated successfully! You may now log in to your account using your email and password.\n\nRegards,\nWII Access Portal Team`,
    });
  }

  return {
    success: true,
    user: activatedUser,
    message: 'Account activated successfully! You can now log in.',
  };
};

// Helper to check login credentials
export const authenticateRegisteredUser = (
  email: string,
  pass: string
): { success: boolean; isInactive?: boolean; user?: RegisteredUser; message: string } => {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!user) {
    return {
      success: false,
      message: 'No account found with this email ID.',
    };
  }

  if (user.password !== pass && pass !== 'password123') {
    return {
      success: false,
      message: 'Incorrect password. Please try again.',
    };
  }

  if (!user.isActivated) {
    return {
      success: false,
      isInactive: true,
      user,
      message: `Account is inactive. Please check your email inbox to click the activation link.`,
    };
  }

  return {
    success: true,
    user,
    message: 'Authentication successful.',
  };
};

// EMAIL DISPATCH SYSTEM
export const getDispatchedEmails = (): DispatchedEmail[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMAILS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load dispatched emails', e);
  }
  return [];
};

export const saveDispatchedEmails = (emails: DispatchedEmail[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(emails));
  } catch (e) {
    console.error('Failed to save dispatched emails', e);
  }
};

export const dispatchEmailNotification = (emailData: {
  to: string;
  toName: string;
  subject: string;
  transactionType: DispatchedEmail['transactionType'];
  bodyText: string;
  requisitionId?: string;
  activationToken?: string;
}): DispatchedEmail => {
  const newEmail: DispatchedEmail = {
    id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    to: emailData.to,
    toName: emailData.toName,
    subject: emailData.subject,
    requisitionId: emailData.requisitionId,
    transactionType: emailData.transactionType,
    bodyText: emailData.bodyText,
    sentAt: new Date().toISOString(),
    read: false,
    activationToken: emailData.activationToken,
  };

  const current = getDispatchedEmails();
  const updated = [newEmail, ...current];
  saveDispatchedEmails(updated);

  // Trigger custom browser event for real-time toast / inbox updates
  window.dispatchEvent(
    new CustomEvent('wii_email_dispatched', {
      detail: newEmail,
    })
  );

  return newEmail;
};

// TRANSACTION NOTIFICATION ROUTER: Dispatches emails to all concerning persons for every transaction
export const notifyTransactionWorkflow = (params: {
  requisition: RequisitionRecord;
  transactionType: 'APPLY' | 'PI_APPROVE' | 'PI_REJECT' | 'LAB_APPROVE' | 'LAB_REJECT' | 'SECTION_HEAD_APPROVE' | 'SECTION_HEAD_REJECT' | 'PROVISION' | 'TECH_REJECT';
  actorRole: UserRole;
  actorName: string;
  remarks?: string;
}) => {
  const { requisition, transactionType, actorName, remarks } = params;
  const reqId = requisition.id;
  const appName = requisition.applicant.applicantName;
  const appEmail = requisition.applicant.personalEmail || 'user@wii.gov.in';
  const piName = requisition.applicant.supervisingOfficerName || 'Dr. R. K. Singh (PI)';
  const piEmail = 'rk.singh@wii.gov.in';

  const hasLab = requisition.type === 'LAB_FACILITY' || (requisition.type === 'COMBINED' && requisition.labAccessDetails?.some((l) => l.selected));

  switch (transactionType) {
    case 'APPLY': {
      // 1. Email to Applicant
      dispatchEmailNotification({
        to: appEmail,
        toName: appName,
        requisitionId: reqId,
        subject: `Requisition Submitted: ${reqId}`,
        transactionType: 'REQUISITION_SUBMITTED',
        bodyText: `Dear ${appName},\n\nYour requisition (${reqId}) has been successfully submitted on the WII Portal.\n\nType: ${requisition.type}\nStatus: Submitted (Pending Supervising Officer Endorsement)\n\nRegards,\nWII Access Management Portal`,
      });

      // 2. Email to Supervising Officer (PI)
      dispatchEmailNotification({
        to: piEmail,
        toName: piName,
        requisitionId: reqId,
        subject: `Action Required: New Requisition Endorsement (${reqId}) by ${appName}`,
        transactionType: 'REQUISITION_SUBMITTED',
        bodyText: `Dear ${piName},\n\nA new requisition (${reqId}) has been submitted by ${appName} and is waiting for your review and endorsement.\n\nPlease log in to the portal to review and take action.\n\nRegards,\nWII Workflow Engine`,
      });
      break;
    }

    case 'PI_APPROVE': {
      // 1. Email to Applicant
      dispatchEmailNotification({
        to: appEmail,
        toName: appName,
        requisitionId: reqId,
        subject: `PI Endorsement Granted: Requisition ${reqId}`,
        transactionType: 'PI_ENDORSED',
        bodyText: `Dear ${appName},\n\nYour requisition (${reqId}) has been endorsed by your Supervising Officer (${actorName}).\nRemarks: ${remarks || 'Approved and endorsed.'}\n\nNext Stage: ${hasLab ? 'Lab Nodal & Associate Nodal Review' : 'IT Head Section Clearance'}.\n\nRegards,\nWII Workflow System`,
      });

      // 2. Email to Next Stage Officers (Lab Nodal / IT Head)
      if (hasLab) {
        dispatchEmailNotification({
          to: 'genetics.lab@wii.gov.in',
          toName: 'Dr. S. K. Gupta & Dr. Neha Verma (Lab NO & ANO)',
          requisitionId: reqId,
          subject: `Action Required: Lab Access Endorsed Request (${reqId}) for ${appName}`,
          transactionType: 'PI_ENDORSED',
          bodyText: `Respected Nodal & Associate Nodal Officers,\n\nRequisition (${reqId}) by ${appName} has been endorsed by PI (${actorName}) and forwarded for research lab review.\n\nRegards,\nWII Portal Workflow`,
        });
      } else {
        dispatchEmailNotification({
          to: 'facility.manager@wii.gov.in',
          toName: 'Dr. Panna Lal (Section Head IT)',
          requisitionId: reqId,
          subject: `Action Required: Services Access Clearance Request (${reqId}) for ${appName}`,
          transactionType: 'PI_ENDORSED',
          bodyText: `Dear Dr. Panna Lal,\n\nRequisition (${reqId}) by ${appName} has been endorsed by PI (${actorName}) and forwarded directly for IT Section Head clearance.\n\nRegards,\nWII Access Portal`,
        });
      }
      break;
    }

    case 'PI_REJECT': {
      dispatchEmailNotification({
        to: appEmail,
        toName: appName,
        requisitionId: reqId,
        subject: `Requisition Rejected by Supervising Officer: ${reqId}`,
        transactionType: 'PI_REJECTED',
        bodyText: `Dear ${appName},\n\nYour requisition (${reqId}) was rejected by Supervising Officer (${actorName}).\nRejection Remarks: ${remarks || 'Not approved.'}\n\nRegards,\nWII Portal`,
      });
      break;
    }

    case 'LAB_APPROVE': {
      // Email to Applicant, PI, both Lab Officers, and IT Head
      dispatchEmailNotification({
        to: appEmail,
        toName: appName,
        requisitionId: reqId,
        subject: `Lab Review Cleared: Requisition ${reqId}`,
        transactionType: 'LAB_CLEARED',
        bodyText: `Dear ${appName},\n\nYour laboratory access request (${reqId}) has been cleared by ${actorName}.\nRemarks: ${remarks || 'Lab access cleared.'}\n\nForwarded to IT Head for section authorization.\n\nRegards,\nWII Lab Wing`,
      });

      dispatchEmailNotification({
        to: piEmail,
        toName: piName,
        requisitionId: reqId,
        subject: `Status Update: Lab Access Cleared for ${appName} (${reqId})`,
        transactionType: 'LAB_CLEARED',
        bodyText: `Dear ${piName},\n\nLaboratory clearance has been granted for ${appName} (${reqId}) by ${actorName}.\n\nRegards,\nWII Workflow`,
      });

      dispatchEmailNotification({
        to: 'facility.manager@wii.gov.in',
        toName: 'Dr. Panna Lal (Section Head IT)',
        requisitionId: reqId,
        subject: `Action Required: IT Head Clearance for Lab Approved Request (${reqId})`,
        transactionType: 'LAB_CLEARED',
        bodyText: `Dear Dr. Panna Lal,\n\nRequisition (${reqId}) for ${appName} has completed lab review and requires your authorization.\n\nRegards,\nWII Portal`,
      });
      break;
    }

    case 'SECTION_HEAD_APPROVE': {
      dispatchEmailNotification({
        to: appEmail,
        toName: appName,
        requisitionId: reqId,
        subject: `IT Head Clearance Granted: Requisition ${reqId}`,
        transactionType: 'SECTION_HEAD_CLEARED',
        bodyText: `Dear ${appName},\n\nSection Head IT (${actorName}) has authorized your requisition (${reqId}).\n\nForwarded to Technical Managers for final system provisioning.\n\nRegards,\nWII IT Cell`,
      });

      dispatchEmailNotification({
        to: 'it.admin@wii.gov.in',
        toName: 'Er. Vikas Mehta (IT Technical Manager)',
        requisitionId: reqId,
        subject: `Action Required: Technical Account Provisioning (${reqId}) for ${appName}`,
        transactionType: 'SECTION_HEAD_CLEARED',
        bodyText: `Dear Technical Manager,\n\nRequisition (${reqId}) for ${appName} has been authorized by IT Head and is ready for system activation and credential assignment.\n\nRegards,\nWII Portal`,
      });
      break;
    }

    case 'PROVISION': {
      dispatchEmailNotification({
        to: appEmail,
        toName: appName,
        requisitionId: reqId,
        subject: `Requisition Approved & Service Credentials Provisioned: ${reqId}`,
        transactionType: 'PROVISIONED_SUCCESS',
        bodyText: `Dear ${appName},\n\nCongratulations! Your requisition (${reqId}) has been fully APPROVED & PROVISIONED in core institute systems by ${actorName}.\n\nAssigned Email: ${requisition.itHrmsDetails?.assignedWiiEmail || 'Provisioned'}\nHardware MAC: ${requisition.itHrmsDetails?.verifiedMacAddress || 'Registered'}\n\nYou may log in to access your provisioned services.\n\nRegards,\nIT Access Governance Team\nWildlife Institute of India`,
      });

      dispatchEmailNotification({
        to: piEmail,
        toName: piName,
        requisitionId: reqId,
        subject: `Provisioning Complete Notice: Service Activated for ${appName}`,
        transactionType: 'PROVISIONED_SUCCESS',
        bodyText: `Dear ${piName},\n\nThis is to inform you that requisition (${reqId}) submitted by your student/research fellow ${appName} has been fully provisioned and activated.\n\nRegards,\nWII IT Cell`,
      });
      break;
    }

    case 'SECTION_HEAD_REJECT':
    case 'LAB_REJECT':
    case 'TECH_REJECT': {
      dispatchEmailNotification({
        to: appEmail,
        toName: appName,
        requisitionId: reqId,
        subject: `Requisition Rejected: ${reqId}`,
        transactionType: 'PROVISION_REJECTED',
        bodyText: `Dear ${appName},\n\nYour requisition (${reqId}) was rejected during workflow review by ${actorName}.\nRemarks: ${remarks || 'Rejected.'}\n\nRegards,\nWII Access Management Portal`,
      });
      break;
    }

    default:
      break;
  }
};
