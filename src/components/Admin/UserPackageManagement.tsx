import React, { useState, useEffect } from 'react';
import './AdminComponents.css';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'suspended' | 'pending';
  joinDate: string;
  totalSwaps: number;
  lastActivity: string;
}

interface Package {
  id: string;
  name: string;
  price: number;
  duration: number; // days
  maxSwaps: number;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  stationId: string;
  permissions: string[];
  status: 'active' | 'inactive';
}

const UserPackageManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'packages' | 'staff'>('users');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showCreatePackage, setShowCreatePackage] = useState<boolean>(false);
  const [newPackage, setNewPackage] = useState<Partial<Package>>({
    name: '',
    price: 0,
    duration: 30,
    maxSwaps: 10,
    description: '',
    isActive: true
  });

  // Mock data
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'Nguyễn Văn A',
        email: 'nguyenvana@email.com',
        phone: '0123456789',
        status: 'active',
        joinDate: '2024-01-01',
        totalSwaps: 25,
        lastActivity: '2024-01-25'
      },
      {
        id: '2',
        name: 'Trần Thị B',
        email: 'tranthib@email.com',
        phone: '0987654321',
        status: 'active',
        joinDate: '2024-01-15',
        totalSwaps: 12,
        lastActivity: '2024-01-24'
      },
      {
        id: '3',
        name: 'Lê Văn C',
        email: 'levanc@email.com',
        phone: '0555666777',
        status: 'suspended',
        joinDate: '2024-01-10',
        totalSwaps: 5,
        lastActivity: '2024-01-20'
      }
    ];

    const mockPackages: Package[] = [
      {
        id: '1',
        name: 'Gói Cơ bản',
        price: 50000,
        duration: 30,
        maxSwaps: 10,
        description: 'Gói phù hợp cho người dùng thường xuyên',
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        name: 'Gói Premium',
        price: 100000,
        duration: 30,
        maxSwaps: 30,
        description: 'Gói cao cấp với nhiều lượt đổi pin',
        isActive: true,
        createdAt: '2024-01-01'
      },
      {
        id: '3',
        name: 'Gói VIP',
        price: 200000,
        duration: 30,
        maxSwaps: 100,
        description: 'Gói VIP không giới hạn',
        isActive: false,
        createdAt: '2024-01-01'
      }
    ];

    const mockStaff: Staff[] = [
      {
        id: '1',
        name: 'Nhân viên A',
        email: 'staffa@company.com',
        stationId: '1',
        permissions: ['swap_battery', 'maintenance'],
        status: 'active'
      },
      {
        id: '2',
        name: 'Nhân viên B',
        email: 'staffb@company.com',
        stationId: '2',
        permissions: ['swap_battery'],
        status: 'active'
      }
    ];

    setUsers(mockUsers);
    setPackages(mockPackages);
    setStaff(mockStaff);
  }, []);

  const handleUserStatusChange = async (userId: string, newStatus: string) => {
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus as 'active' | 'suspended' | 'pending' }
          : user
      ));
      
      alert('Cập nhật trạng thái người dùng thành công!');
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    if (!newPackage.name || !newPackage.price || !newPackage.description) {
      setError('Vui lòng điền đầy đủ thông tin gói thuê');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const packageId = (packages.length + 1).toString();
      const newPackageData: Package = {
        id: packageId,
        name: newPackage.name!,
        price: newPackage.price!,
        duration: newPackage.duration!,
        maxSwaps: newPackage.maxSwaps!,
        description: newPackage.description!,
        isActive: newPackage.isActive!,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      setPackages(prev => [...prev, newPackageData]);
      setNewPackage({
        name: '',
        price: 0,
        duration: 30,
        maxSwaps: 10,
        description: '',
        isActive: true
      });
      setShowCreatePackage(false);
      
      alert('Tạo gói thuê thành công!');
    } catch (err) {
      setError('Lỗi khi tạo gói thuê: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageToggle = async (packageId: string) => {
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPackages(prev => prev.map(pkg => 
        pkg.id === packageId 
          ? { ...pkg, isActive: !pkg.isActive }
          : pkg
      ));
      
      alert('Cập nhật trạng thái gói thuê thành công!');
    } catch (err) {
      setError('Lỗi khi cập nhật gói thuê: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffPermissionUpdate = async (staffId: string, permission: string) => {
    setLoading(true);
    setError('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStaff(prev => prev.map(s => {
        if (s.id === staffId) {
          const newPermissions = s.permissions.includes(permission)
            ? s.permissions.filter(p => p !== permission)
            : [...s.permissions, permission];
          return { ...s, permissions: newPermissions };
        }
        return s;
      }));
      
      alert('Cập nhật quyền nhân viên thành công!');
    } catch (err) {
      setError('Lỗi khi cập nhật quyền: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#ef4444';
      case 'pending': return '#f59e0b';
      case 'inactive': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Quản lý Người dùng & Gói thuê</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Khách hàng
          </button>
          <button 
            className={`tab-btn ${activeTab === 'packages' ? 'active' : ''}`}
            onClick={() => setActiveTab('packages')}
          >
            Gói thuê
          </button>
          <button 
            className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            Nhân viên
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-section">
          <div className="section-actions">
            <button 
              className="btn-primary"
              onClick={() => {/* Handle export users */}}
            >
              Xuất danh sách
            </button>
          </div>
          
          <div className="users-grid">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-header">
                  <h3>{user.name}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(user.status) }}
                  >
                    {user.status === 'active' ? 'Hoạt động' : 
                     user.status === 'suspended' ? 'Tạm khóa' : 'Chờ duyệt'}
                  </span>
                </div>
                
                <div className="user-info">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>SĐT:</strong> {user.phone}</p>
                  <p><strong>Ngày tham gia:</strong> {user.joinDate}</p>
                  <p><strong>Tổng lượt đổi:</strong> {user.totalSwaps}</p>
                  <p><strong>Hoạt động cuối:</strong> {user.lastActivity}</p>
                </div>

                <div className="user-actions">
                  {user.status === 'active' && (
                    <button 
                      className="btn-warning"
                      onClick={() => handleUserStatusChange(user.id, 'suspended')}
                      disabled={loading}
                    >
                      Tạm khóa
                    </button>
                  )}
                  {user.status === 'suspended' && (
                    <button 
                      className="btn-success"
                      onClick={() => handleUserStatusChange(user.id, 'active')}
                      disabled={loading}
                    >
                      Kích hoạt
                    </button>
                  )}
                  <button className="btn-secondary">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="packages-section">
          <div className="section-actions">
            <button 
              className="btn-primary"
              onClick={() => setShowCreatePackage(true)}
            >
              Tạo gói mới
            </button>
          </div>

          {showCreatePackage && (
            <div className="create-package-form">
              <h3>Tạo gói thuê mới</h3>
              <div className="form-group">
                <label>Tên gói:</label>
                <input 
                  type="text" 
                  value={newPackage.name || ''}
                  onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Giá (VNĐ):</label>
                <input 
                  type="number" 
                  value={newPackage.price || 0}
                  onChange={(e) => setNewPackage({...newPackage, price: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Thời hạn (ngày):</label>
                <input 
                  type="number" 
                  value={newPackage.duration || 30}
                  onChange={(e) => setNewPackage({...newPackage, duration: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Số lượt đổi tối đa:</label>
                <input 
                  type="number" 
                  value={newPackage.maxSwaps || 10}
                  onChange={(e) => setNewPackage({...newPackage, maxSwaps: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Mô tả:</label>
                <textarea 
                  value={newPackage.description || ''}
                  onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                />
              </div>
              <div className="form-actions">
                <button 
                  className="btn-primary"
                  onClick={handleCreatePackage}
                  disabled={loading}
                >
                  Tạo gói
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowCreatePackage(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
          
          <div className="packages-grid">
            {packages.map(pkg => (
              <div key={pkg.id} className="package-card">
                <div className="package-header">
                  <h3>{pkg.name}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: pkg.isActive ? '#10b981' : '#6b7280' }}
                  >
                    {pkg.isActive ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
                
                <div className="package-info">
                  <p><strong>Giá:</strong> {pkg.price.toLocaleString()} VNĐ</p>
                  <p><strong>Thời hạn:</strong> {pkg.duration} ngày</p>
                  <p><strong>Lượt đổi tối đa:</strong> {pkg.maxSwaps}</p>
                  <p><strong>Mô tả:</strong> {pkg.description}</p>
                  <p><strong>Ngày tạo:</strong> {pkg.createdAt}</p>
                </div>

                <div className="package-actions">
                  <button 
                    className={pkg.isActive ? 'btn-warning' : 'btn-success'}
                    onClick={() => handlePackageToggle(pkg.id)}
                    disabled={loading}
                  >
                    {pkg.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                  </button>
                  <button className="btn-secondary">
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="staff-section">
          <div className="section-actions">
            <button className="btn-primary">
              Thêm nhân viên
            </button>
          </div>
          
          <div className="staff-grid">
            {staff.map(s => (
              <div key={s.id} className="staff-card">
                <div className="staff-header">
                  <h3>{s.name}</h3>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(s.status) }}
                  >
                    {s.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
                
                <div className="staff-info">
                  <p><strong>Email:</strong> {s.email}</p>
                  <p><strong>Trạm:</strong> Trạm {s.stationId}</p>
                  <p><strong>Quyền:</strong></p>
                  <div className="permissions-list">
                    {['swap_battery', 'maintenance', 'customer_service'].map(permission => (
                      <label key={permission} className="permission-item">
                        <input 
                          type="checkbox"
                          checked={s.permissions.includes(permission)}
                          onChange={() => handleStaffPermissionUpdate(s.id, permission)}
                          disabled={loading}
                        />
                        {permission === 'swap_battery' ? 'Đổi pin' :
                         permission === 'maintenance' ? 'Bảo trì' : 'Dịch vụ khách hàng'}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="staff-actions">
                  <button className="btn-secondary">
                    Chỉnh sửa
                  </button>
                  <button className="btn-danger">
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPackageManagement;

