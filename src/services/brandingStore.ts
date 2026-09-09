// ============================================================
// WII ACCESS MANAGEMENT PORTAL - ORGANIZATION BRANDING STORE
// ============================================================
// MySQL is the source of truth. localStorage is cache only.
// ============================================================

import { useEffect, useState } from "react";

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
const AUTH_TOKEN_KEY = "wii_auth_token";
const BRANDING_API = "/api/branding";

const readLocalBranding = (): BrandingConfig => {
  try {
    const saved = localStorage.getItem(BRANDING_KEY);
    if (!saved) return DEFAULT_BRANDING;

    const parsed = JSON.parse(saved);

    return {
      ...DEFAULT_BRANDING,
      ...parsed,
      logoUrl:
        typeof parsed.logoUrl === "string" && parsed.logoUrl.trim()
          ? parsed.logoUrl
          : null,
      hindiName:
        typeof parsed.hindiName === "string"
          ? parsed.hindiName
          : DEFAULT_BRANDING.hindiName,
      englishName:
        typeof parsed.englishName === "string"
          ? parsed.englishName
          : DEFAULT_BRANDING.englishName,
      subtitle:
        typeof parsed.subtitle === "string"
          ? parsed.subtitle
          : DEFAULT_BRANDING.subtitle,
      primaryColor:
        typeof parsed.primaryColor === "string"
          ? parsed.primaryColor
          : DEFAULT_BRANDING.primaryColor,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : DEFAULT_BRANDING.updatedAt,
    };
  } catch (error) {
    console.error("Error reading branding cache:", error);
    return DEFAULT_BRANDING;
  }
};

const saveLocalBranding = (branding: BrandingConfig): void => {
  try {
    localStorage.setItem(BRANDING_KEY, JSON.stringify(branding));
    window.dispatchEvent(new CustomEvent(BRANDING_EVENT, { detail: branding }));
  } catch (error) {
    console.error("Error saving branding cache:", error);
  }
};

export const getBrandingConfig = (): BrandingConfig => readLocalBranding();

export const fetchBrandingFromServer =
  async (): Promise<BrandingConfig | null> => {
    try {
      const response = await fetch(BRANDING_API, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (!data?.success || !data?.branding) return null;

      const branding: BrandingConfig = {
        ...DEFAULT_BRANDING,
        logoUrl:
          typeof data.branding.logoUrl === "string" &&
          data.branding.logoUrl.trim()
            ? data.branding.logoUrl
            : null,
        hindiName:
          typeof data.branding.hindiName === "string"
            ? data.branding.hindiName
            : DEFAULT_BRANDING.hindiName,
        englishName:
          typeof data.branding.englishName === "string"
            ? data.branding.englishName
            : DEFAULT_BRANDING.englishName,
        subtitle:
          typeof data.branding.subtitle === "string"
            ? data.branding.subtitle
            : "",
        primaryColor:
          typeof data.branding.primaryColor === "string"
            ? data.branding.primaryColor
            : DEFAULT_BRANDING.primaryColor,
        updatedAt:
          typeof data.branding.updatedAt === "string"
            ? data.branding.updatedAt
            : new Date().toISOString(),
      };

      // Server wins over the local browser cache.
      saveLocalBranding(branding);
      return branding;
    } catch (error) {
      console.warn("Branding server synchronization failed:", error);
      return null;
    }
  };

export const saveBrandingConfig = async (
  config: Partial<BrandingConfig>,
): Promise<BrandingConfig> => {
  const current = getBrandingConfig();
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    throw new Error("Authentication token is missing. Please login again.");
  }

  const payload = {
    logoUrl: config.logoUrl !== undefined ? config.logoUrl : current.logoUrl,
    hindiName: config.hindiName ?? current.hindiName,
    englishName: config.englishName ?? current.englishName,
    subtitle: config.subtitle ?? current.subtitle,
    primaryColor: config.primaryColor ?? current.primaryColor,
  };

  const response = await fetch(BRANDING_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401) {
    throw new Error("Your login session has expired. Please login again.");
  }

  if (response.status === 403) {
    throw new Error(
      "You do not have permission to change organization branding.",
    );
  }

  if (!response.ok || !data?.success || !data?.branding) {
    throw new Error(
      data?.message || "Unable to save organization branding on the server.",
    );
  }

  const saved: BrandingConfig = {
    ...DEFAULT_BRANDING,
    ...data.branding,
    logoUrl:
      typeof data.branding.logoUrl === "string" && data.branding.logoUrl.trim()
        ? data.branding.logoUrl
        : null,
  };

  // Only cache after the DB write succeeds.
  saveLocalBranding(saved);
  return saved;
};

export const resetBrandingConfig = async (): Promise<BrandingConfig> => {
  return saveBrandingConfig({
    logoUrl: null,
    hindiName: DEFAULT_BRANDING.hindiName,
    englishName: DEFAULT_BRANDING.englishName,
    subtitle: DEFAULT_BRANDING.subtitle,
    primaryColor: DEFAULT_BRANDING.primaryColor,
  });
};

export const refreshBranding = async (): Promise<BrandingConfig | null> => {
  return fetchBrandingFromServer();
};

export const useBranding = (): BrandingConfig => {
  const [branding, setBranding] = useState<BrandingConfig>(() =>
    getBrandingConfig(),
  );

  useEffect(() => {
    let mounted = true;

    // Always ask the server for the latest central configuration.
    fetchBrandingFromServer().then((serverBranding) => {
      if (mounted && serverBranding) setBranding(serverBranding);
    });

    const handleUpdate = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        setBranding({ ...DEFAULT_BRANDING, ...event.detail });
      } else {
        setBranding(getBrandingConfig());
      }
    };

    window.addEventListener(BRANDING_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener(BRANDING_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return branding;
};
