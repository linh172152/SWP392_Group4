import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  Building,
  Shield,
  Settings,
  Edit,
  Save,
  Camera,
  Badge as BadgeIcon
} from 'lucide-react';

const PersonalProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    id: 'EMP001',
    name: 'Trần Thị Nhân Viên',
    email: 'nhanvien@demo.com',
    phone: '+84 902 345 678',
    address: '456 Đường XYZ, Quận 3, TP.HCM',
    position: 'Nhân viên Vận hành',
    department: 'Vận hành',
    stationName: 'Trung tâm EV Thành phố',
    joinDate: '2023-06-15',
    shift: 'Sáng (6:00 - 14:00)',
    workingDays: 22,
    totalShifts: 156,
    performanceScore: 94
  });

  const handleSave = () => {
    setIsEditing(false);
    // Save logic here
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">Hồ sơ Cá nhân</h1>
          <p className="text-slate-600 dark:text-slate-300">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </div>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Lưu thay đổi
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Chỉnh sửa
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="glass-card border-0 glow">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{profile.name}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-2">{profile.position}</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">ID: {profile.id}</p>
            
            <div className="flex justify-center mb-4">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                <Shield className="mr-1 h-3 w-3" />
                Nhân viên Chính thức
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.workingDays}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Ngày làm/tháng</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.totalShifts}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Tổng ca làm</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{profile.performanceScore}%</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Điểm hiệu suất</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2 glass-card border-0 glow">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Thông tin Cá nhân</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Cập nhật thông tin liên lạc và chi tiết cá nhân</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Họ và tên</Label>
                <Input
                  id="name"
                  value={profile.name}
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position" className="text-slate-700 dark:text-slate-300">Vị trí công việc</Label>
                <Input
                  id="position"
                  value={profile.position}
                  disabled
                  className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-slate-700 dark:text-slate-300">Phòng ban</Label>
                <Input
                  id="department"
                  value={profile.department}
                  disabled
                  className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="station" className="text-slate-700 dark:text-slate-300">Trạm làm việc</Label>
                <Input
                  id="station"
                  value={profile.stationName}
                  disabled
                  className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shift" className="text-slate-700 dark:text-slate-300">Ca làm việc</Label>
                <Input
                  id="shift"
                  value={profile.shift}
                  disabled
                  className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate" className="text-slate-700 dark:text-slate-300">Ngày vào làm</Label>
                <Input
                  id="joinDate"
                  value={profile.joinDate}
                  disabled
                  className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Địa chỉ</Label>
              <Textarea
                id="address"
                value={profile.address}
                disabled={!isEditing}
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                className="glass border-slate-200/50 dark:border-slate-700/50"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Giờ làm tuần này</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">40h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Nghỉ phép còn lại</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">8 ngày</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BadgeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Thưởng tháng này</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">2.5M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Building className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Thời gian làm việc</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">1.4 năm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Settings */}
      <Card className="glass-card border-0 glow">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Cài đặt Tài khoản</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Quản lý bảo mật và tùy chọn cá nhân</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 glass rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Thông báo Ca làm việc</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Nhận thông báo về lịch làm việc và thay đổi ca</p>
            </div>
            <Button variant="outline" size="sm" className="glass border-green-200/50 dark:border-emerald-400/30">
              Bật
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 glass rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Xác thực 2 bước</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tăng cường bảo mật cho tài khoản làm việc</p>
            </div>
            <Button variant="outline" size="sm" className="glass border-blue-200/50 dark:border-blue-400/30">
              Kích hoạt
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 glass rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Đổi mật khẩu</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Cập nhật mật khẩu đăng nhập hệ thống</p>
            </div>
            <Button variant="outline" size="sm" className="glass border-slate-200/50 dark:border-slate-700/50">
              Thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalProfile;