import { useState } from 'react';
import LoginForm from '../../components/Auth/LoginForm';
import RegisterForm from '../../components/Auth/RegisterForm';
import PackageRegistration from '../../components/Package/PackageRegistration';
import './LoginPage.css';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'package'>('login');

  const handleTabChange = (tab: 'login' | 'register' | 'package') => {
    setActiveTab(tab);
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <h1 className="logo">EV Battery Swap</h1>
          <nav className="nav-menu">
            <button 
              className={`nav-item ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Đăng nhập
            </button>
            <button 
              className={`nav-item ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              Đăng ký
            </button>
            <button 
              className={`nav-item ${activeTab === 'package' ? 'active' : ''}`}
              onClick={() => handleTabChange('package')}
            >
              Đăng ký gói
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        <div className="content-wrapper">
          {/* Left Side - Welcome Section */}
          <div className="welcome-section">
            <div className="welcome-content">
              <h2 className="welcome-title">
                Chào mừng đến với <span className="highlight">EV Battery Swap</span>
              </h2>
              <p className="welcome-description">
                Hệ thống đổi pin xe điện thông minh với đầy đủ tính năng 
                đăng nhập, đăng ký và quản lý gói dịch vụ.
              </p>
              <div className="features">
                <div className="feature-item">
                  <div className="feature-icon">🔋</div>
                  <div className="feature-text">
                    <h4>Đổi pin nhanh</h4>
                    <p>Hệ thống đổi pin tự động trong 3 phút</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">📍</div>
                  <div className="feature-text">
                    <h4>Trạm rộng khắp</h4>
                    <p>Mạng lưới trạm đổi pin toàn quốc</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">💳</div>
                  <div className="feature-text">
                    <h4>Thanh toán linh hoạt</h4>
                    <p>Nhiều gói dịch vụ phù hợp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="form-section">
            <div className="form-container">
              {activeTab === 'login' && <LoginForm />}
              {activeTab === 'register' && <RegisterForm />}
              {activeTab === 'package' && <PackageRegistration />}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <p>&copy; 2024 EV Battery Swap System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
