-- ============================================
-- HUMANSONLY - COMPLETE DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  is_verified_human boolean default false,
  karma integer default 0,
  post_karma integer default 0,
  comment_karma integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- COMMUNITIES
-- ============================================
create table if not exists public.communities (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  name text not null,
  description text,
  icon_url text,
  banner_url text,
  created_by uuid references public.profiles(id),
  member_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.communities enable row level security;

drop policy if exists "Communities are viewable by everyone" on public.communities;
create policy "Communities are viewable by everyone" on public.communities
  for select using (true);

drop policy if exists "Authenticated users can create communities" on public.communities;
create policy "Authenticated users can create communities" on public.communities
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "Admins can update community" on public.communities;
create policy "Admins can update community" on public.communities
  for update using (
    exists (
      select 1 from public.community_members 
      where community_id = id 
      and user_id = auth.uid() 
      and role in ('admin', 'moderator')
    )
  );

-- ============================================
-- COMMUNITY MEMBERS (with roles)
-- ============================================
create table if not exists public.community_members (
  user_id uuid references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete cascade,
  role text default 'member' check (role in ('member', 'moderator', 'admin')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, community_id)
);

alter table public.community_members enable row level security;

drop policy if exists "Memberships are viewable by everyone" on public.community_members;
create policy "Memberships are viewable by everyone" on public.community_members
  for select using (true);

drop policy if exists "Users can join communities" on public.community_members;
create policy "Users can join communities" on public.community_members
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can leave or be removed" on public.community_members;
create policy "Users can leave or be removed" on public.community_members
  for delete using (
    auth.uid() = user_id 
    or exists (
      select 1 from public.community_members cm
      where cm.community_id = community_id 
      and cm.user_id = auth.uid() 
      and cm.role in ('admin', 'moderator')
    )
  );

drop policy if exists "Admins can update member roles" on public.community_members;
create policy "Admins can update member roles" on public.community_members
  for update using (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = community_id 
      and cm.user_id = auth.uid() 
      and cm.role = 'admin'
    )
  );

-- Function to update member count
create or replace function update_community_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.communities set member_count = member_count + 1 where id = NEW.community_id;
  elsif TG_OP = 'DELETE' then
    update public.communities set member_count = member_count - 1 where id = OLD.community_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_member_change on public.community_members;
create trigger on_member_change
  after insert or delete on public.community_members
  for each row execute procedure update_community_member_count();

-- ============================================
-- COMMUNITY BANS
-- ============================================
create table if not exists public.community_bans (
  community_id uuid references public.communities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  banned_by uuid references public.profiles(id),
  reason text,
  banned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (community_id, user_id)
);

alter table public.community_bans enable row level security;

drop policy if exists "Bans viewable by mods" on public.community_bans;
create policy "Bans viewable by mods" on public.community_bans
  for select using (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = community_id 
      and cm.user_id = auth.uid() 
      and cm.role in ('admin', 'moderator')
    )
  );

drop policy if exists "Mods can ban" on public.community_bans;
create policy "Mods can ban" on public.community_bans
  for insert with check (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = community_id 
      and cm.user_id = auth.uid() 
      and cm.role in ('admin', 'moderator')
    )
  );

drop policy if exists "Mods can unban" on public.community_bans;
create policy "Mods can unban" on public.community_bans
  for delete using (
    exists (
      select 1 from public.community_members cm
      where cm.community_id = community_id 
      and cm.user_id = auth.uid() 
      and cm.role in ('admin', 'moderator')
    )
  );

-- ============================================
-- POSTS
-- ============================================
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  author_id uuid references public.profiles(id) on delete cascade not null,
  community_id uuid references public.communities(id) on delete cascade not null,
  upvotes integer default 0,
  downvotes integer default 0,
  comment_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;

drop policy if exists "Posts are viewable by everyone" on public.posts;
create policy "Posts are viewable by everyone" on public.posts
  for select using (true);

drop policy if exists "Authenticated users can create posts" on public.posts;
create policy "Authenticated users can create posts" on public.posts
  for insert with check (auth.uid() = author_id);

drop policy if exists "Users can update their own posts" on public.posts;
create policy "Users can update their own posts" on public.posts
  for update using (auth.uid() = author_id);

drop policy if exists "Users or mods can delete posts" on public.posts;
create policy "Users or mods can delete posts" on public.posts
  for delete using (
    auth.uid() = author_id
    or exists (
      select 1 from public.community_members cm
      where cm.community_id = community_id 
      and cm.user_id = auth.uid() 
      and cm.role in ('admin', 'moderator')
    )
  );

-- ============================================
-- POST VOTES
-- ============================================
create table if not exists public.post_votes (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  vote_type smallint not null check (vote_type in (-1, 1)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, post_id)
);

alter table public.post_votes enable row level security;

drop policy if exists "Votes are viewable by everyone" on public.post_votes;
create policy "Votes are viewable by everyone" on public.post_votes
  for select using (true);

drop policy if exists "Users can vote" on public.post_votes;
create policy "Users can vote" on public.post_votes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can change vote" on public.post_votes;
create policy "Users can change vote" on public.post_votes
  for update using (auth.uid() = user_id);

drop policy if exists "Users can remove vote" on public.post_votes;
create policy "Users can remove vote" on public.post_votes
  for delete using (auth.uid() = user_id);

-- Function to update post votes AND author karma
create or replace function update_post_votes()
returns trigger as $$
declare
  post_author_id uuid;
