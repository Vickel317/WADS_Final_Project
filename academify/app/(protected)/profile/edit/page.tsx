"use client";
import { useEffect, useRef, useState } from "react";

import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/components/current-user-context";
import { EducationLevelSelect } from "@/components/education-level-select";
import { DEFAULT_EDUCATION_LEVEL, normalizeEducationLevel } from "@/lib/profile-education";

interface FormState {
    name: string;
    role: string;
    educationLevel: string;
    bio: string;
    location: string;
    website: string;
    skills: string;
    department: string;
    consultationHours: string;
    specializations: string;
    verifiedPublications: string;
    askMeAbout: string;
  avatarUrl: string;
  bannerUrl: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const defaultForm: FormState = {
  name: "",
  role: "student",
  educationLevel: DEFAULT_EDUCATION_LEVEL,
  bio: "",
  location: "",
  website: "",
  skills: "",
  department: "",
  consultationHours: "",
  specializations: "",
  verifiedPublications: "",
  askMeAbout: "",
  avatarUrl: "",
  bannerUrl: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const joinCommaList = (items: string[]) => items.join(", ");
const parseCommaList = (value: string) =>
  value.split(",").map((item) => item.trim()).filter(Boolean);

export default function EditProfilePage() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [initialForm, setInitialForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");



  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          const resolvedAvatar = typeof d.user.avatarUrl === "string" ? d.user.avatarUrl : "";
          const resolvedBanner = typeof d.user.bannerUrl === "string" ? d.user.bannerUrl : "";
          const loadedForm: FormState = {
            name: d.user.name ?? "",
            role: String(d.user.role ?? "student").toLowerCase(),
            educationLevel: normalizeEducationLevel(d.user.year ?? d.user.educationLevel),
            bio: d.user.bio ?? "",
            location: d.user.location ?? "",
            website: d.user.website ?? "",
            skills: Array.isArray(d.user.skills) ? d.user.skills.join(", ") : "",
            department: d.user.department ?? "",
            consultationHours: d.user.consultationHours ?? "",
            specializations: Array.isArray(d.user.specializations)
              ? joinCommaList(d.user.specializations.map(String))
              : "",
            verifiedPublications: Array.isArray(d.user.verifiedPublications)
              ? joinCommaList(d.user.verifiedPublications.map(String))
              : "",
            askMeAbout: Array.isArray(d.user.askMeAbout)
              ? joinCommaList(d.user.askMeAbout.map(String))
              : "",
            avatarUrl: resolvedAvatar,
            bannerUrl: resolvedBanner,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          };

          setForm(loadedForm);
          setInitialForm(loadedForm);
          setAvatarPreview(resolvedAvatar);
          setBannerPreview(resolvedBanner);
        }
      })
      .catch(() => {});
  }, [currentUser?.avatarUrl]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    return () => {
      if (bannerPreview.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [bannerPreview]);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAvatarPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, avatarUrl: "Please choose an image file" }));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatarUrl: "Image must be 2MB or smaller" }));
      return;
    }

    if (avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const preview = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(preview);
    setErrors((prev) => ({ ...prev, avatarUrl: undefined }));
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", avatarFile);

      const uploadResponse = await fetch("/api/storage/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json().catch(() => ({}));

      if (!uploadResponse.ok) {
        throw new Error(uploadData?.message || uploadData?.error?.message || "Failed to upload avatar image");
      }

      return uploadData.key as string;
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleBannerPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, bannerUrl: "Please choose an image file" }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, bannerUrl: "Image must be 5MB or smaller" }));
      return;
    }

    if (bannerPreview.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview);
    }

    const preview = URL.createObjectURL(file);
    setBannerFile(file);
    setBannerPreview(preview);
    setErrors((prev) => ({ ...prev, bannerUrl: undefined }));
  };

  const uploadBanner = async () => {
    if (!bannerFile) return null;

    setBannerUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", bannerFile);

      const uploadResponse = await fetch("/api/storage/upload-banner", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadResponse.json().catch(() => ({}));

      if (!uploadResponse.ok) {
        throw new Error(uploadData?.message || uploadData?.error?.message || "Failed to upload banner image");
      }

      return uploadData.key as string;
    } finally {
      setBannerUploading(false);
    }
  };

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Name is required";
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
    let uploadedAvatarKey: string | null = null;

    try {
      let avatarKey: string | null = null;
      let avatarUploadError: string | null = null;
      let bannerKey: string | null = null;
      let bannerUploadError: string | null = null;

      try {
        avatarKey = await uploadAvatar();
      } catch (error) {
        avatarUploadError = error instanceof Error ? error.message : "Failed to upload avatar image";
      }
      uploadedAvatarKey = avatarKey;

      try {
        bannerKey = await uploadBanner();
      } catch (error) {
        bannerUploadError = error instanceof Error ? error.message : "Failed to upload banner image";
      }


      const payload: Record<string, unknown> = {};
      const isLecturer = form.role === "lecturer";

      if (form.name.trim() !== initialForm.name.trim()) payload.name = form.name.trim();
      if (!isLecturer && form.educationLevel !== initialForm.educationLevel) {
        payload.year = form.educationLevel;
      }
      if (form.bio.trim() !== initialForm.bio.trim()) payload.bio = form.bio.trim();
      if (form.location.trim() !== initialForm.location.trim()) payload.location = form.location.trim();
      if (form.website.trim() !== initialForm.website.trim()) payload.website = form.website.trim();

      if (!isLecturer) {
        const nextSkills = parseCommaList(form.skills);
        const initialSkills = parseCommaList(initialForm.skills);
        if (nextSkills.join("|") !== initialSkills.join("|")) {
          payload.skills = nextSkills;
        }
      } else {
        if (form.department.trim() !== initialForm.department.trim()) {
          payload.department = form.department.trim();
        }
        if (form.consultationHours.trim() !== initialForm.consultationHours.trim()) {
          payload.consultationHours = form.consultationHours.trim();
        }

        const nextSpecializations = parseCommaList(form.specializations);
        const initialSpecializations = parseCommaList(initialForm.specializations);
        if (nextSpecializations.join("|") !== initialSpecializations.join("|")) {
          payload.specializations = nextSpecializations;
        }

        const nextPublications = parseCommaList(form.verifiedPublications);
        const initialPublications = parseCommaList(initialForm.verifiedPublications);
        if (nextPublications.join("|") !== initialPublications.join("|")) {
          payload.verifiedPublications = nextPublications;
        }

        const nextAskMeAbout = parseCommaList(form.askMeAbout);
        const initialAskMeAbout = parseCommaList(initialForm.askMeAbout);
        if (nextAskMeAbout.join("|") !== initialAskMeAbout.join("|")) {
          payload.askMeAbout = nextAskMeAbout;
        }
      }

      if (avatarKey) {
        payload.avatarUrl = avatarKey;
      }
      if (bannerKey) {
        payload.bannerUrl = bannerKey;
      }
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      if (Object.keys(payload).length === 0 && !avatarKey && !bannerKey && !form.newPassword) {
        setSaved(true);
        return;
      }

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiMessage =
          (data as { error?: { message?: string }; message?: string })?.error?.message ||
          (data as { message?: string })?.message;
        throw new Error(apiMessage || "Failed to save");
      }
      setErrors({});
      if (avatarUploadError) {
        setErrors({ avatarUrl: avatarUploadError });
      }
      if (bannerUploadError) {
        setErrors({ bannerUrl: bannerUploadError });
      }
      setSaved(true);
    } catch (err: unknown) {
      if (uploadedAvatarKey) {
        await fetch("/api/storage/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: uploadedAvatarKey }),
        }).catch(() => {});
      }
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

  const isLecturer = form.role === "lecturer";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
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
        <button
          onClick={() => router.push("/profile/me")}
          className="px-4 py-2 rounded-xl text-sm font-medium text-teal-600 border border-teal-200 hover:bg-teal-50 transition"
        >
          View public profile
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Profile Photo</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob/data/api avatar URLs are dynamic
                <img src={avatarPreview} alt="Profile preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                {avatarFile ? "Change Photo" : "Upload Photo"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarPick}
              />
              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or GIF. Max 2MB.</p>
              {errors.avatarUrl && <p className="mt-1 text-xs text-red-500">{errors.avatarUrl}</p>}
            </div>
          </div>
        </div>

        {/* Banner Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">Profile Banner</h2>
          <div className="relative">
            <div
              className="h-32 w-full rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center"
              style={!bannerPreview ? { background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)" } : {}}
            >
              {bannerPreview ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob/data/api banner URLs are dynamic
                <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 text-white/50 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-white/70">Default banner</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                {bannerFile ? "Change Banner" : "Upload Banner"}
              </button>
              {bannerPreview && (
                <button
                  type="button"
                  onClick={() => {
                    if (bannerPreview.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                    setBannerFile(null);
                    setBannerPreview("");
                    setForm((prev) => ({ ...prev, bannerUrl: "" }));
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
                >
                  Remove
                </button>
              )}
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleBannerPick}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or GIF. Max 5MB. Recommended: 1200x400px.</p>
            {errors.bannerUrl && <p className="mt-1 text-xs text-red-500">{errors.bannerUrl}</p>}
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

          {/* Current education (students only) */}
          {!isLecturer && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Current education
              </label>
              <EducationLevelSelect
                value={form.educationLevel}
                onChange={(value) => setForm((prev) => ({ ...prev, educationLevel: value }))}
                className={inputClass("educationLevel")}
              />
              <p className="mt-1 text-xs text-gray-400">
                Choose the level that fits you — from elementary through university.
              </p>
            </div>
          )}

          {/* Lecturer academic info */}
          {isLecturer && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Department / Faculty
                </label>
                <input
                  type="text"
                  value={form.department}
                  onChange={set("department")}
                  placeholder="e.g., Faculty of Computer Science"
                  className={inputClass("department")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Specializations
                  <span className="ml-1 text-gray-400 font-normal normal-case">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={form.specializations}
                  onChange={set("specializations")}
                  placeholder="e.g., Artificial Intelligence, Machine Learning"
                  className={inputClass("specializations")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Consultation hours
                </label>
                <input
                  type="text"
                  value={form.consultationHours}
                  onChange={set("consultationHours")}
                  placeholder="e.g., Mon & Wed, 2PM - 4PM"
                  className={inputClass("consultationHours")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Verified publications
                  <span className="ml-1 text-gray-400 font-normal normal-case">(comma separated links)</span>
                </label>
                <input
                  type="text"
                  value={form.verifiedPublications}
                  onChange={set("verifiedPublications")}
                  placeholder="e.g., link.springer.com/articles/123"
                  className={inputClass("verifiedPublications")}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Ask me about
                  <span className="ml-1 text-gray-400 font-normal normal-case">(comma separated topics)</span>
                </label>
                <input
                  type="text"
                  value={form.askMeAbout}
                  onChange={set("askMeAbout")}
                  placeholder="e.g., Graduate Studies, Career Advice"
                  className={inputClass("askMeAbout")}
                />
              </div>
            </>
          )}

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

          {/* Skills (students only) */}
          {!isLecturer && (
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
              {form.skills.trim() && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parseCommaList(form.skills).map((skill) => (
                    <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-medium text-teal-700 bg-teal-50">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
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
            disabled={loading || saved || avatarUploading || bannerUploading}
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
            ) : loading || avatarUploading || bannerUploading ? (
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