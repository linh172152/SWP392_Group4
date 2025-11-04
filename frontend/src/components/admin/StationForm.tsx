import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import type { Station } from '../../services/station.service';
import { getAllStaff, type Staff } from '../../services/staff.service';
import { MapPin, Battery, Clock, Users, Navigation, Loader2, Activity, AlertTriangle, XCircle } from 'lucide-react';

const stationSchema = z.object({
  name: z.string().min(1, 'Tên trạm là bắt buộc'),
  address: z.string().min(1, 'Địa chỉ là bắt buộc'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  capacity: z.number().min(1, 'Sức chứa phải lớn hơn 0'),
  operating_hours: z.string().optional(),
  manager_id: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'closed']),
});

type StationFormData = z.infer<typeof stationSchema>;

interface StationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StationFormData) => Promise<void>;
  initialData?: Partial<Station>;
  title: string;
}

const StationForm: React.FC<StationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}) => {
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const form = useForm<StationFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      coordinates: initialData?.coordinates || { lat: 0, lng: 0 },
      capacity: initialData?.capacity || 0,
      operating_hours: initialData?.operating_hours || '24/7',
      manager_id: initialData?.manager?.user_id || '',
      status: initialData?.status || 'active',
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit mode: populate with existing data
        form.reset({
          name: initialData.name || '',
          address: initialData.address || '',
          coordinates: initialData.coordinates || { lat: 0, lng: 0 },
          capacity: initialData.capacity || 0,
          operating_hours: initialData.operating_hours || '24/7',
          manager_id: initialData.manager?.user_id || '',
          status: initialData.status || 'active',
        });
      } else {
        // Create mode: clear all fields
        form.reset({
          name: '',
          address: '',
          coordinates: { lat: 0, lng: 0 },
          capacity: 0,
          operating_hours: '24/7',
          manager_id: '',
          status: 'active',
        });
      }
    }
  }, [isOpen, initialData, form]);

  // Fetch available staff when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableStaff();
    }
  }, [isOpen]);

  const fetchAvailableStaff = async () => {
    setLoadingStaff(true);
    try {
      const response = await getAllStaff({ 
        status: 'ACTIVE',
        limit: 100 
      });
      
      console.log('📋 Staff API Response:', response);
      
      // Backend returns: { success, message, data: [...staff array], pagination }
      // NOT { data: { staff: [...] } }
      let staffList: Staff[] = [];
      
      if (response.success && Array.isArray(response.data)) {
        staffList = response.data;
      } else if (response.data?.staff && Array.isArray(response.data.staff)) {
        staffList = response.data.staff;
      } else if (Array.isArray(response.data)) {
        staffList = response.data;
      } else if (Array.isArray(response)) {
        staffList = response;
      }
      
      console.log('👥 Staff list count:', staffList.length);
      console.log('🔍 Filter criteria - station_id:', initialData?.station_id);
      
      // Filter staff that are not assigned to any station OR assigned to current station
      const filtered = staffList.filter((staff: Staff) => {
        const notAssigned = !staff.station_id;
        const assignedToThisStation = staff.station_id === initialData?.station_id;
        return notAssigned || assignedToThisStation;
      });
      
      console.log('✅ Filtered staff count:', filtered.length);
      setAvailableStaff(filtered);
    } catch (error) {
      console.error('❌ Failed to fetch staff:', error);
      toast.error('Không thể tải danh sách nhân viên');
      setAvailableStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleSubmit = async (data: StationFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
              {/* Station Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      Tên trạm
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="VD: Trạm Quận 1" 
                        {...field}
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-emerald-500" />
                      Địa chỉ
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM" 
                        {...field}
                        className="border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Coordinates */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-cyan-500" />
                  Tọa độ GPS
                </label>
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20">
                  <FormField
                    control={form.control}
                    name="coordinates.lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-600 dark:text-slate-400">Vĩ độ (Latitude)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any"
                            placeholder="10.762622"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            className="bg-white dark:bg-slate-800"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="coordinates.lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-600 dark:text-slate-400">Kinh độ (Longitude)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any"
                            placeholder="106.660172"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                            className="bg-white dark:bg-slate-800"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Capacity */}
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Battery className="h-4 w-4 text-green-500" />
                      Sức chứa pin
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="VD: 20" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                          className="border-slate-300 focus:border-green-500 focus:ring-green-500 pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                          pin
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Operating Hours */}
              <FormField
                control={form.control}
                name="operating_hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      Giờ hoạt động
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="VD: 24/7 hoặc 6 AM - 11 PM" 
                        {...field}
                        className="border-slate-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-indigo-500" />
                      Trạng thái trạm
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                        <SelectItem value="active" className="hover:bg-green-50 dark:hover:bg-green-900/20">
                          <div className="flex items-center gap-2 py-1">
                            <div className="h-3 w-3 rounded-full bg-green-500 shadow-sm"></div>
                            <span className="font-medium text-slate-900 dark:text-slate-100">Trực tuyến</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="maintenance" className="hover:bg-orange-50 dark:hover:bg-orange-900/20">
                          <div className="flex items-center gap-2 py-1">
                            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" strokeWidth={2.5} />
                            <span className="font-semibold text-slate-900 dark:text-slate-100">Bảo trì</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="closed" className="hover:bg-red-50 dark:hover:bg-red-900/20">
                          <div className="flex items-center gap-2 py-1">
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                            <span className="font-semibold text-slate-900 dark:text-slate-100">Ngoại tuyến</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Manager Selection */}
              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      Quản lý trạm (Staff)
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loadingStaff}
                    >
                      <FormControl>
                        <SelectTrigger className="border-slate-300 focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue placeholder={
                            loadingStaff 
                              ? "Đang tải danh sách..." 
                              : "Chọn nhân viên quản lý"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                        <SelectItem value="" className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Không có quản lý</span>
                          </div>
                        </SelectItem>
                        {availableStaff.map((staff) => (
                          <SelectItem key={staff.user_id} value={staff.user_id} className="hover:bg-purple-50 dark:hover:bg-purple-900/20">
                            <div className="flex flex-col py-1">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {staff.full_name}
                              </span>
                              <span className="text-xs text-slate-600 dark:text-slate-400">
                                {staff.email}
                                {staff.station && (
                                  <span className="ml-1 text-orange-600 dark:text-orange-400 font-medium">
                                    • Đang tại: {staff.station.name}
                                  </span>
                                )}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {availableStaff.length === 0 && !loadingStaff && (
                          <div className="py-8 text-center">
                            <Users className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm text-slate-500">Không có nhân viên khả dụng</p>
                          </div>
                        )}
                        {loadingStaff && (
                          <div className="py-8 text-center">
                            <Loader2 className="h-8 w-8 mx-auto mb-2 text-blue-500 animate-spin" />
                            <p className="text-sm text-slate-500">Đang tải...</p>
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={onClose}
                  className="hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {initialData ? '✓ Cập nhật' : '+ Tạo mới'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StationForm;