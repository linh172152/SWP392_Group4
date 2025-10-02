import React, { useState, useEffect } from 'react';
import './AdminComponents.css';

interface RevenueData {
  date: string;
  revenue: number;
  swaps: number;
}

interface PeakHourData {
  hour: string;
  swaps: number;
  percentage: number;
}

interface StationPerformance {
  stationId: string;
  stationName: string;
  totalSwaps: number;
  revenue: number;
  efficiency: number;
}

interface SwapFrequency {
  period: string;
  swaps: number;
  trend: 'up' | 'down' | 'stable';
}

const ReportsAnalytics: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [peakHourData, setPeakHourData] = useState<PeakHourData[]>([]);
  const [stationPerformance, setStationPerformance] = useState<StationPerformance[]>([]);
  const [swapFrequency, setSwapFrequency] = useState<SwapFrequency[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Mock data
  useEffect(() => {
    const mockRevenueData: RevenueData[] = [
      { date: '2024-01-20', revenue: 2500000, swaps: 125 },
      { date: '2024-01-21', revenue: 3200000, swaps: 160 },
      { date: '2024-01-22', revenue: 2800000, swaps: 140 },
      { date: '2024-01-23', revenue: 3500000, swaps: 175 },
      { date: '2024-01-24', revenue: 4000000, swaps: 200 },
      { date: '2024-01-25', revenue: 3800000, swaps: 190 },
      { date: '2024-01-26', revenue: 4200000, swaps: 210 }
    ];

    const mockPeakHourData: PeakHourData[] = [
      { hour: '07:00-08:00', swaps: 45, percentage: 15.2 },
      { hour: '08:00-09:00', swaps: 78, percentage: 26.4 },
      { hour: '12:00-13:00', swaps: 65, percentage: 22.0 },
      { hour: '17:00-18:00', swaps: 82, percentage: 27.7 },
      { hour: '18:00-19:00', swaps: 58, percentage: 19.6 }
    ];

    const mockStationPerformance: StationPerformance[] = [
      {
        stationId: '1',
        stationName: 'Trạm A - Quận 1',
        totalSwaps: 450,
        revenue: 9000000,
        efficiency: 95
      },
      {
        stationId: '2',
        stationName: 'Trạm B - Quận 3',
        totalSwaps: 320,
        revenue: 6400000,
        efficiency: 88
      },
      {
        stationId: '3',
        stationName: 'Trạm C - Quận 7',
        totalSwaps: 280,
        revenue: 5600000,
        efficiency: 92
      }
    ];

    const mockSwapFrequency: SwapFrequency[] = [
      { period: 'Tháng 1/2024', swaps: 1250, trend: 'up' },
      { period: 'Tháng 12/2023', swaps: 1180, trend: 'up' },
      { period: 'Tháng 11/2023', swaps: 1120, trend: 'stable' },
      { period: 'Tháng 10/2023', swaps: 1090, trend: 'down' }
    ];

    setRevenueData(mockRevenueData);
    setPeakHourData(mockPeakHourData);
    setStationPerformance(mockStationPerformance);
    setSwapFrequency(mockSwapFrequency);
  }, []);

  const handleExportReport = async (reportType: string) => {
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Xuất báo cáo ${reportType} thành công!`);
    } catch (err) {
      setError('Lỗi khi xuất báo cáo: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const calculateTotalRevenue = () => {
    return revenueData.reduce((sum, data) => sum + data.revenue, 0);
  };

  const calculateTotalSwaps = () => {
    return revenueData.reduce((sum, data) => sum + data.swaps, 0);
  };

  const calculateAverageRevenue = () => {
    return revenueData.length > 0 ? calculateTotalRevenue() / revenueData.length : 0;
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Báo cáo & Thống kê</h2>
        <div className="period-selector">
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7days' | '30days' | '90days')}
          >
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="90days">90 ngày qua</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Tổng quan */}
      <div className="overview-cards">
        <div className="overview-card">
          <h3>Tổng doanh thu</h3>
          <div className="metric-value">
            {calculateTotalRevenue().toLocaleString()} VNĐ
          </div>
          <div className="metric-subtitle">
            Trung bình: {calculateAverageRevenue().toLocaleString()} VNĐ/ngày
          </div>
        </div>
        
        <div className="overview-card">
          <h3>Tổng lượt đổi pin</h3>
          <div className="metric-value">
            {calculateTotalSwaps().toLocaleString()}
          </div>
          <div className="metric-subtitle">
            Trung bình: {Math.round(calculateTotalSwaps() / revenueData.length)} lượt/ngày
          </div>
        </div>
        
        <div className="overview-card">
          <h3>Hiệu suất trung bình</h3>
          <div className="metric-value">
            {Math.round(stationPerformance.reduce((sum, s) => sum + s.efficiency, 0) / stationPerformance.length)}%
          </div>
          <div className="metric-subtitle">
            Từ {stationPerformance.length} trạm
          </div>
        </div>
      </div>

      {/* Biểu đồ doanh thu */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>Biểu đồ Doanh thu & Lượt đổi pin</h3>
          <button 
            className="btn-secondary"
            onClick={() => handleExportReport('doanh thu')}
            disabled={loading}
          >
            Xuất báo cáo
          </button>
        </div>
        
        <div className="chart-container">
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#3b82f6' }}></div>
              <span>Doanh thu (VNĐ)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#10b981' }}></div>
              <span>Lượt đổi pin</span>
            </div>
          </div>
          
          <div className="chart-data">
            {revenueData.map((data, index) => (
              <div key={index} className="chart-bar">
                <div className="bar-container">
                  <div 
                    className="bar revenue-bar"
                    style={{ height: `${(data.revenue / 5000000) * 100}%` }}
                    title={`Doanh thu: ${data.revenue.toLocaleString()} VNĐ`}
                  ></div>
                  <div 
                    className="bar swaps-bar"
                    style={{ height: `${(data.swaps / 250) * 100}%` }}
                    title={`Lượt đổi: ${data.swaps}`}
                  ></div>
                </div>
                <div className="bar-label">{data.date.split('-')[2]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Giờ cao điểm */}
      <div className="peak-hours-section">
        <div className="section-header">
          <h3>Phân tích Giờ cao điểm</h3>
          <button 
            className="btn-secondary"
            onClick={() => handleExportReport('giờ cao điểm')}
            disabled={loading}
          >
            Xuất báo cáo
          </button>
        </div>
        
        <div className="peak-hours-grid">
          {peakHourData.map((data, index) => (
            <div key={index} className="peak-hour-card">
              <div className="peak-hour-info">
                <h4>{data.hour}</h4>
                <div className="peak-metrics">
                  <div className="metric">
                    <span className="metric-label">Lượt đổi:</span>
                    <span className="metric-value">{data.swaps}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Tỷ lệ:</span>
                    <span className="metric-value">{data.percentage}%</span>
                  </div>
                </div>
              </div>
              <div 
                className="peak-bar"
                style={{ width: `${data.percentage}%` }}
              ></div>
            </div>
          ))}
        </div>
      </div>

      {/* Hiệu suất trạm */}
      <div className="station-performance-section">
        <div className="section-header">
          <h3>Hiệu suất Trạm</h3>
          <button 
            className="btn-secondary"
            onClick={() => handleExportReport('hiệu suất trạm')}
            disabled={loading}
          >
            Xuất báo cáo
          </button>
        </div>
        
        <div className="performance-table">
          <div className="table-header">
            <div className="col">Trạm</div>
            <div className="col">Lượt đổi</div>
            <div className="col">Doanh thu</div>
            <div className="col">Hiệu suất</div>
          </div>
          
          {stationPerformance.map(station => (
            <div key={station.stationId} className="table-row">
              <div className="col">{station.stationName}</div>
              <div className="col">{station.totalSwaps.toLocaleString()}</div>
              <div className="col">{station.revenue.toLocaleString()} VNĐ</div>
              <div className="col">
                <span 
                  className="efficiency-badge"
                  style={{ 
                    backgroundColor: station.efficiency >= 90 ? '#10b981' : 
                                   station.efficiency >= 80 ? '#f59e0b' : '#ef4444'
                  }}
                >
                  {station.efficiency}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tần suất đổi pin */}
      <div className="swap-frequency-section">
        <div className="section-header">
          <h3>Tần suất Đổi pin theo Tháng</h3>
          <button 
            className="btn-secondary"
            onClick={() => handleExportReport('tần suất đổi pin')}
            disabled={loading}
          >
            Xuất báo cáo
          </button>
        </div>
        
        <div className="frequency-list">
          {swapFrequency.map((data, index) => (
            <div key={index} className="frequency-item">
              <div className="frequency-info">
                <h4>{data.period}</h4>
                <div className="frequency-metrics">
                  <span className="swaps-count">{data.swaps.toLocaleString()} lượt</span>
                  <span 
                    className="trend-indicator"
                    style={{ color: getTrendColor(data.trend) }}
                  >
                    {getTrendIcon(data.trend)} {data.trend === 'up' ? 'Tăng' : 
                                               data.trend === 'down' ? 'Giảm' : 'Ổn định'}
                  </span>
                </div>
              </div>
              <div 
                className="frequency-bar"
                style={{ width: `${(data.swaps / 1300) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
      </div>

      {/* Xuất báo cáo tổng hợp */}
      <div className="export-section">
        <h3>Xuất Báo cáo Tổng hợp</h3>
        <div className="export-buttons">
          <button 
            className="btn-primary"
            onClick={() => handleExportReport('tổng hợp')}
            disabled={loading}
          >
            Xuất PDF
          </button>
          <button 
            className="btn-secondary"
            onClick={() => handleExportReport('Excel')}
            disabled={loading}
          >
            Xuất Excel
          </button>
          <button 
            className="btn-secondary"
            onClick={() => handleExportReport('CSV')}
            disabled={loading}
          >
            Xuất CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;

