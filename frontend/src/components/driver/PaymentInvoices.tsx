import React, { useEffect, useState } from 'react';
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
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import API_ENDPOINTS, { fetchWithAuth } from '../../config/api';

interface TransactionItem {
  transaction_id: string;
  transaction_code: string;
  amount: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'cancelled';
  station?: { name: string; address?: string };
  vehicle?: { license_plate?: string; model?: string; make?: string };
  new_battery?: { model: string; battery_code?: string };
  booking?: { booking_code?: string };
  swap_duration_minutes?: number;
  payment?: { payment_method?: string; paid_at?: string };
  swap_at?: string;
  created_at?: string;
}

const PaymentInvoices: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [invoices, setInvoices] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const url = new URL(API_ENDPOINTS.DRIVER.TRANSACTIONS);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      const res = await fetchWithAuth(url.toString());
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Tải giao dịch thất bại');
      const items: TransactionItem[] = data.data.transactions || data.data || [];
      setInvoices(items);
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const payNow = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_ENDPOINTS.DRIVER.TRANSACTIONS}/${id}/pay`, { method: 'POST', body: JSON.stringify({ payment_method: 'vnpay' }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Thanh toán thất bại');
      await loadTransactions();
    } catch (e: any) {
      setError(e.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTransactions(); }, [statusFilter]);

  const filteredInvoices = invoices.filter(invoice => {
    const s = searchQuery.toLowerCase();
    const matchesSearch = invoice.transaction_code?.toLowerCase().includes(s) ||
                         (invoice.station?.name || '').toLowerCase().includes(s);
    return matchesSearch;
  });

  const totalSpent = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const paidInvoices = filteredInvoices.filter(inv => inv.payment_status === 'completed');
  const overdueInvoices = filteredInvoices.filter(inv => inv.payment_status === 'pending');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
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

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'failed': return 'Lỗi thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const exportInvoice = (invoice: TransactionItem) => {
    // Tạo Hóa đơn thanh toán - Invoice/Receipt sau khi đã thanh toán
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Hóa đơn thanh toán - ${invoice.transaction_code}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              max-width: 700px;
              margin: 0 auto;
              background: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #10b981;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #059669;
              margin: 0 0 10px 0;
              font-size: 28px;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
              padding: 15px;
              background: #f0fdf4;
              border-radius: 8px;
            }
            .invoice-code-box {
              text-align: center;
              flex: 1;
            }
            .invoice-code-label {
              font-size: 12px;
              color: #047857;
              margin-bottom: 5px;
            }
            .invoice-code {
              font-size: 24px;
              font-weight: bold;
              color: #059669;
              font-family: 'Courier New', monospace;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: bold;
              background: #10b981;
              color: white;
              margin-top: 10px;
            }
            .section {
              margin: 20px 0;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border-left: 4px solid #10b981;
            }
            .section h3 {
              margin: 0 0 12px 0;
              color: #059669;
              font-size: 16px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #475569;
              min-width: 140px;
            }
            .value {
              color: #1e293b;
              text-align: right;
              flex: 1;
            }
            .amount-box {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .amount-label {
              font-size: 14px;
              opacity: 0.9;
              margin-bottom: 8px;
            }
            .amount-value {
              font-size: 36px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px dashed #cbd5e1;
              font-size: 11px;
              color: #64748b;
            }
            .no-print {
              text-align: center;
              margin: 20px 0;
              color: #64748b;
            }
            .company-info {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              text-align: center;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              color: #059669;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="company-info">
            <div class="company-name">EVSwap</div>
            <div style="font-size: 12px; color: #64748b;">Hệ thống đổi pin xe điện</div>
          </div>

          <div class="header">
            <h1>HÓA ĐƠN THANH TOÁN</h1>
            <div class="invoice-info">
              <div class="invoice-code-box">
                <div class="invoice-code-label">Mã giao dịch</div>
                <div class="invoice-code">${invoice.transaction_code}</div>
              </div>
              ${invoice.booking?.booking_code ? `
              <div class="invoice-code-box">
                <div class="invoice-code-label">Mã đơn hàng</div>
                <div class="invoice-code" style="font-size: 20px;">${invoice.booking.booking_code}</div>
              </div>
              ` : ''}
            </div>
            <div class="status-badge">${getPaymentStatusLabel(invoice.payment_status)}</div>
          </div>
          
          <div class="section">
            <h3>📍 Thông tin trạm</h3>
            <div class="info-row">
              <span class="label">Tên trạm:</span>
              <span class="value">${invoice.station?.name || '—'}</span>
            </div>
            ${invoice.station?.address ? `
            <div class="info-row">
              <span class="label">Địa chỉ:</span>
              <span class="value">${invoice.station.address}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>🚗 Thông tin xe</h3>
            ${invoice.vehicle?.license_plate ? `
            <div class="info-row">
              <span class="label">Biển số:</span>
              <span class="value">${invoice.vehicle.license_plate}</span>
            </div>
            ` : ''}
            ${invoice.vehicle?.make ? `
            <div class="info-row">
              <span class="label">Hãng xe:</span>
              <span class="value">${invoice.vehicle.make}</span>
            </div>
            ` : ''}
            ${invoice.vehicle?.model ? `
            <div class="info-row">
              <span class="label">Model:</span>
              <span class="value">${invoice.vehicle.model}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>🔋 Thông tin pin</h3>
            ${invoice.new_battery?.model ? `
            <div class="info-row">
              <span class="label">Model pin:</span>
              <span class="value">${invoice.new_battery.model}</span>
            </div>
            ` : ''}
            ${invoice.new_battery?.battery_code ? `
            <div class="info-row">
              <span class="label">Mã pin:</span>
              <span class="value">${invoice.new_battery.battery_code}</span>
            </div>
            ` : ''}
            ${invoice.swap_duration_minutes ? `
            <div class="info-row">
              <span class="label">Thời gian đổi:</span>
              <span class="value">${invoice.swap_duration_minutes} phút</span>
            </div>
            ` : ''}
          </div>

          ${invoice.swap_at ? `
          <div class="section">
            <h3>📅 Thời gian</h3>
            <div class="info-row">
              <span class="label">Ngày đổi pin:</span>
              <span class="value">${new Date(invoice.swap_at).toLocaleDateString('vi-VN')}</span>
            </div>
            <div class="info-row">
              <span class="label">Giờ đổi pin:</span>
              <span class="value">${new Date(invoice.swap_at).toLocaleTimeString('vi-VN')}</span>
            </div>
          </div>
          ` : ''}

          <div class="amount-box">
            <div class="amount-label">Tổng tiền thanh toán</div>
            <div class="amount-value">${Number(invoice.amount || 0).toLocaleString('vi-VN')} đ</div>
          </div>

          <div class="section">
            <h3>💳 Thông tin thanh toán</h3>
            <div class="info-row">
              <span class="label">Phương thức:</span>
              <span class="value">${invoice.payment?.payment_method === 'vnpay' ? 'VNPay' : invoice.payment?.payment_method === 'cash' ? 'Tiền mặt' : invoice.payment?.payment_method || '—'}</span>
            </div>
            <div class="info-row">
              <span class="label">Trạng thái:</span>
              <span class="value">${getPaymentStatusLabel(invoice.payment_status)}</span>
            </div>
            ${invoice.payment?.paid_at ? `
            <div class="info-row">
              <span class="label">Thời gian thanh toán:</span>
              <span class="value">${new Date(invoice.payment.paid_at).toLocaleString('vi-VN')}</span>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <div>Xuất ngày: ${new Date().toLocaleString('vi-VN')}</div>
            <div style="margin-top: 5px;">Đây là hóa đơn điện tử có giá trị pháp lý tương đương hóa đơn giấy</div>
            <div style="margin-top: 10px; font-weight: bold;">Cảm ơn quý khách đã sử dụng dịch vụ!</div>
          </div>

          <div class="no-print">
            <p>Đang mở hộp thoại in... Nếu không tự động mở, vui lòng nhấn Ctrl+P (Windows) hoặc Cmd+P (Mac)</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments & Invoices</h1>
          <p className="text-gray-600">Manage your payment history</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadTransactions} disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-xl font-bold">{totalSpent.toLocaleString()} đ</p>
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
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-xl font-bold">{paidInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-xl font-bold">{overdueInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="completed">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.transaction_id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Receipt className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{invoice.transaction_code}</h3>
                            <p className="text-sm text-gray-600">{invoice.station?.name || '—'}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(invoice.payment_status)}>
                          {getStatusIcon(invoice.payment_status)}
                          <span className="ml-1 capitalize">{invoice.payment_status}</span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Date</p>
                          <p className="font-medium">{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '—'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-medium text-lg">{Number(invoice.amount || 0).toLocaleString()} đ</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Battery</p>
                          <p className="font-medium">{invoice.new_battery?.model || '—'}</p>
                          <p className="text-xs text-gray-600">Duration: {invoice.swap_duration_minutes || '—'} mins</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Method</p>
                          <p className="font-medium">{invoice.payment?.payment_method || '—'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {invoice.payment_status === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-green-500 text-green-700 hover:bg-green-50"
                          onClick={() => exportInvoice(invoice)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Xuất hóa đơn
                        </Button>
                      )}
                      {invoice.payment_status === 'pending' && (
                        <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => payNow(invoice.transaction_id)} disabled={loading}>
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Savings</CardTitle>
              <CardDescription>Tổng quan chi tiêu</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2">
                <Progress value={75} />
                <p className="text-xs text-gray-600 mt-1">Demo hiển thị, sẽ kết nối stats API nếu cần</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentInvoices;