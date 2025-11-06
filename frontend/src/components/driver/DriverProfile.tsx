import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Battery,
  CreditCard,
  Edit,
  Save,
  Camera
} from 'lucide-react';
import API_ENDPOINTS, { fetchWithAuth } from '../../config/api';

const DriverProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    totalSwaps: 0,
    monthlySwaps: 0,
    monthlyCost: 0
  });

  const loadProfile = async () => {
    setError('');
    setMessage('');
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.AUTH.PROFILE);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Tải hồ sơ thất bại');
      const u = data.data?.user || data.data;
      setProfile(p => ({
        ...p,
        name: u.full_name || '',
        email: u.email || '',
        phone: u.phone || '',
      }));
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    }
  };

  const handleSave = async () => {
    setError('');
    setMessage('');
    try {
      const body = { full_name: profile.name, phone: profile.phone };
      const res = await fetchWithAuth(API_ENDPOINTS.AUTH.UPDATE_PROFILE, { method: 'PUT', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Cập nhật thất bại');
      setIsEditing(false);
      setMessage('Cập nhật hồ sơ thành công');
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    }
  };

  useEffect(() => { loadProfile(); }, []);

  return (
    <div className="p-6 space-y-6">
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

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">{error}</div>
      )}
      {message && (
        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-0 glow">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="text-2xl gradient-primary text-white">{profile.name ? profile.name.charAt(0) : 'U'}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{profile.name || '—'}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{profile.email || '—'}</p>

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
                  disabled
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

      <Card className="glass-card border-0 glow">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Cài đặt Tài khoản</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Đổi mật khẩu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input type="password" placeholder="Mật khẩu hiện tại" id="curPwd" />
            <Input type="password" placeholder="Mật khẩu mới" id="newPwd" />
            <Button 
              variant="outline" 
              size="sm" 
              className="glass border-slate-200/50 dark:border-slate-700/50"
              onClick={async () => {
                const cur = (document.getElementById('curPwd') as HTMLInputElement)?.value;
                const nw = (document.getElementById('newPwd') as HTMLInputElement)?.value;
                setError(''); setMessage('');
                try {
                  const res = await fetchWithAuth(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { method: 'PUT', body: JSON.stringify({ currentPassword: cur, newPassword: nw }) });
                  const data = await res.json();
                  if (!res.ok || !data.success) throw new Error(data.message || 'Đổi mật khẩu thất bại');
                  setMessage('Đổi mật khẩu thành công');
                } catch (e: any) {
                  setError(e.message || 'Có lỗi xảy ra');
                }
              }}
            >
              Thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverProfile;