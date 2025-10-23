"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/50 bg-slate-950/75 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-lg">
          IntelliMod Studio
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="#features" className="text-slate-300 hover:text-white">
            Features
          </Link>
          <Link href="#pricing" className="text-slate-300 hover:text-white">
            Pricing
          </Link>
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-blue-500 px-3 py-2 font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-slate-700 px-3 py-2 font-medium text-slate-200 transition hover:bg-slate-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("roblox")}
              disabled={isLoading}
              className="rounded-lg bg-blue-500 px-3 py-2 font-medium text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Loading" : "Sign in with Roblox"}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
