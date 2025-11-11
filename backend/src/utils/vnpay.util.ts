import crypto from "crypto-js";
import moment from "moment-timezone";
import { vnpayConfig } from "../config/vnpay.config";

export type VNPayParams = Record<string, string>;

export interface VNPayRequestPayload {
  amount: number;
  orderId: string;
  orderInfo: string;
  orderType?: string;
  bankCode?: string;
  locale?: string;
  clientIp: string;
}

export type VNPayResponsePayload = Record<string, string>;

const sortKeys = (source: VNPayParams): string[] =>
  Object.keys(source).sort((a, b) => a.localeCompare(b));

const buildSignedData = (params: VNPayParams): string =>
  sortKeys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");

const signDataWithSecret = (signed: string): string =>
  crypto
    .HmacSHA512(signed, vnpayConfig.hashSecret)
    .toString(crypto.enc.Hex)
    .toUpperCase();

const normalizeOrderInfo = (value: string): string =>
  value.replace(/\s+/g, "");

const formatAmount = (amount: number): string =>
  Math.round(amount * 100).toString();

export const buildVNPayRequestParams = (
  payload: VNPayRequestPayload
): VNPayParams => {
  const timestamp = moment()
    .tz("Asia/Ho_Chi_Minh")
    .format(vnpayConfig.dateFormat);
  const expireTime = moment(timestamp, vnpayConfig.dateFormat)
    .add(vnpayConfig.expireTime, "minutes")
    .format(vnpayConfig.dateFormat);

  const params: VNPayParams = {
    vnp_Version: vnpayConfig.version,
    vnp_Command: vnpayConfig.command,
    vnp_TmnCode: vnpayConfig.tmnCode,
    vnp_Amount: formatAmount(payload.amount),
    vnp_CurrCode: vnpayConfig.currency,
    vnp_TxnRef: payload.orderId,
    vnp_OrderInfo: normalizeOrderInfo(payload.orderInfo),
    vnp_OrderType: payload.orderType || vnpayConfig.defaultOrderType,
    vnp_Locale: payload.locale || vnpayConfig.locale,
    vnp_ReturnUrl: vnpayConfig.returnUrl,
    vnp_IpAddr: payload.clientIp || "127.0.0.1",
    vnp_CreateDate: timestamp,
    vnp_ExpireDate: expireTime,
  };

  const trimmedBankCode = payload.bankCode?.trim();
  if (trimmedBankCode) {
    params.vnp_BankCode = trimmedBankCode;
  }

  return params;
};

export const generateVNPayPaymentUrl = (
  payload: VNPayRequestPayload
): { paymentUrl: string; params: VNPayParams; signedData: string } => {
  const params = buildVNPayRequestParams(payload);
  const signedData = buildSignedData(params);
  const secureHash = signDataWithSecret(signedData);

  const fullParams: VNPayParams = {
    ...params,
    vnp_SecureHashType: vnpayConfig.secureHashType,
    vnp_SecureHash: secureHash,
  };

  const queryString = sortKeys(fullParams)
    .map((key) => `${key}=${encodeURIComponent(fullParams[key])}`)
    .join("&");

  return {
    paymentUrl: `${vnpayConfig.url}?${queryString}`,
    params: fullParams,
    signedData,
  };
};

export const verifyVNPaySignature = (
  response: VNPayResponsePayload
): boolean => {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = response;
  const signedData = buildSignedData(rest);
  const expectedHash = signDataWithSecret(signedData);
  return expectedHash === (vnp_SecureHash || "").toUpperCase();
};

export const mapResponseToRecord = (
  source: Record<string, unknown>
): VNPayResponsePayload => {
  const result: VNPayResponsePayload = {};
  Object.entries(source).forEach(([key, value]) => {
    if (typeof value === "string") {
      result[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      result[key] = String(value[0]);
    } else if (value != null) {
      result[key] = String(value);
    }
  });
  return result;
};

export const isVNPaySuccess = (response: VNPayResponsePayload): boolean => {
  if (response.vnp_ResponseCode !== "00") {
    return false;
  }
  if (typeof response.vnp_TransactionStatus === "string") {
    return response.vnp_TransactionStatus === "00";
  }
  return true;
};

export const getVNPayResponseMessage = (code: string): string => {
  const messages: Record<string, string> = {
    "00": "Giao dịch thành công",
    "07": "Trừ tiền thành công nhưng giao dịch nghi ngờ",
    "09": "Thẻ/Tài khoản chưa đăng ký Internet Banking",
    "10": "Xác thực thông tin thẻ/tài khoản sai quá 3 lần",
    "11": "Giao dịch hết hạn chờ thanh toán",
    "12": "Thẻ/Tài khoản bị khóa",
    "13": "Nhập sai mật khẩu OTP quá số lần quy định",
    "24": "Khách hàng hủy giao dịch",
    "51": "Không đủ số dư",
    "65": "Vượt hạn mức giao dịch",
    "75": "Ngân hàng đang bảo trì",
    "79": "Nhập sai mật khẩu thanh toán quá số lần",
    "99": "Lỗi không xác định",
  };
  return messages[code] || "Lỗi không xác định";
};

export const parseVNPayAmount = (amount: string): number => {
  const value = parseInt(amount, 10);
  return Number.isFinite(value) ? value / 100 : 0;
};
