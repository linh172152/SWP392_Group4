import { Request, Response, NextFunction } from 'express';
import { CustomError } from './error.middleware';

/**
 * Not found middleware
 */
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
