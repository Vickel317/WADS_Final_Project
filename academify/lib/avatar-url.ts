export function resolveAvatarUrl(
  userId: string,
  avatarUrl: string | null | undefined
): string | null {
  if (!avatarUrl) return null;
  if (
    avatarUrl.startsWith("http") ||
    avatarUrl.startsWith("data:") ||
    avatarUrl.startsWith("/api/")
  ) {
    return avatarUrl;
  }
  if (avatarUrl.startsWith("/")) {
    return avatarUrl;
  }
  return `/api/users/${userId}/avatar`;
}
