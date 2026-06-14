import type { RecommendUserContext } from "@/lib/ai/recommend-context";

export const RECOMMEND_AI_TIMEOUT_MS = Number(process.env.OLLAMA_RECOMMEND_TIMEOUT_MS ?? 8000);

type Profile = RecommendUserContext["profile"];

export function scoreForumHeuristic(
  forum: { name: string; description: string | null },
  profile: Profile
) {
  const haystack = `${forum.name} ${forum.description ?? ""}`.toLowerCase();
  let score = 0.2;
  let reason = "Popular topic on Academify";

  if (profile.major && haystack.includes(profile.major.toLowerCase())) {
    score += 0.35;
    reason = "Related to your major";
  }

  for (const tag of profile.skillTags.slice(0, 6)) {
    if (tag && haystack.includes(tag.toLowerCase())) {
      score += 0.15;
      reason = `Matches your ${tag} skills`;
    }
  }

  return { score: Math.min(1, score), reason };
}

export function scoreThreadHeuristic(
  thread: { title: string; forum: string },
  profile: Profile,
  joinedForumNames: string[]
) {
  const haystack = `${thread.title} ${thread.forum}`.toLowerCase();
  let score = 0.15;
  let reason = "Recent discussion you might enjoy";

  if (profile.major && haystack.includes(profile.major.toLowerCase())) {
    score += 0.3;
    reason = "Related to your major";
  }

  for (const tag of profile.skillTags.slice(0, 6)) {
    if (tag && haystack.includes(tag.toLowerCase())) {
      score += 0.2;
      reason = `Matches your ${tag} interest`;
      break;
    }
  }

  for (const name of joinedForumNames) {
    if (thread.forum.toLowerCase() === name.toLowerCase()) {
      score += 0.25;
      reason = `From ${name}, where you post`;
      break;
    }
  }

  return { score: Math.min(1, score), reason };
}

export function buildThreadHeuristicRecommendations(
  threads: Array<{ postID: string; title: string; forum: string }>,
  context: RecommendUserContext,
  limit: number
) {
  return threads
    .map((thread) => {
      const { score, reason } = scoreThreadHeuristic(
        thread,
        context.profile,
        context.joinedForumNames
      );
      return {
        postID: thread.postID,
        title: thread.title,
        forum: thread.forum,
        score,
        reason,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
