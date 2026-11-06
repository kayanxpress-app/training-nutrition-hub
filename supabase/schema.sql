-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'client' check (role in ('client','admin')),
  created_at timestamptz not null default now()
);
create table if not exists public.programs(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  month_start date not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists public.logs(
  client_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key(client_id, log_date)
);
create table if not exists public.notifications(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql security definer set search_path=public stable as
$$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as
$$ begin
  insert into public.profiles(id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.logs enable row level security;
alter table public.notifications enable row level security;

create policy "profiles read" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "profiles admin write" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

create policy "programs read" on public.programs for select using (client_id=auth.uid() or public.is_admin());
create policy "programs admin insert" on public.programs for insert with check (public.is_admin());
create policy "programs admin update" on public.programs for update using (public.is_admin()) with check (public.is_admin());
create policy "programs admin delete" on public.programs for delete using (public.is_admin());

create policy "logs read" on public.logs for select using (client_id=auth.uid() or public.is_admin());
create policy "logs insert" on public.logs for insert with check (client_id=auth.uid());
create policy "logs update" on public.logs for update using (client_id=auth.uid()) with check (client_id=auth.uid());

create policy "notif read" on public.notifications for select using (client_id=auth.uid() or public.is_admin());
create policy "notif admin insert" on public.notifications for insert with check (public.is_admin());
create policy "notif mark read" on public.notifications for update using (client_id=auth.uid()) with check (client_id=auth.uid());
create policy "notif admin delete" on public.notifications for delete using (public.is_admin());
-- العميل يقدر يعدّل عمود read فقط
revoke update on public.notifications from authenticated;
grant update(read) on public.notifications to authenticated;

-- ===== تخزين الصور (للأدمن فقط يرفع، والكل يشوف) =====
insert into storage.buckets(id, name, public) values ('media','media', true) on conflict (id) do nothing;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
create policy "media admin insert" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
create policy "media admin update" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy "media admin delete" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ===== ملفات PDF (خاصة: العميل يشوف ملفاته فقط، والأدمن يرفع) =====
insert into storage.buckets(id, name, public) values ('docs','docs', false) on conflict (id) do nothing;
create policy "docs read own or admin" on storage.objects for select
  using (bucket_id = 'docs' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
create policy "docs admin insert" on storage.objects for insert with check (bucket_id = 'docs' and public.is_admin());
create policy "docs admin update" on storage.objects for update using (bucket_id = 'docs' and public.is_admin());
create policy "docs admin delete" on storage.objects for delete using (bucket_id = 'docs' and public.is_admin());

-- ===== نشر البرنامج: المسودة لا يراها العميل إلا بعد ضغط «نشر» =====
alter table public.programs add column if not exists published boolean not null default true;
alter table public.programs alter column published set default false;
drop policy if exists "programs read" on public.programs;
create policy "programs read" on public.programs for select
  using ((client_id = auth.uid() and published) or public.is_admin());
