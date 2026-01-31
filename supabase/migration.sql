-- ============================================
-- HUMANSONLY - MIGRATION SCRIPT
-- Run this if you already have the old tables
-- ============================================

-- Add role column to community_members if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.community_members ADD COLUMN role text default 'member' check (role in ('member', 'moderator', 'admin'));
  END IF;
END $$;

-- Add karma columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'karma'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN karma integer default 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'post_karma'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN post_karma integer default 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'comment_karma'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN comment_karma integer default 0;
  END IF;
END $$;

-- Create community_bans table if it doesn't exist
create table if not exists public.community_bans (
  community_id uuid references public.communities(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  banned_by uuid references public.profiles(id),
  reason text,
  banned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (community_id, user_id)
);

alter table public.community_bans enable row level security;

-- Policies for community_bans
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

-- Update policies for community_members to handle roles
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

-- Update function for post votes to include karma
create or replace function update_post_votes()
returns trigger as $$
declare
  post_author_id uuid;
begin
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
    if OLD.vote_type = 1 then
      update public.posts set upvotes = upvotes - 1 where id = OLD.post_id;
      update public.profiles set post_karma = post_karma - 1, karma = karma - 1 where id = post_author_id;
    else
      update public.posts set downvotes = downvotes - 1 where id = OLD.post_id;
      update public.profiles set post_karma = post_karma + 1, karma = karma + 1 where id = post_author_id;
    end if;
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

-- Update function for comment votes to include karma
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

-- Create avatars storage bucket
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

-- Done!
SELECT 'Migration complete!' as status;
