import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware for request body
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }
      
      req.body = value;
      next();
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Validation middleware error'
      });
    }
  };
};

/**
 * Validation middleware for query parameters
 */
export const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.query);
      
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Query validation error',
          errors: error.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }
      
      req.query = value;
      next();
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Query validation middleware error'
      });
    }
  };
};

/**
 * Validation middleware for URL parameters
 */
export const validateParams = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req.params);
      
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Parameter validation error',
          errors: error.details.map((detail: any) => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }
      
      req.params = value;
      next();
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Parameter validation middleware error'
      });
    }
  };
};
