-- The admin dashboard's counts, worked out in Postgres. Fetching the raw rows instead would hit
-- PostgREST's max_rows (1,000) once a busy fortnight has more forms than that, silently
-- under-counting. This returns a few dozen numbers however many forms there are.

-- security invoker: runs as the caller, so RLS still applies (a framer would only count their own).
create function public.dashboard_summary(p_from date, p_to date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with forms as (
    select * from public.safety_forms where date between p_from and p_to
  )
  select jsonb_build_object(
    'perDay', (
      select coalesce(jsonb_agg(jsonb_build_object('date', date, 'count', n)), '[]')
      from (select date, count(*) as n from forms group by date) d
    ),
    'perSite', (
      select coalesce(jsonb_agg(jsonb_build_object('jobSiteId', job_site_id, 'count', n)), '[]')
      from (select job_site_id, count(*) as n from forms group by job_site_id) s
    ),
    'workersToday', (
      select coalesce(jsonb_agg(distinct worker_id), '[]') from forms where date = p_to
    ),
    'withIssues', (
      select count(*) from forms
      where not (hard_hat_worn and vest_worn and boots_worn and eye_protection_worn
        and fall_protection_inspected and scaffolding_inspected and ladders_inspected
        and tools_inspected and cords_inspected and hazards_identified)
    ),
    -- Keyed like CHECKLIST_ITEMS in the app, so no renaming is needed there.
    'missed', (
      select jsonb_build_object(
        'hardHatWorn', count(*) filter (where not hard_hat_worn),
        'vestWorn', count(*) filter (where not vest_worn),
        'bootsWorn', count(*) filter (where not boots_worn),
        'eyeProtectionWorn', count(*) filter (where not eye_protection_worn),
        'fallProtectionInspected', count(*) filter (where not fall_protection_inspected),
        'scaffoldingInspected', count(*) filter (where not scaffolding_inspected),
        'laddersInspected', count(*) filter (where not ladders_inspected),
        'toolsInspected', count(*) filter (where not tools_inspected),
        'cordsInspected', count(*) filter (where not cords_inspected),
        'hazardsIdentified', count(*) filter (where not hazards_identified)
      )
      from forms
    )
  )
$$;

revoke execute on function public.dashboard_summary from public, anon;
grant execute on function public.dashboard_summary to authenticated;
