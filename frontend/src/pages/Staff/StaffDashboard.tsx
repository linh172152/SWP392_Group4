import React, { useState } from 'react';
import { logout, getStoredRole } from '../../services/authService';
import BatteryInventory from '../../components/Staff/BatteryInventory';
import TransactionManagement from '../../components/Staff/TransactionManagement';
import './StaffDashboard.css';

type StaffSection = 'overview' | 'inventory' | 'transactions' | 'schedule' | 'history' | 'profile';

export default function StaffDashboard() {
  const [activeSection, setActiveSection] = useState<StaffSection>('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState<string>('');
  const role = getStoredRole();

  const handleLogout = () => {
    try {
      logout();
      window.location.href = '/';
    } catch (err) {
      setError('Lỗi khi đăng xuất: ' + (err as Error).message);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'inventory':
        return <BatteryInventory />;
      case 'transactions':
        return <TransactionManagement />;
      default:
        return (
          <div className="overview-layout">
            {/* Left Panel - Main Dashboard */}
            <div className="overview-section">
              <div className="overview-header">
                <h2>Chào mừng đến với Staff Dashboard</h2>
                <p>Quản lý trạm đổi pin và giao dịch khách hàng</p>
              </div>
              
              <div className="overview-stats">
                <div className="stat-card">
                  <div className="stat-icon">🔋</div>
                  <div className="stat-content">
                    <h3>45 Pin</h3>
                    <p>Tổng số pin trong kho</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>32 Pin</h3>
                    <p>Pin sẵn sàng</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">⚡</div>
                  <div className="stat-content">
                    <h3>8 Pin</h3>
                    <p>Đang sạc</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>15 Giao dịch</h3>
                    <p>Hôm nay</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Thao tác nhanh</h3>
                <div className="action-buttons">
                  <button 
                    className="action-btn"
                    onClick={() => setActiveSection('inventory')}
                  >
                    <div className="action-icon">🔋</div>
                    <div className="action-text">
                      <h4>Quản lý Tồn kho Pin</h4>
                      <p>Theo dõi số lượng và tình trạng pin</p>
                    </div>
                  </button>
                  
                  <button 
                    className="action-btn"
                    onClick={() => setActiveSection('transactions')}
                  >
                    <div className="action-icon">📋</div>
                    <div className="action-text">
                      <h4>Quản lý Giao dịch</h4>
                      <p>Xác nhận đổi pin và thanh toán</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Hoạt động gần đây</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-time">30 phút trước</span>
                    <span className="activity-desc">Hoàn thành giao dịch #TXN001</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">1 giờ trước</span>
                    <span className="activity-desc">Cập nhật trạng thái pin BAT005</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-time">2 giờ trước</span>
                    <span className="activity-desc">Nhận giao dịch mới #TXN002</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Additional Info */}
            <div className="info-panel">
              <div className="info-section">
                <h3>Thông tin Trạm</h3>
                <div className="station-info">
                  <div className="info-item">
                    <span className="info-label">Tên trạm:</span>
                    <span className="info-value">Trạm A - Quận 1</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Địa chỉ:</span>
                    <span className="info-value">123 Nguyễn Huệ, Q1, TP.HCM</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Trạng thái:</span>
                    <span className="info-value status-active">Hoạt động</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Nhân viên:</span>
                    <span className="info-value">Nguyễn Văn A</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Thống kê Hôm nay</h3>
                <div className="daily-stats">
                  <div className="daily-stat">
                    <div className="stat-number">15</div>
                    <div className="stat-label">Giao dịch</div>
                  </div>
                  <div className="daily-stat">
                    <div className="stat-number">750K</div>
                    <div className="stat-label">Doanh thu (VNĐ)</div>
                  </div>
                  <div className="daily-stat">
                    <div className="stat-number">8</div>
                    <div className="stat-label">Pin sạc</div>
                  </div>
                  <div className="daily-stat">
                    <div className="stat-number">3</div>
                    <div className="stat-label">Pin bảo dưỡng</div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Pin Cần Chú Ý</h3>
                <div className="alert-list">
                  <div className="alert-item warning">
                    <div className="alert-icon">⚠️</div>
                    <div className="alert-content">
                      <div className="alert-title">Pin SoH thấp</div>
                      <div className="alert-desc">BAT005 - SoH: 25%</div>
                    </div>
                  </div>
                  <div className="alert-item error">
                    <div className="alert-icon">🔧</div>
                    <div className="alert-content">
                      <div className="alert-title">Cần bảo dưỡng</div>
                      <div className="alert-desc">BAT003 - Tình trạng kém</div>
                    </div>
                  </div>
                  <div className="alert-item info">
                    <div className="alert-icon">⚡</div>
                    <div className="alert-content">
                      <div className="alert-title">Đang sạc</div>
                      <div className="alert-desc">BAT002 - 78% SoH</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Giao dịch Chờ Xử lý</h3>
                <div className="pending-transactions">
                  <div className="pending-item">
                    <div className="pending-id">#TXN002</div>
                    <div className="pending-customer">Trần Thị B</div>
                    <div className="pending-time">10:15</div>
                  </div>
                  <div className="pending-item">
                    <div className="pending-id">#TXN004</div>
                    <div className="pending-customer">Lê Văn D</div>
                    <div className="pending-time">11:30</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
    }
  };

  return (
    <div className={`staff-dashboard ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">EVSwap Nhân viên</span>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="nav-icon">🏠</span>
            Tổng quan
          </button>
          <button 
            className={`nav-item ${activeSection === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveSection('inventory')}
          >
            <span className="nav-icon">🗄️</span>
            Kho pin
          </button>
          <button 
            className={`nav-item ${activeSection === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveSection('transactions')}
          >
            <span className="nav-icon">⚡</span>
            Giao dịch thay pin
          </button>
          <button 
            className={`nav-item ${activeSection === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveSection('schedule')}
          >
            <span className="nav-icon">📅</span>
            Lịch làm việc
          </button>
          <button 
            className={`nav-item ${activeSection === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSection('history')}
          >
            <span className="nav-icon">🕒</span>
            Lịch sử ca làm
          </button>
          <button 
            className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <span className="nav-icon">👤</span>
            Hồ sơ cá nhân
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">T</div>
            <div className="user-info">
              <div className="user-name">Trần Thị Nhân Viên</div>
              <div className="user-email">nhanvien@demo.com</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon">→</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeSection === 'overview' ? (
          <div className="overview-content">
            <div className="recent-transactions">
              <div className="section-header">
                <div>
                  <h2>Giao dịch gần đây</h2>
                  <p>Các hoạt động thay pin mới nhất</p>
                </div>
                <button className="view-all-btn">Xem tất cả</button>
              </div>
              
              <div className="transactions-list">
                <div className="transaction-item">
                  <div className="transaction-info">
                    <div className="customer-name">Nguyễn Văn Minh</div>
                    <div className="vehicle-info">Tesla Model 3</div>
                    <div className="transaction-details">
                      <span className="transaction-type">Trao đổi pin</span>
                      <span className="battery-change">STD-001 → STD-045</span>
                    </div>
                    <div className="transaction-time">14:30 (2.5 phút)</div>
                  </div>
                  <div className="transaction-status completed">
                    <span className="status-icon">✓</span>
                    Hoàn thành
                  </div>
                </div>

                <div className="transaction-item">
                  <div className="transaction-info">
                    <div className="customer-name">Trần Thị Lan</div>
                    <div className="vehicle-info">BYD Tang EV</div>
                    <div className="transaction-details">
                      <span className="transaction-type">Trao đổi pin</span>
                      <span className="battery-change">LR-003 → LR-012</span>
                    </div>
                    <div className="transaction-time">14:25 (3.1 phút)</div>
                  </div>
                  <div className="transaction-status completed">
                    <span className="status-icon">✓</span>
                    Hoàn thành
                  </div>
                </div>

                <div className="transaction-item">
                  <div className="transaction-info">
                    <div className="customer-name">Lê Hoàng Nam</div>
                    <div className="vehicle-info">Tesla Model Y</div>
                    <div className="transaction-details">
                      <span className="transaction-type">Trao đổi pin</span>
                      <span className="battery-change">Mới → STD-023</span>
                    </div>
                    <div className="transaction-time">14:20 (1.8 phút)</div>
                  </div>
                  <div className="transaction-status in-progress">
                    <span className="status-icon">🕒</span>
                    Đang thực hiện
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <div className="section-header">
                <div>
                  <h2>Thao tác nhanh</h2>
                  <p>Các hoạt động trạm thường sử dụng</p>
                </div>
              </div>
              
              <div className="actions-grid">
                <button className="action-btn">
                  <span className="action-icon">☐</span>
                  <span className="action-text">Kiểm tra pin</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">⟳</span>
                  <span className="action-text">Khởi động lại</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">👤</span>
                  <span className="action-text">Lịch nhân viên</span>
                </button>
                <button className="action-btn">
                  <span className="action-icon">📅</span>
                  <span className="action-text">Bảo trì</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="section-content">
            {renderSection()}
          </div>
        )}
      </main>
    </div>
  );
}
