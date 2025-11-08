import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import batteryPricingService from '../../services/battery-pricing.service';
import batteryTransferService from '../../services/battery-transfer.service';
import { getAllStations } from '../../services/station.service';
import { getAdminBatteries } from '../../services/battery.service';

import { toast } from 'sonner';
import type { BatteryPricing } from '../../services/battery-pricing.service';
import type { BatteryTransfer, CreateBatteryTransferDto } from '../../services/battery-transfer.service';

import { DollarSign, Edit2, Trash2, Plus, Check, X, Battery, Zap, TrendingUp, Search, ArrowRightLeft, Truck, Clock, CheckCircle, XCircle, AlertCircle, Eye, Info, MapPin, User, Calendar } from 'lucide-react';

const BatteryPricingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'transfer'>('pricing');
  const [loading, setLoading] = useState(false);
  
  // Pricing state
  const [pricings, setPricings] = useState<BatteryPricing[]>([]);
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [newPricing, setNewPricing] = useState({ battery_model: '', price: '', is_active: true });
  const [editingPricing, setEditingPricing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Transfer state
  const [transfers, setTransfers] = useState<BatteryTransfer[]>([]);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [newTransfer, setNewTransfer] = useState<CreateBatteryTransferDto & { from_station_id?: string }>({
    from_station_id: '',
    battery_id: '',
    to_station_id: '',
    transfer_reason: '',
    notes: ''
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTransfer, setSelectedTransfer] = useState<BatteryTransfer | null>(null);
  const [showTransferDetail, setShowTransferDetail] = useState(false);
  
  // Dropdown data
  const [stations, setStations] = useState<any[]>([]);
  const [batteries, setBatteries] = useState<any[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingBatteries, setLoadingBatteries] = useState(false);

  useEffect(() => {
    if (activeTab === 'pricing') {
      fetchPricing();
    } else {
      // Thêm delay giữa các API calls để tránh rate limit
      fetchTransfers();
      setTimeout(() => fetchStations(), 500);
      setTimeout(() => fetchBatteries(), 1000);
    }
  }, [activeTab]);

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

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const transferRes = await batteryTransferService.getBatteryTransfers({ limit: 100 });
      if (transferRes && transferRes.success) {
        setTransfers(transferRes.data.transfers || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch transfers:', err);
      toast.error('Failed to load transfer data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    setLoadingStations(true);
    try {
      const stationRes = await getAllStations();
      if (stationRes && stationRes.success) {
        setStations(stationRes.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch stations:', err);
      toast.error('Failed to load station data');
    } finally {
      setLoadingStations(false);
    }
  };

  const fetchBatteries = async () => {
    setLoadingBatteries(true);
    try {
      const batteryRes = await getAdminBatteries();
      if (batteryRes && batteryRes.success) {
        setBatteries(batteryRes.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch batteries:', err);
      toast.error('Failed to load battery data');
    } finally {
      setLoadingBatteries(false);
    }
  };

  const handleBatteryChange = (batteryId: string) => {
    const selectedBattery = batteries.find(b => b.battery_id === batteryId);
    setNewTransfer((s: CreateBatteryTransferDto) => ({ 
      ...s, 
      battery_id: batteryId,
      // Clear destination station if it's the same as selected battery's current station
      to_station_id: selectedBattery?.station_id === s.to_station_id ? '' : s.to_station_id
    }));
  };

  // Get current station of selected battery
  const selectedBattery = batteries.find(b => b.battery_id === newTransfer.battery_id);

  // Filter batteries based on selected from_station for transfer
  const filteredBatteriesForTransfer = newTransfer.from_station_id 
    ? batteries.filter((battery) => battery.station_id === newTransfer.from_station_id)
    : [];

  // Filter pricings based on search
  const filteredPricings = pricings.filter((p) =>
    p.battery_model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter transfers based on status
  const filteredTransfers = transfers.filter((t) =>
    filterStatus === 'all' ? true : t.transfer_status === filterStatus
  );

  // Calculate stats
  const totalPricings = pricings.length;
  const activePricings = pricings.filter((p) => p.is_active).length;
  
  const totalTransfers = transfers.length;
  const pendingTransfers = transfers.filter((t) => t.transfer_status === 'pending').length;
  const inTransitTransfers = transfers.filter((t) => t.transfer_status === 'in_transit').length;
  const completedTransfers = transfers.filter((t) => t.transfer_status === 'completed').length;

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in_transit':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'in_transit':
        return 'Đang chuyển';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      {/* Hero Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                {activeTab === 'pricing' ? <Battery className="h-10 w-10 text-white" /> : <ArrowRightLeft className="h-10 w-10 text-white" />}
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">
                  {activeTab === 'pricing' ? 'Quản lí Giá Pin' : 'Chuyển Pin Giữa Trạm'}
                </h1>
                <p className="text-blue-100 text-lg mt-1">
                  {activeTab === 'pricing' 
                    ? 'Quản lý và cấu hình giá cho tất cả các mẫu pin'
                    : 'Quản lý việc chuyển pin giữa các trạm đổi pin'
                  }
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('pricing')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'pricing'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <DollarSign className="h-5 w-5" />
                Quản lý Giá
              </button>
              <button
                onClick={() => setActiveTab('transfer')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  activeTab === 'transfer'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <ArrowRightLeft className="h-5 w-5" />
                Chuyển Pin
              </button>
            </div>

            {/* Stats Cards */}
            {activeTab === 'pricing' ? (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-200" />
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Tổng số</p>
                      <p className="text-3xl font-bold text-white">{totalTransfers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/20 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-yellow-200" />
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Chờ xử lý</p>
                      <p className="text-3xl font-bold text-white">{pendingTransfers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/20 rounded-lg">
                      <Truck className="h-6 w-6 text-indigo-200" />
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Đang chuyển</p>
                      <p className="text-3xl font-bold text-white">{inTransitTransfers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-200" />
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm">Hoàn thành</p>
                      <p className="text-3xl font-bold text-white">{completedTransfers}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Decorative shapes */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'pricing' ? (
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
        ) : (
          /* Transfer Tab */
          <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <ArrowRightLeft className="h-6 w-6 text-white" />
                    </div>
                    Danh sách chuyển pin
                  </CardTitle>
                  <CardDescription className="text-slate-600 mt-1">
                    Quản lý việc chuyển pin giữa các trạm
                  </CardDescription>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="in_transit">Đang chuyển</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>

                  {/* Add Transfer Button */}
                  <button
                    onClick={() => {
                      setShowTransferForm((v) => !v);
                      setNewTransfer({
                        battery_id: '',
                        from_station_id: '',
                        to_station_id: '',
                        transfer_reason: '',
                        notes: ''
                      });
                    }}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2 ${
                      showTransferForm
                        ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:scale-105'
                    }`}
                  >
                    {showTransferForm ? (
                      <>
                        <X className="h-5 w-5" /> Close
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" /> Tạo chuyển pin
                      </>
                    )}
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Create Transfer Form */}
              {showTransferForm && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    
                    // Validation
                    if (!newTransfer.from_station_id) {
                      toast.error('Vui lòng chọn trạm xuất phát');
                      return;
                    }
                    
                    if (!newTransfer.battery_id) {
                      toast.error('Vui lòng chọn pin cần chuyển');
                      return;
                    }
                    
                    if (!newTransfer.to_station_id) {
                      toast.error('Vui lòng chọn trạm đích');
                      return;
                    }
                    
                    if (!newTransfer.transfer_reason || newTransfer.transfer_reason.trim() === '') {
                      toast.error('Vui lòng nhập lý do chuyển');
                      return;
                    }
                    
                    if (newTransfer.from_station_id === newTransfer.to_station_id) {
                      toast.error('Trạm đích phải khác với trạm xuất phát');
                      return;
                    }
                    
                    // Validate pin thuộc trạm đã chọn
                    const selectedBattery = batteries.find(b => b.battery_id === newTransfer.battery_id);
                    if (selectedBattery && selectedBattery.station_id !== newTransfer.from_station_id) {
                      toast.error('Pin đã chọn không thuộc trạm xuất phát');
                      return;
                    }

                    // Validate trạm đích phải ở trạng thái active
                    const destinationStation = stations.find(s => s.station_id === newTransfer.to_station_id);
                    if (destinationStation && destinationStation.status !== 'active') {
                      toast.error(`Trạm đích "${destinationStation.name}" không hoạt động. Vui lòng chọn trạm khác.`);
                      return;
                    }
                    
                    try {
                      setLoading(true);
                      console.log('New Transfer Data:', newTransfer);
                      const res = await batteryTransferService.createBatteryTransfer(newTransfer);
                      if (res && res.success) {
                        setTransfers((prev) => [res.data, ...prev]);
                        toast.success('✅ Transfer request created successfully');
                        setShowTransferForm(false);
                        setNewTransfer({
                          from_station_id: '',
                          battery_id: '',
                          to_station_id: '',
                          transfer_reason: '',
                          notes: ''
                        });
                      } else {
                        toast.error(res?.message || 'Failed to create transfer');
                      }
                    } catch (err: any) {
                      console.error('Create transfer failed', err);
                      toast.error(err?.message || 'Operation failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-2 border-blue-200 rounded-2xl shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Tạo yêu cầu chuyển pin
                    </h3>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Hướng dẫn sử dụng:</p>
                        <ul className="space-y-1 text-blue-700">
                          <li>• Bước 1: Chọn trạm xuất phát (trạm hiện tại của pin cần chuyển)</li>
                          <li>• Bước 2: Chọn pin cụ thể từ trạm đã chọn</li>
                          <li>• Bước 3: Chọn trạm đích (phải khác với trạm xuất phát và đang hoạt động)</li>
                          <li>• Chỉ hiển thị pin sẵn sàng chuyển và trạm đang hoạt động</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Chọn trạm xuất phát <span className="text-red-500">*</span>
                      </label>
                      <Select 
                        value={newTransfer.from_station_id || ''} 
                        onValueChange={(value) => {
                          setNewTransfer((s: CreateBatteryTransferDto) => ({ 
                            ...s, 
                            from_station_id: value,
                            battery_id: '' // Clear battery when station changes
                          }));
                        }}
                        disabled={loadingStations}
                      >
                        <SelectTrigger className="w-full min-h-[50px] p-4 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium bg-white text-gray-900 text-left">
                          <SelectValue 
                            placeholder={loadingStations ? "Đang tải..." : "Chọn trạm xuất phát"}
                            className="text-gray-900 truncate pr-2"
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto z-50">
                          {stations.length > 0 && (
                            <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                              <span className="text-xs text-gray-500 font-medium">
                                {stations.length} trạm khả dụng
                              </span>
                            </div>
                          )}
                          {stations.map((station, index) => (
                            <SelectItem 
                              key={station.station_id} 
                              value={station.station_id}
                              className={`hover:bg-blue-50 focus:bg-blue-100 cursor-pointer p-4 border-b border-gray-100 last:border-b-0 ${
                                index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                              }`}
                            >
                              <div className="flex flex-col w-full max-w-full">
                                <span className="font-medium text-gray-900 truncate">{station.name}</span>
                                <span className="text-sm text-gray-600 mt-1 truncate">{station.address}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {stations.length === 0 && !loadingStations && (
                            <SelectItem value="no-stations" disabled className="text-gray-500 italic p-4 text-center">
                              Không có trạm khả dụng
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Pin cần chuyển <span className="text-red-500">*</span>
                      </label>
                      {!newTransfer.from_station_id && (
                        <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <span className="text-sm text-yellow-700">
                            ⚠️ Vui lòng chọn trạm xuất phát trước để xem danh sách pin
                          </span>
                        </div>
                      )}
                      {selectedBattery && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <span className="text-sm text-blue-700">
                            📍 Trạm hiện tại: <span className="font-medium">{selectedBattery.station?.name}</span>
                          </span>
                        </div>
                      )}
                      <Select 
                        value={newTransfer.battery_id} 
                        onValueChange={handleBatteryChange}
                        disabled={loadingBatteries || !newTransfer.from_station_id}
                      >
                        <SelectTrigger className="w-full min-h-[50px] p-4 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium bg-white text-gray-900 text-left">
                          <SelectValue 
                            placeholder={
                              !newTransfer.from_station_id ? "Chọn trạm xuất phát trước" :
                              loadingBatteries ? "Đang tải..." : 
                              `Chọn pin từ ${stations.find(s => s.station_id === newTransfer.from_station_id)?.name || 'trạm đã chọn'}`
                            }
                            className="text-gray-900 truncate pr-2"
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto z-50">
                          {filteredBatteriesForTransfer.length > 0 && (
                            <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                              <span className="text-xs text-gray-500 font-medium">
                                {filteredBatteriesForTransfer.length} pin tại trạm {stations.find(s => s.station_id === newTransfer.from_station_id)?.name}
                              </span>
                            </div>
                          )}
                          {filteredBatteriesForTransfer.map((battery, index) => (
                            <SelectItem 
                              key={battery.battery_id} 
                              value={battery.battery_id}
                              className={`hover:bg-blue-50 focus:bg-blue-100 cursor-pointer p-4 border-b border-gray-100 last:border-b-0 ${
                                index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                              }`}
                            >
                              <div className="flex flex-col w-full max-w-full">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="font-medium text-gray-900 truncate flex-1">{battery.battery_code}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                    battery.current_charge >= 90 ? 'bg-green-100 text-green-800' :
                                    battery.current_charge >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {battery.current_charge}%
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600 mt-1 truncate">
                                  {battery.model} - {battery.capacity_kwh}kWh
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                          {filteredBatteriesForTransfer.length === 0 && !loadingBatteries && newTransfer.from_station_id && (
                            <SelectItem value="no-batteries" disabled className="text-gray-500 italic p-4 text-center">
                              Không có pin khả dụng tại trạm này
                            </SelectItem>
                          )}
                          {!newTransfer.from_station_id && (
                            <SelectItem value="no-station" disabled className="text-gray-500 italic p-4 text-center">
                              Vui lòng chọn trạm xuất phát trước
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Trạm đích <span className="text-red-500">*</span>
                      </label>
                      <Select 
                        value={newTransfer.to_station_id} 
                        onValueChange={(value) => setNewTransfer((s: CreateBatteryTransferDto) => ({ ...s, to_station_id: value }))}
                        disabled={loadingStations}
                      >
                        <SelectTrigger className="w-full min-h-[50px] p-4 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium bg-white text-gray-900 text-left">
                          <SelectValue 
                            placeholder={loadingStations ? "Đang tải..." : "Chọn trạm đích"}
                            className="text-gray-900 truncate pr-2"
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto z-50">
                          {stations.filter((station) => station.station_id !== newTransfer.from_station_id && station.status === 'active').length > 0 && (
                            <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b border-gray-200">
                              <span className="text-xs text-gray-500 font-medium">
                                {stations.filter((station) => station.station_id !== newTransfer.from_station_id && station.status === 'active').length} trạm hoạt động
                              </span>
                            </div>
                          )}
                          {stations
                            .filter((station) => station.station_id !== newTransfer.from_station_id && station.status === 'active')
                            .map((station, index) => (
                              <SelectItem 
                                key={station.station_id} 
                                value={station.station_id}
                                className={`hover:bg-blue-50 focus:bg-blue-100 cursor-pointer p-4 border-b border-gray-100 last:border-b-0 ${
                                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                }`}
                              >
                                <div className="flex flex-col w-full max-w-full">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 truncate">{station.name}</span>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Hoạt động</span>
                                  </div>
                                  <span className="text-sm text-gray-600 mt-1 truncate">{station.address}</span>
                                </div>
                              </SelectItem>
                            ))}
                          {stations.filter((station) => station.station_id !== newTransfer.from_station_id && station.status === 'active').length === 0 && !loadingStations && (
                            <SelectItem value="no-stations" disabled className="text-gray-500 italic p-4 text-center">
                              {newTransfer.from_station_id ? "Không có trạm đích nào đang hoạt động" : "Vui lòng chọn trạm xuất phát trước"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Lý do chuyển <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="w-full min-h-[50px] p-4 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium"
                        placeholder="Ví dụ: Cân bằng tồn kho"
                        value={newTransfer.transfer_reason}
                        onChange={(e) => setNewTransfer((s: CreateBatteryTransferDto) => ({ ...s, transfer_reason: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Ghi chú
                      </label>
                      <textarea
                        className="w-full p-4 border-2 border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-medium resize-y"
                        placeholder="Thêm ghi chú..."
                        rows={4}
                        value={newTransfer.notes}
                        onChange={(e) => setNewTransfer((s: CreateBatteryTransferDto) => ({ ...s, notes: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTransferForm(false);
                        setNewTransfer({
                          battery_id: '',
                          from_station_id: '',
                          to_station_id: '',
                          transfer_reason: '',
                          notes: ''
                        });
                      }}
                      className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="min-h-[50px] px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg"
                    >
                      <Check className="h-6 w-6" />
                      Tạo yêu cầu chuyển pin
                    </button>
                  </div>
                </form>
              )}

              {/* Transfer List */}
              <div className="space-y-4">
                {filteredTransfers.map((transfer, index) => (
                  <div
                    key={transfer.transfer_id}
                    className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-slate-200 p-6"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${getStatusColor(transfer.transfer_status)}`}>
                            {getStatusIcon(transfer.transfer_status)}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {transfer.battery?.battery_code || transfer.battery_id}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {transfer.battery?.model || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Từ trạm</p>
                            <p className="font-semibold text-slate-900">
                              {transfer.from_station?.name || transfer.from_station_id}
                            </p>
                            <p className="text-sm text-slate-600">
                              {transfer.from_station?.address || ''}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500 mb-1">Đến trạm</p>
                            <p className="font-semibold text-slate-900">
                              {transfer.to_station?.name || transfer.to_station_id}
                            </p>
                            <p className="text-sm text-slate-600">
                              {transfer.to_station?.address || ''}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500 mb-1">Lý do</p>
                            <p className="text-sm text-slate-900">{transfer.transfer_reason}</p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500 mb-1">Người tạo</p>
                            <p className="text-sm text-slate-900">
                              {transfer.transferred_by_user?.full_name || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {transfer.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">Ghi chú</p>
                            <p className="text-sm text-slate-700">{transfer.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md text-white ${getStatusColor(transfer.transfer_status)}`}
                        >
                          {getStatusText(transfer.transfer_status)}
                        </span>

                        <p className="text-xs text-slate-500">
                          {new Date(transfer.transferred_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>

                        {/* Xem chi tiết button */}
                        <button
                          onClick={() => {
                            setSelectedTransfer(transfer);
                            setShowTransferDetail(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Chi tiết
                        </button>

                        {transfer.transfer_status === 'pending' && (
                          <button
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const res = await batteryTransferService.updateBatteryTransferStatus(
                                  transfer.transfer_id, 
                                  'in_transit',
                                  'Bắt đầu vận chuyển'
                                );
                                if (res && res.success) {
                                  toast.success('✅ Đã cập nhật trạng thái thành "Đang vận chuyển"');
                                  fetchTransfers(); // Reload data
                                } else {
                                  toast.error(res?.message || 'Không thể cập nhật trạng thái');
                                }
                              } catch (err: any) {
                                console.error('Update transfer error', err);
                                toast.error(err?.message || 'Update failed');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <Truck className="h-3 w-3" />
                            Bắt đầu chuyển
                          </button>
                        )}

                        {transfer.transfer_status === 'pending' && (
                          <button
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const res = await batteryTransferService.updateBatteryTransferStatus(
                                  transfer.transfer_id, 
                                  'cancelled',
                                  'Hủy bởi admin'
                                );
                                if (res && res.success) {
                                  toast.success('✅ Đã hủy yêu cầu chuyển pin');
                                  fetchTransfers(); // Reload data
                                } else {
                                  toast.error(res?.message || 'Không thể hủy yêu cầu');
                                }
                              } catch (err: any) {
                                toast.error(err?.message || 'Có lỗi xảy ra');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Hủy yêu cầu
                          </button>
                        )}

                        {transfer.transfer_status === 'in_transit' && (
                          <button
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const res = await batteryTransferService.updateBatteryTransferStatus(
                                  transfer.transfer_id, 
                                  'completed',
                                  'Hoàn thành chuyển pin'
                                );
                                if (res && res.success) {
                                  toast.success('✅ Đã hoàn thành chuyển pin');
                                  fetchTransfers(); // Reload data
                                } else {
                                  toast.error(res?.message || 'Không thể hoàn thành');
                                }
                              } catch (err: any) {
                                console.error('Update transfer error', err);
                                toast.error(err?.message || 'Update failed');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Hoàn thành
                          </button>
                        )}

                        {transfer.transfer_status === 'in_transit' && (
                          <button
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const res = await batteryTransferService.updateBatteryTransferStatus(
                                  transfer.transfer_id, 
                                  'cancelled',
                                  'Hủy trong quá trình vận chuyển'
                                );
                                if (res && res.success) {
                                  toast.success('✅ Đã hủy yêu cầu chuyển pin');
                                  fetchTransfers(); // Reload data
                                } else {
                                  toast.error(res?.message || 'Không thể hủy yêu cầu');
                                }
                              } catch (err: any) {
                                toast.error(err?.message || 'Có lỗi xảy ra');
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Hủy chuyển
                          </button>
                        )}

                        {transfer.transfer_status === 'cancelled' && (
                          <div className="text-center">
                            <p className="text-xs text-slate-500">
                              ❌ Đã bị hủy
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {filteredTransfers.length === 0 && !loading && (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-dashed border-slate-300">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl"></div>
                    <ArrowRightLeft className="relative h-24 w-24 mx-auto mb-6 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-2">
                    Chưa có yêu cầu chuyển pin
                  </h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    Tạo yêu cầu chuyển pin giữa các trạm để quản lý tồn kho hiệu quả
                  </p>
                  <button
                    onClick={() => setShowTransferForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 inline-flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Tạo yêu cầu đầu tiên
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loading && transfers.length === 0 && (
                <div className="text-center py-16">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-slate-600 font-medium mt-4">Loading transfers...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transfer Detail Modal */}
      {showTransferDetail && selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ArrowRightLeft className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Chi tiết chuyển pin</h2>
                    <p className="text-blue-100 text-sm">
                      ID: {selectedTransfer.transfer_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTransferDetail(false);
                    setSelectedTransfer(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Section */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(selectedTransfer.transfer_status)}`}>
                      {getStatusIcon(selectedTransfer.transfer_status)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Trạng thái hiện tại</h3>
                      <p className="text-slate-600 text-sm">{getStatusText(selectedTransfer.transfer_status)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${getStatusColor(selectedTransfer.transfer_status)}`}>
                    {getStatusText(selectedTransfer.transfer_status)}
                  </span>
                </div>
              </div>

              {/* Battery Information */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Battery className="h-5 w-5 text-blue-600" />
                  Thông tin pin
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Mã pin</p>
                    <p className="font-medium">{selectedTransfer.battery?.battery_code || selectedTransfer.battery_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Mẫu pin</p>
                    <p className="font-medium">{selectedTransfer.battery?.model || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Dung lượng</p>
                    <p className="font-medium">{(selectedTransfer.battery as any)?.capacity || 'N/A'}kWh</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Mức pin hiện tại</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          style={{ width: `${(selectedTransfer.battery as any)?.current_charge || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{(selectedTransfer.battery as any)?.current_charge || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Thông tin tuyến đường
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-600 mb-1">TRẠM XUẤT PHÁT</p>
                      <p className="font-semibold text-red-900">{selectedTransfer.from_station?.name || 'N/A'}</p>
                      <p className="text-sm text-red-700">{selectedTransfer.from_station?.address || ''}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <ArrowRightLeft className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-600 mb-1">TRẠM ĐÍCH</p>
                      <p className="font-semibold text-green-900">{selectedTransfer.to_station?.name || 'N/A'}</p>
                      <p className="text-sm text-green-700">{selectedTransfer.to_station?.address || ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transfer Details */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Chi tiết yêu cầu
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Lý do chuyển</p>
                    <p className="font-medium bg-slate-50 p-2 rounded-lg">{selectedTransfer.transfer_reason}</p>
                  </div>
                  {selectedTransfer.notes && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Ghi chú</p>
                      <p className="font-medium bg-slate-50 p-2 rounded-lg">{selectedTransfer.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* User & Time Information */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Thông tin tạo yêu cầu
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Người tạo</p>
                    <p className="font-medium">{selectedTransfer.transferred_by_user?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Thời gian tạo</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <p className="font-medium">
                        {new Date(selectedTransfer.transferred_at).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowTransferDetail(false);
                    setSelectedTransfer(null);
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition-all"
                >
                  Đóng
                </button>
                {selectedTransfer.transfer_status === 'pending' && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const res = await batteryTransferService.updateBatteryTransferStatus(
                            selectedTransfer.transfer_id, 
                            'in_transit',
                            'Bắt đầu vận chuyển từ modal chi tiết'
                          );
                          if (res && res.success) {
                            toast.success('✅ Đã cập nhật trạng thái thành "Đang vận chuyển"');
                            fetchTransfers();
                            setShowTransferDetail(false);
                            setSelectedTransfer(null);
                          } else {
                            toast.error(res?.message || 'Không thể cập nhật trạng thái');
                          }
                        } catch (err: any) {
                          toast.error(err?.message || 'Update failed');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      <Truck className="h-5 w-5" />
                      Bắt đầu chuyển
                    </button>
                  </>
                )}
                {selectedTransfer.transfer_status === 'in_transit' && (
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const res = await batteryTransferService.updateBatteryTransferStatus(
                          selectedTransfer.transfer_id, 
                          'completed',
                          'Hoàn thành chuyển pin từ modal chi tiết'
                        );
                        if (res && res.success) {
                          toast.success('✅ Đã hoàn thành chuyển pin');
                          fetchTransfers();
                          setShowTransferDetail(false);
                          setSelectedTransfer(null);
                        } else {
                          toast.error(res?.message || 'Không thể hoàn thành');
                        }
                      } catch (err: any) {
                        toast.error(err?.message || 'Update failed');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Hoàn thành
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatteryPricingManagement;
