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
  X,
  AlertCircle,
  CheckCircle2
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface ValidationErrors {
  full_name?: string;
  phone?: string;
  current_password?: string;
  new_password?: string;
  confirm_password?: string;
}

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
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  
  // Confirm dialog states
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);
  
  const { toast } = useToast();

  // Validation functions
  const validateFullName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Họ và tên không được để trống';
    }
    if (name.trim().length < 2) {
      return 'Họ và tên phải có ít nhất 2 ký tự';
    }
    if (name.trim().length > 100) {
      return 'Họ và tên không được vượt quá 100 ký tự';
    }
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(name.trim())) {
      return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
    }
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone.trim()) {
      return undefined; // Phone is optional
    }
    // Vietnamese phone number: 10-11 digits, starting with 0 or +84
    const phoneRegex = /^(\+84|0)[1-9][0-9]{8,9}$/;
    const cleanedPhone = phone.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      return 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10-11 số)';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Mật khẩu không được để trống';
    }
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (password.length > 50) {
      return 'Mật khẩu không được vượt quá 50 ký tự';
    }
    // Optional: Check for at least one number and one letter
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return 'Mật khẩu nên chứa ít nhất một chữ cái và một số';
    }
    return undefined;
  };

  const validateConfirmPassword = (confirm: string, newPassword: string): string | undefined => {
    if (!confirm) {
      return 'Vui lòng xác nhận mật khẩu';
    }
    if (confirm !== newPassword) {
      return 'Mật khẩu xác nhận không khớp';
    }
    return undefined;
  };

  // Real-time validation
  const validateField = (field: string, value: string, additionalValue?: string) => {
    let error: string | undefined;
    
    switch (field) {
      case 'full_name':
        error = validateFullName(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'new_password':
        error = validatePassword(value);
        break;
      case 'confirm_password':
        error = validateConfirmPassword(value, additionalValue || passwordData.new_password);
        break;
      default:
        break;
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error,
    }));
    
    return !error;
  };

  // Check if profile has unsaved changes
  const hasUnsavedChanges = () => {
    if (!profile) return false;
    return (
      editedProfile.full_name !== profile.full_name ||
      editedProfile.phone !== (profile.phone || '')
    );
  };

  // Check if form is valid
  const isProfileFormValid = () => {
    return (
      !validationErrors.full_name &&
      !validationErrors.phone &&
      editedProfile.full_name.trim() !== '' &&
      validateFullName(editedProfile.full_name) === undefined &&
      (editedProfile.phone.trim() === '' || validatePhone(editedProfile.phone) === undefined)
    );
  };

  const isPasswordFormValid = () => {
    return (
      passwordData.current_password.trim() !== '' &&
      !validationErrors.new_password &&
      !validationErrors.confirm_password &&
      passwordData.new_password === passwordData.confirm_password
    );
  };

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

  const handleSaveClick = () => {
    // Validate all fields
    const fullNameValid = validateField('full_name', editedProfile.full_name);
    const phoneValid = editedProfile.phone.trim() === '' || validateField('phone', editedProfile.phone);
    
    if (!fullNameValid || !phoneValid) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng kiểm tra lại thông tin đã nhập',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isProfileFormValid()) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng sửa các lỗi trước khi lưu',
        variant: 'destructive',
      });
      return;
    }
    
    setConfirmSaveOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await authService.updateProfile(editedProfile);
      
      if (response.success) {
        setProfile(response.data.user);
        setIsEditing(false);
        setValidationErrors({});
        setTouchedFields(new Set());
        setConfirmSaveOpen(false);
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

  const handleCancelEdit = () => {
    if (hasUnsavedChanges()) {
      setConfirmCancelOpen(true);
    } else {
      setIsEditing(false);
      setValidationErrors({});
      setTouchedFields(new Set());
      setEditedProfile({
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
      });
    }
  };

  const handleCancelConfirm = () => {
    setIsEditing(false);
    setValidationErrors({});
    setTouchedFields(new Set());
    setEditedProfile({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    });
    setConfirmCancelOpen(false);
  };

  const handleChangePasswordClick = () => {
    // Validate all password fields
    const newPasswordValid = validateField('new_password', passwordData.new_password);
    const confirmPasswordValid = validateField('confirm_password', passwordData.confirm_password, passwordData.new_password);
    
    if (!passwordData.current_password.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        current_password: 'Vui lòng nhập mật khẩu hiện tại',
      }));
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng nhập đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }
    
    if (!newPasswordValid || !confirmPasswordValid) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng kiểm tra lại mật khẩu đã nhập',
        variant: 'destructive',
      });
      return;
    }
    
    if (!isPasswordFormValid()) {
      toast({
        title: 'Lỗi xác thực',
        description: 'Vui lòng sửa các lỗi trước khi đổi mật khẩu',
        variant: 'destructive',
      });
      return;
    }
    
    setConfirmPasswordOpen(true);
  };

  const handleChangePassword = async () => {
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
        setValidationErrors({});
        setTouchedFields(new Set());
        setConfirmPasswordOpen(false);
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
              onClick={handleCancelEdit}
              disabled={saving}
            >
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
          )}
          <Button 
            onClick={() => isEditing ? handleSaveClick() : setIsEditing(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={saving || (isEditing && !isProfileFormValid())}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={isEditing ? editedProfile.full_name : profile.full_name}
                    disabled={!isEditing}
                    onChange={(e) => {
                      setEditedProfile({...editedProfile, full_name: e.target.value});
                      if (touchedFields.has('full_name')) {
                        validateField('full_name', e.target.value);
                      }
                    }}
                    onBlur={() => {
                      setTouchedFields(prev => new Set(prev).add('full_name'));
                      validateField('full_name', editedProfile.full_name);
                    }}
                    className={`glass border-slate-200/50 dark:border-slate-700/50 ${
                      touchedFields.has('full_name') && validationErrors.full_name
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }`}
                  />
                  {touchedFields.has('full_name') && validationErrors.full_name && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.full_name}
                    </div>
                  )}
                  {touchedFields.has('full_name') && !validationErrors.full_name && editedProfile.full_name.trim() && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-green-500 mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Hợp lệ
                    </div>
                  )}
                </div>
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
                <div className="relative">
                  <Input
                    id="phone"
                    value={isEditing ? editedProfile.phone : (profile.phone || 'Chưa có')}
                    disabled={!isEditing}
                    onChange={(e) => {
                      setEditedProfile({...editedProfile, phone: e.target.value});
                      if (touchedFields.has('phone')) {
                        validateField('phone', e.target.value);
                      }
                    }}
                    onBlur={() => {
                      setTouchedFields(prev => new Set(prev).add('phone'));
                      validateField('phone', editedProfile.phone);
                    }}
                    placeholder="Nhập số điện thoại (tùy chọn)"
                    className={`glass border-slate-200/50 dark:border-slate-700/50 ${
                      touchedFields.has('phone') && validationErrors.phone
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }`}
                  />
                  {touchedFields.has('phone') && validationErrors.phone && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.phone}
                    </div>
                  )}
                  {touchedFields.has('phone') && !validationErrors.phone && editedProfile.phone.trim() && (
                    <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-green-500 mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Hợp lệ
                    </div>
                  )}
                </div>
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
              <Label htmlFor="current_password">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, current_password: e.target.value });
                    if (touchedFields.has('current_password')) {
                      if (!e.target.value.trim()) {
                        setValidationErrors(prev => ({
                          ...prev,
                          current_password: 'Vui lòng nhập mật khẩu hiện tại',
                        }));
                      } else {
                        setValidationErrors(prev => ({
                          ...prev,
                          current_password: undefined,
                        }));
                      }
                    }
                  }}
                  onBlur={() => {
                    setTouchedFields(prev => new Set(prev).add('current_password'));
                    if (!passwordData.current_password.trim()) {
                      setValidationErrors(prev => ({
                        ...prev,
                        current_password: 'Vui lòng nhập mật khẩu hiện tại',
                      }));
                    }
                  }}
                  disabled={passwordLoading}
                  className={`${
                    touchedFields.has('current_password') && validationErrors.current_password
                      ? 'border-red-500 focus:border-red-500'
                      : ''
                  }`}
                />
                {touchedFields.has('current_password') && validationErrors.current_password && (
                  <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.current_password}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">
                Mật khẩu mới <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, new_password: e.target.value });
                    if (touchedFields.has('new_password')) {
                      validateField('new_password', e.target.value);
                    }
                    // Re-validate confirm password if it's already touched
                    if (touchedFields.has('confirm_password')) {
                      validateField('confirm_password', passwordData.confirm_password, e.target.value);
                    }
                  }}
                  onBlur={() => {
                    setTouchedFields(prev => new Set(prev).add('new_password'));
                    validateField('new_password', passwordData.new_password);
                    if (touchedFields.has('confirm_password')) {
                      validateField('confirm_password', passwordData.confirm_password, passwordData.new_password);
                    }
                  }}
                  disabled={passwordLoading}
                  className={`${
                    touchedFields.has('new_password') && validationErrors.new_password
                      ? 'border-red-500 focus:border-red-500'
                      : ''
                  }`}
                />
                {touchedFields.has('new_password') && validationErrors.new_password && (
                  <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.new_password}
                  </div>
                )}
                {touchedFields.has('new_password') && !validationErrors.new_password && passwordData.new_password && (
                  <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-green-500 mt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Hợp lệ
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, confirm_password: e.target.value });
                    if (touchedFields.has('confirm_password')) {
                      validateField('confirm_password', e.target.value, passwordData.new_password);
                    }
                  }}
                  onBlur={() => {
                    setTouchedFields(prev => new Set(prev).add('confirm_password'));
                    validateField('confirm_password', passwordData.confirm_password, passwordData.new_password);
                  }}
                  disabled={passwordLoading}
                  className={`${
                    touchedFields.has('confirm_password') && validationErrors.confirm_password
                      ? 'border-red-500 focus:border-red-500'
                      : ''
                  }`}
                />
                {touchedFields.has('confirm_password') && validationErrors.confirm_password && (
                  <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-red-500 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.confirm_password}
                  </div>
                )}
                {touchedFields.has('confirm_password') && !validationErrors.confirm_password && passwordData.confirm_password && (
                  <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-green-500 mt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Khớp
                  </div>
                )}
              </div>
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
                setValidationErrors({});
                setTouchedFields(new Set());
              }}
              disabled={passwordLoading}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleChangePasswordClick}
              disabled={passwordLoading || !isPasswordFormValid()}
            >
              {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đổi mật khẩu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Save Dialog */}
      <AlertDialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận lưu thay đổi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn lưu các thay đổi thông tin cá nhân? Thông tin sẽ được cập nhật ngay lập tức.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Xác nhận lưu'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Cancel Dialog */}
      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy chỉnh sửa?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có các thay đổi chưa được lưu. Nếu hủy, tất cả thay đổi sẽ bị mất. Bạn có chắc chắn muốn hủy?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiếp tục chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-red-600 hover:bg-red-700">
              Hủy thay đổi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Change Password Dialog */}
      <AlertDialog open={confirmPasswordOpen} onOpenChange={setConfirmPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đổi mật khẩu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đổi mật khẩu? Sau khi đổi, bạn sẽ cần đăng nhập lại bằng mật khẩu mới.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={passwordLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận đổi mật khẩu'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PersonalProfile;