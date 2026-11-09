-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (تفعيل التحديث اللحظي). آمن لو اتشغل أكتر من مرة.
-- بيخلي السيرفر يبعت أي تغيير في الجداول دي فورًا للتطبيق المفتوح (والصلاحيات RLS بتفضل شغالة زي ما هي).
do $$
declare t text;
begin
  foreach t in array array['notifications','logs','programs','measurements','measure_requests'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_table then null;
    end;
  end loop;
end $$;
