import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import type { Station } from '../../services/station.service';

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
  const form = useForm<StationFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: initialData?.name || '',
      address: initialData?.address || '',
      coordinates: initialData?.coordinates || { lat: 0, lng: 0 },
      capacity: initialData?.capacity || 0,
      operating_hours: initialData?.operating_hours || '24/7',
      manager_id: initialData?.manager?.user_id || '',
    },
  });

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên trạm</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên trạm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập địa chỉ trạm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="coordinates.lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vĩ độ</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any"
                        placeholder="Vĩ độ"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
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
                    <FormLabel>Kinh độ</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any"
                        placeholder="Kinh độ"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sức chứa pin</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Nhập sức chứa pin" 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="operating_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giờ hoạt động</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: 24/7" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Quản lý</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập ID quản lý" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit">
                {initialData ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StationForm;