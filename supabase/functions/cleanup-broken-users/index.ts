import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("Starting forced cleanup of broken auth users...");

    let allUsers;
    try {
      const response = await supabaseAdmin.auth.admin.listUsers();
      if (response.error) {
        console.error("Error listing users:", response.error);
        throw new Error(`Failed to list users: ${response.error.message}`);
      }
      allUsers = response.data;
    } catch (err) {
      console.error("Exception listing users:", err);
      throw new Error(`Exception while listing users: ${err.message}`);
    }

    console.log(`Found ${allUsers?.users?.length || 0} total users`);

    const brokenEmails = [
      "super_admin@blackraven.local",
      "admin@blackraven.local",
      "support@blackraven.local",
      "superadmin@blackraven.local",
      "super_admin@test.local",
      "admin@test.local",
      "support@test.local",
    ];

    const deletedUsers = [];
    const errors = [];

    for (const user of allUsers?.users || []) {
      if (brokenEmails.includes(user.email || "")) {
        console.log(`Deleting broken user: ${user.email} (${user.id})`);

        try {
          await supabaseAdmin.from("admin_roles").delete().eq("user_id", user.id);
          console.log(`Deleted admin_roles for: ${user.email}`);
        } catch (roleError) {
          console.error(`Error deleting admin_roles for ${user.email}:`, roleError);
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
          console.error(`Failed to delete ${user.email}:`, deleteError);
          errors.push({
            email: user.email,
            error: deleteError.message,
          });
        } else {
          console.log(`Successfully deleted: ${user.email}`);
          deletedUsers.push({
            email: user.email,
            user_id: user.id,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        message: `Cleanup complete: ${deletedUsers.length} users deleted, ${errors.length} errors`,
        deleted: deletedUsers,
        errors: errors,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
