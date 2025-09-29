import React, { useState } from 'react';
import './PackageRegistration.css';

interface PackageFormData {
  customerName: string;
  email: string;
  phone: string;
  packageType: string;
  duration: string;
  startDate: string;
  notes: string;
}

interface PackageOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

const packageOptions: PackageOption[] = [
  {
    id: 'basic',
    name: 'Gói Cơ Bản',
    price: 500000,
    description: 'Gói dịch vụ cơ bản phù hợp cho cá nhân',
    features: ['Hỗ trợ 24/7', 'Báo cáo hàng tháng', 'Tư vấn cơ bản']
  },
  {
    id: 'premium',
    name: 'Gói Cao Cấp',
    price: 1000000,
    description: 'Gói dịch vụ cao cấp cho doanh nghiệp vừa',
    features: ['Hỗ trợ 24/7', 'Báo cáo hàng tuần', 'Tư vấn chuyên sâu', 'API tích hợp']
  },
  {
    id: 'enterprise',
    name: 'Gói Doanh Nghiệp',
    price: 2000000,
    description: 'Gói dịch vụ toàn diện cho doanh nghiệp lớn',
    features: ['Hỗ trợ 24/7', 'Báo cáo hàng ngày', 'Tư vấn chuyên sâu', 'API tích hợp', 'Hỗ trợ tùy chỉnh']
  }
];

export default function PackageRegistration() {
  const [formData, setFormData] = useState<PackageFormData>({
    customerName: '',
    email: '',
    phone: '',
    packageType: '',
    duration: '6',
    startDate: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Partial<PackageFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof PackageFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handlePackageSelect = (packageId: string) => {
    const selected = packageOptions.find(pkg => pkg.id === packageId);
    setSelectedPackage(selected || null);
    setFormData(prev => ({
      ...prev,
      packageType: packageId
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PackageFormData> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Tên khách hàng là bắt buộc';
    }

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.packageType) {
      newErrors.packageType = 'Vui lòng chọn gói dịch vụ';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock registration success
      alert('Đăng ký gói dịch vụ thành công! Chúng tôi sẽ liên hệ với bạn trong vòng 24h.');
      
      // Reset form
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        packageType: '',
        duration: '6',
        startDate: '',
        notes: ''
      });
      setSelectedPackage(null);
      
    } catch (error) {
      setErrors({ email: 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="package-registration">
      <div className="form-header">
        <h2 className="form-title">Đăng ký gói dịch vụ</h2>
        <p className="form-subtitle">Chọn gói dịch vụ phù hợp với nhu cầu của bạn</p>
      </div>

      <form onSubmit={handleSubmit} className="package-form">
        {/* Package Selection */}
        <div className="package-selection">
          <h3 className="section-title">Chọn gói dịch vụ</h3>
          <div className="package-options">
            {packageOptions.map((pkg) => (
              <div
                key={pkg.id}
                className={`package-option ${formData.packageType === pkg.id ? 'selected' : ''}`}
                onClick={() => handlePackageSelect(pkg.id)}
              >
                <div className="package-header">
                  <h4 className="package-name">{pkg.name}</h4>
                  <div className="package-price">{formatPrice(pkg.price)}/tháng</div>
                </div>
                <p className="package-description">{pkg.description}</p>
                <ul className="package-features">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {errors.packageType && (
            <span className="error-message">{errors.packageType}</span>
          )}
        </div>

        {/* Customer Information */}
        <div className="customer-info">
          <h3 className="section-title">Thông tin khách hàng</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerName" className="form-label">
                Tên khách hàng
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className={`form-input ${errors.customerName ? 'error' : ''}`}
                placeholder="Nhập tên khách hàng"
                disabled={isLoading}
              />
              {errors.customerName && (
                <span className="error-message">{errors.customerName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Số điện thoại
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="Nhập số điện thoại"
                disabled={isLoading}
              />
              {errors.phone && (
                <span className="error-message">{errors.phone}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Nhập email"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={`form-input ${errors.startDate ? 'error' : ''}`}
                disabled={isLoading}
              />
              {errors.startDate && (
                <span className="error-message">{errors.startDate}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="duration" className="form-label">
                Thời hạn (tháng)
              </label>
              <select
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                className="form-select"
                disabled={isLoading}
              >
                <option value="3">3 tháng</option>
                <option value="6">6 tháng</option>
                <option value="12">12 tháng</option>
                <option value="24">24 tháng</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="form-label">
              Ghi chú thêm
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="form-textarea"
              placeholder="Nhập ghi chú hoặc yêu cầu đặc biệt..."
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Summary */}
        {selectedPackage && (
          <div className="package-summary">
            <h3 className="section-title">Tóm tắt đơn hàng</h3>
            <div className="summary-content">
              <div className="summary-item">
                <span>Gói dịch vụ:</span>
                <span>{selectedPackage.name}</span>
              </div>
              <div className="summary-item">
                <span>Giá:</span>
                <span>{formatPrice(selectedPackage.price)}/tháng</span>
              </div>
              <div className="summary-item">
                <span>Thời hạn:</span>
                <span>{formData.duration} tháng</span>
              </div>
              <div className="summary-item total">
                <span>Tổng cộng:</span>
                <span>{formatPrice(selectedPackage.price * parseInt(formData.duration))}</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`submit-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading || !selectedPackage}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Đang xử lý...
            </>
          ) : (
            'Đăng ký gói dịch vụ'
          )}
        </button>
      </form>
    </div>
  );
}