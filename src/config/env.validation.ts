import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
    PORT: Joi.number().default(3000),

    DATABASE_URL: Joi.string().required(),

    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRATION: Joi.string().default('15m'),

    REFRESH_TOKEN_SECRET: Joi.string().required(),
    REFRESH_TOKEN_EXPIRATION: Joi.string().default('7d'),

    CLOUDINARY_CLOUD_NAME: Joi.string().required(),
    CLOUDINARY_API_KEY: Joi.string().required(),
    CLOUDINARY_API_SECRET: Joi.string().required(),

    // Mail (Gmail SMTP)
    MAIL_HOST: Joi.string().default('smtp.gmail.com'),
    MAIL_PORT: Joi.number().default(587),
    MAIL_USER: Joi.string().email().required(),
    MAIL_PASS: Joi.string().required(),
    MAIL_FROM: Joi.string().email().required(),

    // Frontend URL for email links
    FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
});