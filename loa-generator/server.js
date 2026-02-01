console.log('[DEBUG] Starting server.js...');
console.log('[DEBUG] Node version:', process.version);
console.log('[DEBUG] Current directory:', __dirname);

const https = require('https');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('[DEBUG] Modules loaded successfully');

// Check if certificates exist
const keyPath = path.join(__dirname, 'certs', 'server.key');
const certPath = path.join(__dirname, 'certs', 'server.crt');

console.log('[DEBUG] Checking certificates...');
console.log('[DEBUG] Key path:', keyPath, 'Exists:', fs.existsSync(keyPath));
console.log('[DEBUG] Cert path:', certPath, 'Exists:', fs.existsSync(certPath));

// SSL certificates
let httpsOptions;
try {
  httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  console.log('[DEBUG] Certificates loaded successfully');
} catch (error) {
  console.error('[ERROR] Failed to load certificates:', error.message);
  process.exit(1);
}

// Create proxy
console.log('[DEBUG] Creating proxy server...');
const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:3003',
  ws: true,
  changeOrigin: true
});
console.log('[DEBUG] Proxy server created');

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('[ERROR] Proxy error:', err.message);
  console.error('[ERROR] Stack:', err.stack);
  if (res && res.writeHead) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Proxy error: ' + err.message);
  }
});

// Create HTTPS server
console.log('[DEBUG] Creating HTTPS server...');
const server = https.createServer(httpsOptions, (req, res) => {
  console.log('[DEBUG] Request:', req.method, req.url);
  proxy.web(req, res);
});
console.log('[DEBUG] HTTPS server created');

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  console.log('[DEBUG] WebSocket upgrade request');
  proxy.ws(req, socket, head);
});

// Start Next.js in background
console.log('[DEBUG] Starting Next.js on port 3003...');
console.log('[DEBUG] Command: npx next dev -H localhost -p 3003');

const nextProcess = spawn('npx', ['next', 'dev', '-H', 'localhost', '-p', '3003'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
});

console.log('[DEBUG] Next.js process spawned with PID:', nextProcess.pid);

nextProcess.on('error', (err) => {
  console.error('[ERROR] Failed to start Next.js:', err.message);
  console.error('[ERROR] Stack:', err.stack);
  process.exit(1);
});

nextProcess.on('exit', (code, signal) => {
  console.log('[DEBUG] Next.js process exited with code:', code, 'signal:', signal);
});

// Wait a bit for Next.js to start
console.log('[DEBUG] Waiting 4 seconds for Next.js to initialize...');
setTimeout(() => {
  console.log('[DEBUG] Starting HTTPS server on port 8888...');
  server.listen(8888, '0.0.0.0', () => {
    console.log('========================================');
    console.log('> HTTPS Server ready on https://0.0.0.0:8888');
    console.log('> Also available on https://localhost:8888');
    console.log('> Server running with SSL/TLS encryption');
    console.log('> LoA Generator - Your Company Name');
    console.log('========================================');
  });
  
  server.on('error', (err) => {
    console.error('[ERROR] HTTPS server error:', err.message);
    console.error('[ERROR] Stack:', err.stack);
    if (err.code === 'EADDRINUSE') {
      console.error('[ERROR] Port 8888 is already in use');
    }
    process.exit(1);
  });
}, 4000);

// Clean exit
process.on('SIGTERM', () => {
  nextProcess.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  nextProcess.kill();
  process.exit(0);
});