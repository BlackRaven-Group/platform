const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface SendEmailParams {
  type: 'ticket_created' | 'ticket_status_changed' | 'ticket_response' | 'password_reset' | 'account_approved';
  to: string;
  data: Record<string, any>;
  recipientId?: string;
}

export async function sendNotificationEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(params),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Email send error:', result);
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: String(error) };
  }
}

// Helper functions for common email types
export async function sendTicketCreatedEmail(
  clientEmail: string,
  clientName: string,
  ticketRef: string,
  title: string,
  serviceType: string,
  clientId?: string
) {
  return sendNotificationEmail({
    type: 'ticket_created',
    to: clientEmail,
    data: { clientName, ticketRef, title, serviceType },
    recipientId: clientId,
  });
}

export async function sendTicketStatusEmail(
  clientEmail: string,
  clientName: string,
  ticketRef: string,
  newStatus: string,
  response?: string,
  clientId?: string
) {
  return sendNotificationEmail({
    type: 'ticket_status_changed',
    to: clientEmail,
    data: { clientName, ticketRef, newStatus, response },
    recipientId: clientId,
  });
}

export async function sendTicketResponseEmail(
  clientEmail: string,
  clientName: string,
  ticketRef: string,
  title: string,
  response: string,
  clientId?: string
) {
  return sendNotificationEmail({
    type: 'ticket_response',
    to: clientEmail,
    data: { clientName, ticketRef, title, response },
    recipientId: clientId,
  });
}

export async function sendAccountApprovedEmail(
  clientEmail: string,
  clientName: string,
  loginUrl?: string
) {
  return sendNotificationEmail({
    type: 'account_approved',
    to: clientEmail,
    data: { clientName, loginUrl },
  });
}
