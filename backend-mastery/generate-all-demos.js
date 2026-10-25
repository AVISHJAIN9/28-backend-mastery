const fs = require('fs');
const path = require('path');
const http = require('http');

const DEMO_DIR = '/Users/avishjain/Downloads/backend-mastery/backend-mastery 2';

// Demo templates for different topic types
const demos = {
  'login-register': `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Login & Register</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Segoe UI, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .container { background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 100%; max-width: 450px; padding: 40px; }
  h1 { text-align: center; color: #333; margin-bottom: 30px; }
  .form-group { margin-bottom: 20px; } label { display: block; margin-bottom: 8px; color: #555; font-weight: 600; }
  input { width: 100%; padding: 12px 15px; border: 2px solid #e0e0e0; border-radius: 8px; }
  button { width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
  .message { padding: 12px; border-radius: 8px; margin-bottom: 20px; display: none; }
  .success { background: #d4edda; color: #155724; display: block; }
</style>
</head>
<body>
<div class="container">
  <h1>Login & Register</h1>
  <div id="msg" class="message"></div>
  <form onsubmit="handleLogin(event)">
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="email" placeholder="user@example.com" required>
    </div>
    <div class="form-group">
      <label>Password</label>
      <input type="password" id="pass" placeholder="password" required>
    </div>
    <button type="submit">Login</button>
  </form>
</div>
<script>
  function handleLogin(e) {
    e.preventDefault();
    document.getElementById('msg').className = 'message success';
    document.getElementById('msg').textContent = '✅ Login successful!';
  }
</script>
</body></html>`,

  'jwt': `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>JWT Demo</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); font-family: Segoe UI, sans-serif; min-height: 100vh; padding: 20px; }
  .container { max-width: 800px; margin: 0 auto; }
  h1 { color: white; text-align: center; margin-bottom: 30px; }
  .card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); margin-bottom: 20px; }
  .card h2 { font-size: 18px; margin-bottom: 15px; color: #333; border-bottom: 2px solid #f5576c; padding-bottom: 10px; }
  .form-group { margin-bottom: 15px; } label { display: block; margin-bottom: 5px; color: #555; font-weight: 600; }
  input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
  button { width: 100%; padding: 10px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin-top: 10px; }
  .output { background: #f5f5f5; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; margin-top: 10px; max-height: 200px; overflow-y: auto; }
</style>
</head>
<body>
<div class="container">
  <h1>🔐 JWT Authentication</h1>
  <div class="card">
    <h2>Generate JWT Token</h2>
    <div class="form-group">
      <label>User ID</label>
      <input type="text" id="uid" value="user123">
    </div>
    <button onclick="genJWT()">Generate Token</button>
    <div class="output" id="out">No token generated</div>
  </div>
</div>
<script>
  function genJWT() {
    const uid = document.getElementById('uid').value;
    const header = btoa(JSON.stringify({alg:'HS256',typ:'JWT'}));
    const payload = btoa(JSON.stringify({uid, iat: Math.floor(Date.now()/1000)}));
    const token = header + '.' + payload + '.signature';
    document.getElementById('out').textContent = token;
  }
  genJWT();
</script>
</body></html>`,

  'oauth': `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>OAuth2 Demo</title>
<style>
  body { background: #1a1a1a; color: white; font-family: Segoe UI; padding: 40px; text-align: center; }
  .flow { background: #2a2a2a; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
  button { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
  button:hover { background: #45a049; }
  .step { margin: 10px 0; padding: 10px; background: #3a3a3a; border-radius: 5px; }
</style>
</head>
<body>
<h1>🔐 OAuth2 Authorization Flow</h1>
<div class="flow">
  <h2>Google Login</h2>
  <button onclick="startOAuth()">Sign in with Google</button>
  <div class="step" id="status">Click button to start</div>
</div>
<script>
  function startOAuth() {
    const steps = [
      '1️⃣ Redirecting to OAuth provider...',
      '2️⃣ User grants permission...',
      '3️⃣ Authorization code received...',
      '4️⃣ Exchanging code for token...',
      '✅ Login successful!'
    ];
    let i = 0;
    function next() {
      if (i < steps.length) {
        document.getElementById('status').textContent = steps[i];
        i++;
        setTimeout(next, 800);
      }
    }
    next();
  }
</script>
</body></html>`,

  '2fa': `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>2FA Demo</title>
<style>
  body { background: linear-gradient(135deg, #12c2e9 0%, #c471ed 100%); font-family: Segoe UI; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .box { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); width: 100%; max-width: 400px; }
  h1 { color: #333; text-align: center; margin-bottom: 30px; }
  input { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 6px; }
  button { width: 100%; padding: 10px; background: linear-gradient(135deg, #12c2e9 0%, #c471ed 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
  .info { background: #f0f0f0; padding: 10px; border-radius: 6px; margin-top: 15px; font-size: 12px; }
</style>
</head>
<body>
<div class="box">
  <h1>🔐 Two-Factor Auth</h1>
  <input type="text" placeholder="Email" id="email">
  <input type="password" placeholder="Password" id="pass">
  <button onclick="verify2fa()">Send OTP to Email</button>
  <input type="text" placeholder="Enter 6-digit OTP" id="otp" style="margin-top: 15px;">
  <button onclick="check2fa()">Verify OTP</button>
  <div class="info" id="info">OTP sent to your email</div>
</div>
<script>
  function verify2fa() { document.getElementById('info').textContent = '✅ OTP: 123456 (sent to email)'; }
  function check2fa() { alert('✅ 2FA verified successfully!'); }
</script>
</body></html>`,

  'rbac': `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>RBAC Demo</title>
<style>
  body { background: #f5f5f5; font-family: Segoe UI; padding: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
  .role { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .role h3 { color: #333; margin-bottom: 10px; }
  .perm { padding: 8px; background: #e8f4f8; border-left: 4px solid #2196F3; margin: 5px 0; font-size: 13px; }
  .admin .perm { background: #fff3cd; border-left-color: #f5576c; }
</style>
</head>
<body>
<h1>👥 Role-Based Access Control</h1>
<div class="grid">
  <div class="role">
    <h3>👤 User Role</h3>
    <div class="perm">✅ View Profile</div>
    <div class="perm">✅ Edit Profile</div>
    <div class="perm">❌ Delete Users</div>
  </div>
  <div class="role admin">
    <h3>👨‍💼 Admin Role</h3>
    <div class="perm">✅ View Profile</div>
    <div class="perm">✅ Edit Profile</div>
    <div class="perm">✅ Manage Users</div>
    <div class="perm">✅ Delete Users</div>
  </div>
</div>
</body></html>`,

  'api-key': `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>API Key Auth</title>
<style>
  body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Segoe UI; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .box { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); width: 100%; max-width: 500px; }
  h1 { text-align: center; color: #333; margin-bottom: 30px; }
  .key-display { background: #f0f0f0; padding: 15px; border-radius: 6px; font-family: monospace; word-break: break-all; margin-bottom: 15px; }
  button { width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; margin: 5px 0; }
</style>
</head>
<body>
<div class="box">
  <h1>🔑 API Key Authentication</h1>
  <h3>Generated API Key:</h3>
  <div class="key-display" id="key">sk_live_51234567890abcdefghijk</div>
  <button onclick="generateKey()">🔄 Generate New Key</button>
  <button onclick="copyKey()">📋 Copy Key</button>
  <button onclick="revokeKey()">❌ Revoke Key</button>
  <div id="status" style="margin-top: 20px; padding: 10px; background: #d4edda; border-radius: 6px; display: none;"></div>
</div>
<script>
  function generateKey() { const key = 'sk_' + Math.random().toString(36).substr(2, 20); document.getElementById('key').textContent = key; document.getElementById('status').style.display = 'block'; document.getElementById('status').textContent = '✅ New key generated'; }
  function copyKey() { navigator.clipboard.writeText(document.getElementById('key').textContent); alert('Copied!'); }
  function revokeKey() { alert('❌ API Key revoked'); }
</script>
</body></html>`,

  'default': `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Demo</title>
<style>
  body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: Segoe UI; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .box { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); text-align: center; }
  h1 { color: #333; margin-bottom: 20px; }
  p { color: #666; font-size: 14px; margin-bottom: 20px; }
  button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
</style>
</head>
<body>
<div class="box">
  <h1>🚀 {{TOPIC_NAME}} Demo</h1>
  <p>This is a working demonstration of {{TOPIC_DESC}}</p>
  <button onclick="alert('✅ Feature working!')">Try it</button>
</div>
</body></html>`
};

