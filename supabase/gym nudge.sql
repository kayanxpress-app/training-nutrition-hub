-- شغّلي الملف ده مرة واحدة في Supabase → SQL Editor (إشعار «ابدأ جلستك» بعد ساعة من تسجيل الدخول). آمن لو اتشغل أكتر من مرة.
-- بيسجّل إن الإشعار اتبعت لنفس الدخول، عشان ميتبعتش مرتين.
alter table public.gym_checkins add column if not exists nudged_at timestamptz;
