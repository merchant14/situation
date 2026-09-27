"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { NavIcon } from "./nav-icons";
import { NavItem } from "./nav-item";
import { primaryNav, settingsNav } from "./nav-config";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user_id");
    router.push("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 flex-col border-r border-rose-100 bg-[#fff7f3] md:flex lg:w-64">
      <div className="px-5 pb-4 pt-7 lg:px-6">
        <Link
          href="/discover"
          className="block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-rose-500">Situationship</p>
        </Link>
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col px-3 lg:px-4">
        <div className="space-y-1">
          {primaryNav.map((item) => (
            <NavItem key={item.label} item={item} pathname={pathname} variant="sidebar" />
          ))}
        </div>

        <div className="mt-auto space-y-1 border-t border-rose-100 py-4">
          <NavItem item={settingsNav} pathname={pathname} variant="sidebar" />
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-rose-50 hover:text-rose-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
          >
            <NavIcon name="logout" />
            Logout
          </button>
        </div>
      </nav>
    </aside>
  );
}
