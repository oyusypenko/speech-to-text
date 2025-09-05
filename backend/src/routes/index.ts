import { Router } from 'express';
import jobRoutes from './jobs';
import { ResponseWrapper } from '../utils/responseWrapper';
import { HealthCheckResponse } from '../types';
import { container } from '../container/Container';

const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const whisperService = container.getWhisperService();
    const whisperHealthy = await whisperService.healthCheck();
    
    const healthData: HealthCheckResponse = {
      status: whisperHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up', // TODO: Add actual database health check
        redis: 'up',     // TODO: Add actual redis health check  
        whisper: whisperHealthy ? 'up' : 'down',
      },
    };

    const statusCode = whisperHealthy ? 200 : 503;
    return ResponseWrapper.success(res, healthData, 'Health check completed', statusCode);
  } catch (error) {
    return ResponseWrapper.serviceUnavailable(res, 'Service health check failed');
  }
});

// API routes
router.use('/jobs', jobRoutes);

export default router;