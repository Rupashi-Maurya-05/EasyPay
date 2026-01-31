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
    const { imageBase64, language = "en-US" } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Clean base64 string if it has data URL prefix
    let cleanBase64 = imageBase64;
    if (imageBase64.includes(",")) {
      cleanBase64 = imageBase64.split(",")[1];
    }

    // Determine the language for the response
    const languageMap: Record<string, string> = {
      "en-US": "English",
      "hi-IN": "Hindi",
      "ta-IN": "Tamil",
      "te-IN": "Telugu",
      "bn-IN": "Bengali",
      "mr-IN": "Marathi",
    };

    const targetLanguage = languageMap[language] || "English";

    const systemPrompt = `You are an OCR assistant helping people with visual impairments and disabilities read documents.

Your job is to:
1. Extract ALL text visible in the image
2. Organize it clearly (maintain the structure if it's a form or receipt)
3. If it's a banking document, identify key information like:
   - Account numbers (partially mask them for safety, show only last 4 digits)
   - Transaction amounts
   - Dates
   - Reference numbers
4. If there are handwritten elements, try to read them
5. If any part is unclear, mention it

After extracting the text, provide a brief summary of what the document appears to be.

Respond in ${targetLanguage}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Please read and extract all text from this image. Tell me what you see." },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:image/jpeg;base64,${cleanBase64}` 
                } 
              }
            ]
          },
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
        JSON.stringify({ error: "Failed to process image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || "Could not read the image. Please try with a clearer photo.";

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedText,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("process-ocr error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
