create table if not exists public.friendships (
  id text primary key,
  requester_id text not null references public.users(id) on delete cascade,
  recipient_id text not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> recipient_id)
);

create index if not exists friendships_recipient_status_idx on public.friendships(recipient_id, status, created_at desc);
create index if not exists friendships_requester_status_idx on public.friendships(requester_id, status, created_at desc);
alter table public.friendships enable row level security;
