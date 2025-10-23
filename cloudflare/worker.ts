export interface Env {
  INTELLIMOD_API_URL: string;
  AI: {
    invoke: (model: string, input: unknown) => Promise<unknown>;
  };
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const payload = (await request
      .json()
      .catch(() => ({} as Record<string, unknown>))) as Record<string, unknown>;
    const secret = payload.secret;
    const prompt = payload.prompt;

    if (typeof secret !== "string" || typeof prompt !== "string") {
      return Response.json({ error: "secret and prompt are required" }, { status: 400 });
    }

    const verifyResponse = await fetch(`${env.INTELLIMOD_API_URL}/api/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ secret, prompt }),
    });

    if (!verifyResponse.ok) {
      return new Response(verifyResponse.body, { status: verifyResponse.status });
    }

    const verification = await verifyResponse.json();

    const aiResult = await env.AI.invoke("@cf/meta/llama-3-8b-instruct", {
      messages: [
        { role: "system", content: "You are a Roblox assistant that produces G-rated responses." },
        { role: "user", content: prompt },
      ],
    });

    return Response.json({
      verification,
      aiResult,
    });
  },
};
