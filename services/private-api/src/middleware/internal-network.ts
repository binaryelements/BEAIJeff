import { Request, Response, NextFunction } from 'express';

export function internalNetworkOnly(req: Request, res: Response, next: NextFunction): void {
  // Since the private-api service doesn't expose any ports,
  // it's only accessible from within the Docker network.
  // This middleware is kept for logging purposes only.
  
  const clientIp = req.ip || req.socket.remoteAddress || '';
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${clientIp}`);
  
  next();
}