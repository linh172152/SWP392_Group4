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
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { authService, UserProfile } from '../../services/auth.service';
import { useToast } from '../../hooks/use-toast';
import { parseError, logError } from '../../utils/errorHandler';
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
      logError(error, "PersonalProfile.handleSave");
      const errorInfo = parseError(error);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
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
      logError(error, "PersonalProfile.handleChangePassword");
      const errorInfo = parseError(error);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
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
      logError(error, "PersonalProfile.handleAvatarUpload");
      const errorInfo = parseError(error);
      
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="h-9 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 animate-pulse"></div>
            <div className="h-5 w-80 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>

        {/* Profile Cards Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-card border-0 animate-pulse">
            <CardContent className="p-6 text-center">
              <div className="h-24 w-24 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4"></div>
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-2"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-4"></div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 glass-card border-0 animate-pulse">
            <CardHeader>
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card className="glass-card border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-rose-50/30 dark:from-red-900/20 dark:to-rose-900/20"></div>
          <CardContent className="p-16 text-center relative">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 rounded-full">
                <AlertCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-red-900 to-rose-700 dark:from-red-200 dark:to-rose-200 bg-clip-text text-transparent mb-3">
              Không thể tải thông tin
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              Không thể tải thông tin profile. Vui lòng thử lại sau.
            </p>
            <Button 
              onClick={fetchProfile} 
              className="glass border-red-300/50 hover:bg-red-50 dark:border-red-700/50 dark:hover:bg-red-900/20 hover:scale-105 transition-all duration-200"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
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
              className="glass border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 transition-all duration-200"
            >
              <X className="mr-2 h-4 w-4" />
              Hủy
            </Button>
          )}
          <Button 
            onClick={() => isEditing ? handleSaveClick() : setIsEditing(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
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
        <Card className="glass-card border-0 glow overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-50"></div>
          <CardContent className="p-6 text-center relative">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative">
                <Avatar className="w-28 h-28 ring-4 ring-green-200 dark:ring-green-800 ring-offset-2 ring-offset-white dark:ring-offset-slate-900">
                  {profile.avatar && <AvatarImage src={profile.avatar} />}
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-green-500 to-emerald-600 text-white">
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
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Camera className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
              {profile.full_name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-2 font-medium">
              {profile.role === 'STAFF' ? 'Nhân viên' : profile.role === 'ADMIN' ? 'Quản trị viên' : 'Tài xế'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">{profile.email}</p>
            
            <div className="flex justify-center mb-4">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md px-4 py-1.5">
                <Shield className="mr-1.5 h-4 w-4" />
                <span className="font-semibold">
                  {profile.role === 'STAFF' ? 'Nhân viên Chính thức' : profile.role}
                </span>
              </Badge>
            </div>

            {profile.station && (
              <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Trạm làm việc</p>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{profile.station.name}</p>
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
      <Card className="glass-card border-0 glow overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-slate-600/5 opacity-50"></div>
        <CardHeader className="relative">
          <CardTitle className="text-slate-900 dark:text-white text-xl">Cài đặt Tài khoản</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Quản lý bảo mật và tùy chọn cá nhân</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          <div className="flex items-center justify-between p-5 glass-card rounded-xl border-0 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-md">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Đổi mật khẩu</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">Cập nhật mật khẩu đăng nhập hệ thống</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="glass border-blue-300/50 hover:bg-blue-50 dark:border-blue-700/50 dark:hover:bg-blue-900/20 hover:scale-105 transition-all duration-200"
              onClick={() => setChangePasswordOpen(true)}
            >
              Thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="sm:max-w-[500px] glass-card border-0">
          <DialogHeader className="pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Đổi Mật Khẩu
              </span>
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-sm font-semibold text-slate-900 dark:text-white">
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
                  className={`glass border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 ${
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
              <Label htmlFor="new_password" className="text-sm font-semibold text-slate-900 dark:text-white">
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
                  className={`glass border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 ${
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
              <Label htmlFor="confirm_password" className="text-sm font-semibold text-slate-900 dark:text-white">
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
                  className={`glass border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 ${
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
          <DialogFooter className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 mt-4">
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
              className="hover:scale-105 transition-all duration-200"
            >
              Hủy
            </Button>
            <Button 
              onClick={handleChangePasswordClick}
              disabled={passwordLoading || !isPasswordFormValid()}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Đổi mật khẩu
                </>
              )}
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