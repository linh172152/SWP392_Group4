import Joi from 'joi';

/**
 * Battery validation schema
 */
export const batterySchema = Joi.object({
  station_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Station ID must be a valid UUID',
      'any.required': 'Station ID is required'
    }),
  battery_type: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Battery type must be at least 2 characters long',
      'string.max': 'Battery type must not exceed 50 characters',
      'any.required': 'Battery type is required'
    }),
  capacity: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Capacity must be a positive number',
      'any.required': 'Capacity is required'
    }),
  current_charge: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Current charge must be at least 0',
      'number.max': 'Current charge cannot exceed 100'
    }),
  health_percentage: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Health percentage must be at least 0',
      'number.max': 'Health percentage cannot exceed 100'
    })
});

/**
 * Update battery status validation schema
 */
export const updateBatteryStatusSchema = Joi.object({
  status: Joi.string()
    .valid('AVAILABLE', 'IN_USE', 'CHARGING', 'MAINTENANCE', 'RETIRED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: AVAILABLE, IN_USE, CHARGING, MAINTENANCE, RETIRED'
    }),
  current_charge: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Current charge must be at least 0',
      'number.max': 'Current charge cannot exceed 100'
    }),
  health_percentage: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Health percentage must be at least 0',
      'number.max': 'Health percentage cannot exceed 100'
    })
});

/**
 * Battery query parameters validation
 */
export const batteryQuerySchema = Joi.object({
  station_id: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Station ID must be a valid UUID'
    }),
  status: Joi.string()
    .valid('AVAILABLE', 'IN_USE', 'CHARGING', 'MAINTENANCE', 'RETIRED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: AVAILABLE, IN_USE, CHARGING, MAINTENANCE, RETIRED'
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

/**
 * Battery ID parameter validation
 */
export const batteryIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Battery ID must be a valid UUID',
      'any.required': 'Battery ID is required'
    })
});

