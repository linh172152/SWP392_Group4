import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import type { Staff } from '../../services/staff.service';
import type { Station } from '../../services/station.service';

const baseSchema = {
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  position: z.string().min(2, 'Vị trí phải có ít nhất 2 ký tự'),
  station_id: z.string().min(1, 'Vui lòng chọn trạm làm việc'),
  status: z.enum(['ACTIVE', 'INACTIVE'] as const).default('ACTIVE'),
  join_date: z.string().default(() => new Date().toISOString()),
};

const createStaffSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

const updateStaffSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
});

type StaffFormData = z.infer<typeof createStaffSchema> | z.infer<typeof updateStaffSchema>;

interface StaffFormProps {
  initialData?: Staff;
  onSubmit: (data: StaffFormData) => Promise<void>;
  isSubmitting?: boolean;
  stations: Station[];
}

const StaffForm = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  stations = [],
}: StaffFormProps) => {
  type FormData = z.infer<typeof createStaffSchema> | z.infer<typeof updateStaffSchema>;
  
  const form = useForm<FormData>({
    resolver: zodResolver(initialData ? updateStaffSchema : createStaffSchema) as any,
    defaultValues: initialData ? {
      name: initialData.full_name ?? '',
      email: initialData.email ?? '',
      phone: initialData.phone ?? '',
      position: initialData.role ?? '',
      status: initialData.status ?? 'ACTIVE',
      station_id: initialData.station_id ?? '',
      join_date: initialData.created_at ?? new Date().toISOString(),
    } : {
      name: '',
      email: '',
      phone: '',
      position: '',
      status: 'ACTIVE' as const,
      station_id: '',
      join_date: new Date().toISOString(),
      password: '',
    },
  });
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Họ và tên</FormLabel>
              <FormControl>
                <Input placeholder="Nhập họ và tên" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="example@gmail.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl>
                <Input placeholder="0123456789" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vị trí</FormLabel>
              <FormControl>
                <Input placeholder="Nhập vị trí công việc" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="station_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trạm</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạm làm việc" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">Chưa phân công</SelectItem>
                  {stations?.map(station => {
                    // Hiển thị thêm thông tin debug trong console
                    console.log('Rendering station:', station);
                    return (
                      <SelectItem 
                        key={station.station_id || station.id} 
                        value={station.station_id || station.id}
                      >
                        {station.name || 'Unnamed Station'} 
                        {station.address ? ` - ${station.address}` : ''}
                        {station.status ? ` (${station.status})` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />



        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trạng thái</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">Đang làm việc</SelectItem>
                  <SelectItem value="INACTIVE">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {!initialData && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Nhập mật khẩu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-purple-500 to-violet-500 text-white hover:from-purple-600 hover:to-violet-600"
          >
            {isSubmitting ? 'Đang xử lý...' : initialData ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StaffForm;