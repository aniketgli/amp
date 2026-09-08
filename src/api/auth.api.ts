import { apiRequest } from "./apiClient";

export interface LoginInput {
  email: string;
  password: string;
  requestedRole?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  currentRole: {
    id: number;
    code: string;
    name: string;
  };
  user: {
    id: number;
    employeeId?: string | null;
    fullName: string;
    email: string;
    phone: string;
    intercomExtension?: string | null;
    status: string;
    isActivated: boolean;
    roles: Array<{
      id: number;
      code: string;
      name: string;
    }>;
  };
}

export async function loginUser(
  input: LoginInput,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(
    "/api/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function registerUser(
  input: Record<string, unknown>,
) {
  return apiRequest<{
    success: boolean;
    message: string;
    [key: string]: unknown;
  }>("/api/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function saveLoginSession(
  response: LoginResponse,
): void {
  localStorage.setItem(
    "wii_auth_token",
    response.token,
  );

  localStorage.setItem(
    "wii_user",
    JSON.stringify(response.user),
  );

  localStorage.setItem(
    "wii_current_role",
    JSON.stringify(response.currentRole),
  );
}
