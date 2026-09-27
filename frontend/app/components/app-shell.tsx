"use client";

import type { ReactNode } from "react";

import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fffaf7]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-rose-950 focus:shadow"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="md:pl-52 lg:pl-64">
        <div
          id="main-content"
          className="mx-auto w-full max-w-5xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 md:px-6 md:pb-12 md:pt-8 lg:px-10 lg:pb-14 lg:pt-10"
        >
          {children}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
