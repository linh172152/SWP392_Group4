import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  CreditCard, 
  Search, 
  Download,
  DollarSign,
  Receipt,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { transactionService, type Transaction } from '../../services/transaction.service';

const mockPaymentMethods = [
  {
    id: '1',
    type: 'Visa',
    last4: '1234',
    expiry: '12/26',
    isDefault: true
  },
  {
    id: '2',
    type: 'Mastercard',
    last4: '5678',
    expiry: '09/25',
    isDefault: false
  }
];

const mockSubscription = {
  plan: 'Premium',
  monthlyFee: 19.99,
  discountRate: 15,
  nextBilling: '2024-02-01',
  status: 'active'
};

const PaymentInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage] = useState(1);
  const [_totalPages, setTotalPages] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [authError, setAuthError] = useState(false);

  // Load transactions from API
  useEffect(() => {
    // Check if user is logged in
    const accessToken = localStorage.getItem('accessToken');
    const user = localStorage.getItem('ev_swap_user');
    
    if (!accessToken || !user) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    
    loadTransactions();
  }, [statusFilter, currentPage]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await transactionService.getTransactions(params);
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pagination.pages);
      
      // Calculate total spent
      const total = response.data.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      setTotalAmount(total);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      
      // Handle 401 Unauthorized error
      if (error.status === 401) {
        setAuthError(true);
        // Clear invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('ev_swap_user');
        
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        alert(error.message || "Không thể tải danh sách giao dịch");
      }
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = totalAmount;
  const paidInvoices = transactions.filter(t => t.payment_status === 'completed');
  const overdueInvoices = transactions.filter(t => t.payment_status === 'pending' && Number(t.amount) > 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'failed': return 'Thất bại';
      case 'refunded': return 'Đã hoàn tiền';
      default: return status;
    }
  };

  const handlePayNow = async (transactionId: string) => {
    try {
      await transactionService.payTransaction(transactionId, { payment_method: 'vnpay' });
      alert("Đã thanh toán giao dịch thành công");
      loadTransactions();
    } catch (error: any) {
      // Handle 401 Unauthorized error
      if (error.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('ev_swap_user');
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate('/');
      } else {
        alert(error.message || "Không thể thanh toán");
      }
    }
  };

  const filteredInvoices = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.transaction_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.station?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán & Hóa đơn</h1>
          <p className="text-gray-600">Quản lý phương thức thanh toán và lịch sử giao dịch</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadTransactions}>
            <Download className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm phương thức
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                <p className="text-xl font-bold">{totalSpent.toLocaleString('vi-VN')} ₫</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đã thanh toán</p>
                <p className="text-xl font-bold">{paidInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chờ thanh toán</p>
                <p className="text-xl font-bold">{overdueInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Giao dịch</TabsTrigger>
          <TabsTrigger value="payment-methods">Phương thức thanh toán</TabsTrigger>
          <TabsTrigger value="subscription">Gói đăng ký</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm giao dịch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="completed">Đã thanh toán</SelectItem>
                    <SelectItem value="pending">Chờ thanh toán</SelectItem>
                    <SelectItem value="failed">Thất bại</SelectItem>
                    <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lọc theo thời gian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="week">7 ngày qua</SelectItem>
                    <SelectItem value="month">30 ngày qua</SelectItem>
                    <SelectItem value="quarter">3 tháng qua</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Invoice List */}
          {authError ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Phiên đăng nhập không hợp lệ</h3>
                <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem giao dịch của bạn.</p>
                <Button onClick={() => navigate('/')}>
                  Đăng nhập
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có giao dịch</h3>
                <p className="text-gray-600">Chưa có giao dịch nào được tìm thấy.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInvoices.map((transaction) => (
                <Card key={transaction.transaction_id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Receipt className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{transaction.transaction_code}</h3>
                              <p className="text-sm text-gray-600">{transaction.station?.name || 'N/A'}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(transaction.payment_status)}>
                            {getStatusIcon(transaction.payment_status)}
                            <span className="ml-1">{getStatusLabel(transaction.payment_status)}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Ngày</p>
                            <p className="font-medium">{new Date(transaction.created_at).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Số tiền</p>
                            <p className="font-medium text-lg">{Number(transaction.amount).toLocaleString('vi-VN')} ₫</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Pin mới</p>
                            <p className="font-medium">{transaction.new_battery?.model || 'N/A'}</p>
                            {transaction.swap_duration_minutes && (
                              <p className="text-xs text-gray-600">Thời gian: {transaction.swap_duration_minutes} phút</p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-500">Xe</p>
                            <p className="font-medium">{transaction.vehicle?.license_plate || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="mr-1 h-3 w-3" />
                          Chi tiết
                        </Button>
                        {transaction.payment_status === 'pending' && Number(transaction.amount) > 0 && (
                          <Button 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handlePayNow(transaction.transaction_id)}
                          >
                            Thanh toán
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockPaymentMethods.map((method) => (
              <Card key={method.id} className={method.isDefault ? 'border-blue-500' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <CreditCard className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{method.type} ****{method.last4}</h3>
                        <p className="text-sm text-gray-600">Expires {method.expiry}</p>
                      </div>
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    {!method.isDefault && (
                      <Button variant="outline" size="sm" className="flex-1">
                        Set Default
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Payment Method Card */}
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-gray-50 rounded-lg inline-block mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="font-semibold mb-2">Add Payment Method</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add a new credit or debit card for seamless payments
                </p>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Card
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>Your active EVSwap plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{mockSubscription.plan} Plan</h3>
                    <p className="text-gray-600">${mockSubscription.monthlyFee}/month</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount on swaps</span>
                    <span className="font-medium">{mockSubscription.discountRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Next billing</span>
                    <span className="font-medium">{new Date(mockSubscription.nextBilling).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">
                      Change Plan
                    </Button>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Benefits</CardTitle>
                <CardDescription>What you get with Premium</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">15% discount on all battery swaps</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Priority booking at busy stations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Extended battery health warranty</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">24/7 premium customer support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Access to premium battery types</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">This Month's Savings</h4>
                  <div className="text-2xl font-bold text-blue-600">$12.50</div>
                  <p className="text-sm text-blue-700">You've saved this much with your Premium plan</p>
                  <Progress value={75} className="mt-2" />
                  <p className="text-xs text-blue-600 mt-1">75% of monthly fee recovered</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentInvoices;