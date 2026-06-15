import Link from "next/link";

export function AdminBackLink({
  href = "/admin",
  label = "Back to admin panel",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      ← {label}
    </Link>
  );
}
