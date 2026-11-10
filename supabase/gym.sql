-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (زر «سجّل دخولك في الجيم»). آمن لو اتشغل أكتر من مرة.
create table if not exists public.gym_checkins(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  left_at timestamptz
);
create index if not exists gym_checkins_idx on public.gym_checkins(client_id, created_at desc);
alter table public.gym_checkins enable row level security;

drop policy if exists "gym read" on public.gym_checkins;
create policy "gym read" on public.gym_checkins for select
  using (client_id = auth.uid() or public.is_admin());

drop policy if exists "gym insert" on public.gym_checkins;
create policy "gym insert" on public.gym_checkins for insert
  with check (client_id = auth.uid());

drop policy if exists "gym update own" on public.gym_checkins;
create policy "gym update own" on public.gym_checkins for update
  using (client_id = auth.uid()) with check (client_id = auth.uid());

drop policy if exists "gym admin delete" on public.gym_checkins;
create policy "gym admin delete" on public.gym_checkins for delete
  using (public.is_admin());

-- تفعيل التحديث اللحظي (عشان الدكتور يشوف الدخول فورًا جوه التطبيق)
do $$
begin
  begin
    alter publication supabase_realtime add table public.gym_checkins;
  exception
    when duplicate_object then null;
    when undefined_table then null;
  end;
end $$;
