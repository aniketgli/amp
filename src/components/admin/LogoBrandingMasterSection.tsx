import React, { useState, useRef, useEffect } from "react";
import {
  useBranding,
  saveBrandingConfig,
  resetBrandingConfig,
  BrandingConfig,
} from "../../utils/brandingStore";
import { WiiLogo } from "../common/WiiLogo";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  RotateCcw,
  Shield,
  Lock,
  Sparkles,
  Building2,
  Eye,
  FileText,
  Palette,
  AlertCircle,
  X,
} from "lucide-react";

export const LogoBrandingMasterSection: React.FC = () => {
  const currentBranding = useBranding();

  const [hindiName, setHindiName] = useState(currentBranding.hindiName);
  const [englishName, setEnglishName] = useState(currentBranding.englishName);
  const [subtitle, setSubtitle] = useState(currentBranding.subtitle);
  const [primaryColor, setPrimaryColor] = useState(
    currentBranding.primaryColor,
  );
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    currentBranding.logoUrl,
  );

  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---------------------------------------------------------
  // SERVER SYNC
  // ---------------------------------------------------------
  // useBranding() first returns the local cache and then fetches
  // the latest branding from MySQL. This effect updates the form
  // when that server value arrives.
  // ---------------------------------------------------------
  useEffect(() => {
    setHindiName(currentBranding.hindiName);
    setEnglishName(currentBranding.englishName);
    setSubtitle(currentBranding.subtitle);
    setPrimaryColor(currentBranding.primaryColor);
    setLogoPreviewUrl(currentBranding.logoUrl);
  }, [
    currentBranding.updatedAt,
    currentBranding.logoUrl,
    currentBranding.hindiName,
    currentBranding.englishName,
    currentBranding.subtitle,
    currentBranding.primaryColor,
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    setUploadError(null);
    setUploadSuccessMsg(null);

    // Validate type
    if (!file.type.startsWith("image/")) {
      setUploadError(
        "Invalid file type. Please upload a PNG, JPG, WEBP, or SVG image file.",
      );
      return;
    }

    // Validate size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setUploadError(
        "Image size exceeds 4MB. Please upload a smaller image file.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setLogoPreviewUrl(result);
      setUploadSuccessMsg(
        `Logo image "${file.name}" loaded for preview. Click "Save Logo & Branding Master" to apply.`,
      );
    };
    reader.onerror = () => {
      setUploadError("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) return;

    setUploadError(null);
    setUploadSuccessMsg(null);
    setIsSaving(true);

    try {
      // IMPORTANT: saveBrandingConfig now writes to MySQL first.
      // Local cache is updated only after the server confirms success.
      const saved = await saveBrandingConfig({
        logoUrl: logoPreviewUrl,
        hindiName: hindiName.trim(),
        englishName: englishName.trim(),
        subtitle: subtitle.trim(),
        primaryColor,
      });

      // Reflect the exact server response in the form.
      setHindiName(saved.hindiName);
      setEnglishName(saved.englishName);
      setSubtitle(saved.subtitle);
      setPrimaryColor(saved.primaryColor);
      setLogoPreviewUrl(saved.logoUrl);

      setUploadSuccessMsg(
        "Organization Logo & Branding Master saved successfully. Changes are now stored centrally and will be available on all devices.",
      );

      setTimeout(() => setUploadSuccessMsg(null), 5000);
    } catch (error: any) {
      console.error("BRANDING SAVE ERROR:", error);

      setUploadError(
        error?.message ||
          "Unable to save organization branding. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset to the default official WII logo and titles?",
      )
    ) {
      return;
    }

    if (isResetting) return;

    setUploadError(null);
    setUploadSuccessMsg(null);
    setIsResetting(true);

    try {
      const resetConfig = await resetBrandingConfig();

      setHindiName(resetConfig.hindiName);
      setEnglishName(resetConfig.englishName);
      setSubtitle(resetConfig.subtitle);
      setPrimaryColor(resetConfig.primaryColor);
      setLogoPreviewUrl(resetConfig.logoUrl);

      setUploadSuccessMsg(
        "Branding has been reset centrally. All devices will receive the default WII branding.",
      );

      setTimeout(() => setUploadSuccessMsg(null), 4000);
    } catch (error: any) {
      console.error("BRANDING RESET ERROR:", error);

      setUploadError(
        error?.message ||
          "Unable to reset organization branding. Please try again.",
      );
    } finally {
      setIsResetting(false);
    }
  };

  const handleRemoveCustomLogo = () => {
    setLogoPreviewUrl(null);
    setUploadSuccessMsg(
      "Custom logo image removed. Vector emblem will be used.",
    );
  };

  const colorPresets = [
    { name: "WII Deep Red", hex: "#7A1C1C" },
    { name: "Forest Green", hex: "#065F46" },
    { name: "Navy Blue", hex: "#1E3A8A" },
    { name: "Charcoal Dark", hex: "#1E293B" },
    { name: "Teal Emerald", hex: "#0F766E" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-8 shadow-xs">
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                Company & Organization Logo Master
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Master Restricted
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload company logo, configure institution title and branding
                colors. Editable strictly by System Administrator.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
          <Shield className="w-4 h-4 text-purple-600" />
          <span>Super Admin Authority Required</span>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {uploadSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {uploadSuccessMsg}
          </span>
          <button
            onClick={() => setUploadSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            {uploadError}
          </span>
          <button
            onClick={() => setUploadError(null)}
            className="text-red-700 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: FORM CONTROLS (7 COLS) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          {/* UPLOAD SECTION */}
          <div className="space-y-3">
            <label className="block text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-purple-600" />
              Upload Company / Institution Logo Image
            </label>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? "border-purple-600 bg-purple-50/80"
                  : "border-slate-300 hover:border-purple-400 bg-slate-50/60 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>

              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag & drop logo image file
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports PNG, JPG, JPEG, WEBP, or SVG (Transparent PNG
                recommended, Max 4MB)
              </p>

              {logoPreviewUrl && (
                <div className="mt-4 p-2 bg-white rounded-xl border border-slate-200 inline-flex items-center gap-3">
                  <img
                    src={logoPreviewUrl}
                    alt="Uploaded Logo"
                    className="h-10 w-auto object-contain"
                  />
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Logo Loaded
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustomLogo();
                    }}
                    className="text-[10px] text-red-600 font-bold hover:underline bg-red-50 px-2 py-1 rounded border border-red-200 ml-2"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* INSTITUTION TITLES */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/80 space-y-4">
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Organization Header Titles & Taglines
            </h3>

            {/* Hindi Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Organization Name in Hindi (हिन्दी नाम)
              </label>
              <input
                type="text"
                value={hindiName}
                onChange={(e) => setHindiName(e.target.value)}
                placeholder="e.g. भारतीय वन्यजीव संस्थान"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            {/* English Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Organization Name in English
              </label>
              <input
                type="text"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                placeholder="e.g. Wildlife Institute of India"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-semibold"
              />
            </div>

            {/* Subtitle / Ministry Tagline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ministry / Department Subtitle Tagline
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. An Autonomous Institution of Ministry of Environment..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            {/* Primary Color Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-600" />
                  Logo & Typography Primary Color
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-600">
                  {primaryColor}
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setPrimaryColor(preset.hex)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      primaryColor === preset.hex
                        ? "border-purple-600 ring-2 ring-purple-300 bg-white"
                        : "border-slate-200 bg-slate-100 hover:bg-white"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {preset.name}
                  </button>
                ))}

                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white"
                  title="Choose custom color"
                />
              </div>
            </div>
          </div>

          {/* FORM ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting || isSaving}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-300 transition-all cursor-pointer"
            >
              <RotateCcw
                className={`w-4 h-4 text-slate-600 ${isResetting ? "animate-spin" : ""}`}
              />
              {isResetting ? "Resetting..." : "Reset Default WII Logo"}
            </button>

            <button
              type="submit"
              disabled={isSaving || isResetting}
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Sparkles
                className={`w-4 h-4 text-amber-300 fill-amber-300 ${isSaving ? "animate-pulse" : ""}`}
              />
              {isSaving ? "Saving..." : "Save Logo & Branding Master"}
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: LIVE PREVIEW PANELS (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                Live System Branding Preview
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Active System View
              </span>
            </div>

            {/* PREVIEW 1: NAVBAR HEADER VIEW */}
            <div className="p-3 bg-white text-slate-900 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                1. Portal Navigation Header
              </span>
              <div className="p-2 border border-slate-200 rounded-lg bg-white flex items-center justify-between">
                {/* Simulated Logo Component */}
                <div className="flex items-center gap-2">
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt="Logo Preview"
                      className="h-10 w-auto object-contain"
                    />
                  ) : (
                    <WiiLogo size="sm" />
                  )}
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-[10px] font-bold text-slate-500">
                    System Admin Portal
                  </span>
                </div>
              </div>
            </div>

            {/* PREVIEW 2: LOGIN PAGE CARD HEADER */}
            <div className="p-3 bg-slate-800 text-slate-100 rounded-xl space-y-1 border border-slate-700">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                2. Account Login Page Header
              </span>
              <div className="p-3 bg-white text-slate-900 rounded-xl border border-slate-200 flex items-center justify-between">
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl}
                    alt="Login Logo Preview"
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <WiiLogo size="sm" />
                )}
                <div className="text-right">
                  <div className="text-xs font-black text-slate-900">
                    Account Login
                  </div>
                  <div className="text-[9px] text-slate-500">
                    Access Management
                  </div>
                </div>
              </div>
            </div>

            {/* PREVIEW 3: REQUISITION LETTERHEAD PRINTABLE VIEW */}
            <div className="p-3 bg-white text-slate-900 rounded-xl space-y-1 shadow-xs border border-slate-200">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3 text-purple-600" />
                3. Printable Requisition Slip Letterhead
              </span>
              <div className="p-3 border border-slate-300 rounded-lg bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between border-b border-slate-300 pb-2">
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt="Letterhead Logo"
                      className="h-10 w-auto object-contain"
                    />
                  ) : (
                    <WiiLogo size="sm" />
                  )}
                  <div className="text-right text-[9px] text-slate-600">
                    <div className="font-bold">Form No: WII/REQ/2026/089</div>
                    <div>Date: 31-Aug-2026</div>
                  </div>
                </div>

                <div className="text-[10px] space-y-1">
                  <div className="font-bold text-slate-800">
                    Subject: Equipment Access Requisition Approval Form
                  </div>
                  {subtitle && (
                    <div className="text-[9px] text-slate-500">{subtitle}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ADMIN RULE BANNER */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-purple-900 text-xs space-y-1.5">
            <div className="font-extrabold flex items-center gap-1.5 text-purple-950">
              <Shield className="w-4 h-4 text-purple-700" />
              Editable strictly from Master Admin
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Once saved in this Master section, the uploaded company logo is
              enforced across all user roles, login cards, navigation headers,
              email notifications, and printable requisition forms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
