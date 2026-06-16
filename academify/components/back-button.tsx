"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { canNavigateBack } from "@/lib/navigation";

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  className?: string;
};

export function useSmartBack(fallbackHref = "/events") {
  const router = useRouter();

  return () => {
    if (canNavigateBack()) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };
}

export default function BackButton({
  fallbackHref = "/events",
  label = "Back",
  className = "inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50",
}: BackButtonProps) {
  const goBack = useSmartBack(fallbackHref);

  return (
    <button type="button" onClick={goBack} className={className}>
      <ChevronLeft size={16} aria-hidden />
      {label}
    </button>
  );
}
