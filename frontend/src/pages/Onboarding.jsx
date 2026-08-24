import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { SECTORS, STATES } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

const initial = {
  business_name: "", sector: "", stage: "idea", state: "",
  team_size: 1, annual_revenue_inr: 0,
  women_led: false, tech_based: false, dpiit_recognized: false, udyam_registered: false,
  has_pitch_deck: false, has_prototype: false, has_financials: false, description: "",
};

export default function Onboarding() {
  const { t } = useLang();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const total = 3;

  useEffect(() => {
    api.get("/profile").then((r) => { if (r.data?.business_name) setForm({ ...initial, ...r.data }); }).catch(() => {});
  }, []);

  const update = (k, v) => setForm({ ...form, [k]: v });
  const canNext = step === 1 ? form.business_name && form.sector && form.state : true;

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post("/profile", form);
      toast.success("Profile saved · finding matches…");
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-[#FF9933]" /><span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{t("step")} {step} {t("of")} {total}</span></div>
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0B192C] tracking-tight">{t("onboardTitle")}</h1>
      <p className="text-slate-500 mt-2">{t("onboardSub")}</p>
      <Progress value={(step / total) * 100} className="mt-6 h-1.5" />

      <Card className="mt-8 p-6 sm:p-8 border-slate-200">
        {step === 1 && (
          <div className="space-y-5" data-testid="onboarding-step1">
            <div><Label>{t("businessName")}</Label><Input value={form.business_name} onChange={(e) => update("business_name", e.target.value)} className="mt-1.5 h-11" data-testid="onb-name" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{t("sector")}</Label>
                <Select value={form.sector} onValueChange={(v) => update("sector", v)}>
                  <SelectTrigger className="mt-1.5 h-11" data-testid="onb-sector"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("state")}</Label>
                <Select value={form.state} onValueChange={(v) => update("state", v)}>
                  <SelectTrigger className="mt-1.5 h-11" data-testid="onb-state"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{t("stage")}</Label>
              <RadioGroup value={form.stage} onValueChange={(v) => update("stage", v)} className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[{ v: "idea", l: t("stageIdea") }, { v: "dpiit", l: t("stageDpiit") }, { v: "revenue", l: t("stageRevenue") }].map((o) => (
                  <label key={o.v} className={`border rounded-md p-3 cursor-pointer flex items-center gap-2 transition-all ${form.stage === o.v ? "border-[#FF9933] bg-orange-50" : "border-slate-200 hover:border-slate-300"}`} data-testid={`onb-stage-${o.v}`}>
                    <RadioGroupItem value={o.v} /><span className="text-sm font-medium text-[#0B192C]">{o.l}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5" data-testid="onboarding-step2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>{t("teamSize")}</Label><Input type="number" min="1" value={form.team_size} onChange={(e) => update("team_size", parseInt(e.target.value || "1"))} className="mt-1.5 h-11" data-testid="onb-team" /></div>
              <div><Label>{t("annualRevenue")}</Label><Input type="number" min="0" value={form.annual_revenue_inr} onChange={(e) => update("annual_revenue_inr", parseInt(e.target.value || "0"))} className="mt-1.5 h-11" data-testid="onb-revenue" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {[{ k: "women_led", l: t("womenLed") }, { k: "tech_based", l: t("techBased") }, { k: "dpiit_recognized", l: t("dpiit") }, { k: "udyam_registered", l: t("udyam") }].map((c) => (
                <label key={c.k} className="border border-slate-200 rounded-md p-3 flex items-center gap-3 cursor-pointer hover:border-slate-300">
                  <Checkbox checked={form[c.k]} onCheckedChange={(v) => update(c.k, !!v)} data-testid={`onb-${c.k}`} />
                  <span className="text-sm font-medium text-[#0B192C]">{c.l}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3" data-testid="onboarding-step3">
            <Label className="text-base font-semibold text-[#0B192C]">Readiness</Label>
            {[{ k: "has_pitch_deck", l: t("hasPitch") }, { k: "has_prototype", l: t("hasProto") }, { k: "has_financials", l: t("hasFin") }].map((c) => (
              <label key={c.k} className="border border-slate-200 rounded-md p-3 flex items-center gap-3 cursor-pointer hover:border-slate-300">
                <Checkbox checked={form[c.k]} onCheckedChange={(v) => update(c.k, !!v)} data-testid={`onb-${c.k}`} />
                <span className="text-sm font-medium text-[#0B192C]">{c.l}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-8">
          <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} data-testid="onb-back"><ArrowLeft className="h-4 w-4 mr-1" /> {t("prevStep")}</Button>
          {step < total ? (
            <Button onClick={() => canNext && setStep(step + 1)} disabled={!canNext} className="rounded-full bg-[#FF9933] hover:bg-[#e6842b] text-white px-6" data-testid="onb-next">{t("nextStep")} <ArrowRight className="h-4 w-4 ml-1" /></Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="rounded-full bg-[#FF9933] hover:bg-[#e6842b] text-white px-6" data-testid="onb-submit">{submitting ? "..." : t("submit")}</Button>
          )}
        </div>
      </Card>
    </div>
  );
}
