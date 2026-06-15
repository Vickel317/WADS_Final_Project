import {
  DEFAULT_EDUCATION_LEVEL,
  EDUCATION_LEVELS,
  formatEducationLabel,
  normalizeEducationLevel,
} from "@/lib/profile-education";

describe("profile-education", () => {
  it("maps legacy university years to new labels", () => {
    expect(normalizeEducationLevel("3rd Year")).toBe("University Year 3");
    expect(normalizeEducationLevel("Graduate")).toBe("Graduate / Postgraduate");
  });

  it("keeps K-12 labels as-is", () => {
    expect(normalizeEducationLevel("Elementary (Grades 1–6)")).toBe("Elementary (Grades 1–6)");
    expect(normalizeEducationLevel("High School (Grades 10–12)")).toBe("High School (Grades 10–12)");
  });

  it("hides prefer not to say on public display", () => {
    expect(formatEducationLabel("Prefer not to say")).toBe("");
    expect(formatEducationLabel("University Year 2")).toBe("University Year 2");
  });

  it("defaults empty values", () => {
    expect(normalizeEducationLevel("")).toBe(DEFAULT_EDUCATION_LEVEL);
    expect(EDUCATION_LEVELS.length).toBeGreaterThan(5);
  });
});
