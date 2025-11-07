import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Wallet, Gift, Check } from 'lucide-react';
import { type TopUpPackage } from '../../services/topup-package.service';
import walletService from '../../services/wallet.service';
import { formatCurrency } from '../../utils/format';

interface TopUpModalProps {
  packages: TopUpPackage[];
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

const TopUpModal: React.FC<TopUpModalProps> = ({
  packages,
  currentBalance,
  onClose,
  onSuccess,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<TopUpPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vnpay' | 'momo'>('vnpay');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleTopUp = async () => {
    if (!selectedPackage) {
      setError('Vui lòng chọn gói nạp tiền');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await walletService.topUpWallet({
        package_id: selectedPackage.package_id,
        payment_method: paymentMethod,
      });

      if (response.success) {
        // If cash payment, success immediately
        if (paymentMethod === 'cash') {
          onSuccess();
        } else {
          // For online payments, redirect to payment gateway
          // This will be handled by VNPay service
          // For now, just show success message
          alert('Đang chuyển hướng đến cổng thanh toán...');
          // TODO: Handle VNPay/MoMo redirect
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi nạp tiền');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl glass-card border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 gradient-primary rounded-lg glow">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="bg-gradient-to-r from-slate-900 to-green-800 dark:from-white dark:to-lime-100 bg-clip-text text-transparent">
                Nạp tiền vào ví
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Số dư hiện tại: {formatCurrency(currentBalance)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Package Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
              Chọn gói nạp tiền
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.package_id === pkg.package_id;
                const hasBonus = Number(pkg.bonus_amount) > 0;

                return (
                  <button
                    key={pkg.package_id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {pkg.name}
                        </div>
                        {pkg.description && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {pkg.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Nạp:
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(Number(pkg.topup_amount))}
                        </span>
                      </div>
                      {hasBonus && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Khuyến mãi:
                          </span>
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            +{formatCurrency(Number(pkg.bonus_amount))}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          Tổng nhận:
                        </span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(Number(pkg.actual_amount))}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {packages.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                Không có gói nạp tiền nào
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          {selectedPackage && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
                Phương thức thanh toán
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['vnpay', 'momo', 'cash'] as const).map((method) => {
                  const labels = {
                    vnpay: 'VNPay',
                    momo: 'MoMo',
                    cash: 'Tiền mặt',
                  };

                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentMethod === method
                          ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                      }`}
                    >
                      <div className="font-medium text-slate-900 dark:text-white">
                        {labels[method]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedPackage && (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 dark:text-slate-400">Số tiền nạp:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(Number(selectedPackage.topup_amount))}
                </span>
              </div>
              {Number(selectedPackage.bonus_amount) > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                    Khuyến mãi:
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    +{formatCurrency(Number(selectedPackage.bonus_amount))}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Tổng nhận được:
                </span>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(Number(selectedPackage.actual_amount))}
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              onClick={handleTopUp}
              disabled={!selectedPackage || loading}
              className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Nạp tiền
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpModal;

