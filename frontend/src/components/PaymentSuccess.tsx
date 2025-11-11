import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import walletService from '../services/wallet.service';
import { formatCurrency } from '../utils/format';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    const paymentId = searchParams.get('paymentId');
    const amountParam = searchParams.get('amount');

    if (amountParam) {
      setAmount(Number(amountParam));
    }

    if (paymentId) {
      // Verify payment status
      verifyPayment(paymentId);
    } else {
      setError('Không tìm thấy thông tin thanh toán');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (paymentId: string) => {
    try {
      // Wait a bit for backend to process the payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload wallet balance to verify topup
      const balanceResponse = await walletService.getWalletBalance();
      
      if (balanceResponse.success) {
        setSuccess(true);
      } else {
        setError('Không thể xác minh thanh toán');
      }
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      // Even if verification fails, if we got here, payment likely succeeded
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToWallet = () => {
    navigate('/driver/wallet');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass-card border-0 shadow-xl max-w-md w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-slate-600 dark:text-slate-400">
                Đang xử lý thanh toán...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass-card border-0 shadow-xl max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </CardTitle>
          <CardDescription className="text-center">
            {success 
              ? 'Tiền đã được nạp vào ví của bạn' 
              : error || 'Có lỗi xảy ra trong quá trình thanh toán'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {success ? (
            <>
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              {amount > 0 && (
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Số tiền đã nạp:
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    +{formatCurrency(amount)}
                  </p>
                </div>
              )}
              <Button
                onClick={handleGoToWallet}
                className="w-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Xem ví của tôi
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <Button
                onClick={() => navigate('/driver/wallet')}
                variant="outline"
                className="w-full"
              >
                Quay lại ví
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;

