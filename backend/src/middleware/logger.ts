import morgan from 'morgan';
import { Request, Response } from 'express';

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (_req: Request, res: Response) => {
  const responseTime = res.getHeader('X-Response-Time');
  return responseTime ? `${responseTime}ms` : '-';
});

// Custom token for request ID (if available)
morgan.token('request-id', (req: Request) => {
  return (req as any).id || '-';
});

// Custom format for development
const developmentFormat = ':method :url :status :response-time ms - :res[content-length]';

// Custom format for production
const productionFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Create logger middleware
export const requestLogger = morgan(
  process.env['NODE_ENV'] === 'production' ? productionFormat : developmentFormat,
  {
    // Skip logging for health check endpoints
    skip: (req: Request) => {
      return req.url === '/health' || req.url === '/api/health';
    },
    // Custom stream for production (could be file or external service)
    stream: process.env['NODE_ENV'] === 'production' ? process.stdout : process.stdout
  }
);

// Response time middleware
export function responseTime(_req: Request, res: Response, next: Function): void {
  const start = Date.now();
  
  // Override the end method to set header before response is sent
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: () => void) {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', duration);
    }
    return originalEnd(chunk, encoding, cb);
  };
  
  next();
}

// Request ID middleware for tracing
export function requestId(req: Request, res: Response, next: Function): void {
  const id = Math.random().toString(36).substring(2, 15);
  (req as any).id = id;
  res.setHeader('X-Request-ID', id);
  next();
}