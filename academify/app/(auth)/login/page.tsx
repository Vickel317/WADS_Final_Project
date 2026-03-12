"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      router.push("/dashboard");
    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-screen h-screen flex items-center justify-center bg-[#f0fafa]"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');`}</style>

      <div className="w-screen h-screen flex rounded-none overflow-hidden shadow-2xl shadow-teal-900/20">
        {/* ── Left Panel ── */}
        <div
          className="hidden md:flex flex-col justify-between w-1/2 p-14 relative overflow-hidden"
          style={{ background: "linear-gradient(145deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20"
            style={{ background: "rgba(255,255,255,0.25)" }} />
          <div className="absolute top-32 -right-8 w-48 h-48 rounded-full opacity-15"
            style={{ background: "rgba(255,255,255,0.2)" }} />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full opacity-15"
            style={{ background: "rgba(255,255,255,0.2)" }} />

          {/* Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🎓</span>
              </div>
              <span className="text-white text-xl font-bold" style={{ fontFamily: "'DM Serif Display', serif" }}>
                Academify
              </span>
            </div>
            <p className="text-teal-200 text-sm ml-12">Your Academic Success Hub</p>
          </div>

          {/* Stats */}
          <div className="relative z-10 flex gap-8 my-8">
            {[
              { value: "10K+", label: "Active Students" },
              { value: "500+", label: "Study Groups" },
              { value: "95%",  label: "Satisfaction Rate" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-white text-2xl font-bold">{s.value}</p>
                <p className="text-teal-200 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Headline */}
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <h2 className="text-white text-4xl font-bold leading-tight mb-4"
              style={{ fontFamily: "'DM Serif Display', serif" }}>
              Collaborate.<br />Learn.<br />Succeed Together.
            </h2>
            <p className="text-teal-100 text-sm leading-relaxed max-w-xs">
              Join thousands of students who are transforming their academic journey through collaborative learning.
            </p>
          </div>

          {/* Bottom spacer */}
          <div className="h-4" />
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-16 py-14">
          {/* Tabs */}
          <div className="flex rounded-xl border border-gray-200 p-1 mb-8 w-full">
            <span className="flex-1 text-center py-2 text-sm font-semibold text-teal-700 bg-white rounded-lg shadow-sm">
              Login
            </span>
            <Link href="/register"
              className="flex-1 text-center py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition rounded-lg">
              Register
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Welcome Back
          </h2>
          <p className="text-gray-400 text-sm mb-7">Enter your credentials to access your account</p>

          {errors.general && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉️</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john.doe@university.edu"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition ${
                    errors.email ? "border-red-300" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition ${
                    errors.password ? "border-red-300" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400 accent-teal-500"
                />
                <span className="text-sm text-gray-500">Remember me</span>
              </label>
              <Link href="#" className="text-sm text-teal-600 hover:text-teal-500 font-medium transition">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 mt-1"
              style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : "Login"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-teal-600 hover:text-teal-500 font-semibold transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}