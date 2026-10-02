export type NavItemConfig = {
  href: string;
  label: string;
  icon: NavIconName;
  isActive: (pathname: string) => boolean;
};

export type NavIconName =
  | "discover"
  | "matches"
  | "messages"
  | "notifications"
  | "profile"
  | "settings"
  | "safety"
  | "logout";

export const primaryNav: NavItemConfig[] = [
  {
    href: "/discover",
    label: "Discover",
    icon: "discover",
    isActive: (pathname) => pathname === "/discover" || pathname.startsWith("/discover/"),
  },
  {
    href: "/matches",
    label: "Matches",
    icon: "matches",
    isActive: (pathname) => pathname === "/matches",
  },
  {
    href: "/messages",
    label: "Messages",
    icon: "messages",
    isActive: (pathname) => pathname === "/messages" || pathname.startsWith("/messages/") || /\/matches\/[^/]+\/chat(?:\/|$)/.test(pathname),
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: "notifications",
    isActive: (pathname) => pathname === "/notifications" || pathname.startsWith("/notifications/"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: "profile",
    isActive: (pathname) => pathname === "/profile" || pathname.startsWith("/profile/"),
  },
];

export const settingsNav: NavItemConfig = {
  href: "/preferences",
  label: "Settings",
  icon: "settings",
  isActive: (pathname) => pathname === "/preferences" || pathname.startsWith("/preferences/"),
};
