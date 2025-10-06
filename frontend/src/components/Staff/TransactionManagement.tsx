import React, { useState, useEffect } from 'react';
import './StaffComponents.css';

interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  batteryIn: string;
  batteryOut: string;
  batteryInCondition: 'excellent' | 'good' | 'fair' | 'poor';
  batteryOutCondition: 'excellent' | 'good' | 'fair' | 'poor';
  batteryInSoh: number;
  batteryOutSoh: number;
  paymentMethod: 'cash' | 'card' | 'wallet';
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

interface TransactionStats {
  todayTransactions: number;
  todayRevenue: number;
  pendingTransactions: number;
  completedTransactions: number;
}

const TransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    todayTransactions: 0,
    todayRevenue: 0,
    pendingTransactions: 0,
    completedTransactions: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'cash' as 'cash' | 'card' | 'wallet',
    notes: ''
  });

  // Mock data
  useEffect(() => {
    const mockTransactions: Transaction[] = [
      {
        id: 'TXN001',
        customerId: 'CUST001',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0123456789',
        batteryIn: 'BAT001',
        batteryOut: 'BAT002',
        batteryInCondition: 'good',
        batteryOutCondition: 'excellent',
        batteryInSoh: 75,
        batteryOutSoh: 95,
        paymentMethod: 'cash',
        amount: 50000,
        status: 'completed',
        createdAt: '2024-01-25 09:30:00',
        completedAt: '2024-01-25 09:45:00',
        notes: 'Pin còn tốt, khách hàng hài lòng'
      },
      {
        id: 'TXN002',
        customerId: 'CUST002',
        customerName: 'Trần Thị B',
        customerPhone: '0987654321',
        batteryIn: 'BAT003',
        batteryOut: 'BAT004',
        batteryInCondition: 'fair',
        batteryOutCondition: 'good',
        batteryInSoh: 60,
        batteryOutSoh: 88,
        paymentMethod: 'card',
        amount: 50000,
        status: 'pending',
        createdAt: '2024-01-25 10:15:00',
        notes: 'Chờ xác nhận thanh toán'
      },
      {
        id: 'TXN003',
        customerId: 'CUST003',
        customerName: 'Lê Văn C',
        customerPhone: '0555666777',
        batteryIn: 'BAT005',
        batteryOut: 'BAT006',
        batteryInCondition: 'poor',
        batteryOutCondition: 'good',
        batteryInSoh: 25,
        batteryOutSoh: 65,
        paymentMethod: 'wallet',
        amount: 50000,
        status: 'completed',
        createdAt: '2024-01-25 11:00:00',
        completedAt: '2024-01-25 11:15:00',
        notes: 'Pin cũ cần bảo dưỡng'
      }
    ];

    setTransactions(mockTransactions);
    
    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = mockTransactions.filter(t => 
      t.createdAt.startsWith(today) && t.status === 'completed'
    );
    
    const newStats: TransactionStats = {
      todayTransactions: todayTransactions.length,
      todayRevenue: todayTransactions.reduce((sum, t) => sum + t.amount, 0),
      pendingTransactions: mockTransactions.filter(t => t.status === 'pending').length,
      completedTransactions: mockTransactions.filter(t => t.status === 'completed').length
    };
    setStats(newStats);
  }, []);

  const handleCompleteTransaction = async (transactionId: string) => {
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTransactions(prev => prev.map(transaction => 
        transaction.id === transactionId 
          ? { 
              ...transaction, 
              status: 'completed' as const,
              completedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }
          : transaction
      ));
      
      // Recalculate stats
      const updatedTransactions = transactions.map(transaction => 
        transaction.id === transactionId 
          ? { 
              ...transaction, 
              status: 'completed' as const,
              completedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }
          : transaction
      );
      
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = updatedTransactions.filter(t => 
        t.createdAt.startsWith(today) && t.status === 'completed'
      );
      
      const newStats: TransactionStats = {
        todayTransactions: todayTransactions.length,
        todayRevenue: todayTransactions.reduce((sum, t) => sum + t.amount, 0),
        pendingTransactions: updatedTransactions.filter(t => t.status === 'pending').length,
        completedTransactions: updatedTransactions.filter(t => t.status === 'completed').length
      };
      setStats(newStats);
      
      alert('Hoàn thành giao dịch thành công!');
    } catch (err) {
      setError('Lỗi khi hoàn thành giao dịch: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransaction = async (transactionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy giao dịch này?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTransactions(prev => prev.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, status: 'cancelled' as const }
          : transaction
      ));
      
      alert('Hủy giao dịch thành công!');
    } catch (err) {
      setError('Lỗi khi hủy giao dịch: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      setPaymentData({
        amount: transaction.amount,
        method: 'cash',
        notes: ''
      });
      setSelectedTransaction(transactionId);
      setShowPaymentModal(true);
    }
  };

  const confirmPayment = async () => {
    if (!selectedTransaction) return;
    
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTransactions(prev => prev.map(transaction => 
        transaction.id === selectedTransaction 
          ? { 
              ...transaction, 
              paymentMethod: paymentData.method,
              notes: paymentData.notes
            }
          : transaction
      ));
      
      setShowPaymentModal(false);
      setSelectedTransaction('');
      alert('Xác nhận thanh toán thành công!');
    } catch (err) {
      setError('Lỗi khi xác nhận thanh toán: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Chờ xử lý';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'Xuất sắc';
      case 'good': return 'Tốt';
      case 'fair': return 'Khá';
      case 'poor': return 'Kém';
      default: return 'Không xác định';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    return filterStatus === 'all' || transaction.status === filterStatus;
  });

  return (
    <div className="staff-section">
      <div className="section-header">
        <h2>Quản lý Giao dịch Đổi pin</h2>
        <div className="filter-controls">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Giao dịch hôm nay</h3>
            <p>{stats.todayTransactions} giao dịch</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Doanh thu hôm nay</h3>
            <p>{stats.todayRevenue.toLocaleString()} VNĐ</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Chờ xử lý</h3>
            <p>{stats.pendingTransactions} giao dịch</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Đã hoàn thành</h3>
            <p>{stats.completedTransactions} giao dịch</p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="transaction-list">
        <h3>Danh sách Giao dịch ({filteredTransactions.length})</h3>
        
        <div className="transaction-grid">
          {filteredTransactions.map(transaction => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-header">
                <h4>Giao dịch #{transaction.id}</h4>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(transaction.status) }}
                >
                  {getStatusText(transaction.status)}
                </span>
              </div>
              
              <div className="transaction-info">
                <div className="info-section">
                  <h5>Thông tin khách hàng</h5>
                  <div className="info-row">
                    <span className="label">Tên:</span>
                    <span className="value">{transaction.customerName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">SĐT:</span>
                    <span className="value">{transaction.customerPhone}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h5>Pin trao đổi</h5>
                  <div className="info-row">
                    <span className="label">Pin vào:</span>
                    <span className="value">{transaction.batteryIn}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Pin ra:</span>
                    <span className="value">{transaction.batteryOut}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h5>Tình trạng pin</h5>
                  <div className="info-row">
                    <span className="label">Pin vào:</span>
                    <span 
                      className="value"
                      style={{ color: getConditionColor(transaction.batteryInCondition) }}
                    >
                      {getConditionText(transaction.batteryInCondition)} ({transaction.batteryInSoh}%)
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Pin ra:</span>
                    <span 
                      className="value"
                      style={{ color: getConditionColor(transaction.batteryOutCondition) }}
                    >
                      {getConditionText(transaction.batteryOutCondition)} ({transaction.batteryOutSoh}%)
                    </span>
                  </div>
                </div>

                <div className="info-section">
                  <h5>Thanh toán</h5>
                  <div className="info-row">
                    <span className="label">Số tiền:</span>
                    <span className="value">{transaction.amount.toLocaleString()} VNĐ</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phương thức:</span>
                    <span className="value">
                      {transaction.paymentMethod === 'cash' ? 'Tiền mặt' :
                       transaction.paymentMethod === 'card' ? 'Thẻ' : 'Ví điện tử'}
                    </span>
                  </div>
                </div>

                <div className="info-section">
                  <h5>Thời gian</h5>
                  <div className="info-row">
                    <span className="label">Tạo lúc:</span>
                    <span className="value">{transaction.createdAt}</span>
                  </div>
                  {transaction.completedAt && (
                    <div className="info-row">
                      <span className="label">Hoàn thành:</span>
                      <span className="value">{transaction.completedAt}</span>
                    </div>
                  )}
                </div>

                {transaction.notes && (
                  <div className="info-section">
                    <h5>Ghi chú</h5>
                    <p className="notes">{transaction.notes}</p>
                  </div>
                )}
              </div>

              <div className="transaction-actions">
                {transaction.status === 'pending' && (
                  <>
                    <button 
                      className="btn-success"
                      onClick={() => handleCompleteTransaction(transaction.id)}
                      disabled={loading}
                    >
                      Hoàn thành
                    </button>
                    <button 
                      className="btn-warning"
                      onClick={() => handlePayment(transaction.id)}
                      disabled={loading}
                    >
                      Xác nhận thanh toán
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => handleCancelTransaction(transaction.id)}
                      disabled={loading}
                    >
                      Hủy giao dịch
                    </button>
                  </>
                )}
                <button className="btn-secondary">
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Không có giao dịch</h3>
          <p>Thử thay đổi bộ lọc để xem kết quả khác</p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Xác nhận Thanh toán</h3>
              <button 
                className="modal-close"
                onClick={() => setShowPaymentModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Số tiền:</label>
                <input 
                  type="number" 
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({...paymentData, amount: parseInt(e.target.value)})}
                  disabled
                />
              </div>
              
              <div className="form-group">
                <label>Phương thức thanh toán:</label>
                <select 
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({...paymentData, method: e.target.value as 'cash' | 'card' | 'wallet'})}
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="card">Thẻ</option>
                  <option value="wallet">Ví điện tử</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Ghi chú:</label>
                <textarea 
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                  placeholder="Ghi chú về giao dịch..."
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowPaymentModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn-primary"
                onClick={confirmPayment}
                disabled={loading}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;

