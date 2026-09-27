import Link from "next/link";

import { NavIcon } from "./nav-icons";
import type { NavItemConfig } from "./nav-config";

type NavItemProps = {
  item: NavItemConfig;
  pathname: string;
  variant: "sidebar" | "mobile";
};

export function NavItem({ item, pathname, variant }: NavItemProps) {
  const active = item.isActive(pathname);
  const base =
    "flex items-center rounded-xl font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700";

  if (variant === "mobile") {
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`${base} min-w-0 flex-1 flex-col gap-1 px-1 py-1 text-[11px] ${
          active ? "text-rose-800" : "text-stone-500 hover:text-rose-800"
        }`}
      >
        <NavIcon name={item.icon} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`${base} gap-3 px-3 py-2.5 text-sm ${
        active
          ? "bg-rose-100/80 text-rose-950 shadow-sm"
          : "text-stone-600 hover:bg-rose-50 hover:text-rose-950"
      }`}
    >
      <NavIcon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}
