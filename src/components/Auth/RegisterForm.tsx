import React, { useState } from 'react';
import './AuthForm.css';

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: 'user' | 'staff';
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'user'
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
    }

    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (!formData.phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock registration success
      alert('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'user'
      });
      
    } catch (error) {
      setErrors({ email: 'Có lỗi xảy ra, vui lòng thử lại' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="form-header">
        <h2 className="form-title">Đăng ký tài khoản</h2>
        <p className="form-subtitle">Tạo tài khoản mới để sử dụng dịch vụ</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="fullName" className="form-label">
            Họ và tên
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className={`form-input ${errors.fullName ? 'error' : ''}`}
            placeholder="Nhập họ tên đầy đủ"
            disabled={isLoading}
          />
          {errors.fullName && (
            <span className="error-message">{errors.fullName}</span>
          )}
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
            placeholder="Nhập email của bạn"
            disabled={isLoading}
          />
          {errors.email && (
            <span className="error-message">{errors.email}</span>
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

        <div className="form-group">
          <label htmlFor="role" className="form-label">
            Vai trò
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="form-select"
            disabled={isLoading}
          >
            <option value="user">Người dùng</option>
            <option value="staff">Nhân viên</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Mật khẩu
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className={`form-input ${errors.password ? 'error' : ''}`}
            placeholder="Nhập mật khẩu"
            disabled={isLoading}
          />
          {errors.password && (
            <span className="error-message">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Xác nhận mật khẩu
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
            placeholder="Nhập lại mật khẩu"
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <span className="error-message">{errors.confirmPassword}</span>
          )}
        </div>

        <div className="form-options">
          <label className="checkbox-container">
            <input type="checkbox" required />
            <span className="checkmark"></span>
            Tôi đồng ý với <a href="#" className="terms-link">điều khoản sử dụng</a>
          </label>
        </div>

        <button
          type="submit"
          className={`submit-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Đang đăng ký...
            </>
          ) : (
            'Đăng ký'
          )}
        </button>
      </form>
    </div>
  );
}