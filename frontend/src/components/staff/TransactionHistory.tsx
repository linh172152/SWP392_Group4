import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  History,
  Loader2,
  RefreshCw,
  MapPin,
  Car,
  Battery,
  Calendar,
  CreditCard,
  Filter,
  User,
  Phone
} from 'lucide-react';
import { getTransactionHistory, TransactionHistoryItem } from '../../services/staff.service';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../ui/pagination';
import { logError } from '../../utils/errorHandler';

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [limit] = useState(10);

  const loadTransactions = async (pageNum: number = 1, status?: string) => {
    setLoading(true);
    try {
      const response = await getTransactionHistory({
        page: pageNum,
        limit,
        status: status && status !== 'all' ? status : undefined,
      });
      if (response.success && response.data) {
        setTransactions(response.data.transactions);
        setTotalPages(response.data.pagination.pages);
        setPage(response.data.pagination.page);
      }
    } catch (error) {
      logError(error, "TransactionHistory.loadTransactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(1, statusFilter);
  }, [statusFilter]);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadTransactions(newPage, statusFilter);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 text-white">Hoàn thành</Badge>;
      case 'pending':
        return <Badge variant="secondary">Đang xử lý</Badge>;
      case 'failed':
        return <Badge variant="destructive">Thất bại</Badge>;
      case 'covered_by_subscription':
        return <Badge className="bg-blue-500 text-white">Gói dịch vụ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return 'N/A';
    switch (method) {
      case 'wallet':
        return 'Ví';
      case 'cash':
        return 'Tiền mặt';
      case 'vnpay':
        return 'VNPay';
      case 'momo':
        return 'MoMo';
      case 'subscription':
        return 'Gói dịch vụ';
      default:
        return method;
    }
  };

  // Format amount - không có dấu + hoặc -
  const formatAmount = (amount: number) => {
    return formatCurrency(Math.abs(amount));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Lịch sử Giao dịch
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Xem chi tiết các giao dịch đổi pin đã xử lý
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadTransactions(page, statusFilter)}
          className="shadow-sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Filter */}
      <Card className="glass-card border-0 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Trạng thái:
              </span>
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800">
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="pending">Đang xử lý</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {loading ? (
        <Card className="glass-card border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-600" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Đang tải lịch sử giao dịch...
            </p>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card className="glass-card border-0 shadow-xl">
          <CardContent className="p-12 text-center">
            <History className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              Chưa có giao dịch nào
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card
              key={transaction.transaction_id}
              className="glass-card border-0 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left side - Transaction info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-5 w-5 text-green-600" />
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            {transaction.transaction_code}
                          </h3>
                          {getPaymentStatusBadge(transaction.payment_status)}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Booking: {transaction.booking_code}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* User info */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {transaction.user_name}
                        </span>
                        {transaction.user_phone && (
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {transaction.user_phone}
                          </span>
                        )}
                      </div>

                      {/* Vehicle */}
                      <div className="flex items-center gap-2 text-sm">
                        <Car className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {transaction.vehicle_license_plate}
                        </span>
                      </div>

                      {/* Station */}
                      {transaction.station_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          <span className="text-slate-700 dark:text-slate-300">
                            {transaction.station_name}
                          </span>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {formatDate(transaction.swap_at || transaction.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Amount */}
                  <div className="flex flex-col items-end gap-2 lg:border-l lg:pl-6 lg:ml-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Số tiền
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatAmount(transaction.amount)}
                      </p>
                      {transaction.payment_method && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {getPaymentMethodLabel(transaction.payment_method)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => page > 1 && handlePageChange(page - 1)}
                      className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === page}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => page < totalPages && handlePageChange(page + 1)}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;

