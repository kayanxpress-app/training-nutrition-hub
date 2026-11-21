-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor
-- (الفحوصات الصحية والمختبر: نتائج التحاليل + طلبات الفحص من المدرب + تخزين الملفات). آمن لو اتشغل أكتر من مرة.
-- نفس منطق inbody.sql بالظبط، بجداول وتخزين منفصلين فمبيلمسش القياسات ولا أي حاجة موجودة.
-- المحادثة/الملاحظات على كل نتيجة بتستخدم جدول item_chat الموجود (شغّل item_chat.sql لو لسه ما اتشغلش).

create table if not exists public.lab_results(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),   -- اسم الفحص / التحليل
  taken_on date not null default current_date,
  note text,
  file_path text,    -- مسار الصورة/PDF داخل bucket اسمه labs
  created_at timestamptz not null default now()
);
create index if not exists lab_results_client_idx on public.lab_results(client_id, taken_on desc);

create table if not exists public.lab_requests(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  note text,
  status text not null default 'pending' check (status in ('pending','done','cancelled')),
  created_at timestamptz not null default now(),
  done_at timestamptz,
  result_id uuid references public.lab_results(id) on delete set null
);
create index if not exists lab_requests_client_idx on public.lab_requests(client_id, status);

alter table public.lab_results enable row level security;
alter table public.lab_requests enable row level security;

-- النتائج: العميل يشوف ويضيف ويعدّل ويحذف نتائجه فقط، والأدمن على الكل
drop policy if exists "lab read" on public.lab_results;
create policy "lab read" on public.lab_results for select using (client_id=auth.uid() or public.is_admin());
drop policy if exists "lab insert" on public.lab_results;
create policy "lab insert" on public.lab_results for insert with check (client_id=auth.uid() or public.is_admin());
drop policy if exists "lab update" on public.lab_results;
create policy "lab update" on public.lab_results for update using (client_id=auth.uid() or public.is_admin()) with check (client_id=auth.uid() or public.is_admin());
drop policy if exists "lab delete" on public.lab_results;
create policy "lab delete" on public.lab_results for delete using (client_id=auth.uid() or public.is_admin());

-- الطلبات: الأدمن فقط ينشئ ويحذف، والعميل يقدر يقفل طلبه (done) فقط
drop policy if exists "labreq read" on public.lab_requests;
create policy "labreq read" on public.lab_requests for select using (client_id=auth.uid() or public.is_admin());
drop policy if exists "labreq admin insert" on public.lab_requests;
create policy "labreq admin insert" on public.lab_requests for insert with check (public.is_admin());
drop policy if exists "labreq update" on public.lab_requests;
create policy "labreq update" on public.lab_requests for update using (client_id=auth.uid() or public.is_admin())
  with check ((client_id=auth.uid() and status='done') or public.is_admin());
drop policy if exists "labreq admin delete" on public.lab_requests;
create policy "labreq admin delete" on public.lab_requests for delete using (public.is_admin());
revoke update on public.lab_requests from authenticated;
grant update(status, done_at, result_id) on public.lab_requests to authenticated;

-- ===== ملفات الفحوصات (خاصة: العميل يرفع ويشوف ملفاته فقط، والأدمن على الكل) =====
insert into storage.buckets(id, name, public) values ('labs','labs', false) on conflict (id) do nothing;
drop policy if exists "labs read own or admin" on storage.objects;
create policy "labs read own or admin" on storage.objects for select
  using (bucket_id = 'labs' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
drop policy if exists "labs insert own or admin" on storage.objects;
create policy "labs insert own or admin" on storage.objects for insert
  with check (bucket_id = 'labs' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
drop policy if exists "labs delete own or admin" on storage.objects;
create policy "labs delete own or admin" on storage.objects for delete
  using (bucket_id = 'labs' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));

-- ===== تفعيل التحديث اللحظي =====
do $$
declare t text;
begin
  foreach t in array array['lab_results','lab_requests'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_table then null;
    end;
  end loop;
end $$;
