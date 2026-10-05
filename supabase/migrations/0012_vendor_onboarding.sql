-- =============================================================================
-- Abyss — 0012: vendor onboarding + dashboard RPCs
--
-- Ships the "Seller onboarding" sprint's database half. The public schema is
-- locked down (0009: anon/authenticated have no direct table access), so the
-- seller flow talks exclusively through SECURITY DEFINER RPCs:
--
--   • vendor_apply            — authenticated owner creates a `pending` vendor
--   • vendor_list_own         — dashboard: vendors owned by a user
--   • vendor_orders_list      — dashboard: sub-orders for one owned vendor
--   • vendor_payouts_list     — dashboard: payouts for one owned vendor
--   • vendor_public_get       — public storefront: active vendor + products
--
-- Server routes call the first four with the session user id (service_role,
-- same pattern as order_list_by_sub). vendor_public_get stays anon-executable
-- so /seller/[id] can render live data with a mock fallback.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. vendor_apply — create a `pending` vendor for an owner.
-- ---------------------------------------------------------------------------
create or replace function public.vendor_apply(
  p_owner uuid,
  p_name text,
  p_slug text,
  p_description text default null,
  p_wilaya_id integer default null,
  p_commune_id integer default null
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_slug text := lower(nullif(btrim(coalesce(p_slug, '')), ''));
  v_desc text := nullif(btrim(coalesce(p_description, '')), '');
  v_email text;
  v_id uuid;
begin
  if p_owner is null then
    raise exception 'vendor_apply: owner is required';
  end if;
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'vendor_apply: name must be 2-80 characters';
  end if;
  if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or char_length(v_slug) < 3 or char_length(v_slug) > 48 then
    raise exception 'vendor_apply: slug must be 3-48 chars, lowercase letters, numbers and hyphens';
  end if;
  if v_desc is not null and char_length(v_desc) > 2000 then
    raise exception 'vendor_apply: description is too long (max 2000)';
  end if;
  if p_wilaya_id is not null and not exists (select 1 from public.wilayas where id = p_wilaya_id) then
    raise exception 'vendor_apply: unknown wilaya';
  end if;
  if p_commune_id is not null and not exists (select 1 from public.communes where id = p_commune_id) then
    raise exception 'vendor_apply: unknown commune';
  end if;
  if exists (select 1 from public.vendors where slug = v_slug) then
    raise exception 'vendor_apply: slug_taken';
  end if;

  -- Ensure the owner has a profile (signup trigger normally covers this).
  select email into v_email from auth.users where id = p_owner;
  insert into public.profiles (id, full_name)
  values (p_owner, coalesce(v_email, 'seller'))
  on conflict (id) do nothing;

  insert into public.vendors (owner_id, name, slug, description, wilaya_id, commune_id, status)
  values (p_owner, v_name, v_slug, v_desc, p_wilaya_id, p_commune_id, 'pending')
  returning id into v_id;

  return (select to_jsonb(v) from public.vendors v where v.id = v_id);
end;
$$;

revoke all on function public.vendor_apply(uuid, text, text, text, integer, integer) from public;
revoke all on function public.vendor_apply(uuid, text, text, text, integer, integer) from anon, authenticated;
grant execute on function public.vendor_apply(uuid, text, text, text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 2. vendor_list_own — vendors owned by a user, newest first.
-- ---------------------------------------------------------------------------
create or replace function public.vendor_list_own(p_owner uuid)
returns jsonb[]
language sql
stable
security definer set search_path = public
as $$
  select coalesce(array_agg(to_jsonb(v) order by v.created_at desc), '{}')
  from public.vendors v
  where v.owner_id = p_owner;
$$;

revoke all on function public.vendor_list_own(uuid) from public;
revoke all on function public.vendor_list_own(uuid) from anon, authenticated;
grant execute on function public.vendor_list_own(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 3. vendor_orders_list — sub-orders for one owned vendor (ownership checked).
-- ---------------------------------------------------------------------------
create or replace function public.vendor_orders_list(p_owner uuid, p_vendor_id uuid)
returns jsonb[]
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.vendors where id = p_vendor_id and owner_id = p_owner) then
    raise exception 'vendor_orders_list: forbidden';
  end if;
  return (
    select coalesce(array_agg(row_to_json order by created_at desc), '{}')
    from (
      select
        vo.id, vo.status, vo.subtotal, vo.commission_amount,
        vo.tracking_number, vo.created_at,
        o.id as order_id, o.ref as order_ref, o.status as order_status,
        o.total_amount as order_total, o.payment_method,
        (select count(*) from public.order_items oi where oi.vendor_order_id = vo.id) as items
      from public.vendor_orders vo
      join public.orders o on o.id = vo.order_id
      where vo.vendor_id = p_vendor_id
      order by vo.created_at desc
      limit 200
    ) t
  );
end;
$$;

revoke all on function public.vendor_orders_list(uuid, uuid) from public;
revoke all on function public.vendor_orders_list(uuid, uuid) from anon, authenticated;
grant execute on function public.vendor_orders_list(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 4. vendor_payouts_list — payouts for one owned vendor (ownership checked).
-- ---------------------------------------------------------------------------
create or replace function public.vendor_payouts_list(p_owner uuid, p_vendor_id uuid)
returns jsonb[]
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.vendors where id = p_vendor_id and owner_id = p_owner) then
    raise exception 'vendor_payouts_list: forbidden';
  end if;
  return (
    select coalesce(array_agg(to_jsonb(p) order by p.created_at desc), '{}')
    from (
      select id, amount, status, period_start, period_end, paid_at
      from public.vendor_payouts
      where vendor_id = p_vendor_id
      order by created_at desc
      limit 200
    ) p
  );
end;
$$;

revoke all on function public.vendor_payouts_list(uuid, uuid) from public;
revoke all on function public.vendor_payouts_list(uuid, uuid) from anon, authenticated;
grant execute on function public.vendor_payouts_list(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 5. vendor_public_get — public storefront payload (anon-executable).
-- ---------------------------------------------------------------------------
create or replace function public.vendor_public_get(p_slug text)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_vendor public.vendors%rowtype;
begin
  select * into v_vendor from public.vendors
  where slug = p_slug and status = 'active' limit 1;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'vendor', to_jsonb(v_vendor),
    'products', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', p.id, 'name', p.name, 'slug', p.slug,
        'base_price', p.base_price, 'currency', p.currency,
        'brand', p.brand, 'description', p.description,
        'image_url', (
          select pi.url from public.product_images pi
          where pi.product_id = p.id order by pi.position asc limit 1
        ),
        'stock', (
          select coalesce(sum(pv.stock_quantity), 0)
          from public.product_variants pv where pv.product_id = p.id
        )
      ) order by p.created_at desc), '[]')
      from public.products p
      where p.vendor_id = v_vendor.id and p.status = 'active'
      limit 48
    )
  );
end;
$$;

revoke all on function public.vendor_public_get(text) from public;
grant execute on function public.vendor_public_get(text) to anon, authenticated, service_role;
