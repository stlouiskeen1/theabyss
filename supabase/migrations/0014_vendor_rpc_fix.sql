-- =============================================================================
-- Abyss — 0014: fix row_to_json misuse in 0013 RPCs
--
-- vendor_products_list and vendor_orders_list used
-- `array_agg(row_to_json order by ...)` — a bare column reference, not a
-- function call — so every call failed with
-- `column "row_to_json" does not exist`. Fixed to `to_jsonb(t)`.
-- vendor_payouts_list ordered by p.created_at, a column its subquery did not
-- select — created_at is now included in the inner select.
-- =============================================================================

create or replace function public.vendor_products_list(p_owner uuid, p_vendor_id uuid)
returns jsonb[]
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.vendor_owned(p_owner, p_vendor_id) then
    raise exception 'vendor_products_list: forbidden';
  end if;
  return (
    select coalesce(array_agg(to_jsonb(t) order by t.created_at desc), '{}')
    from (
      select
        p.id, p.name, p.slug, p.description, p.brand,
        p.base_price, p.currency, p.status, p.created_at,
        (select coalesce(jsonb_agg(to_jsonb(v) order by v.created_at), '[]')
         from public.product_variants v where v.product_id = p.id) as variants,
        (select coalesce(jsonb_agg(to_jsonb(i) order by i.position), '[]')
         from public.product_images i where i.product_id = p.id) as images,
        (select coalesce(sum(v.stock_quantity), 0)
         from public.product_variants v where v.product_id = p.id) as stock_total,
        (select coalesce(sum(oi.quantity), 0)
         from public.order_items oi
         join public.product_variants v on v.id = oi.product_variant_id
         join public.vendor_orders vo on vo.id = oi.vendor_order_id
         where v.product_id = p.id and vo.status <> 'cancelled') as sold_units
      from public.products p
      where p.vendor_id = p_vendor_id
      order by p.created_at desc
    ) t
  );
end;
$$;

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
      select id, amount, status, period_start, period_end, paid_at, created_at
      from public.vendor_payouts
      where vendor_id = p_vendor_id
      order by created_at desc
      limit 200
    ) p
  );
end;
$$;

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
    select coalesce(array_agg(to_jsonb(t) order by t.created_at desc), '{}')
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
