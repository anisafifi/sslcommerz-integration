
import { BASE_URLS } from "./config";
import type {
  QueryBySessionParams,
  QueryByTranIdParams,
  QueryByTranIdResponse,
  SSLCommerzEnv,
  TransactionElement,
  ValidationResponse,
} from "@/types/payment-types";


// ──────────────────────────────────────────────────────────────────────────────

export async function queryTransactionBySession(
  params: QueryBySessionParams,
  env: SSLCommerzEnv = "sandbox"
): Promise<ValidationResponse> {
  const url = new URL(BASE_URLS[env].validator);
  url.searchParams.set("sessionkey", params.sessionkey);
  url.searchParams.set("store_id", params.store_id);
  url.searchParams.set("store_passwd", params.store_passwd);
  url.searchParams.set("v", "1");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`SSLCommerz session query failed: HTTP ${res.status}`);
  }

  return res.json() as Promise<ValidationResponse>;
}

export async function queryTransactionByTranId(
  params: QueryByTranIdParams,
  env: SSLCommerzEnv = "sandbox"
): Promise<QueryByTranIdResponse> {
  
  const url = new URL(BASE_URLS[env].validator);
  url.searchParams.set("tran_id", params.tran_id);
  url.searchParams.set("store_id", params.store_id);
  url.searchParams.set("store_passwd", params.store_passwd);
  url.searchParams.set("v", "1");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`SSLCommerz tran_id query failed: HTTP ${res.status}`);
  }

  return res.json() as Promise<QueryByTranIdResponse>;
}

export function extractSuccessfulTransaction(
  response: QueryByTranIdResponse
): TransactionElement | null {
  if (response.APIConnect !== "DONE") return null;
  return (
    response.element?.find(
      (t) => t.status === "VALID" || t.status === "VALIDATED"
    ) ?? null
  );
}
