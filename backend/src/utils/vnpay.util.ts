import crypto from 'crypto-js';
import moment from 'moment';
import { vnpayConfig } from '../config/vnpay.config';

export interface VNPayPaymentData {
  amount: number;
  orderId: string;
  orderDescription: string;
  orderType?: string;
  bankCode?: string;
  language?: string;
}

export interface VNPayResponse {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

/**
 * Generate VNPay payment URL
 */
export const generateVNPayUrl = (paymentData: VNPayPaymentData): string => {
  const {
    amount,
    orderId,
    orderDescription,
    orderType = 'other',
    bankCode = '',
    language = 'vn'
  } = paymentData;

  // Create date in VNPay format
  const createDate = moment().format(vnpayConfig.createDate);
  
  // Expire date (15 minutes from now)
  const expireDate = moment().add(vnpayConfig.expireTime, 'minutes').format(vnpayConfig.createDate);
  
  // Convert amount to VNPay format (multiply by 100)
  const vnpAmount = (amount * 100).toString();
  
  // Create order info
  const orderInfo = orderDescription;
  
  // Create return URL
  const returnUrl = vnpayConfig.returnUrl;
  
  // Create IPN URL (not used in URL generation)
  // const ipnUrl = vnpayConfig.ipnUrl;
  
  // Create parameters object
  const params: Record<string, string> = {
    vnp_Version: vnpayConfig.version,
    vnp_Command: vnpayConfig.command,
    vnp_TmnCode: vnpayConfig.tmnCode,
    vnp_Amount: vnpAmount,
    vnp_CurrCode: vnpayConfig.currency,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Locale: language,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: '127.0.0.1', // This should be the actual client IP
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };

  // Add bank code if provided
  if (bankCode) {
    params.vnp_BankCode = bankCode;
  }

  // Sort parameters by key
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result: Record<string, string>, key) => {
      result[key] = params[key];
      return result;
    }, {});

  // Create query string
  const queryString = Object.keys(sortedParams)
    .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
    .join('&');

  // Create secure hash
  const secureHash = crypto.HmacSHA512(queryString, vnpayConfig.hashSecret).toString();

  // Add secure hash to parameters
  const finalParams: Record<string, string> = {
    ...sortedParams,
    vnp_SecureHash: secureHash
  };

  // Create final query string
  const finalQueryString = Object.keys(finalParams)
    .map(key => `${key}=${encodeURIComponent(finalParams[key])}`)
    .join('&');

  // Return full VNPay URL
  return `${vnpayConfig.url}?${finalQueryString}`;
};

/**
 * Verify VNPay response signature
 */
export const verifyVNPayResponse = (response: VNPayResponse): boolean => {
  try {
    // Extract secure hash from response
    const { vnp_SecureHash, ...params } = response;
    
    // Sort parameters by key
    const sortedParams: Record<string, string> = {};
    Object.keys(params)
      .sort()
      .forEach(key => {
        sortedParams[key] = (params as any)[key];
      });

    // Create query string
    const queryString = Object.keys(sortedParams)
      .map(key => `${key}=${encodeURIComponent(sortedParams[key])}`)
      .join('&');

    // Generate secure hash
    const generatedHash = crypto.HmacSHA512(queryString, vnpayConfig.hashSecret).toString();

    // Compare hashes
    return generatedHash === vnp_SecureHash;
  } catch (error) {
    return false;
  }
};

/**
 * Check if VNPay response is successful
 */
export const isVNPaySuccess = (response: VNPayResponse): boolean => {
  return response.vnp_ResponseCode === '00' && response.vnp_TransactionStatus === '00';
};

/**
 * Get VNPay response message
 */
export const getVNPayResponseMessage = (responseCode: string): string => {
  const messages: Record<string, string> = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking',
    '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch',
    '12': 'Thẻ/Tài khoản của khách hàng bị khóa',
    '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP) quá số lần quy định',
    '51': 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
    '65': 'Tài khoản của quý khách đã vượt quá hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng thanh toán đang bảo trì',
    '79': 'Nhập sai mật khẩu thanh toán quá số lần cho phép',
    '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
  };

  return messages[responseCode] || 'Lỗi không xác định';
};

/**
 * Format amount for VNPay (multiply by 100)
 */
export const formatVNPayAmount = (amount: number): string => {
  return (amount * 100).toString();
};

/**
 * Parse amount from VNPay response (divide by 100)
 */
export const parseVNPayAmount = (amount: string): number => {
  return parseInt(amount) / 100;
};
