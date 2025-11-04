import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import topUpPackageService from '../../services/topup-package.service';
import { toast } from 'sonner';
import type { TopUpPackage } from '../../services/topup-package.service';
import { 
  Wallet, Edit2, Trash2, Plus, Check, X, Search, 
  DollarSign, Gift, Zap, TrendingUp, Package 
} from 'lucide-react';

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
          toast.success('✅ Package updated successfully');
        } else toast.error(res?.message || 'Failed to update package');
      } else {
        const res = await topUpPackageService.createTopUpPackage(payload);
        if (res && res.success) {
          setPackages((prev) => [res.data, ...prev]);
          toast.success('✅ Package created successfully');
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

  const handleDelete = async (packageId: string, packageName: string) => {
    if (!confirm(`Delete package "${packageName}"?\n\nThis action cannot be undone.`)) return;
    
    try {
      setLoading(true);
      const res = await topUpPackageService.deleteTopUpPackage(packageId);
      if (res && res.success) {
        setPackages((prev) => prev.filter((p) => p.package_id !== packageId));
        toast.success('🗑️ Package deleted successfully');
      } else toast.error(res?.message || 'Failed to delete package');
    } catch (err: any) {
      console.error('Delete package error', err);
      toast.error(err?.message || 'Delete error');
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 p-6">
      {/* Hero Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Wallet className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">
                  Quản Lí Gói Nạp
                </h1>
                <p className="text-emerald-100 text-lg mt-1">
                  Quản lý các gói nạp tiền cho ví
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Package className="h-6 w-6 text-blue-200" />
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm">Total Packages</p>
                    <p className="text-3xl font-bold text-white">{totalPackages}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Zap className="h-6 w-6 text-green-200" />
                  </div>
                  <div>
                    <p className="text-emerald-100 text-sm">Active Packages</p>
                    <p className="text-3xl font-bold text-white">{activePackages}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-teal-50 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  Quản lí các gói
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                        Tổng hợp các gói nạp tiền vào ví của người dùng
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search packages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-64 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                  />
                </div>

                {/* Add Button */}
                <button
                  onClick={() => {
                    setShowForm((v) => !v);
                    setNewPackage({ name: '', description: '', topup_amount: '', bonus_amount: '', is_active: true });
                    setEditingPackage(null);
                  }}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 ${
                    showForm
                      ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {showForm ? (
                    <>
                      <X className="h-5 w-5" /> Close
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" /> Add Package
                    </>
                  )}
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Add/Edit Form */}
            {showForm && (
              <form
                onSubmit={handleSubmit}
                className="mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 border-2 border-emerald-200 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {editingPackage ? 'Edit Package' : 'Add New Package'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Package Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full p-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                      placeholder="e.g., Starter Package"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage((s) => ({ ...s, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full p-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                      placeholder="Package description (optional)"
                      value={newPackage.description}
                      onChange={(e) => setNewPackage((s) => ({ ...s, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Top-Up Amount (VND) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-10 pr-3 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                        placeholder="e.g., 100000"
                        value={newPackage.topup_amount}
                        onChange={(e) => setNewPackage((s) => ({ ...s, topup_amount: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bonus Amount (VND) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-10 pr-3 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all outline-none font-medium"
                        placeholder="e.g., 10000"
                        value={newPackage.bonus_amount}
                        onChange={(e) => setNewPackage((s) => ({ ...s, bonus_amount: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer bg-white p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 transition-all w-full">
                      <input
                        type="checkbox"
                        checked={newPackage.is_active}
                        onChange={(e) => setNewPackage((s) => ({ ...s, is_active: e.target.checked }))}
                        className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Active Status</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setNewPackage({ name: '', description: '', topup_amount: '', bonus_amount: '', is_active: true });
                      setEditingPackage(null);
                    }}
                    className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Check className="h-5 w-5" />
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            )}

            {/* Package List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPackages.map((pkg, index) => {
                const actualAmount = Number(pkg.actual_amount);
                const topupAmount = Number(pkg.topup_amount);
                const bonusAmount = Number(pkg.bonus_amount);
                const bonusPercentage = topupAmount > 0 ? (bonusAmount / topupAmount) * 100 : 0;

                return (
                  <div
                    key={pkg.package_id}
                    className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
                      pkg.is_active
                        ? 'bg-gradient-to-br from-white via-emerald-50 to-teal-50 border-2 border-emerald-200'
                        : 'bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 opacity-75'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-full"></div>

                    <div className="relative p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 rounded-lg ${pkg.is_active ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-slate-400'}`}>
                              <Wallet className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                              {pkg.name}
                            </h3>
                          </div>

                          {pkg.description && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{pkg.description}</p>
                          )}

                          {/* Price Display */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600 font-medium">Top-Up Amount</span>
                              <span className="text-lg font-bold text-slate-900">
                                {topupAmount.toLocaleString('vi-VN')} VND
                              </span>
                            </div>

                            {bonusAmount > 0 && (
                              <div className="flex items-center justify-between bg-amber-50 -mx-2 px-2 py-1 rounded-lg">
                                <span className="text-sm text-amber-700 font-medium flex items-center gap-1">
                                  <Gift className="h-4 w-4" />
                                  Bonus
                                </span>
                                <span className="text-lg font-bold text-amber-700">
                                  +{bonusAmount.toLocaleString('vi-VN')} VND
                                </span>
                              </div>
                            )}

                            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>

                            <div className="flex items-baseline justify-between">
                              <span className="text-sm text-emerald-700 font-semibold flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                Total Received
                              </span>
                              <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                {actualAmount.toLocaleString('vi-VN')}
                              </span>
                            </div>

                            {bonusPercentage > 0 && (
                              <div className="text-center">
                                <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-md">
                                  🎁 +{bonusPercentage.toFixed(0)}% Bonus
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="relative ml-2">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                              pkg.is_active
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                : 'bg-slate-300 text-slate-700'
                            }`}
                          >
                            {pkg.is_active ? '✓ Active' : '✕ Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-4"></div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
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
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.package_id, pkg.name)}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            Updated
                          </span>
                          <span className="font-medium">
                            {new Date(pkg.updated_at).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredPackages.length === 0 && !loading && (
              <div className="col-span-full">
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl"></div>
                    <Wallet className="relative h-24 w-24 mx-auto mb-6 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">
                    {searchQuery ? 'No results found' : 'No packages available'}
                  </h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    {searchQuery
                      ? `No packages match "${searchQuery}"`
                      : 'Get started by adding your first top-up package'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Add Your First Package
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && packages.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-16">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-slate-600 font-medium mt-4">Loading packages...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TopUpPackageManagement;