begin
  -- Get the post author
  select author_id into post_author_id from public.posts where id = coalesce(NEW.post_id, OLD.post_id);
  
  if TG_OP = 'INSERT' then
    if NEW.vote_type = 1 then
      update public.posts set upvotes = upvotes + 1 where id = NEW.post_id;
      update public.profiles set post_karma = post_karma + 1, karma = karma + 1 where id = post_author_id;
    else
      update public.posts set downvotes = downvotes + 1 where id = NEW.post_id;
      update public.profiles set post_karma = post_karma - 1, karma = karma - 1 where id = post_author_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.vote_type = 1 then
      update public.posts set upvotes = upvotes - 1 where id = OLD.post_id;
      update public.profiles set post_karma = post_karma - 1, karma = karma - 1 where id = post_author_id;
    else
      update public.posts set downvotes = downvotes - 1 where id = OLD.post_id;
      update public.profiles set post_karma = post_karma + 1, karma = karma + 1 where id = post_author_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    -- Remove old vote effect
    if OLD.vote_type = 1 then
      update public.posts set upvotes = upvotes - 1 where id = OLD.post_id;
      update public.profiles set post_karma = post_karma - 1, karma = karma - 1 where id = post_author_id;
    else
      update public.posts set downvotes = downvotes - 1 where id = OLD.post_id;
      update public.profiles set post_karma = post_karma + 1, karma = karma + 1 where id = post_author_id;
    end if;
    -- Add new vote effect
    if NEW.vote_type = 1 then
      update public.posts set upvotes = upvotes + 1 where id = NEW.post_id;
      update public.profiles set post_karma = post_karma + 1, karma = karma + 1 where id = post_author_id;
    else
      update public.posts set downvotes = downvotes + 1 where id = NEW.post_id;
      update public.profiles set post_karma = post_karma - 1, karma = karma - 1 where id = post_author_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_vote_change on public.post_votes;
create trigger on_post_vote_change
  after insert or update or delete on public.post_votes
  for each row execute procedure update_post_votes();

-- ============================================
-- COMMENTS
-- ============================================
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  upvotes integer default 0,
  downvotes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone" on public.comments
  for select using (true);

drop policy if exists "Authenticated users can create comments" on public.comments;
create policy "Authenticated users can create comments" on public.comments
  for insert with check (auth.uid() = author_id);

drop policy if exists "Users can update their own comments" on public.comments;
create policy "Users can update their own comments" on public.comments
  for update using (auth.uid() = author_id);

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = author_id);

-- Trigger to update post comment count
create or replace function update_post_comment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set comment_count = comment_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_change on public.comments;
create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure update_post_comment_count();

-- ============================================
-- COMMENT VOTES
-- ============================================
create table if not exists public.comment_votes (
  user_id uuid references public.profiles(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  vote_type smallint not null check (vote_type in (-1, 1)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, comment_id)
);

alter table public.comment_votes enable row level security;

drop policy if exists "Comment votes viewable" on public.comment_votes;
create policy "Comment votes viewable" on public.comment_votes
  for select using (true);

drop policy if exists "Users can vote comments" on public.comment_votes;
create policy "Users can vote comments" on public.comment_votes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can change comment vote" on public.comment_votes;
create policy "Users can change comment vote" on public.comment_votes
  for update using (auth.uid() = user_id);

drop policy if exists "Users can remove comment vote" on public.comment_votes;
create policy "Users can remove comment vote" on public.comment_votes
  for delete using (auth.uid() = user_id);

-- Function to update comment votes and karma
create or replace function update_comment_votes()
returns trigger as $$
declare
  comment_author_id uuid;
begin
  select author_id into comment_author_id from public.comments where id = coalesce(NEW.comment_id, OLD.comment_id);
  
  if TG_OP = 'INSERT' then
    if NEW.vote_type = 1 then
      update public.comments set upvotes = upvotes + 1 where id = NEW.comment_id;
      update public.profiles set comment_karma = comment_karma + 1, karma = karma + 1 where id = comment_author_id;
    else
      update public.comments set downvotes = downvotes + 1 where id = NEW.comment_id;
      update public.profiles set comment_karma = comment_karma - 1, karma = karma - 1 where id = comment_author_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.vote_type = 1 then
      update public.comments set upvotes = upvotes - 1 where id = OLD.comment_id;
      update public.profiles set comment_karma = comment_karma - 1, karma = karma - 1 where id = comment_author_id;
    else
      update public.comments set downvotes = downvotes - 1 where id = OLD.comment_id;
      update public.profiles set comment_karma = comment_karma + 1, karma = karma + 1 where id = comment_author_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_vote_change on public.comment_votes;
create trigger on_comment_vote_change
  after insert or update or delete on public.comment_votes
  for each row execute procedure update_comment_votes();

-- ============================================
-- STORAGE FOR AVATARS
-- ============================================
-- Run this separately in Supabase Dashboard > Storage

-- Create bucket for avatars (do this in Storage UI):
-- 1. Go to Storage
-- 2. Create new bucket called "avatars"
-- 3. Make it public

-- Or run this SQL:
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
on storage.objects for select
using ( bucket_id = 'avatars' );

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects for insert
with check ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects for update
using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects for delete
using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- ============================================
-- SEED DATA - Default Communities
-- ============================================
insert into public.communities (slug, name, description) values
  ('showerthoughts', 'Shower Thoughts', 'Random thoughts and observations that hit you in the shower'),
  ('aita', 'Am I The Asshole', 'A place to get perspective on your conflicts'),
  ('offmychest', 'Off My Chest', 'A safe space to share what you need to get off your chest'),
  ('todayilearned', 'Today I Learned', 'Share interesting things you learned today'),
  ('askhumans', 'Ask Humans', 'Ask questions, get human answers'),
  ('mildlyinteresting', 'Mildly Interesting', 'For things that are just... mildly interesting')
on conflict (slug) do nothing;
