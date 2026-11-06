-- بدّلي الإيميل بإيميلك (بعد ما تعمل لنفسك حساب في Authentication → Users)
update public.profiles set role='admin', full_name='د. محمود جمال'
where id = (select id from auth.users where email = 'YOUR_EMAIL_HERE');
