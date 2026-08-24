import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, ArrowLeft, ExternalLink, CheckCircle2, Bookmark, Clock, IndianRupee, MessageCircle } from "lucide-react";

export default function SchemeDetail() {
  const { id } = useParams();
  const { lang, t } = useLang();
  const [scheme, setScheme] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get(`/schemes/${id}`).then((r) => setScheme(r.data)).catch(() => toast.error("Not found"));
    api.get("/bookmarks").then((r) => setSaved(r.data?.some((s) => s.id === id))).catch(() => {});
  }, [id]);

  const toggleSave = async () => {
    if (saved) { await api.delete(`/bookmarks/${id}`); setSaved(false); toast.success(lang === "en" ? "Removed" : "हटाया गया"); }
    else { await api.post(`/bookmarks/${id}`); setSaved(true); toast.success(lang === "en" ? "Saved" : "सहेजा गया"); }
  };

  const downloadPdf = () => {
    const token = localStorage.getItem("gm_token");
    const url = `${API}/schemes/${id}/checklist.pdf`;
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${scheme?.code || "checklist"}.pdf`;
        link.click();
      });
  };

  if (!scheme) return <div className="max-w-5xl mx-auto p-10 text-slate-400">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-[#0B192C] mb-6"><ArrowLeft className="h-4 w-4" /> {lang === "en" ? "Back to matches" : "मैच पर वापस"}</Link>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-3"><Badge variant="outline" className="border-slate-200 text-slate-500">{scheme.category}</Badge><Badge variant="outline" className="border-slate-200 text-slate-500">{scheme.authority}</Badge></div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0B192C] tracking-tight leading-tight">{lang === "en" ? scheme.name_en : scheme.name_hi}</h1>
          <p className="text-lg text-slate-600 mt-4 leading-relaxed">{lang === "en" ? scheme.summary_en : scheme.summary_hi}</p>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[#0B192C] mb-4">{t("docs")}</h2>
            <div className="space-y-2">
              {scheme.documents?.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-slate-200 rounded-md"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /><span className="text-sm text-slate-700">{d}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Card className="p-5 border-slate-200">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">{t("grant")}</div>
            <div className="flex items-start gap-2"><IndianRupee className="h-4 w-4 text-[#FF9933] mt-0.5" /><span className="text-sm font-semibold text-[#0B192C]">{lang === "en" ? scheme.grant_amount_label_en : scheme.grant_amount_label_hi}</span></div>
          </Card>
          <Card className="p-5 border-slate-200">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">{t("timeline")}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-500" /><span className="text-sm font-semibold text-[#0B192C]">{scheme.timeline}</span></div>
          </Card>

          <Button onClick={downloadPdf} className="w-full rounded-md bg-[#FF9933] hover:bg-[#e6842b] text-white" data-testid="download-pdf"><Download className="mr-2 h-4 w-4" />{t("download")}</Button>
          <Button onClick={toggleSave} variant="outline" className="w-full rounded-md" data-testid="save-scheme"><Bookmark className="mr-2 h-4 w-4" fill={saved ? "#FF9933" : "none"} />{saved ? t("unsave") : t("saveBookmark")}</Button>
          <a href={scheme.official_link} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full rounded-md" data-testid="official-link"><ExternalLink className="mr-2 h-4 w-4" />{t("officialLink")}</Button></a>

          <Card className="p-5 bg-[#0B192C] text-white border-none mt-6">
            <div className="text-xs uppercase tracking-widest text-[#FF9933] font-semibold mb-2">Need help applying?</div>
            <p className="text-sm text-slate-200 mb-3">Book a 30-min expert consultation at ₹999.</p>
            <Link to="/booking"><Button size="sm" className="w-full rounded-full bg-[#FF9933] hover:bg-[#e6842b] text-white" data-testid="scheme-book"><MessageCircle className="mr-2 h-4 w-4" />{t("booking")}</Button></Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
