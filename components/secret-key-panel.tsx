"use client";

import { useState } from "react";

interface SecretKeyPanelProps {
  secretKey?: string | null;
  username?: string | null;
}

export function SecretKeyPanel({ secretKey, username }: SecretKeyPanelProps) {
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayKey, setDisplayKey] = useState(secretKey ?? "");

  async function handleRotate() {
    setError(null);
    setRotating(true);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: "ROTATE" }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to rotate secret");
      }

      const data = await response.json();
      setDisplayKey(data.secretKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="card flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white">Secret management</h2>
        <p className="text-sm text-slate-300">
          Share this key only with trusted Roblox servers. Requests from your Cloudflare Worker must include it in the <code className="rounded bg-slate-900 px-1.5 py-0.5 text-xs text-blue-200">x-intellimod-secret</code> header.
        </p>
      </div>
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.4em] text-slate-400">Secret key</p>
        <p className="mt-2 break-all font-mono text-sm text-blue-100">
          {displayKey ? displayKey : "Generate a plan to see your secret"}
        </p>
        {username && (
          <p className="mt-2 text-xs text-slate-500">Linked Roblox username: <span className="font-semibold text-slate-200">{username}</span></p>
        )}
      </div>
      <div className="flex flex-col gap-3 text-sm text-slate-300 md:flex-row md:items-center md:justify-between">
        <button
          onClick={handleRotate}
          disabled={rotating}
          className="w-full rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
        >
          {rotating ? "Rotating secret..." : displayKey ? "Rotate secret" : "Generate secret"}
        </button>
        <p className="text-xs text-slate-500">
          Rotation invalidates the previous secret immediately.
        </p>
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </div>
  );
}
