# VenueGuard integration map

| VenueGuard source | Control output |
|---|---|
| POS + ticketing | Gross sales, refunds, attendance |
| Payments | Authorized, captured, refunded, disputed |
| Settlement feed | Processor net settlement and fees |
| Bank feed | Deposits and withdrawals |
| Inventory ledger | Theoretical and actual COGS |
| Employee ledger | Tips, commissions, payroll due |
| Artist contracts | Guarantees, splits, deductions |
| Supplier documents | PO, receipt, invoice, payable |

## Required event envelope

```json
{
  "event_id": "globally-unique-id",
  "tenant_id": "venue-owner-controlled-tenant",
  "venue_id": "venue-id",
  "occurred_at": "ISO-8601",
  "source": "pos|payments|bank|inventory|payroll|contracts",
  "source_reference": "provider-id",
  "actor_id": "employee-or-system-id",
  "currency": "ISO-4217",
  "amount_minor": 0,
  "evidence_ids": [],
  "idempotency_key": "stable-replay-key"
}
```

Production amounts must be stored in integer minor units.
