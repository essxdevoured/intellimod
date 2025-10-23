import Link from "next/link";

export function Hero() {
  return (
    <section className="gradient-bg relative overflow-hidden">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-24 text-center">
        <div className="flex flex-col gap-6">
          <span className="mx-auto w-fit rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-blue-200/80">
            Roblox creators + AI
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl">
            Turn your Roblox experience into an AI-powered live service
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            IntelliMod Studio helps you understand player behavior, generate dynamic content, and monetize responsibly with a secure API designed for Roblox experiences.
          </p>
        </div>
        <div className="flex flex-col justify-center gap-4 md:flex-row">
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-500 px-6 py-3 text-base font-semibold text-white shadow-2xl shadow-blue-500/40 transition hover:bg-blue-400"
          >
            Get started
          </Link>
          <a
            href="#pricing"
            className="rounded-xl border border-slate-700 px-6 py-3 text-base font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
          >
            Compare plans
          </a>
        </div>
      </div>
    </section>
  );
}
