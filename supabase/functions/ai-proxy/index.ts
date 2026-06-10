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

function cleanStringArray(value: unknown, maxItems: number, maxLength: number) {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function uniqueStrings(values: string[], maxItems: number) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLocaleLowerCase("pl").replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, maxItems);
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

function extractJsonObject(value: string) {
  const cleaned = value.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("AI provider returned invalid JSON.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function openRouterCompletion(
  openRouterKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature: number,
  timeoutMs = 60000,
  attempts = 2,
) {
  let lastError = "AI provider request failed.";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
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
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      const responseBody = await response.json().catch(() => null);
      if (!response.ok) {
        lastError = `AI provider request failed with status ${response.status}.`;
        console.error("OpenRouter request failed:", response.status, responseBody);
        continue;
      }

      const content = responseBody?.choices?.[0]?.message?.content;
      const text = typeof content === "string"
        ? content.trim()
        : Array.isArray(content)
        ? content.map((part: { text?: unknown }) => cleanText(part?.text, 12000)).join("\n").trim()
        : "";
      if (text) return text;
      lastError = "AI provider returned an empty response.";
    } catch (error) {
      lastError = error instanceof Error ? error.message : "AI provider request failed.";
      console.error(`OpenRouter attempt ${attempt} failed:`, lastError);
    }
  }

  throw new Error(lastError);
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
  const dietRequest = payload.dietRequest && typeof payload.dietRequest === "object"
    ? payload.dietRequest as Record<string, unknown>
    : null;
  if (messages.length === 0 && !dietRequest) {
    return jsonResponse({ error: "At least one message is required." }, 400, origin);
  }

  const model = Deno.env.get("OPENROUTER_MODEL") || DEFAULT_MODEL;
  try {
    if (route === "diet" && dietRequest) {
      const dayNames = Array.isArray(dietRequest.dayNames)
        ? dietRequest.dayNames.map((day) => cleanText(day, 40)).filter(Boolean).slice(0, 7)
        : [];
      const preferences = cleanText(dietRequest.preferences, 3000);
      if (dayNames.length < 2) {
        return jsonResponse({ error: "A multi-day diet requires at least two days." }, 400, origin);
      }

      const maxSharedIngredients = dayNames.length === 7 ? 18 : 12;
      const maxShoppingItems = dayNames.length === 7 ? 28 : 18;
      const dietPrompt = `
Przygotuj kompletny, spójny jadłospis dla osoby 50+ na dni: ${dayNames.join(", ")}.
${preferences}

Cel: rozsądny kompromis między różnorodnością a krótką listą zakupów.
- Oprzyj cały plan na wspólnej bazie maksymalnie ${maxSharedIngredients} głównych produktów.
- Każde z ${dayNames.length * 3} dań musi mieć inny pomysł; nie powtarzaj identycznych potraw.
- Te same produkty wykorzystuj na różne sposoby, aby ograniczyć marnowanie żywności.
- Nie powtarzaj tego samego głównego źródła białka w dwóch kolejnych obiadach.
- Lista zakupów ma być wspólna dla całego okresu, bez duplikatów i mieć maksymalnie ${maxShoppingItems} pozycji.
- Każdy opis posiłku ma maksymalnie 16 słów.
- Używaj prostych, tanich produktów dostępnych w polskich sklepach.

Zwróć wyłącznie poprawny JSON:
{
  "title": "krótka nazwa całego planu",
  "days": [
    {
      "dayName": "${dayNames[0]}",
      "meals": [
        {"type": "Śniadanie", "content": "krótki konkretny posiłek"},
        {"type": "Obiad", "content": "krótki konkretny posiłek"},
        {"type": "Kolacja", "content": "krótki konkretny posiłek"}
      ]
    }
  ],
  "shopping": ["składnik 1", "składnik 2"]
}
Tablica days musi zawierać dokładnie ${dayNames.length} dni w podanej kolejności.
Każdy dzień musi zawierać dokładnie 3 posiłki: Śniadanie, Obiad i Kolacja.
      `.trim();
      const dietText = await openRouterCompletion(
        openRouterKey,
        model,
        [{ role: "user", content: dietPrompt }],
        dayNames.length === 7 ? 3200 : 1800,
        0.45,
        125000,
        1,
      );
      const parsed = extractJsonObject(dietText) as Record<string, unknown>;
      const parsedDays = Array.isArray(parsed.days) ? parsed.days : [];
      if (parsedDays.length !== dayNames.length) {
        throw new Error("AI provider returned an incomplete multi-day diet.");
      }

      const days = dayNames.map((dayName, index) => {
        const source = parsedDays[index];
        if (!source || typeof source !== "object") {
          throw new Error(`Missing diet for ${dayName}.`);
        }
        const sourceRecord = source as Record<string, unknown>;
        const meals = Array.isArray(sourceRecord.meals)
          ? sourceRecord.meals.slice(0, 3).flatMap((meal) => {
            if (!meal || typeof meal !== "object") return [];
            const candidate = meal as Record<string, unknown>;
            const type = cleanText(candidate.type, 40);
            const content = cleanText(candidate.content, 300);
            return type && content ? [{ type, content }] : [];
          })
          : [];
        if (meals.length !== 3) throw new Error(`Incomplete diet for ${dayName}.`);
        return { dayName, meals };
      });

      const shopping = uniqueStrings(
        cleanStringArray(parsed.shopping, maxShoppingItems, 120),
        maxShoppingItems,
      );
      return jsonResponse({
        plan: {
          title: cleanText(parsed.title, 120) || `Jadłospis na ${dayNames.length} dni`,
          days,
          shopping,
        },
      }, 200, origin);
    }

    const text = await openRouterCompletion(
      openRouterKey,
      model,
      systemInstruction
        ? [{ role: "system", content: systemInstruction }, ...messages]
        : messages,
      route === "diet" ? 1200 : 700,
      route === "diet" ? 0.4 : 0.7,
    );
    return jsonResponse({ text }, 200, origin);
  } catch (error) {
    console.error("AI generation failed:", error);
    return jsonResponse({
      error: route === "diet"
        ? "Nie udało się przygotować kompletnego jadłospisu. Spróbuj ponownie."
        : "AI provider request failed.",
    }, 502, origin);
  }
});
