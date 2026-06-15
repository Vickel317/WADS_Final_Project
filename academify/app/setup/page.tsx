"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EducationLevelSelect } from "@/components/education-level-select";
import { DEFAULT_EDUCATION_LEVEL } from "@/lib/profile-education";

const fieldClass =
  "w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 focus:bg-white transition-all";

export default function ProfileSetupPage() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"STUDENT" | "LECTURER">("STUDENT");

  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [educationLevel, setEducationLevel] = useState(DEFAULT_EDUCATION_LEVEL);
  const [skillTags, setSkillTags] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");

  // Lecturer specific
  const [department, setDepartment] = useState("");
  const [consultationHours, setConsultationHours] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [verifiedPublications, setVerifiedPublications] = useState("");
  const [askMeAbout, setAskMeAbout] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      role,
      bio,
      username: username || undefined,
      ...(role === "STUDENT"
        ? {
            educationLevel,
            skillTags: skillTags.split(",").map((s) => s.trim()).filter(Boolean),
            portfolioLinks: portfolioLinks.split(",").map((s) => s.trim()).filter(Boolean),
          }
        : {
          department,
          consultationHours,
          specializations: specializations.split(",").map((s) => s.trim()).filter(Boolean),
          verifiedPublications: verifiedPublications.split(",").map((s) => s.trim()).filter(Boolean),
          askMeAbout: askMeAbout.split(",").map((s) => s.trim()).filter(Boolean),
        }
      )
    };

    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        window.location.href = "/dashboard"; // hard redirect to clear middleware cache
      } else {
        const errorData = await res.json();
        alert(errorData.error.message || "Failed to setup profile");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-screen h-screen flex relative bg-[#f0fafa] overflow-hidden"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');`}</style>
      
      {/* ── Left Panel (Matches Login/Register) ── */}
      <div
        className="hidden md:flex flex-col justify-between w-1/3 min-w-[350px] p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)", flexShrink: 0 }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20"
          style={{ background: "rgba(255,255,255,0.25)" }} />
        <div className="absolute top-32 -right-8 w-48 h-48 rounded-full opacity-15"
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

        {/* Headline */}
        <div className="relative z-10 flex-1 flex flex-col justify-center mt-12">
          <h2 className="text-white text-3xl font-bold leading-tight mb-4"
            style={{ fontFamily: "'DM Serif Display', serif" }}>
            Complete your<br />Academic Profile.
          </h2>
          <p className="text-teal-100 text-sm leading-relaxed max-w-[250px]">
            Help us personalize your experience by providing a few more details about your academic journey.
          </p>
        </div>
      </div>

      {/* ── Right Panel (Scrollable Form) ── */}
      <div className="flex-1 overflow-y-auto bg-white/60">
        <div className="max-w-2xl mx-auto py-12 px-8 md:px-12">
          <h1 className="text-3xl font-bold mb-2 font-serif text-gray-800" style={{ fontFamily: "'DM Serif Display', serif" }}>Almost there!</h1>
          <p className="text-gray-500 mb-8 text-sm">Please select your role and fill in your details.</p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-xl shadow-teal-900/5 border border-teal-50">
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                className={`p-4 border rounded-xl text-center font-medium transition-all ${role === "STUDENT" ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm" : "border-gray-200 text-gray-500 hover:border-teal-300"}`}
              >
                I am a Student
              </button>
              <button
                type="button"
                onClick={() => setRole("LECTURER")}
                className={`p-4 border rounded-xl text-center font-medium transition-all ${role === "LECTURER" ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm" : "border-gray-200 text-gray-500 hover:border-teal-300"}`}
              >
                I am a Lecturer
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Username (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input 
                    type="text" 
                    value={username} onChange={(e) => setUsername(e.target.value)} 
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 focus:bg-white transition-all" 
                    placeholder="e.g., johndoe123" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Bio / Status</label>
                <textarea 
                  value={bio} onChange={(e) => setBio(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 focus:bg-white transition-all h-24 resize-none" 
                  placeholder="Tell us about yourself..." 
                />
              </div>

              {role === "STUDENT" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Current education</label>
                    <EducationLevelSelect
                      value={educationLevel}
                      onChange={setEducationLevel}
                      className={fieldClass}
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Choose the level that fits you — from elementary through university.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Skills &amp; interests
                      <span className="ml-1 font-normal text-gray-400">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={skillTags}
                      onChange={(e) => setSkillTags(e.target.value)}
                      className={fieldClass}
                      placeholder="e.g., Math, Reading, Python, Basketball"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">
                      Portfolio links
                      <span className="ml-1 font-normal text-gray-400">(comma separated, optional)</span>
                    </label>
                    <input
                      type="text"
                      value={portfolioLinks}
                      onChange={(e) => setPortfolioLinks(e.target.value)}
                      className={fieldClass}
                      placeholder="e.g., github.com/johndoe, mywebsite.com"
                    />
                  </div>
                </>
              )}

              {role === "LECTURER" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Department / Faculty</label>
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 focus:bg-white transition-all" placeholder="e.g., Faculty of Computer Science" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Specializations (comma separated)</label>
                    <input type="text" value={specializations} onChange={(e) => setSpecializations(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 focus:bg-white transition-all" placeholder="e.g., Artificial Intelligence, Machine Learning" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Consultation Hours</label>
                    <input type="text" value={consultationHours} onChange={(e) => setConsultationHours(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 focus:bg-white transition-all" placeholder="e.g., Mon & Wed, 2PM - 4PM" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Verified Publications (Links, comma separated)</label>
                    <input type="text" value={verifiedPublications} onChange={(e) => setVerifiedPublications(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 focus:bg-white transition-all" placeholder="e.g., link.springer.com/articles/123" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Ask Me About (Mentorship Topics, comma separated)</label>
                    <input type="text" value={askMeAbout} onChange={(e) => setAskMeAbout(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-400 focus:bg-white transition-all" placeholder="e.g., Graduate Studies, Career Advice" />
                  </div>
                </>
              )}
            </div>

            <Button type="submit" className="w-full bg-teal-700 text-white hover:bg-teal-800 transition-colors h-11 rounded-xl shadow-lg shadow-teal-900/10 font-medium" disabled={loading}>
              {loading ? "Saving Profile..." : "Complete Setup"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}