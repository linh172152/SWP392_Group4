import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { TrashIcon, UserPlusIcon } from 'lucide-react';
import { getAllUsers, createUser, updateUserStatus, deleteUser } from '../../services/admin.service';
import type { AdminUser } from '../../services/admin.service';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: { email: string; fullName: string; password: string; role: string; phone?: string }) => void;
}

const CreateUserModal = ({ isOpen, onClose, onSubmit }: CreateUserModalProps) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('STAFF');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic client-side validation to avoid backend Joi validation errors
    const emailValid = /\S+@\S+\.\S+/.test(email);
    if (!emailValid) {
      toast.error('Email không hợp lệ');
      return;
    }

    if (String(password).length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (fullName.trim().length < 2) {
      toast.error('Họ và tên phải có ít nhất 2 ký tự');
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      toast.error('Số điện thoại phải có từ 10 đến 15 chữ số');
      return;
    }

    const allowedRoles = ['DRIVER', 'STAFF', 'ADMIN'];
    if (!allowedRoles.includes(role.toUpperCase())) {
      toast.error('Vai trò không hợp lệ');
      return;
    }

    onSubmit({ email, fullName, password, role, phone });
    setEmail('');
    setFullName('');
    setPassword('');
    setPhone('');
    setRole('STAFF');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a new user to the system.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 84901234567"
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN" className="text-sm">Admin</SelectItem>
                  <SelectItem value="STAFF" className="text-sm">Staff</SelectItem>
                  {/* backend expects DRIVER; label as 'User' for clarity */}
                  <SelectItem value="DRIVER" className="text-sm">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllUsers({ page: 1, limit: 50 });
      if (res && res.success) {
        setUsers(res.data?.users || []);
      } else {
        throw new Error(res?.message || 'Failed to load users');
      }
    } catch (err: any) {
      console.error('Load users error', err);
      setError(err.message || 'Lỗi khi tải người dùng');
      toast.error(err.message || 'Lỗi khi tải người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (userData: {
    password: string; email: string; fullName: string; role: string; phone?: string
}) => {
    try {
      // helpful debug: log payload sent to backend
      const payload = {
        email: userData.email,
        full_name: userData.fullName,
        password: userData.password,
        role: userData.role,
        phone: userData.phone,
      };
      // eslint-disable-next-line no-console
      console.debug('Creating user with payload:', payload);
      const res = await createUser(payload);
      if (res.success) {
        toast.success('Tạo người dùng thành công');
        setIsCreateModalOpen(false);
        fetchUsers();
      } else {
        throw new Error(res.message || 'Failed to create user');
      }
    } catch (error: any) {
      // Log full error and show validation messages when available
      // eslint-disable-next-line no-console
      console.error('Error creating user:', error);
      if (error?.data?.errors && Array.isArray(error.data.errors)) {
        const messages = error.data.errors.map((e: any) => `${e.field}: ${e.message}`).join('\n');
        toast.error(messages);
      } else if (error?.data?.message) {
        toast.error(error.data.message);
      } else {
        toast.error(error.message || 'Lỗi khi tạo người dùng');
      }
    }
  };
  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const res = await updateUserStatus(userId, status);
      if (res && res.success) {
        toast.success('Cập nhật trạng thái thành công');
        fetchUsers();
      } else {
        throw new Error(res?.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        const res = await deleteUser(userId);
        if (res.success) {
          toast.success('Xóa người dùng thành công');
          fetchUsers();
        } else {
          throw new Error(res.message || 'Failed to delete user');
        }
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error(error.message || 'Lỗi khi xóa người dùng');
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-600">Danh sách người dùng hệ thống</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Người dùng</CardTitle>
          <CardDescription>Danh sách tất cả người dùng (admin)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <p>Đang tải...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Họ và tên</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Số điện thoại</th>
                    <th className="p-2">Vai trò</th>
                    <th className="p-2">Trạng thái</th>
                    <th className="p-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-t">
                      <td className="p-2 align-top text-sm">{u.full_name}</td>
                      <td className="p-2 align-top text-sm">{u.email}</td>
                      <td className="p-2 align-top text-sm">{u.phone || 'N/A'}</td>
                      <td className="p-2 align-top text-sm">{u.role}</td>
                      <td className="p-2 align-top text-sm">
                        <Select
                          value={u.status || 'INACTIVE'}
                          onValueChange={(newStatus) => handleUpdateStatus(u.user_id, newStatus)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 align-top text-sm">
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