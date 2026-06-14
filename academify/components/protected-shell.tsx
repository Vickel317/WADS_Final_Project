"use client";

import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { SidebarCollapseButton } from "@/components/sidebar-collapse-button";
import { ProfileModalProvider } from "@/components/profile-modal-provider";
import { SidebarLayoutProvider, useSidebarOffsetClass } from "@/components/sidebar-layout-context";

function MainArea({ children }: { children: React.ReactNode }) {
  const offsetClass = useSidebarOffsetClass();

  return (
    <>
      <SidebarCollapseButton />
      <main
        className={`mt-14 min-h-[calc(100vh-3.5rem)] box-border pt-4 md:pt-5 px-4 md:px-6 pb-6 transition-all duration-300 w-full ml-0 ${offsetClass}`}
      >
        {children}
      </main>
    </>
  );
}

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayoutProvider>
      <Topbar />
      <Sidebar />
      <ProfileModalProvider />
      <MainArea>{children}</MainArea>
    </SidebarLayoutProvider>
  );
}
