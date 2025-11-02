import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { vehicleService, type Vehicle, type CreateVehicleData } from '../../services/vehicle.service';

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateVehicleData>({
    license_plate: "",
    vehicle_type: "MOTORBIKE",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    battery_capacity: 0,
    battery_model: "",
  });

  // Fetch vehicles khi component mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách xe");
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      setError("");
      setSuccess("");
      await vehicleService.addVehicle(formData);
      await fetchVehicles();
      setSuccess("Đã thêm xe thành công!");
      setTimeout(() => {
        setShowAddForm(false);
        resetForm();
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm xe");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    setSubmitting(true);
    try {
      setError("");
      setSuccess("");
      await vehicleService.updateVehicle(editingVehicle.vehicle_id, formData);
      await fetchVehicles();
      setSuccess("Đã cập nhật xe thành công!");
      setTimeout(() => {
        setEditingVehicle(null);
        setShowAddForm(false);
        resetForm();
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật xe");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa xe này?")) return;

    try {
      setError("");
      await vehicleService.deleteVehicle(vehicleId);
      await fetchVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa xe");
    }
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      license_plate: vehicle.license_plate,
      vehicle_type: vehicle.vehicle_type,
      brand: vehicle.brand || vehicle.make || "",
      model: vehicle.model || "",
      year: vehicle.year,
      battery_capacity: vehicle.battery_capacity,
      battery_model: vehicle.battery_model || "",
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      license_plate: "",
      vehicle_type: "MOTORBIKE",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      battery_capacity: 0,
      battery_model: "",
    });
    setEditingVehicle(null);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    resetForm();
    setError("");
    setSuccess("");
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-lime-500" />
          <p className="mt-2 text-slate-600 dark:text-slate-400">Đang tải danh sách xe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">Xe của tôi</h1>
          <p className="text-slate-600 dark:text-slate-300">Quản lý thông tin xe và lịch sử thay pin</p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }} 
          className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Xe
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 gradient-primary rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tổng số xe</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{vehicles.length}</p>
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Xe đã đăng ký</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{vehicles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      {vehicles.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Car className="h-16 w-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Chưa có xe nào
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Thêm xe đầu tiên của bạn để bắt đầu sử dụng dịch vụ
            </p>
            <Button 
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="gradient-primary text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm Xe Ngay
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.vehicle_id} className="glass-card border-0 glow-hover group">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-4 gradient-primary rounded-lg">
                    <Car className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {vehicle.make || vehicle.brand} {vehicle.model}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <span>Biển số: {vehicle.license_plate}</span>
                        {vehicle.year && (
                          <>
                            <span>•</span>
                            <span>{vehicle.year}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Thông tin xe */}
                    <div className="space-y-2">
                      <div className="p-3 glass rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Loại xe</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {vehicle.vehicle_type === "MOTORBIKE" || vehicle.vehicle_type === "motorbike" ? "Xe máy" : vehicle.vehicle_type === "CAR" || vehicle.vehicle_type === "car" ? "Ô tô" : "Xe tải"}
                          </span>
                        </div>
                        {vehicle.battery_model && (
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Loại pin</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {vehicle.battery_model}
                            </span>
                          </div>
                        )}
                        {vehicle.battery_capacity && vehicle.battery_capacity > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 dark:text-slate-400">Dung lượng pin</span>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {vehicle.battery_capacity} kWh
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditClick(vehicle)}
                        className="glass border-blue-200/50 dark:border-purple-400/30 hover:bg-blue-50/50 dark:hover:bg-purple-500/10"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Sửa
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.vehicle_id)}
                        className="glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}



      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="glass-card border-0 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent flex items-center gap-2">
              <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              {editingVehicle ? "Chỉnh sửa thông tin xe" : "Thêm xe mới"}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              {editingVehicle 
                ? "Cập nhật thông tin xe của bạn để tiếp tục sử dụng dịch vụ"
                : "Nhập đầy đủ thông tin xe để đăng ký sử dụng dịch vụ thay pin"
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={editingVehicle ? handleUpdateVehicle : handleAddVehicle} className="space-y-6 py-4">
            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50/50 dark:bg-green-900/20 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert className="border-red-200 bg-red-50/50 dark:bg-red-900/20 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Biển số xe - Full width */}
            <div className="space-y-2">
              <Label htmlFor="license_plate" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Biển số xe <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="license_plate" 
                placeholder="Ví dụ: 30A-12345, 51B-67890" 
                value={formData.license_plate}
                onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                required
                disabled={submitting}
                className="glass border-slate-200/50 dark:border-slate-700/50 h-11 text-base" 
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập biển số xe chính xác theo giấy tờ đăng ký
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loại xe */}
              <div className="space-y-2">
                <Label htmlFor="vehicle_type" className="text-slate-700 dark:text-slate-300 font-medium">
                  Loại xe <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.vehicle_type} 
                  onValueChange={(value: "MOTORBIKE" | "CAR" | "TRUCK") => setFormData({...formData, vehicle_type: value})}
                  disabled={submitting}
                >
                  <SelectTrigger className="glass border-slate-200/50 dark:border-slate-700/50 h-11">
                    <SelectValue placeholder="Chọn loại xe" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-0">
                    <SelectItem value="MOTORBIKE">🏍️ Xe máy</SelectItem>
                    <SelectItem value="CAR">🚗 Ô tô</SelectItem>
                    <SelectItem value="TRUCK">🚚 Xe tải</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hãng xe */}
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-slate-700 dark:text-slate-300 font-medium">
                  Hãng xe
                </Label>
                <Input 
                  id="brand" 
                  placeholder="Ví dụ: Honda, Toyota, VinFast" 
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  disabled={submitting}
                  className="glass border-slate-200/50 dark:border-slate-700/50 h-11" 
                />
              </div>

              {/* Dòng xe */}
              <div className="space-y-2">
                <Label htmlFor="model" className="text-slate-700 dark:text-slate-300 font-medium">
                  Dòng xe
                </Label>
                <Input 
                  id="model" 
                  placeholder="Ví dụ: Vision, Vios, VF8" 
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  disabled={submitting}
                  className="glass border-slate-200/50 dark:border-slate-700/50 h-11" 
                />
              </div>

              {/* Năm sản xuất */}
              <div className="space-y-2">
                <Label htmlFor="year" className="text-slate-700 dark:text-slate-300 font-medium">
                  Năm sản xuất
                </Label>
                <Input 
                  id="year" 
                  type="number" 
                  placeholder="2024" 
                  value={formData.year || ""}
                  onChange={(e) => setFormData({...formData, year: e.target.value ? parseInt(e.target.value) : undefined})}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  disabled={submitting}
                  className="glass border-slate-200/50 dark:border-slate-700/50 h-11" 
                />
              </div>

              {/* Dung lượng pin */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="battery_capacity" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  Dung lượng pin (kWh)
                </Label>
                <Input 
                  id="battery_capacity" 
                  type="number" 
                  placeholder="75" 
                  value={formData.battery_capacity || ""}
                  onChange={(e) => setFormData({...formData, battery_capacity: e.target.value ? parseFloat(e.target.value) : undefined})}
                  min="0"
                  step="0.1"
                  disabled={submitting}
                  className="glass border-slate-200/50 dark:border-slate-700/50 h-11" 
                />
              </div>
            </div>

            {/* Loại pin - Full width */}
            <div className="space-y-2">
              <Label htmlFor="battery_model" className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Loại pin <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="battery_model" 
                placeholder="Ví dụ: Standard 60kWh, Long Range 100kWh, Performance Plus" 
                value={formData.battery_model || ""}
                onChange={(e) => setFormData({...formData, battery_model: e.target.value})}
                required
                disabled={submitting}
                className="glass border-slate-200/50 dark:border-slate-700/50 h-11 text-base" 
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập loại pin tương thích với xe của bạn (ví dụ: Standard 60kWh, Long Range, Performance)
              </p>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleCancelForm} 
                disabled={submitting}
                className="glass border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="mr-2 h-4 w-4" />
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[140px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : editingVehicle ? (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Cập nhật xe
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm xe mới
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehicleManagement;