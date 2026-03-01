export type SSLCommerzEnv = "sandbox" | "live";

export type ProductProfile =
  | "general"
  | "physical-goods"
  | "non-physical-goods"
  | "airline-tickets"
  | "travel-vertical"
  | "telecom-vertical";

export interface CartItem {
  sku?: string;
  product: string;
  quantity?: string | number;
  amount: string;
  unit_price?: string;
}

export interface InitiatePaymentParams {
  store_id: string;
  store_passwd: string;
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url?: string;
  product_name: string;
  product_category: string;
  product_profile: ProductProfile;
  product_amount?: number;
  vat?: number;
  discount_amount?: number;
  convenience_fee?: number;
  cart?: CartItem[];
  cus_name: string;
  cus_email: string;
  cus_add1?: string;
  cus_add2?: string;
  cus_city?: string;
  cus_state?: string;
  cus_postcode?: string;
  cus_country?: string;
  cus_phone?: string;
  cus_fax?: string;
  shipping_method?: string;
  num_of_item?: number;
  ship_name?: string;
  ship_add1?: string;
  ship_add2?: string;
  ship_area?: string;
  ship_city?: string;
  ship_sub_city?: string;
  ship_state?: string;
  ship_postcode?: string;
  ship_country?: string;
  weight_of_items?: number;
  logistic_pickup_id?: string;
  logistic_delivery_type?: string;
  emi_option?: 0 | 1;
  emi_max_inst_option?: number;
  emi_selected_inst?: number;
  emi_allow_only?: 0 | 1;
  hours_till_departure?: string;
  flight_type?: string;
  pnr?: string;
  journey_from_to?: string;
  third_party_booking?: string;
  hotel_name?: string;
  length_of_stay?: string;
  check_in_time?: string;
  hotel_city?: string;
  product_type?: string;
  topup_number?: string;
  country_topup?: string;
  multi_card_name?: string;
  allowed_bin?: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
}

export interface InitiatePaymentResponse {
  status: "SUCCESS" | "FAILED";
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  redirectGatewayURL?: string;
  directPaymentURLBank?: string;
  directPaymentURLCard?: string;
  directPaymentURL?: string;
  storeBanner?: string;
  storeLogo?: string;
  gw?: {
    visa?: string;
    master?: string;
    amex?: string;
    othercards?: string;
    internetbanking?: string;
    mobilebanking?: string;
  };
  desc?: Array<{
    name: string;
    type: string;
    logo: string;
    gw: string;
    r_flag?: string;
    redirectGatewayURL?: string;
  }>;
  is_direct_pay_enable?: string;
}

export interface IpnPayload {
  status: "VALID" | "FAILED" | "CANCELLED" | "UNATTEMPTED" | "EXPIRED";
  tran_date: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  card_type: string;
  card_no: string;
  currency: string;
  bank_tran_id: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  currency_type: string;
  currency_amount: string;
  verify_sign: string;
  verify_key: string;
  risk_level: "0" | "1";
  risk_title: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
  [key: string]: string | undefined;
}

export interface ValidationResponse {
  status: "VALID" | "VALIDATED" | "INVALID_TRANSACTION";
  tran_date: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  currency: string;
  bank_tran_id: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  currency_type: string;
  currency_amount: string;
  emi_instalment?: string;
  emi_amount?: string;
  discount_amount?: string;
  discount_percentage?: string;
  discount_remarks?: string;
  risk_level: "0" | "1";
  risk_title: string;
  APIConnect: "DONE" | string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
}

export interface RefundParams {
  store_id: string;
  store_passwd: string;
  bank_tran_id: string;
  refund_amount: number;
  refund_remarks: string;
  refe_id?: string;
}

export interface RefundResponse {
  APIConnect: "DONE" | "FAILED" | "INVALID_REQUEST" | "INACTIVE";
  bank_tran_id?: string;
  trans_id?: string;
  refund_ref_id?: string;
  status?: "success" | "failed" | "processing";
  errorReason?: string;
}

export interface RefundStatusParams {
  store_id: string;
  store_passwd: string;
  refund_ref_id: string;
}

export interface RefundStatusResponse {
  APIConnect: string;
  bank_tran_id: string;
  tran_id: string;
  initiated_on: string;
  refunded_on: string;
  status: "refunded" | string;
  refund_ref_id: string;
}

export interface QueryBySessionParams {
  store_id: string;
  store_passwd: string;
  sessionkey: string;
}

export interface QueryByTranIdParams {
  store_id: string;
  store_passwd: string;
  tran_id: string;
}

export interface TransactionElement {
  val_id: string;
  status: "VALID" | "VALIDATED" | "PENDING" | "FAILED";
  validated_on: string;
  currency_type: string;
  currency_amount: string;
  currency_rate: string;
  tran_date: string;
  tran_id: string;
  amount: string;
  store_amount: string;
  bank_tran_id: string;
  card_type: string;
  card_no: string;
  card_issuer: string;
  card_brand: string;
  card_issuer_country: string;
  card_issuer_country_code: string;
  risk_level: "0" | "1";
  risk_title: string;
  emi_instalment: string;
  emi_amount: string;
  error: string;
  value_a?: string;
  value_b?: string;
  value_c?: string;
  value_d?: string;
}

export interface QueryByTranIdResponse {
  APIConnect: string;
  no_of_trans_found: number;
  element: TransactionElement[];
}
