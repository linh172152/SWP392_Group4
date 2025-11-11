import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { 
  HelpCircle, 
  Plus, 
  Search
} from 'lucide-react';
import API_ENDPOINTS, { fetchWithAuth } from '../../config/api';

interface TicketItem {
  ticket_id: string;
  ticket_number: string;
  subject: string;
  description?: string;
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | string;
  created_at: string;
}

// Categories match với BE enum TicketCategory trong schema.prisma
const categories = [
  { value: 'battery_issue', label: 'Vấn đề về Pin' },
  { value: 'station_issue', label: 'Vấn đề về Trạm' },
  { value: 'payment_issue', label: 'Vấn đề thanh toán' },
  { value: 'service_complaint', label: 'Khiếu nại dịch vụ' },
  { value: 'other', label: 'Khác' }
];


const SupportTickets: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const url = new URL(API_ENDPOINTS.SUPPORT.LIST);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter.toUpperCase());
      const res = await fetchWithAuth(url.toString());
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Tải ticket thất bại');
      // API trả về { data: { tickets: [...], pagination: {...} } }
      setTickets(Array.isArray(data.data) ? data.data : (data.data?.tickets || []));
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async () => {
    if (!newDescription || !newCategory) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Tự động tạo subject từ category và phần đầu của description
      const categoryLabel = categories.find(c => c.value === newCategory)?.label || 'Hỗ trợ';
      const subjectPreview = newDescription.length > 50 
        ? newDescription.substring(0, 50) + '...' 
        : newDescription;
      const autoSubject = `${categoryLabel}: ${subjectPreview}`;
      
      const form = {
        subject: autoSubject,
        description: newDescription,
        category: newCategory,
        priority: 'medium' // Mặc định medium
      };
      const res = await fetchWithAuth(API_ENDPOINTS.SUPPORT.CREATE, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form) 
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Tạo ticket thất bại');
      setIsCreateDialogOpen(false);
      setNewDescription('');
      setNewCategory('');
      await loadTickets();
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, [statusFilter]);

  const filteredTickets = tickets.filter(ticket => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = ticket.subject.toLowerCase().includes(s) || ticket.ticket_number.toLowerCase().includes(s);
    return matchesSearch;
  });

  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Function để lấy màu background cho status
  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'open':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'closed':
        return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
      default:
        return 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';
    }
  };

  // Function để lấy label tiếng Việt cho status
  const getStatusLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'open':
        return 'Mở';
      case 'in_progress':
        return 'Đang xử lý';
      case 'resolved':
        return 'Đã giải quyết';
      case 'closed':
        return 'Đã đóng';
      default:
        return status.replace('_', ' ');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hỗ trợ</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gửi yêu cầu hỗ trợ khi gặp sự cố</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                Tạo yêu cầu hỗ trợ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tạo yêu cầu hỗ trợ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Loại hỗ trợ mà bạn cần là *</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Chọn loại hỗ trợ" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-800">
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả chi tiết *</Label>
                  <Textarea id="description" placeholder="Vui lòng cung cấp thông tin chi tiết về vấn đề của bạn..." rows={4} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button className="flex-1 gradient-primary text-white" onClick={createTicket} disabled={loading || !newDescription || !newCategory}>
                    {loading ? 'Đang tạo...' : 'Tạo yêu cầu'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-800">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="open">Mở</SelectItem>
                <SelectItem value="in_progress">Đang xử lý</SelectItem>
                <SelectItem value="resolved">Đã giải quyết</SelectItem>
                <SelectItem value="closed">Đã đóng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.ticket_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <HelpCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                      <p className="text-sm text-gray-600">#{ticket.ticket_number}</p>
                    </div>
                  </div>

                  {ticket.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Ngày tạo</p>
                      <p className="font-medium text-slate-900 dark:text-white">{new Date(ticket.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 mb-1">Trạng thái</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có yêu cầu hỗ trợ nào</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'Thử điều chỉnh tiêu chí tìm kiếm hoặc bộ lọc.'
              : 'Bạn chưa tạo yêu cầu hỗ trợ nào.'
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gradient-primary text-white">
            <Plus className="mr-2 h-4 w-4" />
            Tạo yêu cầu hỗ trợ đầu tiên
          </Button>
        </Card>
      )}
    </div>
  );
};

export default SupportTickets;