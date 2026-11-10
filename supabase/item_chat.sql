-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (زر «استفسر» لكل تمرين / وجبة / مكمل / قياس). آمن لو اتشغل أكتر من مرة.
create table if not exists public.item_chat(
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null check (char_length(topic) between 1 and 160),
  label text check (label is null or char_length(label) <= 120),
  sender text not null check (sender in ('client','admin')),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists item_chat_idx on public.item_chat(client_id, topic, created_at);
alter table public.item_chat enable row level security;

drop policy if exists "item chat read" on public.item_chat;
create policy "item chat read" on public.item_chat for select
  using (client_id = auth.uid() or public.is_admin());

drop policy if exists "item chat insert" on public.item_chat;
create policy "item chat insert" on public.item_chat for insert
  with check ((sender = 'client' and client_id = auth.uid()) or (sender = 'admin' and public.is_admin()));

drop policy if exists "item chat admin delete" on public.item_chat;
create policy "item chat admin delete" on public.item_chat for delete
  using (public.is_admin());

-- تفعيل التحديث اللحظي
do $$
begin
  begin
    alter publication supabase_realtime add table public.item_chat;
  exception
    when duplicate_object then null;
    when undefined_table then null;
  end;
end $$;
