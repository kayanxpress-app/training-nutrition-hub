-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (الأقساط المستحقة). آمن لو اتشغل أكتر من مرة.
-- الفكرة: الأدمن يحدد لكل عميل قيمة القسط وتاريخ ميعاده. يوم الميعاد يوصل العميل إشعار وبانر لحد ما يرفع إيصال السداد (من نفس صفحة سداد الرسوم).
-- جدول جديد ومنفصل: مبيلمسش الإيصالات ولا طلبات السداد الموجودة.

create table if not exists public.installments(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  amount text not null check (char_length(amount) between 1 and 60),   -- نص حر: «٢٠٠٠ جنيه» أو «150 USD»
  due_on date not null,                                                 -- ميعاد القسط
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  notified_at timestamptz,        -- وقت إرسال إشعار الميعاد للعميل (بيمنع التكرار)
  paid_at timestamptz,
  receipt_id uuid,                -- الإيصال اللي قفل القسط
  created_at timestamptz not null default now()
);
create index if not exists installments_client_idx on public.installments(client_id, status, due_on);
create index if not exists installments_due_idx on public.installments(status, due_on);
alter table public.installments enable row level security;

-- العميل يشوف بس القسط المنتظر اللي ميعاده جه (بتوقيت القاهرة). الأدمن يشوف ويعدّل الكل.
drop policy if exists "inst read" on public.installments;
create policy "inst read" on public.installments for select
  using ((client_id = auth.uid() and status = 'pending' and due_on <= (now() at time zone 'Africa/Cairo')::date) or public.is_admin());
drop policy if exists "inst admin insert" on public.installments;
create policy "inst admin insert" on public.installments for insert with check (public.is_admin());
drop policy if exists "inst admin update" on public.installments;
create policy "inst admin update" on public.installments for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "inst admin delete" on public.installments;
create policy "inst admin delete" on public.installments for delete using (public.is_admin());

-- لما يتضاف إيصال سداد (من العميل أو الأدمن): أقدم قسط مستحق منتظر للعميل يتقفل (paid) والبانر يختفي من عنده.
-- ولو الأدمن حذف الإيصال ده: القسط يرجع منتظر. (تريجر منفصل، وأي خطأ فيه مبيعطّلش رفع الإيصال أبدًا.)
create or replace function public.inst_after_receipt()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if tg_op = 'INSERT' then
      update public.installments set status = 'paid', paid_at = now(), receipt_id = new.id
        where id = (select i.id from public.installments i
                    where i.client_id = new.client_id and i.status = 'pending'
                      and i.due_on <= (now() at time zone 'Africa/Cairo')::date
                    order by i.due_on, i.created_at limit 1);
      return new;
    else
      update public.installments set status = 'pending', paid_at = null, receipt_id = null
        where receipt_id = old.id and status = 'paid';
      return old;
    end if;
  exception when others then
    if tg_op = 'INSERT' then return new; else return old; end if;
  end;
end $$;
drop trigger if exists inst_after_receipt_ins on public.payment_receipts;
create trigger inst_after_receipt_ins after insert on public.payment_receipts for each row execute function public.inst_after_receipt();
drop trigger if exists inst_after_receipt_del on public.payment_receipts;
create trigger inst_after_receipt_del after delete on public.payment_receipts for each row execute function public.inst_after_receipt();

-- تفعيل التحديث اللحظي
do $$
begin
  begin
    alter publication supabase_realtime add table public.installments;
  exception
    when duplicate_object then null;
    when undefined_table then null;
  end;
end $$;
