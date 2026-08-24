import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success("Welcome back");
      nav(u.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-white">
      <Card className="w-full max-w-md p-8 border-slate-200">
        <div className="flex items-center gap-2 mb-6"><Sparkles className="h-5 w-5 text-[#FF9933]" /><span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">GrantMatch AI</span></div>
        <h1 className="text-2xl font-bold text-[#0B192C]">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Log in to continue your grant journey.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label htmlFor="email">{t("email")}</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 h-11" data-testid="login-email" /></div>
          <div><Label htmlFor="password">{t("password")}</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5 h-11" data-testid="login-password" /></div>
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-md bg-[#FF9933] hover:bg-[#e6842b] text-white font-semibold" data-testid="login-submit">{loading ? "..." : t("login")}</Button>
        </form>

        <p className="mt-6 text-sm text-slate-500 text-center">{t("noAccount")} <Link to="/signup" className="text-[#FF9933] font-semibold hover:underline" data-testid="link-signup">{t("signup")}</Link></p>
      </Card>
    </div>
  );
}
