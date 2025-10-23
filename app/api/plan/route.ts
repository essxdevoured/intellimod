import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, assertStripeConfigured } from "@/lib/stripe";
import { buildSecretPreview, generateSecretKey } from "@/lib/secrets";

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { plan?: string } | null;

  if (!body?.plan) {
    return NextResponse.json({ error: "Missing plan" }, { status: 400 });
  }

  const plan = body.plan.toUpperCase();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      plan: true,
      secretKey: true,
      secretPreview: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      username: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (plan === "ROTATE") {
    const secretKey = generateSecretKey();
    const secretPreview = buildSecretPreview(secretKey);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { secretKey, secretPreview },
      }),
      prisma.secretLog.create({
        data: {
          userId: user.id,
          secretPreview,
          event: "ROTATED",
        },
      }),
    ]);

    revalidatePath("/dashboard");

    return NextResponse.json({ secretKey });
  }

  if (plan === "FREE") {
    const secretKey = user.secretKey ?? generateSecretKey();
    const secretPreview = buildSecretPreview(secretKey);

    const operations: Parameters<typeof prisma.$transaction>[0] = [
      prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "FREE",
          secretKey,
          secretPreview,
        },
      }),
    ];

    if (!user.secretKey) {
      operations.push(
        prisma.secretLog.create({
          data: {
            userId: user.id,
            secretPreview,
            event: "CREATED",
          },
        })
      );
    }

    await prisma.$transaction(operations);

    revalidatePath("/dashboard");

    return NextResponse.json({ secretKey });
  }

  if (plan === "PRO") {
    if (!STRIPE_PRICE_ID) {
      return NextResponse.json({ error: "Stripe price ID is not configured" }, { status: 500 });
    }

    try {
      assertStripeConfigured();
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    if (user.plan === "PRO" && user.stripeSubscriptionId) {
      return NextResponse.json({ message: "Already on the Creator plan" });
    }

    const customerId = user.stripeCustomerId
      ? user.stripeCustomerId
      : await createStripeCustomer(user.id, user.username ?? undefined);

    const session = await stripe!.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${APP_BASE_URL}/dashboard?upgrade=success`,
      cancel_url: `${APP_BASE_URL}/dashboard?upgrade=cancelled`,
      client_reference_id: user.id,
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  }

  return NextResponse.json({ error: "Unsupported plan" }, { status: 400 });
}

async function createStripeCustomer(userId: string, username?: string) {
  const customer = await stripe!.customers.create({
    metadata: { userId },
    name: username,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
