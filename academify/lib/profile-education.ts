export const EDUCATION_LEVEL_GROUPS = [
  {
    label: "K–12",
    options: [
      "Elementary (Grades 1–6)",
      "Middle School (Grades 7–9)",
      "High School (Grades 10–12)",
    ],
  },
  {
    label: "Higher education",
    options: [
      "University Year 1",
      "University Year 2",
      "University Year 3",
      "University Year 4",
      "Graduate / Postgraduate",
    ],
  },
  {
    label: "Other",
    options: ["Other", "Prefer not to say"],
  },
] as const;

export const EDUCATION_LEVELS = EDUCATION_LEVEL_GROUPS.flatMap((group) => group.options);

export const DEFAULT_EDUCATION_LEVEL = "Prefer not to say";

const LEGACY_YEAR_MAP: Record<string, string> = {
  "1st Year": "University Year 1",
  "2nd Year": "University Year 2",
  "3rd Year": "University Year 3",
  "4th Year": "University Year 4",
  Graduate: "Graduate / Postgraduate",
};

export function normalizeEducationLevel(value: string | null | undefined): string {
  if (!value?.trim()) return DEFAULT_EDUCATION_LEVEL;
  const trimmed = value.trim();
  if (LEGACY_YEAR_MAP[trimmed]) return LEGACY_YEAR_MAP[trimmed];
  if ((EDUCATION_LEVELS as readonly string[]).includes(trimmed)) return trimmed;
  return trimmed;
}

export function formatEducationLabel(value: string | null | undefined): string {
  const normalized = normalizeEducationLevel(value);
  if (!normalized || normalized === "Prefer not to say") return "";
  return normalized;
}

export function isValidEducationLevel(value: string): boolean {
  const normalized = normalizeEducationLevel(value);
  return (EDUCATION_LEVELS as readonly string[]).includes(normalized);
}
