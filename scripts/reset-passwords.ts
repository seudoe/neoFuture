import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ntsoxhlkznakdzvfeimp.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50c294aGxrem5ha2R6dmZlaW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg0Njg4OCwiZXhwIjoyMDg1NDIyODg4fQ.ziuw2BS4OKEndHfWCHUskGEtTRv6sRwW-c2EWqdCRXk';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function resetAllPasswords() {
  // List all users (max 1000 per page)
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    console.error('Failed to list users:', error.message);
    process.exit(1);
  }

  console.log(`Found ${data.users.length} users. Resetting passwords...`);

  for (const user of data.users) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'password'
    });

    if (updateError) {
      console.error(`Failed for ${user.email}: ${updateError.message}`);
    } else {
      console.log(`✓ ${user.email}`);
    }
  }

  console.log('Done.');
}

resetAllPasswords();
