import React, { useState, useEffect } from 'react';
import './AdminComponents.css';

interface Station {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'maintenance' | 'offline';
  batteryCount: number;
  soh: number; // State of Health (0-100)
  lastMaintenance: string;
  complaints: number;
}

interface Battery {
  id: string;
  stationId: string;
  soh: number;
  status: 'available' | 'charging' | 'maintenance' | 'faulty';
  lastUsed: string;
}

const StationManagement: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showComplaints, setShowComplaints] = useState<boolean>(false);

  // Mock data - trong thực tế sẽ fetch từ API
  useEffect(() => {
    const mockStations: Station[] = [
      {
        id: '1',
        name: 'Trạm A - Quận 1',
        location: '123 Nguyễn Huệ, Q1, TP.HCM',
        status: 'active',
        batteryCount: 15,
        soh: 85,
        lastMaintenance: '2024-01-15',
        complaints: 2
      },
      {
        id: '2',
        name: 'Trạm B - Quận 3',
        location: '456 Lê Văn Sỹ, Q3, TP.HCM',
        status: 'maintenance',
        batteryCount: 12,
        soh: 78,
        lastMaintenance: '2024-01-10',
        complaints: 0
      },
      {
        id: '3',
        name: 'Trạm C - Quận 7',
        location: '789 Nguyễn Thị Thập, Q7, TP.HCM',
        status: 'active',
        batteryCount: 18,
        soh: 92,
        lastMaintenance: '2024-01-20',
        complaints: 1
      }
    ];

    const mockBatteries: Battery[] = [
      { id: 'b1', stationId: '1', soh: 85, status: 'available', lastUsed: '2024-01-25' },
      { id: 'b2', stationId: '1', soh: 78, status: 'charging', lastUsed: '2024-01-24' },
      { id: 'b3', stationId: '1', soh: 45, status: 'faulty', lastUsed: '2024-01-20' },
      { id: 'b4', stationId: '2', soh: 92, status: 'maintenance', lastUsed: '2024-01-22' },
      { id: 'b5', stationId: '3', soh: 88, status: 'available', lastUsed: '2024-01-25' }
    ];

    setStations(mockStations);
    setBatteries(mockBatteries);
  }, []);

  const handleBatteryTransfer = async (fromStation: string, toStation: string, batteryId: string) => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBatteries(prev => prev.map(battery => 
        battery.id === batteryId 
          ? { ...battery, stationId: toStation }
          : battery
      ));
      
      alert('Điều phối pin thành công!');
    } catch (err) {
      setError('Lỗi khi điều phối pin: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplaintResolution = async (stationId: string) => {
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStations(prev => prev.map(station => 
        station.id === stationId 
          ? { ...station, complaints: 0 }
          : station
      ));
      
      alert('Xử lý khiếu nại thành công!');
    } catch (err) {
      setError('Lỗi khi xử lý khiếu nại: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'maintenance': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSohColor = (soh: number) => {
    if (soh >= 80) return '#10b981';
    if (soh >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Quản lý Trạm</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowComplaints(!showComplaints)}
        >
          {showComplaints ? 'Ẩn' : 'Hiện'} Khiếu nại
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="stations-grid">
        {stations.map(station => (
          <div key={station.id} className="station-card">
            <div className="station-header">
              <h3>{station.name}</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(station.status) }}
              >
                {station.status === 'active' ? 'Hoạt động' : 
                 station.status === 'maintenance' ? 'Bảo trì' : 'Tạm dừng'}
              </span>
            </div>
            
            <div className="station-info">
              <p><strong>Địa chỉ:</strong> {station.location}</p>
              <p><strong>Số pin:</strong> {station.batteryCount}</p>
              <p><strong>SoH trung bình:</strong> 
                <span style={{ color: getSohColor(station.soh) }}>
                  {station.soh}%
                </span>
              </p>
              <p><strong>Bảo trì cuối:</strong> {station.lastMaintenance}</p>
              {station.complaints > 0 && (
                <p className="complaint-warning">
                  <strong>Khiếu nại:</strong> {station.complaints}
                </p>
              )}
            </div>

            <div className="station-actions">
              <button 
                className="btn-secondary"
                onClick={() => setSelectedStation(station.id)}
              >
                Xem chi tiết
              </button>
              {station.complaints > 0 && (
                <button 
                  className="btn-warning"
                  onClick={() => handleComplaintResolution(station.id)}
                  disabled={loading}
                >
                  Xử lý khiếu nại
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedStation && (
        <div className="battery-details">
          <h3>Chi tiết Pin - Trạm {stations.find(s => s.id === selectedStation)?.name}</h3>
          <div className="battery-grid">
            {batteries
              .filter(battery => battery.stationId === selectedStation)
              .map(battery => (
                <div key={battery.id} className="battery-card">
                  <div className="battery-info">
                    <p><strong>ID Pin:</strong> {battery.id}</p>
                    <p><strong>SoH:</strong> 
                      <span style={{ color: getSohColor(battery.soh) }}>
                        {battery.soh}%
                      </span>
                    </p>
                    <p><strong>Trạng thái:</strong> {
                      battery.status === 'available' ? 'Sẵn sàng' :
                      battery.status === 'charging' ? 'Đang sạc' :
                      battery.status === 'maintenance' ? 'Bảo trì' : 'Lỗi'
                    }</p>
                    <p><strong>Sử dụng cuối:</strong> {battery.lastUsed}</p>
                  </div>
                  
                  {battery.status === 'faulty' && (
                    <button 
                      className="btn-danger"
                      onClick={() => {
                        if (confirm('Xác nhận thay thế pin lỗi?')) {
                          // Handle battery replacement
                          alert('Pin đã được thay thế!');
                        }
                      }}
                    >
                      Thay thế pin lỗi
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {showComplaints && (
        <div className="complaints-section">
          <h3>Danh sách Khiếu nại</h3>
          {stations.filter(s => s.complaints > 0).length === 0 ? (
            <p>Không có khiếu nại nào.</p>
          ) : (
            <div className="complaints-list">
              {stations
                .filter(s => s.complaints > 0)
                .map(station => (
                  <div key={station.id} className="complaint-item">
                    <div className="complaint-info">
                      <h4>{station.name}</h4>
                      <p>Số khiếu nại: {station.complaints}</p>
                      <p>Địa chỉ: {station.location}</p>
                    </div>
                    <button 
                      className="btn-primary"
                      onClick={() => handleComplaintResolution(station.id)}
                      disabled={loading}
                    >
                      Xử lý
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StationManagement;

