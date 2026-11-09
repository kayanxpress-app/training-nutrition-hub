-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (محادثة الجلسة بين العميل والدكتور). آمن لو اتشغل أكتر من مرة.
create table if not exists public.session_chat(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  session_idx int not null check (session_idx >= 0),
  sender text not null check (sender in ('client','admin')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists session_chat_idx on public.session_chat(client_id, program_id, session_idx, created_at);
alter table public.session_chat enable row level security;

drop policy if exists "chat read" on public.session_chat;
create policy "chat read" on public.session_chat for select
  using (client_id = auth.uid() or public.is_admin());

drop policy if exists "chat insert" on public.session_chat;
create policy "chat insert" on public.session_chat for insert
  with check ((sender = 'client' and client_id = auth.uid()) or (sender = 'admin' and public.is_admin()));

drop policy if exists "chat admin delete" on public.session_chat;
create policy "chat admin delete" on public.session_chat for delete
  using (public.is_admin());

-- تفعيل التحديث اللحظي للمحادثة
do $$
begin
  begin
    alter publication supabase_realtime add table public.session_chat;
  exception
    when duplicate_object then null;
    when undefined_table then null;
  end;
end $$;
