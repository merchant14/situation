import Link from "next/link";

const features = [
  {
    title: "Be direct",
    description: "Share what kind of connection you want.",
  },
  {
    title: "Discover intentionally",
    description: "See people with preferences, not private details.",
  },
  {
    title: "Stay in control",
    description: "Mutual interest is required before a match.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#fffaf7]">
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14 lg:px-10 lg:pb-24 lg:pt-20">
        <div className="min-w-0 lg:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.19em] text-[#9a503f] sm:text-sm">
            Clear expectations, real connections
          </p>
          <h1 className="mt-5 max-w-[12ch] font-serif text-[clamp(2.8rem,6vw,4.65rem)] leading-[1.04] tracking-[-0.045em] text-[#3b2025]">
            Find a connection that feels right for you.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#685b56] sm:text-lg sm:leading-8">
            An adults-only space for situationships, casual dating, companionship, and connections with intention.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#a9513d] px-6 py-3 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(106,48,35,0.14)] transition hover:bg-[#913f30] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]"
              href="/signup"
            >
              Create your profile
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#dfd2cc] bg-[#fffdfb] px-6 py-3 text-sm font-semibold text-[#513d37] transition hover:border-[#c8afa5] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#873e30]"
              href="/login"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="relative min-w-0 overflow-hidden rounded-[1.75rem] border border-[#eadfd9] bg-[#eee5df] shadow-[0_24px_60px_rgba(65,40,31,0.13)] lg:rounded-[2rem]">
          <img
            src="/landing-connection.jpg"
            alt="Two people sharing a relaxed conversation at a sunlit café table"
            width="1600"
            height="1067"
            fetchPriority="high"
            className="aspect-[1.34/1] w-full object-cover object-center sm:aspect-[1.5/1] lg:aspect-[1.16/1]"
          />
        </div>
      </section>

      <section className="border-y border-[#eee3dd] bg-[#f5efeb]" aria-label="How Situationship works">
        <div className="mx-auto grid max-w-6xl gap-0 px-5 py-4 sm:px-8 md:grid-cols-3 lg:px-10">
          {features.map((feature, index) => (
            <div
              className={`min-w-0 py-6 md:px-6 md:py-7 ${index > 0 ? "border-t border-[#e4d8d2] md:border-l md:border-t-0" : "md:pl-0"} ${index === features.length - 1 ? "md:pr-0" : ""}`}
              key={feature.title}
            >
              <h2 className="font-serif text-[21px] leading-tight tracking-[-0.02em] text-[#3b2025] sm:text-[23px]">
                {feature.title}
              </h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[#685b56] sm:text-[15px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
