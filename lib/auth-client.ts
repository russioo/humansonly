import Cookies from 'js-cookie'

export interface AuthUser {
  id: string
  username: string
  email: string
}

// Set auth token in cookie
export function setAuthToken(token: string) {
  Cookies.set('auth_token', token, { expires: 7, sameSite: 'lax' })
}

// Remove auth token
export function removeAuthToken() {
  Cookies.remove('auth_token')
}

// Get auth token
export function getAuthToken(): string | undefined {
  return Cookies.get('auth_token')
}

// Decode token without verification (for client-side)
export function decodeToken(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    }
  } catch {
    return null
  }
}

// Get current user from cookie (client-side)
export function getCurrentUserClient(): AuthUser | null {
  const token = getAuthToken()
  if (!token) return null
  return decodeToken(token)
}
