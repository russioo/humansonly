import { NextResponse } from 'next/server'
import { hashPassword, createToken } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json()

    // Validate
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Check if username exists
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUsername) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
    }

    // Check if email exists
    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingEmail) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const userId = crypto.randomUUID()
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password_hash: passwordHash,
        display_name: username,
        is_verified_human: false,
        karma: 0,
        post_karma: 0,
        comment_karma: 0,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Create token
    const token = createToken({
      id: userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
    })

    // Set cookie
    const response = NextResponse.json({ success: true, user: { id: userId, username: username.toLowerCase() } })
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
