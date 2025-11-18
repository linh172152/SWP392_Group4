import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Car, Plus, Edit, Trash2, Zap } from "lucide-react";
import API_ENDPOINTS, { fetchWithAuth } from "../../config/api";
import { useNavigate } from "react-router-dom";

interface VehicleItem {
  vehicle_id: string;
  license_plate: string;
  vehicle_type: string;
  make?: string;
  model?: string;
  year?: number;
  battery_model: string;
  current_battery_code?: string;
  current_battery?: {
    battery_id: string;
    battery_code: string;
    status: string;
    current_charge?: number;
  };
  image?: string;
  totalSwaps?: number;
}

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    make: "",
    model: "",
    year: "",
    license_plate: "",
    battery_model: "",
    current_battery_code: "",
    vehicle_type: "car",
  });
  // Thêm mới: dùng biến form
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    license_plate: "",
    vehicle_type: "car",
    battery_model: "",
    current_battery_code: "",
  });

  const getDaysSinceLastSwap = (lastSwapDate?: string) => {
    if (!lastSwapDate) return undefined;
    const today = new Date();
    const lastSwap = new Date(lastSwapDate);
    const diffTime = Math.abs(today.getTime() - lastSwap.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const loadVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.DRIVER.VEHICLES);
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Tải danh sách xe thất bại");
      console.log("[VehicleManagement] Loaded vehicles:", data.data);
      // Log current_battery info for each vehicle
      data.data.forEach((v: VehicleItem) => {
        console.log(`[VehicleManagement] Vehicle ${v.license_plate}:`, {
          current_battery_id: (v as any).current_battery_id,
          current_battery: v.current_battery,
          current_battery_code: v.current_battery_code,
        });
      });
      setVehicles(data.data);
    } catch (e: any) {
      setError(e.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = async () => {
    setLoading(true);
    setError("");
    try {
      if (!form.current_battery_code?.trim()) {
        setError("Vui lòng nhập mã pin hiện tại (bắt buộc)");
        setLoading(false);
        return;
      }
      const body = {
        license_plate: form.license_plate,
        vehicle_type: form.vehicle_type,
        battery_model: form.battery_model,
        current_battery_code: form.current_battery_code.trim(),
        make: form.make || undefined,
        model: form.model || undefined,
        year: form.year ? Number(form.year) : undefined,
      };
      console.log("[VehicleManagement] Adding vehicle with body:", body);
      const res = await fetchWithAuth(API_ENDPOINTS.DRIVER.VEHICLES, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log("[VehicleManagement] Add vehicle response:", data);
      if (!res.ok || !data.success)
        throw new Error(data.message || "Thêm xe thất bại");

      // Log the created vehicle data
      if (data.data) {
        console.log("[VehicleManagement] Created vehicle:", {
          vehicle_id: data.data.vehicle_id,
          license_plate: data.data.license_plate,
          current_battery_id: data.data.current_battery_id,
          current_battery: data.data.current_battery,
        });
      }

      setShowAddForm(false);
      setForm({
        make: "",
        model: "",
        year: "",
        license_plate: "",
        vehicle_type: "car",
        battery_model: "",
        current_battery_code: "",
      });
      await loadVehicles();
    } catch (e: any) {
      console.error("[VehicleManagement] Error adding vehicle:", e);
      setError(e.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    if (!confirm("Bạn có chắc muốn xóa xe này?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(
        `${API_ENDPOINTS.DRIVER.VEHICLES}/${vehicleId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Xóa xe thất bại");
      await loadVehicles();
    } catch (e: any) {
      const msg = e.message || "Có lỗi xảy ra";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (vehicle: VehicleItem) => {
    console.log("[VehicleManagement] startEdit - vehicle data:", {
      vehicle_id: vehicle.vehicle_id,
      license_plate: vehicle.license_plate,
      current_battery: vehicle.current_battery,
      current_battery_id: (vehicle as any).current_battery_id,
      current_battery_code: vehicle.current_battery_code,
    });
    setEditingId(vehicle.vehicle_id);
    const batteryCode =
      vehicle.current_battery?.battery_code ||
      vehicle.current_battery_code ||
      "";
    console.log(
      "[VehicleManagement] startEdit - extracted battery_code:",
      batteryCode
    );
    setEditForm({
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year ? String(vehicle.year) : "",
      license_plate: vehicle.license_plate,
      battery_model: vehicle.battery_model,
      current_battery_code: batteryCode,
      vehicle_type: "car",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      make: "",
      model: "",
      year: "",
      license_plate: "",
      battery_model: "",
      current_battery_code: "",
      vehicle_type: "car",
    });
  };

  const updateVehicle = async (vehicleId: string) => {
    setLoading(true);
    setError("");
    try {
      const body = {
        license_plate: editForm.license_plate,
        make: editForm.make || undefined,
        model: editForm.model || undefined,
        year: editForm.year ? Number(editForm.year) : undefined,
        battery_model: editForm.battery_model,
        current_battery_code: editForm.current_battery_code.trim() || undefined,
        vehicle_type: "car",
      };
      const res = await fetchWithAuth(
        `${API_ENDPOINTS.DRIVER.VEHICLES}/${vehicleId}`,
        { method: "PUT", body: JSON.stringify(body) }
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Cập nhật xe thất bại");
      setEditingId(null);
      setEditForm({
        make: "",
        model: "",
        year: "",
        license_plate: "",
        battery_model: "",
        current_battery_code: "",
        vehicle_type: "car",
      });
      await loadVehicles();
    } catch (e: any) {
      setError(e.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Auto-refresh khi user quay lại trang (focus vào window)
  useEffect(() => {
    const handleFocus = () => {
      loadVehicles();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
            Xe của tôi
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Quản lý thông tin xe và lịch sử thay pin
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
          disabled={loading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Xe
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">
          {error}
          {error.toLowerCase().includes("active bookings") && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/driver/bookings")}
              >
                Xem các đơn đang hoạt động
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 gradient-primary rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Tổng số xe
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {vehicles.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Tổng lần thay pin
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {vehicles.reduce((sum, _v) => sum + 0, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicles.map((vehicle) => {
          if (editingId === vehicle.vehicle_id) {
            // SHOW EDIT FORM
            return (
              <Card
                key={vehicle.vehicle_id}
                className="glass-card border-0 glow-hover group"
              >
                <CardContent className="p-6">
                  <div className="flex-col space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hãng xe</Label>
                        <Input
                          value={editForm.make}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, make: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mẫu xe</Label>
                        <Input
                          value={editForm.model}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              model: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Năm sản xuất</Label>
                        <Input
                          type="number"
                          value={editForm.year}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, year: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Biển số xe</Label>
                        <Input
                          value={editForm.license_plate}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              license_plate: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Model Pin</Label>
                        <Input
                          value={editForm.battery_model}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              battery_model: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Mã Pin hiện tại</Label>
                        <Input
                          value={editForm.current_battery_code}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              current_battery_code: e.target.value,
                            }))
                          }
                          placeholder="VD: BAT-TD-007"
                          className="bg-white dark:bg-slate-800"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Loại xe</Label>
                        <Input value="car" disabled />
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button
                        className="gradient-primary text-white"
                        onClick={() => updateVehicle(vehicle.vehicle_id)}
                        disabled={loading}
                      >
                        Lưu
                      </Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        Hủy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          // XÓA các thống kê dư, chỉ hiển thị đúng thông tin xe mà BE có
          return (
            <Card
              key={vehicle.vehicle_id}
              className="glass-card border-0 glow-hover group"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={
                        "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=300&q=60"
                      }
                      alt="Car"
                      className="w-24 h-24 object-cover rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {vehicle.make || "EV"} {vehicle.model || ""}
                    </h3>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                      <div>Biển số: {vehicle.license_plate}</div>
                      <div>Model pin: {vehicle.battery_model}</div>
                      {(() => {
                        const batteryCode =
                          vehicle.current_battery?.battery_code ||
                          vehicle.current_battery_code;
                        return batteryCode ? (
                          <div className="text-slate-700 dark:text-slate-300">
                            Mã Pin hiện tại:{" "}
                            <span className="font-mono font-semibold text-slate-900 dark:text-white">
                              {batteryCode}
                            </span>
                          </div>
                        ) : null;
                      })()}
                      <div>Loại xe: {vehicle.vehicle_type || "car"}</div>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass border-blue-200/50 dark:border-purple-400/30 hover:bg-blue-50/50 dark:hover:bg-purple-500/10"
                        onClick={() => startEdit(vehicle)}
                        disabled={loading}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10"
                        onClick={() => deleteVehicle(vehicle.vehicle_id)}
                        disabled={loading}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAddForm && (
        <Card className="glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">
              Thêm xe mới
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Nhập thông tin xe để đăng ký sử dụng dịch vụ thay pin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="make"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Hãng xe
                </Label>
                <Input
                  id="make"
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  placeholder="Tesla, BYD, VinFast..."
                  className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="model"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Mẫu xe
                </Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Model 3, Tang EV..."
                  className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="year"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Năm sản xuất
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="2023"
                  className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="plate"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Biển số xe
                </Label>
                <Input
                  id="plate"
                  value={form.license_plate}
                  onChange={(e) =>
                    setForm({ ...form, license_plate: e.target.value })
                  }
                  placeholder="30A-12345"
                  className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="bmodel"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Model Pin
                </Label>
                <Input
                  id="bmodel"
                  value={form.battery_model}
                  onChange={(e) =>
                    setForm({ ...form, battery_model: e.target.value })
                  }
                  placeholder="VD: Standard-75kWh"
                  className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="battery_code"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Mã Pin hiện tại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="battery_code"
                  value={form.current_battery_code}
                  onChange={(e) =>
                    setForm({ ...form, current_battery_code: e.target.value })
                  }
                  placeholder="VD: BAT-TD-007"
                  className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="vtype"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Loại xe
                </Label>
                <Input
                  id="vtype"
                  value={form.vehicle_type}
                  disabled
                  className="bg-white dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
            </div>
            <div className="flex space-x-4 pt-4">
              <Button
                className="gradient-primary text-white shadow-lg"
                onClick={addVehicle}
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm xe
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                className="glass border-slate-200/50 dark:border-slate-700/50"
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VehicleManagement;
