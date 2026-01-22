import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface GLPIInitSessionResponse {
  session_token?: string;
  [key: string]: any;
}

interface GLPIItemResponse {
  id?: number;
  message?: string;
  [key: string]: any;
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { ticket_id, title, description, priority, contact_name, contact_email, contact_phone } = await req.json();

    if (!ticket_id || !title || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get GLPI config from database
    const { data: glpiConfig, error: configError } = await supabase
      .from('glpi_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !glpiConfig) {
      return new Response(
        JSON.stringify({ error: 'GLPI configuration not found or inactive' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { api_url, app_token, user_token } = glpiConfig;

    // GLPI API v1 - Init session
    // L'API v1 utilise les query parameters pour l'authentification
    const initSessionUrl = `${api_url}/initSession?user_token=${encodeURIComponent(user_token)}&app_token=${encodeURIComponent(app_token)}`;
    
    let initResponse = await fetch(initSessionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error('GLPI init session error:', errorText);
      return new Response(
        JSON.stringify({ error: `GLPI init session failed: ${initResponse.status} ${errorText}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessionData: GLPIInitSessionResponse = await initResponse.json();
    const sessionToken = sessionData.session_token;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Failed to get GLPI session token' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Helper function to find or create user in GLPI
    const findOrCreateGLPIUser = async (email: string, name: string, phone?: string): Promise<number | null> => {
      try {
        // Search for existing user by email
        const searchUrl = `${api_url}/User?criteria[0][field]=5&criteria[0][searchtype]=contains&criteria[0][value]=${encodeURIComponent(email)}`;
        const searchResponse = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'Session-Token': sessionToken,
            'App-Token': app_token,
            'Content-Type': 'application/json',
          },
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData && searchData.length > 0 && searchData[0].id) {
            console.log(`✅ Found existing GLPI user: ${searchData[0].id}`);
            return parseInt(searchData[0].id);
          }
        }

        // User not found, create new user
        console.log(`📝 Creating new GLPI user for: ${email}`);
        const createUserUrl = `${api_url}/User`;
        const userData = {
          input: {
            name: name || email.split('@')[0],
            realname: name || email.split('@')[0],
            firstname: name.split(' ')[0] || '',
            _useremails: [{ email: email }],
            phone: phone || '',
            is_active: 1,
            profiles_id: 4, // Self-service profile (adjust if needed)
          }
        };

        const createUserResponse = await fetch(createUserUrl, {
          method: 'POST',
          headers: {
            'Session-Token': sessionToken,
            'App-Token': app_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (createUserResponse.ok) {
          const newUserData = await createUserResponse.json();
          if (newUserData && newUserData.id) {
            console.log(`✅ Created new GLPI user: ${newUserData.id}`);
            return parseInt(newUserData.id);
          }
        } else {
          const errorText = await createUserResponse.text();
          console.warn(`⚠️ Failed to create GLPI user: ${errorText}`);
        }
      } catch (error) {
        console.error('Error finding/creating GLPI user:', error);
      }
      return null;
    };

    // Find or create user in GLPI
    let glpiUserId: number | null = null;
    if (contact_email) {
      glpiUserId = await findOrCreateGLPIUser(contact_email, contact_name || contact_email, contact_phone || undefined);
    }

    // Create ticket in GLPI
    // GLPI v2.1 uses Ticket endpoint
    const createTicketUrl = `${api_url}/Ticket`;
    
    // Build ticket content with contact info
    const ticketContent = `[CONTACT]
Nom: ${contact_name || 'N/A'}
Email: ${contact_email || 'N/A'}
${contact_phone ? `Téléphone: ${contact_phone}` : ''}

[DESCRIPTION]
${description}`;

    // Map priority (1-5) to GLPI priority (1-6)
    // GLPI: 1=Very low, 2=Low, 3=Medium, 4=High, 5=Very high, 6=Major
    const glpiPriority = priority <= 1 ? 1 : priority >= 5 ? 5 : priority;

    const ticketData: any = {
      input: {
        name: title,
        content: ticketContent,
        priority: glpiPriority,
        urgency: 3, // Medium urgency
        impact: 3,  // Medium impact
      }
    };

    // Add requester user ID if we found/created one
    if (glpiUserId) {
      ticketData.input._users_id_requester = glpiUserId;
    }

    const createResponse = await fetch(createTicketUrl, {
      method: 'POST',
      headers: {
        'Session-Token': sessionToken,
        'App-Token': app_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('GLPI create ticket error:', errorText);
      
      // Kill session
      await fetch(`${api_url}/killSession`, {
        method: 'GET',
        headers: {
          'Session-Token': sessionToken,
          'App-Token': app_token,
        },
      });

      return new Response(
        JSON.stringify({ error: `GLPI create ticket failed: ${createResponse.status} ${errorText}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const glpiTicketData: GLPIItemResponse = await createResponse.json();
    const glpiTicketId = glpiTicketData.id?.toString();

    // Kill session
    await fetch(`${api_url}/killSession`, {
      method: 'GET',
      headers: {
        'Session-Token': sessionToken,
        'App-Token': app_token,
      },
    });

    // Update ticket in database with GLPI ticket ID
    const { error: updateError } = await supabase
      .from('glpi_tickets')
      .update({
        glpi_ticket_id: glpiTicketId,
        status: 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticket_id);

    if (updateError) {
      console.error('Error updating ticket with GLPI ID:', updateError);
      // Don't fail - ticket was created in GLPI
    }

    return new Response(
      JSON.stringify({
        success: true,
        glpi_ticket_id: glpiTicketId,
        message: 'Ticket created successfully in GLPI',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error creating GLPI ticket:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
