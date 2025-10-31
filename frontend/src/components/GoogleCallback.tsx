import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import type { User } from '../App';

interface GoogleCallbackProps {
  onLogin: (user: User) => void;
}

const GoogleCallback: React.FC<GoogleCallbackProps> = ({ onLogin }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực với Google...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const error = searchParams.get('message');

        // Check for error
        if (error) {
          setStatus('error');
          setMessage(decodeURIComponent(error));
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Check for token
        if (!token) {
          setStatus('error');
          setMessage('Không nhận được token từ Google. Vui lòng thử lại.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Store access token
        localStorage.setItem('accessToken', token);

        // Fetch user profile
        const profileResponse = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!profileResponse.ok) {
          throw new Error('Không thể lấy thông tin người dùng');
        }

        const profileData = await profileResponse.json();

        if (profileData.success && profileData.data.user) {
          const user = profileData.data.user;
          
          // Login user
          onLogin({
            id: user.user_id,
            email: user.email,
            name: user.full_name,
            role: user.role.toLowerCase(),
          });

          setStatus('success');
          setMessage(
            isNewUser
              ? 'Đăng ký thành công! Đang chuyển hướng...'
              : 'Đăng nhập thành công! Đang chuyển hướng...'
          );

          // Redirect based on role
          setTimeout(() => {
            navigate(`/${user.role.toLowerCase()}`);
          }, 1500);
        } else {
          throw new Error('Dữ liệu người dùng không hợp lệ');
        }
      } catch (error: any) {
        console.error('Google callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Có lỗi xảy ra trong quá trình đăng nhập');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20 p-4">
      <Card className="w-full max-w-md glass-card border-0 shadow-2xl">
        <CardContent className="p-12 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Đang xác thực...
              </h2>
              <p className="text-slate-600 dark:text-slate-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Thành công!
              </h2>
              <p className="text-slate-600 dark:text-slate-400">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Có lỗi xảy ra
              </h2>
              <p className="text-slate-600 dark:text-slate-400">{message}</p>
              <p className="text-sm text-slate-500 mt-2">Đang chuyển về trang chủ...</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCallback;

