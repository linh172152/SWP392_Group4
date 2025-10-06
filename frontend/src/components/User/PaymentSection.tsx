import { useState } from 'react';
import './UserComponents.css';

interface Transaction {
  id: string;
  date: string;
  type: 'payment' | 'refund' | 'subscription';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
}

interface Package {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  isActive: boolean;
}

export default function PaymentSection() {
  const [activeSection, setActiveSection] = useState<'payment' | 'packages' | 'history'>('payment');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentAmount] = useState(150000);

  // Mock data
  const transactions: Transaction[] = [
    {
      id: '1',
      date: '2024-12-15',
      type: 'payment',
      amount: 150000,
      description: 'Đổi pin tại Trạm Quận 1',
      status: 'completed'
    },
    {
      id: '2',
      date: '2024-12-12',
      type: 'subscription',
      amount: 500000,
      description: 'Gói cơ bản tháng 12',
      status: 'completed'
    },
    {
      id: '3',
      date: '2024-12-10',
      type: 'payment',
      amount: 150000,
      description: 'Đổi pin tại Trạm Quận 2',
      status: 'completed'
    }
  ];

  const packages: Package[] = [
    {
      id: '1',
      name: 'Gói Cơ Bản',
      price: 500000,
      duration: '1 tháng',
      features: ['Đổi pin không giới hạn', 'Hỗ trợ 24/7', 'Bảo hành pin'],
      isActive: true
    },
    {
      id: '2',
      name: 'Gói Cao Cấp',
      price: 1000000,
      duration: '1 tháng',
      features: ['Đổi pin không giới hạn', 'Hỗ trợ 24/7', 'Bảo hành pin', 'Ưu tiên đặt lịch'],
      isActive: false
    },
    {
      id: '3',
      name: 'Gói Doanh Nghiệp',
      price: 2000000,
      duration: '1 tháng',
      features: ['Đổi pin không giới hạn', 'Hỗ trợ 24/7', 'Bảo hành pin', 'Ưu tiên đặt lịch', 'Báo cáo chi tiết'],
      isActive: false
    }
  ];

  const handlePayment = () => {
    alert('Thanh toán thành công!');
  };

  const handlePackageSubscribe = (packageId: string) => {
    alert(`Đăng ký gói ${packageId} thành công!`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Thành công';
      case 'pending': return 'Đang xử lý';
      case 'failed': return 'Thất bại';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="user-component">
      <div className="component-header">
        <h2 className="component-title">Thanh toán & Gói dịch vụ</h2>
        <p className="component-subtitle">Quản lý thanh toán, gói dịch vụ và lịch sử giao dịch</p>
      </div>

      <div className="component-nav">
        <button 
          className={`nav-btn ${activeSection === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveSection('payment')}
        >
          Thanh toán
        </button>
        <button 
          className={`nav-btn ${activeSection === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveSection('packages')}
        >
          Gói dịch vụ
        </button>
        <button 
          className={`nav-btn ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          Lịch sử
        </button>
      </div>

      <div className="component-content">
        {activeSection === 'payment' && (
          <div className="payment-section">
            <h3>Thanh toán theo lượt</h3>
            <div className="payment-form">
              <div className="payment-info">
                <div className="payment-item">
                  <span className="payment-label">Số tiền cần thanh toán:</span>
                  <span className="payment-amount">{formatCurrency(paymentAmount)}</span>
                </div>
                <div className="payment-item">
                  <span className="payment-label">Phương thức thanh toán:</span>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="payment-method"
                  >
                    <option value="card">Thẻ tín dụng/ghi nợ</option>
                    <option value="bank">Chuyển khoản ngân hàng</option>
                    <option value="wallet">Ví điện tử</option>
                    <option value="cash">Tiền mặt</option>
                  </select>
                </div>
              </div>
              <button onClick={handlePayment} className="payment-btn">
                Thanh toán ngay
              </button>
            </div>

            <div className="payment-stats">
              <h4>Thống kê chi phí</h4>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{formatCurrency(2400000)}</div>
                  <div className="stat-label">Tổng chi phí tháng này</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">12</div>
                  <div className="stat-label">Lần đổi pin</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{formatCurrency(200000)}</div>
                  <div className="stat-label">Chi phí trung bình/lần</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'packages' && (
          <div className="packages-section">
            <h3>Gói dịch vụ</h3>
            <div className="packages-grid">
              {packages.map((pkg) => (
                <div key={pkg.id} className={`package-card ${pkg.isActive ? 'active' : ''}`}>
                  <div className="package-header">
                    <h4>{pkg.name}</h4>
                    <span className="package-price">{formatCurrency(pkg.price)}</span>
                    <span className="package-duration">{pkg.duration}</span>
                  </div>
                  <div className="package-features">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="feature-item">
                        <span className="feature-icon">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="package-actions">
                    {pkg.isActive ? (
                      <span className="active-badge">Đang sử dụng</span>
                    ) : (
                      <button 
                        onClick={() => handlePackageSubscribe(pkg.id)}
                        className="subscribe-btn"
                      >
                        Đăng ký
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'history' && (
          <div className="history-section">
            <h3>Lịch sử giao dịch</h3>
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-header">
                    <span className="transaction-date">{transaction.date}</span>
                    <span 
                      className="transaction-status"
                      style={{ color: getStatusColor(transaction.status) }}
                    >
                      {getStatusText(transaction.status)}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <p className="transaction-description">{transaction.description}</p>
                    <p className="transaction-amount">{formatCurrency(transaction.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
