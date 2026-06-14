"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ReportProfileModal } from "@/components/report-profile-modal";

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
  department: string;
  specializations: string[];
  consultationHours: string;
  verifiedPublications: string[];
  askMeAbout: string[];
  createdAt: string;
  isOwn: boolean;
  isFollowing: boolean;
  isFollower: boolean;
  isConnected: boolean;
}

interface UserPost {
  id: string;
  title: string;
  content: string;
  forum: string;
  createdAt: string;
  comments: number;
}

interface UserEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  forum: string;
  creator: string;
  isUpcoming: boolean;
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
    department: String(user.department ?? ""),
    specializations: Array.isArray(user.specializations) ? user.specializations.map((s) => String(s)) : [],
    consultationHours: String(user.consultationHours ?? ""),
    verifiedPublications: Array.isArray(user.verifiedPublications) ? user.verifiedPublications.map((s) => String(s)) : [],
    askMeAbout: Array.isArray(user.askMeAbout) ? user.askMeAbout.map((s) => String(s)) : [],
    createdAt: String(user.createdAt ?? ""),
    isOwn,
    isFollowing: Boolean(user.isFollowing ?? false),
    isFollower: Boolean(user.isFollower ?? false),
    isConnected: Boolean(user.isConnected ?? false),
  };
}

const roleBadge: Record<string, { label: string; bg: string; text: string }> = {
  student: { label: "Student", bg: "bg-blue-50", text: "text-blue-700" },
  lecturer: { label: "Lecturer", bg: "bg-purple-50", text: "text-purple-700" },
  admin: { label: "Admin", bg: "bg-amber-50", text: "text-amber-700" },
};

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollower, setIsFollower] = useState(false);
  const [recentPosts, setRecentPosts] = useState<UserPost[]>([]);
  const [recentEvents, setRecentEvents] = useState<UserEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "events">("posts");
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.user) {
          setProfile(null);
          return;
        }
        const mapped = mapApiUserToProfile(d.user as Record<string, unknown>, userId === "me" || d.user.isOwn);
        setProfile(mapped);
        setIsFollowing(mapped.isFollowing);
        setIsFollower(mapped.isFollower);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (!profile?.id) return;
    fetch(`/api/users/${profile.id}/posts`)
      .then((r) => r.json())
      .then((d) => setRecentPosts(d.data ?? []))
      .catch(() => {});
    fetch(`/api/users/${profile.id}/events?type=attending`)
      .then((r) => r.json())
      .then((d) => setRecentEvents(d.data ?? []))
      .catch(() => {});
  }, [profile?.id]);

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

  const badge = roleBadge[profile?.role ?? "student"] ?? roleBadge.student;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="text-lg font-semibold text-gray-900">Profile not found</h1>
        <p className="text-sm text-gray-500 mt-1">This user profile is unavailable or you are not authenticated.</p>
      </div>
    );
  }

  const isLecturer = profile.role === "lecturer";
  const memberSince = profile.createdAt ? format(new Date(profile.createdAt), "MMM yyyy") : null;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Cover + Avatar Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div
          className="h-32 w-full"
          style={profile.bannerUrl
            ? { backgroundImage: `url(${profile.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #134e4a 100%)" }
          }
        />

        <div className="px-6 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
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
                <>
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
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition"
                    title="Report profile"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name, Role, Username & Meta */}
          <div className="mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${badge.bg} ${badge.text}`}>
                {badge.label}
              </span>
            </div>
            {profile.username && (
              <p className="text-sm text-gray-400 mt-0.5">@{profile.username}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {profile.major && profile.year && (
                <p className="text-sm text-teal-600 font-medium">{profile.major} &middot; {profile.year}</p>
              )}
              {profile.major && !profile.year && (
                <p className="text-sm text-teal-600 font-medium">{profile.major}</p>
              )}
              {!profile.major && profile.year && (
                <p className="text-sm text-teal-600 font-medium">{profile.year}</p>
              )}
            </div>
            {profile.bio && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{profile.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
              {memberSince && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Member since {memberSince}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {profile.location}
                </span>
              )}
              {profile.email && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {profile.email}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-teal-600 hover:underline"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  {profile.website.replace(/^https?:\/\//, "")}
                </a>
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

      {/* Lecturer Info */}
      {isLecturer && (profile.department || profile.specializations.length > 0 || profile.consultationHours || profile.verifiedPublications.length > 0 || profile.askMeAbout.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Academic Profile</h2>
          <div className="space-y-3">
            {profile.department && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Department</p>
                <p className="text-sm text-gray-700 mt-0.5">{profile.department}</p>
              </div>
            )}
            {profile.specializations.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Specializations</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {profile.specializations.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg text-xs font-medium text-purple-700 bg-purple-50">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.consultationHours && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Consultation Hours</p>
                <p className="text-sm text-gray-700 mt-0.5">{profile.consultationHours}</p>
              </div>
            )}
            {profile.askMeAbout.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Ask Me About</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {profile.askMeAbout.map((topic) => (
                    <span key={topic} className="px-2.5 py-1 rounded-lg text-xs font-medium text-teal-700 bg-teal-50">{topic}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.verifiedPublications.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Verified Publications</p>
                <ul className="mt-1 space-y-1">
                  {profile.verifiedPublications.map((pub) => (
                    <li key={pub} className="flex items-start gap-1.5 text-sm text-gray-700">
                      <svg className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {pub}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
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

      {/* Portfolio Links */}
      {profile.portfolioLinks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-3">Portfolio</h2>
          <ul className="space-y-2">
            {profile.portfolioLinks.map((link) => (
              <li key={link}>
                <a
                  href={link.startsWith("http") ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-teal-600 hover:underline"
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

      {/* Recent Activity Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["posts", "events"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                activeTab === tab
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
              }`}
            >
              {tab === "posts" ? `Recent Posts (${recentPosts.length})` : `Events (${recentEvents.length})`}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "posts" && (
            <>
              {recentPosts.length === 0 ? (
                <div className="py-8 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
                  >
                    <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No posts yet</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {recentPosts.map((post) => (
                    <li key={post.id}>
                      <Link
                        href={`/post/${post.id}`}
                        className="group block rounded-xl border border-gray-50 p-3.5 transition hover:border-teal-200 hover:shadow-sm"
                      >
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition">{post.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">{post.forum}</span>
                          <span>{format(new Date(post.createdAt), "MMM d, yyyy")}</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.comments}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {activeTab === "events" && (
            <>
              {recentEvents.length === 0 ? (
                <div className="py-8 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "linear-gradient(135deg, #ccfbf1, #99f6e4)" }}
                  >
                    <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">No events yet</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {recentEvents.map((event) => (
                    <li key={event.id}>
                      <Link
                        href={`/events/${event.id}`}
                        className="group block rounded-xl border border-gray-50 p-3.5 transition hover:border-teal-200 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-teal-700 transition">{event.title}</p>
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{format(new Date(event.date), "EEE, MMM d · h:mm a")}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{event.location}</span>
                            </div>
                          </div>
                          <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold ${event.isUpcoming ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                            {event.isUpcoming ? "Upcoming" : "Past"}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportProfileModal
          userId={profile.id}
          userName={profile.name}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
