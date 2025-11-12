const requireEnv = (key: string): string => {
  const raw = process.env[key];
  const value = raw?.trim();
  if (!value) {
    throw new Error(`[VNPay] Missing required environment variable ${key}`);
  }
  return value;
};

const requireHttpsUrl = (key: string, fallback?: string): string => {
  const raw = (process.env[key] ?? fallback ?? "").trim();
  if (!raw) {
    throw new Error(`[VNPay] Missing required URL for ${key}`);
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`[VNPay] ${key} must be a valid URL`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`[VNPay] ${key} must use HTTPS`);
  }
  return parsed.toString();
};

const optionalHttpsUrl = (key: string): string => {
  const raw = (process.env[key] ?? "").trim();
  if (!raw) {
    return "";
  }
  return requireHttpsUrl(key);
};

export const vnpayConfig = Object.freeze({
  tmnCode: requireEnv("VNPAY_TMN_CODE"),
  hashSecret: requireEnv("VNPAY_HASH_SECRET"),
  url: requireHttpsUrl(
    "VNPAY_URL",
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  ),
  returnUrl: requireHttpsUrl("VNPAY_RETURN_URL"),
  ipnUrl: optionalHttpsUrl("VNPAY_IPN_URL"),

  queryUrl: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  refundUrl: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",

  version: "2.1.0",
  command: "pay",
  currency: "VND",
  locale: "vn",
  orderType: "other",
  createDate: "YYYYMMDDHHmmss",
  expireTime: 15,
});

console.log(
  "[VNPay] TMN:",
  vnpayConfig.tmnCode,
  "SECRET_LEN:",
  vnpayConfig.hashSecret.length
);
