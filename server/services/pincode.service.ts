export interface PincodeDetails {
  pincode: string;
  district: string;
  state: string;
}

interface IndiaPostOfficeRecord {
  District?: unknown;
  State?: unknown;
}

interface IndiaPostResponse {
  Status?: unknown;
  Message?: unknown;
  PostOffice?: IndiaPostOfficeRecord[] | null;
}

function validatePincode(pincode: string): string {
  const normalized = String(pincode || "").trim();

  if (!/^\d{6}$/.test(normalized)) {
    throw new Error("Enter a valid 6-digit PIN code.");
  }

  return normalized;
}

/**
 * Resolve PIN code details through the backend.
 *
 * The browser never calls the external postal service directly.
 * The backend normalizes the response before returning it.
 */
export async function getPincodeDetails(
  pincode: string,
): Promise<PincodeDetails> {
  const normalizedPincode = validatePincode(pincode);

  const response = await fetch(
    `https://api.postalpincode.in/pincode/${normalizedPincode}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to verify the PIN code right now.");
  }

  const data = (await response.json()) as IndiaPostResponse[];
  const result = data?.[0];
  const postOffice = result?.PostOffice?.[0];

  if (
    !postOffice ||
    String(result?.Status || "").toLowerCase() !== "success" ||
    !String(postOffice.District || "").trim() ||
    !String(postOffice.State || "").trim()
  ) {
    throw new Error("PIN code not found. Please enter a valid PIN code.");
  }

  return {
    pincode: normalizedPincode,
    district: String(postOffice.District).trim(),
    state: String(postOffice.State).trim(),
  };
}
