import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { internalNetworkOnly } from './middleware/internal-network';
import { validateApiKey } from './middleware/auth';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import apiKeyRoutes from './routes/api-keys';
import callRoutes from './routes/calls';
import phoneNumberRoutes from './routes/phone-numbers';
import companyRoutes from './routes/companies';
import contactRoutes from './routes/contacts';
import callbackRoutes from './routes/callbacks';
import 'dotenv/config'

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: true, // Allow all origins since we're internal only
  credentials: true,
}));

app.use(internalNetworkOnly); // Handles logging

app.use('/health', healthRoutes);

// Public routes for internal services (no auth required from internal network)
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/phone-numbers', phoneNumberRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/callbacks', callbackRoutes);

// Protected routes (require API key even from internal network)
app.use(validateApiKey);

app.use('/api/users', userRoutes);
app.use('/api/api-keys', apiKeyRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Private API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/api/users',
      apiKeys: '/api/api-keys',
    },
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const server = app.listen(PORT, () => {
  console.log(`=� Private API server running on port ${PORT}`);
  console.log(`=� Internal network access only`);
  console.log(`= API key authentication required for protected endpoints`);
  console.log(`=� Health check: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;