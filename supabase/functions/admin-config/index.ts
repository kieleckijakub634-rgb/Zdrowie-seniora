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

const ALLOWED_PAYLOAD_KEYS = new Set([
  "videos", "diets", "priceM", "priceY", "promoEnabled", "promoPercent",
  "presaleEnabled", "presalePriceM", "presalePriceY", "announce",
  "modVideos", "modDiets", "modMeds", "modSettings", "modShop",
]);

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

function sanitizePayload(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (ALLOWED_PAYLOAD_KEYS.has(key)) result[key] = entry;
  }
  return JSON.stringify(result).length <= 500_000 ? result : null;
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
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentication required." }, 401, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 503, origin);
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
  const { data: adminRecord, error: adminError } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (adminError) {
    return jsonResponse({ error: "Unable to verify administrator role." }, 503, origin);
  }
  if (!adminRecord) {
    return jsonResponse({ error: "Administrator role required." }, 403, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400, origin);
  }

  if (body.action === "check") {
    return jsonResponse({ isAdmin: true, email: userData.user.email }, 200, origin);
  }

  if (body.action === "stats") {
    const { count, error } = await adminClient
      .from("user_profiles")
      .select("id", { count: "exact", head: true });
    return error
      ? jsonResponse({ error: "Unable to load administrator statistics." }, 503, origin)
      : jsonResponse({ userCount: count || 0 }, 200, origin);
  }

  if (body.action !== "update") {
    return jsonResponse({ error: "Unknown action." }, 400, origin);
  }

  const payload = sanitizePayload(body.payload);
  if (!payload) {
    return jsonResponse({ error: "Invalid or oversized configuration payload." }, 400, origin);
  }

  const { error: updateError } = await adminClient
    .from("vitalfly_data")
    .update({ payload })
    .eq("id", 1);
  return updateError
    ? jsonResponse({ error: "Unable to save global configuration." }, 503, origin)
    : jsonResponse({ saved: true }, 200, origin);
});
