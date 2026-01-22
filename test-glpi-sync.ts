// Script de test pour synchroniser le ticket test avec GLPI
// À exécuter via Supabase Edge Function ou directement

const testTicket = {
  ticket_id: 'b59ef9ea-2e39-40b3-b2c1-80c375846ded',
  title: 'hello test glpi',
  description: '[CONTACT]\nNom: test moi\nEmail: woxego9996@elafans.com\n\n\n[DESCRIPTION]\nblabla jbcujnc',
  priority: 3,
  contact_name: 'test moi',
  contact_email: 'woxego9996@elafans.com',
  contact_phone: null,
};

// Appel à l'Edge Function
// POST https://rsndbepkhfrxlokkmjbi.supabase.co/functions/v1/create-glpi-ticket
// Headers: Authorization: Bearer <token>, Content-Type: application/json
// Body: testTicket
