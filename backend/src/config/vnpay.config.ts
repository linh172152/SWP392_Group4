const sanitize = (value?: string, fallback?: string): string => {
  if (!value) return fallback ?? "";
  return value.trim();
};

export const vnpayConfig = {
  // VNPay Sandbox Configuration
  tmnCode: sanitize(process.env.VNPAY_TMN_CODE, "LEAFSTIT"),
  hashSecret: sanitize(
    process.env.VNPAY_HASH_SECRET,
    "3WKXHH4OIVQP7PU36Y6VEIO11LVS2BJV"
  ),
  url: sanitize(
    process.env.VNPAY_URL,
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  ),
  returnUrl: sanitize(
    process.env.VNPAY_RETURN_URL,
    "http://localhost:3000/api/payments/vnpay/return"
  ),
  ipnUrl: sanitize(process.env.VNPAY_IPN_URL, ""),

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
