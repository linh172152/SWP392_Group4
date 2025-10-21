export const vnpayConfig = {
  // VNPay Sandbox Configuration
  tmnCode: process.env.VNPAY_TMN_CODE || '2QXUI4J4',
  hashSecret: process.env.VNPAY_HASH_SECRET || 'RAOEXHYVHDDIIENYWSLDIIENYWSLEXY',
  url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payments/vnpay/return',
  ipnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:3000/api/payments/vnpay/ipn',
  
  // VNPay API endpoints
  queryUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  refundUrl: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
  
  // VNPay version
  version: '2.1.0',
  
  // VNPay command
  command: 'pay',
  
  // VNPay currency
  currency: 'VND',
  
  // VNPay locale
  locale: 'vn',
  
  // VNPay order type
  orderType: 'other',
  
  // VNPay create date format
  createDate: 'yyyyMMddHHmmss',
  
  // VNPay expire time (minutes)
  expireTime: 15
};

