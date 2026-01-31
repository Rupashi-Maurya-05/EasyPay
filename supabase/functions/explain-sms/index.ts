import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { smsText, language = "en-US" } = await req.json();

    if (!smsText || typeof smsText !== "string") {
      return new Response(
        JSON.stringify({ error: "SMS text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine the language for the explanation
    const languageMap: Record<string, string> = {
      "en-US": "simple English",
      "hi-IN": "simple Hindi (हिंदी)",
      "ta-IN": "simple Tamil (தமிழ்)",
      "te-IN": "simple Telugu (తెలుగు)",
      "bn-IN": "simple Bengali (বাংলা)",
      "mr-IN": "simple Marathi (मराठी)",
    };

    const targetLanguage = languageMap[language] || "simple English";

    const systemPrompt = `You are a helpful assistant that explains banking SMS messages to people with intellectual disabilities, elderly people, and those with limited financial literacy.

Your job is to:
1. Explain what the SMS message means in very simple, clear language
2. Use short sentences (5-10 words each)
3. Avoid technical banking terms - use everyday words instead
4. If it's about money being taken out, say "Money was taken from your account"
5. If it's about money being added, say "Money was added to your account"
6. If there's an OTP/code, warn them to never share it with anyone
7. If there's a balance, explain it as "You have X rupees in your account"
8. End with a simple safety tip if relevant

Respond in ${targetLanguage}. Keep your response under 100 words.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please explain this banking SMS in simple words:\n\n"${smsText}"` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to process message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "I could not understand this message. Please visit your bank for help.";

    return new Response(
      JSON.stringify({ 
        success: true, 
        explanation,
        originalText: smsText 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("explain-sms error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
