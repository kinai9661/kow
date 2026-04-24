import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, User, LogOut, Plus } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  isAdmin: boolean;
}

interface AuthProps {
  onLogin: (user: User) => void;
  onLogout: () => void;
  user: User | null;
}

export default function Auth({ onLogin, onLogout, user }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (user) {
      setCredits(user.credits);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "操作失敗");
      }

      localStorage.setItem("token", data.token);
      onLogin(data.user);
      setCredits(data.user.credits);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    onLogout();
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-300">
          <User className="w-4 h-4" />
          <span className="font-medium">{user.name}</span>
          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
            {user.isAdmin ? "管理員" : `${credits} 積分`}
          </span>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm" className="border-slate-700 text-slate-300">
          <LogOut className="w-4 h-4 mr-1" />
          登出
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Card className="bg-slate-900/90 border-slate-800 w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            {isLogin ? "登入" : "註冊"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="space-y-1">
                <Label htmlFor="name" className="text-slate-300 text-sm">名稱</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的名字"
                  className="bg-slate-800 border-slate-700 text-white"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-slate-300 text-sm">密碼</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-800 border-slate-700 text-white"
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isLogin ? "登入" : "註冊"}
            </Button>
          </form>
          <p className="text-slate-400 text-sm text-center mt-3">
            {isLogin ? "還沒有帳號？" : "已有帳號？"}
            <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-cyan-400 ml-1 hover:underline">
              {isLogin ? "立即註冊" : "登入"}
            </button>
          </p>
          <p className="text-slate-500 text-xs text-center mt-2">
            {isLogin ? "註冊送 10 積分" : "首次註冊贈送 10 積分"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}