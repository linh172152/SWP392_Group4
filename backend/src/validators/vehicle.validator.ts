import Joi from 'joi';

/**
 * Vehicle validation schema
 */
export const vehicleSchema = Joi.object({
  license_plate: Joi.string()
    .min(4)
    .max(20)
    .required()
    .messages({
      'string.min': 'License plate must be at least 4 characters long',
      'string.max': 'License plate must not exceed 20 characters',
      'any.required': 'License plate is required'
    }),
  vehicle_type: Joi.string()
    .valid('MOTORBIKE', 'CAR', 'TRUCK')
    .required()
    .messages({
      'any.only': 'Vehicle type must be one of: MOTORBIKE, CAR, TRUCK',
      'any.required': 'Vehicle type is required'
    }),
  brand: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Brand must be at least 2 characters long',
      'string.max': 'Brand must not exceed 50 characters',
      'any.required': 'Brand is required'
    }),
  model: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Model must be at least 2 characters long',
      'string.max': 'Model must not exceed 50 characters',
      'any.required': 'Model is required'
    }),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional()
    .messages({
      'number.integer': 'Year must be an integer',
      'number.min': 'Year must be at least 1900',
      'number.max': 'Year cannot be in the future'
    }),
  battery_capacity: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.positive': 'Battery capacity must be a positive number'
    })
});

/**
 * Update vehicle validation schema
 */
export const updateVehicleSchema = Joi.object({
  license_plate: Joi.string()
    .min(4)
    .max(20)
    .optional()
    .messages({
      'string.min': 'License plate must be at least 4 characters long',
      'string.max': 'License plate must not exceed 20 characters'
    }),
  vehicle_type: Joi.string()
    .valid('MOTORBIKE', 'CAR', 'TRUCK')
    .optional()
    .messages({
      'any.only': 'Vehicle type must be one of: MOTORBIKE, CAR, TRUCK'
    }),
  brand: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Brand must be at least 2 characters long',
      'string.max': 'Brand must not exceed 50 characters'
    }),
  model: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'Model must be at least 2 characters long',
      'string.max': 'Model must not exceed 50 characters'
    }),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional()
    .messages({
      'number.integer': 'Year must be an integer',
      'number.min': 'Year must be at least 1900',
      'number.max': 'Year cannot be in the future'
    }),
  battery_capacity: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.positive': 'Battery capacity must be a positive number'
    }),
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE', 'MAINTENANCE')
    .optional()
    .messages({
      'any.only': 'Status must be one of: ACTIVE, INACTIVE, MAINTENANCE'
    })
});

/**
 * Vehicle ID parameter validation
 */
export const vehicleIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Vehicle ID must be a valid UUID',
      'any.required': 'Vehicle ID is required'
    })
});

