export function canNavigateBack(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const referrer = document.referrer;
    if (referrer) {
      return new URL(referrer).origin === window.location.origin;
    }
  } catch {
    // ignore invalid referrer
  }

  return window.history.length > 1;
}
