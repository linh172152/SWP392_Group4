import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Zap,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { vehicleService, type Vehicle, type CreateVehicleData } from '../../services/vehicle.service';
import { Alert, AlertDescription } from '../ui/alert';

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateVehicleData>({
    license_plate: "",
    vehicle_type: "MOTORBIKE",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    battery_capacity: 0,
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
    try {
      setError("");
      await vehicleService.addVehicle(formData);
      await fetchVehicles();
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm xe");
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;
    
    try {
      setError("");
      await vehicleService.updateVehicle(editingVehicle.vehicle_id, formData);
      await fetchVehicles();
      setEditingVehicle(null);
      setShowAddForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật xe");
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
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      battery_capacity: vehicle.battery_capacity,
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
    });
    setEditingVehicle(null);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    resetForm();
    setError("");
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
                        {vehicle.brand} {vehicle.model}
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
                      <div className="p-3 glass rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Loại xe</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {vehicle.vehicle_type === "MOTORBIKE" ? "Xe máy" : vehicle.vehicle_type === "CAR" ? "Ô tô" : "Xe tải"}
                          </span>
                        </div>
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



      {/* Add/Edit Vehicle Form */}
      {showAddForm && (
        <Card className="glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">
              {editingVehicle ? "Chỉnh sửa xe" : "Thêm xe mới"}
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Nhập thông tin xe để đăng ký sử dụng dịch vụ thay pin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingVehicle ? handleUpdateVehicle : handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="license_plate" className="text-slate-700 dark:text-slate-300">
                    Biển số xe <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="license_plate" 
                    placeholder="30A-12345" 
                    value={formData.license_plate}
                    onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                    required
                    className="glass border-slate-200/50 dark:border-slate-700/50" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_type" className="text-slate-700 dark:text-slate-300">
                    Loại xe <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.vehicle_type} 
                    onValueChange={(value: "MOTORBIKE" | "CAR" | "TRUCK") => 
                      setFormData({...formData, vehicle_type: value})
                    }
                  >
                    <SelectTrigger className="glass border-slate-200/50 dark:border-slate-700/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOTORBIKE">Xe máy</SelectItem>
                      <SelectItem value="CAR">Ô tô</SelectItem>
                      <SelectItem value="TRUCK">Xe tải</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-slate-700 dark:text-slate-300">
                    Hãng xe <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="brand" 
                    placeholder="Tesla, BYD, VinFast..." 
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    required
                    className="glass border-slate-200/50 dark:border-slate-700/50" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-slate-700 dark:text-slate-300">
                    Mẫu xe <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    id="model" 
                    placeholder="Model 3, Tang EV..." 
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    required
                    className="glass border-slate-200/50 dark:border-slate-700/50" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year" className="text-slate-700 dark:text-slate-300">
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
                    className="glass border-slate-200/50 dark:border-slate-700/50" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="battery_capacity" className="text-slate-700 dark:text-slate-300">
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
                    className="glass border-slate-200/50 dark:border-slate-700/50" 
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button type="submit" className="gradient-primary text-white shadow-lg">
                  {editingVehicle ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm xe
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleCancelForm} 
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                >
                  Hủy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VehicleManagement;