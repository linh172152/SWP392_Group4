const pickEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`[VNPay] Missing required environment variable ${key}`);
  }
  return value;
};

export const vnpayConfig = {
  tmnCode: pickEnv("VNPAY_TMN_CODE"),
  hashSecret: pickEnv("VNPAY_HASH_SECRET"),
  url:
    process.env.VNPAY_URL?.trim() ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: pickEnv("VNPAY_RETURN_URL"),
  ipnUrl: process.env.VNPAY_IPN_URL?.trim() || "",
  version: "2.1.0",
  command: "pay",
  currency: "VND",
  locale: "vn",
  defaultOrderType: "other",
  dateFormat: "YYYYMMDDHHmmss",
  secureHashType: "HmacSHA512",
  expireTime: 15,
};

console.log(
  "[VNPay] TMN:",
  vnpayConfig.tmnCode,
  "SECRET_LEN:",
  vnpayConfig.hashSecret.length
);
