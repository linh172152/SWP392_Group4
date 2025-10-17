import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  UserCheck,
  Clock,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield
} from 'lucide-react';

// Dữ liệu nhân viên mẫu
const mockEmployees = [
  {
    id: 'EMP001',
    name: 'Nguyễn Văn Minh',
    email: 'minh.nguyen@evswap.com',
    phone: '+84 901 234 567',
    position: 'Kỹ thuật viên Pin',
    department: 'Kỹ thuật',
    status: 'active',
    joinDate: '2023-06-15',
    avatar: '',
    shift: 'Sáng (6:00 - 14:00)',
    salary: 15000000
  },
  {
    id: 'EMP002',
    name: 'Trần Thị Lan',
    email: 'lan.tran@evswap.com',
    phone: '+84 902 345 678',
    position: 'Nhân viên Vận hành',
    department: 'Vận hành',
    status: 'active',
    joinDate: '2023-08-20',
    avatar: '',
    shift: 'Chiều (14:00 - 22:00)',
    salary: 12000000
  },
  {
    id: 'EMP003',
    name: 'Lê Hoàng Nam',
    email: 'nam.le@evswap.com',
    phone: '+84 903 456 789',
    position: 'Trưởng ca',
    department: 'Quản lý',
    status: 'on-leave',
    joinDate: '2023-03-10',
    avatar: '',
    shift: 'Đêm (22:00 - 6:00)',
    salary: 18000000
  },
  {
    id: 'EMP004',
    name: 'Phạm Thị Thu',
    email: 'thu.pham@evswap.com',
    phone: '+84 904 567 890',
    position: 'Nhân viên Bảo trì',
    department: 'Bảo trì',
    status: 'inactive',
    joinDate: '2023-01-05',
    avatar: '',
    shift: 'Sáng (6:00 - 14:00)',
    salary: 13000000
  }
];

const EmployeeManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<typeof mockEmployees[0] | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-50/80 dark:bg-green-500/10 text-green-800 dark:text-green-400 border-green-200/50 dark:border-green-500/20';
      case 'on-leave': return 'bg-yellow-50/80 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-500/20';
      case 'inactive': return 'bg-red-50/80 dark:bg-red-500/10 text-red-800 dark:text-red-400 border-red-200/50 dark:border-red-500/20';
      default: return 'bg-slate-50/80 dark:bg-slate-500/10 text-slate-800 dark:text-slate-400 border-slate-200/50 dark:border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="h-4 w-4" />;
      case 'on-leave': return <Clock className="h-4 w-4" />;
      case 'inactive': return <UserX className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Đang làm việc';
      case 'on-leave': return 'Nghỉ phép';
      case 'inactive': return 'Không hoạt động';
      default: return status;
    }
  };

  const filteredEmployees = mockEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEmployees = mockEmployees.length;
  const activeEmployees = mockEmployees.filter(e => e.status === 'active').length;
  const onLeaveEmployees = mockEmployees.filter(e => e.status === 'on-leave').length;
  const avgSalary = mockEmployees.reduce((sum, e) => sum + e.salary, 0) / mockEmployees.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">Quản lý Nhân viên</h1>
          <p className="text-slate-600 dark:text-slate-300">Quản lý thông tin, phân quyền và lịch làm việc của toàn bộ nhân viên</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" />
              Thêm Nhân viên
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">Thêm nhân viên mới</DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Nhập thông tin chi tiết để thêm nhân viên mới vào hệ thống
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Họ và tên</Label>
                  <Input id="name" placeholder="Nhập họ và tên" className="glass border-slate-200/50 dark:border-slate-700/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                  <Input id="email" type="email" placeholder="email@evswap.com" className="glass border-slate-200/50 dark:border-slate-700/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Số điện thoại</Label>
                  <Input id="phone" placeholder="+84 901 234 567" className="glass border-slate-200/50 dark:border-slate-700/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-slate-700 dark:text-slate-300">Vị trí</Label>
                  <Select>
                    <SelectTrigger className="glass border-slate-200/50 dark:border-slate-700/50">
                      <SelectValue placeholder="Chọn vị trí" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-0">
                      <SelectItem value="technician">Kỹ thuật viên Pin</SelectItem>
                      <SelectItem value="operator">Nhân viên Vận hành</SelectItem>
                      <SelectItem value="supervisor">Trưởng ca</SelectItem>
                      <SelectItem value="maintenance">Nhân viên Bảo trì</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="glass border-slate-200/50 dark:border-slate-700/50">
                  Hủy
                </Button>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  Thêm nhân viên
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tổng nhân viên</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Đang làm việc</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Nghỉ phép</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{onLeaveEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glow-hover group">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Lương trung bình</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{(avgSalary / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="glass-card border-0 glow">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Tìm kiếm theo tên, email, vị trí..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-slate-200/50 dark:border-slate-700/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="glass-card border-0 glow-hover group">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="w-16 h-16 ring-2 ring-green-500/20 dark:ring-emerald-500/20">
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg">
                    {employee.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{employee.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{employee.position}</p>
                    </div>
                    <Badge className={getStatusColor(employee.status)}>
                      {getStatusIcon(employee.status)}
                      <span className="ml-1">{getStatusLabel(employee.status)}</span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">{employee.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">{employee.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">{employee.shift}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">Tham gia: {employee.joinDate}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="glass border-green-200/50 dark:border-emerald-400/30">
                      <Edit className="mr-1 h-3 w-3" />
                      Chỉnh sửa
                    </Button>
                    <Button variant="outline" size="sm" className="glass border-blue-200/50 dark:border-blue-400/30">
                      Chi tiết
                    </Button>
                    <Button variant="outline" size="sm" className="glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10">
                      <Trash2 className="mr-1 h-3 w-3" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="glass-card border-0">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Không tìm thấy nhân viên</h3>
            <p className="text-slate-600 dark:text-slate-400">Thử thay đổi từ khóa tìm kiếm</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeManagement;