export function buildModerationPrompt(title: string, content: string, forum: string) {
  return `You are a content moderator for a university academic forum called Academify.
Analyze the following forum post and return ONLY valid JSON with no extra text.

Forum: ${forum}
Title: ${title}
Content: ${content.slice(0, 1500)}

Return JSON with exactly these fields:
{
  "decision": "approve" | "flag" | "reject",
  "toxicity": <float 0.0-1.0>,
  "spam": <float 0.0-1.0>,
  "labels": <array of strings from: ["hate_speech","harassment","spam","off_topic","self_promotion","misinformation","safe"]>,
  "reason": <short human-readable explanation, max 120 chars>
}

Guidelines:
- "approve" if content is academic, respectful, on-topic
- "flag" for borderline content requiring human review (toxicity or spam 0.4-0.7)
- "reject" for clear violations (toxicity or spam > 0.7, hate speech, explicit content)
- University forum: mild academic frustration is acceptable, personal attacks are not`;
}

export function buildSummarizePrompt(title: string, content: string, comments: string[]) {
  const commentsText = comments
    .slice(0, 15)
    .map((c, i) => `Comment ${i + 1}: ${c.slice(0, 300)}`)
    .join("\n");

  return `You are summarizing a university forum discussion for students.
Return ONLY valid JSON with no extra text.

Thread title: ${title}
Original post: ${content.slice(0, 800)}
${commentsText ? `\nComments:\n${commentsText}` : ""}

Return JSON with exactly these fields:
{
  "summary": <2-3 sentence neutral summary of the discussion, max 200 chars>,
  "keyPoints": <array of up to 4 short bullet strings, each max 80 chars>,
  "openQuestions": <array of up to 2 unresolved questions from the thread, may be empty>
}`;
}

export function buildRecommendPrompt(
  userProfile: {
    major?: string | null;
    bio?: string | null;
    skillTags?: string[];
    academicLevel?: string | null;
  },
  forumNames: string[],
  threads: Array<{ postID: string; title: string; forum: string }>
) {
  const profile = [
    userProfile.major ? `Major: ${userProfile.major}` : "",
    userProfile.academicLevel ? `Level: ${userProfile.academicLevel}` : "",
    userProfile.skillTags?.length ? `Skills: ${userProfile.skillTags.slice(0, 8).join(", ")}` : "",
    userProfile.bio ? `Bio: ${userProfile.bio.slice(0, 200)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const threadList = threads
    .slice(0, 20)
    .map((t) => `ID:${t.postID} | Forum:${t.forum} | Title:${t.title.slice(0, 80)}`)
    .join("\n");

  return `You are a recommendation engine for a university academic forum.
Return ONLY valid JSON with no extra text.

User profile:
${profile || "No profile data available"}
Forums joined/posted in: ${forumNames.slice(0, 8).join(", ") || "none"}

Candidate threads (pick up to 5 most relevant):
${threadList}

Return JSON with exactly this structure:
{
  "recommendations": [
    { "postID": "<id>", "score": <float 0.0-1.0>, "reason": <max 60 chars> }
  ]
}
Order by relevance descending. Prefer threads that match the user's skills and forum activity.`;
}

export function buildForumRecommendPrompt(
  userProfile: {
    major?: string | null;
    bio?: string | null;
    skillTags?: string[];
    academicLevel?: string | null;
  },
  joinedForumNames: string[],
  forums: Array<{ forumID: string; name: string; description: string }>
) {
  const profile = [
    userProfile.major ? `Major: ${userProfile.major}` : "",
    userProfile.academicLevel ? `Level: ${userProfile.academicLevel}` : "",
    userProfile.skillTags?.length ? `Skills: ${userProfile.skillTags.slice(0, 8).join(", ")}` : "",
    userProfile.bio ? `Bio: ${userProfile.bio.slice(0, 200)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const forumList = forums
    .slice(0, 20)
    .map(
      (forum) =>
        `ID:${forum.forumID} | Name:${forum.name.slice(0, 60)} | About:${forum.description.slice(0, 120)}`
    )
    .join("\n");

  return `You are a forum discovery assistant for a university platform.
Return ONLY valid JSON with no extra text.

User profile:
${profile || "No profile data available"}
Forums already joined/posted in: ${joinedForumNames.slice(0, 8).join(", ") || "none"}

Candidate forums (pick up to 4 the user has NOT joined yet):
${forumList}

Return JSON with exactly this structure:
{
  "recommendations": [
    { "forumID": "<id>", "score": <float 0.0-1.0>, "reason": <max 60 chars> }
  ]
}
Prefer forums aligned with the user's major, skills, and academic interests.`;
}
