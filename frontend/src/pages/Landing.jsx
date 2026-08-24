import React from "react";
import { Link } from "react-router-dom";
import { useLang } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Sparkles, IndianRupee, ShieldCheck, Zap, FileCheck2, Building2, MessageCircle } from "lucide-react";

export default function Landing() {
  const { t, lang } = useLang();
  const heroImg = "https://images.unsplash.com/photo-1737573156037-d2bb948cd385?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBzdGFydHVwJTIwZm91bmRlciUyMHdvcmtpbmd8ZW58MHx8fHwxNzgyNTgzNDg1fDA&ixlib=rb-4.1.0&q=85";
  const consultingImg = "https://images.pexels.com/photos/36765718/pexels-photo-36765718.jpeg";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(255,153,51,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(11,25,44,0.05),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 border border-slate-200 bg-white/70 rounded-full px-3 py-1 text-xs font-semibold text-[#0B192C] mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF9933] animate-pulse" />
              {lang === "en" ? "AI-Powered · Made for India" : "AI-संचालित · भारत के लिए बनाया गया"}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B192C] leading-[1.05]">
              {lang === "en" ? (<>Find the grants <span className="text-[#FF9933]">built for you</span> — in minutes.</>) : (<>अपने लिए बने <span className="text-[#FF9933]">अनुदान</span> मिनटों में खोजें।</>)}
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">{t("heroSub")}</p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup"><Button size="lg" className="rounded-full bg-[#FF9933] hover:bg-[#e6842b] text-white font-semibold h-12 px-6 shadow-sm" data-testid="hero-cta">{t("getStarted")} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link to="/pricing"><Button size="lg" variant="outline" className="rounded-full h-12 px-6 border-slate-300" data-testid="hero-pricing">{t("pricing")}</Button></Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{lang === "en" ? "50+ verified schemes" : "50+ सत्यापित योजनाएं"}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{lang === "en" ? "AI eligibility check" : "AI पात्रता जांच"}</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{lang === "en" ? "Free forever tier" : "हमेशा मुफ्त टियर"}</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#FF9933]/10 to-[#0B192C]/10 rounded-3xl blur-2xl" />
            <img src={heroImg} alt="Indian founder" className="relative rounded-2xl border border-slate-200 shadow-sm w-full object-cover aspect-[4/3]" />
            <Card className="absolute -bottom-6 -left-4 p-4 shadow-md border-slate-200 max-w-xs bg-white">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center"><FileCheck2 className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Match found</div>
                  <div className="text-sm font-semibold text-[#0B192C]">SISFS · ₹20L · 92% fit</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[{ icon: Zap, title: lang === "en" ? "AI eligibility engine" : "AI पात्रता इंजन", desc: lang === "en" ? "Claude Sonnet 5 explains why each scheme fits — with match % scores." : "क्लॉड सॉनेट 5 समझाता है कि प्रत्येक योजना कैसे फिट है।" },
            { icon: IndianRupee, title: lang === "en" ? "50+ Indian schemes" : "50+ भारतीय योजनाएं", desc: lang === "en" ? "Startup India, TIDE, MSME Champions, Mudra, CGTMSE and 45 more." : "स्टार्टअप इंडिया, टाइड, एमएसएमई चैंपियंस, मुद्रा, सीजीटीएमएसई और अधिक।" },
            { icon: ShieldCheck, title: lang === "en" ? "Expert consulting" : "विशेषज्ञ परामर्श", desc: lang === "en" ? "Book a 30-min session for ₹999 — Mahendra Kumar personally advises you." : "₹999 में 30-मिनट सेशन बुक करें।" }].map((f, i) => (
            <Card key={i} className="p-8 border-slate-200 hover:shadow-sm hover:-translate-y-1 transition-all duration-200">
              <f.icon className="h-8 w-8 text-[#FF9933] mb-4" strokeWidth={2} />
              <h3 className="text-lg font-semibold text-[#0B192C] mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Consulting */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center bg-[#0B192C] rounded-3xl overflow-hidden p-8 md:p-12">
          <div>
            <Badge className="bg-[#FF9933]/20 text-[#FF9933] hover:bg-[#FF9933]/20 border-none uppercase tracking-widest text-[10px] font-bold">{lang === "en" ? "Expert Consulting" : "विशेषज्ञ परामर्श"}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-4">{lang === "en" ? "Not sure where to start? Talk to Mahendra Kumar." : "कहां से शुरू करें? महेंद्र कुमार से बात करें।"}</h2>
            <p className="mt-4 text-slate-300 leading-relaxed">{lang === "en" ? "15+ years of experience helping Indian startups win government grants. Personalized advice, application support, and end-to-end delivery." : "भारतीय स्टार्टअप्स को सरकारी अनुदान दिलवाने का 15+ वर्षों का अनुभव।"}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/booking"><Button size="lg" className="rounded-full bg-[#FF9933] hover:bg-[#e6842b] text-white h-12 px-6" data-testid="landing-book-cta">{t("booking")} — ₹999</Button></Link>
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer"><Button size="lg" variant="outline" className="rounded-full h-12 px-6 bg-transparent border-slate-500 text-white hover:bg-white hover:text-[#0B192C]" data-testid="landing-whatsapp"><MessageCircle className="mr-2 h-4 w-4" />{t("whatsappCta")}</Button></a>
            </div>
          </div>
          <img src={consultingImg} alt="consulting" className="rounded-2xl w-full object-cover aspect-[4/3]" />
        </div>
      </section>

      <footer className="border-t border-slate-200 py-10 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#FF9933]" /><span>© 2026 GrantMatch AI · Built for Indian founders</span></div>
          <div className="flex items-center gap-4"><Building2 className="h-4 w-4" /> {lang === "en" ? "For MSMEs, Startups & Innovators" : "एमएसएमई, स्टार्टअप और इनोवेटर्स के लिए"}</div>
        </div>
      </footer>
    </div>
  );
}
