import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { initializeTables } from './config/init-db';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { QueueService } from './services/QueueService';
import { logger } from './utils/logger';
import { generalRateLimit } from './middleware/rateLimiting';
import { sanitizeInput } from './middleware/validation';
import { container } from './container/Container';

// Load environment variables
dotenv.config();

class Server {
  private app: express.Application;
  private port: number;
  private queueService: QueueService;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    this.queueService = QueueService.getInstance();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
    }));

    // Rate limiting
    this.app.use(generalRateLimit);

    // Input sanitization
    this.app.use(sanitizeInput);

    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, { 
        method: req.method, 
        path: req.path, 
        userAgent: req.get('User-Agent'),
        ip: req.ip 
      });
      next();
    });
  }

  private setupRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Speech-to-Text API Server',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          upload: '/api/jobs/upload',
          jobs: '/api/jobs',
        },
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database connection
      await initializeDatabase();
      
      // Initialize database tables
      await initializeTables();

      // Initialize Redis connection  
      await initializeRedis();

      // Initialize dependency injection container
      container.initializeServices();
      logger.info('Dependency injection container initialized');

      // Start server
      this.app.listen(this.port, '0.0.0.0', () => {
        logger.info('Server successfully started', {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          healthCheck: `http://0.0.0.0:${this.port}/api/health`,
          uploadEndpoint: `http://0.0.0.0:${this.port}/api/jobs/upload`
        });
      });

      // Graceful shutdown handling
      process.on('SIGINT', this.shutdown.bind(this));
      process.on('SIGTERM', this.shutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down server gracefully');
    
    try {
      await this.queueService.cleanup();
      logger.info('Queue service cleaned up');
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', error);
      process.exit(1);
    }
  }
}

// Create and start server
const server = new Server();
server.start();