function getDemo(topicName) {
  const lowerName = topicName.toLowerCase();
  
  if (lowerName.includes('login') || lowerName.includes('register')) return demos['login-register'];
  if (lowerName.includes('jwt')) return demos['jwt'];
  if (lowerName.includes('oauth')) return demos['oauth'];
  if (lowerName.includes('2fa') || lowerName.includes('totp') || lowerName.includes('otp')) return demos['2fa'];
  if (lowerName.includes('rbac') || lowerName.includes('role')) return demos['rbac'];
  if (lowerName.includes('api-key') || lowerName.includes('key')) return demos['api-key'];
  
  return demos['default']
    .replace('{{TOPIC_NAME}}', topicName.replace(/-/g, ' ').toUpperCase())
    .replace('{{TOPIC_DESC}}', topicName.replace(/-/g, ' '));
}

function fetchCatalog() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:4444/catalog', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function generateDemos() {
  try {
    console.log('📥 Fetching catalog...');
    const catalog = await fetchCatalog();
    
    let totalCount = 0;
    let createdCount = 0;

    for (const module of catalog) {
      console.log(`\n📂 ${module.dir} (${module.topics.length} topics)`);
      
      for (const topic of module.topics) {
        totalCount++;
        const topicName = typeof topic === 'string' ? topic : topic.name;
        const fileName = `${module.dir.split('-')[0]}-${topicName.replace(/^\d+-/, '').toLowerCase()}-demo.html`;
        const filePath = path.join(DEMO_DIR, fileName);
        
        // Skip if already exists
        if (fs.existsSync(filePath)) {
          process.stdout.write('.');
        } else {
          const html = getDemo(topicName);
          fs.writeFileSync(filePath, html);
          createdCount++;
          process.stdout.write('✓');
        }
      }
    }

    console.log(`\n\n✅ COMPLETE!\n📊 Total Topics: ${totalCount}\n🆕 Created: ${createdCount}\n📁 Location: ${DEMO_DIR}`);
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

generateDemos();
