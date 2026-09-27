import type { NavIconName } from "./nav-config";

const iconClass = "h-5 w-5 shrink-0";

export function NavIcon({ name }: { name: NavIconName }) {
  switch (name) {
    case "discover":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3.5 4.8 7.2v9.6L12 20.5l7.2-3.7V7.2L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M12 12.8 4.9 8.9M12 12.8v7.4M12 12.8l7.1-3.9" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "matches":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 20s-6.5-4.2-8.4-8.1C2.4 9.4 3.3 6.5 6 5.7c1.6-.5 3.2.1 4.2 1.4C11.2 5.8 12.8 5.2 14.4 5.7c2.7.8 3.6 3.7 2.4 6.2C18.5 15.8 12 20 12 20Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "messages":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 6.5h14A1.5 1.5 0 0 1 20.5 8v7A1.5 1.5 0 0 1 19 16.5H9.2L4.5 19V8A1.5 1.5 0 0 1 6 6.5H5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "notifications":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6.5 9.5a5.5 5.5 0 1 1 11 0c0 4 1.5 5.5 1.5 5.5H5s1.5-1.5 1.5-5.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "profile":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M5.5 18.5c.8-2.8 3.2-4.3 6.5-4.3s5.7 1.5 6.5 4.3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "settings":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 4.5v1.6M12 17.9v1.6M4.5 12h1.6M17.9 12h1.6M6.7 6.7l1.1 1.1M16.2 16.2l1.1 1.1M17.3 6.7l-1.1 1.1M7.8 16.2l-1.1 1.1"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "logout":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10 12h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="m16 8 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M13 5.5H7.5A2 2 0 0 0 5.5 7.5v9a2 2 0 0 0 2 2H13"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
