import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ReadinessGauge from "@/components/ReadinessGauge";
import { toast } from "sonner";
import { ArrowRight, Bookmark, Lock, Sparkles, TrendingUp, Building2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [locked, setLocked] = useState(0);
  const [aiSummary, setAiSummary] = useState("");
  const [readiness, setReadiness] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    (async () => {
      try {
        const [mRes, rRes, bRes] = await Promise.all([
          api.post("/match"),
          api.get("/readiness"),
          api.get("/bookmarks"),
        ]);
        setMatches(mRes.data.matches || []);
        setLocked(mRes.data.locked_count || 0);
        setAiSummary(mRes.data.ai_summary || "");
        setReadiness(rRes.data);
        setSavedIds(new Set((bRes.data || []).map((s) => s.id)));
      } catch (err) {
        if (err.response?.status === 400) { nav("/onboarding"); return; }
        toast.error("Failed to load matches");
      }
      setLoading(false);
    })();
  }, [nav]);

  const toggleSave = async (id) => {
    if (savedIds.has(id)) {
      await api.delete(`/bookmarks/${id}`);
      const s = new Set(savedIds); s.delete(id); setSavedIds(s);
    } else {
      await api.post(`/bookmarks/${id}`);
      setSavedIds(new Set([...savedIds, id]));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <Card className="md:col-span-2 p-8 border-slate-200">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3"><Sparkles className="h-3.5 w-3.5 text-[#FF9933]" />{lang === "en" ? "AI Recommendation" : "AI सिफारिश"}</div>
          {loading ? <Skeleton className="h-24 w-full" /> : (
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-[15px]" data-testid="ai-summary">{aiSummary || (lang === "en" ? `Welcome, ${user?.full_name?.split(" ")[0] || "Founder"}! Here are your top scheme matches based on your business profile.` : `स्वागत है! यहां आपके शीर्ष मैच हैं।`)}</p>
          )}
        </Card>
        <Card className="p-6 border-slate-200">
          <div className="flex items-center justify-between mb-2"><span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{t("readiness")}</span><TrendingUp className="h-4 w-4 text-slate-400" /></div>
          {loading || !readiness ? <Skeleton className="h-32 w-full" /> : (
            <>
              <ReadinessGauge score={readiness.score} />
              <p className="text-sm font-semibold text-center text-[#0B192C] mt-2">{lang === "en" ? readiness.band.en : readiness.band.hi}</p>
            </>
          )}
        </Card>
      </div>

      {readiness && readiness.tips?.length > 0 && (
        <Card className="p-6 border-slate-200 mb-10 bg-orange-50/40">
          <div className="text-xs uppercase tracking-widest text-[#FF9933] font-semibold mb-3">{t("tipsTitle")}</div>
          <ul className="space-y-2">
            {readiness.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#FF9933]" />{lang === "en" ? tip.en : tip.hi}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0B192C]">{t("yourMatches")}</h2>
        <Link to="/onboarding" className="text-sm text-slate-500 hover:text-[#0B192C]">{lang === "en" ? "Edit profile" : "प्रोफ़ाइल संपादित करें"}</Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5" data-testid="matches-grid">
          {matches.map((s) => (
            <Card key={s.id} className="p-6 border-slate-200 hover:shadow-sm hover:-translate-y-0.5 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">{s.category}</div>
                  <h3 className="text-lg font-bold text-[#0B192C] leading-tight">{lang === "en" ? s.name_en : s.name_hi}</h3>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-2xl font-extrabold ${s.match_score >= 70 ? "text-emerald-600" : s.match_score >= 50 ? "text-[#FF9933]" : "text-slate-400"}`}>{s.match_score}%</div>
                  <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-widest">{t("matchScore")}</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3 line-clamp-2">{lang === "en" ? s.summary_en : s.summary_hi}</p>
              <div className="mt-3"><Badge variant="outline" className="border-slate-200 text-slate-600 font-medium">{lang === "en" ? s.grant_amount_label_en : s.grant_amount_label_hi}</Badge></div>
              {s.reasons?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">{s.reasons.slice(0, 2).map((r, i) => <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{r}</span>)}</div>
              )}
              <div className="mt-5 flex items-center justify-between">
                <Link to={`/schemes/${s.id}`}><Button variant="ghost" size="sm" className="text-[#0B192C] hover:text-[#FF9933]" data-testid={`view-${s.code}`}>{t("viewDetails")} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Link>
                <button onClick={() => toggleSave(s.id)} className={`p-2 rounded-md transition-colors ${savedIds.has(s.id) ? "text-[#FF9933]" : "text-slate-400 hover:text-slate-600"}`} data-testid={`save-${s.code}`} aria-label="save">
                  <Bookmark className="h-4 w-4" fill={savedIds.has(s.id) ? "#FF9933" : "none"} />
                </button>
              </div>
            </Card>
          ))}

          {locked > 0 && (
            <Card className="p-8 border-2 border-dashed border-[#FF9933]/40 bg-orange-50/40 flex flex-col items-center justify-center text-center md:col-span-2" data-testid="locked-cta">
              <Lock className="h-8 w-8 text-[#FF9933] mb-3" />
              <h3 className="text-xl font-bold text-[#0B192C]">{locked} {t("lockedCount")}</h3>
              <p className="text-slate-600 mt-1 max-w-md">{t("upgradeCta")}</p>
              <Link to="/pricing" className="mt-4"><Button className="rounded-full bg-[#FF9933] hover:bg-[#e6842b] text-white px-6" data-testid="unlock-btn">{t("upgrade")}</Button></Link>
            </Card>
          )}

          {matches.length === 0 && (
            <Card className="p-10 border-slate-200 text-center md:col-span-2"><Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">{lang === "en" ? "No matches yet. Update your profile to find grants." : "अभी कोई मैच नहीं। प्रोफ़ाइल अपडेट करें।"}</p></Card>
          )}
        </div>
      )}
    </div>
  );
}
