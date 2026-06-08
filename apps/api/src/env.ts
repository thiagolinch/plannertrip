import { z } from 'zod'

const envSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().default('planner-trip-local'),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  API_BASE_URL: z.string().url().default('http://localhost:3333'),
  WEB_BASE_URL: z.string().url().default('http://localhost:5173'),
  PORT: z.coerce.number().default(3333),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.preprocess((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return false;
  }, z.boolean()).default(false),
  MAIL_FROM: z.string().email().optional().default('oi@plann.er'),
})

export const env = envSchema.parse(process.env)