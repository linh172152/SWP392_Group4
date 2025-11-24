import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import topUpPackageService from '../../services/topup-package.service';
import { toast } from 'sonner';
import type { TopUpPackage } from '../../services/topup-package.service';
import { 
  Wallet, Edit2, Trash2, Plus, Check, X, Search, 
  DollarSign, Gift, Zap, TrendingUp, Package 
} from 'lucide-react';
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

const TopUpPackageManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<TopUpPackage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPackage, setNewPackage] = useState({
    name: '',
    description: '',
    topup_amount: '',
    bonus_amount: '',
    is_active: true,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await topUpPackageService.getTopUpPackages({ limit: 100 });
      if (res && res.success) {
        setPackages(res.data.packages || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch packages:', err);
      toast.error('Failed to load top-up packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name: newPackage.name,
        description: newPackage.description || undefined,
        topup_amount: parseFloat(newPackage.topup_amount),
        bonus_amount: parseFloat(newPackage.bonus_amount),
        is_active: newPackage.is_active,
      };

      if (editingPackage) {
        const res = await topUpPackageService.updateTopUpPackage(editingPackage, payload);
        if (res && res.success) {
          setPackages((prev) => prev.map((p) => (p.package_id === editingPackage ? res.data : p)));
        } else toast.error(res?.message || 'Failed to update package');
      } else {
        const res = await topUpPackageService.createTopUpPackage(payload);
        if (res && res.success) {
          setPackages((prev) => [res.data, ...prev]);
        } else toast.error(res?.message || 'Failed to create package');
      }

      setShowForm(false);
      setNewPackage({ name: '', description: '', topup_amount: '', bonus_amount: '', is_active: true });
      setEditingPackage(null);
    } catch (err: any) {
      console.error('Package operation failed', err);
      toast.error(err?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteDialog = (packageId: string, packageName: string) => {
    setPackageToDelete({ id: packageId, name: packageName });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;
    
    try {
      setLoading(true);
      const res = await topUpPackageService.deleteTopUpPackage(packageToDelete.id);
      if (res && res.success) {
        setPackages((prev) => prev.filter((p) => p.package_id !== packageToDelete.id));
        setPackageToDelete(null);
      } else toast.error(res?.message || 'Failed to delete package');
    } catch (err: any) {
      console.error('Delete package error', err);
      toast.error(err?.message || 'Delete error');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Filter packages based on search
  const filteredPackages = packages.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalPackages = packages.length;
  const activePackages = packages.filter((p) => p.is_active).length;

  return (
    <div className="container mx-auto max-w-7xl px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Gói Nạp</h1>
          <p className="text-muted-foreground">
            Quản lý các gói nạp tiền cho ví người dùng.
          </p>
        </div>
        <Button onClick={() => {
            setShowForm((v) => !v);
            setNewPackage({ name: '', description: '', topup_amount: '', bonus_amount: '', is_active: true });
            setEditingPackage(null);
          }} className="gap-2">
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
            <div className="text-2xl font-bold text-blue-800">{totalPackages}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Đang hoạt động</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{activePackages}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-50 to-rose-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Tạm dừng</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{totalPackages - activePackages}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">TB Giá trị</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-800 truncate">
              {packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + Number(p.actual_amount), 0) / packages.length).toLocaleString('vi-VN') + ' VND' : '0 VND'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-r from-slate-50 to-gray-100 border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
            <Search className="h-5 w-5 text-slate-600" />
            Tìm kiếm và lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên gói..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            {/* Add/Edit Form */}
            {showForm && (
              <form
                onSubmit={handleSubmit}
                className="mb-6 bg-gray-50 p-6 border border-gray-200 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingPackage ? 'Chỉnh sửa gói' : 'Thêm gói mới'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên gói <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full p-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Ví dụ: Gói cơ bản"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage((s) => ({ ...s, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Mô tả gói (tùy chọn)"
                      value={newPackage.description}
                      onChange={(e) => setNewPackage((s) => ({ ...s, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền nạp (VND) <span className="text-red-500">*</span>
                    </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Ví dụ: 100000"
                        value={newPackage.topup_amount}
                        onChange={(e) => setNewPackage((s) => ({ ...s, topup_amount: e.target.value }))}
                        required
                      />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số tiền thưởng (VND) <span className="text-red-500">*</span>
                    </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full p-2 border border-gray-300 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Ví dụ: 10000"
                        value={newPackage.bonus_amount}
                        onChange={(e) => setNewPackage((s) => ({ ...s, bonus_amount: e.target.value }))}
                        required
                      />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPackage.is_active}
                        onChange={(e) => setNewPackage((s) => ({ ...s, is_active: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Trạng thái hoạt động</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setNewPackage({ name: '', description: '', topup_amount: '', bonus_amount: '', is_active: true });
                      setEditingPackage(null);
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {editingPackage ? 'Cập nhật' : 'Tạo gói'}
                  </button>
                </div>
              </form>
            )}

            {/* Package List */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="col-span-full flex flex-col justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                  <p className="text-gray-600 animate-pulse">Đang tải gói nạp tiền...</p>
                </div>
              ) : filteredPackages.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">Không tìm thấy gói nạp tiền nào</p>
                  <p className="text-gray-400 text-sm mt-2">Hãy thử thay đổi từ khóa tìm kiếm hoặc tạo gói mới</p>
                </div>
              ) : (
                filteredPackages.map((pkg) => {
                  const actualAmount = Number(pkg.actual_amount);
                  const topupAmount = Number(pkg.topup_amount);
                  const bonusAmount = Number(pkg.bonus_amount);
                  const bonusPercentage = topupAmount > 0 ? (bonusAmount / topupAmount) * 100 : 0;

                  return (
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
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              pkg.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {pkg.is_active ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Số tiền nạp:</span>
                            <span className="font-semibold">{topupAmount.toLocaleString('vi-VN')} VND</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Thưởng:</span>
                            <span className="font-semibold">{bonusAmount.toLocaleString('vi-VN')} VND</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Tổng nhận được:</span>
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{actualAmount.toLocaleString('vi-VN')} VND</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                          <button
                            onClick={() => {
                              setNewPackage({
                                name: pkg.name,
                                description: pkg.description || '',
                                topup_amount: String(topupAmount),
                                bonus_amount: String(bonusAmount),
                                is_active: pkg.is_active,
                              });
                              setEditingPackage(pkg.package_id);
                              setShowForm(true);
                            }}
                            className="flex-1 gap-1 px-3 py-2 border border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 rounded-xl text-sm font-medium flex items-center justify-center"
                          >
                            <Edit2 className="h-3 w-3" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleOpenDeleteDialog(pkg.package_id, pkg.name)}
                            className="flex-1 gap-1 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl text-sm font-medium flex items-center justify-center"
                          >
                            <Trash2 className="h-3 w-3" />
                            Xóa
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>


          </CardContent>
        </Card>
      </div>
      {/* Delete Package Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Xác nhận xóa gói nạp tiền
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa gói "{packageToDelete?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {loading ? "Đang xử lý..." : "Xác nhận xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TopUpPackageManagement;
