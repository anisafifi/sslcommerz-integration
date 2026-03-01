import { createHash } from "crypto";
import { validatePayment } from "./payments";
import type {
  IpnPayload,
  SSLCommerzEnv,
  ValidationResponse,
} from "@/types/payment-types";

// ──────────────────────────────────────────────────────────────────────────────

/**
 * Verify the SSLCommerz IPN signature.
 *
 * Steps (per SSLCommerz docs):
 *  1. Split verify_key by comma  →  get the list of param names
 *  2. Append "store_passwd" to that list
 *  3. Sort the list alphabetically
 *  4. For each key: value is the raw payload value,
 *     EXCEPT store_passwd → replace with MD5(storePasswd)
 *  5. Build "key1=val1&key2=val2&..." string in sorted order
 *  6. MD5 hash that string and compare to verify_sign
 */
export function verifyIpnSignature(
  payload: IpnPayload,
  storePasswd: string
): boolean {
  if (!payload.verify_sign || !payload.verify_key) return false;

  // Step 1 — get the param names SSLCommerz used to build the signature
  const keys = payload.verify_key.split(",").map((k) => k.trim()).filter(Boolean);

  // Step 2 — add store_passwd to the key list
  keys.push("store_passwd");

  // Step 3 — sort alphabetically
  keys.sort();

  // Step 4 — MD5 of the store password (used in place of the actual password)
  const hashedPass = createHash("md5").update(storePasswd).digest("hex");

  // Step 5 — build key=value string in sorted order
  const parts = keys.map((key) => {
    const value = key === "store_passwd"
      ? hashedPass
      : (payload[key as keyof IpnPayload] ?? "");
    return `${key}=${value}`;
  });

  const hashString = parts.join("&");

  // Step 6 — MD5 hash and compare
  const computedSign = createHash("md5").update(hashString).digest("hex");

  if (computedSign !== payload.verify_sign) {
    console.warn("[verifyIpnSignature] Signature mismatch", {
      expected: payload.verify_sign,
      computed: computedSign,
      hashString, // remove this line in production
    });
    return false;
  }

  return true;
}


export async function handleIpn(
  payload: IpnPayload,
  storeId: string,
  storePasswd: string,
  env: SSLCommerzEnv = "sandbox"
): Promise<{ valid: boolean; data: ValidationResponse | null; reason?: string }> {
  
  if (payload.status !== "VALID") {
    return {
      valid: false,
      data: null,
      reason: `Transaction status is ${payload.status}`,
    };
  }

  const signatureOk = verifyIpnSignature(payload, storePasswd);

  console.log("IPN signature verification:", signatureOk);

  if (!signatureOk) {
    return { valid: false, data: null, reason: "IPN signature mismatch" };
  }

  const data = await validatePayment(payload.val_id, storeId, storePasswd, env);

  if (data.status !== "VALID" && data.status !== "VALIDATED") {
    return {
      valid: false,
      data,
      reason: `Validation API returned status: ${data.status}`,
    };
  }

  return { valid: true, data };
}
