import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";

export default function Pricing() {
  const { user, refresh } = useAuth();
  const { lang, t } = useLang();
  const [loading, setLoading] = useState(false);

  const upgrade = async () => {
    setLoading(true);
    try {
      await api.post("/subscription/upgrade", { plan: "pro" });
      await refresh();
      toast.success(lang === "en" ? "Welcome to Pro! (MOCKED)" : "प्रो में स्वागत है!");
    } catch (err) { toast.error("Failed"); }
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 border border-slate-200 rounded-full px-3 py-1 text-xs font-semibold text-[#0B192C]"><Sparkles className="h-3 w-3 text-[#FF9933]" />{lang === "en" ? "Simple pricing" : "सरल मूल्य निर्धारण"}</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B192C] mt-6 tracking-tight">{lang === "en" ? "Start free. Upgrade when you're ready." : "मुफ्त शुरू करें। तैयार होने पर अपग्रेड करें।"}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-12">
        <Card className="p-8 border-slate-200">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{t("freeTier")}</div>
          <div className="mt-4 flex items-baseline gap-1"><span className="text-4xl font-extrabold text-[#0B192C]">₹0</span><span className="text-slate-500">{t("perMonth")}</span></div>
          <ul className="mt-6 space-y-3">{[t("freeMatches"), lang === "en" ? "Readiness score" : "रेडिनेस स्कोर", lang === "en" ? "PDF checklists" : "पीडीएफ चेकलिस्ट", lang === "en" ? "Community support" : "कम्युनिटी सपोर्ट"].map((f, i) => (<li key={i} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 text-emerald-500" />{f}</li>))}</ul>
          <Button disabled={user?.plan !== "pro"} variant="outline" className="w-full mt-8 rounded-md">{user?.plan === "free" ? (lang === "en" ? "Current plan" : "वर्तमान प्लान") : t("freeTier")}</Button>
        </Card>

        <Card className="p-8 border-[#FF9933] border-2 relative bg-gradient-to-br from-white to-orange-50/50">
          <div className="absolute -top-3 left-6 bg-[#FF9933] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Most popular</div>
          <div className="text-xs uppercase tracking-widest text-[#FF9933] font-semibold">{t("proTier")}</div>
          <div className="mt-4 flex items-baseline gap-1"><span className="text-4xl font-extrabold text-[#0B192C]">₹499</span><span className="text-slate-500">{t("perMonth")}</span></div>
          <ul className="mt-6 space-y-3">{[t("unlimitedMatches"), t("docTemplates"), t("emailAlerts"), t("prioritySupport"), lang === "en" ? "Advanced readiness insights" : "उन्नत रेडिनेस इनसाइट्स"].map((f, i) => (<li key={i} className="flex items-center gap-2 text-sm text-slate-700"><Check className="h-4 w-4 text-emerald-500" />{f}</li>))}</ul>
          <Button onClick={upgrade} disabled={loading || user?.plan === "pro"} className="w-full mt-8 rounded-md bg-[#FF9933] hover:bg-[#e6842b] text-white font-semibold h-11" data-testid="upgrade-btn">
            {user?.plan === "pro" ? (lang === "en" ? "You're on Pro" : "आप प्रो पर हैं") : loading ? "..." : t("upgrade")}
          </Button>
          <p className="text-xs text-center text-slate-400 mt-2">Razorpay integration MOCKED for demo</p>
        </Card>
      </div>
    </div>
  );
}
