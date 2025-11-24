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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  getAdminTickets,
  getAdminTicketDetails,
  replyToTicket,
  updateTicketStatus,
  type SupportTicket,
  type SupportReply,
  type GetTicketsParams
} from '../../services/admin-support.service';
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
  <div className={`bg-white rounded-lg shadow border ${className}`}>
    {children}
  </div>
);

const CardHeader: React.FC<CardHeader> = ({ className = '', children }) => (
  <div className={`px-6 py-4 border-b ${className}`}>
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
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  
  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [ticketReplies, setTicketReplies] = useState<SupportReply[]>([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Form states
  const [replyFormData, setReplyFormData] = useState({ message: '' });
  const [statusFormData, setStatusFormData] = useState({ 
    status: 'open' as 'open' | 'in_progress' | 'resolved' | 'closed',
    resolution_note: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  // Fetch data
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params: GetTicketsParams = {
        status: statusFilter !== 'all' ? statusFilter as 'open' | 'in_progress' | 'resolved' | 'closed' : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter as 'low' | 'medium' | 'high' | 'urgent' : undefined,
        assigned_to: assignedFilter !== 'all' ? assignedFilter : undefined,
        search: searchQuery || undefined
      };
      
      const response = await getAdminTickets(params);
      setTickets(response.data.tickets || []);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast.error(error.message || 'Lỗi khi tải danh sách ticket');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      console.log('=== FETCHING TICKET DETAILS ===');
      console.log('Ticket ID:', ticketId);
      
      setFormLoading(true);
      const response = await getAdminTicketDetails(ticketId);
      
      console.log('API Response:', response);
      console.log('Response success:', response?.success);
      console.log('Response data:', response?.data);
      console.log('Full response structure:', JSON.stringify(response, null, 2));
      
      // The API returns the ticket directly in response.data, not response.data.ticket
      if (response?.success && response?.data) {
        const ticketData = response.data; // Use response.data directly
        console.log('Setting ticket data:', ticketData);
        
        setSelectedTicket(ticketData);
        // Try different possible locations for replies in the response
        const replies = response.replies || response.data?.replies || ticketData.replies || [];
        console.log('Replies found:', replies);
        setTicketReplies(replies);
        
        console.log('About to set showTicketDetail to true');
        setShowTicketDetail(true);
        
        console.log('=== AFTER SETTING STATE ===');
        console.log('selectedTicket will be:', ticketData);
        console.log('showTicketDetail will be: true');
        
      } else {
        console.error('Invalid response format:', response);
        toast.error('Không thể tải thông tin ticket');
      }
    } catch (error: any) {
      console.error('Error in fetchTicketDetails:', error);
      toast.error('Lỗi khi tải chi tiết ticket');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle actions
  const handleReplyTicket = async () => {
    if (!selectedTicket || !replyFormData.message) return;
    
    try {
      setFormLoading(true);
      await replyToTicket(selectedTicket.ticket_id, {
        message: replyFormData.message
      });
      
      setShowReplyModal(false);
      setReplyFormData({ message: '' });
      // Refresh ticket details to show new reply
      if (showTicketDetail) {
        fetchTicketDetails(selectedTicket.ticket_id);
      }
    } catch (error: any) {
      console.error('Error replying to ticket:', error);
      toast.error(error.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket) return;
    
    try {
      setFormLoading(true);
      await updateTicketStatus(selectedTicket.ticket_id, {
        status: statusFormData.status,
        resolution_note: statusFormData.resolution_note
      });
      
      setShowStatusModal(false);
      setStatusFormData({ status: 'open', resolution_note: '' });
      fetchTickets();
      if (showTicketDetail) {
        fetchTicketDetails(selectedTicket.ticket_id);
      }
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      toast.error(error.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setFormLoading(false);
    }
  };

  // Filter tickets
  useEffect(() => {
    let filtered = tickets;

    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (assignedFilter !== 'all') {
      if (assignedFilter === 'assigned') {
        filtered = filtered.filter(ticket => ticket.assigned_to);
      } else if (assignedFilter === 'unassigned') {
        filtered = filtered.filter(ticket => !ticket.assigned_to);
      }
    }

    setFilteredTickets(filtered);
  }, [tickets, searchQuery, statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Debug effect
  useEffect(() => {
    console.log('=== MODAL STATE DEBUG ===');
    console.log('showTicketDetail:', showTicketDetail);
    console.log('selectedTicket:', selectedTicket?.ticket_id || 'null');
    console.log('selectedTicket data:', selectedTicket);
  }, [showTicketDetail, selectedTicket]);

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
    resolved: Array.isArray(tickets) ? tickets.filter(t => t.status === 'resolved').length : 0
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý Hỗ Trợ Khách Hàng</h1>
          <p className="text-muted-foreground">
            Quản lý và xử lý các yêu cầu hỗ trợ từ khách hàng
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng số</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mở</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đang xử lý</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã giải quyết</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm ticket..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none w-full"
                />
              </div>
              
              <button
                onClick={fetchTickets}
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="min-w-[160px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="open">Mở</SelectItem>
                    <SelectItem value="in_progress">Đang xử lý</SelectItem>
                    <SelectItem value="resolved">Đã giải quyết</SelectItem>
                    <SelectItem value="closed">Đã đóng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="min-w-[150px]">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Select value={assignedFilter} onValueChange={setAssignedFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Phân công" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="assigned">Đã gán</SelectItem>
                  <SelectItem value="unassigned">Chưa gán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Đang tải dữ liệu...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && filteredTickets.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có ticket</h3>
            <p className="text-gray-500">Chưa có ticket nào hoặc không tìm thấy kết quả phù hợp.</p>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      {!loading && filteredTickets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Danh sách Ticket ({filteredTickets.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.ticket_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left side - Ticket info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getPriorityIcon(ticket.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {ticket.subject || ticket.title}
                            </h4>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{ticket.user?.full_name || 'N/A'}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(ticket.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                            {ticket.assigned_to && (
                              <>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1">
                                  <UserCheck className="h-3 w-3 text-green-600" />
                                  <span className="text-green-600">{ticket.assigned_staff?.full_name}</span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {ticket.description && (
                            <p className="mt-2 text-sm text-gray-600 overflow-hidden" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {ticket.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Status and actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:flex-col lg:items-end">
                      {/* Status and Priority */}
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            console.log('=== EYE BUTTON CLICKED ===');
                            console.log('Ticket ID:', ticket.ticket_id);
                            console.log('Current modal states before:', {
                              showTicketDetail,
                              showReplyModal,
                              showStatusModal
                            });
                            
                            // Close all other modals first
                            setShowStatusModal(false);
                            setShowReplyModal(false);
                            
                            // Reset selected ticket to ensure clean state
                            setSelectedTicket(null);
                            setShowTicketDetail(false);
                            
                            console.log('About to fetch ticket details...');
                            fetchTicketDetails(ticket.ticket_id);
                          }}
                          disabled={formLoading}
                          className={`p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors ${
                            formLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Xem chi tiết"
                        >
                          {formLoading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowTicketDetail(false);
                            setShowReplyModal(false);
                            
                            setSelectedTicket(ticket);
                            setStatusFormData({ 
                              status: ticket.status as 'open' | 'in_progress' | 'resolved' | 'closed',
                              resolution_note: '' 
                            });
                            setShowStatusModal(true);
                          }}
                          className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Cập nhật trạng thái"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {(showTicketDetail && selectedTicket) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Chi tiết Ticket
              </h3>
              <button
                onClick={() => {
                  console.log('Closing ticket detail modal');
                  setShowTicketDetail(false);
                  setSelectedTicket(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ticket Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket.subject || selectedTicket.title || 'Không có tiêu đề'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nội dung</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedTicket.description || 'Không có nội dung'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Trạng thái</label>
                      <p className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                          {getStatusText(selectedTicket.status)}
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mức độ</label>
                      <p className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                          {getPriorityText(selectedTicket.priority)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* User Info */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Thông tin người dùng</h4>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tên</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket.user?.full_name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket.user?.email || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket.user?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Chat History */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Phản hồi
                </h4>
                
                {ticketReplies.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                    {ticketReplies.map((reply, index) => (
                      <div key={reply.reply_id || index} className={`flex ${reply.is_admin_reply ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          reply.is_admin_reply 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border shadow-sm'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium opacity-75">
                              {reply.user?.full_name || (reply.is_admin_reply ? 'Admin' : 'Khách hàng')}
                            </span>
                            <span className="text-xs opacity-60">
                              {new Date(reply.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <p className={`text-sm whitespace-pre-wrap ${
                            reply.is_admin_reply ? 'text-white' : 'text-gray-800'
                          }`}>
                            {reply.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Chưa có tin nhắn nào trong cuộc trò chuyện này</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReplyModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Phản hồi
              </button>
              
              <button
                onClick={() => {
                  setShowTicketDetail(false);
                  setSelectedTicket(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reply Modal */}
      {showReplyModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Phản hồi ticket</h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung phản hồi
                </label>
                <textarea
                  value={replyFormData.message}
                  onChange={(e) => setReplyFormData({ ...replyFormData, message: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Nhập nội dung phản hồi..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyFormData({ message: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleReplyTicket}
                disabled={formLoading || !replyFormData.message}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {formLoading ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Update Modal */}
      {showStatusModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cập nhật trạng thái</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <Select
                  value={statusFormData.status}
                  onValueChange={(value) => setStatusFormData({ 
                    ...statusFormData, 
                    status: value as 'open' | 'in_progress' | 'resolved' | 'closed'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Mở</SelectItem>
                    <SelectItem value="in_progress">Đang xử lý</SelectItem>
                    <SelectItem value="resolved">Đã giải quyết</SelectItem>
                    <SelectItem value="closed">Đã đóng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú giải quyết
                </label>
                <textarea
                  value={statusFormData.resolution_note}
                  onChange={(e) => setStatusFormData({ ...statusFormData, resolution_note: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Ghi chú về cách giải quyết..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={formLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {formLoading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportManagement;