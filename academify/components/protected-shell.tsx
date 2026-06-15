"use client";

import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import { SidebarCollapseButton } from "@/components/sidebar-collapse-button";
import { ProfileModalProvider } from "@/components/profile-modal-provider";
import { SidebarLayoutProvider, useSidebarOffsetClass } from "@/components/sidebar-layout-context";
import { usePathname } from "next/navigation";

function MainArea({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const offsetClass = useSidebarOffsetClass();
  const isMessagesRoute = pathname.startsWith("/messages");

  return (
    <>
      <SidebarCollapseButton />
      <main
        className={`mt-14 box-border transition-all duration-300 w-full ml-0 ${offsetClass} ${
          isMessagesRoute
            ? "h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] overflow-hidden pt-4 md:pt-5 px-4 md:px-6 pb-4 md:pb-5 flex flex-col"
            : "min-h-[calc(100vh-3.5rem)] pt-4 md:pt-5 px-4 md:px-6 pb-6"
        }`}
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
