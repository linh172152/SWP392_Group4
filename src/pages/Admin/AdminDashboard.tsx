import React, { useState } from 'react';
import { logout, getStoredRole } from '../../services/authService';
import StationManagement from '../../components/Admin/StationManagement';
import UserPackageManagement from '../../components/Admin/UserPackageManagement';
import ReportsAnalytics from '../../components/Admin/ReportsAnalytics';
import './AdminDashboard.css';

type AdminSection = 'overview' | 'stations' | 'users' | 'reports';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
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
      case 'stations':
        return <StationManagement />;
      case 'users':
        return <UserPackageManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      default:
        return (
          <div className="overview-section">
            <div className="overview-header">
              <h2>Chào mừng đến với Admin Dashboard</h2>
              <p>Quản lý hệ thống trạm đổi pin thông minh</p>
            </div>
            
            <div className="overview-stats">
              <div className="stat-card">
                <div className="stat-icon">🏢</div>
                <div className="stat-content">
                  <h3>3 Trạm</h3>
                  <p>Đang hoạt động</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <h3>1,250</h3>
                  <p>Người dùng</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🔋</div>
                <div className="stat-content">
                  <h3>45 Pin</h3>
                  <p>Tổng số pin</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>25M VNĐ</h3>
                  <p>Doanh thu tháng</p>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Thao tác nhanh</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn"
                  onClick={() => setActiveSection('stations')}
                >
                  <div className="action-icon">🏢</div>
                  <div className="action-text">
                    <h4>Quản lý Trạm</h4>
                    <p>Theo dõi trạng thái và SoH</p>
                  </div>
                </button>
                
                <button 
                  className="action-btn"
                  onClick={() => setActiveSection('users')}
                >
                  <div className="action-icon">👥</div>
                  <div className="action-text">
                    <h4>Quản lý Người dùng</h4>
                    <p>Khách hàng và gói thuê</p>
                  </div>
                </button>
                
                <button 
                  className="action-btn"
                  onClick={() => setActiveSection('reports')}
                >
                  <div className="action-icon">📊</div>
                  <div className="action-text">
                    <h4>Báo cáo & Thống kê</h4>
                    <p>Doanh thu và hiệu suất</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')} className="error-close">×</button>
        </div>
      )}
      
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <p>Xin chào, {role}</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Tổng quan</span>
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'stations' ? 'active' : ''}`}
            onClick={() => setActiveSection('stations')}
          >
            <span className="nav-icon">🏢</span>
            <span className="nav-text">Quản lý Trạm</span>
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSection('users')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Người dùng & Gói</span>
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Báo cáo</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Đăng xuất</span>
          </button>
        </div>
      </div>
      
      <div className="admin-main">
        {renderSection()}
      </div>
    </div>
  );
}
