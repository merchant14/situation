import Link from "next/link";
import { NavIcon } from "./nav-icons";
import type { NavItemConfig } from "./nav-config";

type NavItemProps = { item: NavItemConfig; pathname: string; variant: "sidebar" | "mobile" };

export function NavItem({ item, pathname, variant }: NavItemProps) {
  const active = item.isActive(pathname);
  if (variant === "mobile") {
    return (
      <Link href={item.href} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f3b] ${active ? "text-[#a94f3b]" : "text-[#604d46] hover:text-[#8e3929]"}`}>
        <NavIcon name={item.icon} />
        <span className="max-w-full truncate">{item.label}</span>
      </Link>
    );
  }
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f3b] ${active ? "bg-[#a9513d] text-white shadow-sm" : "text-[#432d26] hover:bg-[#ebe6e5]"}`}>
      <NavIcon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}
