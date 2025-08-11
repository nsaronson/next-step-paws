"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slotValidation = exports.bookingValidation = exports.classValidation = exports.loginValidation = exports.authValidation = void 0;
const joi_1 = __importDefault(require("joi"));
const userRegistrationSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    name: joi_1.default.string().min(2).max(100).required(),
    role: joi_1.default.string().valid('owner', 'customer').required(),
    dogName: joi_1.default.string().min(1).max(100).when('role', {
        is: 'customer',
        then: joi_1.default.required(),
        otherwise: joi_1.default.optional()
    }),
    password: joi_1.default.string().min(6).required()
});
const loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
const classSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(255).required(),
    description: joi_1.default.string().max(1000).optional(),
    schedule: joi_1.default.string().min(2).max(255).required(),
    maxSpots: joi_1.default.number().integer().min(1).max(50).required(),
    price: joi_1.default.number().precision(2).min(0).required(),
    level: joi_1.default.string().valid('Beginner', 'Intermediate', 'Advanced').required()
});
const bookingSchema = joi_1.default.object({
    slotId: joi_1.default.string().uuid().required(),
    dogName: joi_1.default.string().min(1).max(100).required(),
    notes: joi_1.default.string().max(500).optional()
});
const slotSchema = joi_1.default.object({
    date: joi_1.default.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    time: joi_1.default.string().pattern(/^\d{2}:\d{2}$/).required(),
    duration: joi_1.default.number().valid(30, 60).default(60).optional()
});
const authValidation = (req, res, next) => {
    const { error } = userRegistrationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
exports.authValidation = authValidation;
const loginValidation = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
exports.loginValidation = loginValidation;
const classValidation = (req, res, next) => {
    const { error } = classSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
exports.classValidation = classValidation;
const bookingValidation = (req, res, next) => {
    const { error } = bookingSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
exports.bookingValidation = bookingValidation;
const slotValidation = (req, res, next) => {
    const { error } = slotSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};
exports.slotValidation = slotValidation;
//# sourceMappingURL=validation.js.map