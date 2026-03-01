import type { SSLCommerzEnv } from "@/types/payment-types";

// ──────────────────────────────────────────────────────────────────────────────

export const BASE_URLS: Record<
  SSLCommerzEnv,
  { payment: string; validator: string }
> = {
  sandbox: {
    payment: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    validator:
      "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php",
  },
  live: {
    payment: "https://securepay.sslcommerz.com/gwprocess/v4/api.php",
    validator:
      "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php",
  },
};

export const VALIDATION_URL: Record<SSLCommerzEnv, string> = {
  sandbox: "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
  live: "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php",
};
