import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { 
  Star, 
  MapPin, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import API_ENDPOINTS, { fetchWithAuth } from '../../config/api';
import { ErrorDisplay } from '../ui/error-display';
import { Skeleton } from '../ui/skeleton';
import { Transaction } from '../../services/transaction.service';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load transactions đã completed (chưa đánh giá)
  const loadRatableTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      // Load transactions completed
      const res = await fetchWithAuth(API_ENDPOINTS.DRIVER.TRANSACTIONS);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Tải giao dịch thất bại');
      
      const allTransactions: Transaction[] = data.data?.transactions || data.data || [];
      // Chỉ lấy transactions đã completed
      const completedTransactions = allTransactions.filter(
        (t: Transaction) => t.payment?.payment_status === 'completed'
      );

      // Load ratings để check xem transaction nào đã được đánh giá
      try {
        const ratingsRes = await fetchWithAuth(API_ENDPOINTS.RATINGS.BASE);
        const ratingsData = await ratingsRes.json();
        const existingRatings: Rating[] = ratingsRes.ok && ratingsData.success 
          ? (ratingsData.data.ratings || ratingsData.data || [])
          : [];
        
        const ratedTransactionIds = new Set(existingRatings.map(r => r.transaction_id));
        
        // Chỉ hiển thị transactions chưa được đánh giá
        const unratedTransactions = completedTransactions.filter(
          (t: Transaction) => !ratedTransactionIds.has(t.transaction_id)
        );

        setTransactions(unratedTransactions);
        
        // Load ratings đã tạo để hiển thị
        setRatings(existingRatings);
      } catch (e) {
        // Nếu không load được ratings, vẫn hiển thị tất cả transactions
        setTransactions(completedTransactions);
      }
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Load ratings đã tạo
  const loadRatings = async () => {
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.RATINGS.BASE);
      const data = await res.json();
      if (res.ok && data.success) {
        setRatings(data.data.ratings || data.data || []);
      }
    } catch (e) {
      console.error('Error loading ratings:', e);
    }
  };

  useEffect(() => {
    loadRatableTransactions();
    loadRatings();
  }, []);

  const handleSubmitRating = async () => {
    if (!selectedTransaction || rating === 0) {
      setError('Vui lòng chọn sao đánh giá (1-5 sao)');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.RATINGS.BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: selectedTransaction.station_id,
          transaction_id: selectedTransaction.transaction_id,
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gửi đánh giá thất bại');
      }

      // Reset form
      setSelectedTransaction(null);
      setRating(0);
      setComment('');
      
      // Reload data
      await loadRatableTransactions();
      await loadRatings();
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Đánh giá dịch vụ</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Chia sẻ trải nghiệm của bạn về các trạm đổi pin
          </p>
        </div>
      </div>

      {error && <ErrorDisplay message={error} variant="card" />}

      {/* Form đánh giá */}
      {selectedTransaction && (
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle>Đánh giá trạm</CardTitle>
            <CardDescription>
              {selectedTransaction.station?.name || 'Trạm đổi pin'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Mức độ hài lòng *</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    {rating} / 5 sao
                  </span>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="comment">Nhận xét (tùy chọn)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                className="mt-2"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmitRating}
                disabled={rating === 0 || submitting}
                className="gradient-primary text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi đánh giá'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTransaction(null);
                  setRating(0);
                  setComment('');
                }}
                disabled={submitting}
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danh sách giao dịch chưa đánh giá */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Giao dịch chưa đánh giá</CardTitle>
          <CardDescription>
            Chọn một giao dịch để đánh giá trạm
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Bạn đã đánh giá tất cả giao dịch</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {transaction.station?.name || 'Trạm đổi pin'}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p>Mã giao dịch: {transaction.transaction_code}</p>
                        {transaction.swap_at && (
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(transaction.swap_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTransaction(transaction);
                      }}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Đánh giá
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danh sách đánh giá đã tạo */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Đánh giá của tôi</CardTitle>
          <CardDescription>
            Xem lại các đánh giá bạn đã gửi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ratings.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Bạn chưa có đánh giá nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.map((ratingItem) => (
                <div
                  key={ratingItem.rating_id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-4 w-4 text-slate-500" />
                        <span className="font-medium text-slate-900 dark:text-white">
                          {ratingItem.station?.name || 'Trạm đổi pin'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= ratingItem.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(ratingItem.created_at)}
                        </span>
                      </div>
                      {ratingItem.comment && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                          {ratingItem.comment}
                        </p>
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

