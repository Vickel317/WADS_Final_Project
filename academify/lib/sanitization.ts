export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeText(value: string) {
  return escapeHtml(normalizeWhitespace(value).replace(/[\u0000-\u001f\u007f]/g, ""));
}
