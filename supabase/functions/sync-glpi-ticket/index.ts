import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Cette fonction synchronise un ticket existant avec GLPI
// Peut être appelée sans authentification pour les tests (à sécuriser en production)

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

    const { ticket_id } = await req.json();

    if (!ticket_id) {
      return new Response(
        JSON.stringify({ error: 'Missing ticket_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get ticket from database
    const { data: ticket, error: ticketError } = await supabase
      .from('glpi_tickets')
      .select('*')
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Extract contact info from description or use client_* fields
    let contactName = ticket.client_name || 'N/A';
    let contactEmail = ticket.client_email || '';
    let contactPhone = ticket.client_phone || null;

    // Try to extract from description if not in client_* fields
    if (!contactEmail && ticket.description) {
      const emailMatch = ticket.description.match(/Email:\s*([^\n]+)/);
      if (emailMatch) contactEmail = emailMatch[1].trim();
      
      const nameMatch = ticket.description.match(/Nom:\s*([^\n]+)/);
      if (nameMatch) contactName = nameMatch[1].trim();
      
      const phoneMatch = ticket.description.match(/Téléphone:\s*([^\n]+)/);
      if (phoneMatch) contactPhone = phoneMatch[1].trim();
    }

    // Get GLPI config
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

    // Call the create-glpi-ticket function logic
    // Init GLPI session
    // GLPI API v1 - Init session
    // L'API v1 peut utiliser les headers ou les query parameters
    // Essayer d'abord avec les headers (format recommandé)
    let initResponse = await fetch(`${api_url}/initSession`, {
      method: 'GET',
      headers: {
        'Authorization': `user_token ${user_token}`,
        'App-Token': app_token,
        'Content-Type': 'application/json',
      },
    });

    // Si échec avec headers, essayer avec query parameters
    if (!initResponse.ok) {
      const initSessionUrlWithParams = `${api_url}/initSession?user_token=${encodeURIComponent(user_token)}&app_token=${encodeURIComponent(app_token)}`;
      initResponse = await fetch(initSessionUrlWithParams, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      return new Response(
        JSON.stringify({ error: `GLPI init session failed: ${initResponse.status} ${errorText}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessionData = await initResponse.json();
    const sessionToken = sessionData.session_token;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'Failed to get GLPI session token' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find or create user in GLPI
    let glpiUserId: number | null = null;
    if (contactEmail) {
      try {
        const searchUrl = `${api_url}/User?criteria[0][field]=5&criteria[0][searchtype]=contains&criteria[0][value]=${encodeURIComponent(contactEmail)}`;
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
            glpiUserId = parseInt(searchData[0].id);
          } else {
            // Create new user
            const createUserUrl = `${api_url}/User`;
            const userData = {
              input: {
                name: contactName || contactEmail.split('@')[0],
                realname: contactName || contactEmail.split('@')[0],
                firstname: contactName.split(' ')[0] || '',
                _useremails: [{ email: contactEmail }],
                phone: contactPhone || '',
                is_active: 1,
                profiles_id: 4,
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
                glpiUserId = parseInt(newUserData.id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error finding/creating GLPI user:', error);
      }
    }

    // Create ticket in GLPI
    const createTicketUrl = `${api_url}/Ticket`;
    const glpiPriority = ticket.priority <= 1 ? 1 : ticket.priority >= 5 ? 5 : ticket.priority;

    const ticketData: any = {
      input: {
        name: ticket.title,
        content: ticket.description,
        priority: glpiPriority,
        urgency: 3,
        impact: 3,
      }
    };

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

    // Kill session
    await fetch(`${api_url}/killSession`, {
      method: 'GET',
      headers: {
        'Session-Token': sessionToken,
        'App-Token': app_token,
      },
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return new Response(
        JSON.stringify({ error: `GLPI create ticket failed: ${createResponse.status} ${errorText}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const glpiTicketData = await createResponse.json();
    const glpiTicketId = glpiTicketData.id?.toString();

    // Update ticket in database
    const { error: updateError } = await supabase
      .from('glpi_tickets')
      .update({
        glpi_ticket_id: glpiTicketId,
        status: 'open',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticket_id);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        glpi_ticket_id: glpiTicketId,
        message: 'Ticket synchronized successfully with GLPI',
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
    console.error('Error syncing GLPI ticket:', error);
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
