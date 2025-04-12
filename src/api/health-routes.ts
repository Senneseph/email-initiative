import express from 'express';
import db from '../db/connection';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbConnected = await db.testConnection();
    
    // Get uptime
    const uptime = process.uptime();
    const formattedUptime = formatUptime(uptime);
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Return health status
    res.json({
      status: 'healthy',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: formattedUptime,
      database: {
        connected: dbConnected,
      },
      memory: {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external),
      },
    });
  } catch (error) {
    logger.error('Health check error:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      error: 'Internal server error',
    });
  }
});

/**
 * Detailed health check endpoint
 * GET /api/health/details
 */
router.get('/details', async (req, res) => {
  try {
    // Check database connection
    const dbConnected = await db.testConnection();
    
    // Get system info
    const systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      resourceUsage: process.resourceUsage(),
      uptime: process.uptime(),
    };
    
    // Get environment variables (excluding sensitive ones)
    const env = { ...process.env };
    
    // Remove sensitive environment variables
    const sensitiveKeys = ['DB_PASSWORD', 'JWT_SECRET', 'PASSWORD', 'KEY', 'SECRET', 'TOKEN'];
    for (const key of Object.keys(env)) {
      if (sensitiveKeys.some(sensitive => key.toUpperCase().includes(sensitive))) {
        env[key] = '[REDACTED]';
      }
    }
    
    // Return detailed health status
    res.json({
      status: 'healthy',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: formatUptime(systemInfo.uptime),
      database: {
        connected: dbConnected,
      },
      system: {
        platform: systemInfo.platform,
        arch: systemInfo.arch,
        nodeVersion: systemInfo.nodeVersion,
        cpuUsage: systemInfo.cpuUsage,
        memoryUsage: {
          rss: formatBytes(systemInfo.memoryUsage.rss),
          heapTotal: formatBytes(systemInfo.memoryUsage.heapTotal),
          heapUsed: formatBytes(systemInfo.memoryUsage.heapUsed),
          external: formatBytes(systemInfo.memoryUsage.external),
        },
        resourceUsage: systemInfo.resourceUsage,
      },
      env,
    });
  } catch (error) {
    logger.error('Detailed health check error:', error);
    
    res.status(500).json({
      status: 'unhealthy',
      error: 'Internal server error',
    });
  }
});

/**
 * Format uptime in a human-readable format
 * @param uptime Uptime in seconds
 * @returns Formatted uptime string
 */
function formatUptime(uptime: number): string {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

/**
 * Format bytes in a human-readable format
 * @param bytes Bytes
 * @returns Formatted bytes string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export { router as healthRoutes };
