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

export default function Signup() {
  const { signup } = useAuth();
  const { t } = useLang();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form);
      toast.success("Account created");
      nav("/onboarding");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-white">
      <Card className="w-full max-w-md p-8 border-slate-200">
        <div className="flex items-center gap-2 mb-6"><Sparkles className="h-5 w-5 text-[#FF9933]" /><span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">GrantMatch AI</span></div>
        <h1 className="text-2xl font-bold text-[#0B192C]">Create your account</h1>
        <p className="text-sm text-slate-500 mt-1">Get 3 free scheme matches instantly.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label htmlFor="name">{t("fullName")}</Label><Input id="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required className="mt-1.5 h-11" data-testid="signup-name" /></div>
          <div><Label htmlFor="email">{t("email")}</Label><Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1.5 h-11" data-testid="signup-email" /></div>
          <div><Label htmlFor="phone">{t("phone")}</Label><Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 h-11" data-testid="signup-phone" /></div>
          <div><Label htmlFor="password">{t("password")}</Label><Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="mt-1.5 h-11" data-testid="signup-password" /></div>
          <Button type="submit" disabled={loading} className="w-full h-11 rounded-md bg-[#FF9933] hover:bg-[#e6842b] text-white font-semibold" data-testid="signup-submit">{loading ? "..." : t("signup")}</Button>
        </form>

        <p className="mt-6 text-sm text-slate-500 text-center">{t("haveAccount")} <Link to="/login" className="text-[#FF9933] font-semibold hover:underline" data-testid="link-login">{t("login")}</Link></p>
      </Card>
    </div>
  );
}
