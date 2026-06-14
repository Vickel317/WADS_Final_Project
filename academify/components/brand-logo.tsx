import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  showName?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function BrandLogo({
  href = "/dashboard",
  showName = true,
  size = "md",
  className = "",
}: BrandLogoProps) {
  const imageSize = size === "sm" ? 28 : 32;

  const content = (
    <>
      <Image
        src="/logo.png"
        alt="Academify logo"
        width={imageSize}
        height={imageSize}
        className="rounded-full shrink-0"
        priority
      />
      {showName && (
        <span
          className={`font-bold text-gray-800 truncate ${size === "sm" ? "text-sm" : "text-base"}`}
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Academify
        </span>
      )}
    </>
  );

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 min-w-0 hover:opacity-90 transition ${className}`}
    >
      {content}
    </Link>
  );
}
