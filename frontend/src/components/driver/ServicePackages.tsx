import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock,
  Battery,
  Zap
} from 'lucide-react';
import API_ENDPOINTS, { fetchWithAuth } from '../../config/api';
import { formatCurrency } from '../../utils/format';

interface ServicePackage {
  package_id: string;
  name: string;
  description: string | null;
  price: number;
  swap_limit: number | null;
  duration_days: number;
  battery_capacity_kwh: number;  // Thêm field này từ BE
  battery_models?: string[];     // Optional vì BE đã không bắt buộc
  is_active: boolean;
}

interface UserSubscription {
  subscription_id: string;
  package_id: string;
  start_date: string;
  end_date: string;
  remaining_swaps: number | null;
  status: 'active' | 'expired' | 'cancelled';
  package: {
    name: string;
    swap_limit: number | null;
    duration_days: number;
  };
}

const ServicePackages: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load danh sách gói dịch vụ
  const loadPackages = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_ENDPOINTS.PACKAGES.BASE}?is_active=true`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Tải gói dịch vụ thất bại');
      setPackages(data.data.packages || data.data || []);
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Load subscription hiện tại của user
  const loadCurrentSubscription = async () => {
    try {
      const url = new URL(API_ENDPOINTS.SUBSCRIPTIONS.BASE);
      url.searchParams.set('status', 'active');
      const res = await fetchWithAuth(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        const subscriptions = data.data.subscriptions || data.data || [];
        // Lấy subscription active đầu tiên (theo BE chỉ có 1 active)
        const activeSub = subscriptions.find((sub: UserSubscription) => {
          const now = new Date();
          const endDate = new Date(sub.end_date);
          // TODO: BE chưa tự động update status = "expired", nên FE phải check thủ công
          // Khi BE có logic tự động update expired, có thể bỏ phần check này
          const isStillValid = endDate >= now && 
                              (sub.remaining_swaps === null || sub.remaining_swaps > 0);
          return sub.status === 'active' && isStillValid;
        });
        setCurrentSubscription(activeSub || null);
      }
    } catch (e: any) {
      console.error('Load subscription error:', e);
    }
  };

  useEffect(() => {
    loadPackages();
    loadCurrentSubscription();
  }, []);

  // Tính toán số ngày còn lại
  const getDaysRemaining = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Mua gói dịch vụ
  const purchasePackage = async (packageId: string, autoRenew: boolean = false) => {
    setLoading(true);
    setError('');
    try {
      // BE endpoint: POST /api/driver/subscriptions/packages/:packageId/subscribe
      const res = await fetchWithAuth(API_ENDPOINTS.SUBSCRIPTIONS.SUBSCRIBE(packageId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoRenew: autoRenew
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Xử lý error "Insufficient wallet balance" → Redirect đến wallet
        if (data.message && (
          data.message.toLowerCase().includes('insufficient') ||
          data.message.toLowerCase().includes('không đủ') ||
          data.message.toLowerCase().includes('số dư')
        )) {
          setError('Số dư ví không đủ. Vui lòng nạp thêm tiền vào ví.');
          // Tự động redirect đến wallet sau 2 giây
          setTimeout(() => {
            navigate('/driver/wallet');
          }, 2000);
          return;
        }
        throw new Error(data.message || 'Mua gói dịch vụ thất bại');
      }
      // Reload để cập nhật subscription
      await loadCurrentSubscription();
      await loadPackages();
      setError('');
      // Hiển thị thông báo thành công (có thể dùng toast notification)
      alert('Đăng ký gói dịch vụ thành công!');
    } catch (e: any) {
      // Xử lý error "Insufficient wallet balance" từ catch block
      const errorMsg = e.message || 'Có lỗi xảy ra';
      if (errorMsg.toLowerCase().includes('insufficient') ||
          errorMsg.toLowerCase().includes('không đủ') ||
          errorMsg.toLowerCase().includes('số dư')) {
        setError('Số dư ví không đủ. Vui lòng nạp thêm tiền vào ví.');
        setTimeout(() => {
          navigate('/driver/wallet');
        }, 2000);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Hủy subscription
  const cancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Bạn có chắc muốn hủy gói dịch vụ này? Bạn sẽ mất quyền lợi miễn phí đổi pin.')) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      // BE endpoint: POST /api/driver/subscriptions/:subscriptionId/cancel
      const res = await fetchWithAuth(API_ENDPOINTS.SUBSCRIPTIONS.CANCEL(subscriptionId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Hủy gói dịch vụ thất bại');
      }
      await loadCurrentSubscription();
      alert('Đã hủy gói dịch vụ thành công!');
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra subscription còn hiệu lực không
  // NOTE: BE chưa tự động update status = "expired" khi hết hạn hoặc hết lượt
  // Khi BE đã có logic tự động update expired, có thể chỉ check: sub.status === 'active'
  // Logic hiện tại FE tự check: status === 'active' && end_date >= now && remaining_swaps > 0
  const isSubscriptionValid = (sub: UserSubscription | null): boolean => {
    if (!sub || sub.status !== 'active') return false;
    const now = new Date();
    const endDate = new Date(sub.end_date);
    // Gói hết hiệu lực khi: 1) Hết thời hạn (end_date < now) hoặc 2) Hết số lần (remaining_swaps <= 0)
    if (endDate < now) return false;
    if (sub.remaining_swaps !== null && sub.remaining_swaps <= 0) return false;
    return true;
  };

  const isValid = isSubscriptionValid(currentSubscription);
  const daysRemaining = currentSubscription ? getDaysRemaining(currentSubscription.end_date) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">Gói dịch vụ</h1>
          <p className="text-slate-600 dark:text-slate-300">Đăng ký gói dịch vụ để được miễn phí đổi pin</p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">
          {error}
        </div>
      )}

      {/* Subscription hiện tại */}
      {currentSubscription && isValid && (
        <Card className="glass-card border-0 glow-hover border-green-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-600" />
                  Gói dịch vụ hiện tại
                </CardTitle>
                <CardDescription>{currentSubscription.package.name}</CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Đang hoạt động
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Số lần còn lại</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {currentSubscription.remaining_swaps === null 
                    ? 'Không giới hạn' 
                    : currentSubscription.remaining_swaps}
                </p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Ngày hết hạn</p>
                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {new Date(currentSubscription.end_date).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Còn lại</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {daysRemaining} ngày
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => cancelSubscription(currentSubscription.subscription_id)}
                disabled={loading}
                className="border-red-500 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Hủy gói dịch vụ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Thông báo khi hết hạn hoặc hết lượt */}
      {currentSubscription && !isValid && (
        <Card className="glass-card border-0 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-semibold text-orange-800 dark:text-orange-400">
                  Gói dịch vụ đã hết hạn hoặc đã sử dụng hết
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {currentSubscription.package.name} - Vui lòng đăng ký gói mới để tiếp tục sử dụng
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danh sách gói dịch vụ */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
          Các gói dịch vụ có sẵn
        </h2>
        {loading ? (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">Đang tải...</div>
        ) : packages.length === 0 ? (
          <Card className="glass-card border-0">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Không có gói dịch vụ nào
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Hiện tại chưa có gói dịch vụ nào được cung cấp
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const isUnlimited = pkg.swap_limit === null;
              // Dùng formatCurrency thay vì toLocaleString
              const priceFormatted = pkg.price === 0 ? 'Miễn phí' : formatCurrency(Number(pkg.price));
              const hasActiveSubscription = currentSubscription && isValid;
              
              return (
                <Card 
                  key={pkg.package_id} 
                  className={`glass-card border-0 glow-hover ${hasActiveSubscription ? 'opacity-60' : ''}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 mb-2">
                          <Zap className="h-5 w-5 text-blue-600" />
                          {pkg.name}
                        </CardTitle>
                        <CardDescription className="text-sm">{pkg.description || 'Gói dịch vụ đổi pin'}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4 border-y border-slate-200 dark:border-slate-700">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {priceFormatted}
                      </div>
                      {pkg.price > 0 && (
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          / {pkg.duration_days} ngày
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Battery className="h-4 w-4 text-green-600" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {isUnlimited ? 'Không giới hạn' : `${pkg.swap_limit} lần`} đổi pin miễn phí
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-slate-700 dark:text-slate-300">
                          Thời hạn: {pkg.duration_days} ngày
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                        <span className="text-slate-700 dark:text-slate-300">
                          Dung lượng pin: {pkg.battery_capacity_kwh} kWh
                        </span>
                      </div>
                    </div>

                    {hasActiveSubscription ? (
                      <Button 
                        disabled 
                        className="w-full opacity-50 cursor-not-allowed"
                      >
                        Đã có gói dịch vụ
                      </Button>
                    ) : (
                      <Button 
                        className="w-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => purchasePackage(pkg.package_id, false)}
                        disabled={loading}
                      >
                        {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicePackages;

