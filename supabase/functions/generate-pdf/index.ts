import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { htmlContent } = await req.json();

    if (!htmlContent) {
      return new Response(
        JSON.stringify({ error: "Missing htmlContent" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");

    if (!browserlessApiKey) {
      return new Response(
        JSON.stringify({
          error: "PDF generation service not configured",
          message: "Please configure BROWSERLESS_API_KEY environment variable"
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch(`https://production-sfo.browserless.io/pdf?token=${browserlessApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: htmlContent,
        options: {
          displayHeaderFooter: false,
          printBackground: true,
          format: "A4",
          margin: {
            top: "0.5in",
            right: "0.5in",
            bottom: "0.5in",
            left: "0.5in",
          },
        },
        gotoOptions: {
          waitUntil: "networkidle2",
          timeout: 60000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Browserless error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "PDF generation failed",
          details: errorText,
          status: response.status,
          apiKeyConfigured: !!browserlessApiKey
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new Response(pdfBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=BlackRaven_Report.pdf",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});