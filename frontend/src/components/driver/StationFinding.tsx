import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  MapPin,
  Search,
  Navigation,
  Battery,
  Star,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useDriverStations } from "../../hooks/useDriverStations";
import { Alert, AlertDescription } from "../ui/alert";

const StationFinding: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const hasSearchedRef = useRef(false); // Tránh gọi API nhiều lần
  const locationSetRef = useRef(false); // Tránh set location nhiều lần

  const {
    stations,
    loading,
    error,
    findNearbyPublicStations,
    searchStations,
    clearError,
  } = useDriverStations();

  // Lấy vị trí người dùng khi component mount
  useEffect(() => {
    if (locationSetRef.current) return; // Đã set rồi thì không set lại

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (locationSetRef.current) return; // Double check
          locationSetRef.current = true;
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          if (locationSetRef.current) return; // Double check
          locationSetRef.current = true;

          // Sử dụng vị trí mặc định (TP.HCM) nếu không lấy được vị trí
          setUserLocation({
            latitude: 10.762622,
            longitude: 106.660172,
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      if (locationSetRef.current) return;
      locationSetRef.current = true;
      // Sử dụng vị trí mặc định nếu trình duyệt không hỗ trợ geolocation
      setUserLocation({
        latitude: 10.762622,
        longitude: 106.660172,
      });
    }
  }, []);

  // Tìm trạm gần đây
  const handleFindNearby = React.useCallback(async () => {
    if (!userLocation) {
      console.warn("[StationFinding] No user location available");
      return;
    }

    try {
      console.log("[StationFinding] Finding nearby stations:", userLocation);
      await findNearbyPublicStations({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: 10,
      });
      console.log("[StationFinding] Successfully found stations");
    } catch (err) {
      console.error("[StationFinding] Error finding nearby stations:", err);
      // Error đã được set trong hook, không cần set lại
    }
  }, [userLocation, findNearbyPublicStations]);

  // Load tất cả trạm khi component mount (mặc định)
  useEffect(() => {
    if (!hasSearchedRef.current) {
      hasSearchedRef.current = true;
      // Load tất cả trạm mặc định (không cần location)
      searchStations("").catch((err) => {
        console.error("[StationFinding] Error loading all stations:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tìm kiếm trạm
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Nếu search rỗng, load tất cả trạm
      try {
        console.log("[StationFinding] Loading all stations");
        await searchStations("");
        console.log("[StationFinding] All stations loaded");
      } catch (err) {
        console.error("[StationFinding] Error loading all stations:", err);
      }
      return;
    }

    try {
      console.log("[StationFinding] Searching stations:", searchQuery);
      await searchStations(searchQuery);
      console.log("[StationFinding] Search completed");
    } catch (err) {
      console.error("[StationFinding] Error searching stations:", err);
      // Error đã được set trong hook
    }
  };

  // Xử lý khi nhấn Enter trong search box
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const getAvailabilityColor = (available: number = 0, total: number = 1) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return "text-green-600";
    if (percentage >= 30) return "text-yellow-600";
    return "text-red-600";
  };

  const getBatteryTypes = (supportedModels: string[] | any): string[] => {
    if (Array.isArray(supportedModels)) {
      return supportedModels;
    }
    return [];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
            Tìm trạm thay pin
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Tìm trạm gần nhất và đặt chỗ thay pin nhanh chóng
          </p>
        </div>
      </div>

      {/* Bỏ Quick Stats - không cần thiết cho trang tìm trạm */}

      {/* Error Alert */}
      {error && (
        <Alert
          variant="destructive"
          className="glass-card border-red-200 dark:border-red-800"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              Đóng
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <Card className="glass-card border-0 glow">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Tìm trạm theo tên hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 glass border-slate-200/50 dark:border-slate-700/50 focus:border-blue-400 dark:focus:border-purple-400"
                disabled={loading}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Tìm kiếm
            </Button>
            <Button
              onClick={handleFindNearby}
              disabled={loading || !userLocation}
              className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Tìm gần tôi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stations List */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent mb-4">
          {searchQuery ? "Kết quả tìm kiếm" : "Tất cả trạm"}
        </h2>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-slate-600 dark:text-slate-400">
              Đang tải...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!loading && stations.length === 0 && (
          <Card className="glass-card border-0">
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Không tìm thấy trạm nào
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Thử tìm kiếm với địa chỉ khác hoặc mở rộng bán kính tìm kiếm
              </p>
              <Button
                onClick={handleFindNearby}
                className="gradient-primary text-white"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Tìm trạm gần tôi
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stations Grid */}
        {!loading && stations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {stations.map((station) => (
              <Card
                key={station.station_id}
                className="overflow-hidden glass-card border-0 glow-hover group transform hover:scale-105 transition-all duration-300"
              >
                <div className="relative h-48">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1672542128826-5f0d578713d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb258ZW58MXx8fHwxNzU5NzEzOTIxfDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt={station.name}
                    className="w-full h-full object-cover rounded-t-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge className="glass border-0 text-white shadow-lg">
                      <Battery className="mr-1 h-3 w-3" />
                      {station.available_batteries || 0}/{station.capacity}
                    </Badge>
                  </div>
                  {station.status !== "active" && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="destructive" className="glass border-0">
                        {station.status === "maintenance"
                          ? "Bảo trì"
                          : "Đóng cửa"}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                        {station.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {station.address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {station.average_rating?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          ({station.total_ratings || 0})
                        </span>
                      </div>
                      {station.distance_km !== undefined && (
                        <Badge
                          variant="outline"
                          className="text-xs glass border-blue-200/50 dark:border-purple-400/30"
                        >
                          {station.distance_km.toFixed(1)} km
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">
                          Tình trạng
                        </span>
                        <span
                          className={`font-medium ${getAvailabilityColor(
                            station.available_batteries,
                            station.capacity
                          )}`}
                        >
                          {Math.round(
                            ((station.available_batteries || 0) /
                              station.capacity) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          ((station.available_batteries || 0) /
                            station.capacity) *
                          100
                        }
                        className="h-2"
                      />
                    </div>

                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Giờ hoạt động
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {station.operating_hours || "24/7"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-600 dark:text-slate-400">
                          Sức chứa
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {station.capacity} pin
                        </p>
                      </div>
                    </div>

                    {getBatteryTypes(station.supported_models).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {getBatteryTypes(station.supported_models)
                          .slice(0, 3)
                          .map((type, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs glass border-0"
                            >
                              {type}
                            </Badge>
                          ))}
                        {getBatteryTypes(station.supported_models).length >
                          3 && (
                          <Popover
                            open={openPopoverId === station.station_id}
                            onOpenChange={(open) =>
                              setOpenPopoverId(open ? station.station_id : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-0 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenPopoverId(
                                    openPopoverId === station.station_id
                                      ? null
                                      : station.station_id
                                  );
                                }}
                              >
                                +
                                {getBatteryTypes(station.supported_models)
                                  .length - 3}
                                <ChevronDown className="ml-1 h-3 w-3 inline" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-64 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                                  Tất cả loại pin (
                                  {
                                    getBatteryTypes(station.supported_models)
                                      .length
                                  }
                                  )
                                </h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {getBatteryTypes(
                                    station.supported_models
                                  ).map((type, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                    >
                                      {type}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Button
                        className="flex-1 gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        size="sm"
                        onClick={() => {
                          if (station.latitude && station.longitude) {
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`,
                              "_blank"
                            );
                          }
                        }}
                      >
                        <Navigation className="mr-1 h-3 w-3" />
                        Dẫn đường
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 glass border-blue-200/50 dark:border-purple-400/30 hover:bg-blue-50/50 dark:hover:bg-purple-500/10"
                        size="sm"
                        onClick={() => {
                          navigate(`/driver/booking/${station.station_id}`);
                        }}
                      >
                        <Calendar className="mr-1 h-3 w-3" />
                        Đặt chỗ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StationFinding;
