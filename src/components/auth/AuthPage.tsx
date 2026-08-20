import React, { useState, useEffect } from "react";
import { UserRole, ApplicantProfile } from "../../types/requisition";
import { OFFICIAL_ROLES } from "../../data/initialData";
import { WiiLogo } from "../common/WiiLogo";

import { EmailInboxModal } from "../common/EmailInboxModal";
import {
  User,
  Lock,
  Mail,
  Phone,
  Shield,
  UserPlus,
  LogIn,
  CheckCircle2,
  Building2,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";

interface AuthPageProps {
  currentRole: UserRole;
  initialMode?: "login" | "register";
  isAuthenticated?: boolean;
  onLoginSuccess: (
    initialRole: UserRole,
    assignedRoles: UserRole[],
    userProfile?: Partial<ApplicantProfile>,
  ) => void;
  onNavigateHome?: () => void;
}

// Generate random 6-character Captcha code
const generateCaptchaCode = () => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Canvas-rendered Canvas Captcha Box with noise lines & distortion
const CaptchaCanvas: React.FC<{ code: string; onRefresh: () => void }> = ({
  code,
  onRefresh,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dark canvas background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Random background grid/noise lines
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(16, 185, 129, ${0.2 + Math.random() * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Random noise dots
    for (let i = 0; i < 45; i++) {
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

    // Render rotated Captcha characters
    ctx.font = "bold 22px monospace";
    ctx.textBaseline = "middle";

    const charWidth = (canvas.width - 24) / code.length;
    for (let i = 0; i < code.length; i++) {
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

// Demo accounts array for quick login testing
const DEMO_ACCOUNTS: {
  roleId: UserRole;
  assignedRoles: UserRole[];
  name: string;
  title: string;
  email: string;
  badge: string;
  badgeColor: string;
}[] = [
  {
    roleId: "applicant",
    assignedRoles: ["applicant"],
    name: "Dr. Ananya Sharma",
    title: "User",
    email: "ananya.sharma@gmail.com",
    badge: "User",
    badgeColor:
      "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200",
  },
  {
    roleId: "supervisor",
    assignedRoles: ["applicant", "supervisor"],
    name: "Dr. R. K. Singh",
    title: "PI",
    email: "rk.singh@wii.gov.in",
    badge: "PI",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
  },
  {
    roleId: "lab_nodal",
    assignedRoles: ["applicant", "lab_nodal"],
    name: "Dr. S. K. Gupta",
    title: "Nodal Officer (Lab Name)",
    email: "genetics.lab@wii.gov.in",
    badge: "Nodal Officer",
    badgeColor:
      "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200",
  },
  {
    roleId: "assoc_lab_nodal",
    assignedRoles: ["applicant", "assoc_lab_nodal"],
    name: "Dr. Neha Verma",
    title: "Associate Nodal Officer (Lab Name)",
    email: "assoc.genetics@wii.gov.in",
    badge: "Assoc Nodal",
    badgeColor:
      "bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200",
  },
  {
    roleId: "section_head",
    assignedRoles: ["applicant", "section_head"],
    name: "Dr. Panna Lal",
    title: "Manager (Facility Name)",
    email: "facility.manager@wii.gov.in",
    badge: "Facility Manager",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200",
  },
  {
    roleId: "it_officer",
    assignedRoles: ["applicant", "it_officer"],
    name: "Er. Vikas Mehta",
    title: "IT Head",
    email: "it.admin@wii.gov.in",
    badge: "IT Head",
    badgeColor:
      "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200",
  },
  {
    roleId: "admin",
    assignedRoles: ["applicant", "admin"],
    name: "Director General / Admin",
    title: "Admin",
    email: "director.general@wii.gov.in",
    badge: "Admin",
    badgeColor:
      "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200",
  },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  currentRole,
  initialMode = "login",
  isAuthenticated = false,
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("ananya.sharma@gmail.com");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [selectedLoginRole, setSelectedLoginRole] =
    useState<UserRole>(currentRole);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Captcha state
  const [captchaCode, setCaptchaCode] = useState(generateCaptchaCode());
  const [userCaptchaInput, setUserCaptchaInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(
    null,
  );
  const [isInactiveUserError, setIsInactiveUserError] = useState(false);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);

  useEffect(() => {
    refreshCaptcha();
  }, [mode]);

  const refreshCaptcha = () => {
    const newCode = generateCaptchaCode();
    setCaptchaCode(newCode);
    setUserCaptchaInput("");
    setFormError(null);
    setIsInactiveUserError(false);
  };

  const handleSelectDemoAccount = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setLoginEmail(acc.email);
    setLoginPassword("password123");
    setSelectedLoginRole(acc.roleId);
    const newCode = generateCaptchaCode();
    setCaptchaCode(newCode);
    setUserCaptchaInput(newCode); // Auto-fill verified captcha for smooth demo testing
    setFormError(null);
    setIsInactiveUserError(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);
    setIsInactiveUserError(false);

    // -----------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setFormError("Please enter both your Email ID and Password.");
      return;
    }

    // -----------------------------------------
    // CAPTCHA VALIDATION
    // -----------------------------------------

    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setFormError(
        "Invalid Security Verification (Captcha) Code. Please enter the correct code.",
      );

      refreshCaptcha();
      return;
    }

    try {
      // -----------------------------------------
      // CALL BACKEND LOGIN API
      // -----------------------------------------

      const response = await fetch("/api/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await response.json();

      console.log("LOGIN API STATUS:", response.status);
      console.log("LOGIN API RESPONSE:", data);

      // -----------------------------------------
      // LOGIN FAILED
      // -----------------------------------------

      if (!response.ok || !data.success) {
        if (response.status === 403) {
          setIsInactiveUserError(true);
        }

        setFormError(data.message || "Invalid email or password.");

        return;
      }

      // -----------------------------------------
      // SAVE JWT TOKEN
      // -----------------------------------------

      localStorage.setItem("wii_auth_token", data.token);

      // -----------------------------------------
      // SAVE USER DATA
      // -----------------------------------------

      localStorage.setItem("wii_user", JSON.stringify(data.user));

      // -----------------------------------------
      // CREATE PROFILE DATA
      // -----------------------------------------

      const updatedProfile: Partial<ApplicantProfile> = {
        applicantName: data.user.fullName,
        personalEmail: data.user.email,
        mobileNo: data.user.phone,
      };

      // -----------------------------------------
      // LOGIN SUCCESS
      // -----------------------------------------

      onLoginSuccess("applicant", ["applicant"], updatedProfile);
    } catch (error) {
      console.error("LOGIN FRONTEND ERROR:", error);

      setFormError(
        "Unable to connect to the server. Please make sure the WII Access Management Server is running.",
      );
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);
    setRegSuccessMessage(null);
    setIsInactiveUserError(false);

    // -----------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------

    if (
      !regName.trim() ||
      !regEmail.trim() ||
      !regPhone.trim() ||
      !regPassword.trim()
    ) {
      setFormError("Please fill in all required fields.");
      return;
    }

    // -----------------------------------------
    // PHONE VALIDATION
    // -----------------------------------------

    const cleanPhone = regPhone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError(
        "Mobile number must be 10 digits starting with 6, 7, 8, or 9.",
      );
      return;
    }

    // -----------------------------------------
    // PASSWORD VALIDATION
    // -----------------------------------------

    if (regPassword.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    // -----------------------------------------
    // CAPTCHA
    // -----------------------------------------

    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setFormError("Invalid captcha code. Please try again.");

      refreshCaptcha();
      return;
    }

    try {
      // -----------------------------------------
      // CALL BACKEND REGISTRATION API
      // -----------------------------------------

      const response = await fetch("/api/register", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          fullName: regName.trim(),
          email: regEmail.trim(),
          phone: cleanPhone,
          password: regPassword,
        }),
      });

      const data = await response.json();

      console.log("REGISTRATION API STATUS:", response.status);

      console.log("REGISTRATION API RESPONSE:", data);

      // -----------------------------------------
      // REGISTRATION FAILED
      // -----------------------------------------

      if (!response.ok || !data.success) {
        setFormError(data.message || "Unable to complete registration.");

        return;
      }

      // -----------------------------------------
      // REGISTRATION SUCCESS
      // -----------------------------------------

      setRegSuccessMessage(
        `Registration successful. Activation link has been sent to ${regEmail.trim()}. Please check your email inbox.`,
      );

      // Clear form

      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setRegConfirmPassword("");

      // Refresh captcha

      refreshCaptcha();
    } catch (error) {
      console.error("REGISTRATION FRONTEND ERROR:", error);

      setFormError(
        "Unable to connect to the server. Please make sure the WII Access Management Server is running.",
      );
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Breadcrumb & Home Return Bar */}
        {isAuthenticated && onNavigateHome && (
          <div className="flex items-center justify-between">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600" />
              Back to Portal Dashboard
            </button>
          </div>
        )}

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner featuring Official WII Logo */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-8 relative border-b border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
              {/* Official WII Logo & Title */}
              <div className="bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-lg border border-slate-200 self-center sm:self-auto inline-block">
                <WiiLogo size="md" />
              </div>

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

            {/* Mode Selector Tabs */}
            <div className="flex gap-3 mt-6 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700 max-w-md">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setFormError(null);
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

          {/* Form Body Container */}
          <div className="p-6 sm:p-8">
            {/* Feedback Notifications */}
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

            {/* LOGIN FORM */}
            {mode === "login" ? (
              <form
                onSubmit={handleLoginSubmit}
                className="space-y-5 max-w-2xl mx-auto"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Personal Email / WII Email ID *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                      placeholder="e.g. ananya.sharma@gmail.com or user@wii.gov.in"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Password / Passcode *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full text-xs pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Security Captcha Box for Login */}
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
                    value={userCaptchaInput}
                    onChange={(e) => setUserCaptchaInput(e.target.value)}
                    placeholder="Enter 6-character Captcha Code"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-bold text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <KeyRound className="w-4 h-4" />
                  Authenticate & Sign In
                </button>
              </form>
            ) : (
              /* REGISTRATION FORM */
              <form
                onSubmit={handleRegisterSubmit}
                className="space-y-4 max-w-2xl mx-auto"
              >
                {/* 1. Name */}
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
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Dr. Ananya Sharma"
                      className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* 2. Personal Email */}
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
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="ananya.sharma@gmail.com"
                      className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* 3. Phone */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      Phone Number (Mobile) *
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {regPhone.length}/10 digits
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={regPhone}
                      onChange={(e) =>
                        setRegPhone(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="e.g. 9876512345"
                      className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter valid 10-digit Indian mobile number (digits only)
                  </p>
                </div>

                {/* 4. Password & Confirm Password */}
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
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full text-xs pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

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
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full text-xs pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Security Verification Captcha Code */}
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
                    value={userCaptchaInput}
                    onChange={(e) => setUserCaptchaInput(e.target.value)}
                    placeholder="Enter the 6-character Captcha Code above"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-bold text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Submit Registration
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Email Outbox & Activation Link Viewer */}
      <EmailInboxModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        onAccountActivated={(activatedEmail) => {
          setFormError(null);
          setIsInactiveUserError(false);
          setRegSuccessMessage(
            `Account (${activatedEmail}) activated successfully! You can now log in.`,
          );
        }}
      />
    </div>
  );
};
