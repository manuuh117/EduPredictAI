import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemma-4-31b-it',
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required. Configure a Supabase PostgreSQL connection string.');
}

if (!/^postgres(ql)?:\/\//i.test(config.databaseUrl)) {
  throw new Error('DATABASE_URL must be a PostgreSQL connection string for Supabase.');
}

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET is required. Set a strong secret in the environment.');
}
