-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (أجهزة إشعارات الموبايل). آمن لو اتشغل أكتر من مرة.
create table if not exists public.push_subscriptions(
  endpoint text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  ua text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
-- مفيش policies عمدًا: الجدول مقفول على التطبيق، والسيرفر فقط (api/push.js) هو اللي بيقرأ ويكتب فيه.
alter table public.push_subscriptions enable row level security;
