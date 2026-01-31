import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ user: null })
    }

    // Get full profile from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single()

    if (!profile) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ user: null })
  }
}
