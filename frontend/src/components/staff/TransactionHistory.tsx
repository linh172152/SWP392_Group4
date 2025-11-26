import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    // Reset về page 1 khi filter thay đổi
    setPage(1);
    loadTransactions(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Memoize event handlers
  const handleFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    loadTransactions(newPage, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Memoize helper functions
  const getPaymentStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm border-0">Hoàn thành</Badge>;
      case 'pending':
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-sm border-0">Đang xử lý</Badge>;
      case 'failed':
        return <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm border-0">Thất bại</Badge>;
      case 'covered_by_subscription':
        return <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-sm border-0">Gói dịch vụ</Badge>;
      default:
        return <Badge variant="outline" className="shadow-sm">{status}</Badge>;
    }
  }, []);

  const getPaymentMethodLabel = useCallback((method?: string) => {
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
  }, []);

  // Memoize format function
  const formatAmount = useCallback((amount: number) => {
    return formatCurrency(Math.abs(amount));
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="float">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-green-900 dark:from-white dark:to-green-100 bg-clip-text text-transparent">
            Lịch sử Giao dịch
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Xem chi tiết các giao dịch đổi pin đã xử lý
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadTransactions(page, statusFilter)}
          className="glass border-green-200/50 dark:border-emerald-400/30 hover:bg-green-50/50 dark:hover:bg-emerald-500/10 shadow-sm hover:shadow-md transition-all duration-200"
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
                  <SelectItem value="covered_by_subscription">Gói dịch vụ</SelectItem>
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
        <Card className="glass-card border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-slate-100/30 dark:from-slate-900/50 dark:to-slate-800/30"></div>
          <CardContent className="p-16 text-center relative">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full">
                <History className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">
              Chưa có giao dịch nào
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Lịch sử giao dịch sẽ hiển thị tại đây sau khi các giao dịch được hoàn thành
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card
              key={transaction.transaction_id}
              className="glass-card border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-full blur-3xl opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left side - Transaction info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                            <CreditCard className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                              {transaction.transaction_code}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Booking: <span className="font-mono">{transaction.booking_code}</span>
                            </p>
                          </div>
                          <div className="ml-auto">
                            {getPaymentStatusBadge(transaction.payment_status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* User info */}
                      <div className="flex items-center gap-2 text-sm p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                        <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {transaction.user_name}
                        </span>
                        {transaction.user_phone && (
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-auto">
                            <Phone className="h-3 w-3" />
                            {transaction.user_phone}
                          </span>
                        )}
                      </div>

                      {/* Vehicle */}
                      <div className="flex items-center gap-2 text-sm p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                        <Car className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-mono font-semibold text-slate-900 dark:text-white">
                          {transaction.vehicle_license_plate}
                        </span>
                      </div>

                      {/* Station */}
                      {transaction.station_name && (
                        <div className="flex items-center gap-2 text-sm p-2.5 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="font-medium text-blue-900 dark:text-blue-100">
                            {transaction.station_name}
                          </span>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                        <Calendar className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {formatDate(transaction.swap_at || transaction.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Amount */}
                  <div className="flex flex-col items-end gap-2 lg:border-l lg:pl-6 lg:ml-6 lg:border-slate-200/50 dark:lg:border-slate-700/50">
                    <div className="text-right p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
                      <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                        Số tiền
                      </p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                        {formatAmount(transaction.amount)}
                      </p>
                      {transaction.payment_method && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
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

