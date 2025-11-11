import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Star, 
  MapPin, 
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react';
import API_ENDPOINTS, { fetchWithAuth } from '../../config/api';
import { ErrorDisplay } from '../ui/error-display';
import { Skeleton } from '../ui/skeleton';

interface Rating {
  rating_id: string;
  station_id: string;
  transaction_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  station?: {
    name: string;
    address: string;
  };
  transaction?: {
    transaction_code: string;
    swap_at: string;
  };
}

const StationRating: React.FC = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load ratings đã tạo
  const loadRatings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.RATINGS.BASE);
      const data = await res.json();
      if (res.ok && data.success) {
        setRatings(data.data.ratings || data.data || []);
      } else {
        throw new Error(data.message || 'Tải đánh giá thất bại');
      }
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra khi tải đánh giá');
      console.error('Error loading ratings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
            Đánh giá dịch vụ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Xem lại lịch sử đánh giá của bạn
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadRatings}
          className="shadow-sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && <ErrorDisplay message={error} variant="card" />}

      {/* Danh sách đánh giá đã tạo */}
      <Card className="glass-card border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Lịch sử đánh giá của tôi
          </CardTitle>
          <CardDescription>
            {ratings.length > 0
              ? `Tổng cộng ${ratings.length} đánh giá`
              : 'Bạn chưa có đánh giá nào'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Star className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Bạn chưa có đánh giá nào</p>
              <p className="text-sm">
                Đánh giá dịch vụ tại trang{' '}
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  Lịch sử Giao dịch
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((ratingItem) => (
                <div
                  key={ratingItem.rating_id}
                  className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-lg text-slate-900 dark:text-white">
                          {ratingItem.station?.name || 'Trạm đổi pin'}
                        </span>
                      </div>
                      {ratingItem.station?.address && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                          {ratingItem.station.address}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= ratingItem.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {ratingItem.rating}/5
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ratingItem.created_at)}
                        </span>
                      </div>
                      {ratingItem.comment && (
                        <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {ratingItem.comment}
                          </p>
                        </div>
                      )}
                      {ratingItem.transaction?.transaction_code && (
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Mã giao dịch: {ratingItem.transaction.transaction_code}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StationRating;

