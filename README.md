# EduPredict AI

Student academic performance prediction and early intervention platform.

## Stack

- React, Vite, TypeScript, Tailwind CSS
- Express and TypeScript API
- Prisma ORM with PostgreSQL
- Supabase PostgreSQL for hosted data
- PrimeCloud for application hosting

## Local development

1. Install Node.js 20 or newer.
2. Install dependencies from the repository root:

   ```sh
   npm install
   ```

3. Configure `server/.env` using `.env.example` as a reference. Use the Supabase session-pooler URL (port `5432`) for `DATABASE_URL`, a direct database URL for `DIRECT_URL`, and set a unique `JWT_SECRET`. Do not commit environment files.
4. Generate the Prisma client and apply the initial migration to a new Supabase database:

   ```sh
   npm run prisma:generate --workspace server
   npm run db:deploy --workspace server
   ```

5. Start the frontend and API:

   ```sh
   npm run dev
   ```

The Vite frontend is available at `http://localhost:5173` and proxies `/api` requests to the API on port `4000`.

## Supabase connection settings

Create a PostgreSQL project in Supabase and use the connection details from **Connect** in the project dashboard:

- `DATABASE_URL`: the Supabase **session pooler** connection string (port `5432`) for the long-running PrimeCloud Node service.
- `DIRECT_URL`: the Supabase direct database connection string for Prisma schema changes and migrations. If the deployment network cannot reach Supabase's direct endpoint, use the Supabase session pooler on port `5432` for this value too.
- Add `?sslmode=require` if it is not already present. URL-encode special characters in the database password.

Do not use the transaction pooler (port `6543`) for this always-on Node service. Never expose either database URL or `JWT_SECRET` to the browser.

The schema is PostgreSQL-only. Existing SQLite development data is not copied automatically; export and migrate it separately if it must be retained.

## PrimeCloud deployment

Create one Node.js application service from the repository and configure:

- **Build command:** `npm ci && npm run build`
- **Start command:** `npm start`
- **Port:** use the `PORT` value supplied by PrimeCloud (the API defaults to `4000` for local development).
- **Node.js:** version 20 or newer.

Add these server environment variables in the PrimeCloud service settings:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET` (generate a unique, high-entropy value)
- `GEMINI_API_KEY` (optional; required for live Gemma API explanations)
- `GEMINI_MODEL` (for example, `gemma-4-31b-it`, if available to your Gemini API account)
- `NODE_ENV=production`

The build produces `client/dist`; in production, the Express service serves the frontend and API from the same origin. This keeps the API base path at `/api` and avoids needing a separate frontend service. Apply the committed Prisma migration to a new Supabase project:

```sh
npm run db:deploy --workspace server
```

For ongoing schema changes, create and review Prisma migrations in development, then run `npm run db:deploy --workspace server` during deployment. If the Supabase database already contains tables or data, do not apply the initial migration blindly: compare the schema and baseline/adapt migrations first. Back up existing data before schema changes.

Health check: `GET /api/health`.
