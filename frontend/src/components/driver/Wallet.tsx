import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  History,
  Loader2,
} from "lucide-react";
import walletService, {
  type WalletTransaction,
} from "../../services/wallet.service";
import {
  getTopUpPackages,
  type TopUpPackage,
} from "../../services/topup-package.service";
import TopUpModal from "./TopUpModal";
import { formatCurrency } from "../../utils/format";

const Wallet: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [topUpPackages, setTopUpPackages] = useState<TopUpPackage[]>([]);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load wallet balance
  const loadBalance = async () => {
    try {
      const response = await walletService.getWalletBalance();
      setBalance(Number(response.data.balance));
    } catch (error) {
      console.error("Error loading wallet balance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load transactions
  const loadTransactions = async (pageNum: number = 1) => {
    setTransactionsLoading(true);
    try {
      const response = await walletService.getWalletTransactions({
        page: pageNum,
        limit: 10,
      });
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Load topup packages
  const loadTopUpPackages = async () => {
    try {
      // Use driver endpoint to get topup packages
      const response = await getTopUpPackages({
        is_active: true,
        limit: 100,
        forDriver: true,
      });
      setTopUpPackages(response.data.packages);
    } catch (error) {
      console.error("Error loading topup packages:", error);
    }
  };

  useEffect(() => {
    loadBalance();
    loadTransactions();
    loadTopUpPackages();
  }, []);

  const handleTopUpSuccess = () => {
    loadBalance();
    loadTransactions(1);
    setShowTopUpModal(false);
  };

  const getTransactionType = (transaction: WalletTransaction) => {
    // Hoàn tiền (refund) - tiền được cộng vào ví
    if (
      transaction.payment_type === "PACKAGE_REFUND" ||
      transaction.payment_type === "package_refund" ||
      transaction.payment_type?.toLowerCase().includes("refund")
    ) {
      return "refund";
    }
    // Nạp tiền - tiền được cộng vào ví
    if (transaction.topup_package_id) {
      return "topup";
    }
    // Thanh toán - tiền bị trừ khỏi ví
    if (transaction.transaction_id) {
      return "payment";
    }
    return "other";
  };

  const getTransactionIcon = (transaction: WalletTransaction) => {
    const type = getTransactionType(transaction);
    if (type === "topup" || type === "refund") {
      return (
        <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-400" />
      );
    }
    return <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400" />;
  };

  const getTransactionLabel = (transaction: WalletTransaction) => {
    const type = getTransactionType(transaction);

    // Nạp tiền
    if (type === "topup") {
      return `Nạp tiền: ${transaction.topup_package?.name || "Nạp tiền"}`;
    }

    // Thanh toán đổi pin
    if (transaction.transaction_id) {
      // Có thông tin booking và station
      if (transaction.transaction?.booking?.station?.name) {
        return `Thanh toán đổi pin tại ${transaction.transaction.booking.station.name}`;
      }
      // Có transaction code nhưng không có booking info
      if (transaction.transaction?.transaction_code) {
        return `Thanh toán đổi pin - ${transaction.transaction.transaction_code}`;
      }
      // Chỉ có transaction_id
      return "Thanh toán đổi pin";
    }

    // Thanh toán bằng gói subscription
    if (transaction.subscription_id) {
      const packageName =
        transaction.subscription?.package?.name || "Gói đăng ký";
      return `Thanh toán bằng gói: ${packageName}`;
    }

    // Trường hợp khác - hiển thị payment_type nếu có
    if (transaction.payment_type) {
      const paymentTypeLabels: Record<string, string> = {
        topup: "Nạp tiền",
        wallet_topup: "Nạp tiền",
        booking: "Thanh toán đổi pin",
        battery_swap: "Thanh toán đổi pin",
        swap: "Thanh toán đổi pin",
        subscription: "Thanh toán gói đăng ký",
        package_payment: "Thanh toán gói đăng ký",
        refund: "Hoàn tiền",
        wallet_refund: "Hoàn tiền",
      };
      // Luôn dịch sang tiếng Việt, không hiển thị thuật ngữ tiếng Anh
      const translatedLabel =
        paymentTypeLabels[transaction.payment_type.toLowerCase()];
      if (translatedLabel) {
        return translatedLabel;
      }
      // Nếu không tìm thấy trong danh sách, vẫn dịch chung chung
      return "Giao dịch";
    }

    return "Giao dịch khác";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Ví của tôi
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Quản lý số dư và lịch sử giao dịch
          </p>
        </div>
        <Button
          onClick={() => setShowTopUpModal(true)}
          className="gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nạp tiền
        </Button>
      </div>

      {/* Balance Card */}
      <Card className="glass-card border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Số dư ví
          </CardTitle>
          <CardDescription>Số tiền hiện có trong ví của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-4xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(balance)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadBalance();
                  loadTransactions(1);
                }}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="glass-card border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Lịch sử giao dịch
          </CardTitle>
          <CardDescription>Danh sách các giao dịch gần đây</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              Chưa có giao dịch nào
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const type = getTransactionType(transaction);
                const isIncome = type === "topup" || type === "refund"; // Nạp tiền hoặc hoàn tiền = tiền vào
                const amount = Number(transaction.amount);

                return (
                  <div
                    key={transaction.payment_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-700">
                        {getTransactionIcon(transaction)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {getTransactionLabel(transaction)}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {new Date(transaction.created_at).toLocaleString(
                            "vi-VN"
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              transaction.payment_status === "completed"
                                ? "default"
                                : transaction.payment_status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {transaction.payment_status === "completed"
                              ? "Hoàn thành"
                              : transaction.payment_status === "pending"
                              ? "Đang xử lý"
                              : "Thất bại"}
                          </Badge>
                          {transaction.payment_method && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.payment_method === "cash"
                                ? "Tiền mặt"
                                : transaction.payment_method === "vnpay"
                                ? "VNPay"
                                : transaction.payment_method === "momo"
                                ? "MoMo"
                                : transaction.payment_method}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          isIncome
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(amount)}
                      </div>
                    </div>
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

      {/* TopUp Modal */}
      {showTopUpModal && (
        <TopUpModal
          packages={topUpPackages}
          currentBalance={balance}
          onClose={() => setShowTopUpModal(false)}
          onSuccess={handleTopUpSuccess}
        />
      )}
    </div>
  );
};

export default Wallet;
