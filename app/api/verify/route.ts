import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { secret?: string; prompt?: string } | null;

  if (!body?.secret) {
    return NextResponse.json({ error: "Missing secret" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { secretKey: body.secret },
    select: {
      id: true,
      username: true,
      plan: true,
      robloxId: true,
      secretPreview: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      plan: user.plan,
      robloxId: user.robloxId,
      secretPreview: user.secretPreview,
    },
    prompt: body.prompt,
  });
}
