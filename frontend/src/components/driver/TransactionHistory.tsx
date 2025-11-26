import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  History,
  Loader2,
  RefreshCw,
  MapPin,
  Car,
  Battery,
  Calendar,
  CreditCard,
  Star,
} from "lucide-react";
import {
  getUserTransactions,
  Transaction,
} from "../../services/transaction.service";
import { formatCurrency, formatDate } from "../../utils/format";
import RatingModal from "./RatingModal";

const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const loadTransactions = async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await getUserTransactions({
        page: pageNum,
        limit,
      });
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pagination.pages);
      setPage(response.data.pagination.page);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(1);
  }, []);

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white">Hoàn thành</Badge>;
      case "pending":
        return <Badge variant="secondary">Đang xử lý</Badge>;
      case "failed":
        return <Badge variant="destructive">Thất bại</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "wallet":
        return "Ví";
      case "cash":
        return "Tiền mặt";
      case "vnpay":
        return "VNPay";
      case "momo":
        return "MoMo";
      default:
        return method;
    }
  };

  const handleOpenRating = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRatingModalOpen(true);
  };

  const handleRatingSuccess = () => {
    // Reload transactions sau khi đánh giá thành công
    loadTransactions(page);
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
            Xem chi tiết các giao dịch đổi pin của bạn
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadTransactions(page)}
          className="shadow-sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Transactions List */}
      <Card className="glass-card border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Danh sách giao dịch
          </CardTitle>
          <CardDescription>
            {transactions.length > 0
              ? `Tổng cộng ${transactions.length} giao dịch`
              : "Chưa có giao dịch nào"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const amount = transaction.payment?.amount || 0;
                const isFree = amount === 0;
                const canRate = !!(
                  transaction.station_id || transaction.station
                );

                // Debug log
                if (canRate && !transaction.station_rating) {
                  console.log(
                    "[TransactionHistory] Transaction có thể đánh giá:",
                    {
                      transaction_id: transaction.transaction_id,
                      transaction_code: transaction.transaction_code,
                      station_id: transaction.station_id,
                      has_station: !!transaction.station,
                      has_rating: !!transaction.station_rating,
                    }
                  );
                }

                return (
                  <div
                    key={transaction.transaction_id}
                    className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {transaction.transaction_code}
                          </h3>
                          {transaction.payment &&
                            getPaymentStatusBadge(
                              transaction.payment.payment_status
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(transaction.swap_at)}
                          </div>
                          {transaction.payment?.paid_at && (
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              {formatDate(transaction.payment.paid_at)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-2xl font-bold ${
                            isFree
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isFree ? "Miễn phí" : `-${formatCurrency(amount)}`}
                        </div>
                        {transaction.payment?.payment_method && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {getPaymentMethodLabel(
                              transaction.payment.payment_method
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Station Info */}
                    {transaction.station && (
                      <div className="mb-4 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {transaction.station.name}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {transaction.station.address}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Vehicle & Battery Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {transaction.vehicle && (
                        <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Car className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Xe
                            </span>
                          </div>
                          <div className="text-sm text-slate-900 dark:text-white">
                            {transaction.vehicle.license_plate} -{" "}
                            {transaction.vehicle.model}
                          </div>
                        </div>
                      )}

                      {transaction.old_battery && (
                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Battery className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                              Pin cũ
                            </span>
                          </div>
                          <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                            {transaction.old_battery.battery_code}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {transaction.old_battery.model} -{" "}
                            {transaction.old_battery.current_charge}%
                          </div>
                        </div>
                      )}

                      {transaction.new_battery && (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Battery className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                              Pin mới
                            </span>
                          </div>
                          <div className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                            {transaction.new_battery.battery_code}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {transaction.new_battery.model} -{" "}
                            {transaction.new_battery.current_charge}%
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Staff Info */}
                    {transaction.staff && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Nhân viên xử lý:{" "}
                          <span className="font-medium text-slate-900 dark:text-white">
                            {transaction.staff.full_name}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Rating Section */}
                    {(transaction.station_id || transaction.station) && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        {transaction.station_rating ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  Đã đánh giá:{" "}
                                  <span className="font-medium text-slate-900 dark:text-white">
                                    {transaction.station_rating.rating}/5
                                  </span>
                                </span>
                              </div>
                            </div>
                            {transaction.station_rating.comment && (
                              <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="italic">"{transaction.station_rating.comment}"</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenRating(transaction)}
                            disabled={ratingModalOpen && selectedTransaction?.transaction_id === transaction.transaction_id}
                            className="w-full glass border-blue-200/50 dark:border-purple-400/30 hover:bg-blue-50/50 dark:hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Đánh giá dịch vụ
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTransactions(page - 1)}
                    disabled={page === 1}
                  >
                    Trước
                  </Button>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTransactions(page + 1)}
                    disabled={page === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Modal */}
      {selectedTransaction &&
        (selectedTransaction.station || selectedTransaction.station_id) && (
          <RatingModal
            open={ratingModalOpen}
            onClose={() => {
              setRatingModalOpen(false);
              setSelectedTransaction(null);
            }}
            onSuccess={handleRatingSuccess}
            stationId={
              selectedTransaction.station?.station_id ||
              selectedTransaction.station_id
            }
            stationName={selectedTransaction.station?.name || "Trạm đổi pin"}
            transactionId={selectedTransaction.transaction_id}
            transactionCode={selectedTransaction.transaction_code}
          />
        )}
    </div>
  );
};

export default TransactionHistory;
