"use server";

import { BASE_URLS } from "./config";
import { rateLimit } from "@/lib/rate-limit";
import type {
  RefundParams,
  RefundResponse,
  RefundStatusParams,
  RefundStatusResponse,
  SSLCommerzEnv,
} from "@/types/payment-types";

// ──────────────────────────────────────────────────────────────────────────────

export async function initiateRefund(
  params: RefundParams,
  env: SSLCommerzEnv = "sandbox",
  request?: Request,
): Promise<RefundResponse> {
  if (request && (await rateLimit(request))) {
    throw new Error("Too many requests. Please wait and try again.");
  }

  const url = new URL(BASE_URLS[env].validator);
  url.searchParams.set("bank_tran_id", params.bank_tran_id);
  url.searchParams.set("store_id", params.store_id);
  url.searchParams.set("store_passwd", params.store_passwd);
  url.searchParams.set("refund_amount", String(params.refund_amount));
  url.searchParams.set("refund_remarks", params.refund_remarks);
  if (params.refe_id) url.searchParams.set("refe_id", params.refe_id);
  url.searchParams.set("v", "1");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`SSLCommerz refund failed: HTTP ${res.status}`);
  }

  return res.json() as Promise<RefundResponse>;
}

export async function queryRefundStatus(
  params: RefundStatusParams,
  env: SSLCommerzEnv = "sandbox",
  request?: Request,
): Promise<RefundStatusResponse> {
  if (request && (await rateLimit(request))) {
    throw new Error("Too many requests. Please wait and try again.");
  }

  const url = new URL(BASE_URLS[env].validator);
  url.searchParams.set("refund_ref_id", params.refund_ref_id);
  url.searchParams.set("store_id", params.store_id);
  url.searchParams.set("store_passwd", params.store_passwd);
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`SSLCommerz refund status query failed: HTTP ${res.status}`);
  }

  return res.json() as Promise<RefundStatusResponse>;
}
