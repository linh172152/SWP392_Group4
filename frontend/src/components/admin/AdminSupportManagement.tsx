import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  MessageCircle,
  RotateCcw,
  X,
  UserCheck,
  Send,
  Eye,
  Edit3,
  AlertCircle
} from 'lucide-react';
import {
  getAdminTickets,
  getAdminTicketDetails,
  assignTicket,
  replyToTicket,
  updateTicketStatus,
  type SupportTicket,
  type SupportReply,
  type GetTicketsParams
} from '../../services/admin-support.service';
import { getAllStaff } from '../../services/staff.service';
import toast from '../../utils/toast';

interface Card {
  className?: string;
  children: React.ReactNode;
}

interface CardHeader {
  className?: string;
  children: React.ReactNode;
}

interface CardContent {
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<Card> = ({ className = '', children }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<CardHeader> = ({ className = '', children }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<CardContent> = ({ className = '', children }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const AdminSupportManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  
  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [ticketReplies, setTicketReplies] = useState<SupportReply[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Form states
  const [assignFormData, setAssignFormData] = useState({ staff_id: '', note: '' });
  const [replyFormData, setReplyFormData] = useState({ message: '' });
  const [statusFormData, setStatusFormData] = useState({ 
    status: 'open' as 'open' | 'in_progress' | 'resolved' | 'closed',
    resolution_note: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchStaff();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchQuery, statusFilter, priorityFilter, assignedFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: GetTicketsParams = {
        limit: 100,
        page: 1
      };
      
      const response = await getAdminTickets(params);
      console.log('Tickets response:', response);
      
      if (response && response.success) {
        // Ensure we always set an array
        const ticketsData = Array.isArray(response.data) ? response.data : 
                           (response.data?.tickets && Array.isArray(response.data.tickets)) ? response.data.tickets : 
                           [];
        console.log('Tickets data:', JSON.stringify(ticketsData, null, 2));
        
        // Map backend fields to expected frontend structure
        const mappedTickets = ticketsData.map((ticket: any) => ({
          ...ticket,
          assigned_to: ticket.assigned_to_staff_id,
          assigned_staff: ticket.assigned_to_staff
        }));
        
        setTickets(mappedTickets);
        // setTickets(mappedTickets); // Already set above
      } else {
        setTickets([]);
        toast.error('Không thể tải danh sách ticket');
      }
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
      toast.error('Lỗi khi tải ticket: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await getAllStaff({ status: 'ACTIVE' });
      if (response && response.success) {
        setStaff(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(tickets)) {
      setFilteredTickets([]);
      return;
    }

    let filtered = [...tickets];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        (ticket.title || ticket.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user?.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Assigned filter
    if (assignedFilter === 'unassigned') {
      filtered = filtered.filter(ticket => !ticket.assigned_to);
    } else if (assignedFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.assigned_to === assignedFilter);
    }

    setFilteredTickets(filtered);
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    try {
      setSelectedTicket(ticket);
      const response = await getAdminTicketDetails(ticket.ticket_id);
      if (response && response.success) {
        setTicketReplies(response.data.replies || []);
        setShowTicketDetail(true);
      } else {
        toast.error('Không thể tải chi tiết ticket');
      }
    } catch (error: any) {
      console.error('Error fetching ticket details:', error);
      toast.error('Lỗi khi tải chi tiết ticket');
    }
  };

  const handleAssignTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !assignFormData.staff_id) return;

    setFormLoading(true);
    try {
      // Step 1: Assign ticket
      const assignResponse = await assignTicket(selectedTicket.ticket_id, { staff_id: assignFormData.staff_id });
      
      if (assignResponse && assignResponse.success) {
        // Step 2: If there's a note, send it as a reply
        if (assignFormData.note && assignFormData.note.trim()) {
          try {
            await replyToTicket(selectedTicket.ticket_id, { message: assignFormData.note.trim() });
          } catch (replyError) {
            console.warn('Failed to send assignment note:', replyError);
            // Don't fail the assignment if reply fails
          }
        }
        
        toast.success('Đã gán ticket thành công!' + (assignFormData.note ? ' Ghi chú đã được gửi.' : ''));
        setShowAssignModal(false);
        setAssignFormData({ staff_id: '', note: '' });
        await fetchTickets(); // Refresh data
      } else {
        toast.error('Không thể gán ticket');
      }
    } catch (error: any) {
      console.error('Error assigning ticket:', error);
      toast.error('Lỗi khi gán ticket: ' + (error.message || 'Unknown error'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleReplyToTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyFormData.message.trim()) return;

    setFormLoading(true);
    try {
      const response = await replyToTicket(selectedTicket.ticket_id, replyFormData);
      if (response && response.success) {
        toast.success('Đã gửi phản hồi thành công!');
        setShowReplyModal(false);
        setReplyFormData({ message: '' });
        // Refresh ticket details
        await handleViewTicket(selectedTicket);
        await fetchTickets();
      } else {
        toast.error('Không thể gửi phản hồi');
      }
    } catch (error: any) {
      console.error('Error replying to ticket:', error);
      toast.error('Lỗi khi gửi phản hồi: ' + (error.message || 'Unknown error'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setFormLoading(true);
    try {
      const response = await updateTicketStatus(selectedTicket.ticket_id, statusFormData);
      if (response && response.success) {
        toast.success('Đã cập nhật trạng thái thành công!');
        setShowStatusModal(false);
        setStatusFormData({ status: 'open', resolution_note: '' });
        await fetchTickets(); // Refresh data
      } else {
        toast.error('Không thể cập nhật trạng thái');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Lỗi khi cập nhật trạng thái: ' + (error.message || 'Unknown error'));
    } finally {
      setFormLoading(false);
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Mở';
      case 'in_progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      case 'closed': return 'Đã đóng';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-700';
      case 'medium': return 'bg-blue-100 text-blue-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'urgent': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      case 'urgent': return 'Khẩn cấp';
      default: return priority;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Calculate stats
  const stats = {
    total: Array.isArray(tickets) ? tickets.length : 0,
    open: Array.isArray(tickets) ? tickets.filter(t => t.status === 'open').length : 0,
    in_progress: Array.isArray(tickets) ? tickets.filter(t => t.status === 'in_progress').length : 0,
    resolved: Array.isArray(tickets) ? tickets.filter(t => t.status === 'resolved').length : 0,
    unassigned: Array.isArray(tickets) ? tickets.filter(t => !t.assigned_to).length : 0
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
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">
                  Quản lý Hỗ trợ
                </h1>
                <p className="text-blue-100 text-lg mt-1">
                  Quản lý các yêu cầu hỗ trợ từ người dùng
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                    <p className="text-blue-100 text-sm">Tổng số</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.open}</p>
                    <p className="text-blue-100 text-sm">Mở</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Edit3 className="h-8 w-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.in_progress}</p>
                    <p className="text-blue-100 text-sm">Đang xử lý</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.resolved}</p>
                    <p className="text-blue-100 text-sm">Đã giải quyết</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-white" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.unassigned}</p>
                    <p className="text-blue-100 text-sm">Chưa gán</p>
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
                <h2 className="text-2xl font-bold text-slate-800">Danh sách Ticket</h2>
                <p className="text-slate-600 mt-1">Quản lý các yêu cầu hỗ trợ từ người dùng</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm ticket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none bg-white/80 backdrop-blur-sm min-w-[300px]"
                  />
                </div>

                {/* Refresh Button */}
                <button
                  onClick={fetchTickets}
                  disabled={loading}
                  className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mt-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="open">Mở</option>
                  <option value="in_progress">Đang xử lý</option>
                  <option value="resolved">Đã giải quyết</option>
                  <option value="closed">Đã đóng</option>
                </select>
              </div>

              {/* Priority Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Khẩn cấp</option>
              </select>

              {/* Assigned Filter */}
              <select
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
                className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none bg-white"
              >
                <option value="all">Tất cả nhân viên</option>
                <option value="unassigned">Chưa gán</option>
                {staff.map((s) => (
                  <option key={s.user_id} value={s.user_id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Tickets List */}
            <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.ticket_id}
                className="bg-gradient-to-r from-white to-slate-50 rounded-xl p-6 border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getPriorityIcon(ticket.priority)}
                        <h3 className="font-semibold text-slate-800 text-lg">{ticket.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 mb-3 line-clamp-2">{ticket.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{ticket.user?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(ticket.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {ticket._count?.replies ? (
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            <span>{ticket._count.replies} phản hồi</span>
                          </div>
                        ) : null}
                        {ticket.assigned_staff && (
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            <span>Gán cho: {ticket.assigned_staff.full_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowAssignModal(true);
                        }}
                        className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all"
                        title="Gán nhân viên"
                      >
                        <UserCheck className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowReplyModal(true);
                        }}
                        className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all"
                        title="Phản hồi"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setStatusFormData({ status: ticket.status, resolution_note: '' });
                          setShowStatusModal(true);
                        }}
                        className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-all"
                        title="Cập nhật trạng thái"
                      >
                        <Edit3 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredTickets.length === 0 && !loading && (
              <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-dashed border-slate-300">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Không có ticket nào
                </h3>
                <p className="text-slate-500">
                  {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || assignedFilter !== 'all'
                    ? 'Không tìm thấy ticket phù hợp với bộ lọc.'
                    : 'Chưa có yêu cầu hỗ trợ nào từ người dùng.'}
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Đang tải danh sách ticket...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Detail Modal */}
      {showTicketDetail && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedTicket.title}</h2>
                    <p className="text-blue-100">Chi tiết ticket hỗ trợ</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTicketDetail(false);
                    setSelectedTicket(null);
                    setTicketReplies([]);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-800 mb-3">Thông tin ticket</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Trạng thái:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(selectedTicket.status)}`}>
                        {getStatusText(selectedTicket.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Mức độ:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(selectedTicket.priority)}`}>
                        {getPriorityText(selectedTicket.priority)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Danh mục:</span>
                      <span className="text-slate-800">{selectedTicket.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ngày tạo:</span>
                      <span className="text-slate-800">{new Date(selectedTicket.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-semibold text-slate-800 mb-3">Thông tin người dùng</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tên:</span>
                      <span className="text-slate-800">{selectedTicket.user?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Email:</span>
                      <span className="text-slate-800">{selectedTicket.user?.email}</span>
                    </div>
                    {selectedTicket.user?.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">SĐT:</span>
                        <span className="text-slate-800">{selectedTicket.user.phone}</span>
                      </div>
                    )}
                    {selectedTicket.assigned_staff && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Được gán cho:</span>
                        <span className="text-slate-800">{selectedTicket.assigned_staff.full_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-3">Mô tả vấn đề</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Replies */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-slate-800 mb-3">Lịch sử phản hồi</h3>
                {ticketReplies.length > 0 ? (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {ticketReplies.map((reply) => (
                      <div
                        key={reply.reply_id}
                        className={`p-4 rounded-lg ${
                          reply.is_admin_reply
                            ? 'bg-blue-100 border-l-4 border-blue-500'
                            : 'bg-white border-l-4 border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-slate-800">
                            {reply.user?.full_name}
                            {reply.is_admin_reply && (
                              <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                                Admin
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(reply.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">Chưa có phản hồi nào</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowAssignModal(true);
                    setShowTicketDetail(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="h-5 w-5" />
                  Gán nhân viên
                </button>
                <button
                  onClick={() => {
                    setShowReplyModal(true);
                    setShowTicketDetail(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Phản hồi
                </button>
                <button
                  onClick={() => {
                    setStatusFormData({ status: selectedTicket.status, resolution_note: '' });
                    setShowStatusModal(true);
                    setShowTicketDetail(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 className="h-5 w-5" />
                  Cập nhật trạng thái
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Gán Ticket</h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAssignTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Chọn nhân viên
                  </label>
                  <select
                    value={assignFormData.staff_id}
                    onChange={(e) => setAssignFormData({ staff_id: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    required
                  >
                    <option value="">Chọn nhân viên...</option>
                    {staff.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name} - {member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ghi chú cho nhân viên (tùy chọn)
                  </label>
                  <textarea
                    value={assignFormData.note || ''}
                    onChange={(e) => setAssignFormData(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Hướng dẫn xử lý, yêu cầu đặc biệt..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Nếu có ghi chú, sẽ tự động gửi thông báo cho nhân viên
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                    disabled={formLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading || !assignFormData.staff_id}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <UserCheck className="h-5 w-5" />
                    )}
                    {formLoading ? 'Đang gán...' : 'Gán nhân viên'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Phản Hồi Ticket</h2>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleReplyToTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nội dung phản hồi *
                  </label>
                  <textarea
                    rows={6}
                    value={replyFormData.message}
                    onChange={(e) => setReplyFormData({ ...replyFormData, message: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                    placeholder="Nhập phản hồi của bạn..."
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReplyModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                    disabled={formLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading || !replyFormData.message.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                    {formLoading ? 'Đang gửi...' : 'Gửi phản hồi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Cập Nhật Trạng Thái</h2>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Trạng thái mới *
                  </label>
                  <select
                    value={statusFormData.status}
                    onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                    required
                  >
                    <option value="open">Mở</option>
                    <option value="in_progress">Đang xử lý</option>
                    <option value="resolved">Đã giải quyết</option>
                    <option value="closed">Đã đóng</option>
                  </select>
                </div>

                {(statusFormData.status === 'resolved' || statusFormData.status === 'closed') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ghi chú giải quyết
                    </label>
                    <textarea
                      rows={3}
                      value={statusFormData.resolution_note}
                      onChange={(e) => setStatusFormData({ ...statusFormData, resolution_note: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none"
                      placeholder="Mô tả cách giải quyết..."
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                    disabled={formLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Edit3 className="h-5 w-5" />
                    )}
                    {formLoading ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportManagement;