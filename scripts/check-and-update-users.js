const fs = require('fs');
const bcrypt = require('bcryptjs');

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- 1. Fetching current profiles from Supabase ---');
  const { data: currentProfiles, error: fetchErr } = await supabase.from('profiles').select('*');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }
  console.log('Current profiles:', currentProfiles);

  const hash123 = bcrypt.hashSync('123', 10);
  const hash1 = bcrypt.hashSync('1', 10);

  // 1. Update admin password to 123
  console.log('\n--- 2. Updating admin password to 123 ---');
  const { error: adminErr } = await supabase
    .from('profiles')
    .update({ password_hash: hash123 })
    .eq('username', 'admin');
  if (adminErr) console.error('Admin update error:', adminErr);
  else console.log('Admin password updated successfully.');

  // 2. Rename 'user' to 'user1' and update password to 1
  console.log('\n--- 3. Updating user -> user1 with password 1 ---');
  // First check if profile with username 'user' exists
  const existingUser = currentProfiles.find(p => p.username === 'user');
  if (existingUser) {
    const { error: u1Err } = await supabase
      .from('profiles')
      .update({ username: 'user1', password_hash: hash1 })
      .eq('id', existingUser.id);
    if (u1Err) console.error('user1 update error:', u1Err);
    else console.log('user renamed to user1 successfully.');
  } else {
    // If user1 already exists or user wasn't found, upsert user1
    const { error: u1UpsertErr } = await supabase
      .from('profiles')
      .upsert({
        id: '00000000-0000-0000-0000-000000000002',
        username: 'user1',
        role: 'user',
        password_hash: hash1
      });
    if (u1UpsertErr) console.error('user1 upsert error:', u1UpsertErr);
    else console.log('user1 upserted successfully.');
  }

  // 3. Upsert user2
  console.log('\n--- 4. Upserting user2 with password 1 ---');
  const { error: u2Err } = await supabase
    .from('profiles')
    .upsert({
      id: '00000000-0000-0000-0000-000000000003',
      username: 'user2',
      role: 'user',
      password_hash: hash1
    });
  if (u2Err) console.error('user2 upsert error:', u2Err);
  else console.log('user2 upserted successfully.');

  // 4. Upsert user3
  console.log('\n--- 5. Upserting user3 with password 1 ---');
  const { error: u3Err } = await supabase
    .from('profiles')
    .upsert({
      id: '00000000-0000-0000-0000-000000000004',
      username: 'user3',
      role: 'user',
      password_hash: hash1
    });
  if (u3Err) console.error('user3 upsert error:', u3Err);
  else console.log('user3 upserted successfully.');

  // Verify updated profiles
  console.log('\n--- 6. Verifying all profiles ---');
  const { data: updatedProfiles } = await supabase.from('profiles').select('id, username, role, password_hash');
  console.log('Updated profiles:', updatedProfiles);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
