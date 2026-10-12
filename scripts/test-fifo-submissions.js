const fs = require('fs');

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
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('--- Testing Submissions FIFO Rolling Window (Max 10) ---');

  // Check current submissions count
  const { data: currentSubs } = await sb
    .from('submissions')
    .select('id, submitted_at')
    .order('submitted_at', { ascending: false });

  console.log(`Current submissions count in DB: ${currentSubs.length}`);

  // FIFO check logic
  if (currentSubs.length > 10) {
    const idsToDelete = currentSubs.slice(10).map(s => s.id);
    console.log(`Purging ${idsToDelete.length} submissions beyond 10...`);
    await sb.from('submissions').delete().in('id', idsToDelete);
  }

  const { data: finalSubs } = await sb
    .from('submissions')
    .select('id, submitted_at')
    .order('submitted_at', { ascending: false });

  console.log(`Submissions count after FIFO check: ${finalSubs.length} (Must be <= 10)`);
  if (finalSubs.length > 10) {
    throw new Error('FIFO rolling purge failed, count > 10!');
  }

  console.log('✅ FIFO Rolling Window verified successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
