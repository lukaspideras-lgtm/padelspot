#!/usr/bin/env node
/**
 * Ubaci Supabase URL i anon key iz .env u auth-callback.html
 * Pokreni pre deploy-a ako GitHub Secrets ne rade.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const htmlPath = path.join(root, 'auth-callback-deploy', 'auth-callback.html');

let url = '';
let anon = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*EXPO_PUBLIC_SUPABASE_URL\s*=\s*(.+)/);
    if (m) url = m[1].trim().replace(/^["']|["']$/g, '');
    const m2 = line.match(/^\s*EXPO_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)/);
    if (m2) anon = m2[1].trim().replace(/^["']|["']$/g, '');
  });
}

if (!url || !anon) {
  console.error('Greška: U .env dodaj EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '');
}

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/'AUTH_CB_SUPABASE_URL'/g, "'" + esc(url) + "'");
html = html.replace(/'AUTH_CB_SUPABASE_ANON'/g, "'" + esc(anon) + "'");

fs.writeFileSync(htmlPath, html);
console.log('auth-callback.html ažuriran sa Supabase vrednostima iz .env');
