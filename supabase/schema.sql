create table if not exists public.users (
  id text primary key,
  email text not null unique,
  display_name text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- DebateLab writes through the server using SUPABASE_SERVICE_ROLE_KEY.
-- The service role bypasses RLS. Keeping user-facing tables locked by default
-- prevents direct anonymous browser access to private debate records.
