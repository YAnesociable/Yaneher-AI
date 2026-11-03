begin;
alter table public.site_settings add column if not exists chat_rules text;
alter table public.site_settings add column if not exists video_rules text;
create or replace function public.v12_admin_save_rules(rules jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare k text; saved jsonb;
begin
 if not public.is_admin() then raise exception 'Доступ запрещён: только администрация' using errcode='42501'; end if;
 if rules is null or jsonb_typeof(rules) <> 'object' then raise exception 'Некорректные правила'; end if;
 foreach k in array array['official_rules','extra_rules','chat_rules','video_rules'] loop
  if not (rules ? k) or jsonb_typeof(rules->k) <> 'string' or length(rules->>k)>25000 then raise exception 'Некорректный текст темы: %',k; end if;
 end loop;
 update public.site_settings set official_rules=rules->>'official_rules',extra_rules=rules->>'extra_rules',chat_rules=rules->>'chat_rules',video_rules=rules->>'video_rules' where id='main' returning to_jsonb(site_settings.*) into saved;
 if saved is null then raise exception 'Настройки сайта не найдены'; end if;
 return saved;
end $$;
revoke all on function public.v12_admin_save_rules(jsonb) from public, anon;
grant execute on function public.v12_admin_save_rules(jsonb) to authenticated;
commit;
