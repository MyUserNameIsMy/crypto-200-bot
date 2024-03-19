import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export function ResponseTimeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - start;
    Logger.debug(`Request to ${req.method} ${req.url} took ${responseTime}ms`);
  });

  next();
}
