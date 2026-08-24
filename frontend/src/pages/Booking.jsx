import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Sparkles, Check, MessageCircle, IndianRupee } from "lucide-react";

const SLOTS = ["10:00 AM", "12:00 PM", "3:00 PM", "5:00 PM", "7:00 PM"];

export default function Booking() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const nav = useNavigate();
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [contact, setContact] = useState({ name: user?.full_name || "", email: user?.email || "", phone: "" });
  const [done, setDone] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!date || !slot) return toast.error(lang === "en" ? "Pick date & time" : "तारीख और समय चुनें");
    setLoading(true);
    try {
      const r = await api.post("/bookings", { ...contact, date: date.toISOString().split("T")[0], time_slot: slot, notes });
      setDone(r.data);
      toast.success(t("bookSuccess"));
    } catch (err) {
      toast.error("Failed");
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6"><Check className="h-8 w-8 text-emerald-500" /></div>
        <h1 className="text-3xl font-bold text-[#0B192C]">{t("bookSuccess")}</h1>
        <p className="text-slate-500 mt-2">{lang === "en" ? "You'll receive confirmation shortly." : "आपको जल्द ही पुष्टि मिलेगी।"}</p>
        <Card className="p-6 border-slate-200 mt-8 text-left">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-slate-400 text-xs uppercase tracking-widest">Date</div><div className="font-semibold text-[#0B192C]">{done.date}</div></div>
            <div><div className="text-slate-400 text-xs uppercase tracking-widest">Time</div><div className="font-semibold text-[#0B192C]">{done.time_slot}</div></div>
            <div><div className="text-slate-400 text-xs uppercase tracking-widest">Amount</div><div className="font-semibold text-[#0B192C]">₹999 (MOCKED)</div></div>
            <div><div className="text-slate-400 text-xs uppercase tracking-widest">Status</div><div className="font-semibold text-emerald-600">Confirmed</div></div>
          </div>
        </Card>
        <div className="flex gap-3 justify-center mt-6">
          <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer"><Button variant="outline" className="rounded-full"><MessageCircle className="mr-2 h-4 w-4" />{t("whatsappCta")}</Button></a>
          <Button onClick={() => nav("/dashboard")} className="rounded-full bg-[#FF9933] hover:bg-[#e6842b] text-white">{t("dashboard")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-[#FF9933]" /><span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{lang === "en" ? "Expert Consultation" : "विशेषज्ञ परामर्श"}</span></div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0B192C]">{t("bookTitle")}</h1>
      <p className="text-slate-500 mt-2 flex items-center gap-1"><IndianRupee className="h-4 w-4" />{t("bookSub")}</p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Card className="p-6 border-slate-200">
          <Label className="mb-3 block">{t("bookDate")}</Label>
          <Calendar mode="single" selected={date} onSelect={setDate} disabled={{ before: new Date() }} className="border border-slate-200 rounded-md" data-testid="booking-calendar" />
          <Label className="mt-6 mb-3 block">{t("bookTime")}</Label>
          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map((s) => (
              <button key={s} onClick={() => setSlot(s)} className={`text-sm py-2 rounded-md border transition-all ${slot === s ? "border-[#FF9933] bg-orange-50 text-[#FF9933] font-semibold" : "border-slate-200 hover:border-slate-300 text-slate-600"}`} data-testid={`slot-${s.replace(/[: ]/g,"")}`}>{s}</button>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-slate-200">
          <div className="space-y-4">
            <div><Label>{t("fullName")}</Label><Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className="mt-1.5 h-11" data-testid="book-name" /></div>
            <div><Label>{t("email")}</Label><Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="mt-1.5 h-11" data-testid="book-email" /></div>
            <div><Label>{t("phone")}</Label><Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="mt-1.5 h-11" data-testid="book-phone" /></div>
            <div><Label>{t("bookNotes")}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" rows={4} data-testid="book-notes" /></div>
            <Button onClick={submit} disabled={loading} className="w-full rounded-md bg-[#FF9933] hover:bg-[#e6842b] text-white h-11 font-semibold" data-testid="book-confirm">{loading ? "..." : `${t("bookConfirm")} · ₹999`}</Button>
            <p className="text-xs text-center text-slate-400">MOCKED payment — no real charge</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
