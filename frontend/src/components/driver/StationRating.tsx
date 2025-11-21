import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { 
  Star, 
  MapPin, 
  Calendar,
  Loader2,
  RefreshCw,
  Users,
  User,
  Filter
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
  user?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

type FilterMode = 'all' | 'mine';
type RatingFilter = 'all' | 'positive' | 'negative' | 'neutral';

const StationRating: React.FC = () => {
  const [allRatings, setAllRatings] = useState<Rating[]>([]); // Tất cả ratings đã load
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Filter states
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');

  // Lấy user_id từ localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('ev_swap_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUserId(user.id || user.user_id || null);
    }
  }, []);

  // Load ratings - có thể lấy tất cả hoặc chỉ của user hiện tại
  const loadRatings = async (mode: FilterMode, stationId?: string) => {
    setLoading(true);
    setError('');
    try {
      let url = API_ENDPOINTS.RATINGS.BASE;
      const params = new URLSearchParams();
      
      // Nếu chọn "Đánh giá của tôi", filter theo user_id
      if (mode === 'mine') {
        if (!currentUserId) {
          throw new Error('Chưa đăng nhập');
        }
        params.append('user_id', currentUserId);
      }
      
      // Filter theo station nếu có
      if (stationId && stationId !== 'all') {
        params.append('station_id', stationId);
      }
      
      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }
      
      const res = await fetchWithAuth(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setAllRatings(data.data.ratings || data.data || []);
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

  // Load ratings khi filterMode hoặc stationFilter thay đổi
  useEffect(() => {
    if (filterMode === 'mine' && !currentUserId) {
      // Chờ lấy user_id trước
      return;
    }
    loadRatings(filterMode, stationFilter !== 'all' ? stationFilter : undefined);
  }, [filterMode, currentUserId, stationFilter]);

  // Extract unique stations từ ratings
  const availableStations = useMemo(() => {
    const stationsMap = new Map<string, { station_id: string; name: string; address?: string }>();
    allRatings.forEach((rating) => {
      if (rating.station && rating.station_id) {
        stationsMap.set(rating.station_id, {
          station_id: rating.station_id,
          name: rating.station.name || 'Trạm đổi pin',
          address: rating.station.address,
        });
      }
    });
    return Array.from(stationsMap.values());
  }, [allRatings]);

  // Filter ratings theo rating filter và station filter
  const filteredRatings = useMemo(() => {
    let filtered = [...allRatings];

    // Filter theo rating (tích cực/tiêu cực)
    if (ratingFilter === 'positive') {
      filtered = filtered.filter((r) => r.rating >= 4);
    } else if (ratingFilter === 'negative') {
      filtered = filtered.filter((r) => r.rating <= 2);
    } else if (ratingFilter === 'neutral') {
      filtered = filtered.filter((r) => r.rating === 3);
    }

    // Filter theo station đã được xử lý ở loadRatings (gọi API với station_id)
    // Nhưng nếu đang filter ở frontend, có thể filter thêm ở đây
    // (Hiện tại station filter được xử lý ở API level)

    return filtered;
  }, [allRatings, ratingFilter]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const handleRefresh = () => {
    loadRatings(filterMode, stationFilter !== 'all' ? stationFilter : undefined);
  };

  const handleRatingFilterChange = (value: string) => {
    setRatingFilter(value as RatingFilter);
  };

  const handleStationFilterChange = (value: string) => {
    setStationFilter(value);
    // Khi đổi station filter, cần reload ratings với station_id mới
    // useEffect sẽ tự động trigger loadRatings
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
            Xem đánh giá của các driver về các trạm đổi pin
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="shadow-sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {error && <ErrorDisplay error={error} variant="card" />}

      {/* Tabs để chuyển đổi giữa "Tất cả" và "Của tôi" */}
      <Tabs value={filterMode} onValueChange={(value) => setFilterMode(value as FilterMode)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tất cả đánh giá
          </TabsTrigger>
          <TabsTrigger value="mine" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Đánh giá của tôi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <Card className="glass-card border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Tất cả đánh giá
                  </CardTitle>
                  <CardDescription>
                    {filteredRatings.length > 0
                      ? `Hiển thị ${filteredRatings.length} / ${allRatings.length} đánh giá`
                      : allRatings.length > 0
                      ? `Không có đánh giá nào phù hợp với bộ lọc`
                      : 'Chưa có đánh giá nào'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Section */}
              <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bộ lọc</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating-filter" className="text-sm text-slate-600 dark:text-slate-400">
                      Mức độ đánh giá
                    </Label>
                    <Select value={ratingFilter} onValueChange={handleRatingFilterChange}>
                      <SelectTrigger id="rating-filter" className="w-full">
                        <SelectValue placeholder="Chọn mức độ đánh giá" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="positive">Tích cực (4-5 sao)</SelectItem>
                        <SelectItem value="neutral">Trung bình (3 sao)</SelectItem>
                        <SelectItem value="negative">Tiêu cực (1-2 sao)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="station-filter" className="text-sm text-slate-600 dark:text-slate-400">
                      Trạm đổi pin
                    </Label>
                    <Select value={stationFilter} onValueChange={handleStationFilterChange}>
                      <SelectTrigger id="station-filter" className="w-full">
                        <SelectValue placeholder="Chọn trạm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạm</SelectItem>
                        {availableStations.map((station) => (
                          <SelectItem key={station.station_id} value={station.station_id}>
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredRatings.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Star className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    {allRatings.length > 0 
                      ? 'Không có đánh giá nào phù hợp với bộ lọc'
                      : 'Chưa có đánh giá nào'}
                  </p>
                  <p className="text-sm">
                    {allRatings.length > 0
                      ? 'Thử thay đổi bộ lọc để xem thêm đánh giá'
                      : 'Các driver sẽ đánh giá sau khi hoàn tất đổi pin'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRatings.map((ratingItem) => (
                    <div
                      key={ratingItem.rating_id}
                      className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              <span className="font-semibold text-lg text-slate-900 dark:text-white">
                                {ratingItem.station?.name || 'Trạm đổi pin'}
                              </span>
                            </div>
                            {ratingItem.user && (
                              <span className="text-sm text-slate-500 dark:text-slate-400">
                                {ratingItem.user.full_name || ratingItem.user.email}
                              </span>
                            )}
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
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          <Card className="glass-card border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Đánh giá của tôi
                  </CardTitle>
                  <CardDescription>
                    {filteredRatings.length > 0
                      ? `Bạn đã có ${filteredRatings.length} đánh giá`
                      : allRatings.length > 0
                      ? `Không có đánh giá nào phù hợp với bộ lọc`
                      : 'Bạn chưa có đánh giá nào'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter Section cho tab "Đánh giá của tôi" */}
              {allRatings.length > 0 && (
                <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-4 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bộ lọc</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rating-filter-mine" className="text-sm text-slate-600 dark:text-slate-400">
                        Mức độ đánh giá
                      </Label>
                      <Select value={ratingFilter} onValueChange={handleRatingFilterChange}>
                        <SelectTrigger id="rating-filter-mine" className="w-full">
                          <SelectValue placeholder="Chọn mức độ đánh giá" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="positive">Tích cực (4-5 sao)</SelectItem>
                          <SelectItem value="neutral">Trung bình (3 sao)</SelectItem>
                          <SelectItem value="negative">Tiêu cực (1-2 sao)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="station-filter-mine" className="text-sm text-slate-600 dark:text-slate-400">
                        Trạm đổi pin
                      </Label>
                      <Select value={stationFilter} onValueChange={handleStationFilterChange}>
                        <SelectTrigger id="station-filter-mine" className="w-full">
                          <SelectValue placeholder="Chọn trạm" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả trạm</SelectItem>
                          {availableStations.map((station) => (
                            <SelectItem key={station.station_id} value={station.station_id}>
                              {station.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    </div>
                  </div>
                </div>
              )}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredRatings.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Star className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    {allRatings.length > 0
                      ? 'Không có đánh giá nào phù hợp với bộ lọc'
                      : 'Bạn chưa có đánh giá nào'}
                  </p>
                  <p className="text-sm">
                    {allRatings.length > 0 ? (
                      'Thử thay đổi bộ lọc để xem thêm đánh giá'
                    ) : (
                      <>
                        Đánh giá dịch vụ tại trang{' '}
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          Lịch sử Giao dịch
                        </span>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRatings.map((ratingItem) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StationRating;

