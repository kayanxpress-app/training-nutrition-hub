-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor
-- (قياسات الوزن + نتائج InBody + طلبات القياس من المدرب). آمن لو اتشغل أكتر من مرة.

create table if not exists public.measurements(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'inbody' check (kind in ('inbody','weight')),
  taken_on date not null default current_date,
  weight numeric,
  fat numeric,       -- نسبة الدهون ٪
  muscle numeric,    -- الكتلة العضلية كجم
  note text,
  file_path text,    -- مسار الصورة/PDF داخل bucket اسمه inbody
  created_at timestamptz not null default now()
);
create index if not exists measurements_client_idx on public.measurements(client_id, taken_on desc);

create table if not exists public.measure_requests(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('inbody','weight')),
  note text,
  status text not null default 'pending' check (status in ('pending','done','cancelled')),
  created_at timestamptz not null default now(),
  done_at timestamptz,
  measurement_id uuid references public.measurements(id) on delete set null
);
create index if not exists measure_requests_client_idx on public.measure_requests(client_id, status);

alter table public.measurements enable row level security;
alter table public.measure_requests enable row level security;

-- القياسات: العميل يشوف ويضيف ويعدّل ويحذف قياساته فقط، والأدمن على الكل
drop policy if exists "meas read" on public.measurements;
create policy "meas read" on public.measurements for select using (client_id=auth.uid() or public.is_admin());
drop policy if exists "meas insert" on public.measurements;
create policy "meas insert" on public.measurements for insert with check (client_id=auth.uid() or public.is_admin());
drop policy if exists "meas update" on public.measurements;
create policy "meas update" on public.measurements for update using (client_id=auth.uid() or public.is_admin()) with check (client_id=auth.uid() or public.is_admin());
drop policy if exists "meas delete" on public.measurements;
create policy "meas delete" on public.measurements for delete using (client_id=auth.uid() or public.is_admin());

-- الطلبات: الأدمن فقط ينشئ ويحذف، والعميل يقدر يقفل طلبه (done) فقط
drop policy if exists "req read" on public.measure_requests;
create policy "req read" on public.measure_requests for select using (client_id=auth.uid() or public.is_admin());
drop policy if exists "req admin insert" on public.measure_requests;
create policy "req admin insert" on public.measure_requests for insert with check (public.is_admin());
drop policy if exists "req update" on public.measure_requests;
create policy "req update" on public.measure_requests for update using (client_id=auth.uid() or public.is_admin())
  with check ((client_id=auth.uid() and status='done') or public.is_admin());
drop policy if exists "req admin delete" on public.measure_requests;
create policy "req admin delete" on public.measure_requests for delete using (public.is_admin());
revoke update on public.measure_requests from authenticated;
grant update(status, done_at, measurement_id) on public.measure_requests to authenticated;

-- ===== ملفات InBody (خاصة: العميل يرفع ويشوف ملفاته فقط، والأدمن على الكل) =====
insert into storage.buckets(id, name, public) values ('inbody','inbody', false) on conflict (id) do nothing;
drop policy if exists "inbody read own or admin" on storage.objects;
create policy "inbody read own or admin" on storage.objects for select
  using (bucket_id = 'inbody' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
drop policy if exists "inbody insert own or admin" on storage.objects;
create policy "inbody insert own or admin" on storage.objects for insert
  with check (bucket_id = 'inbody' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
drop policy if exists "inbody delete own or admin" on storage.objects;
create policy "inbody delete own or admin" on storage.objects for delete
  using (bucket_id = 'inbody' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
