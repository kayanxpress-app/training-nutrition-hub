-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (إشعار وبانر «غدًا ميعاد متابعتك»). آمن لو اتشغل أكتر من مرة.
-- لازم يكون restriction.sql اتشغّل قبله.

-- 1) عمود يمنع تكرار الإشعار لنفس الميعاد (السيرفر والتطبيق بيحجزوه قبل الإرسال)
alter table public.inquiry_windows add column if not exists notified_at timestamptz;

-- 2) العميل يشوف ميعاد النهارده وميعاد بكره بس (عشان البانر «غدًا ميعاد متابعتك»). باقي المواعيد مخفية عنه.
--    إخفاء/إظهار أزرار «استفسر» لسه بيعتمد على ميعاد النهارده فقط، فمفيش أي تغيير في القيد نفسه.
drop policy if exists "inqw read" on public.inquiry_windows;
create policy "inqw read" on public.inquiry_windows for select
  using (
    (client_id = auth.uid()
      and open_on >= (now() at time zone 'Africa/Cairo')::date
      and open_on <= (now() at time zone 'Africa/Cairo')::date + 1)
    or public.is_admin()
  );
