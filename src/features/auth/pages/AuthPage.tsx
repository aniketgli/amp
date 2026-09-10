import React, { useEffect, useRef, useState } from "react";

import { loginUser, registerUser } from "@/api/auth.api";

import { UserRole, ApplicantProfile } from "@/types";

import { WiiLogo } from "../../../components/common/WiiLogo";

import {
  User,
  Lock,
  Mail,
  Phone,
  UserPlus,
  LogIn,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
} from "lucide-react";

// ============================================================
// AUTH PAGE PROPS
// ============================================================

interface AuthPageProps {
  initialMode?: "login" | "register";

  isAuthenticated?: boolean;

  onLoginSuccess: (
    initialRole: UserRole,
    assignedRoles: UserRole[],
    userProfile?: Partial<ApplicantProfile>,
  ) => void;

  onNavigateHome?: () => void;
}

// ============================================================
// CAPTCHA
// ============================================================
//
// IMPORTANT:
// This CAPTCHA is only a frontend usability/security layer.
//
// It MUST NOT be considered authentication security.
//
// Actual authentication, registration validation and account
// activation are always validated by the backend.
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
// CAPTCHA CANVAS
// ============================================================

const CaptchaCanvas: React.FC<{
  code: string;
  onRefresh: () => void;
}> = ({ code, onRefresh }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // Background
    ctx.fillStyle = "#0f172a";

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise lines
    for (let i = 0; i < 8; i += 1) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.2 + Math.random() * 0.3})`;

      ctx.lineWidth = 1.5;

      ctx.beginPath();

      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);

      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);

      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 45; i += 1) {
      ctx.fillStyle = `rgba(52, 211, 153, ${Math.random() * 0.5})`;

      ctx.beginPath();

      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        1.2,
        0,
        Math.PI * 2,
      );

      ctx.fill();
    }

    // Captcha text
    ctx.font = "bold 22px monospace";

    ctx.textBaseline = "middle";

    const charWidth = (canvas.width - 24) / code.length;

    for (let i = 0; i < code.length; i += 1) {
      ctx.save();

      const x = 16 + i * charWidth;

      const y = canvas.height / 2 + (Math.random() * 4 - 2);

      const angle = (Math.random() - 0.5) * 0.35;

      ctx.translate(x, y);

      ctx.rotate(angle);

      ctx.fillStyle = i % 2 === 0 ? "#34d399" : "#a7f3d0";

      ctx.fillText(code[i], 0, 0);

      ctx.restore();
    }
  }, [code]);

  return (
    <div className="flex items-center gap-2 max-w-full">
      <canvas
        ref={canvasRef}
        width={160}
        height={44}
        className="rounded-xl border border-emerald-500/50 shadow-inner select-none cursor-pointer max-w-[150px] sm:max-w-[160px] h-[44px] shrink-0"
        onClick={onRefresh}
        title="Click image to generate new Captcha code"
      />

      <button
        type="button"
        onClick={onRefresh}
        className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold shrink-0 shadow-2xs min-h-[44px] min-w-[44px]"
        title="Refresh Captcha Code"
      >
        <RefreshCw className="w-4 h-4 text-emerald-600" />

        <span className="hidden sm:inline">Refresh Code</span>
      </button>
    </div>
  );
};

// ============================================================
// ROLE MAPPING
// ============================================================
//
// Backend/database role codes -> existing frontend role codes.
//
// This is ONLY for UI presentation.
//
// Backend authorization remains authoritative.
// ============================================================

const ROLE_CODE_MAP: Record<string, UserRole> = {
  user: "applicant",
  applicant: "applicant",

  administrator: "admin",
  admin: "admin",

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

  hrms_officer: "hrms_officer",

  super_admin: "super_admin",
};

// ============================================================
// AUTH PAGE
// ============================================================

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = "login",
  isAuthenticated = false,
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // ==========================================================
  // LOGIN STATE
  // ==========================================================

  const [loginEmail, setLoginEmail] = useState("");

  const [loginPassword, setLoginPassword] = useState("");

  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // ==========================================================
  // REGISTRATION STATE
  // ==========================================================

  const [regName, setRegName] = useState("");

  const [regEmail, setRegEmail] = useState("");

  const [regPhone, setRegPhone] = useState("");

  const [regPassword, setRegPassword] = useState("");

  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [showRegPassword, setShowRegPassword] = useState(false);

  // ==========================================================
  // CAPTCHA STATE
  // ==========================================================

  const [captchaCode, setCaptchaCode] = useState(generateCaptchaCode());

  const [userCaptchaInput, setUserCaptchaInput] = useState("");

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [formError, setFormError] = useState<string | null>(null);

  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(
    null,
  );

  const [isInactiveUserError, setIsInactiveUserError] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================================
  // INITIAL MODE
  // ==========================================================

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // ==========================================================
  // CAPTCHA REFRESH
  // ==========================================================

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());

    setUserCaptchaInput("");

    setFormError(null);

    setIsInactiveUserError(false);
  };

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormError(null);

    setIsInactiveUserError(false);

    // ------------------------------------------------------
    // BASIC UI VALIDATION
    // ------------------------------------------------------

    if (!loginEmail.trim() || !loginPassword) {
      setFormError("Please enter both your Email ID and Password.");

      return;
    }

    // ------------------------------------------------------
    // CAPTCHA
    // ------------------------------------------------------

    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setFormError(
        "Invalid Security Verification (Captcha) Code. Please enter the correct code.",
      );

      refreshCaptcha();

      return;
    }

    try {
      setIsSubmitting(true);

      // ----------------------------------------------------
      // BACKEND LOGIN
      // ----------------------------------------------------
      //
      // The backend:
      // - validates credentials
      // - validates activation/status
      // - determines assigned roles
      // - creates authentication session
      // - sets HttpOnly authentication cookie
      //
      // Frontend NEVER receives/stores the auth token as
      // persistent browser state.
      // ----------------------------------------------------

      const response = await loginUser({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      // ----------------------------------------------------
      // BACKEND ERROR
      // ----------------------------------------------------

      if (!response.success) {
        setFormError(response.message || "Unable to login.");

        return;
      }

      // ----------------------------------------------------
      // USER STATUS
      // ----------------------------------------------------

      if (String(response.user?.status || "").toLowerCase() !== "active") {
        setIsInactiveUserError(true);

        setFormError(
          response.message ||
            "Your account is inactive. Please contact the administrator.",
        );

        return;
      }

      // ----------------------------------------------------
      // PROFILE DATA FOR UI
      // ----------------------------------------------------

      const updatedProfile: Partial<ApplicantProfile> = {
        applicantName: response.user.fullName,

        personalEmail: response.user.email,

        mobileNo: response.user.phone,
      };

      // ----------------------------------------------------
      // DATABASE-ASSIGNED ROLES
      // ----------------------------------------------------

      const assignedRoles = (response.user.roles || [])
        .map((role) => {
          const code = String(role?.code || "")
            .trim()
            .toLowerCase();

          return ROLE_CODE_MAP[code];
        })
        .filter((role): role is UserRole => Boolean(role));

      const uniqueRoles = [...new Set<UserRole>(assignedRoles)];

      // ----------------------------------------------------
      // DEFAULT FRESH LOGIN PERSONA
      // ----------------------------------------------------
      //
      // New registration always receives `user` in backend.
      //
      // Existing users may have additional DB roles.
      //
      // Every fresh login starts in the normal User persona.
      //
      // This is a UI persona only — NOT authorization.
      // ----------------------------------------------------

      const initialRole: UserRole = "applicant";

      // ----------------------------------------------------
      // IMPORTANT
      // ----------------------------------------------------
      //
      // DO NOT:
      // localStorage.setItem(...)
      // saveLoginSession(...)
      // store JWT
      //
      // The backend HttpOnly cookie is the authentication
      // mechanism.
      // ----------------------------------------------------

      onLoginSuccess(initialRole, uniqueRoles, updatedProfile);
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      const status = (
        error as Error & {
          status?: number;
        }
      )?.status;

      if (status === 401) {
        setFormError(
          error instanceof Error ? error.message : "Invalid email or password.",
        );
      } else if (status === 403) {
        setIsInactiveUserError(true);

        setFormError(
          error instanceof Error
            ? error.message
            : "Your account is not permitted to login.",
        );
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "Unable to connect to the authentication server.",
        );
      }
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

    setFormError(null);

    setRegSuccessMessage(null);

    setIsInactiveUserError(false);

    // ------------------------------------------------------
    // REQUIRED FIELDS
    // ------------------------------------------------------

    if (
      !regName.trim() ||
      !regEmail.trim() ||
      !regPhone.trim() ||
      !regPassword
    ) {
      setFormError("Please fill in all required fields.");

      return;
    }

    // ------------------------------------------------------
    // PHONE
    // ------------------------------------------------------

    const cleanPhone = regPhone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError("Please enter a valid 10-digit Indian mobile number.");

      return;
    }

    // ------------------------------------------------------
    // PASSWORD
    // ------------------------------------------------------
    //
    // This is UX validation only.
    // Backend MUST validate password policy as well.
    // ------------------------------------------------------

    if (regPassword.length < 6) {
      setFormError("Password must be at least 6 characters long.");

      return;
    }

    if (regPassword !== regConfirmPassword) {
      setFormError("Passwords do not match.");

      return;
    }

    // ------------------------------------------------------
    // CAPTCHA
    // ------------------------------------------------------

    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setFormError("Invalid captcha code. Please try again.");

      refreshCaptcha();

      return;
    }

    try {
      setIsSubmitting(true);

      // ----------------------------------------------------
      // BACKEND REGISTRATION
      // ----------------------------------------------------
      //
      // The backend is responsible for:
      // - validating input
      // - checking duplicate email
      // - hashing password
      // - creating user
      // - assigning DEFAULT role = `user`
      // - generating activation token
      // - sending activation email
      //
      // Frontend does NOT assign the role.
      // ----------------------------------------------------

      const response = await registerUser({
        fullName: regName.trim(),

        email: regEmail.trim(),

        phone: cleanPhone,

        password: regPassword,
      });

      if (!response.success) {
        setFormError(response.message || "Unable to complete registration.");

        return;
      }

      // ----------------------------------------------------
      // SUCCESS
      // ----------------------------------------------------

      setRegSuccessMessage(
        response.message ||
          `Registration successful. An activation link has been sent to ${regEmail.trim()}. Please check your email inbox and activate your account before logging in.`,
      );

      // Clear registration form
      setRegName("");

      setRegEmail("");

      setRegPhone("");

      setRegPassword("");

      setRegConfirmPassword("");

      // Fresh captcha
      refreshCaptcha();
    } catch (error) {
      console.error("REGISTRATION ERROR:", error);

      const status = (
        error as Error & {
          status?: number;
        }
      )?.status;

      if (status === 409) {
        setFormError(
          error instanceof Error
            ? error.message
            : "An account with this email already exists.",
        );
      } else if (status === 400) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Please check the registration details.",
        );
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : "Unable to connect to the registration server.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-[85vh] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ==================================================
            BACK TO DASHBOARD
        ================================================== */}

        {isAuthenticated && onNavigateHome && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600" />
              Back to Portal Dashboard
            </button>
          </div>
        )}

        {/* ==================================================
            MAIN CARD
        ================================================== */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
          {/* HEADER */}

          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-8 relative border-b border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
              {/* LOGO */}

              <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-lg border border-slate-200 self-center sm:self-auto inline-block">
                <WiiLogo size="md" />
              </div>

              {/* TITLE */}

              <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {mode === "login"
                    ? "Account Login"
                    : "New User Account Registration"}
                </h1>

                <p className="text-xs text-slate-300 mt-0.5">
                  Access Management Portal
                </p>
              </div>
            </div>

            {/* MODE TABS */}

            <div className="flex gap-3 mt-6 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setMode("login");

                  setFormError(null);

                  setRegSuccessMessage(null);

                  refreshCaptcha();
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === "login"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("register");

                  setFormError(null);

                  setRegSuccessMessage(null);

                  refreshCaptcha();
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === "register"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Register Account
              </button>
            </div>
          </div>

          {/* FORM BODY */}

          <div className="p-6 sm:p-8">
            {/* REGISTRATION SUCCESS */}

            {regSuccessMessage && (
              <div className="max-w-2xl mx-auto mb-5 bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

                  <div>
                    <p className="font-bold text-xs text-emerald-950">
                      Registration Successful
                    </p>

                    <p className="text-emerald-800 font-medium text-[11px] mt-0.5">
                      {regSuccessMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ERROR */}

            {formError && (
              <div className="max-w-2xl mx-auto mb-5 bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-xl text-xs shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />

                  <div>
                    <p className="font-bold text-xs text-rose-950">
                      {isInactiveUserError
                        ? "Account Inactive"
                        : "Authentication Error"}
                    </p>

                    <p className="text-rose-800 font-medium text-[11px] mt-0.5">
                      {formError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                LOGIN FORM
            ================================================= */}

            {mode === "login" ? (
              <form
                onSubmit={handleLoginSubmit}
                className="space-y-5 max-w-2xl mx-auto"
              >
                {/* EMAIL */}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Personal Email / WII Email ID *
                  </label>

                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      required
                      autoComplete="username"
                      className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                      placeholder="e.g. user@example.com or user@wii.gov.in"
                    />
                  </div>
                </div>

                {/* PASSWORD */}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Password / Passcode *
                  </label>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full text-xs pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowLoginPassword((previous) => !previous)
                      }
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
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

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Security Verification (Captcha Code) *
                  </label>

                  <CaptchaCanvas
                    code={captchaCode}
                    onRefresh={refreshCaptcha}
                  />

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
                    placeholder="Enter 6-character Captcha Code"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-bold text-slate-900"
                  />
                </div>

                {/* LOGIN BUTTON */}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Authenticate & Sign In
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* =================================================
                 REGISTRATION FORM
              ================================================= */

              <form
                onSubmit={handleRegisterSubmit}
                className="space-y-4 max-w-2xl mx-auto"
              >
                {/* NAME */}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Full Name *
                  </label>

                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(event) => setRegName(event.target.value)}
                      autoComplete="name"
                      placeholder="e.g. Full Name"
                      className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Personal Email *
                  </label>

                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(event) => setRegEmail(event.target.value)}
                      autoComplete="email"
                      placeholder="user@example.com"
                      className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* PHONE */}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Phone Number (Mobile) *
                    </label>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {regPhone.length}
                      /10 digits
                    </span>
                  </div>

                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

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
                      placeholder="e.g. 9876512345"
                      className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter valid 10-digit Indian mobile number
                  </p>
                </div>

                {/* PASSWORD */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Password *
                    </label>

                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        minLength={6}
                        maxLength={128}
                        value={regPassword}
                        onChange={(event) =>
                          setRegPassword(event.target.value.slice(0, 128))
                        }
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        className="w-full text-xs pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowRegPassword((previous) => !previous)
                        }
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label={
                          showRegPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Confirm Password *
                    </label>

                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        value={regConfirmPassword}
                        onChange={(event) =>
                          setRegConfirmPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* CAPTCHA */}

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Security Verification (Captcha Code) *
                  </label>

                  <CaptchaCanvas
                    code={captchaCode}
                    onRefresh={refreshCaptcha}
                  />

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
                    placeholder="Enter the 6-character Captcha Code above"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-bold text-slate-900"
                  />
                </div>

                {/* REGISTER BUTTON */}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer text-sm"
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
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
