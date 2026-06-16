"use client";

import { createContext, useContext, useState } from "react";

export const SIDEBAR_WIDTH_EXPANDED = "14rem";
export const SIDEBAR_WIDTH_COLLAPSED = "4rem";

type SidebarLayoutContextValue = {
  collapsed: boolean;
  mobileOpen: boolean;
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
  toggleCollapsed: () => void;
  toggleMobileOpen: () => void;
};

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null);

export function SidebarLayoutProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarLayoutContext.Provider
      value={{
        collapsed,
        mobileOpen,
        setCollapsed,
        setMobileOpen,
        toggleCollapsed: () => setCollapsed((prev) => !prev),
        toggleMobileOpen: () => setMobileOpen((prev) => !prev),
      }}
    >
      {children}
    </SidebarLayoutContext.Provider>
  );
}

export function useSidebarLayout() {
  const context = useContext(SidebarLayoutContext);
  if (!context) {
    throw new Error("useSidebarLayout must be used within SidebarLayoutProvider");
  }
  return context;
}

export function useSidebarOffsetClass() {
  const { collapsed } = useSidebarLayout();
  return collapsed
    ? "md:ml-16 md:w-[calc(100%-4rem)] md:max-w-[calc(100%-4rem)]"
    : "md:ml-56 md:w-[calc(100%-14rem)] md:max-w-[calc(100%-14rem)]";
}
