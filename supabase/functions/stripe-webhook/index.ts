import { createClient } from "npm:@supabase/supabase-js@2";

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeRequest(secretKey: string, path: string) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || `Stripe request failed (${response.status}).`);
  }
  return data;
}

async function syncStripeSubscription(
  adminClient: ReturnType<typeof createClient>,
  secretKey: string,
  userId: string,
  subscriptionId: string,
  customerId?: string | null,
) {
  const subscription = await stripeRequest(
    secretKey,
    `/subscriptions/${encodeURIComponent(subscriptionId)}?expand[]=items.data.price`,
  );
  const interval = subscription?.items?.data?.[0]?.price?.recurring?.interval;
  const { error } = await adminClient.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: typeof subscription.customer === "string"
      ? subscription.customer
      : customerId || null,
    stripe_subscription_id: subscription.id,
    status: subscription.status || "inactive",
    plan: interval === "year" ? "yearly" : "monthly",
    current_period_end: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
  return subscription;
}

async function findUserIdForSubscription(
  adminClient: ReturnType<typeof createClient>,
  subscription: Record<string, any>,
) {
  const metadataUserId = subscription?.metadata?.supabase_user_id;
  if (typeof metadataUserId === "string" && metadataUserId) return metadataUserId;
  const { data } = await adminClient
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  return data?.user_id || null;
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function secureEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index++) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function verifySignature(payload: string, header: string, secret: string) {
  const parts = header.split(",");
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const expected = hex(digest);
  return signatures.some((signature) => secureEqual(signature, expected));
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response("Server configuration is incomplete", { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  if (!await verifySignature(rawBody, signature, webhookSecret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const object = event?.data?.object || {};
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const userId = object.client_reference_id;
      const subscriptionId = typeof object.subscription === "string"
        ? object.subscription
        : object.subscription?.id;
      if (userId && subscriptionId && object.payment_status !== "unpaid") {
        await syncStripeSubscription(
          adminClient,
          stripeSecret,
          userId,
          subscriptionId,
          typeof object.customer === "string" ? object.customer : null,
        );
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const userId = await findUserIdForSubscription(adminClient, object);
      if (userId) {
        const { error } = await adminClient.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: typeof object.customer === "string" ? object.customer : null,
          stripe_subscription_id: object.id,
          status: object.status || "inactive",
          plan: object?.items?.data?.[0]?.price?.recurring?.interval === "year"
            ? "yearly"
            : "monthly",
          current_period_end: object.current_period_end
            ? new Date(object.current_period_end * 1000).toISOString()
            : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (error) throw error;
      }
    }
  } catch (error) {
    console.error("Stripe event processing failed:", error);
    return new Response("Event processing failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
