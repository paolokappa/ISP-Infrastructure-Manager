const https = require('https');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = 8888;

// SSL certificates
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt'))
};

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log('[INFO] Starting LoA Generator in', dev ? 'DEVELOPMENT' : 'PRODUCTION', 'mode');

app.prepare().then(() => {
  // Create HTTPS server
  https.createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log('========================================');
    console.log('> HTTPS Server ready on https://0.0.0.0:8888');
    console.log('> Mode:', dev ? 'Development (slower)' : 'Production (optimized)');
    console.log('> Next.js is integrated on the same port (no proxy needed)');
    console.log('> LoA Generator - Your Company Name');
    console.log('========================================');
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[INFO] SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[INFO] SIGINT received, shutting down gracefully...');
  process.exit(0);
});