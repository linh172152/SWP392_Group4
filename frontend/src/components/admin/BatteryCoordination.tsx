import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import batteryPricingService from '../../services/battery-pricing.service';
import { toast } from 'sonner';
import type { BatteryPricing } from '../../services/battery-pricing.service';
import { DollarSign, Edit2, Trash2, Plus, Check, X, Battery, Zap, TrendingUp, Search } from 'lucide-react';

const BatteryCoordination: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [pricings, setPricings] = useState<BatteryPricing[]>([]);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [newPricing, setNewPricing] = useState({ battery_model: '', price: '', is_active: true });
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPricing = async () => {
      setLoading(true);
      try {
        const pricingRes = await batteryPricingService.getBatteryPricing({ limit: 100 });
        if (pricingRes && pricingRes.success) {
          setPricings(pricingRes.data.pricings || []);
        }
      } catch (err: any) {
        console.error('Failed to fetch pricing:', err);
        toast.error('Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    };
    fetchPricing();
  }, []);

  // Filter pricings based on search
  const filteredPricings = pricings.filter((p) =>
    p.battery_model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalPricings = pricings.length;
  const activePricings = pricings.filter((p) => p.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Hero Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Battery className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">
                  Quản lí Pin
                </h1>
                <p className="text-blue-100 text-lg mt-1">
                  Quản lý và cấu hình giá cho tất cả các mẫu pin
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-emerald-200" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Total Models</p>
                    <p className="text-3xl font-bold text-white">{totalPricings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <Zap className="h-6 w-6 text-green-200" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm">Active Pricing</p>
                    <p className="text-3xl font-bold text-white">{activePricings}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  Danh sách giá pin
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Quản lý và cấu hình tất cả các mẫu pin
                </CardDescription>
              </div>

              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-64 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                {/* Add Button */}
                <button
                  onClick={() => {
                    setShowPricingForm((v) => !v);
                    setNewPricing({ battery_model: '', price: '', is_active: true });
                    setEditingPricing(null);
                  }}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 ${
                    showPricingForm
                      ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {showPricingForm ? (
                    <>
                      <X className="h-5 w-5" /> Close
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" /> Add Pricing
                    </>
                  )}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Add/Edit Pricing Form */}
            {showPricingForm && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setLoading(true);
                    const payload = {
                      battery_model: newPricing.battery_model,
                      price: parseFloat(newPricing.price),
                      is_active: newPricing.is_active,
                    };

                    if (editingPricing) {
                      const res = await batteryPricingService.updateBatteryPricing(editingPricing, payload);
                      if (res && res.success) {
                        setPricings((prev) => prev.map((p) => (p.pricing_id === editingPricing ? res.data : p)));
                        toast.success('✅ Pricing updated successfully');
                      } else toast.error(res?.message || 'Failed to update pricing');
                    } else {
                      const res = await batteryPricingService.createBatteryPricing(payload);
                      if (res && res.success) {
                        setPricings((prev) => [res.data, ...prev]);
                        toast.success('✅ Pricing added successfully');
                      } else toast.error(res?.message || 'Failed to add pricing');
                    }

                    setShowPricingForm(false);
                    setNewPricing({ battery_model: '', price: '', is_active: true });
                    setEditingPricing(null);
                  } catch (err: any) {
                    console.error('Pricing operation failed', err);
                    toast.error(err?.message || 'Operation failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-2 border-blue-200 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {editingPricing ? 'Edit Pricing Configuration' : 'Add New Pricing'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Battery Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full p-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                      placeholder="e.g., Standard Range"
                      value={newPricing.battery_model}
                      onChange={(e) => setNewPricing((s) => ({ ...s, battery_model: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Price (VND) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        className="w-full pl-10 pr-3 py-3 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                        placeholder="e.g., 50000"
                        value={newPricing.price}
                        onChange={(e) => setNewPricing((s) => ({ ...s, price: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer bg-white p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 transition-all w-full">
                      <input
                        type="checkbox"
                        checked={newPricing.is_active}
                        onChange={(e) => setNewPricing((s) => ({ ...s, is_active: e.target.checked }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">Active Status</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPricingForm(false);
                      setNewPricing({ battery_model: '', price: '', is_active: true });
                      setEditingPricing(null);
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
                    {editingPricing ? 'Update Pricing' : 'Create Pricing'}
                  </button>
                </div>
              </form>
            )}

            {/* Pricing List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredPricings.map((pricing, index) => (
                <div
                  key={pricing.pricing_id}
                  className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
                    pricing.is_active
                      ? 'bg-gradient-to-br from-white via-blue-50 to-indigo-50 border-2 border-blue-200'
                      : 'bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 opacity-75'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full"></div>

                  <div className="relative p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-2 rounded-lg ${pricing.is_active ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-slate-400'}`}>
                            <Battery className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {pricing.battery_model}
                          </h3>
                        </div>

                        {/* Price Display */}
                        <div className="mt-3">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {pricing.price.toLocaleString('vi-VN')}
                            </span>
                            <span className="text-lg font-semibold text-slate-500">VND</span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">per swap</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="relative">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                            pricing.is_active
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          {pricing.is_active ? '✓ Active' : '✕ Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-4"></div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setNewPricing({
                            battery_model: pricing.battery_model,
                            price: String(pricing.price),
                            is_active: pricing.is_active,
                          });
                          setEditingPricing(pricing.pricing_id);
                          setShowPricingForm(true);
                        }}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete pricing for "${pricing.battery_model}"?\n\nThis action cannot be undone.`))
                            return;
                          try {
                            setLoading(true);
                            const res = await batteryPricingService.deleteBatteryPricing(pricing.pricing_id);
                            if (res && res.success) {
                              setPricings((prev) => prev.filter((p) => p.pricing_id !== pricing.pricing_id));
                              toast.success('🗑️ Pricing deleted successfully');
                            } else toast.error(res?.message || 'Failed to delete pricing');
                          } catch (err: any) {
                            console.error('Delete pricing error', err);
                            toast.error(err?.message || 'Delete error');
                          } finally {
                            setLoading(false);
                          }
                        }}
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
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          Updated
                        </span>
                        <span className="font-medium">
                          {new Date(pricing.updated_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredPricings.length === 0 && !loading && (
              <div className="col-span-full">
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl"></div>
                    <DollarSign className="relative h-24 w-24 mx-auto mb-6 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">
                    {searchQuery ? 'No results found' : 'No pricing data available'}
                  </h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    {searchQuery
                      ? `No pricing configurations match "${searchQuery}"`
                      : 'Get started by adding your first battery pricing configuration'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowPricingForm(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Add Your First Pricing
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && pricings.length === 0 && (
              <div className="col-span-full">
                <div className="text-center py-16">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-slate-600 font-medium mt-4">Loading pricing data...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BatteryCoordination;
