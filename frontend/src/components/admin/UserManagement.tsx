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
import { TrashIcon, UserPlusIcon } from 'lucide-react';
import {
  getAllUsers,
  createUser,
  updateUserStatus,
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
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="STAFF">Staff</SelectItem>
            <SelectItem value="DRIVER">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="mt-6 flex justify-end space-x-3 pt-4 border-t">
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            👥 Quản lý người dùng
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh sách và quyền của người dùng trong hệ thống
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      <Card className="shadow-md border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Danh sách người dùng
          </CardTitle>
          <CardDescription>Toàn bộ người dùng trong hệ thống</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-blue-400 border-t-transparent rounded-full"></div>
              <p className="ml-3 text-blue-600 font-medium">Đang tải...</p>
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
                  {users.map((u) => (
                    <tr
                      key={u.user_id}
                      className="border-t hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">{u.full_name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.phone || '—'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.role === 'ADMIN'
                              ? 'bg-red-100 text-red-700'
                              : u.role === 'STAFF'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <Select
                          value={u.status || 'INACTIVE'}
                          onValueChange={(newStatus) =>
                            handleUpdateStatus(u.user_id, newStatus)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
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
