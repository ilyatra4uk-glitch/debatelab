create table if not exists public.users (
  id text primary key,
  email text not null unique,
  display_name text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users add column if not exists login text;
alter table public.users add column if not exists password_hash text;
create unique index if not exists users_login_unique_idx
  on public.users (login) where login is not null;

create table if not exists public.user_sessions (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists user_sessions_user_id_idx on public.user_sessions (user_id);
create index if not exists user_sessions_expires_at_idx on public.user_sessions (expires_at);

create table if not exists public.debates (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  mode text not null default 'bot' check (mode in ('bot', 'friend')),
  motion text not null,
  side text not null check (side in ('for', 'against')),
  status text not null default 'active' check (status in ('draft', 'active', 'judged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.debate_turns (
  id text primary key,
  debate_id text not null references public.debates(id) on delete cascade,
  speaker text not null check (speaker in ('user', 'bot')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id text primary key,
  debate_id text not null references public.debates(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  structure integer not null,
  logic integer not null,
  evidence integer not null,
  rebuttal integer not null,
  speaking_style integer not null,
  overall integer not null,
  rank text not null,
  feedback text not null,
  created_at timestamptz not null default now()
);

create index if not exists debates_user_id_created_at_idx
  on public.debates(user_id, created_at desc);

create index if not exists debate_turns_debate_id_created_at_idx
  on public.debate_turns(debate_id, created_at);

create index if not exists scores_user_id_created_at_idx
  on public.scores(user_id, created_at desc);

create unique index if not exists scores_debate_id_unique
  on public.scores(debate_id);

alter table public.users enable row level security;
alter table public.debates enable row level security;
alter table public.debate_turns enable row level security;
alter table public.scores enable row level security;
alter table public.user_sessions enable row level security;

-- DebateLab writes through the server using SUPABASE_SERVICE_ROLE_KEY.
-- The service role bypasses RLS. Keeping user-facing tables locked by default
-- prevents direct anonymous browser access to private debate records.

-- Three-step practice and rewrite support.
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
