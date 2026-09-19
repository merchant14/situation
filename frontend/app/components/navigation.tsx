"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const links = [["/discover", "Discover"], ["/matches", "Matches"], ["/profile/setup", "Profile"]] as const;
export default function Navigation() { const path = usePathname(); return <header className="sticky top-0 z-20 border-b border-rose-100 bg-[#fffaf7]/90 backdrop-blur"><nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8"><Link className="text-xl font-bold tracking-tight text-rose-950" href="/">situationship<span className="text-rose-500">.</span></Link><div className="flex gap-1">{links.map(([href, label]) => <Link className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${path === href ? "bg-rose-100 text-rose-900" : "text-stone-600 hover:bg-stone-100"}`} href={href} key={href}>{label}</Link>)}</div></nav></header>; }
