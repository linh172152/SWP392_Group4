import { useState } from 'react';
import { logout } from '../../services/authService';
import AccountManagement from '../../components/User/AccountManagement.tsx';
import StationBooking from '../../components/User/StationBooking.tsx';
import PaymentSection from '../../components/User/PaymentSection.tsx';
import SupportSection from '../../components/User/SupportSection.tsx';
import './UserDashboard.css';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'account' | 'booking' | 'payment' | 'support'>('account');

  const handleTabChange = (tab: 'account' | 'booking' | 'payment' | 'support') => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="user-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">EV Driver Dashboard</h1>
            <span className="user-badge">Tài xế EV</span>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">Xin chào, Tài xế!</span>
              <button className="logout-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-content">
          <button 
            className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => handleTabChange('account')}
          >
            <span className="nav-icon">👤</span>
            Quản lý tài khoản
          </button>
          <button 
            className={`nav-item ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => handleTabChange('booking')}
          >
            <span className="nav-icon">🔋</span>
            Đặt lịch & Trạm đổi pin
          </button>
          <button 
            className={`nav-item ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => handleTabChange('payment')}
          >
            <span className="nav-icon">💳</span>
            Thanh toán & Gói dịch vụ
          </button>
          <button 
            className={`nav-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => handleTabChange('support')}
          >
            <span className="nav-icon">🆘</span>
            Hỗ trợ & Phản hồi
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="content-wrapper">
          {/* Left Side - Info Section */}
          <div className="info-section">
            <div className="info-content">
              <h2 className="info-title">
                Chào mừng, <span className="highlight">Tài xế EV</span>
              </h2>
              <p className="info-description">
                Quản lý tài khoản, đặt lịch đổi pin, thanh toán và nhận hỗ trợ 
                một cách dễ dàng và tiện lợi.
              </p>
              
              <div className="quick-stats">
                <div className="stat-item">
                  <div className="stat-icon">🔋</div>
                  <div className="stat-content">
                    <h4>Lần đổi pin</h4>
                    <p>12 lần trong tháng này</p>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <h4>Chi phí</h4>
                    <p>2,400,000 VNĐ</p>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <h4>Đánh giá</h4>
                    <p>4.8/5 sao</p>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Hoạt động gần đây</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-time">2 giờ trước</span>
                    <span className="activity-desc">Đổi pin thành công tại Trạm A</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">1 ngày trước</span>
                    <span className="activity-desc">Thanh toán gói tháng</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">3 ngày trước</span>
                    <span className="activity-desc">Đặt lịch đổi pin tại Trạm B</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Content Section */}
          <div className="content-section">
            <div className="content-container">
              {activeTab === 'account' && <AccountManagement />}
              {activeTab === 'booking' && <StationBooking />}
              {activeTab === 'payment' && <PaymentSection />}
              {activeTab === 'support' && <SupportSection />}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <p>&copy; 2024 EV Driver System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
