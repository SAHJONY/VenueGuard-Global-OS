# VenueGuard Global OS

Runnable foundation for the autonomous venue operating system.

## Start

```bash
npm test
npm run dev
```

Open `http://localhost:3000`.

## Current scope

- Owner Command Center demonstration for VELVET TH.
- Tenant-scoped identity and role authorization.
- Append-only operational event ledger.
- Owner-only critical action policy.
- APIs for dashboard summary, events, and health.
- Multi-venue SaaS catalog, subscription plans, and four isolated portal types.
- PostgreSQL tenant schema with row-level security enabled by default.

This release uses demonstration data. It does not move money or connect to a
live payment processor.

## Production boundaries

The database schema is migration-ready but is not applied automatically. Live authentication,
payments, subscriptions, and contract signatures require selected providers, production
credentials, webhook verification, and an operational security review. The application rejects
live payment attempts until that configuration exists.

Provider configuration is documented in `.env.example`. Real secrets belong only in the
deployment platform's encrypted environment settings. `/api/integrations` exposes configuration
state and missing-field counts, never secret names or values.
