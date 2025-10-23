import { ReactNode } from "react";

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  cta: ReactNode;
  features: string[];
  highlighted?: boolean;
}

const PLAN_FEATURES: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for prototyping and small private experiences.",
    cta: (
      <a
        href="/dashboard"
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:text-white"
      >
        Start for free
      </a>
    ),
    features: [
      "5,000 prompt tokens / month",
      "One Roblox experience",
      "Community support",
    ],
  },
  {
    name: "Creator",
    price: "$19",
    description: "Scale to live experiences with higher limits and analytics.",
    highlighted: true,
    cta: (
      <a
        href="/dashboard"
        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-400"
      >
        Upgrade with Stripe
      </a>
    ),
    features: [
      "100,000 prompt tokens / month",
      "Unlimited experiences",
      "Usage analytics dashboard",
      "Priority support",
    ],
  },
];

export function PricingPlans() {
  return (
    <section id="pricing" className="border-t border-slate-800/50 bg-slate-950/90">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold text-white md:text-4xl">Choose a plan</h2>
          <p className="mt-4 text-base text-slate-300">
            Start with the free tier and upgrade when you are ready. Paid subscriptions are processed securely through Stripe Checkout.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {PLAN_FEATURES.map((plan) => (
            <div
              key={plan.name}
              className={`card flex flex-col gap-6 p-8 ${
                plan.highlighted ? "border-blue-500/40 shadow-blue-500/30" : ""
              }`}
            >
              <div>
                <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{plan.description}</p>
              </div>
              <div className="text-4xl font-bold text-white">{plan.price}
                <span className="text-base font-medium text-slate-400"> / month</span>
              </div>
              <ul className="flex flex-1 flex-col gap-2 text-sm text-slate-200">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div>{plan.cta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
