import React, { useState } from 'react';
import { logout, getStoredRole } from '../../services/authService';
import BatteryInventory from '../../components/Staff/BatteryInventory';
import TransactionManagement from '../../components/Staff/TransactionManagement';
import './StaffDashboard.css';

type StaffSection = 'overview' | 'inventory' | 'transactions';

export default function StaffDashboard() {
  const [activeSection, setActiveSection] = useState<StaffSection>('overview');
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
    <div className="staff-dashboard">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">Staff Dashboard</h1>
            <span className="user-badge">Nhân viên trạm</span>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">Xin chào, {role}!</span>
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
            <span className="nav-icon">🔋</span>
            Quản lý Pin
          </button>
          <button 
            className={`nav-item ${activeSection === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveSection('transactions')}
          >
            <span className="nav-icon">📋</span>
            Giao dịch
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="content-wrapper">
          {activeSection === 'overview' ? (
            <div className="overview-layout">
              {renderSection()}
            </div>
          ) : (
            <div className="section-layout">
              {renderSection()}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <p>&copy; 2024 EV Battery Swap System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
