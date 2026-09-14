import { apiRequest } from "./apiClient";
import type { AccessFormConfig } from "./serviceFormConfig.types";

export interface FacilityApiRecord {
  id: string;
  name: string;
  department?: string;
  nodal?: string;
  assocNodal?: string;
  supervisor?: string;
  description?: string;
  status?: string;
  formConfig?: AccessFormConfig | null;
}

export interface FacilitiesResponse {
  success: boolean;
  count?: number;
  facilities: FacilityApiRecord[];
}

export async function getFacilities(): Promise<FacilitiesResponse> {
  return apiRequest<FacilitiesResponse>("/api/facilities");
}
