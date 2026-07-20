-- VenueGuard multi-tenant PostgreSQL foundation. Apply only through a reviewed migration.
create extension if not exists pgcrypto;

create table tenants (id uuid primary key default gen_random_uuid(), legal_name text not null, plan text not null check (plan in ('STARTER','GROWTH','GLOBAL')), locale text not null default 'en-US', currency char(3) not null default 'USD', created_at timestamptz not null default now());
create table identities (id uuid primary key, tenant_id uuid not null references tenants(id), role text not null, verified_at timestamptz, created_at timestamptz not null default now(), unique(id, tenant_id));
create table venues (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), name text not null, venue_type text not null, timezone text not null, capacity integer check (capacity >= 0), created_at timestamptz not null default now());
create table operational_events (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), venue_id uuid references venues(id), event_type text not null, source text not null, actor_id uuid, payload jsonb not null default '{}', idempotency_key text not null, occurred_at timestamptz not null, recorded_at timestamptz not null default now(), unique(tenant_id, idempotency_key));
create index operational_events_tenant_time on operational_events(tenant_id, recorded_at desc);
create table payment_intents (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), venue_id uuid references venues(id), provider text, provider_reference text, currency char(3) not null, amount_minor bigint not null check(amount_minor > 0), purpose text not null, status text not null, created_at timestamptz not null default now());
create table subscriptions (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references tenants(id), provider_customer_id text, provider_subscription_id text, plan text not null, status text not null, current_period_end timestamptz, unique(tenant_id));

alter table tenants enable row level security;
alter table identities enable row level security;
alter table venues enable row level security;
alter table operational_events enable row level security;
alter table payment_intents enable row level security;
alter table subscriptions enable row level security;
-- Policies must bind app.tenant_id from a verified server-side session; never trust a client header.
