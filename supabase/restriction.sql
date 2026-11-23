-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (وضع الحساب تحت قيد المتابعة المحكمة). آمن لو اتشغل أكتر من مرة.
-- الفكرة: الأدمن يحط عميل «تحت القيد» ويحدد له تواريخ (مرتين في الشهر مثلًا). زر «استفسر» بيختفي من حسابه
-- ويظهر بس في اليوم المحدد (٢٤ ساعة بتوقيت القاهرة: من ١٢ منتصف الليل لحد ١٢ منتصف الليل اللي بعده).
-- جداول جديدة ومنفصلة: مبتلمسش أي جدول أو بيانات موجودة. العملاء اللي مش تحت القيد شغلهم زي ما هو بالظبط.

create table if not exists public.account_restrictions(
  client_id uuid primary key references public.profiles(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.inquiry_windows(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  open_on date not null,                      -- يوم ظهور أزرار «استفسر» (بتوقيت القاهرة)
  created_at timestamptz not null default now(),
  unique(client_id, open_on)
);
create index if not exists inquiry_windows_idx on public.inquiry_windows(client_id, open_on);
alter table public.account_restrictions enable row level security;
alter table public.inquiry_windows enable row level security;

-- العميل يقرا حالة قيده هو بس (محتاجها التطبيق عشان يخفي الأزرار). الأدمن يقرا ويعدّل الكل.
drop policy if exists "restr read" on public.account_restrictions;
create policy "restr read" on public.account_restrictions for select
  using (client_id = auth.uid() or public.is_admin());
drop policy if exists "restr admin insert" on public.account_restrictions;
create policy "restr admin insert" on public.account_restrictions for insert with check (public.is_admin());
drop policy if exists "restr admin update" on public.account_restrictions;
create policy "restr admin update" on public.account_restrictions for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "restr admin delete" on public.account_restrictions;
create policy "restr admin delete" on public.account_restrictions for delete using (public.is_admin());

-- العميل مبيشوفش غير يوم النهارده (بتوقيت القاهرة) لو كان مفتوح، فمفيش ميعاد جاي بيبان قبل وقته. الأدمن يشوف ويعدّل الكل.
drop policy if exists "inqw read" on public.inquiry_windows;
create policy "inqw read" on public.inquiry_windows for select
  using ((client_id = auth.uid() and open_on = (now() at time zone 'Africa/Cairo')::date) or public.is_admin());
drop policy if exists "inqw admin insert" on public.inquiry_windows;
create policy "inqw admin insert" on public.inquiry_windows for insert with check (public.is_admin());
drop policy if exists "inqw admin update" on public.inquiry_windows;
create policy "inqw admin update" on public.inquiry_windows for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "inqw admin delete" on public.inquiry_windows;
create policy "inqw admin delete" on public.inquiry_windows for delete using (public.is_admin());

-- هل العميل مسموحله يبعت استفسار دلوقتي؟ (مش تحت قيد = مسموح دايمًا، زي الأول بالظبط)
create or replace function public.inquiry_allowed(uid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select not exists(select 1 from public.account_restrictions r where r.client_id = uid and r.active)
      or exists(select 1 from public.inquiry_windows w
                where w.client_id = uid and w.open_on = (now() at time zone 'Africa/Cairo')::date)
$$;

-- حماية من السيرفر: حتى لو حد فتح التطبيق بطريقة تانية، رسالة العميل مش بتتسجل خارج اليوم المحدد.
-- رسائل الأدمن لم تتغير. العميل اللي مش تحت قيد: الشرط بيرجع true فمفيش أي فرق عنده.
drop policy if exists "item chat insert" on public.item_chat;
create policy "item chat insert" on public.item_chat for insert
  with check (
    (sender = 'client' and client_id = auth.uid() and public.inquiry_allowed(auth.uid()))
    or (sender = 'admin' and public.is_admin())
  );

-- تفعيل التحديث اللحظي
do $$
begin
  begin alter publication supabase_realtime add table public.account_restrictions;
  exception when duplicate_object then null; when undefined_table then null; end;
  begin alter publication supabase_realtime add table public.inquiry_windows;
  exception when duplicate_object then null; when undefined_table then null; end;
end $$;
