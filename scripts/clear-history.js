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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  console.log('--- 1. Checking submissions in Supabase ---');
  const { data: subs, error: subErr } = await supabase.from('submissions').select('*');
  if (subErr) {
    console.error('Error fetching submissions:', subErr);
  } else {
    console.log(`Found ${subs.length} submissions in Supabase:`, subs);
  }

  console.log('\n--- 2. Deleting submission_answers in Supabase ---');
  // First delete foreign key relations in submission_answers
  const { error: ansDelErr } = await supabase.from('submission_answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (ansDelErr) console.error('Error deleting submission answers:', ansDelErr);
  else console.log('Successfully deleted all submission_answers.');

  console.log('\n--- 3. Deleting submissions in Supabase ---');
  const { error: subDelErr } = await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (subDelErr) console.error('Error deleting submissions:', subDelErr);
  else console.log('Successfully deleted all submissions.');

  const { data: remainingSubs } = await supabase.from('submissions').select('*');
  console.log(`\nRemaining submissions in Supabase: ${remainingSubs ? remainingSubs.length : 0}`);
}

main().catch(console.error);
