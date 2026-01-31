-- ============================================
-- HUMANSONLY - CUSTOM AUTH MIGRATION
-- Run this to enable custom authentication
-- ============================================

-- Remove the foreign key constraint to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add password_hash and email columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN password_hash text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email text UNIQUE;
  END IF;
END $$;

-- Drop the trigger that creates profile on auth.users signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Update RLS policies for custom auth
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Or if you want RLS, use these permissive policies:
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
-- CREATE POLICY "Anyone can create profile" ON public.profiles FOR INSERT WITH CHECK (true);
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
-- CREATE POLICY "Anyone can update profile" ON public.profiles FOR UPDATE USING (true);

-- Done!
SELECT 'Custom auth migration complete! RLS disabled on profiles.' as status;
