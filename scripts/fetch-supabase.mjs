/**
 * fetch-supabase.mjs
 * Pulls your lists + todos from Supabase and writes lib/migration-data.json.
 * Run: node scripts/fetch-supabase.mjs
 * You'll be prompted for your password.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { createInterface } from 'readline';

const SUPABASE_URL     = 'https://lvkbaxrkolovxnuzhvtv.supabase.co';
const SUPABASE_ANON    = 'sb_publishable_BPLcYajEulnZIBOCuRNh8w_xOLANxoe';
const USER_EMAIL       = 'brooksie68@gmail.com';
const OUT_PATH         = new URL('../lib/migration-data.json', import.meta.url);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

function prompt(question) {
  return new Promise(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => { rl.close(); resolve(answer); });
  });
}

async function main() {
  const password = await prompt(`Supabase password for ${USER_EMAIL}: `);

  console.log('Signing in...');
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: USER_EMAIL,
    password,
  });
  if (authError) { console.error('Auth failed:', authError.message); process.exit(1); }
  console.log('Signed in.');

  console.log('Fetching lists...');
  const { data: lists, error: listsErr } = await supabase
    .from('lists')
    .select('id, name, sort_order, inserted_at')
    .order('sort_order');
  if (listsErr) { console.error('Lists error:', listsErr.message); process.exit(1); }

  console.log('Fetching todos...');
  const { data: todos, error: todosErr } = await supabase
    .from('todos')
    .select('id, list_id, parent_id, task, note, is_complete, sort_order, inserted_at, status')
    .order('sort_order');
  if (todosErr) { console.error('Todos error:', todosErr.message); process.exit(1); }

  const output = { lists, todos, links: [] };
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));

  console.log(`\nDone. ${lists.length} lists, ${todos.length} todos written to lib/migration-data.json`);
  console.log('Now trigger "Import from Supabase" inside the app.');
  process.exit(0);
}

main();
