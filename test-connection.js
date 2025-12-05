// Test Supabase Connection
// Run this with: node test-connection.js

const https = require('https');

const SUPABASE_URL = 'https://ccvzebomzpfoddmuflrq.supabase.co';

console.log('Testing connection to Supabase...');
console.log('URL:', SUPABASE_URL);
console.log('');

// Test 1: Basic HTTPS request
https.get(SUPABASE_URL, (res) => {
  console.log('✅ Connection successful!');
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response length:', data.length, 'bytes');
    console.log('');
    console.log('✅ Supabase is reachable from your network');
  });
}).on('error', (err) => {
  console.error('❌ Connection failed!');
  console.error('Error:', err.message);
  console.error('Code:', err.code);
  console.error('');
  console.error('Possible causes:');
  console.error('1. No internet connection');
  console.error('2. Firewall blocking the connection');
  console.error('3. VPN interfering');
  console.error('4. DNS resolution issues');
  console.error('5. Proxy settings');
  console.error('');
  console.error('Try:');
  console.error('- Check your internet connection');
  console.error('- Disable firewall temporarily');
  console.error('- Disconnect VPN');
  console.error('- Run: ipconfig /flushdns');
  console.error('- Try a different network');
});

// Test 2: DNS resolution
const dns = require('dns');
const url = new URL(SUPABASE_URL);

console.log('Testing DNS resolution...');
dns.resolve4(url.hostname, (err, addresses) => {
  if (err) {
    console.error('❌ DNS resolution failed:', err.message);
  } else {
    console.log('✅ DNS resolved to:', addresses);
  }
});
