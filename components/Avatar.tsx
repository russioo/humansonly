'use client'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizes[size]
  const letter = (name || '?')[0].toUpperCase()

  if (src) {
    return (
      <img 
        src={src} 
        alt={name || 'Avatar'}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-rose-200 to-rose-300 flex items-center justify-center font-bold text-rose-600 ${className}`}>
      {letter}
    </div>
  )
}
