import { createServer } from 'http';
import { createEndpoint } from '@jambonz/node-client-ws';
import pino from 'pino';
import 'dotenv/config';

// Import route handlers
import { createMainService } from './routes/main-service';
import { createDialAgentService } from './routes/dial-agent';
import { createWarmTransferService } from './routes/warm-transfer';
import { createDialSpecialistService } from './routes/dial-specialist';



const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3000;
const logLevel = process.env.LOGLEVEL || 'info';

// Logger configuration
const opts = {
  timestamp: () => `, "time": "${new Date().toISOString()}"`,
  level: logLevel
};
const logger = pino(opts);

// Create HTTP server with basic route handling
const server = createServer((req, res) => {
  // Handle basic HTTP endpoints
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString()
    }));
  } else if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Hello World! 🌍',
      service: 'BeCaller - Jambonz WebSocket Server',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        websocket_main: '/ (WebSocket)',
        websocket_dial_agent: '/dial-agent (WebSocket)',
        websocket_warm_transfer: '/warm-transfer (WebSocket)',
        websocket_dial_specialist: '/dial-specialist (WebSocket)'
      }
    }));
  }
});

// Create Jambonz WebSocket endpoint with the HTTP server
const makeService = createEndpoint({ server });

// Set up WebSocket routes using Jambonz library
createMainService({ logger, makeService });
createDialAgentService({ logger, makeService });
createWarmTransferService({ logger, makeService });
createDialSpecialistService({ logger, makeService });

// Start server
server.listen(port, () => {
  logger.info(`Jambonz WebSocket server listening at http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});