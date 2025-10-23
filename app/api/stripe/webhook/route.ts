import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { buildSecretPreview, generateSecretKey } from "@/lib/secrets";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!stripe || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 500 });
  }

  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!session.client_reference_id || !session.subscription) {
    return;
  }

  const userId = session.client_reference_id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { secretKey: true },
  });

  const secretKey = generateSecretKey();
  const secretPreview = buildSecretPreview(secretKey);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        plan: "PRO",
        secretKey,
        secretPreview,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId ?? undefined,
      },
    }),
    prisma.secretLog.create({
      data: {
        userId,
        secretPreview,
        event: existing?.secretKey ? "ROTATED" : "CREATED",
      },
    }),
  ]);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    return;
  }

  if (subscription.status === "active") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: "PRO",
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
      },
    });
  } else if (subscription.status === "canceled" || subscription.status === "past_due") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: "FREE",
        stripeSubscriptionId: null,
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "FREE",
      stripeSubscriptionId: null,
    },
  });
}
