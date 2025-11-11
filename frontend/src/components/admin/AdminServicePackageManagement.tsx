import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Package,
  Search,
  Plus,
  Edit3,
  DollarSign,
  Zap,
  Filter,
  Eye,
  RotateCcw,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  adminGetPackages,
  adminCreatePackage,
  adminUpdatePackage,
} from '../../services/package.service';
import type {
  ServicePackage,
  CreatePackageRequest,
} from '../../services/package.service';

type StatusFilter = 'all' | 'active' | 'inactive';
type SortBy = 'name' | 'price' | 'capacity' | 'created';

const initialFormData: CreatePackageRequest = {
  name: '',
  description: '',
  price: 0,
  battery_capacity_kwh: 0,
  duration_days: 0,
  billing_cycle: 'monthly',
  benefits: [],
  is_active: true,
};

const AdminServicePackageManagement: React.FC = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingPackage, setViewingPackage] = useState<ServicePackage | null>(null);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [formData, setFormData] = useState<CreatePackageRequest>(initialFormData);
  const [benefitsText, setBenefitsText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await adminGetPackages();
      setPackages(response.data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Lỗi khi tải danh sách gói dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const benefitsArray = benefitsText 
        ? benefitsText.split(',').map((b: string) => b.trim()).filter((b: string) => b.length > 0)
        : [];

      const submitData = {
        ...formData,
        benefits: benefitsArray,
      };

      if (editingPackage) {
        await adminUpdatePackage(editingPackage.package_id, submitData);
        toast.success('Cập nhật gói dịch vụ thành công!');
      } else {
        await adminCreatePackage(submitData);
        toast.success('Tạo gói dịch vụ thành công!');
      }

      await fetchPackages();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Lỗi khi lưu gói dịch vụ');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleViewPackage = (pkg: ServicePackage) => {
    setViewingPackage(pkg);
    setShowViewModal(true);
  };

  const handleEditPackage = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price,
      battery_capacity_kwh: pkg.battery_capacity_kwh,
      duration_days: pkg.duration_days,
      billing_cycle: pkg.billing_cycle,
      benefits: pkg.benefits || [],
      is_active: pkg.is_active,
    });
    setBenefitsText(Array.isArray(pkg.benefits) ? pkg.benefits.join(', ') : '');
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowViewModal(false);
    setEditingPackage(null);
    setViewingPackage(null);
    setFormData(initialFormData);
    setBenefitsText('');
  };

  const filteredAndSortedPackages = packages
    .filter(pkg => {
      if (statusFilter === 'active' && !pkg.is_active) return false;
      if (statusFilter === 'inactive' && pkg.is_active) return false;
      if (searchTerm && !pkg.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'capacity':
          return a.battery_capacity_kwh - b.battery_capacity_kwh;
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };



  const getBillingCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return 'Hàng tháng';
      case 'yearly': return 'Hàng năm';
      case 'custom': return 'Tùy chỉnh';
      default: return cycle;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý gói dịch vụ</h1>
          <p className="text-muted-foreground">
            Quản lý và cấu hình các gói dịch vụ cho nền tảng
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Tạo gói mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Tổng gói</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{packages.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Đang hoạt động</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {packages.filter(p => p.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-rose-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Tạm dừng</CardTitle>
            <RotateCcw className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {packages.filter(p => !p.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">TB Giá</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-800 truncate">
              {packages.length > 0 ? formatPrice(packages.reduce((sum, p) => sum + Number(p.price), 0) / packages.length) : '0 ₫'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
            <Filter className="h-5 w-5 text-slate-600" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm gói dịch vụ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="min-w-[140px]">
                <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                    <SelectItem value="all" className="hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        Tất cả
                      </div>
                    </SelectItem>
                    <SelectItem value="active" className="hover:bg-green-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Hoạt động
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive" className="hover:bg-red-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Tạm dừng
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[140px]">
                <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                    <SelectItem value="name" className="hover:bg-blue-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        📝 Theo tên
                      </div>
                    </SelectItem>
                    <SelectItem value="price" className="hover:bg-green-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        💰 Theo giá
                      </div>
                    </SelectItem>
                    <SelectItem value="capacity" className="hover:bg-orange-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        🔋 Theo dung lượng
                      </div>
                    </SelectItem>
                    <SelectItem value="created" className="hover:bg-purple-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        📅 Ngày tạo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packages Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex flex-col justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 animate-pulse">Đang tải gói dịch vụ...</p>
          </div>
        ) : filteredAndSortedPackages.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Không tìm thấy gói dịch vụ nào</p>
            <p className="text-gray-400 text-sm mt-2">Hãy thử thay đổi bộ lọc hoặc tạo gói mới</p>
          </div>
        ) : (
          filteredAndSortedPackages.map((pkg) => (
            <Card key={pkg.package_id} className={`relative transition-all duration-200 hover:shadow-lg ${
              pkg.is_active 
                ? 'border-green-200 hover:border-green-300 bg-gradient-to-br from-white to-green-50' 
                : 'border-gray-200 hover:border-gray-300 bg-gradient-to-br from-white to-gray-50'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-gray-800">{pkg.name}</CardTitle>
                    {pkg.description && (
                      <CardDescription className="text-sm text-gray-600">
                        {pkg.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge 
                    variant={pkg.is_active ? "default" : "secondary"}
                    className={pkg.is_active 
                      ? "bg-green-100 text-green-700 hover:bg-green-200" 
                      : "bg-gray-100 text-gray-600"
                    }
                  >
                    {pkg.is_active ? 'Hoạt động' : 'Tạm dừng'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dung lượng pin:</span>
                    <span className="font-semibold">{pkg.battery_capacity_kwh} kWh</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Thời hạn:</span>
                    <span className="font-semibold">{pkg.duration_days} ngày</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Chu kỳ:</span>
                    <span className="font-semibold">{getBillingCycleLabel(pkg.billing_cycle)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Giá:</span>
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{formatPrice(pkg.price)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPackage(pkg)}
                    className="flex-1 gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <Eye className="h-3 w-3" />
                    Xem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPackage(pkg)}
                    className="flex-1 gap-1 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                  >
                    <Edit3 className="h-3 w-3" />
                    Sửa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Chỉnh sửa gói dịch vụ' : 'Tạo gói dịch vụ mới'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage 
                ? 'Cập nhật thông tin gói dịch vụ' 
                : 'Điền thông tin để tạo gói dịch vụ mới'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên gói *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Nhập tên gói dịch vụ"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Giá (VND) *</label>
                <Input
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dung lượng pin (kWh) *</label>
                <Input
                  name="battery_capacity_kwh"
                  type="number"
                  value={formData.battery_capacity_kwh}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.1"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Thời hạn (ngày) *</label>
                <Input
                  name="duration_days"
                  type="number"
                  value={formData.duration_days}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chu kỳ thanh toán *</label>
              <select
                name="billing_cycle"
                value={formData.billing_cycle}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="monthly">Hàng tháng</option>
                <option value="yearly">Hàng năm</option>
                <option value="custom">Tùy chỉnh</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="Mô tả gói dịch vụ..."
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lợi ích</label>
              <textarea
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                rows={3}
                placeholder="Nhập các lợi ích, cách nhau bởi dấu phẩy..."
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Ví dụ: Hỗ trợ 24/7, Bảo hành 1 năm, Miễn phí vận chuyển
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="rounded border-input focus:ring-2 focus:ring-ring"
              />
              <label className="text-sm font-medium">Kích hoạt gói dịch vụ</label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="flex-1">
                Hủy
              </Button>
              <Button type="submit" className="flex-1">
                {editingPackage ? 'Cập nhật' : 'Tạo gói'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết gói dịch vụ</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về gói dịch vụ
            </DialogDescription>
          </DialogHeader>
          {viewingPackage && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Tên gói</h3>
                    <p className="font-semibold">{viewingPackage.name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Giá</h3>
                    <p className="text-lg font-bold text-primary">{formatPrice(viewingPackage.price)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Dung lượng pin</h3>
                    <p className="font-semibold">{viewingPackage.battery_capacity_kwh} kWh</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Thời hạn</h3>
                    <p className="font-semibold">{viewingPackage.duration_days} ngày</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Chu kỳ thanh toán</h3>
                    <p className="font-semibold">{getBillingCycleLabel(viewingPackage.billing_cycle)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Trạng thái</h3>
                    <Badge variant={viewingPackage.is_active ? "default" : "secondary"}>
                      {viewingPackage.is_active ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                  </div>
                </div>
              </div>

              {viewingPackage.description && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Mô tả</h3>
                  <p className="text-sm leading-relaxed">{viewingPackage.description}</p>
                </div>
              )}

              {viewingPackage.benefits && Array.isArray(viewingPackage.benefits) && viewingPackage.benefits.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">Lợi ích</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {viewingPackage.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm">{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Ngày tạo</h3>
                  <p className="text-sm">{new Date(viewingPackage.created_at).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Cập nhật lần cuối</h3>
                  <p className="text-sm">{new Date(viewingPackage.updated_at).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleCloseModal} className="flex-1">
                  Đóng
                </Button>
                <Button onClick={() => {
                  handleCloseModal();
                  handleEditPackage(viewingPackage);
                }} className="flex-1 gap-2">
                  <Edit3 className="h-4 w-4" />
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServicePackageManagement;