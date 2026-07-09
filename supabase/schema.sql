-- ============================================================
-- Track Record — Supabase schema + Row Level Security
-- Paste this whole file into the Supabase SQL editor and Run.
-- Safe to re-run: it drops and recreates the app tables.
-- ============================================================

-- ---------- tables ----------

drop table if exists public.seen_marks cascade;
drop table if exists public.reactions cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.people cascade;
drop table if exists public.friend_requests cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null,
  email text not null,
  profile_picture_url text,
  spotify_connected boolean not null default false,
  created_at bigint not null
);
create unique index profiles_username_key on public.profiles (lower(username));

create table public.friend_requests (
  id text primary key,
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'rejected')),
  created_at bigint not null
);

create table public.people (
  id text primary key,
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  age int,
  city text,
  met_where text,
  nickname text,
  first_date bigint,
  color text not null,
  active boolean not null default true,
  created_at bigint not null
);

create table public.posts (
  id text primary key,
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  person_ids text[] not null default '{}',
  type text not null check (type in ('update', 'standard_event')),
  event_type text,
  title text not null,
  body text,
  mood_icon text not null,
  song jsonb not null,
  visibility text not null default 'friends',
  created_at bigint not null,
  date_override bigint
);

create table public.comments (
  id text primary key,
  post_id text not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at bigint not null
);

create table public.reactions (
  id text primary key,
  post_id text not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  created_at bigint not null,
  unique (post_id, user_id, type)
);

create table public.seen_marks (
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  last_seen bigint not null,
  primary key (viewer_id, friend_id)
);

-- ---------- helper functions ----------

-- true when a and b have an accepted friendship (runs as definer so
-- policies can use it without recursing into friend_requests RLS)
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from friend_requests
    where status = 'accepted'
      and ((from_user_id = a and to_user_id = b)
        or (from_user_id = b and to_user_id = a))
  );
$$;

-- lets the login form accept a username: resolves it to the email that
-- Supabase Auth needs. Exposed to anon on purpose (MVP trade-off).
create or replace function public.get_email_for_username(uname text)
returns text
language sql stable security definer set search_path = public
as $$
  select email from profiles where lower(username) = lower(uname) limit 1;
$$;
grant execute on function public.get_email_for_username(text) to anon, authenticated;

-- ---------- row level security ----------

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.people enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.seen_marks enable row level security;

-- profiles: any signed-in user can read (needed for friend search);
-- you can only create/update your own row
create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);
create policy "insert own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "update own profile"
  on public.profiles for update to authenticated using (id = auth.uid());

-- friend requests: visible to both parties; you send as yourself;
-- only the recipient answers; either side can delete (unfriend/cancel)
create policy "see own friend requests"
  on public.friend_requests for select to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());
create policy "send friend requests as yourself"
  on public.friend_requests for insert to authenticated
  with check (from_user_id = auth.uid());
create policy "recipient answers the request"
  on public.friend_requests for update to authenticated
  using (to_user_id = auth.uid());
create policy "either side can remove the friendship"
  on public.friend_requests for delete to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- people: owner does everything; accepted friends may read
create policy "read own or friends' people"
  on public.people for select to authenticated
  using (owner_user_id = auth.uid() or public.are_friends(owner_user_id, auth.uid()));
create policy "manage own people"
  on public.people for all to authenticated
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- posts: same shape as people
create policy "read own or friends' posts"
  on public.posts for select to authenticated
  using (owner_user_id = auth.uid() or public.are_friends(owner_user_id, auth.uid()));
create policy "manage own posts"
  on public.posts for all to authenticated
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- comments: readable wherever the post is readable; write as yourself
-- on posts you can see; delete your own
create policy "read comments on visible posts"
  on public.comments for select to authenticated
  using (exists (
    select 1 from posts p where p.id = post_id
      and (p.owner_user_id = auth.uid() or public.are_friends(p.owner_user_id, auth.uid()))
  ));
create policy "comment as yourself on visible posts"
  on public.comments for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from posts p where p.id = post_id
      and (p.owner_user_id = auth.uid() or public.are_friends(p.owner_user_id, auth.uid()))
  ));
create policy "delete own comments"
  on public.comments for delete to authenticated using (user_id = auth.uid());

-- reactions: same shape as comments
create policy "read reactions on visible posts"
  on public.reactions for select to authenticated
  using (exists (
    select 1 from posts p where p.id = post_id
      and (p.owner_user_id = auth.uid() or public.are_friends(p.owner_user_id, auth.uid()))
  ));
create policy "react as yourself on visible posts"
  on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from posts p where p.id = post_id
      and (p.owner_user_id = auth.uid() or public.are_friends(p.owner_user_id, auth.uid()))
  ));
create policy "remove own reactions"
  on public.reactions for delete to authenticated using (user_id = auth.uid());

-- seen marks: strictly your own
create policy "manage own seen marks"
  on public.seen_marks for all to authenticated
  using (viewer_id = auth.uid()) with check (viewer_id = auth.uid());
