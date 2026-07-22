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
- Profit Autopilot with contribution economics, close forecasting, and ranked recoverable opportunities.
- Executive revenue velocity, channel mix, and per-guest performance intelligence.
- Interactive owner approvals and an explainable VenueGuard command interface in demo mode.
- Tenant-scoped identity and role authorization.
- Append-only operational event ledger.
- Owner-only critical action policy.
- APIs for dashboard summary, events, and health.
- Multi-venue SaaS catalog, subscription plans, and four isolated portal types.
- PostgreSQL tenant schema with row-level security enabled by default.
- Multi-model AI control plane with OpenAI orchestration, Anthropic failover, redacted readiness, and owner-only financial authority.

This release uses demonstration data. It does not move money or connect to a
live payment processor.

## Commercial model

VenueGuard is positioned around measurable profit recovery rather than dashboard access alone.
The product foundation supports tiered subscriptions, with the Profit Autopilot providing a clear
path to premium pricing and future performance-based revenue capture. Live recommendations must
remain human-approved until production data quality, provider integrations, and governance controls
have been validated.

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

## Paid pilot gate

`GET /api/readiness` is the fail-closed operational gate for a real paid pilot. It is routed through
the consolidated integrations function to stay within deployment limits and returns `503`
until durable storage, OIDC/JWKS authentication, enforced MFA, signed read-only ingestion,
monitoring, backups, and restore evidence are configured. Signed POS events are accepted through
`POST /api/ingest` only after a durable idempotent sink is configured; client-provided tenant IDs
are ignored in favor of server-controlled scope.

See [docs/production-pilot.md](docs/production-pilot.md) for the go-live, profit-evidence,
incident-response, and rollback requirements. Passing tests alone does not authorize a pilot.
