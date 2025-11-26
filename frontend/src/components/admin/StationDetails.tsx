import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import {
  Activity,
  Battery,
  Clock,
  DollarSign,
  MapPin,
  Users,
  Star,
  Loader2,
} from "lucide-react";
import type { Station } from "../../services/station.service";
import { getStationById } from "../../services/station.service";
import {
  getStationRatings,
  getStationRatingSummary,
  type StationRating,
  type StationRatingSummary,
} from "../../services/rating.service";

interface StationDetailsProps {
  stationId: string;
  onClose: () => void;
}

const StationDetails: React.FC<StationDetailsProps> = ({
  stationId,
  onClose,
}) => {
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<StationRating[]>([]);
  const [ratingSummary, setRatingSummary] =
    useState<StationRatingSummary | null>(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ratingsTotalPages, setRatingsTotalPages] = useState(1);
  const [showRatingsDetail, setShowRatingsDetail] = useState(false);

  useEffect(() => {
    const fetchStationDetails = async () => {
      try {
        const res = await getStationById(stationId);
        if (res.success) {
          // Transform data: backend returns 'staff' array, frontend expects 'manager' object
          const stationData = res.data;
          const manager =
            stationData.staff && stationData.staff.length > 0
              ? stationData.staff[0]
              : null;

          const transformedStation = {
            ...stationData,
            manager: manager
              ? {
                  user_id: manager.user_id,
                  full_name: manager.full_name,
                  email: manager.email,
                  phone: manager.phone,
                }
              : null,
            // Map battery stats if available
            available_batteries: stationData.battery_stats?.full || 0,
            charging_batteries: stationData.battery_stats?.charging || 0,
            maintenance_batteries: stationData.battery_stats?.maintenance || 0,
          };

          console.log("Station details transformed:", transformedStation);
          setStation(transformedStation);
        }
      } catch (error) {
        console.error("Error fetching station details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStationDetails();
  }, [stationId]);

  // Fetch rating summary (always)
  useEffect(() => {
    const fetchRatingSummary = async () => {
      if (!stationId) return;

      try {
        const summaryRes = await getStationRatingSummary(stationId);
        if (summaryRes.success) {
          setRatingSummary(summaryRes.data);
        }
      } catch (error) {
        console.error("Error fetching rating summary:", error);
      }
    };

    fetchRatingSummary();
  }, [stationId]);

  // Fetch detailed ratings (only when detail view is open)
  useEffect(() => {
    const fetchRatings = async () => {
      if (!stationId || !showRatingsDetail) return;

      setRatingsLoading(true);
      try {
        const ratingsRes = await getStationRatings(stationId, ratingsPage, 5);
        if (ratingsRes.success) {
          setRatings(ratingsRes.data.ratings);
          setRatingsTotalPages(ratingsRes.data.pagination.pages);
        }
      } catch (error) {
        console.error("Error fetching ratings:", error);
      } finally {
        setRatingsLoading(false);
      }
    };

    fetchRatings();
  }, [stationId, ratingsPage, showRatingsDetail]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="p-8 text-center">
        <p>Không tìm thấy thông tin trạm</p>
        <Button onClick={onClose} className="mt-4">
          Quay lại
        </Button>
      </div>
    );
  }

  const utilization = station.capacity
    ? Math.round(
        ((station.capacity - (station.available_batteries || 0)) /
          station.capacity) *
          100
      )
    : 0;

  const getUtilizationColor = (value: number) => {
    if (value >= 80) return "text-red-600";
    if (value >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <DialogHeader className="border-b pb-4 px-6 pt-6 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Chi tiết Trạm
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-1 text-sm">
              Thông tin chi tiết về trạm thay pin
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
        <div className="w-full space-y-4">
          {/* Station Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {station.name}
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{station.address}</span>
              </div>
              {station.operating_hours && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Giờ hoạt động: {station.operating_hours}</span>
                </div>
              )}

              {/* Customer Ratings - Nằm ngay sau Giờ hoạt động */}
              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-yellow-500 fill-current" />
                    <span className="font-semibold text-gray-900">
                      Đánh giá của Khách hàng
                    </span>
                  </div>
                  {ratingSummary && ratingSummary.total_ratings > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRatingsDetail(!showRatingsDetail)}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700"
                    >
                      {showRatingsDetail ? "Ẩn chi tiết" : "Xem chi tiết"}
                    </Button>
                  )}
                </div>

                {/* Rating Summary - Always visible */}
                {ratingSummary && ratingSummary.total_ratings > 0 ? (
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {ratingSummary.average_rating.toFixed(1)}
                      </div>
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3 w-3 ${
                              star <= Math.round(ratingSummary.average_rating)
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {ratingSummary.total_ratings} đánh giá
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-gray-500">
                    <Star className="h-6 w-6 mx-auto mb-1 opacity-30" />
                    <p className="text-xs">Chưa có đánh giá nào</p>
                  </div>
                )}

                {/* Rating Details - Only visible when expanded */}
                {showRatingsDetail &&
                  ratingSummary &&
                  ratingSummary.total_ratings > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      {ratingsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <>
                          {/* Rating Distribution */}
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2">
                              Phân bố đánh giá
                            </h4>
                            {[5, 4, 3, 2, 1].map((star) => {
                              const count =
                                ratingSummary.rating_distribution[star] || 0;
                              const percentage =
                                ratingSummary.total_ratings > 0
                                  ? (count / ratingSummary.total_ratings) * 100
                                  : 0;
                              return (
                                <div
                                  key={star}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span className="w-6 text-gray-600">
                                    {star}⭐
                                  </span>
                                  <Progress
                                    value={percentage}
                                    className="flex-1 h-1.5"
                                  />
                                  <span className="w-8 text-right text-gray-600 text-xs">
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Recent Ratings List */}
                          {ratings.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                                Đánh giá gần đây
                              </h4>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {ratings.map((rating) => (
                                  <div
                                    key={rating.rating_id}
                                    className="p-2 bg-white rounded border border-gray-200"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <Star
                                                key={star}
                                                className={`h-2.5 w-2.5 ${
                                                  star <= rating.rating
                                                    ? "text-yellow-500 fill-current"
                                                    : "text-gray-300"
                                                }`}
                                              />
                                            ))}
                                          </div>
                                          <span className="text-xs font-medium text-gray-900">
                                            {rating.user?.full_name ||
                                              "Khách hàng"}
                                          </span>
                                        </div>
                                        {rating.comment && (
                                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {rating.comment}
                                          </p>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {new Date(
                                          rating.created_at
                                        ).toLocaleDateString("vi-VN")}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {ratingsTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setRatingsPage((p) => Math.max(1, p - 1))
                                }
                                disabled={ratingsPage === 1}
                                className="h-7 text-xs"
                              >
                                Trước
                              </Button>
                              <span className="text-xs text-gray-600">
                                {ratingsPage}/{ratingsTotalPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setRatingsPage((p) =>
                                    Math.min(ratingsTotalPages, p + 1)
                                  )
                                }
                                disabled={ratingsPage === ratingsTotalPages}
                                className="h-7 text-xs"
                              >
                                Sau
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
              </div>

              <div className="flex items-center">
                <Battery className="h-4 w-4 mr-2" />
                <span>Sức chứa: {station.capacity || 0} pin</span>
              </div>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-4">
            {/* Battery Status */}
            <Card className="border">
              <CardContent className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <Battery className="h-4 w-4 mr-2" />
                  Trạng thái Pin
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {station.available_batteries || 0}
                    </div>
                    <div className="text-sm text-gray-600">Khả dụng</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {station.charging_batteries || 0}
                    </div>
                    <div className="text-sm text-gray-600">Đang sạc</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {station.maintenance_batteries || 0}
                    </div>
                    <div className="text-sm text-gray-600">Bảo trì</div>
                  </div>
                </div>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tổng sức chứa:</span>
                    <span className="font-semibold">
                      {station.capacity || 0} pin
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tỷ lệ sử dụng:</span>
                    <span
                      className={`font-semibold ${getUtilizationColor(
                        utilization
                      )}`}
                    >
                      {utilization}%
                    </span>
                  </div>
                  <Progress value={utilization} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border">
              <CardContent className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Hiệu suất Hôm nay
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {station.daily_swaps || 0}
                    </div>
                    <div className="text-sm text-gray-600">Lần thay pin</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(station.daily_revenue || 0).toLocaleString("vi-VN")}đ
                    </div>
                    <div className="text-sm text-gray-600">Doanh thu</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {(station.uptime || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Thời gian hoạt động
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {station.capacity || 0}
                    </div>
                    <div className="text-sm text-gray-600">Sức chứa tối đa</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Station Manager */}
            <Card className="border">
              <CardContent className="p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Quản lý Trạm
                </h3>
                {station.manager ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600">Tên quản lý:</div>
                      <div className="font-semibold text-gray-900">
                        {station.manager.full_name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Email:</div>
                      <div className="font-semibold text-gray-900 break-all">
                        {station.manager.email || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">
                        Số điện thoại:
                      </div>
                      <div className="font-semibold text-gray-900">
                        {station.manager.phone}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa có quản lý được gán</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0">
        <Button
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
        >
          Đóng
        </Button>
      </div>
    </div>
  );
};

export default StationDetails;
