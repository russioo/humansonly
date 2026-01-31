import { NextResponse } from 'next/server'
import { verifyPassword, createToken } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Validate
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('profiles')
      .select('id, username, email, password_hash, is_verified_human')
      .eq('email', email.toLowerCase())
      .single()

    if (findError || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Create token
    const token = createToken({
      id: user.id,
      username: user.username,
      email: user.email,
    })

    // Set cookie and return user info
    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username,
        is_verified_human: user.is_verified_human,
      } 
    })
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
