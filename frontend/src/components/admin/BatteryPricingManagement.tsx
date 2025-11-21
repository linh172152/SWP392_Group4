import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import batteryPricingService from "../../services/battery-pricing.service";
import batteryTransferService from "../../services/battery-transfer.service";
import { getAllStations } from "../../services/station.service";
import { getAdminBatteries } from "../../services/battery.service";
import adminBatteryService from "../../services/admin-battery.service";

import { toast } from "sonner";
import type { BatteryPricing } from "../../services/battery-pricing.service";
import type {
  BatteryTransfer,
  CreateBatteryTransferDto,
} from "../../services/battery-transfer.service";
import type {
  Battery as BatteryType,
  BatteryStats,
  CreateBatteryDto,
} from "../../services/admin-battery.service";

import {
  DollarSign,
  Edit2,
  Trash2,
  Plus,
  Check,
  X,
  Battery,
  Zap,
  TrendingUp,
  Search,
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Archive,
  Package,
  AlertTriangle,
  History,
  Wrench,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const BatteryPricingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "pricing" | "transfer" | "warehouse"
  >("pricing");
  const [loading, setLoading] = useState(false);

  // Pricing state
  const [pricings, setPricings] = useState<BatteryPricing[]>([]);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [newPricing, setNewPricing] = useState({
    battery_model: "",
    price: "",
    is_active: true,
  });
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");



  // Transfer state
  const [transfers, setTransfers] = useState<BatteryTransfer[]>([]);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [newTransfer, setNewTransfer] = useState<
    CreateBatteryTransferDto & { from_station_id?: string }
  >({
    from_station_id: "",
    battery_id: "",
    to_station_id: "",
    transfer_reason: "",
    notes: "",
  });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedTransfer, setSelectedTransfer] =
    useState<BatteryTransfer | null>(null);
  const [showTransferDetail, setShowTransferDetail] = useState(false);

  // Warehouse state
  const [warehouseData, setWarehouseData] = useState<any[]>([]);
  const [selectedWarehouseStation, setSelectedWarehouseStation] =
    useState<string>("all");
  const [batteryStatusFilter, setBatteryStatusFilter] = useState<string>("all");

  // Delete confirmation dialogs
  const [deletePricingDialogOpen, setDeletePricingDialogOpen] = useState(false);
  const [pricingToDelete, setPricingToDelete] = useState<string | null>(null);
  const [cancelTransferDialogOpen, setCancelTransferDialogOpen] =
    useState(false);
  const [transferToCancel, setTransferToCancel] = useState<string | null>(null);
  const [deleteBatteryDialogOpen, setDeleteBatteryDialogOpen] = useState(false);
  const [batteryToDelete, setBatteryToDelete] = useState<{
    id: string;
    code: string;
  } | null>(null);
  const [selectedBatteryForDetail, setSelectedBatteryForDetail] =
    useState<any>(null);
  const [showBatteryDetailModal, setShowBatteryDetailModal] = useState(false);

  // Advanced warehouse features
  const [batteryStats, setBatteryStats] = useState<BatteryStats | null>(null);
  const [lowHealthBatteries, setLowHealthBatteries] = useState<BatteryType[]>(
    []
  );
  const [showLowHealthModal, setShowLowHealthModal] = useState(false);
  const [showAddBatteryModal, setShowAddBatteryModal] = useState(false);
  const [showEditBatteryModal, setShowEditBatteryModal] = useState(false);
  const [showBatteryHistoryModal, setShowBatteryHistoryModal] = useState(false);
  const [editingBattery, setEditingBattery] = useState<BatteryType | null>(
    null
  );
  const [batteryHistory, setBatteryHistory] = useState<any[]>([]);
  const [newBattery, setNewBattery] = useState<CreateBatteryDto>({
    station_id: "",
    model: "",
    battery_code: "",
    status: "full",
    health_percentage: 100,
    cycle_count: 0,
  });
  const [editBattery, setEditBattery] = useState<CreateBatteryDto>({
    station_id: "",
    model: "",
    battery_code: "",
    status: "full",
    health_percentage: 100,
    cycle_count: 0,
  });
  const [healthThreshold, setHealthThreshold] = useState(70);

  // Dropdown data
  const [stations, setStations] = useState<any[]>([]);
  const [batteries, setBatteries] = useState<any[]>([]);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === "pricing") {
      fetchPricing();
    } else if (activeTab === "transfer") {
      fetchTransfers();
      fetchStations();
      fetchBatteries();
    } else if (activeTab === "warehouse") {
      fetchWarehouseData();
      fetchStations(); // Load stations for "Add Battery" modal
    }
  }, [activeTab]);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const response = await batteryPricingService.getBatteryPricing();

      if (response?.success) {
        const pricingsData = response.data?.pricings || [];
        setPricings(pricingsData);
      } else {
        toast.error("Không thể tải dữ liệu giá pin");
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
      toast.error("Lỗi khi tải dữ liệu giá pin");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await batteryTransferService.getBatteryTransfers();

      if (response?.success) {
        const transfersData = response.data?.transfers || [];
        setTransfers(transfersData);
      }
    } catch (error) {
      console.error("Error fetching transfers:", error);
      toast.error("Lỗi khi tải dữ liệu chuyển pin");
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await getAllStations();
      if (response?.success) {
        setStations(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };

  const fetchBatteries = async () => {
    try {
      const response = await getAdminBatteries();
      if (response?.success) {
        setBatteries(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching batteries:", error);
    }
  };

  const fetchWarehouseData = async () => {
    try {
      setLoading(true);
      const [stationResponse, batteryResponse, statsResponse] =
        await Promise.all([
          getAllStations(),
          adminBatteryService.getBatteries(),
          adminBatteryService.getBatteryStats().catch((err) => {
            console.warn("Stats API unavailable:", err);
            return { success: false, message: "Stats endpoint not available" };
          }),
        ]);

      if (stationResponse?.success && batteryResponse?.success) {
        const stationsData = stationResponse.data || [];
        const batteriesData =
          batteryResponse.data?.batteries || batteryResponse.data || [];

        // Set battery stats with fallback
        if (statsResponse?.success) {
          // Transform API response to match frontend interface and UI logic
          const apiStats = statsResponse.data.by_status;
          const transformedStats = {
            ...statsResponse.data,
            by_status: {
              ...apiStats,
              available: apiStats.full || 0, // Map 'full' to 'available'
              // Calculate "damaged" as displayed in UI (not full, charging, maintenance)
              damaged: (apiStats.in_use || 0) + (apiStats.reserved || 0) + (apiStats.damaged || 0),
            },
          };
          setBatteryStats(transformedStats);
        } else {

          // Fallback: calculate stats from battery data using UI logic
          const fallbackStats = {
            total: batteriesData.length,
            by_status: {
              available: batteriesData.filter((b: any) => b.status === "full").length,
              charging: batteriesData.filter((b: any) => b.status === "charging").length,
              maintenance: batteriesData.filter((b: any) => b.status === "maintenance").length,
              damaged: batteriesData.filter((b: any) => 
                b.status !== "full" && b.status !== "charging" && b.status !== "maintenance"
              ).length,
              in_use: batteriesData.filter((b: any) => b.status === "in_use").length,
              reserved: batteriesData.filter((b: any) => b.status === "reserved").length,
            },
            by_model: Object.entries(
              batteriesData.reduce((acc: any, battery: any) => {
                acc[battery.model] = (acc[battery.model] || 0) + 1;
                return acc;
              }, {})
            ).map(([model, count]) => ({ model, count: count as number })),
            low_health_count: batteriesData.filter(
              (b: any) => b.health_percentage < 70
            ).length,
            avg_health:
              batteriesData.reduce(
                (sum: number, b: any) => sum + (b.health_percentage || 0),
                0
              ) / Math.max(batteriesData.length, 1),
            avg_cycle_count:
              batteriesData.reduce(
                (sum: number, b: any) => sum + (b.cycle_count || 0),
                0
              ) / Math.max(batteriesData.length, 1),
          };
          setBatteryStats(fallbackStats);
        }

        // Group batteries by station
        const warehouseInfo = stationsData.map((station: any) => {
          const stationBatteries = batteriesData.filter(
            (battery: any) => battery.station_id === station.station_id
          );

          // Find batteries that would be displayed as "Hỏng" (not full, charging, or maintenance)
          const displayedAsDamaged = stationBatteries.filter((b: any) => 
            b.status !== "full" && b.status !== "charging" && b.status !== "maintenance"
          );

          const batteryStats = {
            total: stationBatteries.length,
            available: stationBatteries.filter((b: any) => b.status === "full")
              .length,
            charging: stationBatteries.filter(
              (b: any) => b.status === "charging"
            ).length,
            maintenance: stationBatteries.filter(
              (b: any) => b.status === "maintenance"
            ).length,
            damaged: displayedAsDamaged.length,
            in_use: stationBatteries.filter((b: any) => b.status === "in_use")
              .length,
            reserved: stationBatteries.filter((b: any) => b.status === "reserved")
              .length,
          };

          return {
            ...station,
            batteries: stationBatteries,
            batteryStats,
          };
        });

        setWarehouseData(warehouseInfo);

        // If using fallback stats, recalculate from warehouseInfo for accuracy
        if (!statsResponse?.success) {
          const totalStats = warehouseInfo.reduce((total: any, station: any) => {
            total.total += station.batteryStats.total;
            total.available += station.batteryStats.available;
            total.charging += station.batteryStats.charging;
            total.maintenance += station.batteryStats.maintenance;
            total.damaged += station.batteryStats.damaged;
            total.in_use += (station.batteryStats.in_use || 0);
            total.reserved += (station.batteryStats.reserved || 0);
            return total;
          }, { total: 0, available: 0, charging: 0, maintenance: 0, damaged: 0, in_use: 0, reserved: 0 });

          const correctedStats = {
            total: totalStats.total,
            by_status: {
              available: totalStats.available,
              charging: totalStats.charging,
              maintenance: totalStats.maintenance,
              damaged: totalStats.damaged,
              in_use: totalStats.in_use,
              reserved: totalStats.reserved,
            },
            by_model: Object.entries(
              batteriesData.reduce((acc: any, battery: any) => {
                acc[battery.model] = (acc[battery.model] || 0) + 1;
                return acc;
              }, {})
            ).map(([model, count]) => ({ model, count: count as number })),
            low_health_count: batteriesData.filter(
              (b: any) => b.health_percentage < 70
            ).length,
            avg_health:
              batteriesData.reduce(
                (sum: number, b: any) => sum + (b.health_percentage || 0),
                0
              ) / Math.max(batteriesData.length, 1),
            avg_cycle_count:
              batteriesData.reduce(
                (sum: number, b: any) => sum + (b.cycle_count || 0),
                0
              ) / Math.max(batteriesData.length, 1),
          };

          setBatteryStats(correctedStats);
        }
      }
    } catch (error) {
      console.error("Error fetching warehouse data:", error);
      toast.error("Lỗi khi tải dữ liệu kho pin");
    } finally {
      setLoading(false);
    }
  };

  const fetchLowHealthBatteries = async () => {
    try {
      const response = await adminBatteryService.getLowHealthBatteries(
        healthThreshold
      );
      if (response?.success) {
        setLowHealthBatteries(response.data?.batteries || []);
      } else {
        toast.error(
          response?.message || "Không thể tải danh sách pin sức khỏe thấp"
        );
      }
    } catch (error) {
      console.error("Error fetching low health batteries:", error);
      toast.error("Lỗi khi tải pin sức khỏe thấp - có thể API chưa sẵn sàng");
    }
  };

  // Delete pricing handler
  const handleDeletePricing = async () => {
    if (!pricingToDelete) return;

    try {
      await batteryPricingService.deleteBatteryPricing(pricingToDelete);
      toast.success("Xóa giá pin thành công");
      fetchPricing();
      setPricingToDelete(null);
    } catch (error) {
      console.error("Error deleting pricing:", error);
      toast.error("Lỗi khi xóa giá pin");
    } finally {
      setDeletePricingDialogOpen(false);
    }
  };

  // Cancel transfer handler
  const handleCancelTransfer = async () => {
    if (!transferToCancel) return;

    try {
      await batteryTransferService.updateBatteryTransferStatus(
        transferToCancel,
        "cancelled"
      );
      toast.success("Hủy chuyển pin thành công");
      fetchTransfers();
      setTransferToCancel(null);
    } catch (error) {
      console.error("Error cancelling transfer:", error);
      toast.error("Lỗi khi hủy chuyển pin");
    } finally {
      setCancelTransferDialogOpen(false);
    }
  };

  // Delete battery handler
  const handleDeleteBattery = async () => {
    if (!batteryToDelete) return;

    try {
      await adminBatteryService.deleteBattery(batteryToDelete.id);
      toast.success("Xóa pin thành công");
      fetchWarehouseData();
      setBatteryToDelete(null);
    } catch (error) {
      console.error("Error deleting battery:", error);
      toast.error("Lỗi khi xóa pin");
    } finally {
      setDeleteBatteryDialogOpen(false);
    }
  };

  const fetchBatteryHistory = async (batteryId: string) => {
    try {
      const response = await adminBatteryService.getBatteryHistory(batteryId);
      if (response?.success) {
        setBatteryHistory(response.data?.history || []);
      }
    } catch (error) {
      console.error("Error fetching battery history:", error);
      toast.error("Lỗi khi tải lịch sử pin");
    }
  };

  // Calculate statistics
  const totalPricings = pricings.length;
  const activePricings = pricings.filter((p) => p.is_active).length;

  // Ensure transfers is always an array
  const transfersArray = Array.isArray(transfers) ? transfers : [];
  const totalTransfers = transfersArray.length;
  const pendingTransfers = transfersArray.filter(
    (t) => t.transfer_status === "pending"
  ).length;
  const completedTransfers = transfersArray.filter(
    (t) => t.transfer_status === "completed"
  ).length;
  const failedTransfers = transfersArray.filter(
    (t) => t.transfer_status === "cancelled"
  ).length;

  return (
    <div className="container mx-auto max-w-7xl px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {activeTab === "pricing"
              ? "Quản lý Giá Pin"
              : activeTab === "transfer"
              ? "Chuyển Pin Giữa Trạm"
              : "Quản lý Kho Pin"}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === "pricing"
              ? "Quản lý và cấu hình giá cho tất cả các mẫu pin."
              : activeTab === "transfer"
              ? "Quản lý việc chuyển pin giữa các trạm đổi pin."
              : "Theo dõi tồn kho và trạng thái pin tại tất cả các trạm."}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("pricing")}
          className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === "pricing"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Quản lý Giá
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === "transfer"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Chuyển Pin
        </button>
        <button
          onClick={() => setActiveTab("warehouse")}
          className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
            activeTab === "warehouse"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <Archive className="h-4 w-4" />
          Quản lý Kho
        </button>
      </div>

      {/* Statistics Cards */}
      {activeTab === "pricing" && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Tổng mẫu pin
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {totalPricings}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Giá đang hoạt động
              </CardTitle>
              <Zap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {activePricings}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "transfer" && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Tổng số
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">
                {totalTransfers}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">
                Chờ duyệt
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800">
                {pendingTransfers}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">
                Hoàn thành
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {completedTransfers}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-red-50 to-rose-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">
                Thất bại
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">
                {failedTransfers}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "pricing"
              ? "Danh sách giá pin"
              : activeTab === "transfer"
              ? "Danh sách chuyển pin"
              : "Kho pin các trạm"}
          </CardTitle>
          <CardDescription>
            {activeTab === "pricing"
              ? "Quản lý giá cho từng loại pin"
              : activeTab === "transfer"
              ? "Theo dõi việc chuyển pin giữa các trạm"
              : "Xem thông tin kho pin tại từng trạm"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 animate-pulse">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === "pricing" && (
                <>
                  {/* Pricing Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo mẫu pin..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => setShowPricingForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm giá pin
                    </button>
                  </div>

                  {/* Pricing Table */}
                  {pricings.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        Chưa có dữ liệu giá pin
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Thêm giá cho các mẫu pin để bắt đầu
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-4 font-medium text-gray-700">
                              Mẫu pin
                            </th>
                            <th className="text-left p-4 font-medium text-gray-700">
                              Giá (VNĐ)
                            </th>
                            <th className="text-left p-4 font-medium text-gray-700">
                              Trạng thái
                            </th>
                            <th className="text-left p-4 font-medium text-gray-700">
                              Ngày tạo
                            </th>
                            <th className="text-right p-4 font-medium text-gray-700">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricings
                            .filter((pricing) =>
                              pricing.battery_model
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            )
                            .map((pricing) => (
                              <tr
                                key={pricing.pricing_id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Battery className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium">
                                      {pricing.battery_model}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-lg font-semibold text-green-600">
                                    {new Intl.NumberFormat("vi-VN").format(
                                      pricing.price
                                    )}
                                    đ
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      pricing.is_active
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {pricing.is_active
                                      ? "Hoạt động"
                                      : "Tạm dừng"}
                                  </span>
                                </td>
                                <td className="p-4 text-gray-600">
                                  {new Date(
                                    pricing.created_at
                                  ).toLocaleDateString("vi-VN")}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingPricing(pricing.pricing_id);
                                        setNewPricing({
                                          battery_model: pricing.battery_model,
                                          price: pricing.price.toString(),
                                          is_active: pricing.is_active,
                                        });
                                        setShowPricingForm(true);
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                      title="Chỉnh sửa"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPricingToDelete(pricing.pricing_id);
                                        setDeletePricingDialogOpen(true);
                                      }}
                                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                      title="Xóa"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === "transfer" && (
                <>
                  {/* Transfer Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-[180px] bg-white border-gray-300">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem
                          value="all"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Tất cả
                        </SelectItem>
                        <SelectItem
                          value="pending"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Chờ duyệt
                        </SelectItem>
                        <SelectItem
                          value="in_transit"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Đang vận chuyển
                        </SelectItem>
                        <SelectItem
                          value="completed"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Hoàn thành
                        </SelectItem>
                        <SelectItem
                          value="cancelled"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Đã hủy
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <button
                      onClick={() => setShowTransferForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4" />
                      Tạo chuyển pin
                    </button>
                  </div>

                  {/* Transfer Table */}
                  {transfersArray.length === 0 ? (
                    <div className="text-center py-8">
                      <ArrowRightLeft className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        Chưa có dữ liệu chuyển pin
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Tạo lệnh chuyển pin đầu tiên để bắt đầu
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-4 font-medium text-gray-700">
                              Pin
                            </th>
                            <th className="text-left p-4 font-medium text-gray-700">
                              Từ trạm
                            </th>
                            <th className="text-left p-4 font-medium text-gray-700">
                              Đến trạm
                            </th>
                            <th className="text-left p-4 font-medium text-gray-700">
                              Trạng thái
                            </th>
                            <th className="text-left p-4 font-medium text-gray-700">
                              Lý do
                            </th>
                            <th className="text-left p-4 font-medium text-gray-700">
                              Ngày chuyển
                            </th>
                            <th className="text-right p-4 font-medium text-gray-700">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transfersArray
                            .filter(
                              (transfer) =>
                                filterStatus === "all" ||
                                transfer.transfer_status === filterStatus
                            )
                            .map((transfer) => (
                              <tr
                                key={transfer.transfer_id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Battery className="h-4 w-4 text-blue-500" />
                                    <div>
                                      <div className="font-medium">
                                        {transfer.battery?.battery_code ||
                                          transfer.battery_id}
                                      </div>
                                      {transfer.battery?.model && (
                                        <div className="text-sm text-gray-500">
                                          {transfer.battery.model}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div>
                                    <div className="font-medium">
                                      {transfer.from_station?.name || "N/A"}
                                    </div>
                                    {transfer.from_station?.address && (
                                      <div className="text-sm text-gray-500">
                                        {transfer.from_station.address}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div>
                                    <div className="font-medium">
                                      {transfer.to_station?.name || "N/A"}
                                    </div>
                                    {transfer.to_station?.address && (
                                      <div className="text-sm text-gray-500">
                                        {transfer.to_station.address}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      transfer.transfer_status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : transfer.transfer_status ===
                                          "in_transit"
                                        ? "bg-blue-100 text-blue-800"
                                        : transfer.transfer_status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {transfer.transfer_status === "completed"
                                      ? "Hoàn thành"
                                      : transfer.transfer_status ===
                                        "in_transit"
                                      ? "Đang vận chuyển"
                                      : transfer.transfer_status === "pending"
                                      ? "Chờ duyệt"
                                      : "Đã hủy"}
                                  </span>
                                </td>
                                <td className="p-4 text-sm">
                                  {transfer.transfer_reason}
                                </td>
                                <td className="p-4 text-gray-600">
                                  {transfer.transferred_at
                                    ? new Date(
                                        transfer.transferred_at
                                      ).toLocaleDateString("vi-VN", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                      })
                                    : "N/A"}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedTransfer(transfer);
                                        setShowTransferDetail(true);
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                      title="Xem chi tiết"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    {transfer.transfer_status === "pending" && (
                                      <button
                                        onClick={async () => {
                                          try {
                                            await batteryTransferService.updateBatteryTransferStatus(
                                              transfer.transfer_id,
                                              "completed"
                                            );
                                            toast.success(
                                              "Duyệt chuyển pin thành công"
                                            );
                                            fetchTransfers();
                                          } catch (error) {
                                            console.error(
                                              "Error approving transfer:",
                                              error
                                            );
                                            toast.error(
                                              "Lỗi khi duyệt chuyển pin"
                                            );
                                          }
                                        }}
                                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                        title="Duyệt chuyển"
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                    )}
                                    {(transfer.transfer_status === "pending" ||
                                      transfer.transfer_status ===
                                        "in_transit") && (
                                      <button
                                        onClick={() => {
                                          setTransferToCancel(
                                            transfer.transfer_id
                                          );
                                          setCancelTransferDialogOpen(true);
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Hủy chuyển"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {activeTab === "warehouse" && (
                <>
                  {/* Battery Statistics Overview */}
                  {batteryStats ? (
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-6">
                      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-blue-700">
                            Tổng số pin
                          </CardTitle>
                          <Battery className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-800">
                            {batteryStats.total}
                          </div>
                          <p className="text-xs text-blue-600">
                            Sức khỏe TB: {batteryStats.avg_health.toFixed(1)}%
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-green-700">
                            Sẵn sàng
                          </CardTitle>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-800">
                            {batteryStats.by_status.available || 0}
                          </div>
                          <p className="text-xs text-green-600">
                            {(
                              ((batteryStats.by_status.available || 0) /
                                Math.max(batteryStats.total, 1)) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-amber-700">
                            Đang sạc
                          </CardTitle>
                          <Zap className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-amber-800">
                            {batteryStats.by_status.charging || 0}
                          </div>
                          <p className="text-xs text-amber-600">
                            Chu kỳ TB: {batteryStats.avg_cycle_count}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-r from-red-50 to-rose-100 border-red-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-red-700">
                            Pin hỏng
                          </CardTitle>
                          <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-800">
                            {batteryStats.by_status.damaged || 0}
                          </div>
                          <p className="text-xs text-red-600">
                            {batteryStats.total > 0 ? (
                              ((batteryStats.by_status.damaged || 0) / batteryStats.total * 100).toFixed(1)
                            ) : 0}%
                          </p>
                        </CardContent>
                      </Card>

                      <Card
                        className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          fetchLowHealthBatteries();
                          setShowLowHealthModal(true);
                        }}
                      >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-orange-700">
                            Cần bảo trì
                          </CardTitle>
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-800">
                            {batteryStats.low_health_count}
                          </div>
                          <p className="text-xs text-orange-600">
                            Nhấp để xem chi tiết
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">
                          Thống kê chi tiết đang được tải hoặc chưa sẵn sàng.
                          Hiển thị dữ liệu cơ bản từ danh sách pin.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Warehouse Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <Select
                      value={selectedWarehouseStation}
                      onValueChange={setSelectedWarehouseStation}
                    >
                      <SelectTrigger className="w-[200px] bg-white border-gray-300">
                        <SelectValue placeholder="Chọn trạm" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem
                          value="all"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Tất cả trạm
                        </SelectItem>
                        {warehouseData.map((station) => (
                          <SelectItem
                            key={station.station_id}
                            value={station.station_id}
                            className="hover:bg-gray-100 focus:bg-gray-100"
                          >
                            {station.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={batteryStatusFilter}
                      onValueChange={setBatteryStatusFilter}
                    >
                      <SelectTrigger className="w-[180px] bg-white border-gray-300">
                        <SelectValue placeholder="Trạng thái pin" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg">
                        <SelectItem
                          value="all"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Tất cả
                        </SelectItem>
                        <SelectItem
                          value="full"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Đầy pin
                        </SelectItem>
                        <SelectItem
                          value="full"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Sẵn sàng
                        </SelectItem>
                        <SelectItem
                          value="charging"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Đang sạc
                        </SelectItem>
                        <SelectItem
                          value="maintenance"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Bảo trì
                        </SelectItem>
                        <SelectItem
                          value="damaged"
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          Hỏng
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 ml-auto">
                      <button
                        onClick={() => {
                          fetchLowHealthBatteries();
                          setShowLowHealthModal(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Pin cần bảo trì
                      </button>
                      <button
                        onClick={() => {
                          setNewBattery({
                            station_id: "",
                            model: "",
                            battery_code: "",
                            status: "full",
                            health_percentage: 100,
                            cycle_count: 0,
                          });
                          setShowAddBatteryModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        Thêm pin mới
                      </button>
                    </div>
                  </div>

                  {/* Warehouse Overview */}
                  {warehouseData.length === 0 ? (
                    <div className="text-center py-8">
                      <Archive className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">
                        Chưa có dữ liệu kho pin
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {warehouseData
                        .filter(
                          (station) =>
                            selectedWarehouseStation === "all" ||
                            station.station_id === selectedWarehouseStation
                        )
                        .map((station) => (
                          <Card key={station.station_id} className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {station.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {station.address}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-blue-600">
                                  {station.batteryStats.total}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Tổng pin
                                </div>
                              </div>
                            </div>

                            {/* Battery Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="bg-green-50 p-3 rounded-lg">
                                <div className="text-lg font-semibold text-green-700">
                                  {station.batteryStats.available}
                                </div>
                                <div className="text-sm text-green-600">
                                  Sẵn sàng
                                </div>
                              </div>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="text-lg font-semibold text-blue-700">
                                  {station.batteryStats.charging}
                                </div>
                                <div className="text-sm text-blue-600">
                                  Đang sạc
                                </div>
                              </div>
                              <div className="bg-yellow-50 p-3 rounded-lg">
                                <div className="text-lg font-semibold text-yellow-700">
                                  {station.batteryStats.maintenance}
                                </div>
                                <div className="text-sm text-yellow-600">
                                  Bảo trì
                                </div>
                              </div>
                              <div className="bg-red-50 p-3 rounded-lg">
                                <div className="text-lg font-semibold text-red-700">
                                  {station.batteryStats.damaged}
                                </div>
                                <div className="text-sm text-red-600">Hỏng</div>
                              </div>
                            </div>

                            {/* Battery List */}
                            {station.batteries.length > 0 && (
                              <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-700 mb-3">
                                  Danh sách pin
                                </h4>
                                <div className="grid gap-2 max-h-48 overflow-y-auto">
                                  {station.batteries
                                    .filter((battery: any) => {
                                      if (batteryStatusFilter === "all")
                                        return true;
                                      if (batteryStatusFilter === "full")
                                        return battery.status === "full";
                                      return (
                                        battery.status === batteryStatusFilter
                                      );
                                    })
                                    .map((battery: any) => (
                                      <div
                                        key={battery.battery_id}
                                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Battery className="h-4 w-4 text-blue-500" />
                                          <div>
                                            <div className="font-medium text-sm">
                                              {battery.battery_code}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {battery.model}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span
                                            className={`px-2 py-1 rounded text-xs font-medium ${
                                              battery.status === "full"
                                                ? "bg-green-100 text-green-800"
                                                : battery.status === "charging"
                                                ? "bg-blue-100 text-blue-800"
                                                : battery.status ===
                                                  "maintenance"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                          >
                                            {battery.status === "full"
                                              ? "Sẵn sàng"
                                              : battery.status === "charging"
                                              ? "Đang sạc"
                                              : battery.status === "maintenance"
                                              ? "Bảo trì"
                                              : "Hỏng"}
                                          </span>
                                          <span className="text-sm text-gray-600">
                                            {battery.health_percentage !==
                                            undefined
                                              ? `${battery.health_percentage}%`
                                              : battery.current_charge !==
                                                undefined
                                              ? `${battery.current_charge}%`
                                              : "N/A"}
                                          </span>
                                          <button
                                            onClick={() => {
                                              setSelectedBatteryForDetail(
                                                battery
                                              );
                                              setShowBatteryDetailModal(true);
                                            }}
                                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                            title="Xem chi tiết"
                                          >
                                            <Eye className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              fetchBatteryHistory(
                                                battery.battery_id
                                              );
                                              setSelectedBatteryForDetail(
                                                battery
                                              );
                                              setShowBatteryHistoryModal(true);
                                            }}
                                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                                            title="Lịch sử"
                                          >
                                            <History className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingBattery(battery);
                                              setEditBattery({
                                                station_id: battery.station_id,
                                                model: battery.model,
                                                battery_code:
                                                  battery.battery_code,
                                                status: battery.status as any,
                                                health_percentage:
                                                  battery.health_percentage,
                                                cycle_count:
                                                  battery.cycle_count,
                                              });
                                              setShowEditBatteryModal(true);
                                            }}
                                            className="p-1 text-amber-600 hover:bg-amber-100 rounded"
                                            title="Chỉnh sửa"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => {
                                              setBatteryToDelete({
                                                id: battery.battery_id,
                                                code: battery.battery_code,
                                              });
                                              setDeleteBatteryDialogOpen(true);
                                            }}
                                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                                            title="Xóa"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Form Modal */}
      {showPricingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingPricing ? "Chỉnh sửa giá pin" : "Thêm giá pin mới"}
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);

                  const priceValue = parseFloat(newPricing.price);
                  if (isNaN(priceValue) || priceValue <= 0) {
                    toast.error("Giá phải là số dương");
                    return;
                  }

                  const payload = {
                    battery_model: newPricing.battery_model.trim(),
                    price: priceValue,
                    is_active: newPricing.is_active,
                  };

                  if (editingPricing) {
                    await batteryPricingService.updateBatteryPricing(
                      editingPricing,
                      payload
                    );
                    toast.success("Cập nhật giá pin thành công");
                  } else {
                    await batteryPricingService.createBatteryPricing(payload);
                    toast.success("Thêm giá pin thành công");
                  }

                  setShowPricingForm(false);
                  setEditingPricing(null);
                  setNewPricing({
                    battery_model: "",
                    price: "",
                    is_active: true,
                  });
                  fetchPricing();
                } catch (error) {
                  console.error("Error saving pricing:", error);
                  toast.error("Lỗi khi lưu giá pin");
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mẫu pin *
                </label>
                <input
                  type="text"
                  required
                  value={newPricing.battery_model}
                  onChange={(e) =>
                    setNewPricing({
                      ...newPricing,
                      battery_model: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: LP-48V20Ah"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={newPricing.price}
                  onChange={(e) =>
                    setNewPricing({ ...newPricing, price: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50000"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newPricing.is_active}
                  onChange={(e) =>
                    setNewPricing({
                      ...newPricing,
                      is_active: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="is_active"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Kích hoạt giá này
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPricingForm(false);
                    setEditingPricing(null);
                    setNewPricing({
                      battery_model: "",
                      price: "",
                      is_active: true,
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading
                    ? "Đang lưu..."
                    : editingPricing
                    ? "Cập nhật"
                    : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Form Modal */}
      {showTransferForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Tạo lệnh chuyển pin</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);

                  if (
                    !newTransfer.from_station_id ||
                    !newTransfer.battery_id ||
                    !newTransfer.to_station_id ||
                    !newTransfer.transfer_reason
                  ) {
                    toast.error("Vui lòng điền đầy đủ thông tin");
                    return;
                  }

                  if (
                    newTransfer.from_station_id === newTransfer.to_station_id
                  ) {
                    toast.error("Trạm nguồn và trạm đích không thể giống nhau");
                    return;
                  }

                  const createResponse =
                    await batteryTransferService.createBatteryTransfer(
                      newTransfer
                    );
                  console.log("Create transfer response:", createResponse);
                  toast.success("Tạo lệnh chuyển pin thành công");

                  setShowTransferForm(false);
                  setNewTransfer({
                    from_station_id: "",
                    battery_id: "",
                    to_station_id: "",
                    transfer_reason: "",
                    notes: "",
                  });
                  fetchTransfers();
                } catch (error) {
                  console.error("Error creating transfer:", error);
                  toast.error("Lỗi khi tạo lệnh chuyển pin");
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạm nguồn *
                </label>
                <Select
                  value={newTransfer.from_station_id}
                  onValueChange={(value) => {
                    setNewTransfer({
                      ...newTransfer,
                      from_station_id: value,
                      battery_id: "",
                    });
                  }}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Chọn trạm nguồn" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                    {stations.map((station) => (
                      <SelectItem
                        key={station.station_id}
                        value={station.station_id}
                        className="hover:bg-gray-100 focus:bg-gray-100"
                      >
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pin cần chuyển *
                </label>
                <Select
                  value={newTransfer.battery_id}
                  onValueChange={(value) =>
                    setNewTransfer({ ...newTransfer, battery_id: value })
                  }
                  disabled={!newTransfer.from_station_id}
                >
                  <SelectTrigger
                    className={`border-gray-300 ${
                      !newTransfer.from_station_id
                        ? "bg-gray-100 text-gray-400"
                        : "bg-white"
                    }`}
                  >
                    <SelectValue
                      placeholder={
                        !newTransfer.from_station_id
                          ? "Chọn trạm nguồn trước"
                          : "Chọn pin"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                    {batteries
                      .filter(
                        (battery) =>
                          battery.station_id === newTransfer.from_station_id
                      )
                      .map((battery) => (
                        <SelectItem
                          key={battery.battery_id}
                          value={battery.battery_id}
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {battery.battery_code} - {battery.model}
                            </span>
                            <span className="text-xs text-gray-500">
                              {battery.status === "full"
                                ? "🟢 Sẵn sàng"
                                : battery.status === "charging"
                                ? "🔵 Đang sạc"
                                : battery.status === "maintenance"
                                ? "🟡 Bảo trì"
                                : "🔴 Hỏng"}{" "}
                              - {battery.current_charge}%
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {!newTransfer.from_station_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Vui lòng chọn trạm nguồn để xem danh sách pin
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạm đích *
                </label>
                <Select
                  value={newTransfer.to_station_id}
                  onValueChange={(value) =>
                    setNewTransfer({ ...newTransfer, to_station_id: value })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Chọn trạm đích" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                    {stations
                      .filter(
                        (station) =>
                          station.station_id !== newTransfer.from_station_id
                      )
                      .map((station) => (
                        <SelectItem
                          key={station.station_id}
                          value={station.station_id}
                          className="hover:bg-gray-100 focus:bg-gray-100"
                        >
                          {station.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {newTransfer.from_station_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Chỉ hiển thị trạm khác với trạm nguồn
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do chuyển *
                </label>
                <input
                  type="text"
                  required
                  value={newTransfer.transfer_reason}
                  onChange={(e) =>
                    setNewTransfer({
                      ...newTransfer,
                      transfer_reason: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: Cân bằng tồn kho"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={newTransfer.notes}
                  onChange={(e) =>
                    setNewTransfer({ ...newTransfer, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ghi chú thêm (tùy chọn)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferForm(false);
                    setNewTransfer({
                      from_station_id: "",
                      battery_id: "",
                      to_station_id: "",
                      transfer_reason: "",
                      notes: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Đang tạo..." : "Tạo lệnh"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Detail Modal */}
      {showTransferDetail && selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chi tiết chuyển pin</h3>
              <button
                onClick={() => {
                  setShowTransferDetail(false);
                  setSelectedTransfer(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pin
                </label>
                <p className="text-sm">
                  {selectedTransfer.battery?.battery_code} -{" "}
                  {selectedTransfer.battery?.model}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedTransfer.transfer_status === "completed"
                      ? "bg-green-100 text-green-800"
                      : selectedTransfer.transfer_status === "in_transit"
                      ? "bg-blue-100 text-blue-800"
                      : selectedTransfer.transfer_status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedTransfer.transfer_status === "completed"
                    ? "Hoàn thành"
                    : selectedTransfer.transfer_status === "in_transit"
                    ? "Đang vận chuyển"
                    : selectedTransfer.transfer_status === "pending"
                    ? "Chờ duyệt"
                    : "Đã hủy"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ trạm
                </label>
                <p className="text-sm">{selectedTransfer.from_station?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến trạm
                </label>
                <p className="text-sm">{selectedTransfer.to_station?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do
                </label>
                <p className="text-sm">{selectedTransfer.transfer_reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người tạo
                </label>
                <p className="text-sm">
                  {selectedTransfer.transferred_by_user?.full_name || "N/A"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày chuyển
                </label>
                <p className="text-sm">
                  {selectedTransfer.transferred_at
                    ? new Date(selectedTransfer.transferred_at).toLocaleString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "N/A"}
                </p>
              </div>
              {selectedTransfer.completed_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày hoàn thành
                  </label>
                  <p className="text-sm">
                    {new Date(selectedTransfer.completed_at).toLocaleString(
                      "vi-VN",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              )}
            </div>

            {selectedTransfer.notes && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                  {selectedTransfer.notes}
                </p>
              </div>
            )}

            {(selectedTransfer.transfer_status === "pending" ||
              selectedTransfer.transfer_status === "in_transit") && (
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await batteryTransferService.updateBatteryTransferStatus(
                        selectedTransfer.transfer_id,
                        "completed"
                      );
                      toast.success("Đã duyệt chuyển pin thành công");
                      setShowTransferDetail(false);
                      setSelectedTransfer(null);
                      fetchTransfers();
                    } catch (error) {
                      console.error("Error updating transfer:", error);
                      toast.error("Lỗi khi cập nhật trạng thái");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Duyệt hoàn thành
                </button>
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await batteryTransferService.updateBatteryTransferStatus(
                        selectedTransfer.transfer_id,
                        "cancelled"
                      );
                      toast.success("Đã hủy chuyển pin");
                      setShowTransferDetail(false);
                      setSelectedTransfer(null);
                      fetchTransfers();
                    } catch (error) {
                      console.error("Error cancelling transfer:", error);
                      toast.error("Lỗi khi hủy chuyển pin");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Hủy chuyển
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Battery Detail Modal */}
      {showBatteryDetailModal && selectedBatteryForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chi tiết pin</h3>
              <button
                onClick={() => {
                  setShowBatteryDetailModal(false);
                  setSelectedBatteryForDetail(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã pin
                </label>
                <p className="text-sm">
                  {selectedBatteryForDetail.battery_code}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mẫu pin
                </label>
                <p className="text-sm">{selectedBatteryForDetail.model}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedBatteryForDetail.status === "full"
                      ? "bg-green-100 text-green-800"
                      : selectedBatteryForDetail.status === "charging"
                      ? "bg-blue-100 text-blue-800"
                      : selectedBatteryForDetail.status === "maintenance"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedBatteryForDetail.status === "full"
                    ? "Sẵn sàng"
                    : selectedBatteryForDetail.status === "charging"
                    ? "Đang sạc"
                    : selectedBatteryForDetail.status === "maintenance"
                    ? "Bảo trì"
                    : "Hỏng"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sức khỏe pin
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        selectedBatteryForDetail.health_percentage > 80
                          ? "bg-green-500"
                          : selectedBatteryForDetail.health_percentage > 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        width: `${selectedBatteryForDetail.health_percentage}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {selectedBatteryForDetail.health_percentage}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số chu kỳ sạc
                </label>
                <p className="text-sm">
                  {selectedBatteryForDetail.cycle_count || 0} chu kỳ
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày tạo
                </label>
                <p className="text-sm">
                  {selectedBatteryForDetail.created_at
                    ? new Date(
                        selectedBatteryForDetail.created_at
                      ).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Health Batteries Modal */}
      {showLowHealthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Pin cần bảo trì (Sức khỏe &lt; {healthThreshold}%)
              </h3>
              <button
                onClick={() => setShowLowHealthModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Ngưỡng sức khỏe:
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={healthThreshold}
                  onChange={(e) => setHealthThreshold(Number(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-sm text-gray-600">%</span>
                <button
                  onClick={fetchLowHealthBatteries}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-96">
              {lowHealthBatteries.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">
                    Tất cả pin đều khỏe mạnh!
                  </p>
                  <p className="text-gray-400 text-sm">
                    Không có pin nào có sức khỏe dưới {healthThreshold}%
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-medium text-gray-700">
                          Mã pin
                        </th>
                        <th className="text-left p-3 font-medium text-gray-700">
                          Mẫu
                        </th>
                        <th className="text-left p-3 font-medium text-gray-700">
                          Trạm
                        </th>
                        <th className="text-left p-3 font-medium text-gray-700">
                          Sức khỏe
                        </th>
                        <th className="text-left p-3 font-medium text-gray-700">
                          Chu kỳ
                        </th>
                        <th className="text-right p-3 font-medium text-gray-700">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowHealthBatteries.map((battery) => (
                        <tr
                          key={battery.battery_id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Battery className="h-4 w-4 text-red-500" />
                              <span className="font-medium">
                                {battery.battery_code}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">{battery.model}</td>
                          <td className="p-3">
                            {battery.station?.name || "N/A"}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full"
                                  style={{
                                    width: `${battery.health_percentage}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-red-600">
                                {battery.health_percentage}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3">{battery.cycle_count}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedBatteryForDetail(battery);
                                  setShowBatteryDetailModal(true);
                                  setShowLowHealthModal(false);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                title="Chi tiết"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingBattery(battery);
                                  setEditBattery({
                                    station_id: battery.station_id,
                                    model: battery.model,
                                    battery_code: battery.battery_code,
                                    status: battery.status as any,
                                    health_percentage:
                                      battery.health_percentage,
                                    cycle_count: battery.cycle_count,
                                  });
                                  setShowEditBatteryModal(true);
                                  setShowLowHealthModal(false);
                                }}
                                className="p-2 text-amber-600 hover:bg-amber-100 rounded"
                                title="Bảo trì"
                              >
                                <Wrench className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Battery Modal */}
      {showAddBatteryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Thêm pin mới</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  await adminBatteryService.createBattery(newBattery);
                  toast.success("Thêm pin thành công");
                  setShowAddBatteryModal(false);
                  setNewBattery({
                    station_id: "",
                    model: "",
                    battery_code: "",
                    status: "full",
                    health_percentage: 100,
                    cycle_count: 0,
                  });
                  fetchWarehouseData();
                } catch (error) {
                  console.error("Error creating battery:", error);
                  toast.error("Lỗi khi thêm pin");
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạm *
                </label>
                <Select
                  value={newBattery.station_id}
                  onValueChange={(value) =>
                    setNewBattery({ ...newBattery, station_id: value })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Chọn trạm" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {stations.map((station) => (
                      <SelectItem
                        key={station.station_id}
                        value={station.station_id}
                        className="hover:bg-gray-100"
                      >
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã pin *
                </label>
                <input
                  type="text"
                  required
                  value={newBattery.battery_code}
                  onChange={(e) =>
                    setNewBattery({
                      ...newBattery,
                      battery_code: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="BAT001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mẫu pin *
                </label>
                <input
                  type="text"
                  required
                  value={newBattery.model}
                  onChange={(e) =>
                    setNewBattery({ ...newBattery, model: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  placeholder="Tesla Model 3 - 75kWh"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <Select
                  value={newBattery.status}
                  onValueChange={(value) =>
                    setNewBattery({ ...newBattery, status: value as any })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="full" className="hover:bg-gray-100">
                      Sẵn sàng
                    </SelectItem>
                    <SelectItem value="reserved" className="hover:bg-gray-100">
                      Đã giữ chỗ
                    </SelectItem>
                    <SelectItem value="charging" className="hover:bg-gray-100">
                      Đang sạc
                    </SelectItem>
                    <SelectItem value="in_use" className="hover:bg-gray-100">
                      Đang sử dụng
                    </SelectItem>
                    <SelectItem
                      value="maintenance"
                      className="hover:bg-gray-100"
                    >
                      Bảo trì
                    </SelectItem>
                    <SelectItem value="damaged" className="hover:bg-gray-100">
                      Hỏng
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sức khỏe (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newBattery.health_percentage}
                    onChange={(e) =>
                      setNewBattery({
                        ...newBattery,
                        health_percentage: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chu kỳ sạc
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newBattery.cycle_count}
                    onChange={(e) =>
                      setNewBattery({
                        ...newBattery,
                        cycle_count: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBatteryModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Đang thêm..." : "Thêm pin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Battery Modal */}
      {showEditBatteryModal && editingBattery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Chỉnh sửa pin</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoading(true);
                  await adminBatteryService.updateBattery(
                    editingBattery.battery_id,
                    editBattery
                  );
                  toast.success("Cập nhật pin thành công");
                  setShowEditBatteryModal(false);
                  setEditingBattery(null);
                  setEditBattery({
                    station_id: "",
                    model: "",
                    battery_code: "",
                    status: "full",
                    health_percentage: 100,
                    cycle_count: 0,
                  });
                  fetchWarehouseData();
                } catch (error) {
                  console.error("Error updating battery:", error);
                  toast.error("Lỗi khi cập nhật pin");
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã pin
                </label>
                <input
                  type="text"
                  value={editBattery.battery_code}
                  onChange={(e) =>
                    setEditBattery({
                      ...editBattery,
                      battery_code: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mẫu pin
                </label>
                <input
                  type="text"
                  value={editBattery.model}
                  onChange={(e) =>
                    setEditBattery({ ...editBattery, model: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <Select
                  value={editBattery.status}
                  onValueChange={(value) =>
                    setEditBattery({ ...editBattery, status: value as any })
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="full" className="hover:bg-gray-100">
                      Sẵn sàng
                    </SelectItem>
                    <SelectItem value="reserved" className="hover:bg-gray-100">
                      Đã giữ chỗ
                    </SelectItem>
                    <SelectItem value="charging" className="hover:bg-gray-100">
                      Đang sạc
                    </SelectItem>
                    <SelectItem value="in_use" className="hover:bg-gray-100">
                      Đang sử dụng
                    </SelectItem>
                    <SelectItem
                      value="maintenance"
                      className="hover:bg-gray-100"
                    >
                      Bảo trì
                    </SelectItem>
                    <SelectItem value="damaged" className="hover:bg-gray-100">
                      Hỏng
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sức khỏe (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editBattery.health_percentage}
                    onChange={(e) =>
                      setEditBattery({
                        ...editBattery,
                        health_percentage: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chu kỳ sạc
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editBattery.cycle_count}
                    onChange={(e) =>
                      setEditBattery({
                        ...editBattery,
                        cycle_count: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBatteryModal(false);
                    setEditingBattery(null);
                    setEditBattery({
                      station_id: "",
                      model: "",
                      battery_code: "",
                      status: "full",
                      health_percentage: 100,
                      cycle_count: 0,
                    });
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Battery History Modal */}
      {showBatteryHistoryModal && selectedBatteryForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Lịch sử chuyển pin: {selectedBatteryForDetail.battery_code}
              </h3>
              <button
                onClick={() => {
                  setShowBatteryHistoryModal(false);
                  setSelectedBatteryForDetail(null);
                  setBatteryHistory([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-96">
              {batteryHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">
                    Chưa có lịch sử chuyển pin
                  </p>
                  <p className="text-gray-400 text-sm">
                    Pin này chưa được chuyển giữa các trạm
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batteryHistory.map((record, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">
                              {record.from_station?.name} →{" "}
                              {record.to_station?.name}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                record.transfer_status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : record.transfer_status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {record.transfer_status === "completed"
                                ? "Hoàn thành"
                                : record.transfer_status === "pending"
                                ? "Chờ duyệt"
                                : "Đã hủy"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Lý do:</strong> {record.transfer_reason}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Người thực hiện:</strong>{" "}
                            {record.transferred_by_user?.full_name || "N/A"}
                          </p>
                          {record.notes && (
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Ghi chú:</strong> {record.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {new Date(record.transferred_at).toLocaleString(
                            "vi-VN"
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Pricing Confirmation Dialog */}
      <AlertDialog
        open={deletePricingDialogOpen}
        onOpenChange={setDeletePricingDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Xác nhận xóa giá pin
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa giá pin này? Hành động này không thể hoàn
              tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePricing}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Transfer Confirmation Dialog */}
      <AlertDialog
        open={cancelTransferDialogOpen}
        onOpenChange={setCancelTransferDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-orange-600" />
              Xác nhận hủy lệnh chuyển pin
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn hủy lệnh chuyển pin này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTransfer}
              className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
            >
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Battery Confirmation Dialog */}
      <AlertDialog
        open={deleteBatteryDialogOpen}
        onOpenChange={setDeleteBatteryDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Xác nhận xóa pin
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa pin{" "}
              <span className="font-semibold">{batteryToDelete?.code}</span>?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBattery}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BatteryPricingManagement;
