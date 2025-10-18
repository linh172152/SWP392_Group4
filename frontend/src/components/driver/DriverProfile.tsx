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
  Battery,
  CreditCard,
  Settings,
  Edit,
  Save,
  Camera
} from 'lucide-react';

const DriverProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Nguyễn Văn Tài Xế',
    email: 'taixe@demo.com',
    phone: '+84 901 234 567',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    dateOfBirth: '1990-05-15',
    licenseNumber: 'B2-123456789',
    joinDate: '2023-06-15',
    totalSwaps: 47,
    monthlySwaps: 12,
    monthlyCost: 340000
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">Hồ sơ Cá nhân</h1>
          <p className="text-slate-600 dark:text-slate-300">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </div>
        <Button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                <AvatarFallback className="text-2xl gradient-primary text-white">{profile.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{profile.name}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{profile.email}</p>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{profile.totalSwaps}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Tổng lần thay</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{profile.monthlySwaps}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Tháng này</div>
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
                <Label htmlFor="dob" className="text-slate-700 dark:text-slate-300">Ngày sinh</Label>
                <Input
                  id="dob"
                  type="date"
                  value={profile.dateOfBirth}
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license" className="text-slate-700 dark:text-slate-300">Số bằng lái</Label>
                <Input
                  id="license"
                  value={profile.licenseNumber}
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, licenseNumber: e.target.value})}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate" className="text-slate-700 dark:text-slate-300">Ngày tham gia</Label>
                <Input
                  id="joinDate"
                  type="date"
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

      {/* Quick Stats - chỉ liên quan thay pin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 gradient-primary rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Battery className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Lần thay tháng này</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{profile.monthlySwaps}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Chi phí tháng này</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{profile.monthlyCost.toLocaleString()} đ</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Settings */}
      <Card className="glass-card border-0 glow">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Cài đặt Tài khoản</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Quản lý bảo mật và tùy chọn tài khoản</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 glass rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Thông báo Email</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Nhận thông báo về đặt chỗ và cập nhật</p>
            </div>
            <Button variant="outline" size="sm" className="glass border-blue-200/50 dark:border-purple-400/30">
              Cấu hình
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 glass rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Xác thực 2 bước</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tăng cường bảo mật cho tài khoản</p>
            </div>
            <Button variant="outline" size="sm" className="glass border-green-200/50 dark:border-green-400/30">
              Kích hoạt
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 glass rounded-lg">
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">Đổi mật khẩu</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Cập nhật mật khẩu đăng nhập</p>
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

export default DriverProfile;