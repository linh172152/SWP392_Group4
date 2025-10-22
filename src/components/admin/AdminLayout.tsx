import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { User } from '../../App';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ThemeToggle } from '../ThemeToggle';
import { 
  Home, 
  Building, 
  Shuffle, 
  Users, 
  BarChart3, 
  Brain,
  LogOut,
  Settings,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { useState } from 'react';

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const navigation = [
  { name: 'Bảng điều khiển', href: '/admin/home', icon: Home },
  { name: 'Quản lý trạm', href: '/admin/stations', icon: Building },
  { name: 'Điều phối pin', href: '/admin/coordination', icon: Shuffle },
  { name: 'Quản lý người dùng', href: '/admin/users', icon: Users },
  { name: 'Quản lý nhân viên', href: '/admin/employees', icon: Users },
  { name: 'Báo cáo & Phân tích', href: '/admin/reports', icon: BarChart3 },
  { name: 'Gợi ý AI', href: '/admin/ai-suggestions', icon: Brain },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ user, onLogout, children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-violet-100 dark:from-slate-900 dark:via-purple-900/20 dark:to-violet-900/20 transition-all duration-500">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0EzQUYiIGZpbGwtb3BhY2l0eT0iMC4wNyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-40 dark:opacity-20"></div>
      
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-64 glass-card border-0 border-r border-white/20 dark:border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-white/20 dark:border-slate-700/50">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg glow">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">EVSwap Quản trị</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)} className="hover:bg-red-50/50 dark:hover:bg-red-500/10">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="mt-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-700 dark:text-violet-400 border-r-2 border-purple-600 dark:border-violet-400 shadow-lg'
                        : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-violet-400 hover:bg-purple-50/50 dark:hover:bg-violet-500/10'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={onLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-all duration-300"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Đăng xuất
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col z-40">
        <div className="flex flex-col flex-grow glass-card border-0 border-r border-white/20 dark:border-slate-700/50 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/20 dark:border-slate-700/50">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg glow">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">EVSwap Quản trị</span>
            </div>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-300 group ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-700 dark:text-violet-400 border-r-2 border-purple-600 dark:border-violet-400 shadow-lg'
                      : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-violet-400 hover:bg-purple-50/50 dark:hover:bg-violet-500/10'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300 ${isActive ? 'text-purple-600 dark:text-violet-400' : ''}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 p-4 border-t border-white/20 dark:border-slate-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="ring-2 ring-purple-500/20 dark:ring-violet-500/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="w-full glass border-red-200/50 dark:border-red-400/30 hover:bg-red-50/50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 relative z-10">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4 glass-card border-0 border-b border-white/20 dark:border-slate-700/50 shadow-lg">
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)} className="hover:bg-purple-50/50 dark:hover:bg-violet-500/10">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-md">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">EVSwap</span>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Avatar className="ring-2 ring-purple-500/20 dark:ring-violet-500/20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;