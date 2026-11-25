-- شغّل الملف ده مرة واحدة في Supabase → SQL Editor (اختياري).
-- بيضيف جدول «أصناف مخصصة» لحاسبة التغذية: أي صنف مش موجود في القاعدة المدمجة، أو تصحيح لقيم صنف موجود.
-- الأدمن فقط يقرأ ويكتب. آمن لو اتشغل أكتر من مرة، ومبيلمسش أي جدول موجود.
create table if not exists public.custom_foods(
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.custom_foods enable row level security;
drop policy if exists "custom_foods admin all" on public.custom_foods;
create policy "custom_foods admin all" on public.custom_foods for all using (public.is_admin()) with check (public.is_admin());
