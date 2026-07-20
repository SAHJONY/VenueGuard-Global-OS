# VenueGuard Financial Controls

Production-oriented starter package for VenueGuard's financial control plane.

## Included controls

- GL reconciliation across POS sales, processor settlements, bank deposits, inventory cost, tips, ticket scans, and artist settlements.
- Daily/month-end close gates with unresolved-break protection.
- Statement and settlement auditing with evidence requirements.
- Preliminary KYC completeness screening (not regulatory approval).
- Venue and SaaS unit-economics calculations.
- Human approval enforcement for ledger posting, payouts, bank-account changes, KYC approval, period closing, and fraud allegations.

## Safety model

The AI layer may read, compare, explain, and draft. It cannot post a journal entry, move money, approve KYC, close a period, change a bank account, or accuse a person of fraud. Those actions require a verified venue owner or an explicitly delegated approver, strong authentication, and an immutable audit event.

## Run

```bash
npm test
npm run demo
```

## Integration boundary

Connect adapters to VenueGuard's ledger, POS, payment processor, bank feed, inventory, ticketing, payroll, and DocuSeal. Never make an AI-produced report the source of truth; the append-only operational ledger remains authoritative.
