import React, { useEffect, useState } from "react";
import { UserRole, ApplicantProfile } from "../../../types/requisition";

import { loginUser, registerUser } from "../../../api/auth.api";

import {
  User,
  Lock,
  Mail,
  Phone,
  UserPlus,
  LogIn,
  X,
  CheckCircle2,
  Building2,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

// ============================================================
// AUTH MODAL PROPS
// ============================================================

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onLoginSuccess: (
    userRole: UserRole,
    userProfile?: Partial<ApplicantProfile>,
  ) => void;
}

// ============================================================
// FRONTEND ROLE MAPPING
// ============================================================
//
// IMPORTANT:
// This mapping is ONLY for UI/persona handling.
//
// Backend + Database remain the actual authorization source.
//
// Registration NEVER assigns a role from this file.
// ============================================================

const ROLE_CODE_MAP: Record<string, UserRole> = {
  user: "applicant",
  applicant: "applicant",

  reporting_manager: "supervisor",
  supervisor: "supervisor",

  nodal_officer: "lab_nodal",
  lab_nodal: "lab_nodal",

  associate_nodal_officer: "assoc_lab_nodal",
  assoc_lab_nodal: "assoc_lab_nodal",

  it_head: "it_officer",
  it_officer: "it_officer",

  manager: "section_head",
  section_head: "section_head",

  administrator: "admin",
  admin: "admin",
};

// ============================================================
// CAPTCHA
// ============================================================

