# Production pilot runbook

VenueGuard may enter a paid pilot only when `GET /api/readiness` returns `200` with
`mode: PILOT_READY`. A deployed webpage or passing unit tests do not satisfy this gate.

## Allowed pilot scope

- Read-only POS, ticketing, inventory, and labor imports.
- Reconciled dashboards, forecasts, alerts, and owner-approved recommendations.
- Human review of every financial, purchasing, payroll, personnel, and contractual action.

VenueGuard must not hold funds, initiate payments, place orders, edit payroll, sign contracts,
or discipline staff. Provider credentials should use the narrowest read-only scopes available.

## Go-live checklist

1. Apply `db/schema.sql` through a reviewed migration and use a non-owner application role.
2. Set `app.tenant_id` from the verified server session inside every database transaction.
3. Test cross-tenant reads and writes against the deployed database.
4. Configure OIDC authentication, JWKS verification, mandatory MFA, session expiry, and role claims.
5. Configure the signed POS webhook and a durable idempotent ingestion sink.
6. Reconcile at least seven historical business days to source totals within 0.5%.
7. Configure encrypted secrets, error monitoring, synthetic health checks, and alert routing.
8. Confirm daily backups and complete a documented restore test.
9. Complete an external penetration test and remediate critical/high findings.
10. Record the owner who approved pilot activation and the exact connected data scopes.

## Profit evidence

Projected opportunity value and confirmed recovered profit are separate measures. A profit event
is confirmed only when the source transaction is reconciled, the owner-approved action is recorded,
and the result is measured against an agreed baseline. Never market forecasts as guaranteed profit.

## Incident and rollback

- Disable the affected connector and preserve its ingestion receipts.
- Rotate any potentially exposed secret in the provider and deployment platform.
- Put affected tenants into read-only mode and notify the accountable owner.
- Roll back to the last known-good Vercel deployment when a release causes the incident.
- Restore data only from a tested backup; never repair the ledger by deleting audit events.
- Record timeline, tenant impact, evidence, remediation, and follow-up owner.

Pilot launch requires zero critical security findings, verified restore evidence, reconciliation
within the contracted tolerance, and explicit written owner acceptance of the advisory-only scope.
