import Joi from 'joi';

/**
 * User registration validation schema
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  full_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 100 characters',
      'any.required': 'Full name is required'
    }),
  phone: Joi.string()
    .min(10)
    .max(15)
    .required()
    .messages({
      'string.min': 'Phone number must be at least 10 characters long',
      'string.max': 'Phone number must not exceed 15 characters',
      'any.required': 'Phone number is required'
    }),
  role: Joi.string()
    .valid('DRIVER', 'STAFF', 'ADMIN')
    .default('DRIVER')
    .messages({
      'any.only': 'Role must be one of: DRIVER, STAFF, ADMIN'
    })
});

/**
 * User login validation schema
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

/**
 * Update profile validation schema
 */
export const updateProfileSchema = Joi.object({
  full_name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 100 characters'
    }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .min(10)
    .max(15)
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must contain only digits, +, -, spaces, and parentheses',
      'string.min': 'Phone number must be at least 10 characters long',
      'string.max': 'Phone number must not exceed 15 characters'
    })
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required'
    })
});

