import { initiatePayment } from "./payments";
import type {
  InitiatePaymentParams,
  SSLCommerzEnv,
} from "@/types/payment-types";

// ──────────────────────────────────────────────────────────────────────────────

export function getEasyCheckoutScriptUrl(env: SSLCommerzEnv = "sandbox"): string {
  const rand = Math.random().toString(36).substring(7);
  return env === "sandbox"
    ? `https://sandbox.sslcommerz.com/embed.min.js?${rand}`
    : `https://seamless-epay.sslcommerz.com/embed.min.js?${rand}`;
}

export async function getGatewayUrl(
  params: InitiatePaymentParams,
  env: SSLCommerzEnv = "sandbox"
): Promise<string> {
  const response = await initiatePayment(params, env);

  if (response.status !== "SUCCESS" || !response.GatewayPageURL) {
    throw new Error(
      `Failed to create SSLCommerz session: ${response.failedreason ?? "Unknown error"}`
    );
  }

  return response.GatewayPageURL;
}

export async function getEasyCheckoutResponse(
  params: InitiatePaymentParams,
  env: SSLCommerzEnv = "sandbox"
): Promise<{ status: "success" | "fail"; data: string | null; logo?: string; message?: string }> {
  try {
    const response = await initiatePayment(params, env);

    if (response.GatewayPageURL) {
      return {
        status: "success",
        data: response.GatewayPageURL,
        logo: response.storeLogo,
      };
    }

    return { status: "fail", data: null, message: "JSON Data parsing error!" };
  } catch (err) {
    return {
      status: "fail",
      data: null,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
