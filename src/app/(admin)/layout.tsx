"use client";

import PersonDetector from "@/components/detect/Detect";
import StudioModal from "@/components/studio/StudioModal";
import { LoadingProvider } from "@/context/LoadingContext";
import { useSidebar } from "@/context/SidebarContext";
import { ToastProvider } from "@/context/ToastContext";
import { useModal } from "@/hooks/useModal";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { SessionProvider } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  const searchParams = useSearchParams();
  const enableStudio = searchParams.get("studio") || null;

  const modalStudio = useModal();

  useEffect(() => {
    if (enableStudio) {
      modalStudio.openModal();
    }
  }, []);

  return (
    <SessionProvider>
      <ToastProvider>
        <LoadingProvider>
          <div className="min-h-screen xl:flex">
            {/* Sidebar and Backdrop */}
            <AppSidebar />
            <Backdrop />
            {/* Main Content Area */}
            <div
              className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
            >
              {/* Header */}
              <AppHeader />
              {/* Page Content */}
              <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
                {children}
                {/* <PersonDetector /> */}
                <StudioModal currentModal={modalStudio} />
              </div>
            </div>
          </div>
        </LoadingProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
