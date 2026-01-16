import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AdminUser {
  email: string;
  password: string;
  username: string;
  role: string;
  permissions: {
    manage_users?: boolean;
    manage_admins?: boolean;
    manage_dossiers?: boolean;
    manage_tickets?: boolean;
    manage_glpi?: boolean;
    view_analytics?: boolean;
    full_access?: boolean;
  };
}

const ADMIN_USERS: AdminUser[] = [
  {
    email: "super_admin@k3pr0s.local",
    password: "SuperAdmin2025!",
    username: "super_admin",
    role: "super_admin",
    permissions: {
      manage_users: true,
      manage_admins: true,
      manage_dossiers: true,
      manage_tickets: true,
      manage_glpi: true,
      view_analytics: true,
      full_access: true,
    },
  },
  {
    email: "admin@k3pr0s.local",
    password: "Admin2025!",
    username: "admin",
    role: "admin",
    permissions: {
      manage_users: false,
      manage_admins: false,
      manage_dossiers: true,
      manage_tickets: false,
      manage_glpi: false,
      view_analytics: true,
      full_access: false,
    },
  },
  {
    email: "support@k3pr0s.local",
    password: "Support2025!",
    username: "support",
    role: "support",
    permissions: {
      manage_users: false,
      manage_admins: false,
      manage_dossiers: false,
      manage_tickets: true,
      manage_glpi: true,
      view_analytics: false,
      full_access: false,
    },
  },
];

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

    console.log("Environment check:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results = [];

    // Step 1: Clean up old test users
    console.log("Step 1: Cleaning up old users...");
    const oldEmails = [
      "super_admin@k3pr0s.local",
      "admin@k3pr0s.local",
      "support@k3pr0s.local",
      "superadmin@k3pr0s.local",
      "super_admin@test.local",
      "admin@test.local",
      "support@test.local",
    ];

    try {
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.error("Error listing users:", listError);
      } else {
        console.log(`Found ${existingUsers?.users?.length || 0} existing users`);

        for (const email of oldEmails) {
          const user = existingUsers?.users?.find((u) => u.email === email);
          if (user) {
            try {
              await supabaseAdmin.from("admin_roles").delete().eq("user_id", user.id);
              await supabaseAdmin.auth.admin.deleteUser(user.id);
              console.log(`Deleted old user: ${email}`);
            } catch (deleteError) {
              console.error(`Error deleting ${email}:`, deleteError);
            }
          }
        }
      }
    } catch (cleanupError) {
      console.error("Cleanup error (non-fatal):", cleanupError);
    }

    // Step 2: Create new users
    console.log("Step 2: Creating new users...");

    for (const adminUser of ADMIN_USERS) {
      console.log(`Creating user: ${adminUser.email}`);

      try {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: adminUser.email,
          password: adminUser.password,
          email_confirm: true,
          user_metadata: {
            username: adminUser.username,
          },
          app_metadata: {
            role: adminUser.role,
          },
        });

        if (createError) {
          console.error(`Error creating ${adminUser.email}:`, createError);
          results.push({
            email: adminUser.email,
            success: false,
            error: createError.message,
            details: JSON.stringify(createError),
          });
          continue;
        }

        if (!newUser?.user) {
          console.error(`User creation failed for ${adminUser.email}: No user returned`);
          results.push({
            email: adminUser.email,
            success: false,
            error: "User creation failed - no user returned",
          });
          continue;
        }

        console.log(`User created successfully: ${adminUser.email} (${newUser.user.id})`);

        // Step 3: Create admin role entry
        const { error: roleError } = await supabaseAdmin
          .from("admin_roles")
          .insert({
            user_id: newUser.user.id,
            role: adminUser.role,
            permissions: adminUser.permissions,
            created_by: newUser.user.id,
          });

        if (roleError) {
          console.error(`Role creation error for ${adminUser.email}:`, roleError);
          results.push({
            email: adminUser.email,
            success: false,
            error: `User created but role assignment failed: ${roleError.message}`,
            user_id: newUser.user.id,
            details: JSON.stringify(roleError),
          });
          continue;
        }

        results.push({
          email: adminUser.email,
          username: adminUser.username,
          password: adminUser.password,
          role: adminUser.role,
          success: true,
          user_id: newUser.user.id,
        });

        console.log(`Successfully created: ${adminUser.email}`);
      } catch (userError) {
        console.error(`Exception creating ${adminUser.email}:`, userError);
        results.push({
          email: adminUser.email,
          success: false,
          error: userError.message || "Unknown error",
          stack: userError.stack,
        });
      }
    }

    // Summary
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount === ADMIN_USERS.length,
        message: `Setup complete: ${successCount} users created, ${failCount} failed`,
        results,
        credentials: results
          .filter((r) => r.success)
          .map((r) => ({
            email: r.email,
            username: r.username,
            password: r.password,
            role: r.role,
          })),
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
