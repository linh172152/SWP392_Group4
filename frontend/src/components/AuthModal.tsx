import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User } from '../App';
import { Zap, X } from 'lucide-react';

interface AuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onLogin: (user: User) => void;
  onSwitchMode: () => void;
}

// Mock users for demo
const mockUsers = [
  { 
    id: '1', 
    email: 'taixe@demo.com', 
    password: 'demo123', 
    name: 'Nguyễn Văn Tài Xế', 
    role: 'driver' as const,
    department: 'Khách hàng',
    position: 'Tài xế'
  },
  { 
    id: '2', 
    email: 'nhanvien@demo.com', 
    password: 'demo123', 
    name: 'Trần Thị Nhân Viên', 
    role: 'staff' as const,
    department: 'Vận hành',
    position: 'Nhân viên Vận hành',
    stationId: 'ST001'
  },
  { 
    id: '3', 
    email: 'admin@demo.com', 
    password: 'demo123', 
    name: 'Lê Văn Quản Trị', 
    role: 'admin' as const,
    department: 'Quản lý',
    position: 'Quản trị viên Hệ thống',
    permissions: ['manage_all', 'view_reports', 'manage_employees', 'manage_stations']
  },
];

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onLogin, onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'driver' | 'staff' | 'admin'>('driver');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Mock login
        const user = mockUsers.find(u => u.email === email && u.password === password);
        if (user) {
          onLogin({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          });
        } else {
          setError('Thông tin đăng nhập không hợp lệ. Thử thông tin demo hoặc tạo tài khoản mới.');
        }
      } else {
        // Mock registration
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name,
          role
        };
        onLogin(newUser);
      }
    } catch {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole: 'driver' | 'staff' | 'admin') => {
    const demoUser = mockUsers.find(u => u.role === demoRole);
    if (demoUser) {
      onLogin({
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-0 shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 gradient-primary rounded-lg glow">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
                {mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                {mode === 'login' ? 'Đăng nhập vào tài khoản EVSwap của bạn' : 'Tạo tài khoản EVSwap mới'}
              </DialogDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-red-50 dark:hover:bg-red-500/10">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs value={mode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass border-0">
            <TabsTrigger value="login" onClick={() => mode !== 'login' && onSwitchMode()} className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              Đăng nhập
            </TabsTrigger>
            <TabsTrigger value="register" onClick={() => mode !== 'register' && onSwitchMode()} className="data-[state=active]:gradient-primary data-[state=active]:text-white">
              Đăng ký
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('driver')}
                  className="text-xs glass border-blue-200/50 dark:border-purple-400/30 hover:bg-blue-50/50 dark:hover:bg-purple-500/10"
                >
                  Demo Tài xế
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('staff')}
                  className="text-xs glass border-green-200/50 dark:border-green-400/30 hover:bg-green-50/50 dark:hover:bg-green-500/10"
                >
                  Demo NV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('admin')}
                  className="text-xs glass border-purple-200/50 dark:border-purple-400/30 hover:bg-purple-50/50 dark:hover:bg-purple-500/10"
                >
                  Demo Admin
                </Button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200/50 dark:border-slate-700/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Hoặc tiếp tục với</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="taixe@demo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-blue-400 dark:focus:border-purple-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="demo123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-blue-400 dark:focus:border-purple-400"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300" disabled={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name" className="text-slate-700 dark:text-slate-300">Họ và tên</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Nhập họ và tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-blue-400 dark:focus:border-purple-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-slate-700 dark:text-slate-300">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-blue-400 dark:focus:border-purple-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-slate-700 dark:text-slate-300">Mật khẩu</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Tạo mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-blue-400 dark:focus:border-purple-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">Loại tài khoản</Label>
                <Select value={role} onValueChange={(value: 'driver' | 'staff' | 'admin') => setRole(value)}>
                  <SelectTrigger className="glass border-slate-200/50 dark:border-slate-700/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-0">
                    <SelectItem value="driver">Tài xế</SelectItem>
                    <SelectItem value="staff">Nhân viên trạm</SelectItem>
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300" disabled={loading}>
                {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;