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
- Multi-model AI control plane with OpenAI orchestration, Anthropic failover, redacted readiness, and owner-only financial authority.

This release uses demonstration data. It does not move money or connect to a
live payment processor.

## Production boundaries

The database schema is migration-ready but is not applied automatically. Live authentication,
payments, subscriptions, and contract signatures require selected providers, production
credentials, webhook verification, and an operational security review. The application rejects
live payment attempts until that configuration exists.

## AI brain

The default primary model is `gpt-5.6-sol`; `claude-fable-5` is the default cross-provider fallback. Model IDs are environment-configurable. The platform fails closed when credentials are missing, never returns keys from status APIs, and prevents models from releasing funds, signing contracts, approving payments, or accusing people.

Provider configuration is documented in `.env.example`. Real secrets belong only in the
deployment platform's encrypted environment settings. `/api/integrations` exposes configuration
state and missing-field counts, never secret names or values.
