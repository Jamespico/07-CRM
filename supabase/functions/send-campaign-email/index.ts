// Supabase Edge Function: send-campaign-email
// Serves as the email dispatch engine integrating with Resend free tier API,
// with graceful fallback to recording campaign logs in Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing.")
    }

    const { campaignId, recipients, subject, bodyHtml } = await req.json()

    if (!campaignId || !Array.isArray(recipients)) {
      throw new Error("Missing required parameters: campaignId and recipients array.")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const results = []

    for (const recipient of recipients) {
      const personalizedBody = (bodyHtml || "").replace(
        /\{\{\s*name\s*\}\}/gi,
        recipient.name || "Valued Contact"
      )

      let emailStatus = "Simulated"

      if (RESEND_API_KEY && recipient.email) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "07 CRM <onboarding@resend.dev>",
              to: [recipient.email],
              subject: subject || "Notification from 07 CRM",
              html: personalizedBody,
            }),
          })

          if (res.ok) {
            emailStatus = "Sent"
          } else {
            const errData = await res.json().catch(() => ({}))
            console.error("Resend API returned error:", errData)
            emailStatus = "Failed"
          }
        } catch (resendErr) {
          console.error("Resend delivery failed, falling back to simulated status:", resendErr)
          emailStatus = "Failed"
        }
      }

      // Record entry in campaign_logs
      const { data: logData, error: logError } = await supabase
        .from("campaign_logs")
        .insert({
          campaign_id: campaignId,
          contact_id: recipient.id,
          status: emailStatus,
          opened: false,
          clicked: false,
          sent_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (logError) {
        console.error("Failed to insert campaign log:", logError)
      } else {
        results.push(logData)
      }
    }

    return new Response(
      JSON.stringify({ success: true, dispatchedCount: results.length, logs: results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
