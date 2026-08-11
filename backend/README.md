# AgriConnect Backend

This repository contains the complete Supabase backend configuration for AgriConnect.

## 🏛 Project Architecture
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT)
- **Authorization**: Row Level Security (RLS) policies
- **Serverless Compute**: Deno Edge Functions (TypeScript)
- **Client Access**: Next.js connects via standard `@supabase/supabase-js` anon keys. No custom Express/FastAPI proxy exists, honoring a strict zero-trust model.

## 🔐 Security Model
AgriConnect relies heavily on database-first security:
- **`public.users`**: The central source of truth for user roles (`farmer`, `buyer`, `admin`). This table is strictly shielded from frontend edits.
- **RLS**: Row-Level Security aggressively prevents users from querying unauthorized records.
- **RPCs**: All complex state modifications (e.g. creating orders, modifying moderation statuses, calculating analytics) execute natively inside Postgres using `SECURITY DEFINER SET search_path = public` functions to guarantee atomicity and bypass RLS cleanly without exposing `service_role` keys to the client.

### Environment Variables
Check `.env.example`.
- **Frontend Safe**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- **Server/Function Only**: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `MARKET_PRICE_API_KEY`. **NEVER embed these in your Next.js application!**

## 🚀 Local Development

Ensure Docker is running, then use the Supabase CLI to begin:

```bash
# 1. Start the local Supabase container stack
npx supabase start

# 2. Reset the database to run all migrations chronologically and insert demo seed data
npx supabase db reset
```

### 🧪 Local Demo Data (Seed)
The `supabase/seed.sql` provides idempotently-inserted mock data for local testing.
*WARNING: The passwords and UUIDs within the seed file are strictly for LOCAL DEVELOPMENT ONLY.*
- Farmer: `farmer@demo.com` / `demo123`
- Buyer: `buyer@demo.com` / `demo123`
- Admin: `admin@demo.com` / `demo123`

### 💻 Edge Functions
To serve the Deno Edge functions locally, run the following commands in separate terminals:
```bash
npx supabase functions serve recommend
npx supabase functions serve refresh-market-prices --no-verify-jwt
npx supabase functions serve analytics
```

## 🛠 Production Deployment Checklist

1. **Deploy Migrations**: 
   ```bash
   npx supabase db push
   ```
2. **Deploy Edge Functions**: 
   ```bash
   npx supabase functions deploy recommend
   npx supabase functions deploy refresh-market-prices --no-verify-jwt
   npx supabase functions deploy analytics
   ```
3. **Environment Setup**: Define `CRON_SECRET` and `FRONTEND_URL` in the Supabase Dashboard's Edge Function Secrets panel.
4. **Data Integrations**: 
   - Integrate actual Market Price APIs into the `refresh-market-prices` Edge Function placeholder.
   - Attach the real AI/Data team's scoring HTTP endpoint into the `recommend` Edge Function stub.
5. **Initial Admin**: Manually update the very first administrative user's role via the SQL editor (`UPDATE public.users SET role = 'admin' WHERE id = '...';`) to prevent privilege escalation workflows from existing on the frontend.
