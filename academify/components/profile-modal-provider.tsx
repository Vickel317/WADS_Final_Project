"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface Profile {
  id: string;
  username: string;
  name: string;
  role: string;
  major: string;
  year: string;
  bio: string;
  location: string;
  website: string;
  email: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  connections: number;
  posts: number;
  filesShared: number;
  skills: string[];
  portfolioLinks: string[];
  createdAt: string;
  isOwn: boolean;
  isFollowing: boolean;
  isFollower: boolean;
  isConnected: boolean;
}

function mapApiUserToProfile(user: Record<string, unknown>, isOwn: boolean): Profile {
  return {
    id: String(user.id ?? ""),
    username: String(user.username ?? ""),
    name: String(user.name ?? "User"),
    role: String(user.role ?? "student"),
    major: String(user.major ?? ""),
    year: String(user.year ?? ""),
    bio: String(user.bio ?? ""),
    location: String(user.location ?? ""),
    website: String(user.website ?? ""),
    email: typeof user.email === "string" ? user.email : null,
    avatarUrl: user.avatarUrl === null || user.avatarUrl === undefined ? null : String(user.avatarUrl),
    bannerUrl: user.bannerUrl === null || user.bannerUrl === undefined ? null : String(user.bannerUrl),
    connections: Number(user.connections ?? 0),
    posts: Number(user.posts ?? 0),
    filesShared: Number(user.filesShared ?? 0),
    skills: Array.isArray(user.skills) ? user.skills.map((s) => String(s)) : [],
    portfolioLinks: Array.isArray(user.portfolioLinks) ? user.portfolioLinks.map((s) => String(s)) : [],
    createdAt: String(user.createdAt ?? ""),
    isOwn,
    isFollowing: Boolean(user.isFollowing ?? false),
    isFollower: Boolean(user.isFollower ?? false),
    isConnected: Boolean(user.isConnected ?? false),
  };
}

function ProfileModalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const userId = searchParams.get("profileId");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollower, setIsFollower] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/users/${userId}`);
        const d = await r.json();
        if (cancelled) return;
        if (!d?.user) {
          setProfile(null);
          return;
        }
        const mapped = mapApiUserToProfile(
          d.user as Record<string, unknown>,
          userId === "me" || Boolean(d.user.isOwn)
        );
        setProfile(mapped);
        setIsFollowing(mapped.isFollowing);
        setIsFollower(mapped.isFollower);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return null;

  const closeModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("profileId");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleConnectToggle = async () => {
    const prevFollowing = isFollowing;
    setIsFollowing(!prevFollowing);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: prevFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) setIsFollowing(prevFollowing);
    } catch {
      setIsFollowing(prevFollowing);
    }
  };

  const isConnected = isFollowing && isFollower;
  let buttonText = "Follow";
  if (isConnected) buttonText = "Connected";
  else if (isFollowing) buttonText = "Following";
  else if (isFollower) buttonText = "Follow Back";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={closeModal}
      />
      
      {/* Modal */}
      <div className="relative bg-transparent w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {loading ? (
          <div className="bg-white flex items-center justify-center h-64 rounded-2xl">
            <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
          </div>
        ) : !profile ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
             <h1 className="text-lg font-semibold text-gray-900">Profile not found</h1>
             <p className="text-sm text-gray-500 mt-1">This user profile is unavailable.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="relative">
              {/* Close Button */}
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              
              <div
                className="h-32 w-full"
                style={profile.bannerUrl
                  ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)" }
                }
              />
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- user avatar may be external or API-served
                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {profile.isOwn ? (
                    <button
                      onClick={() => { closeModal(); router.push("/profile/edit"); }}
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
                      onClick={handleConnectToggle}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${
                        isFollowing ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "text-white"
                      }`}
                      style={!isFollowing ? { background: "linear-gradient(135deg, #0d9488, #0f766e)" } : {}}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isConnected ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                      </svg>
                      {buttonText}
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    profile.role === "lecturer" ? "bg-purple-50 text-purple-700" :
                    profile.role === "admin" ? "bg-amber-50 text-amber-700" :
                    "bg-blue-50 text-blue-700"
                  }`}>
                    {profile.role === "lecturer" ? "Lecturer" : profile.role === "admin" ? "Admin" : "Student"}
                  </span>
                </div>
                {profile.username && <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>}
                {profile.year && (
                  <p className="text-sm text-teal-600 font-medium mt-1">{profile.year}</p>
                )}
                {profile.bio && (
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">{profile.bio}</p>
                )}
                {profile.createdAt && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
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

              {profile.skills.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-gray-800 mb-3">Skills & Interests</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-xl text-xs font-medium text-teal-700 bg-teal-50">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.portfolioLinks.length > 0 && (
                <div className={profile.skills.length > 0 ? "mt-5" : ""}>
                  <h2 className="text-sm font-bold text-gray-800 mb-3">Portfolio</h2>
                  <ul className="space-y-1.5">
                    {profile.portfolioLinks.map((link) => (
                      <li key={link}>
                        <a
                          href={link.startsWith("http") ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-teal-600 hover:underline"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfileModalProvider() {
  return (
    <Suspense fallback={null}>
      <ProfileModalContent />
    </Suspense>
  );
}