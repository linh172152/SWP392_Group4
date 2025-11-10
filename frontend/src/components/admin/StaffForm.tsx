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
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Grid layout cho các field chính */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Trạm làm việc - Full width để có đủ không gian */}
        <FormField
          control={form.control}
          name="station_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trạm làm việc</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger 
                    className="w-full [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:overflow-hidden [&_[data-slot=select-value]]:text-ellipsis [&_[data-slot=select-value]]:whitespace-nowrap [&_[data-slot=select-value]]:max-w-full"
                  >
                    <SelectValue placeholder="Chọn trạm làm việc" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-w-[600px] max-h-[300px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md z-50">
                  <SelectItem 
                    value=""
                    className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    Chưa phân công
                  </SelectItem>
                  {stations?.map(station => {
                    console.log('Rendering station:', station);
                    const stationName = station.name || 'Unnamed Station';
                    const stationId = station.station_id || station.id;
                    
                    return (
                      <SelectItem 
                        key={stationId} 
                        value={stationId}
                        title={`${stationName}${station.address ? ` - ${station.address}` : ''}`}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                      >
                        <div className="flex flex-col items-start min-w-0 w-full">
                          <span className="font-medium truncate w-full text-gray-900 dark:text-gray-100">
                            {stationName}
                          </span>
                          {station.address && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
                              {station.address}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Trạng thái - Dòng riêng */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md z-50">
                    <SelectItem 
                      value="ACTIVE"
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                    >
                      Đang làm việc
                    </SelectItem>
                    <SelectItem 
                      value="INACTIVE"
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                    >
                      Không hoạt động
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>        {/* Mật khẩu riêng biệt */}
        {!initialData && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="max-w-md">
                <FormLabel>Mật khẩu</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Nhập mật khẩu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-4 pt-6 border-t">
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
    </div>
  );
};

export default StaffForm;