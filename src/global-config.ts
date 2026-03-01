

export const CONFIG = {

    appName: "SSLCOMMERZ Integration Tutorial",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

    // sslcommerz configuration
    storeId: process.env.SSLCOMMERZ_STORE_ID || '',
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
    paymentEnv: process.env.SSLCOMMERZ_ENV || 'sandbox',
    ipnAllowlist: process.env.SSLCOMMERZ_IPN_ALLOWLIST || '',
};