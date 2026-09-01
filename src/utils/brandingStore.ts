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

export const fetchServerBranding = async (): Promise<BrandingConfig> => {
  try {
    const res = await fetch("/api/branding");
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.branding) {
        const merged: BrandingConfig = {
          ...DEFAULT_BRANDING,
          ...data.branding,
          subtitle: "",
        };
        try {
          localStorage.setItem(BRANDING_KEY, JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent(BRANDING_EVENT, { detail: merged }));
        } catch (_) {}
        return merged;
      }
    }
  } catch (err) {
    console.warn("Could not sync branding from server:", err);
  }
  return getBrandingConfig();
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

  // Persist to backend server so logo is accessible on all devices
  fetch("/api/branding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated),
  }).catch((err) => {
    console.warn("Server branding save error:", err);
  });

  return updated;
};

export const resetBrandingConfig = (): BrandingConfig => {
  try {
    localStorage.removeItem(BRANDING_KEY);
    window.dispatchEvent(new CustomEvent(BRANDING_EVENT, { detail: DEFAULT_BRANDING }));
  } catch (err) {
    console.error("Error resetting branding config:", err);
  }

  fetch("/api/branding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(DEFAULT_BRANDING),
  }).catch((err) => {
    console.warn("Server branding reset error:", err);
  });

  return DEFAULT_BRANDING;
};

export const useBranding = (): BrandingConfig => {
  const [branding, setBranding] = useState<BrandingConfig>(getBrandingConfig);

  useEffect(() => {
    // Sync with server on initial mount so all devices load the saved logo
    fetchServerBranding().then((serverData) => {
      setBranding(serverData);
    });

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
