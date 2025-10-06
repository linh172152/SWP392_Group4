import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fakeLogin } from '../../services/authService';
import './AuthForm.css';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

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
      const role = await fakeLogin(formData.email, formData.password);
      if (role === 'Admin') navigate('/admin');
      else if (role === 'Staff') navigate('/staff');
      else navigate('/user');
    } catch (error) {
      setErrors({ email: 'Email hoặc mật khẩu không đúng' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="form-header">
        <h2 className="form-title">Đăng nhập</h2>
        <p className="form-subtitle">Chào mừng bạn quay trở lại!</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
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
            placeholder="Nhập mật khẩu của bạn"
            disabled={isLoading}
          />
          {errors.password && (
            <span className="error-message">{errors.password}</span>
          )}
        </div>

        <div className="form-options">
          <label className="checkbox-container">
            <input type="checkbox" />
            <span className="checkmark"></span>
            Ghi nhớ đăng nhập
          </label>
          <a href="#" className="forgot-password">
            Quên mật khẩu?
          </a>
        </div>

        <button
          type="submit"
          className={`submit-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Đang đăng nhập...
            </>
          ) : (
            'Đăng nhập'
          )}
        </button>
      </form>

      <div className="demo-accounts">
        <h4>Tài khoản demo:</h4>
        <div className="demo-account">
          <strong>Admin:</strong> admin@ev.com / admin123
        </div>
        <div className="demo-account">
          <strong>Staff:</strong> staff@ev.com / staff123
        </div>
        <div className="demo-account">
          <strong>User:</strong> user@ev.com / user123
        </div>
      </div>
    </div>
  );
}