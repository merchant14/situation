import Link from "next/link";
import type { ReactNode } from "react";

type LegalDocumentProps = {
  title: string;
  description: string;
  currentPage: "terms" | "privacy";
  children: ReactNode;
};

const pageLink = "inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9513d]";

export function LegalDocument({ title, description, currentPage, children }: LegalDocumentProps) {
  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-[#fffaf7]">
      <div className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a503f]">Situationship · Draft policy</p>
          <h1 className="mt-4 font-serif text-[clamp(2.5rem,6vw,3.8rem)] leading-[1.06] tracking-[-0.04em] text-[#3b2025]">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#685b56]">{description}</p>
          <p className="mt-3 text-sm text-[#806d67]">Draft prepared 7 October 2026 · Not yet effective; project-owner and legal review required.</p>
        </header>

        <aside className="mt-7 rounded-2xl border border-[#e8d4cc] bg-[#fcf3ef] px-5 py-4 text-sm leading-6 text-[#62453d]" aria-label="Draft status">
          This initial draft describes the current application and identifies open decisions for the project owner. It is not legal advice or a final policy. Resolve the review items on this page before publication.
        </aside>

        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Legal pages">
          <Link href="/terms" aria-current={currentPage === "terms" ? "page" : undefined} className={`${pageLink} ${currentPage === "terms" ? "border-[#a9513d] bg-[#a9513d] text-white hover:bg-[#913f30]" : "border-[#e4d8d2] bg-white text-[#604b44] hover:border-[#c8afa5] hover:bg-[#fdf8f5]"}`}>
            Terms &amp; Conditions
          </Link>
          <Link href="/privacy" aria-current={currentPage === "privacy" ? "page" : undefined} className={`${pageLink} ${currentPage === "privacy" ? "border-[#a9513d] bg-[#a9513d] text-white hover:bg-[#913f30]" : "border-[#e4d8d2] bg-white text-[#604b44] hover:border-[#c8afa5] hover:bg-[#fdf8f5]"}`}>
            Privacy Policy
          </Link>
          <Link href="/signup" className={`${pageLink} border-transparent text-[#913f30] hover:bg-[#f5e9e4]`}>
            Create your profile
          </Link>
        </nav>

        <article className="mt-10 max-w-3xl space-y-9 text-[15px] leading-7 text-[#574843] sm:mt-12 sm:space-y-10 sm:text-base">
          {children}
        </article>

        <footer className="mt-12 border-t border-[#eadfd9] pt-6 text-sm text-[#806d67]">
          These are draft documents. Please review the open project decisions above before relying on or publishing them.
        </footer>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="font-serif text-[1.35rem] leading-tight tracking-[-0.02em] text-[#3b2025] sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

export function ReviewItems({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-2xl border border-[#e5d6ce] bg-[#f7f1ed] p-5 sm:p-6" aria-label="Project-owner decisions before publication">
      <h2 className="font-serif text-xl text-[#3b2025]">Project-owner decisions before publication</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#604b44]">{children}</ul>
    </aside>
  );
}
