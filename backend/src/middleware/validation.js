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
  refreshToken: Joi.object({
  refreshToken: Joi.string().required()
}),

  // ─── EMPLOYEE SCHEMAS ───────────────────────────────────

employeeCreate: Joi.object({
  employee_id: Joi.string().optional().allow('', null),
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional().allow('', null),
  department: Joi.string().min(2).max(100).required(),
  position: Joi.string().min(2).max(100).required(),
  employment_type: Joi.string().valid('full-time', 'part-time', 'contractual').required(),
  date_hired: Joi.date().required(),
  salary: Joi.number().min(0).max(500000).optional().allow(null)
}),

employeeUpdate: Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional().allow('', null),
  department: Joi.string().min(2).max(100).required(),
  position: Joi.string().min(2).max(100).required(),
  employment_type: Joi.string().valid('full-time', 'part-time', 'contractual').required(),
  salary: Joi.number().min(0).max(500000).optional().allow(null),
  status: Joi.string().valid('active', 'inactive').required()
}),

// ─── ATTENDANCE ─────────────────────────────────────────

attendanceCreate: Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  date: Joi.date().required(),
  time_in: Joi.string().allow('', null),
  time_out: Joi.string().allow('', null),
  status: Joi.string().valid('present', 'late', 'absent', 'half-day').required(),
  remarks: Joi.string().max(255).optional().allow('', null)
}),

// ─── PAYROLL ───────────────────────────────────────────

payrollCreate: Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  period_start: Joi.date().required(),
  period_end: Joi.date().required(),
  basic_salary: Joi.number().min(0).required(),
  deductions: Joi.number().min(0).default(0),
  notes: Joi.string().max(500).optional().allow('', null)
}),

payrollUpdate: Joi.object({
  basic_salary: Joi.number().min(0).required(),
  deductions: Joi.number().min(0).default(0),
  status: Joi.string().valid('pending', 'paid').required(),
  notes: Joi.string().max(500).optional().allow('', null)
}),

// ─── PARAMS ─────────────────────────────────────────────

params_id: Joi.object({
  id: Joi.number().integer().positive().required()
}),

  // Order schemas
  order: Joi.object({
    order_code: Joi.string().optional(),
    customer_name: Joi.string().min(2).max(100).required(),
    customer_phone: Joi.string().pattern(/^\+63\d{10}$/).required().messages({
      'string.pattern.base': 'Phone number must start with +63 followed by 10 digits'
    }),
    customer_address: Joi.string().min(5).max(500).required(),
    order_date: Joi.date().required(),
    notes: Joi.string().max(500).optional(),
    salesperson: Joi.string().max(100).optional(),
    items: Joi.array().items(Joi.object({
      item_id: Joi.number().optional(),
      item_name: Joi.string().required(),
      quantity: Joi.number().min(1).max(1000).required(),
      unit_price: Joi.number().min(0).required()
    })).min(1).required()
  }),

  // Inventory schemas
  inventoryItem: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    item_code: Joi.string().min(3).max(50).optional().allow(''),
    category: Joi.string().min(2).max(100).optional().allow(''),
    quantity: Joi.number().min(0).required(),
    reorder_level: Joi.number().min(1).required(),
    supplier: Joi.string().min(2).max(200).optional().allow('')
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
