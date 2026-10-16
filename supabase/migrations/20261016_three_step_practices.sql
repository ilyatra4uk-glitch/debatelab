alter table public.debate_turns add column if not exists position integer;
with ordered as (
 select id, row_number() over (partition by debate_id order by created_at, id)::integer as n
 from public.debate_turns
) update public.debate_turns t set position = ordered.n from ordered where t.id = ordered.id and t.position is null;
create unique index if not exists debate_turns_position_unique on public.debate_turns(debate_id, position);

create table if not exists public.practice_revisions (
 id text primary key,
 debate_id text not null references public.debates(id) on delete cascade,
 turn_id text not null references public.debate_turns(id) on delete cascade,
 content text not null,
 feedback text not null,
 created_at timestamptz not null default now()
);
alter table public.practice_revisions enable row level security;
create index if not exists practice_revisions_debate_idx on public.practice_revisions(debate_id, created_at);

create or replace function public.save_practice_exchange(
 p_user_id text, p_debate_id text, p_motion text, p_side text,
 p_expected_turns integer, p_argument text, p_reply text
) returns text language plpgsql set search_path = public as $$
declare v_id text; v_status text; v_count integer;
begin
 if p_debate_id is null then
  if p_expected_turns <> 0 then raise exception 'Practice changed. Reload and try again.'; end if;
  v_id := gen_random_uuid()::text;
  insert into public.debates(id, user_id, mode, motion, side) values(v_id, p_user_id, 'bot', p_motion, p_side);
 else
  select id, status into v_id, v_status from public.debates where id=p_debate_id and user_id=p_user_id for update;
  if v_id is null then raise exception 'Practice not found.'; end if;
  if v_status='judged' then raise exception 'This practice is already complete.'; end if;
 end if;
 select count(*) into v_count from public.debate_turns where debate_id=v_id;
 if v_count <> p_expected_turns or v_count >= 6 or v_count % 2 <> 0 then
  raise exception 'Practice changed. Reload and try again.';
 end if;
 insert into public.debate_turns(id,debate_id,speaker,content,position,created_at) values
  (gen_random_uuid()::text,v_id,'user',p_argument,v_count+1,clock_timestamp()),
  (gen_random_uuid()::text,v_id,'bot',p_reply,v_count+2,clock_timestamp());
 update public.debates set updated_at=clock_timestamp() where id=v_id;
 return v_id;
end;
$$;
revoke all on function public.save_practice_exchange(text,text,text,text,integer,text,text) from public, anon, authenticated;
grant execute on function public.save_practice_exchange(text,text,text,text,integer,text,text) to service_role;
