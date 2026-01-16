import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AdminConfig {
  email: string;
  password: string;
  username: string;
  role: string;
  permissions: Record<string, boolean>;
}

const ADMIN_CONFIGS: AdminConfig[] = [
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

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🚀 Starting admin identity fix...");

    const results = [];

    // Étape 1: Lister tous les utilisateurs
    const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    console.log(`📋 Found ${allUsers.users.length} total users`);

    // Étape 2: Pour chaque config admin, vérifier et recréer si nécessaire
    for (const config of ADMIN_CONFIGS) {
      console.log(`\n🔍 Processing ${config.email}...`);

      const existingUser = allUsers.users.find((u) => u.email === config.email);

      if (existingUser) {
        console.log(`  ✅ User exists: ${existingUser.id}`);

        // Vérifier si l'identité existe
        const { data: identities, error: identityError } = await supabaseAdmin
          .from("_supabase_identity_query_helper")
          .select("*")
          .eq("user_id", existingUser.id)
          .eq("provider", "email");

        const hasIdentity = existingUser.identities && existingUser.identities.length > 0;

        if (!hasIdentity) {
          console.log(`  ⚠️ No identity found - will recreate user`);

          // Supprimer l'ancien utilisateur
          try {
            await supabaseAdmin.from("admin_roles").delete().eq("user_id", existingUser.id);
            await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
            console.log(`  🗑️ Deleted broken user`);
          } catch (deleteError) {
            console.error(`  ❌ Delete error:`, deleteError);
          }

          // Recréer l'utilisateur
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: config.email,
            password: config.password,
            email_confirm: true,
            user_metadata: {
              username: config.username,
            },
            app_metadata: {
              role: config.role,
            },
          });

          if (createError) {
            console.error(`  ❌ Create error:`, createError);
            results.push({
              email: config.email,
              success: false,
              error: createError.message,
              action: "recreate_failed",
            });
            continue;
          }

          if (!newUser?.user) {
            results.push({
              email: config.email,
              success: false,
              error: "No user returned",
              action: "recreate_failed",
            });
            continue;
          }

          console.log(`  ✅ User recreated: ${newUser.user.id}`);

          // Créer le rôle admin
          const { error: roleError } = await supabaseAdmin
            .from("admin_roles")
            .insert({
              user_id: newUser.user.id,
              role: config.role,
              permissions: config.permissions,
              created_by: newUser.user.id,
            });

          if (roleError) {
            console.error(`  ⚠️ Role error:`, roleError);
          }

          results.push({
            email: config.email,
            username: config.username,
            password: config.password,
            role: config.role,
            success: true,
            user_id: newUser.user.id,
            action: "recreated_with_identity",
          });
        } else {
          console.log(`  ✅ Identity exists - user is OK`);

          // Mettre à jour le mot de passe au cas où
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: config.password,
          });

          // Vérifier/créer le rôle
          const { data: existingRole } = await supabaseAdmin
            .from("admin_roles")
            .select("*")
            .eq("user_id", existingUser.id)
            .maybeSingle();

          if (!existingRole) {
            await supabaseAdmin
              .from("admin_roles")
              .insert({
                user_id: existingUser.id,
                role: config.role,
                permissions: config.permissions,
                created_by: existingUser.id,
              });
          }

          results.push({
            email: config.email,
            username: config.username,
            password: config.password,
            role: config.role,
            success: true,
            user_id: existingUser.id,
            action: "already_ok_password_updated",
          });
        }
      } else {
        console.log(`  ⚠️ User doesn't exist - creating...`);

        // Créer le nouvel utilisateur
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: config.email,
          password: config.password,
          email_confirm: true,
          user_metadata: {
            username: config.username,
          },
          app_metadata: {
            role: config.role,
          },
        });

        if (createError) {
          console.error(`  ❌ Create error:`, createError);
          results.push({
            email: config.email,
            success: false,
            error: createError.message,
            action: "create_failed",
          });
          continue;
        }

        if (!newUser?.user) {
          results.push({
            email: config.email,
            success: false,
            error: "No user returned",
            action: "create_failed",
          });
          continue;
        }

        console.log(`  ✅ User created: ${newUser.user.id}`);

        // Créer le rôle admin
        const { error: roleError } = await supabaseAdmin
          .from("admin_roles")
          .insert({
            user_id: newUser.user.id,
            role: config.role,
            permissions: config.permissions,
            created_by: newUser.user.id,
          });

        if (roleError) {
          console.error(`  ⚠️ Role error:`, roleError);
        }

        results.push({
          email: config.email,
          username: config.username,
          password: config.password,
          role: config.role,
          success: true,
          user_id: newUser.user.id,
          action: "created_new",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount === ADMIN_CONFIGS.length,
        message: `✅ Fixed ${successCount}/${ADMIN_CONFIGS.length} admin accounts`,
        results,
        credentials: results
          .filter((r) => r.success)
          .map((r) => ({
            email: r.email,
            username: r.username,
            password: r.password,
            role: r.role,
            action: r.action,
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
    console.error("💥 Fatal error:", error);
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
