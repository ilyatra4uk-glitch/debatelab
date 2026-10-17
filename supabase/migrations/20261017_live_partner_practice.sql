create table public.live_debates (
  id text primary key,
  host_id text not null references public.users(id) on delete cascade,
  guest_id text not null references public.users(id) on delete cascade,
  motion text not null,
  host_side text not null check (host_side in ('for','against')),
  status text not null default 'waiting' check (status in ('waiting','active','complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (host_id <> guest_id)
);
create index live_debates_host_idx on public.live_debates(host_id, updated_at desc);
create index live_debates_guest_idx on public.live_debates(guest_id, updated_at desc);
create table public.live_turns (
  id text primary key,
  live_debate_id text not null references public.live_debates(id) on delete cascade,
  author_id text not null references public.users(id) on delete cascade,
  content text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique(live_debate_id, position)
);
create table public.live_scores (
  id text primary key,
  live_debate_id text not null references public.live_debates(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  structure integer not null, logic integer not null, evidence integer not null,
  rebuttal integer not null, speaking_style integer not null, overall integer not null,
  rank text not null, feedback text not null, created_at timestamptz not null default now(),
  unique(live_debate_id, user_id)
);
alter table public.live_debates enable row level security;
alter table public.live_turns enable row level security;
alter table public.live_scores enable row level security;
