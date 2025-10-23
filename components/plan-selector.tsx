"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PlanSelectorProps {
  currentPlan?: "FREE" | "PRO";
  hasSecret: boolean;
}

export function PlanSelector({ currentPlan = "FREE", hasSecret }: PlanSelectorProps) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(plan: "FREE" | "PRO") {
    setError(null);
    setLoadingPlan(plan);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update plan");
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="card flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white">Plan & Limits</h2>
        <p className="text-sm text-slate-300">
          Choose a subscription tier. You can upgrade or downgrade at any time and keep your existing secret key.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <PlanCard
          title="Free"
          description="Prototype your integrations with 5k monthly prompt tokens."
          priceLabel="$0"
          isCurrent={currentPlan === "FREE"}
          onSelect={() => handleSelect("FREE")}
          loading={loadingPlan === "FREE"}
        />
        <PlanCard
          title="Creator"
          description="Unlock higher rate limits, team seats, and analytics."
          priceLabel="$19"
          isCurrent={currentPlan === "PRO"}
          onSelect={() => handleSelect("PRO")}
          loading={loadingPlan === "PRO"}
          highlighted
        />
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {hasSecret ? (
        <p className="text-xs text-slate-400">
          Secrets can be regenerated from the panel below. Rotation immediately invalidates old keys.
        </p>
      ) : (
        <p className="text-xs text-slate-400">
          Generate a secret key after selecting a plan to authenticate requests from your Roblox experiences.
        </p>
      )}
    </div>
  );
}

interface PlanCardProps {
  title: string;
  description: string;
  priceLabel: string;
  isCurrent: boolean;
  loading?: boolean;
  highlighted?: boolean;
  onSelect: () => void;
}

function PlanCard({ title, description, priceLabel, isCurrent, loading, highlighted, onSelect }: PlanCardProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-5 transition ${
        highlighted
          ? "border-blue-500/60 bg-blue-500/10"
          : "border-slate-700/70 bg-slate-900/70"
      } ${isCurrent ? "ring-2 ring-blue-500/60" : ""}`}
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-300">{description}</p>
      </div>
      <div className="text-3xl font-bold text-white">{priceLabel}<span className="text-base font-medium text-slate-400"> / month</span></div>
      <button
        className={`mt-auto rounded-lg px-4 py-2 text-sm font-semibold transition ${
          highlighted ? "bg-blue-500 text-white hover:bg-blue-400" : "bg-slate-800 text-slate-100 hover:bg-slate-700"
        } disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={onSelect}
        disabled={isCurrent || loading}
      >
        {isCurrent ? "Current plan" : loading ? "Working..." : "Select plan"}
      </button>
    </div>
  );
}
