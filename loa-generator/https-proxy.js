const https = require('https');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// SSL certificates
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
};

// Create proxy
const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:3002',
  ws: true,
  changeOrigin: true
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (res.writeHead) {
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Proxy error');
  }
});

// Create HTTPS server
const server = https.createServer(httpsOptions, (req, res) => {
  proxy.web(req, res);
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

// Start Next.js in background
console.log('Starting Next.js on port 3002...');
const nextProcess = spawn('npx', ['next', 'dev', '-H', 'localhost', '-p', '3002'], {
  cwd: __dirname,
  stdio: 'inherit'
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

// Wait a bit for Next.js to start
setTimeout(() => {
  server.listen(8888, '0.0.0.0', () => {
    console.log('> HTTPS Proxy ready on https://0.0.0.0:8888');
    console.log('> Also available on https://localhost:8888');
    console.log('> Server running with SSL/TLS encryption');
    console.log('> LoA Generator - Your Company Name');
  });
}, 3000);

// Clean exit
process.on('SIGTERM', () => {
  nextProcess.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  nextProcess.kill();
  process.exit(0);
});