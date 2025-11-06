import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Shield,
  Edit,
  Save,
  Camera,
  Loader2,
  X
} from 'lucide-react';
import { authService, UserProfile } from '../../services/auth.service';
import { useToast } from '../../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

const PersonalProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState({
    full_name: '',
    phone: '',
  });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { toast } = useToast();

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authService.getProfile();
      if (response.success && response.data.user) {
        setProfile(response.data.user);
        setEditedProfile({
          full_name: response.data.user.full_name,
          phone: response.data.user.phone || '',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể tải thông tin profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await authService.updateProfile(editedProfile);
      
      if (response.success) {
        setProfile(response.data.user);
        setIsEditing(false);
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật thông tin cá nhân',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu xác nhận không khớp',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast({
        title: 'Lỗi',
        description: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPasswordLoading(true);
      const response = await authService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      if (response.success) {
        toast({
          title: 'Thành công',
          description: 'Đã đổi mật khẩu thành công',
        });
        setChangePasswordOpen(false);
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể đổi mật khẩu',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'Kích thước file phải nhỏ hơn 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Lỗi',
        description: 'Chỉ chấp nhận file ảnh',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Đang tải lên...',
        description: 'Vui lòng đợi',
      });

      const response = await authService.uploadAvatar(file);
      
      if (response.success && response.data.user) {
        setProfile(response.data.user);
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật ảnh đại diện',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể upload ảnh',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-600">Không thể tải thông tin profile</p>
            <Button onClick={fetchProfile} className="mt-4">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">Hồ sơ Cá nhân</h1>
          <p className="text-slate-600 dark:text-slate-300">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <Button 
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setEditedProfile({
                  full_name: profile.full_name,
                  phone: profile.phone || '',
                });
              }}
            >
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
          )}
          <Button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={saving}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="glass-card border-0 glow">
          <CardContent className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-24 h-24">
                {profile.avatar && <AvatarImage src={profile.avatar} />}
                <AvatarFallback className="text-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  {profile.full_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
              <Button 
                size="sm" 
                className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{profile.full_name}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              {profile.role === 'STAFF' ? 'Nhân viên' : profile.role === 'ADMIN' ? 'Quản trị viên' : 'Tài xế'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">{profile.email}</p>
            
            <div className="flex justify-center mb-4">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                <Shield className="mr-1 h-3 w-3" />
                {profile.role === 'STAFF' ? 'Nhân viên Chính thức' : profile.role}
              </Badge>
            </div>

            {profile.station && (
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <p className="font-medium">Trạm làm việc:</p>
                <p>{profile.station.name}</p>
              </div>
            )}
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
                  value={isEditing ? editedProfile.full_name : profile.full_name}
                  disabled={!isEditing}
                  onChange={(e) => setEditedProfile({...editedProfile, full_name: e.target.value})}
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
                  className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={isEditing ? editedProfile.phone : (profile.phone || 'Chưa có')}
                  disabled={!isEditing}
                  onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                  className="glass border-slate-200/50 dark:border-slate-700/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">Vai trò</Label>
                <Input
                  id="role"
                  value={profile.role === 'STAFF' ? 'Nhân viên' : profile.role === 'ADMIN' ? 'Quản trị viên' : 'Tài xế'}
                  disabled
                  className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
              {profile.station && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="station" className="text-slate-700 dark:text-slate-300">Trạm làm việc</Label>
                    <Input
                      id="station"
                      value={profile.station.name}
                      disabled
                      className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stationAddress" className="text-slate-700 dark:text-slate-300">Địa chỉ trạm</Label>
                    <Input
                      id="stationAddress"
                      value={profile.station.address}
                      disabled
                      className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="created_at" className="text-slate-700 dark:text-slate-300">Ngày tạo tài khoản</Label>
                <Input
                  id="created_at"
                  value={new Date(profile.created_at).toLocaleDateString('vi-VN')}
                  disabled
                  className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="updated_at" className="text-slate-700 dark:text-slate-300">Cập nhật lần cuối</Label>
                <Input
                  id="updated_at"
                  value={new Date(profile.updated_at).toLocaleDateString('vi-VN')}
                  disabled
                  className="glass border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50"
                />
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
              <h4 className="font-medium text-slate-900 dark:text-white">Đổi mật khẩu</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">Cập nhật mật khẩu đăng nhập hệ thống</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="glass border-slate-200/50 dark:border-slate-700/50"
              onClick={() => setChangePasswordOpen(true)}
            >
              Thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Đổi Mật Khẩu</DialogTitle>
            <DialogDescription>
              Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
              <Input
                id="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                disabled={passwordLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">Mật khẩu mới</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                disabled={passwordLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                disabled={passwordLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChangePasswordOpen(false);
                setPasswordData({
                  current_password: '',
                  new_password: '',
                  confirm_password: '',
                });
              }}
              disabled={passwordLoading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleChangePassword}
              disabled={passwordLoading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
            >
              {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đổi mật khẩu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonalProfile;