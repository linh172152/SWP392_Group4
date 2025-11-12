const requireEnv = (key: string): string => {
  const raw = process.env[key];
  const value = raw?.trim();
  if (!value) {
    throw new Error(`[VNPay] Missing required environment variable ${key}`);
  }
  return value;
};

export const vnpayConfig = {
  tmnCode: requireEnv("VNPAY_TMN_CODE"),
  hashSecret: requireEnv("VNPAY_HASH_SECRET"),
  url:
    process.env.VNPAY_URL?.trim() ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: requireEnv("VNPAY_RETURN_URL"),
  ipnUrl: process.env.VNPAY_IPN_URL?.trim() || "",

  // VNPay API endpoints
  queryUrl: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
  refundUrl: "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",

  // VNPay version
  version: "2.1.0",

  // VNPay command
  command: "pay",

  // VNPay currency
  currency: "VND",

  // VNPay locale
  locale: "vn",

  // VNPay order type
  orderType: "other",

  // VNPay create date format
  createDate: "YYYYMMDDHHmmss",
  secureHashType: "HmacSHA512",

  // VNPay expire time (minutes)
  expireTime: 15,
};

console.log(
  "[VNPay] TMN:",
  vnpayConfig.tmnCode,
  "SECRET_LEN:",
  vnpayConfig.hashSecret.length
);
