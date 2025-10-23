import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { Navbar } from "@/components/navbar";
import { PlanSelector } from "@/components/plan-selector";
import { SecretKeyPanel } from "@/components/secret-key-panel";
import { StatusPill } from "@/components/status-pill";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard • IntelliMod Studio",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      plan: true,
      secretKey: true,
      secretPreview: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
        <header className="flex flex-col gap-4">
          <StatusPill color={user.plan === "PRO" ? "emerald" : "slate"}>
            {user.plan === "PRO" ? "Creator Plan" : "Free Plan"}
          </StatusPill>
          <h1 className="text-3xl font-semibold text-white">Welcome back{user.username ? `, ${user.username}` : ""}</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Manage your subscription, rotate secrets, and monitor integrations. Use the Cloudflare Worker snippet below to validate requests coming from your Roblox experiences.
          </p>
        </header>
        <section className="grid gap-6">
          <PlanSelector currentPlan={user.plan} hasSecret={Boolean(user.secretKey)} />
          <SecretKeyPanel secretKey={user.secretKey} username={user.username} />
          <IntegrationSnippet secretPreview={user.secretPreview ?? undefined} />
        </section>
      </main>
    </>
  );
}

function IntegrationSnippet({ secretPreview }: { secretPreview?: string }) {
  return (
    <div className="card flex flex-col gap-4 p-6">
      <h2 className="text-xl font-semibold text-white">Cloudflare Worker quick start</h2>
      <p className="text-sm text-slate-300">
        Deploy the following Worker to authenticate requests from your Roblox experience. The worker validates your secret key against the IntelliMod API before forwarding the prompt to your AI stack.
      </p>
      <pre className="overflow-auto rounded-lg border border-slate-800 bg-slate-950/80 p-4 text-xs leading-relaxed text-blue-100">
        <code>{`export default {
  async fetch(request, env) {
    const { secret, prompt } = await request.json();

    const verify = await fetch("https://your-domain.com/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ secret, prompt }),
    });

    if (!verify.ok) {
      return new Response(JSON.stringify({ error: "Invalid secret" }), { status: 401 });
    }

    const { user } = await verify.json();

    // TODO: call your AI model(s) here
    const result = await env.AI.invoke("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "system", content: "You are a Roblox game designer assistant." },
        { role: "user", content: prompt },
      ],
    });

    return Response.json({
      username: user.username,
      plan: user.plan,
      preview: "${secretPreview ?? "ims_xxxx"}",
      result,
    });
  },
};`}</code>
      </pre>
      <p className="text-xs text-slate-500">
        Replace <code className="rounded bg-slate-900 px-1.5 py-0.5 text-[0.7rem] text-blue-200">https://your-domain.com</code> with your deployed IntelliMod instance and pass the full secret key from the panel above.
      </p>
    </div>
  );
}
