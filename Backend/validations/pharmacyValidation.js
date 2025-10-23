// HealthPath/backend/validations/pharmacyValidation.js
const Joi = require('joi');

const pharmacyAddValidation = Joi.object({
  medicineName: Joi.string().min(2).max(200).required().messages({
    'string.empty': 'Medicine name is required',
    'string.min': 'Medicine name must be at least 2 characters',
    'any.required': 'Medicine name is required'
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock must be a number',
    'number.integer': 'Stock must be a whole number',
    'number.min': 'Stock cannot be negative',
    'any.required': 'Stock is required'
  }),
  price: Joi.number().min(0.01).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price must be at least 0.01',
    'any.required': 'Price is required'
  }),
  expiryDate: Joi.date().min('now').optional().messages({
    'date.base': 'Expiry date must be a valid date',
    'date.min': 'Expiry date must be in the future'
  }),
  category: Joi.string().max(100).optional().messages({
    'string.max': 'Category must be at most 100 characters'
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description must be at most 500 characters'
  }),
  name: Joi.string().max(200).optional()
  // pharmacistName is automatically set by backend, not required in request
});

module.exports = { pharmacyAddValidation };
