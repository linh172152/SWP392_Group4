import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Star, Loader2 } from 'lucide-react';
import { createRating } from '../../services/rating.service';

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stationId: string;
  stationName: string;
  transactionId: string;
  transactionCode: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  open,
  onClose,
  onSuccess,
  stationId,
  stationName,
  transactionId,
  transactionCode,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }

    // ✅ Prevent multiple submissions
    if (loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createRating({
        station_id: stationId,
        transaction_id: transactionId,
        rating,
        comment: comment.trim() || undefined,
      });

      // Reset form
      setRating(0);
      setComment('');
      setHoveredRating(0);
      
      // ✅ Close modal and reload data immediately
      onSuccess();
      onClose();
    } catch (err: any) {
      // ✅ Handle "already rated" error specifically
      const errorMessage = err.message || 'Có lỗi xảy ra khi gửi đánh giá';
      if (errorMessage.includes('đã được đánh giá') || errorMessage.includes('already rated')) {
        setError('Giao dịch này đã được đánh giá. Mỗi giao dịch chỉ có thể đánh giá một lần.');
        // Reload data to update UI
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRating(0);
      setComment('');
      setHoveredRating(0);
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-card border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
            Đánh giá dịch vụ
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Giao dịch: {transactionCode}
            <br />
            Trạm: {stationName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Star Rating */}
          <div>
            <Label className="text-slate-700 dark:text-slate-300 mb-3 block">
              Đánh giá <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={loading}
                  className="focus:outline-none transition-transform hover:scale-110 disabled:opacity-50"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                  {rating === 1 && 'Rất tệ'}
                  {rating === 2 && 'Tệ'}
                  {rating === 3 && 'Bình thường'}
                  {rating === 4 && 'Tốt'}
                  {rating === 5 && 'Rất tốt'}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment" className="text-slate-700 dark:text-slate-300 mb-2 block">
              Nhận xét (tùy chọn)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
              className="min-h-[100px] bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50"
              disabled={loading}
              maxLength={500}
            />
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
              {comment.length}/500
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Gửi đánh giá
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;

