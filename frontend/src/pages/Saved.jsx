import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { Card } from "@/components/ui/card";
import { Bookmark, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Saved() {
  const { lang, t } = useLang();
  const [items, setItems] = useState([]);
//   useEffect(() => { api.get("/bookmarks").then((r) => setItems(r.data || [])); }, []);
useEffect(() => {
  api
    .get("/bookmarks")
    .then((r) => setItems(r.data || []))
    .catch(() => setItems([]));
}, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <h1 className="text-3xl font-bold text-[#0B192C]">{t("saved")}</h1>
      <p className="text-slate-500 mt-1">{lang === "en" ? "Schemes you're tracking." : "आपकी सहेजी गई योजनाएं।"}</p>

      <div className="mt-8 grid md:grid-cols-2 gap-5" data-testid="saved-grid">
        {items.length === 0 && (<Card className="p-10 border-slate-200 text-center md:col-span-2"><Bookmark className="h-8 w-8 text-slate-300 mx-auto mb-2" /><p className="text-slate-500">{lang === "en" ? "No saved schemes yet." : "अभी कोई सहेजी हुई योजना नहीं।"}</p></Card>)}
        {items.map((s) => (
          <Card key={s.id} className="p-6 border-slate-200 hover:shadow-sm hover:-translate-y-0.5 transition-all">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">{s.category}</div>
            <h3 className="text-lg font-bold text-[#0B192C]">{lang === "en" ? s.name_en : s.name_hi}</h3>
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">{lang === "en" ? s.summary_en : s.summary_hi}</p>
            <Link to={`/schemes/${s.id}`}><Button variant="ghost" size="sm" className="mt-3 text-[#0B192C] hover:text-[#FF9933] px-0">{t("viewDetails")} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
