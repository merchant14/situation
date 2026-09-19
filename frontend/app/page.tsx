import Link from "next/link";

export default function Home() {
  return <main className="mx-auto max-w-2xl px-6 py-24"><h1 className="text-4xl font-semibold">Situationship</h1><p className="mt-4 text-stone-600">Connections with clear expectations, for adults only.</p><div className="mt-8 flex flex-wrap gap-4"><Link className="rounded bg-stone-900 px-4 py-3 text-white" href="/signup">Create account</Link><Link className="rounded border px-4 py-3" href="/login">Log in</Link><Link className="rounded border px-4 py-3" href="/discover">Discover</Link></div></main>;
}
