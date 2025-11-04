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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
  const [role, setRole] = useState<"driver" | "staff" | "admin">("driver");
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

        // Check for Too Many Requests
        if (response.status === 429) {
          setError("Bạn đã đăng nhập quá nhiều lần. Vui lòng thử lại sau vài phút!");
          setLoading(false);
          return;
        }

        let data;
        try {
          data = await response.json();
        } catch (parseErr) {
          const txt = await response.text();
          setError(txt || "Lỗi không xác định từ server.");
          setLoading(false);
          return;
        }

        if (data.success) {
          // Store token in localStorage
          localStorage.setItem("accessToken", data.data.accessToken);
          localStorage.setItem("refreshToken", data.data.refreshToken);

          onLogin({
            id: data.data.user.user_id,
            email: data.data.user.email,
            name: data.data.user.full_name,
            role: data.data.user.role.toLowerCase(),
          });
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
          role: role.toUpperCase(),
        };

        const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        if (response.status === 429) {
          setError("Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau vài phút!");
          setLoading(false);
          return;
        }

        let data;
        try {
          data = await response.json();
        } catch (parseErr) {
          const txt = await response.text();
          setError(txt || "Lỗi không xác định từ server.");
          setLoading(false);
          return;
        }

        if (response.ok && data.success) {
          // Store token in localStorage
          localStorage.setItem("accessToken", data.data.accessToken);
          localStorage.setItem("refreshToken", data.data.refreshToken);

          onLogin({
            id: data.data.user.user_id,
            email: data.data.user.email,
            name: data.data.user.full_name,
            role: data.data.user.role.toLowerCase(),
          });
        } else {
          setError(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
        }
      }
    } catch (error) {
      setError("Có lỗi kết nối server hoặc mạng. Vui lòng thử lại sau.");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl">
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
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
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
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
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
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  required
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
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
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
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
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
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
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
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
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="role"
                  className="text-slate-700 dark:text-slate-300"
                >
                  Loại tài khoản
                </Label>
                <Select
                  value={role}
                  onValueChange={(value: "driver" | "staff" | "admin") =>
                    setRole(value)
                  }
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
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
