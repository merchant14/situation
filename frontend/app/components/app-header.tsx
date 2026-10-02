"use client";

import Link from "next/link";
import { NavIcon } from "./nav-icons";
import { useProfileIdentity } from "./profile-identity";

export function AppHeader() {
  const profile = useProfileIdentity();

  return (
    <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#eee7e5] bg-[#faf8f8]/95 px-5 backdrop-blur sm:px-8 md:px-7">
      <p className="text-[13px] tracking-[0.02em] text-[#432d26]">Quiet, intentional alignment</p>
      <div className="flex items-center gap-5">
        <Link href="/notifications" aria-label="Notifications" className="relative rounded-full p-2 text-[#39251f] hover:bg-[#f0eded] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f3b]">
          <NavIcon name="notifications" />
        </Link>
        <Link href="/profile" aria-label={profile?.display_name ? `${profile.display_name} profile` : "Your profile"} className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#e8dfdc] bg-[#f0eded] text-sm font-medium text-[#8c3d2b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f3b]">
          {profile?.photo_url ? <img src={profile.photo_url} alt="" className="h-full w-full object-cover" /> : profile?.display_name?.[0]?.toUpperCase() ?? <NavIcon name="profile" />}
        </Link>
      </div>
    </header>
  );
}
