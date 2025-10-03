import React, { useState, useEffect } from 'react';
import './StaffComponents.css';

interface Battery {
  id: string;
  model: string;
  capacity: number; // kWh
  status: 'full' | 'charging' | 'maintenance' | 'low';
  soh: number; // State of Health (0-100)
  lastUsed: string;
  location: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

interface InventoryStats {
  total: number;
  full: number;
  charging: number;
  maintenance: number;
  low: number;
}

const BatteryInventory: React.FC = () => {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    total: 0,
    full: 0,
    charging: 0,
    maintenance: 0,
    low: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Mock data
  useEffect(() => {
    const mockBatteries: Battery[] = [
      {
        id: 'BAT001',
        model: 'Tesla Model 3',
        capacity: 75,
        status: 'full',
        soh: 95,
        lastUsed: '2024-01-25',
        location: 'Khu A - Tầng 1',
        condition: 'excellent'
      },
      {
        id: 'BAT002',
        model: 'Tesla Model 3',
        capacity: 75,
        status: 'charging',
        soh: 78,
        lastUsed: '2024-01-24',
        location: 'Khu A - Tầng 1',
        condition: 'good'
      },
      {
        id: 'BAT003',
        model: 'BYD Atto 3',
        capacity: 60,
        status: 'maintenance',
        soh: 45,
        lastUsed: '2024-01-20',
        location: 'Khu B - Tầng 2',
        condition: 'poor'
      },
      {
        id: 'BAT004',
        model: 'VinFast VF8',
        capacity: 89,
        status: 'full',
        soh: 88,
        lastUsed: '2024-01-25',
        location: 'Khu A - Tầng 1',
        condition: 'good'
      },
      {
        id: 'BAT005',
        model: 'Tesla Model 3',
        capacity: 75,
        status: 'low',
        soh: 25,
        lastUsed: '2024-01-22',
        location: 'Khu C - Tầng 1',
        condition: 'fair'
      },
      {
        id: 'BAT006',
        model: 'BYD Atto 3',
        capacity: 60,
        status: 'charging',
        soh: 65,
        lastUsed: '2024-01-23',
        location: 'Khu B - Tầng 2',
        condition: 'good'
      }
    ];

    setBatteries(mockBatteries);
    
    // Calculate stats
    const newStats: InventoryStats = {
      total: mockBatteries.length,
      full: mockBatteries.filter(b => b.status === 'full').length,
      charging: mockBatteries.filter(b => b.status === 'charging').length,
      maintenance: mockBatteries.filter(b => b.status === 'maintenance').length,
      low: mockBatteries.filter(b => b.status === 'low').length
    };
    setStats(newStats);
  }, []);

  const handleBatteryStatusUpdate = async (batteryId: string, newStatus: string) => {
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBatteries(prev => prev.map(battery => 
        battery.id === batteryId 
          ? { ...battery, status: newStatus as 'full' | 'charging' | 'maintenance' | 'low' }
          : battery
      ));
      
      // Recalculate stats
      const updatedBatteries = batteries.map(battery => 
        battery.id === batteryId 
          ? { ...battery, status: newStatus as 'full' | 'charging' | 'maintenance' | 'low' }
          : battery
      );
      
      const newStats: InventoryStats = {
        total: updatedBatteries.length,
        full: updatedBatteries.filter(b => b.status === 'full').length,
        charging: updatedBatteries.filter(b => b.status === 'charging').length,
        maintenance: updatedBatteries.filter(b => b.status === 'maintenance').length,
        low: updatedBatteries.filter(b => b.status === 'low').length
      };
      setStats(newStats);
      
      alert('Cập nhật trạng thái pin thành công!');
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái pin: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full': return '#10b981';
      case 'charging': return '#f59e0b';
      case 'maintenance': return '#ef4444';
      case 'low': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'full': return 'Đầy';
      case 'charging': return 'Đang sạc';
      case 'maintenance': return 'Bảo dưỡng';
      case 'low': return 'Yếu';
      default: return 'Không xác định';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'Xuất sắc';
      case 'good': return 'Tốt';
      case 'fair': return 'Khá';
      case 'poor': return 'Kém';
      default: return 'Không xác định';
    }
  };

