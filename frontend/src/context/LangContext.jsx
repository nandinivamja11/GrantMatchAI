import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/lib/i18n";

const LangCtx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("gm_lang") || "en");

  useEffect(() => {
    localStorage.setItem("gm_lang", lang);
    document.documentElement.lang = lang;
    document.body.classList.toggle("font-hindi", lang === "hi");
  }, [lang]);

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  const toggle = () => setLang((l) => (l === "en" ? "hi" : "en"));

  return <LangCtx.Provider value={{ lang, setLang, toggle, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
