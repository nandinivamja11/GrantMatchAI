import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("gm_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => localStorage.removeItem("gm_token")).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("gm_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const signup = async (data) => {
    const r = await api.post("/auth/signup", data);
    localStorage.setItem("gm_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem("gm_token");
    setUser(null);
  };

  const refresh = async () => {
    try {
      const r = await api.get("/auth/me");
      setUser(r.data);
    } catch (e) {}
  };

  return <AuthCtx.Provider value={{ user, loading, login, signup, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
