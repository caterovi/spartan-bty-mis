const Joi = require('joi');
const logger = require('../utils/logger');

// Common validation schemas
const schemas = {
  // Authentication schemas
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
  }),

  register: Joi.object({
    full_name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Full name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
      'any.required': 'Password is required'
    }),
    role: Joi.string().valid('admin', 'hr', 'marketing', 'sales', 'crm', 'inventory', 'logistics').required().messages({
      'any.only': 'Role must be one of: admin, hr, marketing, sales, crm, inventory, logistics',
      'any.required': 'Role is required'
    })
  }),

  // Employee schemas
  employee: Joi.object({
    full_name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    position: Joi.string().min(2).max(100).required(),
    department: Joi.string().min(2).max(100).required(),
    salary: Joi.number().min(15000).max(500000).required().messages({
      'number.min': 'Salary must be at least ₱15,000',
      'number.max': 'Salary cannot exceed ₱500,000'
    }),
    hire_date: Joi.date().required(),
    role: Joi.string().valid('admin', 'hr', 'marketing', 'sales', 'crm', 'inventory', 'logistics').required()
  }),

  // Order schemas
  order: Joi.object({
    customer_name: Joi.string().min(2).max(100).required(),
    customer_email: Joi.string().email().required(),
    customer_phone: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required().messages({
      'string.pattern.base': 'Phone number must be 11 digits'
    }),
    shipping_address: Joi.string().min(10).max(500).required(),
    items: Joi.array().items(Joi.object({
      item_name: Joi.string().required(),
      quantity: Joi.number().min(1).max(1000).required(),
      unit_price: Joi.number().min(0).required()
    })).min(1).required(),
    payment_method: Joi.string().valid('cash', 'card', 'bank_transfer', 'gcash', 'maya').required(),
    down_payment: Joi.number().min(0).required()
  }),

  // Inventory schemas
  inventoryItem: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    item_code: Joi.string().min(3).max(50).required(),
    category: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(1000).optional(),
    unit_price: Joi.number().min(0).required(),
    quantity: Joi.number().min(0).required(),
    reorder_level: Joi.number().min(1).required(),
    supplier: Joi.string().min(2).max(200).required(),
    status: Joi.string().valid('in-stock', 'low-stock', 'out-of-stock').required()
  }),

  // Customer schemas
  customer: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(new RegExp('^[0-9]{11}$')).required(),
    address: Joi.string().min(10).max(500).required(),
    company: Joi.string().max(200).optional(),
    notes: Joi.string().max(1000).optional()
  }),

  // Feedback schemas
  feedback: Joi.object({
    customer_name: Joi.string().min(2).max(100).required(),
    customer_email: Joi.string().email().required(),
    type: Joi.string().valid('complaint', 'suggestion', 'compliment', 'inquiry').required(),
    subject: Joi.string().min(5).max(200).required(),
    message: Joi.string().min(10).max(2000).required(),
    rating: Joi.number().min(1).max(5).optional()
  })
};

// Validation middleware factory
const validate = (schemaName, source = 'body') => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      logger.error(`Validation schema not found: ${schemaName}`);
      return res.status(500).json({ message: 'Server error' });
    }

    const data = source === 'body' ? req.body : 
                source === 'params' ? req.params : 
                source === 'query' ? req.query : req.body;

    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true,
      convert: true 
    });

    if (error) {
      logger.warn('Validation failed', { 
        schema: schemaName, 
        errors: error.details,
        input: data,
        ip: req.ip 
      });

      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }))
      });
    }

    // Store validated data for use in controllers
    req.validated = req.validated || {};
    req.validated[source] = value;
    next();
  };
};

module.exports = { validate, schemas };
