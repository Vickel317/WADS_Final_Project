export function canCreateForum(role: string | null | undefined) {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return normalized === "admin" || normalized === "lecturer";
}