  const filteredBatteries = batteries.filter(battery => {
    const statusMatch = filterStatus === 'all' || battery.status === filterStatus;
    const modelMatch = filterModel === 'all' || battery.model === filterModel;
    return statusMatch && modelMatch;
  });

  const uniqueModels = [...new Set(batteries.map(b => b.model))];

  return (
    <div className="staff-section">
      <div className="section-header">
        <h2>Quản lý Tồn kho Pin</h2>
        <div className="filter-controls">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="full">Đầy</option>
            <option value="charging">Đang sạc</option>
            <option value="maintenance">Bảo dưỡng</option>
            <option value="low">Yếu</option>
          </select>
          
          <select 
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả model</option>
            {uniqueModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔋</div>
          <div className="stat-content">
            <h3>Tổng số pin</h3>
            <p>{stats.total} pin</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Pin đầy</h3>
            <p>{stats.full} pin</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Đang sạc</h3>
            <p>{stats.charging} pin</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-content">
            <h3>Bảo dưỡng</h3>
            <p>{stats.maintenance} pin</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Pin yếu</h3>
            <p>{stats.low} pin</p>
          </div>
        </div>
      </div>

      {/* Battery List */}
      <div className="battery-list">
        <h3>Danh sách Pin ({filteredBatteries.length})</h3>
        
        <div className="battery-grid">
          {filteredBatteries.map(battery => (
            <div key={battery.id} className="battery-card">
              <div className="battery-header">
                <h4>{battery.id}</h4>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(battery.status) }}
                >
                  {getStatusText(battery.status)}
                </span>
              </div>
              
              <div className="battery-info">
                <div className="info-row">
                  <span className="label">Model:</span>
                  <span className="value">{battery.model}</span>
                </div>
                <div className="info-row">
                  <span className="label">Dung lượng:</span>
                  <span className="value">{battery.capacity} kWh</span>
                </div>
                <div className="info-row">
                  <span className="label">SoH:</span>
                  <span 
                    className="value"
                    style={{ color: battery.soh >= 80 ? '#10b981' : battery.soh >= 60 ? '#f59e0b' : '#ef4444' }}
                  >
                    {battery.soh}%
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Tình trạng:</span>
                  <span 
                    className="value"
                    style={{ color: getConditionColor(battery.condition) }}
                  >
                    {getConditionText(battery.condition)}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Vị trí:</span>
                  <span className="value">{battery.location}</span>
                </div>
                <div className="info-row">
                  <span className="label">Sử dụng cuối:</span>
                  <span className="value">{battery.lastUsed}</span>
                </div>
              </div>

              <div className="battery-actions">
                {battery.status !== 'full' && (
                  <button 
                    className="btn-success"
                    onClick={() => handleBatteryStatusUpdate(battery.id, 'full')}
                    disabled={loading}
                  >
                    Đánh dấu đầy
                  </button>
                )}
                {battery.status !== 'charging' && (
                  <button 
                    className="btn-warning"
                    onClick={() => handleBatteryStatusUpdate(battery.id, 'charging')}
                    disabled={loading}
                  >
                    Bắt đầu sạc
                  </button>
                )}
                {battery.status !== 'maintenance' && (
                  <button 
                    className="btn-danger"
                    onClick={() => handleBatteryStatusUpdate(battery.id, 'maintenance')}
                    disabled={loading}
                  >
                    Bảo dưỡng
                  </button>
                )}
                <button className="btn-secondary">
                  Chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredBatteries.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔋</div>
          <h3>Không tìm thấy pin</h3>
          <p>Thử thay đổi bộ lọc để xem kết quả khác</p>
        </div>
      )}
    </div>
  );
};

export default BatteryInventory;

