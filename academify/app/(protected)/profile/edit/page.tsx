"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
    name: string;
    major: string;
    year: string;
    bio: string;
    location: string;
    website: string;
    skills: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const defaultForm: FormState = {
  name: "John Doe",
  major: "Computer Science",
  year: "3rd Year",
  bio: "Passionate about algorithms, machine learning, and building things that matter. Always looking for study partners and collaborators!",
  location: "Jakarta, Indonesia",
  website: "johndoe.dev",
  skills: "React, TypeScript, Python, Machine Learning, Data Structures, Algorithms",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate"];

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setForm((prev) => ({
            ...prev,
            name: d.user.name ?? prev.name,
            major: d.user.major ?? prev.major,
            year: d.user.year ?? prev.year,
            bio: d.user.bio ?? prev.bio,
            location: d.user.location ?? prev.location,
            website: d.user.website ?? prev.website,
            skills: Array.isArray(d.user.skills) ? d.user.skills.join(", ") : prev.skills,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.major.trim()) e.major = "Major is required";
    if (form.newPassword && form.newPassword.length < 8)
      e.newPassword = "Password must be at least 8 characters";
    if (form.newPassword && form.newPassword !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (form.newPassword && !form.currentPassword)
      e.currentPassword = "Current password is required";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        major: form.major.trim(),
        year: form.year,
        bio: form.bio.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      };
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save");
      setSaved(true);
      setTimeout(() => {
        router.push("/profile/me");
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save";
      setErrors({ name: message });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormState) =>
    `w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 transition ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-red-400/30"
        : "border-gray-200 focus:border-teal-400 focus:ring-teal-400/30"
    }`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">Update your personal information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Upload Photo
              </button>
              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-800">Basic Information</h2>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Full Name
            </label>
            <input type="text" value={form.name} onChange={set("name")} placeholder="Your full name" className={inputClass("name")} />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Major + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Major
              </label>
              <input type="text" value={form.major} onChange={set("major")} placeholder="e.g. Computer Science" className={inputClass("major")} />
              {errors.major && <p className="mt-1 text-xs text-red-500">{errors.major}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Year
              </label>
              <select value={form.year} onChange={set("year")} className={inputClass("year")}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={set("bio")}
              placeholder="Tell others about yourself..."
              rows={4}
              className={`${inputClass("bio")} resize-none`}
            />
            <p className="mt-1 text-xs text-gray-400 text-right">{form.bio.length} / 300</p>
          </div>

          {/* Location + Website */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Location
              </label>
              <input type="text" value={form.location} onChange={set("location")} placeholder="City, Country" className={inputClass("location")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Website
              </label>
              <input type="text" value={form.website} onChange={set("website")} placeholder="yoursite.com" className={inputClass("website")} />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Skills & Interests
              <span className="ml-1 text-gray-400 font-normal normal-case">(comma separated)</span>
            </label>
            <input
              type="text"
              value={form.skills}
              onChange={set("skills")}
              placeholder="e.g. React, Python, Machine Learning"
              className={inputClass("skills")}
            />
            {/* Preview tags */}
            {form.skills.trim() && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.skills.split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                  <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-medium text-teal-700 bg-teal-50">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-gray-800">Change Password</h2>
            <p className="text-xs text-gray-400 mt-0.5">Leave blank to keep your current password</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Current Password
            </label>
            <input type="password" value={form.currentPassword} onChange={set("currentPassword")} placeholder="••••••••" className={inputClass("currentPassword")} />
            {errors.currentPassword && <p className="mt-1 text-xs text-red-500">{errors.currentPassword}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                New Password
              </label>
              <input type="password" value={form.newPassword} onChange={set("newPassword")} placeholder="••••••••" className={inputClass("newPassword")} />
              {errors.newPassword && <p className="mt-1 text-xs text-red-500">{errors.newPassword}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Confirm Password
              </label>
              <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="••••••••" className={inputClass("confirmPassword")} />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <button
            type="submit"
            disabled={loading || saved}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
          >
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}