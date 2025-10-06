import { useState } from 'react';
import './UserComponents.css';

interface Station {
  id: string;
  name: string;
  address: string;
  distance: number;
  availableBatteries: number;
  totalBatteries: number;
  status: 'available' | 'busy' | 'maintenance';
  rating: number;
}

interface Booking {
  stationId: string;
  date: string;
  time: string;
  batteryType: string;
  notes: string;
}

export default function StationBooking() {
  const [activeSection, setActiveSection] = useState<'search' | 'booking' | 'history'>('search');
  const [searchLocation, setSearchLocation] = useState('');
  const [booking, setBooking] = useState<Booking>({
    stationId: '',
    date: '',
    time: '',
    batteryType: '',
    notes: ''
  });

  // Mock data for stations
  const stations: Station[] = [
    {
      id: '1',
      name: 'Trạm đổi pin Quận 1',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      distance: 2.5,
      availableBatteries: 8,
      totalBatteries: 12,
      status: 'available',
      rating: 4.8
    },
    {
      id: '2',
      name: 'Trạm đổi pin Quận 2',
      address: '456 Thủ Thiêm, Quận 2, TP.HCM',
      distance: 5.2,
      availableBatteries: 3,
      totalBatteries: 10,
      status: 'available',
      rating: 4.5
    },
    {
      id: '3',
      name: 'Trạm đổi pin Quận 3',
      address: '789 Lê Văn Sỹ, Quận 3, TP.HCM',
      distance: 3.8,
      availableBatteries: 0,
      totalBatteries: 8,
      status: 'busy',
      rating: 4.2
    }
  ];

  const handleSearch = () => {
    // Mock search functionality
    console.log('Searching for stations near:', searchLocation);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Đặt lịch thành công! Bạn sẽ nhận được thông báo xác nhận.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981';
      case 'busy': return '#F59E0B';
      case 'maintenance': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Có sẵn';
      case 'busy': return 'Đông khách';
      case 'maintenance': return 'Bảo trì';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="user-component">
      <div className="component-header">
        <h2 className="component-title">Đặt lịch & Trạm đổi pin</h2>
        <p className="component-subtitle">Tìm kiếm trạm gần nhất và đặt lịch đổi pin</p>
      </div>

      <div className="component-nav">
        <button 
          className={`nav-btn ${activeSection === 'search' ? 'active' : ''}`}
          onClick={() => setActiveSection('search')}
        >
          Tìm kiếm trạm
        </button>
        <button 
          className={`nav-btn ${activeSection === 'booking' ? 'active' : ''}`}
          onClick={() => setActiveSection('booking')}
        >
          Đặt lịch
        </button>
        <button 
          className={`nav-btn ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          Lịch sử
        </button>
      </div>

      <div className="component-content">
        {activeSection === 'search' && (
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Nhập địa chỉ hoặc tên trạm..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="search-input"
              />
              <button onClick={handleSearch} className="search-btn">Tìm kiếm</button>
            </div>

            <div className="stations-list">
              <h3>Trạm đổi pin gần bạn</h3>
              {stations.map((station) => (
                <div key={station.id} className="station-card">
                  <div className="station-header">
                    <h4>{station.name}</h4>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(station.status) }}
                    >
                      {getStatusText(station.status)}
                    </span>
                  </div>
                  <p className="station-address">{station.address}</p>
                  <div className="station-info">
                    <div className="info-item">
                      <span className="info-label">Khoảng cách:</span>
                      <span>{station.distance} km</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Pin có sẵn:</span>
                      <span>{station.availableBatteries}/{station.totalBatteries}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Đánh giá:</span>
                      <span>⭐ {station.rating}/5</span>
                    </div>
                  </div>
                  <button className="book-btn">Đặt lịch tại đây</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'booking' && (
          <div className="booking-section">
            <h3>Đặt lịch đổi pin</h3>
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="station">Chọn trạm</label>
                <select
                  id="station"
                  value={booking.stationId}
                  onChange={(e) => setBooking({...booking, stationId: e.target.value})}
                  required
                >
                  <option value="">Chọn trạm đổi pin</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} - {station.address}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="date">Ngày đổi pin</label>
                <input
                  type="date"
                  id="date"
                  value={booking.date}
                  onChange={(e) => setBooking({...booking, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="time">Giờ đổi pin</label>
                <input
                  type="time"
                  id="time"
                  value={booking.time}
                  onChange={(e) => setBooking({...booking, time: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="batteryType">Loại pin cần đổi</label>
                <select
                  id="batteryType"
                  value={booking.batteryType}
                  onChange={(e) => setBooking({...booking, batteryType: e.target.value})}
                  required
                >
                  <option value="">Chọn loại pin</option>
                  <option value="lithium-ion">Lithium-ion</option>
                  <option value="lithium-polymer">Lithium-polymer</option>
                  <option value="solid-state">Solid-state</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="notes">Ghi chú thêm</label>
                <textarea
                  id="notes"
                  value={booking.notes}
                  onChange={(e) => setBooking({...booking, notes: e.target.value})}
                  placeholder="Nhập ghi chú nếu có..."
                  rows={3}
                />
              </div>
              <button type="submit" className="submit-btn">Đặt lịch</button>
            </form>
          </div>
        )}

        {activeSection === 'history' && (
          <div className="history-section">
            <h3>Lịch sử đổi pin</h3>
            <div className="history-list">
              <div className="history-item">
                <div className="history-header">
                  <span className="history-date">15/12/2024 - 14:30</span>
                  <span className="history-status completed">Hoàn thành</span>
                </div>
                <p className="history-location">Trạm đổi pin Quận 1</p>
                <p className="history-details">Pin: Lithium-ion | Thời gian: 3 phút | Chi phí: 150,000 VNĐ</p>
              </div>
              <div className="history-item">
                <div className="history-header">
                  <span className="history-date">12/12/2024 - 09:15</span>
                  <span className="history-status completed">Hoàn thành</span>
                </div>
                <p className="history-location">Trạm đổi pin Quận 2</p>
                <p className="history-details">Pin: Lithium-ion | Thời gian: 4 phút | Chi phí: 150,000 VNĐ</p>
              </div>
              <div className="history-item">
                <div className="history-header">
                  <span className="history-date">10/12/2024 - 16:45</span>
                  <span className="history-status cancelled">Đã hủy</span>
                </div>
                <p className="history-location">Trạm đổi pin Quận 3</p>
                <p className="history-details">Lý do hủy: Trạm bảo trì</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
