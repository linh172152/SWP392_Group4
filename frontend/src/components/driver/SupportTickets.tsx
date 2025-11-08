import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Send
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
interface ReplyItem { 
  reply_id: string; 
  message: string; 
  is_staff?: boolean; // BE dùng is_staff
  is_staff_reply?: boolean; // Fallback cho compatibility
  created_at: string; 
  user?: { full_name?: string; role?: string } 
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
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

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

  const openTicket = async (t: TicketItem) => {
    setSelectedTicket(t);
    setReplies([]);
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.SUPPORT.REPLIES(t.ticket_id));
      const data = await res.json();
      if (res.ok && data.success) {
        // API trả về { data: { replies: [...], pagination: {...} } }
        const repliesData = Array.isArray(data.data) ? data.data : (data.data?.replies || []);
        console.log('📨 Loaded replies:', repliesData.length, repliesData);
        setReplies(repliesData);
      } else {
        console.error('❌ Failed to load replies:', data);
      }
    } catch (e) {
      console.error('❌ Error loading replies:', e);
      setError('Không thể tải tin nhắn. Vui lòng thử lại.');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(API_ENDPOINTS.SUPPORT.REPLY(selectedTicket.ticket_id), { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }) 
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gửi tin nhắn thất bại');
      
      // Nếu response có reply mới, thêm vào state ngay
      if (data.data) {
        const newReply: ReplyItem = {
          reply_id: data.data.reply_id || data.data.id,
          message: data.data.message || newMessage,
          is_staff: data.data.is_staff || false,
          created_at: data.data.created_at || new Date().toISOString(),
          user: data.data.user || { full_name: undefined }
        };
        setReplies(prev => [...prev, newReply]);
      }
      
      setNewMessage('');
      
      // Reload lại để đảm bảo có đầy đủ replies từ BE
      await openTicket(selectedTicket);
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
      console.error('Error sending message:', e);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hỗ trợ & phản hồi</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Nhận hỗ trợ khi gặp sự cố</p>
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
          <Card key={ticket.ticket_id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openTicket(ticket)}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <HelpCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                        <p className="text-sm text-gray-600">#{ticket.ticket_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">{ticket.status.replace('-', ' ')}</span>
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium">{new Date(ticket.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Chi tiết</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'You\'t created any support tickets yet.'
            }
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Ticket
          </Button>
        </Card>
      )}

      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{selectedTicket.subject}</DialogTitle>
                  <p className="text-sm text-gray-600">#{selectedTicket.ticket_number}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                  </Badge>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {getStatusIcon(selectedTicket.status)}
                    <span className="ml-1 capitalize">{selectedTicket.status.replace('-', ' ')}</span>
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {replies.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chưa có tin nhắn nào</p>
                </div>
              ) : (
                replies.map((message) => {
                  const isStaff = message.is_staff || message.is_staff_reply || message.user?.role === 'STAFF';
                  return (
                    <div key={message.reply_id} className={`flex ${isStaff ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] ${isStaff ? 'bg-gray-100 dark:bg-slate-700' : 'bg-blue-100 dark:bg-blue-900/30'} rounded-lg p-4`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {(message.user?.full_name || (isStaff ? 'Staff' : 'Bạn')).split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{message.user?.full_name || (isStaff ? 'Nhân viên hỗ trợ' : 'Bạn')}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(message.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-900 dark:text-slate-100">{message.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
              <div className="border-t pt-4">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Nhập tin nhắn của bạn..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={3}
                    className="flex-1 bg-white dark:bg-slate-800"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim() || loading}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SupportTickets;