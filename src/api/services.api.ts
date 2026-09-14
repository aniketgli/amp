import { apiRequest } from "./apiClient";
import type { AccessFormConfig } from "./serviceFormConfig.types";

export interface ServiceApiRecord {
  id: string;
  name: string;
  manager?: string;
  quota?: string;
  status?: string;
  workflowStages?: unknown[] | null;
  formConfig?: AccessFormConfig | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicesResponse {
  success: boolean;
  count?: number;
  services: ServiceApiRecord[];
}

export async function getServices(): Promise<ServicesResponse> {
  return apiRequest<ServicesResponse>("/api/services");
}
