import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [accountType, setAccountType] = useState('driver')

  const handleLogin = () => {
    setShowLoginModal(true)
  }

  const handleGetStarted = () => {
    setActiveTab('register')
    setShowLoginModal(true)
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const closeModal = () => {
    setShowLoginModal(false)
  }

  const handleDemoLogin = (demoType: string) => {
    if (demoType === 'driver') {
      setEmail('taixe@demo.com')
      setPassword('demo123')
    } else if (demoType === 'staff') {
      setEmail('nhanvien@demo.com')
      setPassword('demo123')
    } else if (demoType === 'admin') {
      setEmail('admin@demo.com')
      setPassword('demo123')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'login') {
      // Handle login logic here
      console.log('Login:', { email, password })
      // Navigate based on user type
      if (email.includes('admin')) {
        navigate('/admin')
      } else if (email.includes('nhanvien') || email.includes('staff')) {
        navigate('/staff')
      } else {
        navigate('/user')
      }
    } else {
      // Handle registration logic here
      console.log('Register:', { fullName, email, password, accountType })
      // Navigate based on account type
      if (accountType === 'admin') {
        navigate('/admin')
      } else if (accountType === 'staff') {
        navigate('/staff')
      } else {
        navigate('/user')
      }
    }
  }

  return (
    <div className={`homepage ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">EVSwap</span>
          </div>
          
          <nav className="nav">
            <a href="#features" className="nav-link">Tính năng</a>
            <a href="#how-it-works" className="nav-link">Cách hoạt động</a>
            <a href="#contact" className="nav-link">Liên hệ</a>
          </nav>
          
          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button className="btn-login" onClick={handleLogin}>Đăng nhập</button>
            <button className="btn-primary" onClick={handleGetStarted}>Bắt đầu</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>Công nghệ EV Cách mạng</span>
            </div>
            
            <h1 className="hero-title">
              Thay Pin Tức thì cho Xe Điện
            </h1>
            
            <p className="hero-description">
              Bỏ qua thời gian chờ. Thay pin trong vòng dưới 3 phút tại mạng lưới trạm tự động của chúng tôi. 
              Tiếp tục lái xe trong khi người khác vẫn đang sạc.
            </p>
            
            <div className="hero-buttons">
              <button className="btn-primary btn-large" onClick={handleGetStarted}>
                <span>⚡</span>
                Bắt đầu Thay Pin
              </button>
              <button className="btn-secondary btn-large">
                Tìm Trạm
              </button>
            </div>
          </div>
          
          <div className="hero-image">
            <div className="station-image">
              <div className="station-sign">
                <div className="station-icon">⛽</div>
                <div className="station-text">
                  <div>ELECTRIC</div>
                  <div>VEHICLE</div>
                  <div>CHARGING</div>
                  <div>STATION</div>
                </div>
                <div className="station-logo">ampUp</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="features-container">
          <h2 className="features-title">Tại sao chọn EVSwap?</h2>
          <p className="features-subtitle">
            Trải nghiệm tương lai của quản lý năng lượng xe điện với công nghệ thay pin tiên tiến.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon clock">🕒</div>
              <h3 className="feature-title">Thay Pin 3 Phút</h3>
              <p className="feature-description">
                Thay pin tự động trong vòng dưới 3 phút - nhanh hơn cả đổ xăng.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon location">📍</div>
              <h3 className="feature-title">Mạng lưới Toàn quốc</h3>
              <p className="feature-description">
                Hơn 500 trạm trên toàn quốc với khả năng hoạt động 24/7 và kiểm kê thời gian thực.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon battery">🔋</div>
              <h3 className="feature-title">Quản lý Pin Thông minh</h3>
              <p className="feature-description">
                Giám sát sức khỏe pin bằng AI và phân phối sạc tối ưu trên toàn mạng lưới.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon security">🛡️</div>
              <h3 className="feature-title">Bảo mật & An toàn</h3>
              <p className="feature-description">
                Giao thức bảo mật cấp quân đội và bảo hiểm toàn diện cho mọi lần thay pin.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon users">👥</div>
              <h3 className="feature-title">Đa dạng Người dùng</h3>
              <p className="feature-description">
                Giao diện chuyên dụng cho tài xế, nhân viên trạm và quản trị viên với tính năng theo vai trò.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon tracking">⚡</div>
              <h3 className="feature-title">Theo dõi Thời gian thực</h3>
              <p className="feature-description">
                Tính khả dụng trạm trực tiếp, trạng thái pin và phân tích dự đoán để lập kế hoạch tuyến đường tối ưu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="how-it-works-container">
          <h2 className="how-it-works-title">Cách thức hoạt động</h2>
          <p className="how-it-works-subtitle">
            Thay pin đơn giản, nhanh chóng và tự động trong ba bước dễ dàng.
          </p>
          
          <div className="steps">
            <div className="step">
              <div className="step-number step-1">1</div>
              <h3 className="step-title">Tìm & Đặt chỗ</h3>
              <p className="step-description">
                Sử dụng ứng dụng để tìm trạm gần nhất, kiểm tra tình trạng pin và đặt chỗ thay pin.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number step-2">2</div>
              <h3 className="step-title">Lái xe & Thay pin</h3>
              <p className="step-description">
                Lái xe đến trạm, đậu trong khu vực được chỉ định và để robot xử lý việc thay pin tự động.
              </p>
            </div>
            
            <div className="step">
              <div className="step-number step-3">3</div>
              <h3 className="step-title">Thanh toán & Đi</h3>
              <p className="step-description">
                Thanh toán tự động và nhận hóa đơn ngay lập tức. Lái xe với pin đầy trong vài phút.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-container">
          <h2 className="cta-title">Sẵn sàng trải nghiệm tương lai?</h2>
          <p className="cta-subtitle">
            Tham gia cùng hàng nghìn tài xế đã chuyển sang thay pin tức thì.
          </p>
          
          <div className="cta-buttons">
            <button className="btn-primary btn-large" onClick={handleGetStarted}>Đăng ký Tài xế</button>
            <button className="btn-outline btn-large">Trở thành Đối tác Trạm</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">EVSwap</span>
            </div>
            <p className="footer-tagline">
              Cách mạng hóa quản lý năng lượng xe điện với công nghệ thay pin tức thì.
            </p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4 className="footer-title">Sản phẩm</h4>
              <ul className="footer-list">
                <li><a href="#features">Tính năng</a></li>
                <li><a href="#pricing">Giá cả</a></li>
                <li><a href="#stations">Trạm</a></li>
                <li><a href="#support">Hỗ trợ</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-title">Công ty</h4>
              <ul className="footer-list">
                <li><a href="#about">Về chúng tôi</a></li>
                <li><a href="#careers">Tuyển dụng</a></li>
                <li><a href="#news">Tin tức</a></li>
                <li><a href="#contact">Liên hệ</a></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-title">Pháp lý</h4>
              <ul className="footer-list">
                <li><a href="#privacy">Quyền riêng tư</a></li>
                <li><a href="#terms">Điều khoản</a></li>
                <li><a href="#security">Bảo mật</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2024 EVSwap. Tất cả quyền được bảo lưu.</p>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="modal-icon">⚡</span>
                <div>
                  <h2>{activeTab === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h2>
                  <p>{activeTab === 'login' ? 'Đăng nhập vào tài khoản EVSwap của bạn' : 'Tạo tài khoản EVSwap mới'}</p>
                </div>
              </div>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-tabs">
              <button 
                className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Đăng nhập
              </button>
              <button 
                className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Đăng ký
              </button>
            </div>

            <div className="demo-accounts">
              <button 
                className="demo-btn" 
                onClick={() => handleDemoLogin('driver')}
              >
                Demo Tài xế
              </button>
              <button 
                className="demo-btn active" 
                onClick={() => handleDemoLogin('staff')}
              >
                Demo NV
              </button>
              <button 
                className="demo-btn" 
                onClick={() => handleDemoLogin('admin')}
              >
                Demo Admin
              </button>
            </div>

            <div className="modal-separator">
              <span>HOẶC TIẾP TỤC VỚI</span>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {activeTab === 'register' && (
                <div className="form-group">
                  <label htmlFor="fullName">Họ và tên</label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên của bạn"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'login' ? 'Nhập email của bạn' : 'email@example.com'}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={activeTab === 'login' ? 'Nhập mật khẩu của bạn' : 'Tạo mật khẩu'}
                  required
                />
              </div>

              {activeTab === 'register' && (
                <div className="form-group">
                  <label htmlFor="accountType">Loại tài khoản</label>
                  <select
                    id="accountType"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="form-select"
                    required
                  >
                    <option value="driver">Tài xế</option>
                    <option value="staff">Nhân viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              )}

              <button type="submit" className="login-submit-btn">
                {activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
