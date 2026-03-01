"use server";

import { BASE_URLS, VALIDATION_URL } from "./config";
import { rateLimit } from "@/lib/rate-limit";
import type {
  InitiatePaymentParams,
  InitiatePaymentResponse,
  SSLCommerzEnv,
  ValidationResponse,
} from "@/types/payment-types";

// ─── Payments ───────────────────────────────────────────────────────────────

export async function initiatePayment(
  params: InitiatePaymentParams,
  env: SSLCommerzEnv = "sandbox",
  request?: Request,
): Promise<InitiatePaymentResponse> {
  if (request && (await rateLimit(request))) {
    throw new Error("Too many requests. Please wait and try again.");
  }

  
  const url = BASE_URLS[env].payment;
  
  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (key === "cart") {
      body.append("cart", JSON.stringify(value));
    } else {
      body.append(key, String(value));
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`SSLCommerz initiate failed: HTTP ${res.status}`);
  }

  return res.json() as Promise<InitiatePaymentResponse>;
}

export async function validatePayment(
  valId: string,
  storeId: string,
  storePasswd: string,
  env: SSLCommerzEnv = "sandbox",
  request?: Request,
): Promise<ValidationResponse> {
  if (request && (await rateLimit(request))) {
    throw new Error("Too many requests. Please wait and try again.");
  }

  const url = new URL(VALIDATION_URL[env]);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", storeId);
  url.searchParams.set("store_passwd", storePasswd);
  url.searchParams.set("v", "1");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`SSLCommerz validation failed: HTTP ${res.status}`);
  }

  return res.json() as Promise<ValidationResponse>;
}
