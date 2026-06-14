"use client";

import { Menu } from "lucide-react";
import { useSidebarLayout } from "@/components/sidebar-layout-context";

export function SidebarCollapseButton() {
  const { collapsed, toggleCollapsed } = useSidebarLayout();

  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      className="hidden md:flex fixed z-40 top-17 h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50 hover:text-gray-900 transition-all duration-300"
      style={{ left: collapsed ? "calc(4rem - 1.125rem)" : "calc(14rem - 1.125rem)" }}
      title={collapsed ? "Expand navigation" : "Collapse navigation"}
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
    >
      <Menu size={18} />
    </button>
  );
}
