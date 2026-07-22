-- VenueGuard multi-tenant PostgreSQL foundation. Apply only through a reviewed migration.
create extension if not exists pgcrypto;

create table tenants (id uuid primary key default gen_random_uuid(), legal_name text not null, plan text not null check (plan in ('STARTER','GROWTH','GLOBAL')), locale text not null default 'en-US', currency char(3) not null default 'USD', created_at timestamptz not null default now());
create table identities (id uuid primary key, tenant_id uuid not null references tenants(id), role text not null, verified_at timestamptz, created_at timestamptz not null default now(), unique(id, tenant_id));
create table venues (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), name text not null, venue_type text not null, timezone text not null, capacity integer check (capacity >= 0), created_at timestamptz not null default now());
create table operational_events (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), venue_id uuid references venues(id), event_type text not null, source text not null, actor_id uuid, payload jsonb not null default '{}', idempotency_key text not null, occurred_at timestamptz not null, recorded_at timestamptz not null default now(), unique(tenant_id, idempotency_key));
create index operational_events_tenant_time on operational_events(tenant_id, recorded_at desc);
create table payment_intents (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), venue_id uuid references venues(id), provider text, provider_reference text, currency char(3) not null, amount_minor bigint not null check(amount_minor > 0), purpose text not null, status text not null, created_at timestamptz not null default now());
create table subscriptions (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), provider_customer_id text, provider_subscription_id text, plan text not null, status text not null, current_period_end timestamptz, unique(tenant_id));
create table connector_sources (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), venue_id uuid not null references venues(id), provider text not null, external_account_ref text not null, access_mode text not null check (access_mode = 'READ_ONLY'), status text not null default 'PENDING', last_sync_at timestamptz, created_at timestamptz not null default now(), unique(tenant_id, provider, external_account_ref));
create table ingestion_receipts (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), venue_id uuid not null references venues(id), connector_id uuid references connector_sources(id), idempotency_key text not null, event_type text not null, amount_minor bigint not null default 0, currency char(3) not null, occurred_at timestamptz not null, received_at timestamptz not null default now(), payload_sha256 text not null, status text not null check(status in ('ACCEPTED','RECONCILED','REJECTED')), unique(tenant_id, idempotency_key));
create table daily_profit_snapshots (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), venue_id uuid not null references venues(id), business_date date not null, revenue_minor bigint not null, variable_cost_minor bigint not null, contribution_minor bigint generated always as (revenue_minor - variable_cost_minor) stored, currency char(3) not null, reconciliation_status text not null check(reconciliation_status in ('PENDING','RECONCILED','REVIEW_REQUIRED')), source_event_count integer not null check(source_event_count >= 0), calculated_at timestamptz not null default now(), unique(tenant_id, venue_id, business_date));
create table approval_requests (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), venue_id uuid references venues(id), action_type text not null, requested_by uuid references identities(id), amount_minor bigint, currency char(3), evidence jsonb not null default '{}', status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED','EXPIRED')), decided_by uuid references identities(id), decided_at timestamptz, created_at timestamptz not null default now(), check((status = 'PENDING' and decided_by is null and decided_at is null) or (status <> 'PENDING' and decided_by is not null and decided_at is not null)));
create table security_audit_log (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), actor_id uuid references identities(id), action text not null, resource_type text not null, resource_id text, outcome text not null, ip_hash text, metadata jsonb not null default '{}', occurred_at timestamptz not null default now());
create index ingestion_receipts_tenant_time on ingestion_receipts(tenant_id, received_at desc);
create index profit_snapshots_tenant_date on daily_profit_snapshots(tenant_id, business_date desc);
create index approvals_pending on approval_requests(tenant_id, status, created_at) where status = 'PENDING';
create index security_audit_tenant_time on security_audit_log(tenant_id, occurred_at desc);

alter table tenants enable row level security;
alter table identities enable row level security;
alter table venues enable row level security;
alter table operational_events enable row level security;
alter table payment_intents enable row level security;
alter table subscriptions enable row level security;
alter table connector_sources enable row level security;
alter table ingestion_receipts enable row level security;
alter table daily_profit_snapshots enable row level security;
alter table approval_requests enable row level security;
alter table security_audit_log enable row level security;

alter table tenants force row level security;
alter table identities force row level security;
alter table venues force row level security;
alter table operational_events force row level security;
alter table payment_intents force row level security;
alter table subscriptions force row level security;
alter table connector_sources force row level security;
alter table ingestion_receipts force row level security;
alter table daily_profit_snapshots force row level security;
alter table approval_requests force row level security;
alter table security_audit_log force row level security;

create schema if not exists app_private;
create or replace function app_private.current_tenant_id() returns uuid language sql stable as $$ select nullif(current_setting('app.tenant_id', true), '')::uuid $$;

create policy tenant_isolation on tenants using (id = app_private.current_tenant_id()) with check (id = app_private.current_tenant_id());
create policy tenant_isolation on identities using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());
create policy tenant_isolation on venues using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());
create policy tenant_isolation on operational_events using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());
create policy tenant_isolation on payment_intents using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());
create policy tenant_isolation on subscriptions using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());
create policy tenant_isolation on connector_sources using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());
create policy tenant_isolation on ingestion_receipts using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());
create policy tenant_isolation on daily_profit_snapshots using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());
create policy tenant_isolation on approval_requests using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());
create policy tenant_isolation on security_audit_log using (tenant_id = app_private.current_tenant_id()) with check (tenant_id = app_private.current_tenant_id());

-- The application transaction must SET LOCAL app.tenant_id from a verified server-side session.
-- Never derive tenant scope from request headers or body fields.
