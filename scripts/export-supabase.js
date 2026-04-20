// export-supabase.js
// Pulls your TurboTodo data from Supabase and writes migration-data.json
//
// Usage:
//   node scripts/export-supabase.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SUPABASE_URL = 'https://lvkbaxrkolovxnuzhvtv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BPLcYajEulnZIBOCuRNh8w_xOLANxoe';

function prompt(question, hidden = false) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      process.stdout.write(question);
      process.stdin.setRawMode(true);
      let input = '';
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', function handler(ch) {
        if (ch === '\n' || ch === '\r' || ch === '\u0003') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', handler);
          process.stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (ch === '\u0008' || ch === '\u007f') {
          input = input.slice(0, -1);
        } else {
          input += ch;
        }
      });
    } else {
      rl.question(question, answer => { rl.close(); resolve(answer); });
    }
  });
}

async function main() {
  const email = await prompt('Email: ');
  const password = await prompt('Password: ', true);
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('Signing in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error('Auth failed:', authError.message);
    process.exit(1);
  }
  console.log('Signed in as', authData.user.email);

  console.log('Fetching lists...');
  const { data: lists, error: listsError } = await supabase
    .from('lists')
    .select('*')
    .order('sort_order');
  if (listsError) { console.error('Lists error:', listsError.message); process.exit(1); }

  console.log('Fetching todos...');
  const { data: todos, error: todosError } = await supabase
    .from('todos')
    .select('*')
    .order('sort_order');
  if (todosError) { console.error('Todos error:', todosError.message); process.exit(1); }

  console.log('Fetching task_links...');
  const { data: links, error: linksError } = await supabase
    .from('task_links')
    .select('*')
    .order('sort_order');
  if (linksError) { console.error('Links error:', linksError.message); process.exit(1); }

  const output = { lists, todos, links };
  const outPath = path.join(__dirname, 'migration-data.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\nDone.`);
  console.log(`  Lists:  ${lists.length}`);
  console.log(`  Todos:  ${todos.length}`);
  console.log(`  Links:  ${links.length}`);
  console.log(`\nWrote: ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
