"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const path = usePathname();
  const isAuthPage = path === "/login" || path === "/signup";
  const isLegalPage = path === "/terms" || path === "/privacy";

  return (
    <header className="sticky top-0 z-20 border-b border-rose-100 bg-[#fffaf7]/90 backdrop-blur">
      <nav aria-label="Marketing" className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          className="flex items-center gap-2 rounded-lg text-xl font-bold tracking-tight text-rose-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
          href="/"
          aria-label="Situationship home"
        >
          <img src="/sitationship-logo.svg" alt="Situationship" className="h-9 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          {!isAuthPage || path === "/signup" ? (
            <Link
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 ${
                path === "/login" ? "bg-rose-100 text-rose-900" : "text-stone-600 hover:bg-stone-100"
              }`}
              href="/login"
            >
              Log in
            </Link>
          ) : null}
          {path !== "/signup" ? (
            <Link
              className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isLegalPage
                  ? "bg-[#a9513d] hover:bg-[#913f30] focus-visible:outline-[#873e30]"
                  : "bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-700"
              }`}
              href="/signup"
            >
              Sign up
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
