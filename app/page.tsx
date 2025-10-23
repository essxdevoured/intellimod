import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar";
import { FeatureGrid } from "@/components/feature-grid";
import { PricingPlans } from "@/components/pricing-plans";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <FeatureGrid />
        <PricingPlans />
      </main>
      <footer className="border-t border-slate-800/50 bg-slate-950/80 py-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} IntelliMod Studio. Built for the Roblox developer community.
      </footer>
    </>
  );
}
