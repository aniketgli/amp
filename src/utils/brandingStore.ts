import { useState, useEffect } from "react";

export interface BrandingConfig {
  logoUrl: string | null;
  hindiName: string;
  englishName: string;
  subtitle: string;
  primaryColor: string;
  updatedAt: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  logoUrl: null,
  hindiName: "भारतीय वन्यजीव संस्थान",
  englishName: "Wildlife Institute of India",
  subtitle: "",
  primaryColor: "#7A1C1C",
  updatedAt: new Date().toISOString(),
};

const BRANDING_KEY = "wii_organization_branding_config_v1";
const BRANDING_EVENT = "wii_branding_updated_event";

export const getBrandingConfig = (): BrandingConfig => {
  try {
    const saved = localStorage.getItem(BRANDING_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_BRANDING,
        ...parsed,
        subtitle: "",
      };
    }
  } catch (err) {
    console.error("Error reading branding config from localStorage:", err);
  }
  return DEFAULT_BRANDING;
};

export const saveBrandingConfig = (config: Partial<BrandingConfig>): BrandingConfig => {
  const current = getBrandingConfig();
  const updated: BrandingConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(BRANDING_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(BRANDING_EVENT, { detail: updated }));
  } catch (err) {
    console.error("Error saving branding config to localStorage:", err);
  }

  return updated;
};

export const resetBrandingConfig = (): BrandingConfig => {
  try {
    localStorage.removeItem(BRANDING_KEY);
    window.dispatchEvent(new CustomEvent(BRANDING_EVENT, { detail: DEFAULT_BRANDING }));
  } catch (err) {
    console.error("Error resetting branding config:", err);
  }
  return DEFAULT_BRANDING;
};

export const useBranding = (): BrandingConfig => {
  const [branding, setBranding] = useState<BrandingConfig>(getBrandingConfig);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      if (e instanceof CustomEvent && e.detail) {
        setBranding(e.detail);
      } else {
        setBranding(getBrandingConfig());
      }
    };

    window.addEventListener(BRANDING_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(BRANDING_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return branding;
};
