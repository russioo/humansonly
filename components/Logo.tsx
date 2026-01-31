import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  href?: string
}

const sizes = {
  sm: 32,
  md: 40,
  lg: 48,
}

export default function Logo({ size = 'sm', showText = true, href = '/' }: LogoProps) {
  const pixelSize = sizes[size]
  
  const logo = (
    <div className="flex items-center gap-2">
      <Image 
        src="/logo.png" 
        alt="HumansOnly" 
        width={pixelSize} 
        height={pixelSize}
        className="rounded-full object-cover"
      />
      {showText && (
        <span className="text-lg font-semibold text-gray-900">humansonly</span>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{logo}</Link>
  }

  return logo
}
