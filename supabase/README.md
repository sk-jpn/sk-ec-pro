# Supabase migration guide

`migrations/` contains the complete, ordered database history for SK EC Pro.
Every filename starts with a unique 14-digit version, and a fresh Supabase
project can apply the files from the first migration to the last migration.

## Production deployment

Run these commands from the repository root. Replace `<project-ref>` with the
reference shown in the Supabase project settings.

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
```

After deployment, run the checks in the next section in Supabase SQL Editor.

## Post-deployment checks

```sql
-- All application tables must exist.
select to_regclass('public.customers') as customers,
       to_regclass('public.estimates') as estimates,
       to_regclass('public.estimate_items') as estimate_items,
       to_regclass('public.estimate_item_images') as estimate_item_images,
       to_regclass('public.profiles') as profiles,
       to_regclass('public.orders') as orders;

-- Required RPCs must exist.
select to_regprocedure('public.create_estimate(text,text,text,text,text,text,text,jsonb)') as create_estimate,
       to_regprocedure('public.claim_customer_account()') as claim_customer_account;

-- RLS must be enabled for all customer-facing tables.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'customers', 'estimates', 'estimate_items',
    'estimate_item_images', 'profiles', 'orders'
  )
order by relname;

-- The private image bucket must exist with its limits.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'estimate-images';
```

## Existing project history

Do not use `migration repair` without first comparing `supabase migration list`
with the actual production schema. If the schema was previously created by
copying `schema.sql` into SQL Editor, the migrations are written to tolerate
the existing objects, but the remote migration history still needs to be
reviewed before `db push`.

Always take a production database backup before the first migration-managed
deployment.
