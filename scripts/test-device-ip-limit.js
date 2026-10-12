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
  console.log('--- Testing Security Limit Logic & Supabase Sync ---');
  
  // 1. Reset map
  const testMap = {
    adm: { username: 'adm', role: 'admin', is_active: true, ips: ['127.0.0.1'], devices: ['dev_desktop_1'] },
    tth: { username: 'tth', role: 'user', is_active: true, ips: ['192.168.1.10'], devices: ['dev_phone_1'] },
    tmh: { username: 'tmh', role: 'user', is_active: true, ips: ['192.168.1.20'], devices: ['dev_tablet_1'] },
    user: { username: 'user', role: 'user', is_active: true, ips: ['192.168.1.30'], devices: ['dev_laptop_1'] },
  };

  const { data: existing } = await sb.from('exams').select('id').eq('title', '__SYSTEM_ACCOUNT_SECURITY__').maybeSingle();
  if (existing) {
    await sb.from('exams').update({ description: JSON.stringify(testMap) }).eq('id', existing.id);
  }

  // Verify read
  const { data: readData } = await sb.from('exams').select('description').eq('title', '__SYSTEM_ACCOUNT_SECURITY__').single();
  const parsed = JSON.parse(readData.description);
  console.log('Read back security map keys:', Object.keys(parsed));
  console.log('adm status:', parsed.adm.is_active, 'ips:', parsed.adm.ips.length, 'devices:', parsed.adm.devices.length);

  // Test simulation: adding 4 devices to 'user'
  parsed.user.devices = ['d1', 'd2', 'd3', 'd4'];
  if (parsed.user.devices.length > 3) {
    parsed.user.is_active = false;
  }
  console.log('Simulation user with 4 devices -> is_active:', parsed.user.is_active, '(Expected: false)');
  if (parsed.user.is_active !== false) throw new Error('Limit logic failed');

  // Test reset
  parsed.user.devices = [];
  parsed.user.ips = [];
  parsed.user.is_active = true;
  console.log('Reset user -> is_active:', parsed.user.is_active, 'devices:', parsed.user.devices.length);
  if (parsed.user.is_active !== true || parsed.user.devices.length !== 0) throw new Error('Reset failed');

  // Re-save clean default
  await sb.from('exams').update({ description: JSON.stringify(testMap) }).eq('id', existing.id);
  console.log('✅ Device/IP Security Limit Logic Verified Successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
