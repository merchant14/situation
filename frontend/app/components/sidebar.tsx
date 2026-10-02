"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NavIcon } from "./nav-icons";
import { NavItem } from "./nav-item";
import { primaryNav } from "./nav-config";
import { useProfileIdentity } from "./profile-identity";
import { clearSession } from "../../lib/session";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useProfileIdentity();

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[272px] flex-col border-r border-[#e9e1df] bg-[#f4f1f1] md:flex">
      <Link href="/discover" className="flex items-center gap-3 px-6 pb-7 pt-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#a94f3b]">
        <span className="flex h-10 w-10 items-center justify-center border border-[#eee3df] bg-[#faf8f8] text-[17px] font-serif text-[#a94f3b]">S</span>
        <span className="min-w-0">
          <span className="block whitespace-nowrap font-serif text-[19px] leading-5 tracking-[0.09em] text-[#160f0d]">SITUATIONSHIP</span>
          <span className="mt-1 block whitespace-nowrap text-[10px] tracking-[0.17em] text-[#432d26]">INTENTIONAL ALIGNMENT</span>
        </span>
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col px-4">
        <div className="space-y-1">
          {primaryNav.map((item) => <NavItem key={item.label} item={item} pathname={pathname} variant="sidebar" />)}
        </div>
        <div className="mt-auto space-y-1 border-t border-[#e9e1df] py-4">
          <Link href="/preferences" aria-current={pathname.startsWith("/preferences") ? "page" : undefined} className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] text-[#432d26] hover:bg-[#ebe6e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f3b]"><NavIcon name="settings" />Settings</Link>
          <Link href="/profile" className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] text-[#432d26] hover:bg-[#ebe6e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f3b]"><NavIcon name="safety" />Help &amp; Safety</Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] text-[#432d26] hover:bg-[#ebe6e5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f3b]"><NavIcon name="logout" />Log out</button>
        </div>
        <Link href="/profile" className="mb-5 flex items-center gap-3 rounded-lg bg-[#eeebeb] px-3 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f3b]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e4d9d5] text-sm text-[#7d3829]">
            {profile?.photo_url ? <img src={profile.photo_url} alt="" className="h-full w-full object-cover" /> : profile?.display_name?.[0]?.toUpperCase() ?? <NavIcon name="profile" />}
          </span>
          <span className="min-w-0"><span className="block truncate text-[13px] font-medium text-[#241713]">{profile?.display_name ?? "Your profile"}</span><span className="block text-[11px] text-[#6d5851]">View profile</span></span>
        </Link>
      </nav>
    </aside>
  );
}
