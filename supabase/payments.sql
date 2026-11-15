-- شغّلي الملف ده في Supabase → SQL Editor (سداد رسوم البرنامج). آمن لو اتشغل أكتر من مرة، وشغّله تاني بعد التحديث ده.
-- الفكرة: العميل بيرفع الإيصال وبيشوف بس «تم السداد». الإيصالات وتواريخها وعددها ظاهرة للأدمن فقط (ومفيش أي طريق للعميل يشوفها).

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

-- ===== ٢) إيصالات السداد: مربوطة ببرنامج (شهر) العميل. العميل يرفع بس (INSERT)، والأدمن بس يقرأ ويحذف =====
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
create policy "prc read" on public.payment_receipts for select using (public.is_admin());
drop policy if exists "prc insert" on public.payment_receipts;
create policy "prc insert" on public.payment_receipts for insert
  with check (public.is_admin() or (client_id = auth.uid() and exists(select 1 from public.programs p where p.id = program_id and p.client_id = auth.uid())));
drop policy if exists "prc delete" on public.payment_receipts;
create policy "prc delete" on public.payment_receipts for delete using (public.is_admin());

-- العميل ميقدرش يقرا الإيصالات نفسها. بس يسأل «هل البرنامج ده اتدفع؟» (قائمة أرقام برامج من غير تواريخ ولا ملفات ولا عدد)
create or replace function public.my_paid_programs()
returns table(program_id uuid)
language sql stable security definer set search_path = public as $$
  select distinct r.program_id from public.payment_receipts r where r.client_id = auth.uid();
$$;
revoke all on function public.my_paid_programs() from public;
grant execute on function public.my_paid_programs() to authenticated;

-- ===== ٣) طلبات السداد (إشعار الدفع اللي المدرب بيبعته يدويًا) =====
create table if not exists public.payment_requests(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  amount text not null,             -- نص حر: «٢٠٠٠ جنيه» أو «150 USD» (الأسعار بتختلف حسب العميل)
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  last_reminded_at timestamptz,
  remind_count int not null default 0
);
-- الحالات: pending (منتظر) · paid (اتسدد وقفل تلقائيًا) · cancelled (ألغيته)
do $$
declare c text;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.payment_requests'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%status%'
  loop
    execute format('alter table public.payment_requests drop constraint %I', c);
  end loop;
end $$;
alter table public.payment_requests add constraint payment_requests_status_check check (status in ('pending','paid','cancelled'));
create index if not exists payment_requests_client_idx on public.payment_requests(client_id, status);
create unique index if not exists payment_requests_one_pending on public.payment_requests(client_id, program_id) where status = 'pending';
alter table public.payment_requests enable row level security;
-- العميل يشوف بس الطلب المنتظر (مبالغ الشهور اللي فاتت ما بتبانش له)
drop policy if exists "preq read" on public.payment_requests;
create policy "preq read" on public.payment_requests for select using ((client_id = auth.uid() and status = 'pending') or public.is_admin());
drop policy if exists "preq admin insert" on public.payment_requests;
create policy "preq admin insert" on public.payment_requests for insert with check (public.is_admin());
drop policy if exists "preq admin update" on public.payment_requests;
create policy "preq admin update" on public.payment_requests for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "preq admin delete" on public.payment_requests;
create policy "preq admin delete" on public.payment_requests for delete using (public.is_admin());

-- لما العميل يرفع إيصال: الطلب المنتظر لنفس البرنامج يتقفل (paid). ولو الأدمن حذف آخر إيصال: الطلب يرجع منتظر (والبانر يرجع للعميل).
create or replace function public.pay_after_receipt()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.payment_requests set status = 'paid'
      where client_id = new.client_id and program_id = new.program_id and status = 'pending';
    return new;
  else
    if not exists (select 1 from public.payment_receipts r where r.program_id = old.program_id and r.id <> old.id) then
      update public.payment_requests set status = 'pending'
        where id = (select q.id from public.payment_requests q
                    where q.client_id = old.client_id and q.program_id = old.program_id and q.status = 'paid'
                    order by q.created_at desc limit 1);
    end if;
    return old;
  end if;
end $$;
drop trigger if exists pay_after_receipt_ins on public.payment_receipts;
create trigger pay_after_receipt_ins after insert on public.payment_receipts for each row execute function public.pay_after_receipt();
drop trigger if exists pay_after_receipt_del on public.payment_receipts;
create trigger pay_after_receipt_del after delete on public.payment_receipts for each row execute function public.pay_after_receipt();
-- تنضيف الموجود: أي طلب منتظر لبرنامج اتدفع فعلًا يتقفل
update public.payment_requests q set status = 'paid'
  where q.status = 'pending' and exists (select 1 from public.payment_receipts r where r.program_id = q.program_id and r.client_id = q.client_id);

-- ===== ٤) تخزين الإيصالات (خاص): العميل يرفع بس، والأدمن بس يشوف ويحذف =====
insert into storage.buckets(id, name, public) values ('receipts','receipts', false) on conflict (id) do nothing;
drop policy if exists "receipts read own or admin" on storage.objects;
drop policy if exists "receipts read admin" on storage.objects;
create policy "receipts read admin" on storage.objects for select
  using (bucket_id = 'receipts' and public.is_admin());
drop policy if exists "receipts insert own or admin" on storage.objects;
create policy "receipts insert own or admin" on storage.objects for insert
  with check (bucket_id = 'receipts' and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text));
drop policy if exists "receipts delete own or admin" on storage.objects;
drop policy if exists "receipts delete admin" on storage.objects;
create policy "receipts delete admin" on storage.objects for delete
  using (bucket_id = 'receipts' and public.is_admin());
