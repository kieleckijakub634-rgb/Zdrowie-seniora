import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://vitalfly.pl",
  "https://www.vitalfly.pl",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://127.0.0.2:4173",
  "http://127.0.0.3:4173",
  "capacitor://localhost",
  "http://localhost",
]);
const STRIPE_API = "https://api.stripe.com/v1";

async function stripeRequest(
  secretKey: string,
  path: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(options.headers || {}),
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

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin)
      ? origin
      : "https://vitalfly.pl",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function hasAccess(status: string | undefined, periodEnd: string | null | undefined) {
  if (!["active", "trialing"].includes(status || "")) return false;
  return !periodEnd || new Date(periodEnd).getTime() > Date.now();
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, origin);
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "Origin not allowed." }, 403, origin);
  }

  const authorization = request.headers.get("authorization");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey || !stripeSecret) {
    return jsonResponse({ error: "Authentication or server configuration missing." }, 401, origin);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: "Invalid or expired session." }, 401, origin);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const [{ data: adminRecord }, { data: subscription }] = await Promise.all([
    adminClient.from("admin_users").select("user_id").eq("user_id", userData.user.id).maybeSingle(),
    adminClient.from("subscriptions").select("*").eq("user_id", userData.user.id).maybeSingle(),
  ]);

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {}

  if (body.action === "verify-checkout") {
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
    if (!/^cs_test_[A-Za-z0-9_]+$/.test(sessionId)) {
      return jsonResponse({ error: "Invalid test Checkout Session ID." }, 400, origin);
    }
    const checkout = await stripeRequest(
      stripeSecret,
      `/checkout/sessions/${encodeURIComponent(sessionId)}`,
    );
    if (checkout.client_reference_id !== userData.user.id) {
      return jsonResponse({ error: "Checkout Session belongs to another user." }, 403, origin);
    }
    if (checkout.payment_status === "unpaid" || !checkout.subscription) {
      return jsonResponse({ error: "Payment has not been confirmed." }, 409, origin);
    }
    await syncStripeSubscription(
      adminClient,
      stripeSecret,
      userData.user.id,
      typeof checkout.subscription === "string"
        ? checkout.subscription
        : checkout.subscription.id,
      typeof checkout.customer === "string" ? checkout.customer : null,
    );
  }

  if (body.action === "portal") {
    const customerId = subscription?.stripe_customer_id;
    if (!customerId) {
      return jsonResponse({ error: "No Stripe customer is linked to this account." }, 409, origin);
    }
    const form = new URLSearchParams({
      customer: customerId,
      return_url: "https://vitalfly.pl/",
    });
    const portal = await stripeRequest(stripeSecret, "/billing_portal/sessions", {
      method: "POST",
      body: form,
    });
    return jsonResponse({ url: portal.url }, 200, origin);
  }

  const { data: refreshedSubscription } = await adminClient
    .from("subscriptions")
    .select("*")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  const current = refreshedSubscription || subscription;

  return jsonResponse({
    isAdmin: Boolean(adminRecord),
    hasAccess: Boolean(adminRecord) || hasAccess(current?.status, current?.current_period_end),
    subscription: current
      ? {
          status: current.status,
          plan: current.plan,
          currentPeriodEnd: current.current_period_end,
        }
      : null,
  }, 200, origin);
});
