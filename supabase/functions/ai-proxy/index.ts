import { createClient } from "npm:@supabase/supabase-js@2";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemma-3-27b-it";
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

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeMessages(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(-12).flatMap((message) => {
    if (!message || typeof message !== "object") return [];
    const candidate = message as Record<string, unknown>;
    const role = candidate.role === "assistant" || candidate.role === "model"
      ? "assistant"
      : "user";

    let content = cleanText(candidate.content ?? candidate.text, 6000);
    if (!content && Array.isArray(candidate.parts)) {
      content = candidate.parts
        .map((part) => cleanText(
          part && typeof part === "object"
            ? (part as Record<string, unknown>).text
            : "",
          3000,
        ))
        .filter(Boolean)
        .join("\n")
        .slice(0, 6000);
    }

    return content ? [{ role, content }] : [];
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

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentication required." }, 401, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !openRouterKey) {
    console.error("Required Edge Function secrets are missing.");
    return jsonResponse({ error: "AI service is not configured." }, 503, origin);
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
  const { data: quotaAllowed, error: quotaError } = await adminClient.rpc(
    "consume_ai_quota",
    { requested_user_id: userData.user.id },
  );
  if (quotaError) {
    console.error("AI quota check failed:", quotaError.message);
    return jsonResponse({ error: "Unable to verify AI usage limit." }, 503, origin);
  }
  if (!quotaAllowed) {
    return jsonResponse({ error: "Daily AI request limit reached." }, 429, origin);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400, origin);
  }

  const route = payload.route === "diet" ? "diet" : "chat";
  const systemInstruction = cleanText(payload.systemInstructionText, 12000);
  const messages = normalizeMessages(payload.messages);
  if (messages.length === 0) {
    return jsonResponse({ error: "At least one message is required." }, 400, origin);
  }

  const model = Deno.env.get("OPENROUTER_MODEL") || DEFAULT_MODEL;
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://vitalfly.pl/",
      "X-Title": "VitalFly",
    },
    body: JSON.stringify({
      model,
      messages: systemInstruction
        ? [{ role: "system", content: systemInstruction }, ...messages]
        : messages,
      max_tokens: route === "diet" ? 1800 : 700,
      temperature: route === "diet" ? 0.4 : 0.7,
    }),
  });

  const responseBody = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("OpenRouter request failed:", response.status, responseBody);
    return jsonResponse({ error: "AI provider request failed." }, 502, origin);
  }

  const content = responseBody?.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content.trim()
    : Array.isArray(content)
    ? content.map((part: { text?: unknown }) => cleanText(part?.text, 12000)).join("\n").trim()
    : "";

  return text
    ? jsonResponse({ text }, 200, origin)
    : jsonResponse({ error: "AI provider returned an empty response." }, 502, origin);
});
