import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://vitalfly.pl",
  "https://www.vitalfly.pl",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "capacitor://localhost",
  "http://localhost",
]);

const DEFAULT_PAYMENT_LINKS = {
  monthly: "https://buy.stripe.com/test_8x29AT4Vo2Aq4ESdk19Zm00",
  yearly: "https://buy.stripe.com/test_cNi28rdrU5MCfjwa7P9Zm01",
};

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
      "X-Content-Type-Options": "nosniff",
    },
  });
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 503, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400, origin);
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const plan = body.plan === "yearly" ? "yearly" : "monthly";
  if (
    fullName.length < 3 ||
    fullName.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    phone.length > 40
  ) {
    return jsonResponse({ error: "Invalid registration data." }, 400, origin);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: existingUserId, error: userLookupError } = await adminClient
    .rpc("auth_user_id_by_email", { target_email: email });
  if (userLookupError) {
    console.error("Auth user lookup failed:", userLookupError);
    return jsonResponse({ error: "Could not verify registration data." }, 500, origin);
  }
  if (existingUserId) {
    return jsonResponse({ error: "ACCOUNT_EXISTS" }, 409, origin);
  }

  const registrationId = crypto.randomUUID();
  const { error: pendingError } = await adminClient
    .from("pending_registrations")
    .upsert({
      id: registrationId,
      email,
      email_normalized: email.toLowerCase(),
      full_name: fullName,
      phone,
      plan,
      status: "pending",
      user_id: null,
      stripe_session_id: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      completed_at: null,
    }, { onConflict: "email_normalized" });
  if (pendingError) {
    console.error("Pending registration write failed:", pendingError);
    return jsonResponse({ error: "Could not start registration." }, 500, origin);
  }

  const paymentLinks = {
    monthly: Deno.env.get("STRIPE_PAYMENT_LINK_MONTHLY") || DEFAULT_PAYMENT_LINKS.monthly,
    yearly: Deno.env.get("STRIPE_PAYMENT_LINK_YEARLY") || DEFAULT_PAYMENT_LINKS.yearly,
  };
  const checkoutUrl = new URL(paymentLinks[plan]);
  checkoutUrl.searchParams.set("prefilled_email", email);
  checkoutUrl.searchParams.set("client_reference_id", registrationId);
  return jsonResponse({ url: checkoutUrl.toString() }, 200, origin);
});
