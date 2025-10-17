import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Zap, MapPin, Clock, Shield, Battery, Users } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ThemeToggle } from './ThemeToggle';

interface LandingPageProps {
  onAuth: (mode: 'login' | 'register') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuth }) => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-0 border-b border-white/20 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="p-2 gradient-primary rounded-lg glow">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EVSwap</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Tính năng</a>
              <a href="#how-it-works" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Cách hoạt động</a>
              <a href="#contact" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Liên hệ</a>
            </nav>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="outline" onClick={() => onAuth('login')} className="glass border-blue-200/50 dark:border-purple-400/30 hover:bg-blue-50/50 dark:hover:bg-purple-500/10">
                Đăng nhập
              </Button>
              <Button onClick={() => onAuth('register')} className="gradient-primary text-white shadow-lg hover:shadow-blue-500/25 dark:hover:shadow-purple-500/25 transition-all duration-300">
                Bắt đầu
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 animated-bg opacity-5 dark:opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-purple-500/10 dark:from-transparent dark:via-blue-500/10 dark:to-purple-500/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="float">
              <Badge className="mb-4 glass-card border-0 gradient-primary text-white shadow-lg">Công nghệ EV Cách mạng</Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-white dark:via-blue-100 dark:to-purple-100 bg-clip-text text-transparent leading-tight">
                Thay Pin Tức thì cho Xe Điện
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                Bỏ qua thời gian chờ. Thay pin trong vòng dưới 3 phút tại mạng lưới trạm tự động của chúng tôi. 
                Tiếp tục lái xe trong khi người khác vẫn đang sạc.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => onAuth('register')} className="gradient-primary text-white shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 dark:hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105">
                  <Zap className="mr-2 h-5 w-5" />
                  Bắt đầu Thay Pin
                </Button>
                <Button variant="outline" size="lg" className="glass border-blue-200/50 dark:border-purple-400/30 hover:bg-blue-50/50 dark:hover:bg-purple-500/10 transition-all duration-300">
                  Tìm Trạm
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 gradient-secondary opacity-20 blur-2xl rounded-3xl"></div>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1672542128826-5f0d578713d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb258ZW58MXx8fHwxNzU5NzEzOTIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Trạm thay pin EV"
                className="relative rounded-2xl shadow-2xl w-full h-96 object-cover glass-card border-0 transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-900/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
              Tại sao chọn EVSwap?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Trải nghiệm tương lai của quản lý năng lượng xe điện với công nghệ thay pin tiên tiến.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="glass-card border-0 glow-hover group">
              <CardHeader>
                <div className="p-3 gradient-primary rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white">Thay Pin 3 Phút</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Thay pin tự động trong vòng dưới 3 phút - nhanh hơn cả đổ xăng.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 glow-hover group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white">Mạng lưới Toàn quốc</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Hơn 500 trạm trên toàn quốc với khả năng hoạt động 24/7 và kiểm kê thời gian thực.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 glow-hover group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Battery className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white">Quản lý Pin Thông minh</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Giám sát sức khỏe pin bằng AI và phân phối sạc tối ưu trên toàn mạng lưới.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 glow-hover group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white">Bảo mật & An toàn</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Giao thức bảo mật cấp quân đội và bảo hiểm toàn diện cho mọi lần thay pin.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 glow-hover group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white">Đa dạng Người dùng</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Giao diện chuyên dụng cho tài xế, nhân viên trạm và quản trị viên với tính năng theo vai trò.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card border-0 glow-hover group">
              <CardHeader>
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-slate-900 dark:text-white">Theo dõi Thời gian thực</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Tính khả dụng trạm trực tiếp, trạng thái pin và phân tích dự đoán để lập kế hoạch tuyến đường tối ưu.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-indigo-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-indigo-900/20"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-blue-900 dark:from-white dark:to-blue-100 bg-clip-text text-transparent">
              Cách thức hoạt động
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Thay pin đơn giản, nhanh chóng và tự động trong ba bước dễ dàng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="gradient-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 glow">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Tìm & Đặt chỗ</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Sử dụng ứng dụng để tìm trạm gần nhất, kiểm tra tình trạng pin và đặt chỗ thay pin.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 glow">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Lái xe & Thay pin</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Lái xe đến trạm, đậu trong khu vực được chỉ định và để robot xử lý việc thay pin tự động.
              </p>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 glow">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Thanh toán & Đi</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Thanh toán tự động và nhận hóa đơn ngay lập tức. Lái xe với pin đầy trong vài phút.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 animated-bg"></div>
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sẵn sàng trải nghiệm tương lai?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Tham gia cùng hàng nghìn tài xế đã chuyển sang thay pin tức thì.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => onAuth('register')} className="glass-card border-0 text-slate-900 hover:text-blue-600 shadow-xl hover:scale-105 transition-all duration-300">
              Đăng ký Tài xế
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/20 glass backdrop-blur-xl shadow-xl hover:scale-105 transition-all duration-300">
              Trở thành Đối tác Trạm
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="glass-card border-0 border-t border-slate-200/20 dark:border-slate-700/30 text-slate-900 dark:text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 gradient-primary rounded-lg">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">EVSwap</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Cách mạng hóa quản lý năng lượng xe điện với công nghệ thay pin tức thì.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Sản phẩm</h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Tính năng</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Giá cả</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Trạm</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Hỗ trợ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Công ty</h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Về chúng tôi</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Tuyển dụng</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Tin tức</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Liên hệ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-slate-900 dark:text-white">Pháp lý</h3>
              <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Quyền riêng tư</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Điều khoản</a></li>
                <li><a href="#" className="hover:text-blue-600 dark:hover:text-purple-400 transition-colors">Bảo mật</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-200/20 dark:border-slate-700/30 mt-8 pt-8 text-center text-slate-500 dark:text-slate-400">
            <p>&copy; 2024 EVSwap. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;