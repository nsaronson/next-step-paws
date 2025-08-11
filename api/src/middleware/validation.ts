import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('owner', 'customer').required(),
  dogName: Joi.string().min(1).max(100).when('role', {
    is: 'customer',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const classSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(1000).optional(),
  schedule: Joi.string().min(2).max(255).required(),
  maxSpots: Joi.number().integer().min(1).max(50).required(),
  price: Joi.number().precision(2).min(0).required(),
  level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').required()
});

const bookingSchema = Joi.object({
  slotId: Joi.string().uuid().required(),
  dogName: Joi.string().min(1).max(100).required(),
  notes: Joi.string().max(500).optional()
});

const slotSchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  duration: Joi.number().valid(30, 60).default(60).optional()
});

export const authValidation = (req: Request, res: Response, next: NextFunction) => {
  const { error } = userRegistrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const loginValidation = (req: Request, res: Response, next: NextFunction) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const classValidation = (req: Request, res: Response, next: NextFunction) => {
  const { error } = classSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const bookingValidation = (req: Request, res: Response, next: NextFunction) => {
  const { error } = bookingSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const slotValidation = (req: Request, res: Response, next: NextFunction) => {
  const { error } = slotSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
