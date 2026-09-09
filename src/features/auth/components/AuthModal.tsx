import React, { useState, useEffect } from 'react';
import { UserRole, ApplicantProfile } from '../../../types/requisition';
import { OFFICIAL_ROLES } from '../../../data/initialData';
import {
  User,
  Lock,
  Mail,
  Phone,
  Shield,
  UserPlus,
  LogIn,
  X,
  CheckCircle2,
  Building2,
  KeyRound,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onLoginSuccess: (userRole: UserRole, userProfile?: Partial<ApplicantProfile>) => void;
}

// Generate random 6-character Captcha code
const generateCaptchaCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedLoginRole, setSelectedLoginRole] = useState<UserRole>(currentRole);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [captchaCode, setCaptchaCode] = useState(generateCaptchaCode());
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'register') {
      setCaptchaCode(generateCaptchaCode());
      setUserCaptchaInput('');
      setCaptchaError(null);
    }
  }, [mode]);

  if (!isOpen) return null;

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setUserCaptchaInput('');
    setCaptchaError(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess(selectedLoginRole);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCaptchaError(null);

    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setCaptchaError('Please fill in all required fields.');
      return;
    }

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setCaptchaError('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Verify Captcha Code
    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaError('Invalid captcha code. Please try again.');
      return;
    }

    const newProfile: Partial<ApplicantProfile> = {
      salutation: 'Dr.',
      applicantName: regName,
      personalEmail: regEmail,
      mobileNo: cleanPhone,
      panNo: 'ASHPR1928K',
      designation: 'Applicant / Research Fellow',
      departmentCellProject: 'Dept. of Landscape Level Planning & GIS',
      supervisingOfficerName: 'Dr. R. K. Singh (Scientist - F / PI)',
    };

    setRegSuccessMessage(`Registration successful! Account created for ${regName}.`);
    setTimeout(() => {
      onLoginSuccess('applicant', newProfile);
      setRegSuccessMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2.5 sm:p-4 overflow-hidden">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 min-w-0">
        
        {/* Header Banner */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 relative shrink-0 min-w-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pr-8 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg sm:text-xl shadow-md border border-emerald-400 shrink-0">
              WII
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1 truncate">
                <Building2 className="w-3 h-3 shrink-0" /> Wildlife Institute of India Portal
              </div>
              <h2 className="text-base sm:text-xl font-extrabold text-white leading-tight truncate">
                {mode === 'login' ? 'User Authentication & Login' : 'New User Registration'}
              </h2>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mt-4 sm:mt-5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              Portal Login
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              Register Account
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 min-w-0">
          {regSuccessMessage && (
            <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{regSuccessMessage}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Email ID / WII Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                    placeholder="user@wii.gov.in"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password / Passcode
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Select Active Login Role / Persona */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Select Role / Account Access Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {OFFICIAL_ROLES.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedLoginRole(role.id)}
                      className={`text-left p-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                        selectedLoginRole === role.id
                          ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 font-bold'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-slate-900 font-bold flex items-center justify-between">
                        <span>{role.title}</span>
                        {selectedLoginRole === role.id && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium line-clamp-1">{role.department}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                Authenticate & Access Dashboard
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {captchaError && (
                <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{captchaError}</span>
                </div>
              )}

              {/* 1. Full Name */}
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
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Full Name"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* 2. Personal Email */}
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
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* 3. Phone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Phone Number (Mobile) *
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {regPhone.length}/10
                  </span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    pattern="[0-9]{10}"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876512345"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* 4. Captcha Code Verification */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Security Verification (Captcha Code) *
                </label>

                <div className="flex items-center gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-300">
                  {/* Styled Visual Captcha Canvas */}
                  <div className="bg-slate-900 text-emerald-400 px-4 py-2 rounded-lg font-mono font-black text-lg tracking-widest select-none shadow-inner border border-emerald-500/30 italic">
                    <span className="line-through decoration-emerald-500/50">{captchaCode}</span>
                  </div>

                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                    title="Generate New Captcha Code"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={userCaptchaInput}
                    onChange={(e) => setUserCaptchaInput(e.target.value)}
                    placeholder="Enter the 6-character Captcha Code above"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono uppercase font-bold text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Submit Registration
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
