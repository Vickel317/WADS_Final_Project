"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Profile {
  id: string;
  name: string;
  major: string;
  year: string;
  bio: string;
  location: string;
  website: string;
  connections: number;
  posts: number;
  filesShared: number;
  skills: string[];
  isOwn: boolean;
  isConnected: boolean;
}

const mockProfile: Profile = {
  id: "me",
  name: "John Doe",
  major: "Computer Science",
  year: "3rd Year",
  bio: "Passionate about algorithms, machine learning, and building things that matter. Always looking for study partners and collaborators!",
  location: "Jakarta, Indonesia",
  website: "johndoe.dev",
  connections: 248,
  posts: 67,
  filesShared: 142,
  skills: ["React", "TypeScript", "Python", "Machine Learning", "Data Structures", "Algorithms"],
  isOwn: true,
  isConnected: false,
};

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.user ?? { ...mockProfile, isOwn: userId === "me" });
        setConnected(d.user?.isConnected ?? false);
      })
      .catch(() => {
        setProfile({ ...mockProfile, isOwn: userId === "me" });
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Cover + Avatar Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Cover */}
        <div
          className="h-32 w-full"
          style={{ background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)" }}
        />

        {/* Avatar + Actions */}
        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {profile.isOwn ? (
                <button
                  onClick={() => router.push("/profile/edit")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition"
                  style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setConnected((p) => !p)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                    connected
                      ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "text-white"
                  }`}
                  style={!connected ? { background: "linear-gradient(135deg, #0d9488, #0f766e)" } : {}}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={connected ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                  </svg>
                  {connected ? "Connected" : "Connect"}
                </button>
              )}
            </div>
          </div>

          {/* Name & Meta */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
            <p className="text-sm text-teal-600 font-medium">{profile.major} · {profile.year}</p>
            {profile.bio && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{profile.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              {profile.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {profile.website}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Connections", value: profile.connections },
              { label: "Forum Posts", value: profile.posts },
              { label: "Files Shared", value: profile.filesShared },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Card */}
      {profile.skills.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Skills & Interests</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-teal-700 bg-teal-50"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}