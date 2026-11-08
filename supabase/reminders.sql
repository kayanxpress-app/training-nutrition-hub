-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (سجل التذكيرات التلقائية). آمن لو اتشغل أكتر من مرة.
-- بيمنع إرسال أكتر من تذكير واحد لنفس العميل في اليوم.
create table if not exists public.reminder_log(
  client_id uuid not null references public.profiles(id) on delete cascade,
  sent_on date not null,
  kind text,
  created_at timestamptz not null default now(),
  primary key(client_id, sent_on)
);
-- مفيش policies عمدًا: الجدول مقفول على التطبيق، والسيرفر فقط (api/reminders.js) هو اللي بيكتب فيه.
alter table public.reminder_log enable row level security;
