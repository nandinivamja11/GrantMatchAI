import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, LogOut, Languages, LayoutDashboard, Bookmark, Calendar, Shield } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const { lang, toggle, t } = useLang();
  const nav = useNavigate();
  const loc = useLocation();

  const doLogout = () => { logout(); nav("/"); };
  const linkClass = (to) =>
    `hidden md:inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
      loc.pathname.startsWith(to) ? "text-[#0B192C]" : "text-slate-500 hover:text-[#0B192C]"
    }`;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" data-testid="header-logo">
          <div className="relative">
            <div className="h-9 w-9 rounded-md bg-[#0B192C] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#FF9933]" strokeWidth={2.5} />
            </div>
          </div>
          <div className="leading-none">
            <div className="font-extrabold text-[#0B192C] tracking-tight text-lg">GrantMatch<span className="text-[#FF9933]"> AI</span></div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">For Founders & MSMEs</div>
          </div>
        </Link>

        <nav className="flex items-center gap-6">
          {user && (
            <>
              <Link to="/dashboard" className={linkClass("/dashboard")} data-testid="nav-dashboard"><LayoutDashboard className="h-4 w-4" />{t("dashboard")}</Link>
              <Link to="/saved" className={linkClass("/saved")} data-testid="nav-saved"><Bookmark className="h-4 w-4" />{t("saved")}</Link>
              <Link to="/booking" className={linkClass("/booking")} data-testid="nav-booking"><Calendar className="h-4 w-4" />{t("booking")}</Link>
              {user.role === "admin" && (
                <Link to="/admin" className={linkClass("/admin")} data-testid="nav-admin"><Shield className="h-4 w-4" />{t("admin")}</Link>
              )}
            </>
          )}

          <button onClick={toggle} className="text-sm font-semibold text-slate-600 hover:text-[#0B192C] flex items-center gap-1.5 border border-slate-200 px-2.5 py-1 rounded-full" data-testid="lang-toggle" aria-label="Toggle language">
            <Languages className="h-3.5 w-3.5" />
            {lang === "en" ? "हिं" : "EN"}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`hidden sm:inline-flex ${user.plan === "pro" ? "border-[#FF9933] text-[#FF9933]" : "border-slate-300 text-slate-500"}`}>
                {user.plan === "pro" ? t("proBadge") : t("freeBadge")}
              </Badge>
              <Button size="sm" variant="ghost" onClick={doLogout} data-testid="logout-btn"><LogOut className="h-4 w-4" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm" data-testid="header-login">{t("login")}</Button></Link>
              <Link to="/signup"><Button size="sm" className="rounded-full bg-[#FF9933] hover:bg-[#e6842b] text-white font-semibold" data-testid="header-signup">{t("signup")}</Button></Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
