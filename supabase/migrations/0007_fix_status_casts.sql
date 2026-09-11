-- =============================================================================
-- Abyss — 0007: cast status CASE results to their enum types
--
-- 0005's order_advance assigned a multi-branch CASE of text literals to
-- orders.status (order_status enum). PostgreSQL won't implicitly coerce a CASE
-- whose result type is text into an enum column, so the desk "advance" button
-- errored (42804). Redefines order_advance / order_cancel with explicit casts.
-- =============================================================================

create or replace function public.order_advance(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.vendor_orders
     set status = (case status
       when 'pending' then 'processing'
       when 'processing' then 'shipped'
       when 'shipped' then 'delivered'
       else status
     end)::public.vendor_order_status
   where order_id = p_order_id
     and status in ('pending', 'processing', 'shipped');

  update public.orders o
     set status = (case
       when not exists (
         select 1 from public.vendor_orders vo
         where vo.order_id = o.id and vo.status <> 'cancelled'
       ) then 'cancelled'
       when not exists (
         select 1 from public.vendor_orders vo
         where vo.order_id = o.id and vo.status <> 'delivered'
       ) then 'completed'
       when exists (
         select 1 from public.vendor_orders vo
         where vo.order_id = o.id and vo.status in ('processing', 'shipped')
       ) then 'confirmed'
       else 'pending'
     end)::public.order_status
   where o.id = p_order_id;
end;
$$;

create or replace function public.order_cancel(p_order_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.vendor_orders
     set status = 'cancelled'
   where order_id = p_order_id
     and status in ('pending', 'processing', 'shipped');

  update public.orders o
     set status = 'cancelled',
         collected = false
   where o.id = p_order_id
     and not exists (
       select 1 from public.vendor_orders vo
       where vo.order_id = p_order_id and vo.status = 'delivered'
     );
end;
$$;