import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LangProvider } from "@/context/LangContext";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import SchemeDetail from "@/pages/SchemeDetail";
import Saved from "@/pages/Saved";
import Booking from "@/pages/Booking";
import Pricing from "@/pages/Pricing";
import Admin from "@/pages/Admin";

function Protected({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Header />
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/schemes/:id" element={<Protected><SchemeDetail /></Protected>} />
            <Route path="/saved" element={<Protected><Saved /></Protected>} />
            <Route path="/booking" element={<Protected><Booking /></Protected>} />
            <Route path="/admin" element={<Protected adminOnly><Admin /></Protected>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}

export default App;