const generateCaptchaCode = (): string => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

  let result = "";

  for (let i = 0; i < 6; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

// ============================================================
// AUTH MODAL
// ============================================================

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<"login" | "register">("login");

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  const [loginEmail, setLoginEmail] = useState("");

  const [loginPassword, setLoginPassword] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // ----------------------------------------------------------
  // REGISTRATION
  // ----------------------------------------------------------

  const [regName, setRegName] = useState("");

  const [regEmail, setRegEmail] = useState("");

  const [regPhone, setRegPhone] = useState("");

  const [regPassword, setRegPassword] = useState("");

  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [showRegPassword, setShowRegPassword] = useState(false);

  // ----------------------------------------------------------
  // CAPTCHA
  // ----------------------------------------------------------

  const [captchaCode, setCaptchaCode] = useState(generateCaptchaCode());

  const [userCaptchaInput, setUserCaptchaInput] = useState("");

  // ----------------------------------------------------------
  // UI STATE
  // ----------------------------------------------------------

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ----------------------------------------------------------
  // RESET
  // ----------------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setUserCaptchaInput("");
      setCaptchaCode(generateCaptchaCode());
    }
  }, [isOpen]);

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setUserCaptchaInput("");
    setCaptchaCode(generateCaptchaCode());
  }, [mode]);

  if (!isOpen) {
    return null;
  }

  // ==========================================================
  // HELPERS
  // ==========================================================

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());

    setUserCaptchaInput("");
    setErrorMessage(null);
  };

  const resetRegistrationForm = () => {
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setRegPassword("");
    setRegConfirmPassword("");
    setUserCaptchaInput("");
    setCaptchaCode(generateCaptchaCode());
  };

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    // --------------------------------------------------------
    // CLIENT-SIDE UX VALIDATION ONLY
    // --------------------------------------------------------

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage("Please enter your email and password.");

      return;
    }

    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMessage("Invalid captcha code. Please try again.");

      refreshCaptcha();

      return;
    }

    try {
      setIsSubmitting(true);

      // ------------------------------------------------------
      // BACKEND AUTHENTICATION
      // ------------------------------------------------------
      //
      // Backend validates:
      // - email
      // - password
      // - account status
      // - activation status
      // - assigned database roles
      //
      // Frontend does NOT decide whether login is valid.
      // ------------------------------------------------------

      const response = await loginUser({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (!response.success) {
        setErrorMessage(response.message || "Unable to login.");

        return;
      }

      // ------------------------------------------------------
      // DATABASE ROLE → FRONTEND PERSONA
      // ------------------------------------------------------

      const databaseRoles = response.user?.roles || [];

      const mappedRoles = databaseRoles
        .map((role) => {
          const code = String(role?.code || "")
            .trim()
            .toLowerCase();

          return ROLE_CODE_MAP[code];
        })
        .filter((role): role is UserRole => Boolean(role));

      // Backend currentRole is authoritative.
      const backendCurrentRole = String(response.currentRole?.code || "user")
        .trim()
        .toLowerCase();

      const frontendRole = ROLE_CODE_MAP[backendCurrentRole] || "applicant";

      // ------------------------------------------------------
      // PROFILE FOR UI ONLY
      // ------------------------------------------------------

      const profile: Partial<ApplicantProfile> = {
        applicantName: response.user?.fullName || "",

        personalEmail: response.user?.email || "",

        mobileNo: response.user?.phone || "",
      };

      // ------------------------------------------------------
      // IMPORTANT
      // ------------------------------------------------------
      //
      // No localStorage token.
      // No hardcoded user.
      // No frontend authentication.
      //
      // Backend session remains the source of truth.
      // ------------------------------------------------------

      onLoginSuccess(frontendRole, profile);

      setLoginPassword("");
      setUserCaptchaInput("");

      onClose();
    } catch (error) {
      console.error("Auth modal login error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to authentication server.",
      );

      refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // REGISTRATION
  // ==========================================================

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    // ------------------------------------------------------
    // REQUIRED FIELDS
    // ------------------------------------------------------

    if (
      !regName.trim() ||
      !regEmail.trim() ||
      !regPhone.trim() ||
      !regPassword ||
      !regConfirmPassword
    ) {
      setErrorMessage("Please fill in all required fields.");

      return;
    }

    // ------------------------------------------------------
    // EMAIL UX CHECK
    // ------------------------------------------------------

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(regEmail.trim())) {
      setErrorMessage("Please enter a valid email address.");

      return;
    }

    // ------------------------------------------------------
    // PHONE UX CHECK
    // ------------------------------------------------------

    const cleanPhone = regPhone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");

      return;
    }

    // ------------------------------------------------------
    // PASSWORD UX CHECK
    // ------------------------------------------------------

    if (regPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");

      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match.");

      return;
    }

    // ------------------------------------------------------
    // CAPTCHA
    // ------------------------------------------------------

    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMessage("Invalid captcha code. Please try again.");

      refreshCaptcha();

      return;
    }

    try {
      setIsSubmitting(true);

      // ----------------------------------------------------
      // BACKEND REGISTRATION
      // ----------------------------------------------------
      //
      // DO NOT send role from frontend.
      //
      // Backend MUST assign:
      //
      // DEFAULT ROLE = `user`
      //
      // Backend also:
      // - validates all fields
      // - checks duplicate account
      // - hashes password
      // - creates activation token
      // - sends activation email
      // ----------------------------------------------------

      const response = await registerUser({
        fullName: regName.trim(),

        email: regEmail.trim(),

        phone: cleanPhone,

        password: regPassword,
      });

      if (!response.success) {
        setErrorMessage(response.message || "Registration failed.");

        return;
      }

      // ----------------------------------------------------
      // SUCCESS
      // ----------------------------------------------------

      setSuccessMessage(
        response.message ||
          "Registration successful. Please check your email for the account activation link.",
      );

      resetRegistrationForm();
    } catch (error) {
      console.error("Auth modal registration error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to complete registration.",
      );

      refreshCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2.5 sm:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="bg-slate-900 text-white p-4 sm:p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close authentication window"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg sm:text-xl shadow-md border border-emerald-400 shrink-0">
              WII
            </div>

            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Wildlife Institute of India Portal
              </div>

              <h2 className="text-base sm:text-xl font-extrabold text-white leading-tight">
                {mode === "login"
                  ? "User Authentication & Login"
                  : "New User Registration"}
              </h2>
            </div>
          </div>

          {/* MODE TABS */}

          <div className="flex gap-2 mt-4 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "login"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Portal Login
            </button>

            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "register"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Register Account
            </button>
          </div>
        </div>

        {/* ==================================================
            BODY
        ================================================== */}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          {/* SUCCESS */}

          {successMessage && (
            <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />

              <span>{successMessage}</span>
            </div>
          )}

          {/* ERROR */}

          {errorMessage && (
            <div className="mb-4 bg-rose-50 border border-rose-300 text-rose-900 p-3.5 rounded-xl text-xs font-bold flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />

              <span>{errorMessage}</span>
            </div>
          )}

          {/* =================================================
              LOGIN
          ================================================= */}

          {mode === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* EMAIL */}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email ID / Username *
                </label>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    required
                    autoComplete="username"
                    placeholder="user@wii.gov.in"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password / Passcode *
                </label>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full text-xs pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowLoginPassword((previous) => !previous)
                    }
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={
                      showLoginPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* CAPTCHA */}

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Security Verification *
                </label>

                <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-300">
                  <div className="bg-slate-900 text-emerald-400 px-4 py-2 rounded-lg font-mono font-black text-lg tracking-widest select-none shadow-inner border border-emerald-500/30 italic">
                    <span className="line-through decoration-emerald-500/50">
                      {captchaCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-600" />

                    <span>Refresh</span>
                  </button>
                </div>

                <input
                  type="text"
                  required
                  maxLength={6}
                  value={userCaptchaInput}
                  onChange={(event) =>
                    setUserCaptchaInput(
                      event.target.value.toUpperCase().slice(0, 6),
                    )
                  }
                  autoComplete="off"
                  placeholder="Enter Captcha Code"
                  className="w-full mt-2 text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-bold text-slate-900"
                />
              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Authenticate & Access Dashboard
                  </>
                )}
              </button>
            </form>
          ) : (
            /* =================================================
               REGISTRATION
            ================================================= */

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* NAME */}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Full Name *
                </label>

                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(event) => setRegName(event.target.value)}
                    autoComplete="name"
                    placeholder="Enter full name"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* EMAIL */}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Personal Email *
                </label>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(event) => setRegEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="user@example.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* PHONE */}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Mobile Number *
                </label>

                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={regPhone}
                    onChange={(event) =>
                      setRegPhone(
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    autoComplete="tel"
                    placeholder="9876543210"
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* PASSWORDS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Password *
                  </label>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regPassword}
                      onChange={(event) => setRegPassword(event.target.value)}
                      autoComplete="new-password"
                      placeholder="Minimum 6 characters"
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Confirm Password *
                  </label>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />

                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      value={regConfirmPassword}
                      onChange={(event) =>
                        setRegConfirmPassword(event.target.value)
                      }
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRegPassword((previous) => !previous)}
                className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                {showRegPassword ? "Hide passwords" : "Show passwords"}
              </button>

              {/* DEFAULT ROLE */}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />

                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Default Account Role
                    </p>

                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Every new registration receives the default
                      <strong> User</strong> role from the backend. Additional
                      roles can only be assigned through the authorized
                      administration workflow.
                    </p>
                  </div>
                </div>
              </div>

              {/* CAPTCHA */}

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Security Verification *
                </label>

                <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-300">
                  <div className="bg-slate-900 text-emerald-400 px-4 py-2 rounded-lg font-mono font-black text-lg tracking-widest select-none shadow-inner border border-emerald-500/30 italic">
                    <span className="line-through decoration-emerald-500/50">
                      {captchaCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    Refresh
                  </button>
                </div>

                <input
                  type="text"
                  required
                  maxLength={6}
                  value={userCaptchaInput}
                  onChange={(event) =>
                    setUserCaptchaInput(
                      event.target.value.toUpperCase().slice(0, 6),
                    )
                  }
                  autoComplete="off"
                  placeholder="Enter Captcha Code"
                  className="w-full mt-2 text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-bold text-slate-900"
                />
              </div>

              {/* REGISTER */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Submit Registration
                  </>
                )}
              </button>

              {/* ACTIVATION INFO */}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />

                  <p className="text-[11px] text-blue-800">
                    After successful registration, the backend will send an
                    account activation link to your registered email. You must
                    activate the account before logging in.
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
