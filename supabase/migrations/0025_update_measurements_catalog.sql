-- =============================================================================
-- Abyss — 0025: Update measurements catalog to only clothing + EU shoe sizes
--
-- Deactivates unwanted measurements (weight, volume, dimension, extra shoe sizes).
-- Keeps only: XS, S, M, L, XL, XXL (clothing) + 39-45 (EU shoes)
-- =============================================================================

-- Deactivate all measurements first
update public.measurements set is_active = false;

-- Activate only clothing sizes (XS-XXL)
update public.measurements
set is_active = true,
    sort_order = case name
      when 'XS' then 1
      when 'S' then 2
      when 'M' then 3
      when 'L' then 4
      when 'XL' then 5
      when 'XXL' then 6
    end
where name in ('XS', 'S', 'M', 'L', 'XL', 'XXL');

-- Activate only EU shoe sizes 39-45
update public.measurements
set is_active = true,
    sort_order = case name
      when '39' then 10
      when '40' then 11
      when '41' then 12
      when '42' then 13
      when '43' then 14
      when '44' then 15
      when '45' then 16
    end
where name in ('39', '40', '41', '42', '43', '44', '45');

-- Verify
-- select name, unit, category, is_active, sort_order
-- from public.measurements
-- where is_active
-- order by category, sort_order;