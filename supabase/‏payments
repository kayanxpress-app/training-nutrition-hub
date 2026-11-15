-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (سداد رسوم البرنامج). آمن لو اتشغل أكتر من مرة.
-- بيعمل: بيانات التحويل (حساب واحد بيشوفه كل العملاء) + إيصالات السداد (لكل برنامج/شهر) + طلبات السداد اللي المدرب بيبعتها.

-- ===== ١) بيانات التحويل البنكي والمحافظ (صف واحد، الأدمن بس يعدّل) =====
create table if not exists public.payment_settings(
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.payment_settings(id, data) values (1, '{}') on conflict (id) do nothing;
alter table public.payment_settings enable row level security;
drop policy if exists "paysett read" on public.payment_settings;
create policy "paysett read" on public.payment_settings for select using (auth.uid() is not null);
drop policy if exists "paysett admin insert" on public.payment_settings;
create policy "paysett admin insert" on public.payment_settings for insert with check (public.is_admin());
drop policy if exists "paysett admin update" on public.payment_settings;
create policy "paysett admin update" on public.payment_settings for update using (public.is_admin()) with check (public.is_admin());

-- ===== ٢) إيصالات السداد: مربوطة ببرنامج (شهر) العميل. أول ما يبدأ برنامج جديد يرجع «لم يسدد» تلقائيًا =====
create table if not exists public.payment_receipts(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  file_path text not null,          -- مسار الصورة/PDF داخل bucket اسمه receipts
  file_name text,
  created_at timestamptz not null default now()
);
create index if not exists payment_receipts_client_idx on public.payment_receipts(client_id, created_at desc);
create index if not exists payment_receipts_prog_idx on public.payment_receipts(program_id);
alter table public.payment_receipts enable row level security;
drop policy if exists "prc read" on public.payment_receipts;
create policy "prc read" on public.payment_receipts for select using (client_id = auth.uid() or public.is_admin());
drop policy if exists "prc insert" on public.payment_receipts;
create policy "prc insert" on public.payment_receipts for insert
  with check (public.is_admin() or (client_id = auth.uid() and exists(select 1 from public.programs p where p.id = program_id and p.client_id = auth.uid())));
drop policy if exists "prc delete" on public.payment_receipts;
create policy "prc delete" on public.payment_receipts for delete using (client_id = auth.uid() or public.is_admin());

-- ===== ٣) طلبات السداد (إشعار الدفع اللي المدرب بيبعته يدويًا) =====
create table if not exists public.payment_requests(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  amount text not null,             -- نص حر: «٢٠٠٠ جنيه» أو «150 USD» (الأسعار بتختلف حسب العميل)
  message text,
  status text not null default 'pending' check (status in ('pending','cancelled')),
  created_at timestamptz not null default now(),
  last_reminded_at timestamptz,
  remind_count int not null default 0
);
create index if not exists payment_requests_client_idx on public.payment_requests(client_id, status);
create unique index if not exists payment_requests_one_pending on public.payment_requests(client_id, program_id) where status = 'pending';
alter table public.payment_requests enable row level security;
drop policy if exists "preq read" on public.payment_requests;
create policy "preq read" on public.payment_requests for select using (client_id = auth.uid() or public.is_admin());
drop policy if exists "preq admin insert" on public.payment_requests;
create policy "preq admin insert" on public.payment_requests for insert with check (public.is_admin());
drop policy if exists "preq admin update" on public.payment_requests;
create policy "preq admin update" on public.payment_requests for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "preq admin delete" on public.payment_requests;
create policy "preq admin delete" on public.payment_requests for delete using (public.is_admin());

-- ===== ٤) تخزين الإيصالات (خاص: العميل يرفع ويشوف إيصالاته فقط، والأدمن على الكل) =====
insert into storage.buckets(id, name, public) values ('receipts','receipts', false) on conflict (id) do nothing;
drop policy if exists "receipts read own or admin" on storage.objects;
create policy "receipts read own or admin" on storage.objects for select
  using (bucket_id = 'receipts' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
drop policy if exists "receipts insert own or admin" on storage.objects;
create policy "receipts insert own or admin" on storage.objects for insert
  with check (bucket_id = 'receipts' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
drop policy if exists "receipts delete own or admin" on storage.objects;
create policy "receipts delete own or admin" on storage.objects for delete
  using (bucket_id = 'receipts' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
