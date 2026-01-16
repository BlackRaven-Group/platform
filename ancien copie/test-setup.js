// Simple Node.js script to test the setup-admin-users function
// Run with: node test-setup.js

const SUPABASE_URL = 'https://sswoxkjkkxtkxppslabx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzd294a2pra3h0a3hwcHNsYWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzEzNzgsImV4cCI6MjA4NDA0NzM3OH0.oVrswGc-ahuIT5mQOBb0pxXwXkGgYjzXwCLbiGWhNlc';

async function setupAdmins() {
  console.log('🚀 Calling setup-admin-users function...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/setup-admin-users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    console.log('📊 Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ SUCCESS!\n');
      console.log('📋 Login Credentials:\n');

      data.credentials.forEach(cred => {
        console.log(`\n🔐 ${cred.role.toUpperCase()}`);
        console.log(`   Email:    ${cred.email}`);
        console.log(`   Username: ${cred.username}`);
        console.log(`   Password: ${cred.password}`);
      });

      console.log('\n\n🎯 Next Steps:');
      console.log('1. Open the BlackRaven login page');
      console.log('2. Enter username: super_admin');
      console.log('3. Enter password: SuperAdmin2025!');
      console.log('4. Click LOGIN\n');
    } else {
      console.log('\n❌ ERROR:', data.error || data.message);
    }
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
  }
}

setupAdmins();
