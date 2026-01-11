// Create a test mentee user in Supabase
// Run with: node create-test-user.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ccvzebomzpfoddmuflrq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdnplYm9tenBmb2RkbXVmbHJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0ODI3NiwiZXhwIjoyMDc5OTI0Mjc2fQ.OKAoGamnsr-p3oyZ1fD2FJ2_m-HwcF1dkqslVE3U_xY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTestUser() {
  try {
    console.log('Creating test mentee user...');
    console.log('Email: test@mentee.com');
    console.log('Password: TestPassword123!');
    console.log('');

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@mentee.com',
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        role: 'mentee',
        full_name: 'Test Mentee'
      }
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Role:', data.user.user_metadata?.role);
    console.log('');
    console.log('You can now sign in with:');
    console.log('Email: test@mentee.com');
    console.log('Password: TestPassword123!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestUser();
