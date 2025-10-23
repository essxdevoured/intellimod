const FEATURES = [
  {
    title: "OAuth for Roblox creators",
    description: "Allow experience owners to sign in with Roblox, verify ownership, and manage their API keys securely.",
  },
  {
    title: "Stripe-backed subscriptions",
    description: "Start with a generous free plan or upgrade to unlock higher limits. Billing is handled entirely by Stripe Checkout.",
  },
  {
    title: "Cloudflare Worker endpoint",
    description: "Drop-in worker script validates secret keys and forwards prompts to your AI orchestration layer.",
  },
  {
    title: "Auditable secret rotation",
    description: "Generate, rotate, and revoke secrets that are stored hashed in the database with full audit trails.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="border-t border-slate-800/50 bg-slate-950/80">
      <div className="mx-auto grid max-w-5xl gap-6 px-6 py-20 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="card p-6">
            <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
