import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  MapPin, 
  Search, 
  Navigation, 
  Battery, 
  Clock, 
  Star,
  Filter,
  Zap,
  Car,
  Calendar
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

// Mock data
const nearbyStations = [
  {
    id: '1',
    name: 'Trung tâm EV Trung tâm',
    address: '123 Đường Chính, Trung tâm',
    distance: '0.5 km',
    availableBatteries: 8,
    totalBatteries: 12,
    rating: 4.8,
    reviews: 245,
    operatingHours: '24/7',
    batteryTypes: ['Tiêu chuẩn', 'Cao cấp'],
    estimatedWait: '< 5 phút',
    image: 'https://images.unsplash.com/photo-1672542128826-5f0d578713d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb258ZW58MXx8fHwxNzU5NzEzOTIxfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '2',
    name: 'Trạm Trung tâm Thương mại',
    address: '456 Đại lộ Trung tâm Mua sắm',
    distance: '1.1 km',
    availableBatteries: 15,
    totalBatteries: 20,
    rating: 4.6,
    reviews: 189,
    operatingHours: '6 AM - 11 PM',
    batteryTypes: ['Tiêu chuẩn', 'Cao cấp', 'Tầm xa'],
    estimatedWait: '3 phút',
    image: 'https://images.unsplash.com/photo-1672542128826-5f0d578713d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb258ZW58MXx8fHwxNzU5NzEzOTIxfDA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '3',
    name: 'Trạm Nghỉ Cao tốc',
    address: 'Cao tốc A1 hướng Bắc Km 42',
    distance: '1.9 km',
    availableBatteries: 6,
    totalBatteries: 16,
    rating: 4.4,
    reviews: 156,
    operatingHours: '24/7',
    batteryTypes: ['Tiêu chuẩn', 'Cao cấp'],
    estimatedWait: '7 phút',
    image: 'https://images.unsplash.com/photo-1672542128826-5f0d578713d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb258ZW58MXx8fHwxNzU5NzEzOTIxfDA&ixlib=rb-4.1.0&q=80&w=1080'
  }
];

// Bỏ quickStats - không liên quan trực tiếp đến việc tìm trạm thay pin

const DriverHome: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const getAvailabilityColor = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityBg = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage >= 70) return 'bg-green-50';
    if (percentage >= 30) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">Tìm trạm thay pin</h1>
          <p className="text-slate-600 dark:text-slate-300">Tìm trạm gần nhất và đặt chỗ thay pin nhanh chóng</p>
        </div>
      </div>

      {/* Bỏ Quick Stats - không cần thiết cho trang tìm trạm */}

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
                className="pl-10 glass border-slate-200/50 dark:border-slate-700/50 focus:border-blue-400 dark:focus:border-purple-400"
              />
            </div>
            <Button variant="outline" className="glass border-slate-200/50 dark:border-slate-700/50 hover:bg-blue-50/50 dark:hover:bg-purple-500/10">
              <Filter className="mr-2 h-4 w-4" />
              Bộ lọc
            </Button>
            <Button className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <MapPin className="mr-2 h-4 w-4" />
              Xem bản đồ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Stations */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent mb-4">Trạm gần đây</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {nearbyStations.map((station) => (
            <Card key={station.id} className="overflow-hidden glass-card border-0 glow-hover group transform hover:scale-105 transition-all duration-300">
              <div className="relative h-48">
                <ImageWithFallback
                  src={station.image}
                  alt={station.name}
                  className="w-full h-full object-cover rounded-t-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute top-3 right-3">
                  <Badge className="glass border-0 text-white shadow-lg">
                    <Battery className="mr-1 h-3 w-3" />
                    {station.availableBatteries}/{station.totalBatteries}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{station.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      {station.address}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{station.rating}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400">({station.reviews})</span>
                    </div>
                    <Badge variant="outline" className="text-xs glass border-blue-200/50 dark:border-purple-400/30">
                      {station.distance}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Tình trạng</span>
                      <span className={`font-medium ${getAvailabilityColor(station.availableBatteries, station.totalBatteries)}`}>
                        {Math.round((station.availableBatteries / station.totalBatteries) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(station.availableBatteries / station.totalBatteries) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Giờ hoạt động</p>
                      <p className="font-medium text-slate-900 dark:text-white">{station.operatingHours}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-600 dark:text-slate-400">Thời gian chờ</p>
                      <p className="font-medium text-green-600 dark:text-green-400">{station.estimatedWait}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {station.batteryTypes.map((type) => (
                      <Badge key={type} variant="secondary" className="text-xs glass border-0">
                        {type}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button className="flex-1 gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300" size="sm">
                      <Navigation className="mr-1 h-3 w-3" />
                      Dẫn đường
                    </Button>
                    <Button variant="outline" className="flex-1 glass border-blue-200/50 dark:border-purple-400/30 hover:bg-blue-50/50 dark:hover:bg-purple-500/10" size="sm">
                      <Calendar className="mr-1 h-3 w-3" />
                      Đặt chỗ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriverHome;