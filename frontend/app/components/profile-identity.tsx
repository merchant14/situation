"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest } from "../../lib/api";

export type ProfileIdentity = { display_name?: string; photo_url?: string | null };
const ProfileIdentityContext = createContext<ProfileIdentity | null>(null);

export function ProfileIdentityProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileIdentity | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      const token = sessionStorage.getItem("access_token");
      if (!token) return;
      apiRequest<ProfileIdentity>("/profile/me/", { headers: { Authorization: `Bearer ${token}` } })
        .then((data) => { if (active) setProfile(data); })
        .catch(() => undefined);
    };
    load();
    window.addEventListener("profile-updated", load);
    return () => {
      active = false;
      window.removeEventListener("profile-updated", load);
    };
  }, []);

  return <ProfileIdentityContext.Provider value={profile}>{children}</ProfileIdentityContext.Provider>;
}

export function useProfileIdentity() {
  return useContext(ProfileIdentityContext);
}
