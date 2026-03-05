"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", agree: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Enter a valid email";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    if (!form.agree) e.agree = "You must agree to the terms";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      router.push("/login");
    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#f0fafa] px-4 py-8"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');`}</style>

      <div className="w-full max-w-7xl min-h-[650px] flex rounded-3xl overflow-hidden shadow-2xl shadow-teal-900/20">
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

          <div className="h-4" />
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-16 py-14">
          {/* Tabs */}
          <div className="flex rounded-xl border border-gray-200 p-1 mb-7 w-full">
            <Link href="/login"
              className="flex-1 text-center py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition rounded-lg">
              Login
            </Link>
            <span className="flex-1 text-center py-2 text-sm font-semibold text-teal-700 bg-white rounded-lg shadow-sm">
              Register
            </span>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Create Account
          </h2>
          <p className="text-gray-400 text-sm mb-6">Join the Academify student community today</p>

          {errors.general && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Full Name</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition ${
                    errors.name ? "border-red-300" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

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
                  placeholder="Min. 8 characters"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition ${
                    errors.password ? "border-red-300" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  placeholder="Re-enter your password"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 transition ${
                    errors.confirm ? "border-red-300" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-teal-500"
                />
                <span className="text-sm text-gray-500">
                  I agree to the{" "}
                  <Link href="#" className="text-teal-600 hover:underline font-medium">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="#" className="text-teal-600 hover:underline font-medium">Privacy Policy</Link>
                </span>
              </label>
              {errors.agree && <p className="text-red-400 text-xs mt-1">{errors.agree}</p>}
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
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-5">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-600 hover:text-teal-500 font-semibold transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}