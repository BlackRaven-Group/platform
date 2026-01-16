import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AdminUser {
  email: string;
  password: string;
  username: string;
  role: 'super_admin' | 'admin' | 'support' | 'viewer';
  permissions: {
    manage_users?: boolean;
    manage_tickets?: boolean;
    manage_dossiers?: boolean;
    manage_admins?: boolean;
    view_analytics?: boolean;
    manage_glpi?: boolean;
    full_access?: boolean;
  };
}

const DEFAULT_ADMINS: AdminUser[] = [
  {
    email: "superadmin@blackraven.io",
    password: "BlackRaven2024!",
    username: "superadmin",
    role: "super_admin",
    permissions: {
      manage_users: true,
      manage_tickets: true,
      manage_dossiers: true,
      manage_admins: true,
      view_analytics: true,
      manage_glpi: true,
      full_access: true,
    },
  },
  {
    email: "admin@blackraven.io",
    password: "Admin2024!",
    username: "admin",
    role: "admin",
    permissions: {
      manage_users: true,
      manage_tickets: true,
      manage_dossiers: true,
      manage_admins: false,
      view_analytics: true,
      manage_glpi: false,
      full_access: false,
    },
  },
  {
    email: "support@blackraven.io",
    password: "Support2024!",
    username: "support",
    role: "support",
    permissions: {
      manage_users: false,
      manage_tickets: true,
      manage_dossiers: false,
      manage_admins: false,
      view_analytics: false,
      manage_glpi: false,
      full_access: false,
    },
  },
];

async function createOrUpdateAdmin(
  supabaseAdmin: any,
  admin: AdminUser
): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email === admin.email
    );

    let userId: string;

    if (existingUser) {
      // Update existing user
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: admin.password,
        email_confirm: true,
        user_metadata: { username: admin.username },
        app_metadata: {
          role: admin.role,
          is_super_admin: admin.role === "super_admin",
        },
      });
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: admin.email,
          password: admin.password,
          email_confirm: true,
          user_metadata: { username: admin.username },
          app_metadata: {
            role: admin.role,
            is_super_admin: admin.role === "super_admin",
          },
        });

      if (createError) {
        throw createError;
      }

      if (!newUser.user) {
        throw new Error("User creation failed");
      }

      userId = newUser.user.id;
    }

    // Upsert admin role
    const { error: roleError } = await supabaseAdmin
      .from("admin_roles")
      .upsert(
        {
          user_id: userId,
          role: admin.role,
          permissions: admin.permissions,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (roleError) {
      console.error("Role upsert error:", roleError);
      throw roleError;
    }

    return {
      success: true,
      message: existingUser ? "Admin updated" : "Admin created",
      userId,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

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

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // Setup all default admins
    if (action === "setup-all" || action === "setup-admin-users") {
      const results: any[] = [];

      for (const admin of DEFAULT_ADMINS) {
        const result = await createOrUpdateAdmin(supabaseAdmin, admin);
        results.push({
          email: admin.email,
          username: admin.username,
          role: admin.role,
          ...result,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Admin setup completed",
          results,
          credentials: DEFAULT_ADMINS.map((a) => ({
            email: a.email,
            password: a.password,
            username: a.username,
            role: a.role,
          })),
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create single admin from request body
    if (action === "create" && req.method === "POST") {
      const body = await req.json();
      const admin: AdminUser = {
        email: body.email,
        password: body.password,
        username: body.username || body.email.split("@")[0],
        role: body.role || "admin",
        permissions: body.permissions || {
          manage_users: body.role === "super_admin" || body.role === "admin",
          manage_tickets: true,
          manage_dossiers: body.role !== "support",
          manage_admins: body.role === "super_admin",
          view_analytics: body.role !== "viewer",
          manage_glpi: body.role === "super_admin",
          full_access: body.role === "super_admin",
        },
      };

      const result = await createOrUpdateAdmin(supabaseAdmin, admin);

      return new Response(
        JSON.stringify({
          ...result,
          credentials: {
            email: admin.email,
            password: admin.password,
            username: admin.username,
            role: admin.role,
          },
        }),
        {
          status: result.success ? 200 : 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // List all admin users
    if (action === "list" && req.method === "GET") {
      const { data: roles, error } = await supabaseAdmin
        .from("admin_roles")
        .select("*, auth.users(email, user_metadata)");

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({
          success: true,
          admins: roles,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Invalid action",
        availableActions: ["setup-all", "create", "list"],
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
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
