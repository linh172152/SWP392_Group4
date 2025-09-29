import { useState } from 'react';
import './UserComponents.css';

interface VehicleInfo {
  vin: string;
  batteryType: string;
  model: string;
  year: string;
}

interface ServiceRegistration {
  serviceType: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function AccountManagement() {
  const [activeSection, setActiveSection] = useState<'profile' | 'vehicle' | 'service'>('profile');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    vin: '',
    batteryType: '',
    model: '',
    year: ''
  });
  const [serviceRegistration, setServiceRegistration] = useState<ServiceRegistration>({
    serviceType: '',
    startDate: '',
    endDate: '',
    status: 'active'
  });

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thông tin phương tiện đã được cập nhật!');
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Đăng ký dịch vụ thành công!');
  };

  return (
    <div className="user-component">
      <div className="component-header">
        <h2 className="component-title">Quản lý tài khoản</h2>
        <p className="component-subtitle">Quản lý thông tin cá nhân, phương tiện và dịch vụ</p>
      </div>

      <div className="component-nav">
        <button 
          className={`nav-btn ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveSection('profile')}
        >
          Thông tin cá nhân
        </button>
        <button 
          className={`nav-btn ${activeSection === 'vehicle' ? 'active' : ''}`}
          onClick={() => setActiveSection('vehicle')}
        >
          Liên kết phương tiện
        </button>
        <button 
          className={`nav-btn ${activeSection === 'service' ? 'active' : ''}`}
          onClick={() => setActiveSection('service')}
        >
          Đăng ký dịch vụ
        </button>
      </div>

      <div className="component-content">
        {activeSection === 'profile' && (
          <div className="profile-section">
            <h3>Thông tin cá nhân</h3>
            <div className="profile-info">
              <div className="info-item">
                <label>Họ và tên:</label>
                <span>Nguyễn Văn A</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>user@ev.com</span>
              </div>
              <div className="info-item">
                <label>Số điện thoại:</label>
                <span>0123456789</span>
              </div>
              <div className="info-item">
                <label>Địa chỉ:</label>
                <span>123 Đường ABC, Quận 1, TP.HCM</span>
              </div>
            </div>
            <button className="edit-btn">Chỉnh sửa thông tin</button>
          </div>
        )}

        {activeSection === 'vehicle' && (
          <div className="vehicle-section">
            <h3>Liên kết phương tiện</h3>
            <form onSubmit={handleVehicleSubmit} className="vehicle-form">
              <div className="form-group">
                <label htmlFor="vin">VIN (Vehicle Identification Number)</label>
                <input
                  type="text"
                  id="vin"
                  value={vehicleInfo.vin}
                  onChange={(e) => setVehicleInfo({...vehicleInfo, vin: e.target.value})}
                  placeholder="Nhập VIN của xe"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="batteryType">Loại pin</label>
                <select
                  id="batteryType"
                  value={vehicleInfo.batteryType}
                  onChange={(e) => setVehicleInfo({...vehicleInfo, batteryType: e.target.value})}
                  required
                >
                  <option value="">Chọn loại pin</option>
                  <option value="lithium-ion">Lithium-ion</option>
                  <option value="lithium-polymer">Lithium-polymer</option>
                  <option value="solid-state">Solid-state</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="model">Mẫu xe</label>
                <input
                  type="text"
                  id="model"
                  value={vehicleInfo.model}
                  onChange={(e) => setVehicleInfo({...vehicleInfo, model: e.target.value})}
                  placeholder="VD: Tesla Model 3"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="year">Năm sản xuất</label>
                <input
                  type="number"
                  id="year"
                  value={vehicleInfo.year}
                  onChange={(e) => setVehicleInfo({...vehicleInfo, year: e.target.value})}
                  placeholder="2023"
                  min="2010"
                  max="2024"
                  required
                />
              </div>
              <button type="submit" className="submit-btn">Lưu thông tin phương tiện</button>
            </form>
          </div>
        )}

        {activeSection === 'service' && (
          <div className="service-section">
            <h3>Đăng ký dịch vụ đổi pin</h3>
            <form onSubmit={handleServiceSubmit} className="service-form">
              <div className="form-group">
                <label htmlFor="serviceType">Loại dịch vụ</label>
                <select
                  id="serviceType"
                  value={serviceRegistration.serviceType}
                  onChange={(e) => setServiceRegistration({...serviceRegistration, serviceType: e.target.value})}
                  required
                >
                  <option value="">Chọn loại dịch vụ</option>
                  <option value="basic">Gói cơ bản - 500,000 VNĐ/tháng</option>
                  <option value="premium">Gói cao cấp - 1,000,000 VNĐ/tháng</option>
                  <option value="enterprise">Gói doanh nghiệp - 2,000,000 VNĐ/tháng</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="startDate">Ngày bắt đầu</label>
                <input
                  type="date"
                  id="startDate"
                  value={serviceRegistration.startDate}
                  onChange={(e) => setServiceRegistration({...serviceRegistration, startDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">Ngày kết thúc</label>
                <input
                  type="date"
                  id="endDate"
                  value={serviceRegistration.endDate}
                  onChange={(e) => setServiceRegistration({...serviceRegistration, endDate: e.target.value})}
                  required
                />
              </div>
              <div className="service-benefits">
                <h4>Lợi ích của dịch vụ:</h4>
                <ul>
                  <li>✅ Đổi pin không giới hạn</li>
                  <li>✅ Hỗ trợ 24/7</li>
                  <li>✅ Bảo hành pin 12 tháng</li>
                  <li>✅ Ưu tiên đặt lịch</li>
                </ul>
              </div>
              <button type="submit" className="submit-btn">Đăng ký dịch vụ</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
