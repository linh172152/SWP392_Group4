import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { addBattery, AddBatteryData } from '../../services/battery.service';
import { useToast } from '../../hooks/use-toast';
import { API_ENDPOINTS } from '../../config/api';

interface AddBatteryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddBatteryDialog: React.FC<AddBatteryDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [stationId, setStationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch user profile to get station_id
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) return;

        const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (data.success && data.data.user.station?.station_id) {
          setStationId(data.data.user.station.station_id);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    if (open) {
      fetchUserProfile();
    }
  }, [open]);

  const [formData, setFormData] = useState<Partial<AddBatteryData>>({
    battery_code: '',
    model: '',
    capacity_kwh: undefined,
    voltage: undefined,
    current_charge: 100,
    status: 'full',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof AddBatteryData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    setWarningMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.battery_code.trim()) {
      newErrors.battery_code = 'Mã pin là bắt buộc';
    } else if (formData.battery_code.length < 3) {
      newErrors.battery_code = 'Mã pin phải có ít nhất 3 ký tự';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model pin là bắt buộc';
    }

    if (formData.capacity_kwh && formData.capacity_kwh <= 0) {
      newErrors.capacity_kwh = 'Dung lượng phải lớn hơn 0';
    }

    if (formData.voltage && formData.voltage <= 0) {
      newErrors.voltage = 'Điện áp phải lớn hơn 0';
    }

    if (formData.current_charge < 0 || formData.current_charge > 100) {
      newErrors.current_charge = 'Mức sạc phải từ 0-100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!stationId) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy thông tin trạm. Vui lòng đăng nhập lại.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      setWarningMessage(null);

      // Prepare data - remove undefined values and add station_id
      const submitData: AddBatteryData = {
        station_id: stationId,  // ✅ Thêm station_id
        battery_code: formData.battery_code?.trim() || '',
        model: formData.model?.trim() || '',
        ...(formData.capacity_kwh && { capacity_kwh: Number(formData.capacity_kwh) }),
        ...(formData.voltage && { voltage: Number(formData.voltage) }),
        current_charge: Number(formData.current_charge || 100),
        status: formData.status || 'full',
      };

      const response = await addBattery(submitData);

      if (response.success) {
        // Check for capacity warning
        if (response.data?.capacity_info?.warning) {
          const warning = response.data.capacity_info.warning;
          setWarningMessage(
            `⚠️ Cảnh báo: Trạm sắp đầy (${warning.percentage}%). Chỉ còn ${
              response.data.capacity_info.capacity - response.data.capacity_info.current_count
            } slot.`
          );
        }

        toast({
          title: 'Thành công',
          description: response.message || 'Đã thêm pin mới',
        });

        // Reset form
        setFormData({
          battery_code: '',
          model: '',
          capacity_kwh: undefined,
          voltage: undefined,
          current_charge: 100,
          status: 'full',
        });
        setErrors({});
        
        // Call success callback and close dialog
        onSuccess();
        
        // Close dialog after a short delay if there's no warning
        if (!response.data?.capacity_info?.warning) {
          setTimeout(() => onOpenChange(false), 500);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể thêm pin',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        battery_code: '',
        model: '',
        capacity_kwh: undefined,
        voltage: undefined,
        current_charge: 100,
        status: 'full',
      });
      setErrors({});
      setWarningMessage(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm Pin Mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin pin mới để thêm vào kho trạm
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Battery Code */}
            <div className="space-y-2">
              <Label htmlFor="battery_code">
                Mã Pin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="battery_code"
                placeholder="Ví dụ: BAT-001"
                value={formData.battery_code}
                onChange={(e) => handleChange('battery_code', e.target.value)}
                className={errors.battery_code ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.battery_code && (
                <p className="text-sm text-red-500">{errors.battery_code}</p>
              )}
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">
                Model <span className="text-red-500">*</span>
              </Label>
              <Input
                id="model"
                placeholder="Ví dụ: LFP-72V-50Ah"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                className={errors.model ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.model && (
                <p className="text-sm text-red-500">{errors.model}</p>
              )}
            </div>

            {/* Capacity kWh */}
            <div className="space-y-2">
              <Label htmlFor="capacity_kwh">Dung lượng (kWh)</Label>
              <Input
                id="capacity_kwh"
                type="number"
                step="0.01"
                placeholder="Ví dụ: 3.6"
                value={formData.capacity_kwh || ''}
                onChange={(e) =>
                  handleChange('capacity_kwh', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className={errors.capacity_kwh ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.capacity_kwh && (
                <p className="text-sm text-red-500">{errors.capacity_kwh}</p>
              )}
            </div>

            {/* Voltage */}
            <div className="space-y-2">
              <Label htmlFor="voltage">Điện áp (V)</Label>
              <Input
                id="voltage"
                type="number"
                step="0.1"
                placeholder="Ví dụ: 72"
                value={formData.voltage || ''}
                onChange={(e) =>
                  handleChange('voltage', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className={errors.voltage ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.voltage && (
                <p className="text-sm text-red-500">{errors.voltage}</p>
              )}
            </div>

            {/* Current Charge */}
            <div className="space-y-2">
              <Label htmlFor="current_charge">Mức sạc hiện tại (%)</Label>
              <Input
                id="current_charge"
                type="number"
                min="0"
                max="100"
                value={formData.current_charge}
                onChange={(e) =>
                  handleChange('current_charge', parseInt(e.target.value))
                }
                className={errors.current_charge ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.current_charge && (
                <p className="text-sm text-red-500">{errors.current_charge}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => handleChange('status', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Đầy</SelectItem>
                  <SelectItem value="charging">Đang sạc</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                  <SelectItem value="damaged">Hỏng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Warning Message */}
            {warningMessage && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {warningMessage}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                'Thêm Pin'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBatteryDialog;

