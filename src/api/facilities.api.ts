import { apiRequest } from "./apiClient";

export interface FacilityApiRecord {
  id: string;
  name: string;
  department?: string;
  nodal?: string;
  assocNodal?: string;
  supervisor?: string;
  description?: string;
  status?: string;
}

export interface FacilitiesResponse {
  success: boolean;
  count?: number;
  facilities: FacilityApiRecord[];
}

export async function getFacilities(): Promise<FacilitiesResponse> {
  return apiRequest<FacilitiesResponse>("/api/facilities");
}
