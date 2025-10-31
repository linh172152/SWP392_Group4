import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Camera,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { authService, type UserProfile } from '../../services/auth.service';
import { transactionService } from '../../services/transaction.service';

const DriverProfile: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [stats, setStats] = useState({
    totalSwaps: 0,
    monthlySwaps: 0,
    monthlyCost: 0
  });

  // Load profile from API
  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      
      const response = await authService.getProfile();
      setUserProfile(response.data.user);
      setProfile({
        full_name: response.data.user.full_name,
        email: response.data.user.email,
        phone: response.data.user.phone || '',
        avatar: response.data.user.avatar || ''
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      
      if (error.status === 401) {
        setAuthError(true);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('ev_swap_user');
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => navigate('/'), 1500);
      } else {
        alert(error.message || "Không thể tải thông tin profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load transaction statistics
      const statsResponse = await transactionService.getTransactionStats(30);
      setStats({
        totalSwaps: statsResponse.data.total_transactions,
        monthlySwaps: statsResponse.data.total_transactions,
        monthlyCost: statsResponse.data.total_amount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't show error for stats, it's not critical
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate data before sending
      if (profile.full_name.trim().length < 2) {
        alert("Họ tên phải có ít nhất 2 ký tự");
        setSaving(false);
        return;
      }
      
      if (profile.phone && profile.phone.trim()) {
        // Validate phone format
        const phonePattern = /^[0-9+\-\s()]+$/;
        if (!phonePattern.test(profile.phone.trim())) {
          alert("Số điện thoại chỉ được chứa số, dấu +, -, khoảng trắng và dấu ngoặc");
          setSaving(false);
          return;
        }
        if (profile.phone.replace(/[\s\-()]/g, '').length < 10) {
          alert("Số điện thoại phải có ít nhất 10 số");
          setSaving(false);
          return;
        }
      }
      
      // Only send fields that have values
      const updateData: any = {
        full_name: profile.full_name.trim()
      };
      
      // Only include phone if it's not empty
      if (profile.phone && profile.phone.trim()) {
        updateData.phone = profile.phone.trim();
      }
      
      // Only include avatar if it's not empty
      if (profile.avatar && profile.avatar.trim()) {
        updateData.avatar = profile.avatar.trim();
      }
      
      await authService.updateProfile(updateData);
      
      alert("Cập nhật thông tin thành công!");
      setIsEditing(false);
      
      // Update localStorage user info
      const storedUser = localStorage.getItem('ev_swap_user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        user.name = profile.full_name;
        localStorage.setItem('ev_swap_user', JSON.stringify(user));
      }
      
      // Reload profile to get fresh data
      loadProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      
      if (error.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('ev_swap_user');
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate('/');
      } else {
        alert(error.message || "Không thể cập nhật profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        alert("Vui lòng điền đầy đủ thông tin");
        return;
      }
      
      if (passwordData.newPassword.length < 6) {
        alert("Mật khẩu mới phải có ít nhất 6 ký tự");
        return;
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert("Mật khẩu mới và xác nhận mật khẩu không khớp");
        return;
      }
      
      setChangingPassword(true);
      
      await authService.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      alert("Đổi mật khẩu thành công!");
      setShowChangePassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      if (error.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('ev_swap_user');
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate('/');
      } else {
        alert(error.message || "Không thể đổi mật khẩu");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    try {
      setUploadingAvatar(true);

      const response = await authService.uploadAvatar(file);
      
      alert("Upload avatar thành công!");
      
      // Update profile with new avatar URL
      setProfile(prev => ({
        ...prev,
        avatar: response.data.image_url
      }));

      // Reload profile to get fresh data
      loadProfile();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      
      if (error.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('ev_swap_user');
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate('/');
      } else {
        alert(error.message || "Không thể upload avatar");
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (authError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phiên đăng nhập không hợp lệ</h3>
            <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem thông tin profile.</p>
            <Button onClick={() => navigate('/')}>
              Đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
          disabled={saving}
          className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : isEditing ? (
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
                <AvatarImage src={profile.avatar || "/placeholder-avatar.jpg"} />
                <AvatarFallback className="text-2xl gradient-primary text-white">
                  {profile.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
              <Button 
                size="sm" 
                className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{profile.full_name}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{profile.email}</p>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSwaps}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Tổng lần thay</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.monthlySwaps}</div>
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
                  value={profile.full_name}
                  disabled={!isEditing}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled={true}
                  className="glass border-slate-200/50 dark:border-slate-700/50 opacity-60"
                  title="Email không thể thay đổi"
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
                  placeholder="+84 xxx xxx xxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">Vai trò</Label>
                <Input
                  id="role"
                  value={userProfile?.role || ''}
                  disabled={true}
                  className="glass border-slate-200/50 dark:border-slate-700/50 opacity-60"
                />
              </div>
            </div>
            
            {userProfile?.vehicles && userProfile.vehicles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Xe đã đăng ký</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {userProfile.vehicles.map((vehicle) => (
                    <div key={vehicle.vehicle_id} className="p-3 glass rounded-lg">
                      <p className="font-medium text-slate-900 dark:text-white">{vehicle.license_plate}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{vehicle.model} - {vehicle.vehicle_type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.monthlySwaps}</p>
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
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.monthlyCost.toLocaleString('vi-VN')} ₫</p>
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
          {!showChangePassword ? (
            <div className="flex items-center justify-between p-4 glass rounded-lg">
              <div>
                <h4 className="font-medium text-slate-900 dark:text-white">Đổi mật khẩu</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Cập nhật mật khẩu đăng nhập</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="glass border-slate-200/50 dark:border-slate-700/50"
                onClick={() => setShowChangePassword(true)}
              >
                Thay đổi
              </Button>
            </div>
          ) : (
            <div className="p-4 glass rounded-lg space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-slate-900 dark:text-white">Đổi mật khẩu</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({currentPassword: '', newPassword: '', confirmPassword: ''});
                  }}
                >
                  Hủy
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-slate-700 dark:text-slate-300">
                    Mật khẩu hiện tại
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="glass border-slate-200/50 dark:border-slate-700/50"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300">
                    Mật khẩu mới
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="glass border-slate-200/50 dark:border-slate-700/50"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300">
                    Xác nhận mật khẩu mới
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="glass border-slate-200/50 dark:border-slate-700/50"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>
              
              <Button 
                className="w-full gradient-primary text-white"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận đổi mật khẩu"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverProfile;