import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Zap
} from 'lucide-react';

// Dữ liệu xe mẫu - chỉ thông tin liên quan đến thay pin
const mockVehicles = [
  {
    id: '1',
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    licensePlate: '30A-12345',
    batteryType: 'Tiêu chuẩn (75 kWh)',
    lastSwapDate: '2024-01-13',
    lastSwapLocation: 'Trung tâm EV Thành phố',
    totalSwaps: 47,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXNsYSUyMG1vZGVsJTIwM3xlbnwwfHx8fDE3NTk3MTM5MjF8MA&ixlib=rb-4.1.0&q=80&w=300'
  },
  {
    id: '2',
    make: 'BYD',
    model: 'Tang EV',
    year: 2022,
    licensePlate: '51B-67890',
    batteryType: 'Tầm xa (100 kWh)',
    lastSwapDate: '2024-01-06',
    lastSwapLocation: 'Trạm Trung tâm Thương mại',
    totalSwaps: 23,
    image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxieWQlMjBjYXJ8ZW58MHx8fHwxNzU5NzEzOTIxfDA&ixlib=rb-4.1.0&q=80&w=300'
  }
];

const VehicleManagement: React.FC = () => {
  const [vehicles, setVehicles] = useState(mockVehicles);
  const [showAddForm, setShowAddForm] = useState(false);

  // Tính số ngày từ lần thay cuối
  const getDaysSinceLastSwap = (lastSwapDate: string) => {
    const today = new Date();
    const lastSwap = new Date(lastSwapDate);
    const diffTime = Math.abs(today.getTime() - lastSwap.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">Xe của tôi</h1>
          <p className="text-slate-600 dark:text-slate-300">Quản lý thông tin xe và lịch sử thay pin</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="mr-2 h-4 w-4" />
          Thêm Xe
        </Button>
      </div>

      {/* Stats chỉ liên quan đến thay pin */}
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
                <p className="text-sm text-slate-600 dark:text-slate-400">Tổng lần thay pin</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{vehicles.reduce((sum, v) => sum + v.totalSwaps, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List - chỉ thông tin thay pin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicles.map((vehicle) => {
          const daysSinceSwap = getDaysSinceLastSwap(vehicle.lastSwapDate);
          
          return (
            <Card key={vehicle.id} className="glass-card border-0 glow-hover group">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img 
                      src={vehicle.image} 
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="w-24 h-24 object-cover rounded-lg shadow-lg"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <span>Biển số: {vehicle.licensePlate}</span>
                        <span>•</span>
                        <span>{vehicle.year}</span>
                      </div>
                    </div>

                    {/* Thông tin thay pin */}
                    <div className="space-y-2">
                      <div className="p-3 glass rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Lần thay cuối</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {daysSinceSwap} ngày trước
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Tại</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {vehicle.lastSwapLocation}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 glass rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Tổng số lần thay</span>
                          <span className="text-lg font-bold gradient-primary bg-clip-text text-transparent">
                            {vehicle.totalSwaps} lần
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button variant="outline" size="sm" className="glass border-blue-200/50 dark:border-purple-400/30 hover:bg-blue-50/50 dark:hover:bg-purple-500/10">
                        <Edit className="mr-1 h-3 w-3" />
                        Chỉnh sửa
                      </Button>
                      <Button variant="outline" size="sm" className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10">
                        <Zap className="mr-1 h-3 w-3" />
                        Lịch sử thay
                      </Button>
                      <Button variant="outline" size="sm" className="glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10">
                        <Trash2 className="mr-1 h-3 w-3" />
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



      {/* Add Vehicle Form */}
      {showAddForm && (
        <Card className="glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Thêm xe mới</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Nhập thông tin xe để đăng ký sử dụng dịch vụ thay pin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make" className="text-slate-700 dark:text-slate-300">Hãng xe</Label>
                <Input id="make" placeholder="Tesla, BYD, VinFast..." className="glass border-slate-200/50 dark:border-slate-700/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model" className="text-slate-700 dark:text-slate-300">Mẫu xe</Label>
                <Input id="model" placeholder="Model 3, Tang EV..." className="glass border-slate-200/50 dark:border-slate-700/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year" className="text-slate-700 dark:text-slate-300">Năm sản xuất</Label>
                <Input id="year" type="number" placeholder="2023" className="glass border-slate-200/50 dark:border-slate-700/50" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="plate" className="text-slate-700 dark:text-slate-300">Biển số xe</Label>
                <Input id="plate" placeholder="30A-12345" className="glass border-slate-200/50 dark:border-slate-700/50" />
              </div>
            </div>
            <div className="flex space-x-4 pt-4">
              <Button className="gradient-primary text-white shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                Thêm xe
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="glass border-slate-200/50 dark:border-slate-700/50">
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