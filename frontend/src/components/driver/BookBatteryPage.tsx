import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar, Clock, Package } from "lucide-react";
import API_ENDPOINTS, { fetchWithAuth } from "../../config/api";
import { getBatteryPricing } from "../../services/battery-pricing.service";
import type { BatteryPricing } from "../../services/battery-pricing.service";
import { matchBatteryModel } from "../../utils/batteryModelUtils";
import { getWalletBalance } from "../../services/wallet.service";
import { BatteryLoading } from "../ui/battery-loading";
import { ErrorDisplay } from "../ui/error-display";
import { Skeleton } from "../ui/skeleton";

interface BatteryItem {
  battery_id: string;
  battery_code: string;
  model: string;
  capacity_kwh: number;
  current_charge: number;
  status: string;
}
interface VehicleItem {
  vehicle_id: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate: string;
  battery_model: string;
}
interface StationDetailData {
  station_id: string;
  name: string;
  address: string;
  average_rating?: number;
  total_ratings?: number;
}

const BookBatteryPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState<StationDetailData | null>(null);
  const [batteries, setBatteries] = useState<BatteryItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(
    null
  );
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [error, setError] = useState("");
  const [bookingMsg, setBookingMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [pricingList, setPricingList] = useState<BatteryPricing[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any | null>(
    null
  );
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [useSubscription, setUseSubscription] = useState<boolean>(true); // Driver có thể chọn có dùng subscription hay không
  const lastBatteryCountRef = useRef<Map<string, number>>(new Map()); // Lưu số pin lần trước để so sánh (dùng ref để tránh re-render)

  // Load pricing
  const loadPricing = async () => {
    try {
      // Tăng limit lên 100 để lấy hết pricing (hoặc có thể không giới hạn)
      const res = await getBatteryPricing({ is_active: true, limit: 100 });
      if (res.success && res.data.pricings) {
        setPricingList(res.data.pricings);
        console.log("✅ Loaded pricing:", res.data.pricings.length, "items");
        console.log(
          "📋 Pricing models:",
          res.data.pricings.map((p) => `${p.battery_model}: ${p.price}₫`)
        );
      }
    } catch (e) {
      console.error("Failed to load pricing:", e);
      // Không block UI nếu pricing fail
    }
  };

  // Load wallet balance để cảnh báo nếu không đủ tiền
  const loadWalletBalance = async () => {
    try {
      const res = await getWalletBalance();
      if (res.success && res.data) {
        setWalletBalance(Number(res.data.balance));
      }
    } catch (e) {
      // Không block UI nếu wallet fail
      console.error("Failed to load wallet balance:", e);
    }
  };

  // Load subscription để hiển thị preview giá cuối cùng
  const loadSubscription = async () => {
    try {
      const url = new URL(API_ENDPOINTS.SUBSCRIPTIONS.BASE);
      url.searchParams.set("status", "active");
      const subRes = await fetchWithAuth(url.toString());

      if (!subRes.ok) {
        console.log("📦 [SUBSCRIPTION] API response not OK:", subRes.status);
        setCurrentSubscription(null);
        return;
      }

      const subData = await subRes.json();
      console.log("📦 [SUBSCRIPTION] API response:", subData);

      if (subData.success && subData.data) {
        const subscriptions = Array.isArray(subData.data)
          ? subData.data
          : subData.data.subscriptions || [];
        console.log("📦 [SUBSCRIPTION] All subscriptions:", subscriptions);

        const activeSub = subscriptions.find((sub: any) => {
          if (!sub || !sub.end_date) return false;
          const now = new Date();
          const endDate = new Date(sub.end_date);
          const isValid =
            sub.status === "active" &&
            endDate >= now &&
            (sub.remaining_swaps === null || (sub.remaining_swaps ?? 0) > 0);
          console.log("📦 [SUBSCRIPTION] Checking subscription:", {
            id: sub.subscription_id,
            status: sub.status,
            endDate: sub.end_date,
            remaining_swaps: sub.remaining_swaps,
            isValid,
          });
          return isValid;
        });

        if (activeSub) {
          console.log(
            "📦 [SUBSCRIPTION] Active subscription found:",
            activeSub
          );
          setCurrentSubscription(activeSub);
        } else {
          console.log("📦 [SUBSCRIPTION] No active subscription found");
          setCurrentSubscription(null);
        }
      } else {
        console.log("📦 [SUBSCRIPTION] No subscription data in response");
        setCurrentSubscription(null);
      }
    } catch (e) {
      console.error("📦 [SUBSCRIPTION] Error loading subscription:", e);
      setCurrentSubscription(null);
    }
  };

  // Kiểm tra subscription có tương thích với battery model không
  const doesSubscriptionCoverModel = (
    subscription: any,
    batteryModel: string
  ): boolean => {
    if (!subscription || !subscription.package) return false;
    const pkg = subscription.package;

    // Nếu package có battery_models array, check xem model có trong đó không
    if (
      pkg.battery_models &&
      Array.isArray(pkg.battery_models) &&
      pkg.battery_models.length > 0
    ) {
      return pkg.battery_models.some((model: string) =>
        matchBatteryModel(model, batteryModel)
      );
    }

    // Nếu package có battery_capacity_kwh, check capacity
    if (pkg.battery_capacity_kwh) {
      const battery = batteries.find((b) =>
        matchBatteryModel(b.model, batteryModel)
      );
      if (battery && battery.capacity_kwh) {
        return Number(battery.capacity_kwh) <= Number(pkg.battery_capacity_kwh);
      }
    }

    // Fallback: nếu không có giới hạn rõ ràng, assume coverage
    return true;
  };

  // Fetch tất cả dữ liệu gốc - Tối ưu: Load song song để nhanh hơn
  useEffect(() => {
    console.log("🚀 [USEFFECT] useEffect triggered, id:", id);
    const fetchAll = async () => {
      console.log("🚀 [USEFFECT] fetchAll started");
      setLoading(true);
      setError("");
      try {
        console.log("🚀 [USEFFECT] Starting to load pricing...");
        // Load pricing song song với các API khác
        loadPricing();
        console.log("🚀 [USEFFECT] Pricing load initiated (async)");

        console.log(
          "🚀 [USEFFECT] Starting Promise.all for station, batteries, vehicles..."
        );
        // Tối ưu: Load song song các API không phụ thuộc lẫn nhau
        const [stationRes, batteriesRes, vehiclesRes] = await Promise.all([
          fetchWithAuth(`${API_ENDPOINTS.DRIVER.STATIONS}/${id}`),
          fetchWithAuth(`${API_ENDPOINTS.DRIVER.STATIONS}/${id}/batteries`),
          fetchWithAuth(API_ENDPOINTS.DRIVER.VEHICLES),
        ]);
        console.log("🚀 [USEFFECT] Promise.all completed, parsing JSON...");

        const [stj, brj, vrj] = await Promise.all([
          stationRes.json(),
          batteriesRes.json(),
          vehiclesRes.json(),
        ]);
        console.log("🚀 [USEFFECT] JSON parsing completed");

        if (!stationRes.ok || !stj.success)
          throw new Error(stj.message || "Không lấy được thông tin trạm");
        if (!batteriesRes.ok || !brj.success)
          throw new Error(brj.message || "Không lấy được pin");
        if (!vehiclesRes.ok || !vrj.success)
          throw new Error(vrj.message || "Không lấy được xe của bạn");

        console.log("🚀 [USEFFECT] All API calls successful, setting state...");
        setStation(stj.data);
        setBatteries(brj.data || []); // ✅ Đảm bảo luôn là array
        setVehicles(vrj.data || []); // ✅ Đảm bảo luôn là array
        console.log("🚀 [USEFFECT] State set, all data loaded successfully");

        // Load subscription và wallet balance để hiển thị preview giá
        loadSubscription();
        loadWalletBalance();
      } catch (e: any) {
        console.error("❌ [USEFFECT] Error in fetchAll:", e);
        console.error("❌ [USEFFECT] Error details:", {
          message: e.message,
          stack: e.stack,
          name: e.name,
        });
        setError(e.message || "Có lỗi xảy ra");
      } finally {
        console.log(
          "🚀 [USEFFECT] fetchAll finally block, setting loading to false"
        );
        setLoading(false);
      }
    };
    console.log("🚀 [USEFFECT] Calling fetchAll...");
    fetchAll();
    console.log("🚀 [USEFFECT] fetchAll called (async)");

    // Tự động set thời gian mặc định: 1 giờ từ bây giờ
    const defaultTime = new Date(Date.now() + 60 * 60 * 1000);
    setScheduledAt(defaultTime.toISOString().slice(0, 16)); // Format: YYYY-MM-DDTHH:mm

    // Refresh danh sách pin định kỳ để cập nhật số lượng real-time (mỗi 10 giây)
    const refreshBatteries = async () => {
      if (!id) return;
      try {
        const batteriesRes = await fetchWithAuth(
          `${API_ENDPOINTS.DRIVER.STATIONS}/${id}/batteries`
        );
        if (batteriesRes.ok) {
          const batteriesData = await batteriesRes.json();
          if (batteriesData.success && batteriesData.data) {
            // So sánh số pin trước và sau để cảnh báo nếu thay đổi
            const newBatteries = batteriesData.data;
            const newAvailableOnly = newBatteries.filter(
              (b: BatteryItem) => b.status === "full"
            );
            const newBatteryModels = [
              ...new Set(newAvailableOnly.map((b: BatteryItem) => b.model)),
            ];

            const newCounts = new Map<string, number>();
            (newBatteryModels as string[]).forEach((model: string) => {
              const count = newAvailableOnly.filter(
                (b: BatteryItem) => b.model === model
              ).length;
              newCounts.set(model, count);
            });

            // Kiểm tra xem có thay đổi không
            let hasChanged = false;
            newCounts.forEach((newCount, model) => {
              const oldCount = lastBatteryCountRef.current.get(model);
              if (oldCount !== undefined && oldCount !== newCount) {
                hasChanged = true;
                console.log(
                  `⚠️ [BATTERY] Pin ${model} thay đổi: ${oldCount} → ${newCount}`
                );
              }
            });

            setBatteries(newBatteries);
            lastBatteryCountRef.current = newCounts; // Update ref thay vì state

            if (hasChanged && selectedModel) {
              // Cảnh báo nếu số pin thay đổi khi đang chọn pin
              const currentCount = newCounts.get(selectedModel);
              const oldCount = lastBatteryCountRef.current.get(selectedModel);
              if (
                oldCount !== undefined &&
                currentCount !== undefined &&
                currentCount < oldCount
              ) {
                console.warn(
                  `⚠️ [BATTERY] Số pin ${selectedModel} giảm từ ${oldCount} xuống ${currentCount}`
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("⚠️ [BATTERY] Failed to refresh battery list:", error);
        // Không block UI nếu refresh fail
      }
    };

    // Refresh ngay lần đầu sau 2 giây
    const initialRefresh = setTimeout(() => {
      refreshBatteries();
    }, 2000);

    // Refresh định kỳ mỗi 10 giây
    const refreshInterval = setInterval(refreshBatteries, 10000);

    return () => {
      clearTimeout(initialRefresh);
      clearInterval(refreshInterval);
    };
  }, [id]); // Chỉ phụ thuộc vào id, không phụ thuộc vào lastBatteryCount hoặc selectedModel để tránh re-render liên tục

  // Tính thời gian tối thiểu (30 phút từ bây giờ)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  };

  // Tính thời gian tối đa (12 giờ từ bây giờ)
  const getMaxDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 12);
    return now.toISOString().slice(0, 16);
  };

  // Tất cả model pin khả dụng của trạm (unique - lấy pin status full hoặc charging với charge >= 90%)
  const availableOnly = batteries.filter(
    (b) =>
      b.status === "full" ||
      (b.status === "charging" && (b.current_charge ?? 0) >= 90)
  );
  // Pin đang được reserve (để hiển thị thông tin)
  const reservedOnly = batteries.filter((b) => b.status === "reserved");
  const batteryModels = [...new Set(availableOnly.map((b) => b.model))];
  // Map: model pin => số pin khả dụng hiện có
  // FIX: Chỉ hiển thị những loại pin có ít nhất 1 xe tương thích (dùng matchBatteryModel để matching linh hoạt)
  const pinStats = batteryModels
    .map((model) => {
      const pins = availableOnly.filter((b) => b.model === model);
      const reservedPins = reservedOnly.filter((b) => b.model === model);
      // Dùng matchBatteryModel để matching linh hoạt (ví dụ: "VinFast VF8" ↔ "VinFast VF8 Battery")
      const compatibleVehiclesCount = vehicles.filter(
        (v) => v.battery_model && matchBatteryModel(model, v.battery_model)
      ).length;
      return {
        model,
        count: pins.length, // Số pin khả dụng (status = full)
        reservedCount: reservedPins.length, // Số pin đang được reserve
        example: pins[0],
        hasCompatibleVehicle: compatibleVehiclesCount > 0,
      };
    })
    .filter((p) => p.count > 0 && p.hasCompatibleVehicle); // Chỉ hiển thị pin có xe tương thích

  // Tìm pin được đề xuất (phù hợp với xe đầu tiên của driver) - dùng matchBatteryModel
  const recommendedPinModel =
    vehicles.length > 0 && vehicles[0]?.battery_model
      ? pinStats.find((p) =>
          matchBatteryModel(p.model, vehicles[0].battery_model!)
        )
      : null;

  // Tự động đề xuất pin và xe khi có dữ liệu (chỉ chạy lần đầu)
  useEffect(() => {
    if (
      vehicles.length > 0 &&
      batteries.length > 0 &&
      pinStats.length > 0 &&
      !selectedModel
    ) {
      // Tìm xe đầu tiên của driver
      const firstVehicle = vehicles[0];
      if (firstVehicle && firstVehicle.battery_model) {
        // Tìm loại pin phù hợp với xe đầu tiên - dùng matchBatteryModel
        const compatiblePinModel = pinStats.find((p) =>
          matchBatteryModel(p.model, firstVehicle.battery_model!)
        );
        if (compatiblePinModel) {
          // Tự động đề xuất loại pin phù hợp
          setSelectedModel(compatiblePinModel.model);
          // Tự động chọn xe đầu tiên phù hợp với pin này - dùng matchBatteryModel
          const compatibleVehicle = vehicles.find(
            (v) =>
              v.battery_model &&
              matchBatteryModel(compatiblePinModel.model, v.battery_model)
          );
          if (compatibleVehicle) {
            setSelectedVehicle(compatibleVehicle);
          }
        }
      }
    }
  }, [vehicles.length, batteries.length, pinStats.length]); // Chỉ chạy khi dữ liệu load xong lần đầu

  // Tự động set useSubscription mặc định khi có subscription áp dụng được
  useEffect(() => {
    if (selectedModel && currentSubscription) {
      const subscriptionCanApply =
        doesSubscriptionCoverModel(currentSubscription, selectedModel) &&
        (currentSubscription.remaining_swaps === null ||
          (currentSubscription.remaining_swaps ?? 0) > 0);
      // Mặc định bật subscription nếu áp dụng được, nhưng driver có thể tắt
      if (subscriptionCanApply) {
        // Chỉ auto-set khi chưa có lựa chọn (lần đầu chọn pin này)
        // Giữ nguyên lựa chọn của driver nếu đã chọn rồi
        setUseSubscription((prev) => {
          // Nếu subscription có thể áp dụng và chưa có lựa chọn trước đó, mặc định bật
          return prev === false && !selectedVehicle ? true : prev;
        });
      } else {
        // Nếu subscription không áp dụng được, tắt
        setUseSubscription(false);
      }
    } else if (!currentSubscription) {
      // Không có subscription thì tắt
      setUseSubscription(false);
    }
  }, [selectedModel, currentSubscription]);

  // Đặt chỗ khi đã chọn model và chọn xe phù hợp
  // NOTE về Subscription:
  // - Khi user có subscription active và useSubscription = true
  // - BE sẽ tự động check subscription khi staff completeBooking (trong completeBooking function)
  // - BE tự động set transaction_amount = 0 và payment_status = "completed" → Miễn phí
  // - Không cần gửi subscription_id trong request body booking
  const handleBooking = async () => {
    setBookingMsg("");
    setError("");
    if (!selectedModel || !selectedVehicle) {
      setError("Chọn loại pin và xe trước khi đặt!");
      return;
    }

    // FIX: Validation nghiêm ngặt - Kiểm tra xe có tương thích với loại pin đã chọn (dùng matchBatteryModel)
    if (
      !selectedVehicle.battery_model ||
      !matchBatteryModel(selectedModel, selectedVehicle.battery_model)
    ) {
      setError(
        "Xe đã chọn không tương thích với loại pin này. Vui lòng chọn lại!"
      );
      // Reset selection để tránh confusion
      setSelectedVehicle(null);
      return;
    }

    // Kiểm tra thời gian hẹn
    if (!scheduledAt) {
      setError("Vui lòng chọn thời gian hẹn!");
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      setError("Thời gian hẹn không hợp lệ!");
      return;
    }

    const now = new Date();
    const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 phút từ bây giờ
    const maxTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 giờ từ bây giờ

    if (scheduledDate < minTime) {
      setError("Thời gian hẹn phải ít nhất 30 phút từ bây giờ!");
      return;
    }
    if (scheduledDate > maxTime) {
      setError("Thời gian hẹn không được quá 12 giờ từ bây giờ!");
      return;
    }

    // Refresh lại danh sách pin TRƯỚC KHI đặt để đảm bảo số liệu chính xác
    let refreshedBatteries = batteries;
    try {
      const batteriesRes = await fetchWithAuth(
        `${API_ENDPOINTS.DRIVER.STATIONS}/${id}/batteries`
      );
      if (batteriesRes.ok) {
        const batteriesData = await batteriesRes.json();
        if (batteriesData.success && batteriesData.data) {
          refreshedBatteries = batteriesData.data;
          setBatteries(refreshedBatteries);
          console.log("✅ [BOOKING] Refreshed battery list before booking");
        }
      }
    } catch (refreshError) {
      console.error(
        "⚠️ [BOOKING] Failed to refresh battery list before booking:",
        refreshError
      );
      // Vẫn tiếp tục đặt nếu refresh fail
    }

    // Kiểm tra lại sau khi refresh
    const currentBatteries = refreshedBatteries.filter(
      (b) => b.model === selectedModel && b.status === "full"
    );
    if (currentBatteries.length === 0) {
      setError(
        "Hiện tại không còn pin khả dụng cho loại này! Có thể pin vừa được đặt bởi người khác. Vui lòng chọn loại pin khác hoặc thử lại sau."
      );
      return;
    }

    setLoading(true);

    // Tối ưu: Thêm timeout và AbortController để tránh chờ quá lâu
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây timeout

    try {
      const scheduledAtISO = scheduledDate.toISOString();

      // Sử dụng state useSubscription mà driver đã chọn
      const body = {
        vehicle_id: selectedVehicle.vehicle_id,
        station_id: id,
        battery_model: selectedModel,
        scheduled_at: scheduledAtISO,
        use_subscription: useSubscription, // Driver đã chọn có dùng subscription hay không
      };

      // Tối ưu: Sử dụng signal để có thể abort request
      const res = await fetchWithAuth(API_ENDPOINTS.DRIVER.BOOKINGS, {
        method: "POST",
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Tối ưu: Parse JSON nhanh hơn với check status trước
      if (!res.ok) {
        let errorData = {};
        try {
          errorData = await res.json();
        } catch {}
        throw new Error(
          (errorData as any).message || `Lỗi ${res.status}: ${res.statusText}`
        );
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Đặt pin thất bại");
      }

      // Hiển thị thông tin hold_summary nếu có
      const holdSummary = data.data?.hold_summary;
      if (holdSummary) {
        if (holdSummary.use_subscription && holdSummary.subscription_name) {
          setBookingMsg(
            `Đặt Pin thành công! Gói "${
              holdSummary.subscription_name
            }" sẽ được sử dụng cho lần đổi pin này.${
              holdSummary.subscription_remaining_after !== null
                ? ` Còn ${holdSummary.subscription_remaining_after} lượt sau giao dịch này.`
                : ""
            }`
          );
        } else if (
          holdSummary.wallet_amount_locked &&
          holdSummary.wallet_amount_locked > 0
        ) {
          setBookingMsg(
            `Đặt Pin thành công! Đã giữ ${holdSummary.wallet_amount_locked.toLocaleString(
              "vi-VN"
            )}₫ từ ví của bạn. Số dư sau: ${
              holdSummary.wallet_balance_after
                ? holdSummary.wallet_balance_after.toLocaleString("vi-VN") + "₫"
                : "N/A"
            }`
          );
        } else {
          setBookingMsg(
            "Đặt Pin thành công! Bạn sẽ thanh toán khi hoàn tất đổi pin tại trạm."
          );
        }
      } else {
        setBookingMsg(
          "Đặt Pin thành công! Bạn sẽ thanh toán khi hoàn tất đổi pin tại trạm."
        );
      }

      // Refresh lại danh sách pin để cập nhật số lượng (pin đã được reserve sẽ không còn trong danh sách khả dụng)
      try {
        const batteriesRes = await fetchWithAuth(
          `${API_ENDPOINTS.DRIVER.STATIONS}/${id}/batteries`
        );
        if (batteriesRes.ok) {
          const batteriesData = await batteriesRes.json();
          if (batteriesData.success && batteriesData.data) {
            setBatteries(batteriesData.data);
            console.log("✅ [BOOKING] Refreshed battery list after booking");
          }
        }
      } catch (refreshError) {
        console.error(
          "⚠️ [BOOKING] Failed to refresh battery list:",
          refreshError
        );
        // Không block UI nếu refresh fail
      }

      // Tối ưu: Tự động chuyển về trang bookings sau 1.5 giây
      setTimeout(() => {
        navigate("/driver/bookings");
      }, 1500);
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === "AbortError") {
        setError(
          "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại hoặc kiểm tra kết nối mạng."
        );
      } else {
        // Xử lý error message từ BE - Dịch tất cả sang tiếng Việt
        let errorMessage = e.message || "Có lỗi xảy ra khi đặt chỗ";

        // Dịch các error message thường gặp từ BE sang tiếng Việt
        const errorTranslations: Record<string, string> = {
          "No available batteries": "Không còn pin khả dụng",
          "available batteries": "pin khả dụng",
          "Battery model is not compatible": "Loại pin không tương thích",
          "Vehicle not found": "Không tìm thấy xe",
          "Station not found": "Không tìm thấy trạm",
          "Scheduled time must be": "Thời gian hẹn phải",
          "at least 30 minutes": "ít nhất 30 phút",
          "more than 12 hours": "không quá 12 giờ",
          "in the future": "trong tương lai",
          "Please choose another time": "Vui lòng chọn thời gian khác",
          "Please ask user to reschedule":
            "Vui lòng yêu cầu người dùng đặt lại lịch",
        };

        // Nếu là lỗi không có pin tại thời điểm đã chọn
        if (
          errorMessage.includes("No available batteries") ||
          errorMessage.includes("available batteries") ||
          errorMessage.includes("Please choose another time") ||
          errorMessage.toLowerCase().includes("no available") ||
          errorMessage.toLowerCase().includes("choose another time")
        ) {
          // Tìm thời gian trong message (nếu có) - format: "11/4/2025, 3:00:00 PM"
          const timeMatch = errorMessage.match(
            /(\d{1,2}\/\d{1,2}\/\d{4},?\s*\d{1,2}:\d{2}:\d{2}\s*[AP]M)/i
          );

          let displayTime = "";
          if (scheduledAt) {
            displayTime = new Date(scheduledAt).toLocaleString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          } else if (timeMatch) {
            // Parse thời gian từ message (format: "11/4/2025, 3:00:00 PM")
            try {
              const parsedTime = new Date(timeMatch[1]);
              if (!isNaN(parsedTime.getTime())) {
                displayTime = parsedTime.toLocaleString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }
            } catch {}
          }

          if (displayTime) {
            errorMessage = `Không còn pin khả dụng cho loại ${selectedModel} tại thời điểm ${displayTime}. Vui lòng chọn thời gian khác hoặc thử lại sau.`;

            // Tự động suggest thời gian mới: +30 phút từ thời gian đã chọn
            if (scheduledAt) {
              const suggestedTime = new Date(
                scheduledDate.getTime() + 30 * 60 * 1000
              );
              if (suggestedTime <= new Date(Date.now() + 12 * 60 * 60 * 1000)) {
                errorMessage += `\n\n💡 Gợi ý: Thử đặt lịch lúc ${suggestedTime.toLocaleString(
                  "vi-VN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  }
                )}`;
              }
            }
          } else {
            errorMessage = `Không còn pin khả dụng cho loại ${selectedModel} tại trạm này. Vui lòng chọn thời gian khác hoặc thử lại sau.`;
          }
        }
        // Dịch các lỗi khác
        else if (errorMessage.includes("Battery model is not compatible")) {
          errorMessage =
            "Loại pin không tương thích với xe của bạn. Vui lòng chọn lại.";
        } else if (
          errorMessage.includes("Vehicle not found") ||
          errorMessage.includes("does not belong to user")
        ) {
          errorMessage =
            "Không tìm thấy xe hoặc xe không thuộc về tài khoản của bạn.";
        } else if (
          errorMessage.includes("Station not found") ||
          errorMessage.includes("not active")
        ) {
          errorMessage = "Trạm không tồn tại hoặc không hoạt động.";
        } else if (
          errorMessage.includes("Scheduled time must be at least 30 minutes")
        ) {
          errorMessage = "Thời gian hẹn phải ít nhất 30 phút từ bây giờ.";
        } else if (
          errorMessage.includes("Scheduled time cannot be more than 12 hours")
        ) {
          errorMessage = "Thời gian hẹn không được quá 12 giờ từ bây giờ.";
        } else if (
          errorMessage.includes("Scheduled time must be in the future")
        ) {
          errorMessage = "Thời gian hẹn phải trong tương lai.";
        } else {
          // Dịch các từ khóa còn lại
          Object.keys(errorTranslations).forEach((key) => {
            if (errorMessage.includes(key)) {
              errorMessage = errorMessage.replace(
                new RegExp(key, "gi"),
                errorTranslations[key]
              );
            }
          });

          // Nếu vẫn còn chữ tiếng Anh và chưa được dịch, thử dịch toàn bộ message
          // Kiểm tra xem có từ tiếng Anh thường gặp không
          const commonEnglishWords = [
            "error",
            "failed",
            "invalid",
            "not found",
            "not allowed",
            "unauthorized",
            "forbidden",
            "bad request",
          ];
          const hasEnglishWord = commonEnglishWords.some(
            (word) =>
              errorMessage.toLowerCase().includes(word) &&
              !errorMessage.includes("Không") &&
              !errorMessage.includes("thất bại")
          );

          if (hasEnglishWord && errorMessage === e.message) {
            // Nếu message gốc vẫn là tiếng Anh, dịch sang tiếng Việt
            errorMessage = errorMessage
              .replace(/error/gi, "lỗi")
              .replace(/failed/gi, "thất bại")
              .replace(/invalid/gi, "không hợp lệ")
              .replace(/not found/gi, "không tìm thấy")
              .replace(/not allowed/gi, "không được phép")
              .replace(/unauthorized/gi, "không được ủy quyền")
              .replace(/forbidden/gi, "bị cấm")
              .replace(/bad request/gi, "yêu cầu không hợp lệ");

            // Nếu vẫn chưa có tiền tố, thêm "Có lỗi xảy ra: "
            if (
              !errorMessage.includes("Có lỗi") &&
              !errorMessage.includes("Không")
            ) {
              errorMessage = `Có lỗi xảy ra: ${errorMessage}`;
            }
          }
        }

        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading && !station) {
    return (
      <div className="flex flex-col p-6 lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-96" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="w-full md:w-80 lg:w-96 xl:w-[400px]">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !station) {
    return (
      <div className="flex flex-col p-6">
        <ErrorDisplay
          error={error}
          onRetry={() => {
            setError("");
            const fetchAll = async () => {
              setLoading(true);
              try {
                const [stationRes, batteriesRes, vehiclesRes] =
                  await Promise.all([
                    fetchWithAuth(`${API_ENDPOINTS.DRIVER.STATIONS}/${id}`),
                    fetchWithAuth(
                      `${API_ENDPOINTS.DRIVER.STATIONS}/${id}/batteries`
                    ),
                    fetchWithAuth(API_ENDPOINTS.DRIVER.VEHICLES),
                  ]);
                const [stj, brj, vrj] = await Promise.all([
                  stationRes.json(),
                  batteriesRes.json(),
                  vehiclesRes.json(),
                ]);
                if (!stationRes.ok)
                  throw new Error(
                    stj.message || "Không lấy được thông tin trạm"
                  );
                if (!batteriesRes.ok)
                  throw new Error(brj.message || "Không lấy được pin");
                if (!vehiclesRes.ok)
                  throw new Error(vrj.message || "Không lấy được xe của bạn");
                setStation(stj.data);
                setBatteries(brj.data);
                setVehicles(vrj.data);
                loadSubscription();
                loadWalletBalance();
              } catch (e: any) {
                setError(e.message || "Có lỗi xảy ra");
              } finally {
                setLoading(false);
              }
            };
            fetchAll();
          }}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        {station && (
          <Card className="mb-2">
            <CardContent className="p-4">
              <div className="font-bold text-xl mb-1">{station.name}</div>
              <div className="text-sm text-slate-600 mb-1">
                {station.address}
              </div>
              <div className="text-yellow-700 mb-2">
                ★ {(station.average_rating || 0).toFixed(1)} (
                {station.total_ratings || 0})
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-4">
            <div className="font-semibold mb-2">
              Chọn loại pin phù hợp với xe của bạn
            </div>
            {pinStats.length === 0 && batteries.length > 0 && vehicles.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-amber-600 dark:text-amber-400 font-semibold">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Trạm này không có loại pin phù hợp với xe của bạn. Vui lòng chọn trạm khác.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {pinStats.length === 0 && batteries.length === 0 && (
              <div>Hiện trạm này chưa có pin khả dụng.</div>
            )}
            <div className="space-y-4">
              {pinStats.map(({ model, count, example }) => {
                // Dùng matchBatteryModel để matching linh hoạt (ví dụ: "VinFast VF8" ↔ "VinFast VF8 Battery")
                const compatibleVehicles = vehicles.filter(
                  (v) =>
                    v.battery_model && matchBatteryModel(model, v.battery_model)
                );
                // Tìm pricing cho model này - dùng matchBatteryModel utility để matching linh hoạt
                const pricing = pricingList.find((p) => {
                  const matches = matchBatteryModel(p.battery_model, model);
                  if (matches) {
                    console.log(
                      `✅ Matched pricing: "${p.battery_model}" with battery model "${model}" → Price: ${p.price}`
                    );
                  }
                  return matches;
                });
                const price = pricing?.price ?? 0;

                // Debug: Log nếu không tìm thấy pricing
                if (!pricing && pricingList.length > 0) {
                  console.log(
                    `❌ No pricing found for model "${model}". Available pricing models:`,
                    pricingList.map((p) => p.battery_model)
                  );
                }

                return (
                  <div
                    key={model}
                    className={`p-4 rounded-lg border ${
                      selectedModel === model
                        ? "border-green-600 ring-2 ring-green-500/30 bg-green-50"
                        : "border-slate-200 bg-white"
                    } cursor-pointer transition-all hover:shadow-md`}
                    onClick={() => {
                      setSelectedModel(model);
                      // FIX: Reset xe đã chọn nếu không tương thích với loại pin mới (dùng matchBatteryModel)
                      if (
                        selectedVehicle &&
                        (!selectedVehicle.battery_model ||
                          !matchBatteryModel(
                            model,
                            selectedVehicle.battery_model
                          ))
                      ) {
                        setSelectedVehicle(null);
                      }
                      setError("");
                      setBookingMsg("");
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-base">{model}</div>
                        {recommendedPinModel &&
                          recommendedPinModel.model === model && (
                            <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                              Đề xuất
                            </Badge>
                          )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-700 text-xl">
                          {count} pin khả dụng
                          {pinStats.find((p) => p.model === model)
                            ?.reservedCount &&
                            pinStats.find((p) => p.model === model)!
                              .reservedCount > 0 && (
                              <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                                (
                                {
                                  pinStats.find((p) => p.model === model)!
                                    .reservedCount
                                }{" "}
                                đang được giữ)
                              </span>
                            )}
                        </div>
                        <div
                          className={`font-bold ${
                            price > 0
                              ? "text-green-600 text-lg"
                              : "text-green-600 text-base"
                          }`}
                        >
                          {price > 0
                            ? `${price.toLocaleString("vi-VN")}₫`
                            : "Liên hệ"}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center text-xs">
                      <div>
                        Dung lượng: <b>{example.capacity_kwh} kWh</b>
                      </div>
                      <div>
                        Mức sạc trung bình: <b>{example.current_charge}%</b>
                      </div>
                    </div>
                    <div className="mt-2 text-slate-500 text-xs">
                      Xe của bạn tương thích:
                    </div>
                    {compatibleVehicles.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {compatibleVehicles.map((v) => (
                          <Badge
                            key={v.vehicle_id}
                            onClick={(e) => {
                              e.stopPropagation();
                              // FIX: Tự động set loại pin khi chọn xe
                              // Đảm bảo selectedModel = battery_model của xe
                              if (selectedModel !== model) {
                                setSelectedModel(model);
                              }
                              setSelectedVehicle(v);
                              setError("");
                            }}
                            className={`cursor-pointer text-base px-3 py-2 select-none transition-all duration-300 ${
                              selectedVehicle &&
                              selectedVehicle.vehicle_id === v.vehicle_id
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold border-2 border-blue-500 shadow-lg shadow-blue-500/50 scale-105"
                                : "bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-900 dark:text-blue-100 border-2 border-blue-500 dark:border-blue-400 hover:border-blue-600 dark:hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/30 hover:scale-105 vehicle-compatible-glow"
                            }`}
                          >
                            {v.make ? `${v.make} ` : ""}
                            {v.model ? v.model : ""} ({v.license_plate})
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-red-600 font-medium mb-2">
                        Không có xe nào của bạn tương thích loại pin này.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full md:w-80 lg:w-96 xl:w-[400px]">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="font-semibold mb-2 text-base">Tóm tắt đặt chỗ</div>
            {!selectedModel && (
              <div className="text-slate-500 text-xs">
                Chọn loại pin để xem chi tiết
              </div>
            )}
            {selectedModel && (
              <>
                <div>
                  Loại pin: <b>{selectedModel}</b>
                </div>
                <div>
                  Xe:{" "}
                  {selectedVehicle ? (
                    <span className="font-bold">
                      {selectedVehicle.make} {selectedVehicle.model} (
                      {selectedVehicle.license_plate})
                    </span>
                  ) : (
                    <span className="text-orange-500">Chọn xe</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span>Số pin khả dụng:</span>
                  <b className="text-green-600">
                    {pinStats.find((p) => p.model === selectedModel)?.count ??
                      0}
                  </b>
                  {pinStats.find((p) => p.model === selectedModel)
                    ?.reservedCount &&
                    pinStats.find((p) => p.model === selectedModel)!
                      .reservedCount > 0 && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        (
                        {
                          pinStats.find((p) => p.model === selectedModel)!
                            .reservedCount
                        }{" "}
                        đang được giữ)
                      </span>
                    )}
                </div>

                {/* Phần giá - Preview giá cuối cùng (bao gồm subscription) */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {(() => {
                    const pricing = pricingList.find((p) =>
                      matchBatteryModel(p.battery_model, selectedModel)
                    );
                    const batteryPrice = pricing?.price ?? 0;

                    // Kiểm tra subscription có áp dụng được không (để hiển thị thông tin)
                    const subscriptionCanApply =
                      currentSubscription &&
                      doesSubscriptionCoverModel(
                        currentSubscription,
                        selectedModel
                      ) &&
                      (currentSubscription.remaining_swaps === null ||
                        (currentSubscription.remaining_swaps ?? 0) > 0);

                    // Tính giá dựa trên lựa chọn của driver (useSubscription state)
                    const finalTotal =
                      useSubscription && subscriptionCanApply
                        ? 0
                        : batteryPrice;

                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400">
                            Giá thay pin:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {batteryPrice > 0
                              ? `${batteryPrice.toLocaleString("vi-VN")}₫`
                              : "Liên hệ"}
                          </span>
                        </div>

                        {/* Gói dịch vụ - LUÔN hiển thị (có hoặc không có) */}
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Gói dịch vụ:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {currentSubscription ? (
                              <>
                                {currentSubscription.package?.name ||
                                  "Gói dịch vụ"}
                                {currentSubscription.remaining_swaps !==
                                  null && (
                                  <span className="text-slate-500">
                                    {" "}
                                    • Còn {
                                      currentSubscription.remaining_swaps
                                    }{" "}
                                    lần
                                  </span>
                                )}
                              </>
                            ) : (
                              "Không có"
                            )}
                          </span>
                        </div>

                        {/* Checkbox cho phép driver chọn có dùng subscription hay không */}
                        {subscriptionCanApply && (
                          <div className="mt-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useSubscription}
                                onChange={(e) =>
                                  setUseSubscription(e.target.checked)
                                }
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                Sử dụng gói "
                                {currentSubscription.package?.name ||
                                  "Gói dịch vụ"}
                                " cho lần đổi pin này
                              </span>
                            </label>
                            {useSubscription && (
                              <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                                ✓ Gói sẽ được áp dụng → Miễn phí
                              </div>
                            )}
                            {!useSubscription && (
                              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                                ⚠️ Sẽ thanh toán từ ví:{" "}
                                {batteryPrice > 0
                                  ? `${batteryPrice.toLocaleString("vi-VN")}₫`
                                  : "Liên hệ"}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            Tổng cộng (dự kiến):
                          </span>
                          <span
                            className={`font-bold text-lg ${
                              finalTotal === 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {batteryPrice > 0
                              ? finalTotal === 0
                                ? "Miễn phí"
                                : `${finalTotal.toLocaleString("vi-VN")}₫`
                              : "Liên hệ"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          * Giá cuối cùng sẽ được xác nhận trong lịch sử đặt chỗ
                          sau khi đặt thành công.
                        </p>

                        {/* Wallet balance warning - chỉ hiển thị khi không dùng subscription */}
                        {walletBalance !== null &&
                          !(useSubscription && subscriptionCanApply) &&
                          batteryPrice > 0 && (
                            <div
                              className={`mt-3 p-2 rounded-lg border ${
                                walletBalance < batteryPrice
                                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                                  : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              }`}
                            >
                              <p
                                className={`text-xs ${
                                  walletBalance < batteryPrice
                                    ? "text-amber-700 dark:text-amber-300"
                                    : "text-blue-700 dark:text-blue-300"
                                }`}
                              >
                                {walletBalance < batteryPrice ? (
                                  <>
                                    ⚠️{" "}
                                    <strong>
                                      Số dư ví:{" "}
                                      {walletBalance.toLocaleString("vi-VN")}₫
                                    </strong>
                                    . Ước tính giá:{" "}
                                    <strong>
                                      {batteryPrice.toLocaleString("vi-VN")}₫
                                    </strong>
                                    . Vui lòng nạp thêm nếu cần.
                                  </>
                                ) : (
                                  <>
                                    💰 Số dư ví:{" "}
                                    <strong>
                                      {walletBalance.toLocaleString("vi-VN")}₫
                                    </strong>
                                    . Ước tính giá:{" "}
                                    <strong>
                                      {batteryPrice.toLocaleString("vi-VN")}₫
                                    </strong>
                                    .
                                  </>
                                )}
                              </p>
                            </div>
                          )}
                      </div>
                    );
                  })()}
                </div>

                {/* Phần chọn thời gian hẹn */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="font-semibold mb-2 text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Thời gian hẹn
                  </div>
                  <div className="space-y-2">
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      min={getMinDateTime()}
                      max={getMaxDateTime()}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Chọn thời gian từ 30 phút đến 12 giờ kể từ bây giờ
                    </p>
                    {scheduledAt && (
                      <>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Hẹn lúc:{" "}
                          {new Date(scheduledAt).toLocaleString("vi-VN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          ⚠️ Lưu ý: Số lượng pin có thể thay đổi tùy theo số
                          người đặt trước tại thời điểm này. Nếu hết pin, vui
                          lòng chọn thời gian khác.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
            {selectedModel && selectedVehicle && (
              <Button
                disabled={loading}
                className="w-full mt-5 gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleBooking}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <BatteryLoading size="sm" variant="charging" />
                    Đang xử lý...
                  </span>
                ) : (
                  "Xác nhận đặt chỗ"
                )}
              </Button>
            )}
            {selectedModel && !selectedVehicle && (
              <div className="mt-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 text-center font-medium">
                  ⚠️ Vui lòng chọn xe tương thích ở trên để tiếp tục
                </p>
              </div>
            )}
            {!selectedModel && (
              <Button
                disabled
                className="w-full mt-5 opacity-50 cursor-not-allowed"
              >
                Xác nhận đặt chỗ
              </Button>
            )}
            {error && (
              <div className="mt-5">
                <ErrorDisplay
                  error={error}
                  variant="inline"
                  onRetry={() => setError("")}
                />
              </div>
            )}
            {bookingMsg && (
              <div className="text-sm text-green-700 bg-green-100 rounded p-2 mt-2">
                {bookingMsg}
              </div>
            )}
            <div className="text-xs text-slate-500 mt-3">
              Bạn có thể huỷ đặt chỗ miễn phí trước 15 phút
            </div>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => navigate(-1)}
            >
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookBatteryPage;
