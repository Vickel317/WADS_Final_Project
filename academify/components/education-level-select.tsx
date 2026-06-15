import {
  DEFAULT_EDUCATION_LEVEL,
  EDUCATION_LEVEL_GROUPS,
  normalizeEducationLevel,
} from "@/lib/profile-education";

export function EducationLevelSelect({
  value,
  onChange,
  className,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}) {
  const normalized = normalizeEducationLevel(value);

  return (
    <select
      id={id}
      value={normalized}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {EDUCATION_LEVEL_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </optgroup>
      ))}
      {!EDUCATION_LEVEL_GROUPS.some((group) =>
        (group.options as readonly string[]).includes(normalized)
      ) &&
        normalized &&
        normalized !== DEFAULT_EDUCATION_LEVEL && (
          <option value={normalized}>{normalized}</option>
        )}
    </select>
  );
}
