import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { api } from "../api/client";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login, schoolInfo } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.login({ username, password });
      const token = res?.data?.token;
      let user = res?.data?.user;
      if (!token || !user) throw new Error("Invalid login response");

      localStorage.setItem("erp_token", token);

      try {
        const meRes = await api.auth.me();
        if (meRes?.data) user = meRes.data;
      } catch {}

      login({ token, user });
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed", err);
      let message = err?.data?.message || err?.message || "Login failed";
      if (
        message === "Failed to fetch" || 
        message.toLowerCase().includes("network error") || 
        message.toLowerCase().includes("load failed")
      ) {
        message = "Cannot connect to the server.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-1 bg-navy flex-col items-center justify-center relative overflow-hidden">
        <div className="text-center z-10">
          <div className="size-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md overflow-hidden p-2">
            <img
              src={schoolInfo?.logoUrl || "/logo.png"}
              alt="School Logo"
              className="size-full object-contain"
            />
          </div>
          <h1 className="text-white font-brand font-bold text-3xl tracking-wide">
            School ERP
          </h1>
          <h2 className="text-teal font-brand font-bold text-2xl mt-1">
            Administration Portal
          </h2>
          <p className="text-white/40 text-sm mt-3">Secure Access</p>
        </div>

        {/* Decorative mountain pattern */}
        <div className="absolute bottom-0 inset-x-0 h-32 opacity-10">
          <svg viewBox="0 0 1200 120" className="size-full fill-teal">
            <path d="M0,120 L200,60 L400,90 L600,30 L800,80 L1000,50 L1200,70 L1200,120 Z" />
          </svg>
        </div>

        <div className="absolute bottom-6 text-center">
          <a
            href="https://www.schoolwebsite.com"
            target="_blank"
            rel="noreferrer"
            className="text-white/30 text-xs hover:text-teal transition-colors"
          >
            www.schoolwebsite.com
          </a>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 relative p-8">
        <div className="absolute top-4 right-4 px-3 py-1 bg-teal/10 text-teal text-xs font-medium rounded-full">
          v1.0
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-navy font-brand">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to School ERP</p>

          {/* Seed/Default Credentials Note */}
          <div className="mt-4 p-3 bg-teal/5 border border-teal/10 rounded-xl flex flex-col gap-1 text-xs text-navy/70 animate-in fade-in duration-300">
            <span className="text-[10px] font-bold text-teal uppercase tracking-widest">Default Dummy Database Credentials</span>
            <p className="mt-0.5">
              Username: <strong className="text-navy font-semibold">admin</strong> | Password: <strong className="text-navy font-semibold">password@123</strong>
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-5">
            {error &&
              !error.toLowerCase().includes("account") &&
              !error.toLowerCase().includes("password") && (
                <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-start gap-2 animate-in fade-in zoom-in duration-200">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

            <div className="flex flex-col gap-1">
              <label
                className={`text-xs font-medium uppercase tracking-wide ${error?.toLowerCase().includes("account") ? "text-red-500" : "text-gray-500"}`}
              >
                Username / Email ID
              </label>
              <input
                type="text"
                placeholder="Enter username or email"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error?.toLowerCase().includes("account")) setError(null);
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                  error?.toLowerCase().includes("account")
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30 text-red-900 placeholder:text-red-300"
                    : "border-gray-200 focus:border-cta focus:ring-cta/20"
                }`}
              />
              {error?.toLowerCase().includes("account") && (
                <div className="text-red-500 text-[11px] font-semibold flex items-center gap-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle size={12} /> {error}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                className={`text-xs font-medium uppercase tracking-wide ${error?.toLowerCase().includes("password") ? "text-red-500" : "text-gray-500"}`}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error?.toLowerCase().includes("password"))
                      setError(null);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all pr-10 ${
                    error?.toLowerCase().includes("password")
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30 text-red-900 placeholder:text-red-300"
                      : "border-gray-200 focus:border-cta focus:ring-cta/20"
                  }`}
                />
                <button
                  type="button"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                    error?.toLowerCase().includes("password")
                      ? "text-red-400 hover:bg-red-100"
                      : "text-gray-400 hover:bg-gray-100"
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error?.toLowerCase().includes("password") && (
                <div className="text-red-500 text-[11px] font-semibold flex items-center gap-1 mt-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle size={12} /> {error}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <a
                href="#"
                className="text-xs text-teal hover:text-teal-dark transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cta text-white rounded-lg text-sm font-bold hover:bg-cta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
              disabled={loading}
            >
              {loading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                "LOGIN"
              )}
            </button>
            <p className="text-center text-xs text-gray-400">
              App works offline after first login
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
