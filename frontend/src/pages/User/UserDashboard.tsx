import { useState, useEffect } from 'react';
import { logout } from '../../services/authService';
import './UserDashboard.css';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'vehicle' | 'stations' | 'booking' | 'payment' | 'support'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark mode
  });

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // Mock data cho các trạm
  const stations = [
    {
      id: 1,
      name: 'Trung tâm EV Trung tâm',
      address: '123 Đường Chính, Trung tâm',
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
      rating: 4.8,
      reviews: 245,
      distance: '0.5 km',
      slots: '8/12',
      status: 'Tình trạng',
      statusPercent: 67,
      openHours: '24/7',
      waitTime: '< 5 phút',
      tags: ['Tiêu chuẩn', 'Cao cấp']
    },
    {
      id: 2,
      name: 'Trạm Trung tâm Thương mại',
      address: '456 Đại lộ Trung tâm Mua sắm',
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
      rating: 4.6,
      reviews: 189,
      distance: '1.1 km',
      slots: '15/20',
      status: 'Tình trạng',
      statusPercent: 75,
      openHours: '6 AM - 11 PM',
      waitTime: '3 phút',
      tags: ['Tiêu chuẩn', 'Cao cấp', 'Tiện ích']
    },
    {
      id: 3,
      name: 'Trạm Nghỉ Cao tốc',
      address: 'Cao tốc A1 hướng Bắc, Km 42',
      image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400',
      rating: 4.4,
      reviews: 156,
      distance: '1.9 km',
      slots: '6/16',
      status: 'Tình trạng',
      statusPercent: 38,
      openHours: '24/7',
      waitTime: '7 phút',
      tags: ['Tiêu chuẩn', 'Cao cấp']
    }
  ];

  const getStatusColor = (percent: number) => {
    if (percent >= 60) return '#10b981'; // green
    if (percent >= 40) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getWaitTimeColor = (waitTime: string) => {
    const minutes = parseInt(waitTime);
    if (minutes <= 5) return '#10b981'; // green
    if (minutes <= 10) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="user-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">EVSwap Tài xế</span>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <span className="nav-icon">🏠</span>
            Trang chủ
          </button>
          <button 
            className={`nav-item ${activeTab === 'vehicle' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicle')}
          >
            <span className="nav-icon">🚗</span>
            Xe của tôi
          </button>
          <button 
            className={`nav-item ${activeTab === 'stations' ? 'active' : ''}`}
            onClick={() => setActiveTab('stations')}
          >
            <span className="nav-icon">📍</span>
            Trạm
          </button>
          <button 
            className={`nav-item ${activeTab === 'booking' ? 'active' : ''}`}
            onClick={() => setActiveTab('booking')}
          >
            <span className="nav-icon">📅</span>
            Đặt chỗ
          </button>
          <button 
            className={`nav-item ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <span className="nav-icon">💳</span>
            Thanh toán
          </button>
          <button 
            className={`nav-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <span className="nav-icon">❓</span>
            Hỗ trợ
          </button>
          <button 
            className={`nav-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <span className="nav-icon">⚙️</span>
            Hồ sơ
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">N</div>
            <div className="user-details">
              <div className="user-name">Nguyễn Văn Tài Xế</div>
              <div className="user-email">nvtaixe@demo.com</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Bar with User Info */}
        <div className="top-bar">
          <div className="page-info">
            <h1 className="welcome-title">Chào mừng trở lại!</h1>
            <p className="welcome-subtitle">Tìm trạm gần đây và quản lý việc thay pin</p>
          </div>
          <div className="user-vehicle">
            <span className="vehicle-label">Xe hiện tại</span>
            <div className="vehicle-info">
              <span className="vehicle-icon">🚗</span>
              <span className="vehicle-name">Tesla Model 3 (VIN: 5VJ3E1EA...)</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card battery">
            <div className="stat-icon">🔋</div>
            <div className="stat-info">
              <div className="stat-label">Mức pin</div>
              <div className="stat-value">32%</div>
            </div>
          </div>
          <div className="stat-card distance">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <div className="stat-label">Quãng đường còn lại</div>
              <div className="stat-value">135 km</div>
            </div>
          </div>
          <div className="stat-card last-swap">
            <div className="stat-icon">🔄</div>
            <div className="stat-info">
              <div className="stat-label">Lần thay cuối</div>
              <div className="stat-value">2 ngày trước</div>
            </div>
          </div>
          <div className="stat-card total-swaps">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <div className="stat-label">Tổng lần thay</div>
              <div className="stat-value">47</div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text"
              placeholder="Tìm trạm theo tên hoặc địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="filter-btn">
            <span>⚙️</span> Bộ lọc
          </button>
          <button className="map-btn">
            <span>🗺️</span> Xem bản đồ
          </button>
        </div>

        {/* Stations Section */}
        <div className="stations-section">
          <h2 className="section-title">Trạm gần đây</h2>
          
          <div className="stations-grid">
            {stations.map(station => (
              <div key={station.id} className="station-card">
                <div className="station-image">
                  <img src={station.image} alt={station.name} />
                  <div className="station-slots">🔌 {station.slots}</div>
                </div>
                
                <div className="station-content">
                  <div className="station-header">
                    <h3 className="station-name">{station.name}</h3>
                    <div className="station-rating">
                      <span className="star">⭐</span>
                      <span className="rating-value">{station.rating}</span>
                      <span className="rating-count">({station.reviews})</span>
                    </div>
                  </div>

                  <p className="station-address">
                    <span className="address-icon">📍</span> {station.address}
                  </p>
                  <div className="station-distance-info">{station.distance}</div>

                  <div className="station-status">
                    <div className="status-label">{station.status}</div>
                    <div className="status-bar">
                      <div 
                        className="status-fill" 
                        style={{ 
                          width: `${station.statusPercent}%`,
                          background: getStatusColor(station.statusPercent)
                        }}
                      ></div>
                    </div>
                    <div 
                      className="status-percent"
                      style={{ color: getStatusColor(station.statusPercent) }}
                    >
                      {station.statusPercent}%
                    </div>
                  </div>

                  <div className="station-info-row">
                    <div className="info-item">
                      <span className="info-label">Giờ hoạt động</span>
                      <span className="info-value">{station.openHours}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Thời gian chờ</span>
                      <span 
                        className="info-value wait-time"
                        style={{ color: getWaitTimeColor(station.waitTime) }}
                      >
                        {station.waitTime}
                      </span>
                    </div>
                  </div>

                  <div className="station-tags">
                    {station.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className={`tag tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="station-actions">
                    <button className="btn-navigate">
                      <span>🧭</span> Dẫn đường
                    </button>
                    <button className="btn-book">
                      <span>📅</span> Đặt chỗ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
