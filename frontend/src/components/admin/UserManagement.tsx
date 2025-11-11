import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { TrashIcon, UserPlusIcon, Search, Filter, Users, UserCheck, UserX, Shield } from 'lucide-react';
import {
  getAllUsers,
  createUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
} from '../../services/admin.service';
import type { AdminUser } from '../../services/admin.service';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: {
    email: string;
    fullName: string;
    password: string;
    role: string;
    phone?: string;
  }) => void;
}

const CreateUserModal = ({
  isOpen,
  onClose,
  onSubmit,
}: CreateUserModalProps) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('STAFF');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailValid = /\S+@\S+\.\S+/.test(email);
    if (!emailValid) return toast.error('Email không hợp lệ');
    if (password.length < 6)
      return toast.error('Mật khẩu phải có ít nhất 6 ký tự');
    if (fullName.trim().length < 2)
      return toast.error('Họ và tên phải có ít nhất 2 ký tự');

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15)
      return toast.error('Số điện thoại phải có từ 10 đến 15 chữ số');

    onSubmit({ email, fullName, password, role, phone });
    setEmail('');
    setFullName('');
    setPassword('');
    setPhone('');
    setRole('STAFF');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-lg rounded-2xl shadow-2xl bg-white p-6">
    <DialogHeader className="space-y-2 border-b pb-3">
      <DialogTitle className="text-2xl font-semibold text-gray-900">
        ✨ Thêm người dùng mới
      </DialogTitle>
      <DialogDescription className="text-gray-600">
        Điền thông tin chi tiết để tạo người dùng mới trong hệ thống.
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="mt-5 space-y-5">
      <div className="space-y-2">
        <Label className="font-medium text-gray-700">Email</Label>
        <Input
          placeholder="example@gmail.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-medium text-gray-700">Họ và tên</Label>
        <Input
          placeholder="Nguyễn Văn A"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-medium text-gray-700">Mật khẩu</Label>
        <Input
          placeholder="Tối thiểu 6 ký tự"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      <div className="space-y-2">
        <Label className="font-medium text-gray-700">Số điện thoại</Label>
        <Input
          placeholder="84901234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

        <div className="space-y-2">
        <Label className="font-medium text-gray-700">Vai trò</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
            <SelectValue placeholder="Chọn vai trò" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
            <SelectItem value="ADMIN" className="hover:bg-red-50 cursor-pointer">Admin</SelectItem>
            <SelectItem value="STAFF" className="hover:bg-blue-50 cursor-pointer">Nhân viên</SelectItem>
            <SelectItem value="DRIVER" className="hover:bg-green-50 cursor-pointer">Tài xế</SelectItem>
          </SelectContent>
        </Select>
      </div>      <DialogFooter className="mt-6 flex justify-end space-x-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-gray-300 hover:bg-gray-100 text-gray-700"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5"
        >
          Tạo người dùng
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

  );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page: 1, limit: 50 });
      if (res.success) setUsers(res.data?.users || []);
      else throw new Error(res.message || 'Không thể tải danh sách người dùng');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi tải người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (userData: {
    password: string;
    email: string;
    fullName: string;
    role: string;
    phone?: string;
  }) => {
    try {
      const payload = {
        email: userData.email,
        full_name: userData.fullName,
        password: userData.password,
        role: userData.role,
        phone: userData.phone,
      };
      const res = await createUser(payload);
      if (res.success) {
        toast.success('Tạo người dùng thành công');
        setIsCreateModalOpen(false);
        fetchUsers();
      } else {
        throw new Error(res.message || 'Tạo người dùng thất bại');
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tạo người dùng');
    }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const res = await updateUserStatus(userId, status);
      if (res.success) {
        toast.success('Cập nhật trạng thái thành công');
        fetchUsers();
      } else throw new Error(res.message || 'Cập nhật thất bại');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const res = await updateUserRole(userId, role);
      if (res.success) {
        toast.success('Cập nhật vai trò thành công');
        fetchUsers();
      } else throw new Error(res.message || 'Cập nhật vai trò thất bại');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật vai trò');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        const res = await deleteUser(userId);
        if (res.success) {
          toast.success('Xóa người dùng thành công');
          fetchUsers();
        } else throw new Error(res.message || 'Xóa thất bại');
      } catch (err: any) {
        toast.error(err.message || 'Lỗi khi xóa người dùng');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách và quyền của người dùng trong hệ thống.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <UserPlusIcon className="h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Tổng người dùng
              {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <span className="text-xs text-blue-600 block">({filteredUsers.length} kết quả)</span>
              )}
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Đang hoạt động</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {users.filter(u => u.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Admin</CardTitle>
            <Shield className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">
              {users.filter(u => u.role === 'ADMIN').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-rose-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Không hoạt động</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {users.filter(u => u.status === 'INACTIVE').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vai trò</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                  <SelectItem value="ALL" className="hover:bg-gray-50 cursor-pointer">Tất cả vai trò</SelectItem>
                  <SelectItem value="ADMIN" className="hover:bg-red-50 cursor-pointer">Admin</SelectItem>
                  <SelectItem value="STAFF" className="hover:bg-blue-50 cursor-pointer">Nhân viên</SelectItem>
                  <SelectItem value="DRIVER" className="hover:bg-green-50 cursor-pointer">Tài xế</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                  <SelectItem value="ALL" className="hover:bg-gray-50 cursor-pointer">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE" className="hover:bg-green-50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      Đang hoạt động
                    </div>
                  </SelectItem>
                  <SelectItem value="INACTIVE" className="hover:bg-red-50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-red-600" />
                      Không hoạt động
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách người dùng</CardTitle>
          <CardDescription>Toàn bộ người dùng trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 animate-pulse">Đang tải danh sách người dùng...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                  <tr>
                    <th className="p-3 text-left">Họ và tên</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Số điện thoại</th>
                    <th className="p-3 text-left">Vai trò</th>
                    <th className="p-3 text-left">Trạng thái</th>
                    <th className="p-3 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.user_id}
                      className="border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">{u.full_name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.phone || '—'}</td>
                      <td className="p-3">
                        <Select
                          value={u.role}
                          onValueChange={(newRole) =>
                            handleUpdateRole(u.user_id, newRole)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                            <SelectItem value="ADMIN">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                Admin
                              </div>
                            </SelectItem>
                            <SelectItem value="STAFF">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                Nhân viên
                              </div>
                            </SelectItem>
                            <SelectItem value="DRIVER">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Tài xế
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={u.status || 'INACTIVE'}
                          onValueChange={(newStatus) =>
                            handleUpdateStatus(u.user_id, newStatus)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                            <SelectItem value="ACTIVE">
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-green-600" />
                                Hoạt động
                              </div>
                            </SelectItem>
                            <SelectItem value="INACTIVE">
                              <div className="flex items-center gap-2">
                                <UserX className="h-4 w-4 text-red-600" />
                                Không hoạt động
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(u.user_id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {users.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  Không có người dùng nào.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  );
};

export default UserManagement;
