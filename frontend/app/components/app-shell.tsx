"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "./app-header";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { ProfileIdentityProvider } from "./profile-identity";
import { getCurrentUserId } from "../../lib/api";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    let resolvingUserId = false;
    const checkSession = async () => {
      if (!sessionStorage.getItem("access_token")) {
        setAuthenticated(false);
        router.replace("/login");
        return;
      }
      const token = sessionStorage.getItem("access_token")!;
      const userId = sessionStorage.getItem("user_id");
      if (userId) { setAuthenticated(true); return; }
      if (resolvingUserId) return;
      resolvingUserId = true;
      try {
        const userId = await getCurrentUserId(token);
        if (active && sessionStorage.getItem("access_token") === token) {
          sessionStorage.setItem("user_id", userId);
          setAuthenticated(true);
        }
      } catch {
        if (active && sessionStorage.getItem("access_token") === token) setAuthenticated(true);
      } finally {
        resolvingUserId = false;
      }
    };
    const onVisibilityChange = () => { if (document.visibilityState === "visible") checkSession(); };
    checkSession();
    window.addEventListener("auth-session-changed", checkSession);
    window.addEventListener("pageshow", checkSession);
    window.addEventListener("popstate", checkSession);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      active = false;
      window.removeEventListener("auth-session-changed", checkSession);
      window.removeEventListener("pageshow", checkSession);
      window.removeEventListener("popstate", checkSession);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);

  if (!authenticated) return <main className="grid min-h-screen place-items-center bg-[#faf8f8]" aria-label="Checking your session"><div className="h-8 w-8 animate-pulse rounded-full bg-[#e8d4ce]"/></main>;

  return (
    <div className="min-h-screen bg-[#faf8f8] text-[#241713]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:shadow-lg">Skip to content</a>
      <ProfileIdentityProvider>
        <Sidebar />
        <div className="min-h-screen md:pl-[272px]">
          <AppHeader />
          <main id="main-content" className="mx-auto w-full max-w-[1440px] px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-7 sm:px-8 md:px-10 md:pb-12 lg:px-14 lg:pt-9">
            {children}
          </main>
        </div>
        <MobileNav />
      </ProfileIdentityProvider>
    </div>
  );
}
