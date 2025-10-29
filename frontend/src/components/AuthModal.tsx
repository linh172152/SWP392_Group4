import React, { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import type { User } from "../App";
import { Zap } from "lucide-react";
import { API_ENDPOINTS } from "../config/api";

interface AuthModalProps {
  mode: "login" | "register";
  onClose: () => void;
  onLogin: (user: User) => void;
  onSwitchMode: () => void;
}

// Mock users for demo (kept for reference but not used in real API calls)
// const mockUsers = [
//   {
//     id: "1",
//     email: "taixe@demo.com",
//     password: "demo123",
//     name: "Nguyễn Văn Tài Xế",
//     role: "driver" as const,
//     department: "Khách hàng",
//     position: "Tài xế",
//   },
//   {
//     id: "2",
//     email: "nhanvien@demo.com",
//     password: "demo123",
//     name: "Trần Thị Nhân Viên",
//     role: "staff" as const,
//     department: "Vận hành",
//     position: "Nhân viên Vận hành",
//     stationId: "ST001",
//   },
//   {
//     id: "3",
//     email: "admin@demo.com",
//     password: "demo123",
//     name: "Lê Văn Quản Trị",
//     role: "admin" as const,
//     department: "Quản lý",
//     position: "Quản trị viên Hệ thống",
//     permissions: [
//       "manage_all",
//       "view_reports",
//       "manage_employees",
//       "manage_stations",
//     ],
//   },
// ];

const AuthModal: React.FC<AuthModalProps> = ({
  mode,
  onClose,
  onLogin,
  onSwitchMode,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Simple password validation function
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 6) {
      errors.push("Mật khẩu phải có ít nhất 6 ký tự");
    }
    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        // Real API login
        const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Store access token in localStorage (refresh token is set as httpOnly cookie by backend)
          const accessToken = data.data.accessToken;
          localStorage.setItem("accessToken", accessToken);

          // Fetch protected profile endpoint using the access token to get authoritative user info
          try {
            const profileRes = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            });

            const profileData = await profileRes.json();

            if (profileRes.ok && profileData.success) {
              const u = profileData.data.user;
              onLogin({
                id: u.user_id,
                email: u.email,
                name: u.full_name,
                role: u.role.toLowerCase(),
              });
            } else if (data.data.user) {
              // Fallback to user returned from login response
              onLogin({
                id: data.data.user.user_id,
                email: data.data.user.email,
                name: data.data.user.full_name,
                role: data.data.user.role.toLowerCase(),
              });
            } else {
              setError(profileData.message || "Không thể lấy thông tin người dùng");
            }
          } catch (err) {
            console.error("Failed to fetch profile after login:", err);
            // Fallback to provided user if available
            if (data.data.user) {
              onLogin({
                id: data.data.user.user_id,
                email: data.data.user.email,
                name: data.data.user.full_name,
                role: data.data.user.role.toLowerCase(),
              });
            } else {
              setError("Đăng nhập thành công nhưng không thể lấy profile");
            }
          }
        } else {
          setError(data.message || "Đăng nhập thất bại");
        }
      } else {
        // Validate password for registration
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
          setError(passwordErrors.join(", "));
          setLoading(false);
          return;
        }

        // Validate other fields
        if (!email || !email.includes("@")) {
          setError("Email không hợp lệ");
          setLoading(false);
          return;
        }

        if (!name || name.length > 100) {
          setError("Tên phải có từ 1-100 ký tự");
          setLoading(false);
          return;
        }

        if (!phone || phone.length < 10) {
          setError("Số điện thoại phải có ít nhất 10 số");
          setLoading(false);
          return;
        }

        // Real API registration
        const requestData = {
          email,
          password,
          full_name: name,
          phone: phone,
          role: "DRIVER",
        };

        console.log("Sending registration data:", requestData);

        const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const accessToken = data.data.accessToken;
          localStorage.setItem("accessToken", accessToken);

          // Fetch profile after register to sign the user into the app state
          try {
            const profileRes = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            });
            const profileData = await profileRes.json();

            if (profileRes.ok && profileData.success) {
              const u = profileData.data.user;
              onLogin({
                id: u.user_id,
                email: u.email,
                name: u.full_name,
                role: u.role.toLowerCase(),
              });
            } else if (data.data.user) {
              onLogin({
                id: data.data.user.user_id,
                email: data.data.user.email,
                name: data.data.user.full_name,
                role: data.data.user.role.toLowerCase(),
              });
            } else {
              setError(profileData.message || "Đăng ký thành công nhưng không thể lấy profile");
            }
          } catch (err) {
            console.error("Failed to fetch profile after register:", err);
            if (data.data.user) {
              onLogin({
                id: data.data.user.user_id,
                email: data.data.user.email,
                name: data.data.user.full_name,
                role: data.data.user.role.toLowerCase(),
              });
            } else {
              setError("Đăng ký thành công nhưng không thể lấy profile");
            }
          }
        } else {
          console.error("Registration error:", data);
          console.error("Detailed errors:", data.errors);
          setError(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
        }
      }
    } catch (error) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-card border-0 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 gradient-primary rounded-lg glow">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="bg-gradient-to-r from-slate-900 to-green-800 dark:from-white dark:to-lime-100 bg-clip-text text-transparent">
                {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản"}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                {mode === "login"
                  ? "Đăng nhập vào tài khoản EVSwap của bạn"
                  : "Tạo tài khoản EVSwap mới"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={mode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass border-0">
            <TabsTrigger
              value="login"
              onClick={() => mode !== "login" && onSwitchMode()}
              className="data-[state=active]:gradient-primary data-[state=active]:text-white"
            >
              Đăng nhập
            </TabsTrigger>
            <TabsTrigger
              value="register"
              onClick={() => mode !== "register" && onSwitchMode()}
              className="data-[state=active]:gradient-primary data-[state=active]:text-white"
            >
              Đăng ký
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="taixe@demo.com"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-lime-400 dark:focus:border-lime-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="demo123"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-lime-400 dark:focus:border-lime-400"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="reg-name"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Họ và tên
                </Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Nhập họ và tên của bạn"
                  value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-lime-400 dark:focus:border-lime-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="reg-email"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Email
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-lime-400 dark:focus:border-lime-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="reg-phone"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Số điện thoại
                </Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="Nhập số điện thoại (ít nhất 10 số)"
                  value={phone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPhone(e.target.value)
                  }
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-lime-400 dark:focus:border-lime-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="reg-password"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Mật khẩu
                </Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                  className="glass border-slate-200/50 dark:border-slate-700/50 focus:border-lime-400 dark:focus:border-lime-400"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-500/10 p-3 rounded-lg border border-red-200/50 dark:border-red-500/20">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full gradient-primary text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
