"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    showEmail: true,
    showAcademicLevel: true,
    showLastSeen: true,
    dmRestriction: "ALL",
  });

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setSettings({
            showEmail: data.user.showEmail ?? true,
            showAcademicLevel: data.user.showAcademicLevel ?? true,
            showLastSeen: data.user.showLastSeen ?? true,
            dmRestriction: data.user.dmRestriction || "ALL",
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof settings] }));
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <h1 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: "'DM Serif Display', serif" }}>Privacy & Settings</h1>
      
      <div className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Visibility</h2>
          <div className="space-y-4">
            
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700">Show Email</p>
                <p className="text-xs text-gray-400">Allow others to see your email address</p>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={settings.showEmail} onChange={() => handleToggle("showEmail")} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${settings.showEmail ? "bg-teal-500" : "bg-gray-300"}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.showEmail ? "transform translate-x-4" : ""}`}></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700">Show Academic Level</p>
                <p className="text-xs text-gray-400">Display your degree or year on your profile</p>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={settings.showAcademicLevel} onChange={() => handleToggle("showAcademicLevel")} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${settings.showAcademicLevel ? "bg-teal-500" : "bg-gray-300"}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.showAcademicLevel ? "transform translate-x-4" : ""}`}></div>
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700">Show Last Seen</p>
                <p className="text-xs text-gray-400">Let others know when you were last online</p>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={settings.showLastSeen} onChange={() => handleToggle("showLastSeen")} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${settings.showLastSeen ? "bg-teal-500" : "bg-gray-300"}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.showLastSeen ? "transform translate-x-4" : ""}`}></div>
              </div>
            </label>

          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Messages</h2>
          <label className="block text-sm font-medium text-gray-700 mb-2">Who can message you?</label>
          <select 
            className="w-full border border-gray-200 p-2 rounded-xl text-sm focus:ring-teal-500 focus:border-teal-500"
            value={settings.dmRestriction}
            onChange={(e) => setSettings({ ...settings, dmRestriction: e.target.value })}
          >
            <option value="ALL">Everyone</option>
            <option value="CONNECTIONS">Only connections</option>
            <option value="NONE">No one</option>
          </select>
        </div>

        <div className="pt-6 mt-6 flex justify-end">
          <button 
            className="px-6 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-bold rounded-xl shadow-md hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}