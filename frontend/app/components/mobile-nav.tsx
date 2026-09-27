"use client";

import { usePathname } from "next/navigation";

import { NavItem } from "./nav-item";
import { primaryNav } from "./nav-config";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-rose-100 bg-[#fffaf7]/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-1 px-2 py-2">
        {primaryNav.map((item) => (
          <NavItem key={item.label} item={item} pathname={pathname} variant="mobile" />
        ))}
      </div>
    </nav>
  );
}
