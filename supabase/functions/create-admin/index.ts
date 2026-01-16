import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUser?.users?.some(
      (u) => u.email === "superadmin@blackraven.local"
    );

    if (adminExists) {
      const adminUser = existingUser?.users?.find(
        (u) => u.email === "superadmin@blackraven.local"
      );

      if (adminUser) {
        await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
          password: "SuperAdmin2025",
          email_confirm: true,
          user_metadata: { username: "superadmin" },
          app_metadata: {
            role: "super_admin",
            is_super_admin: true
          },
        });

        const { data: existingRole } = await supabaseAdmin
          .from("admin_roles")
          .select("*")
          .eq("user_id", adminUser.id)
          .maybeSingle();

        if (!existingRole) {
          await supabaseAdmin
            .from("admin_roles")
            .insert({
              user_id: adminUser.id,
              role: "super_admin",
              permissions: {
                manage_users: true,
                manage_tickets: true,
                manage_dossiers: true,
                manage_admins: true,
                view_analytics: true,
                manage_glpi: true
              }
            });
        } else {
          await supabaseAdmin
            .from("admin_roles")
            .update({
              role: "super_admin",
              permissions: {
                manage_users: true,
                manage_tickets: true,
                manage_dossiers: true,
                manage_admins: true,
                view_analytics: true,
                manage_glpi: true
              }
            })
            .eq("user_id", adminUser.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Super admin updated successfully",
            credentials: {
              email: "superadmin@blackraven.local",
              password: "SuperAdmin2025",
              username: "superadmin"
            },
            user: {
              id: adminUser.id,
              email: adminUser.email,
              username: "superadmin",
            },
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: "superadmin@blackraven.local",
      password: "SuperAdmin2025",
      email_confirm: true,
      user_metadata: { username: "superadmin" },
      app_metadata: {
        role: "super_admin",
        is_super_admin: true
      },
    });

    if (createError) {
      throw createError;
    }

    if (!newUser.user) {
      throw new Error("User creation failed");
    }

    const { error: roleError } = await supabaseAdmin
      .from("admin_roles")
      .insert({
        user_id: newUser.user.id,
        role: "super_admin",
        permissions: {
          manage_users: true,
          manage_tickets: true,
          manage_dossiers: true,
          manage_admins: true,
          view_analytics: true,
          manage_glpi: true
        }
      });

    if (roleError) {
      console.error("Role creation error:", roleError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Super admin created successfully",
        credentials: {
          email: "superadmin@blackraven.local",
          password: "SuperAdmin2025",
          username: "superadmin"
        },
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          username: "superadmin",
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
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
