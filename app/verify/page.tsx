'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

type Challenge = {
  type: 'math' | 'sequence' | 'slider'
  question: string
  answer: string | number
}

function generateChallenge(): Challenge {
  const types = ['math', 'sequence', 'slider'] as const
  const type = types[Math.floor(Math.random() * types.length)]
  
  if (type === 'math') {
    const a = Math.floor(Math.random() * 10) + 1
    const b = Math.floor(Math.random() * 10) + 1
    const ops = ['+', '-', '×'] as const
    const op = ops[Math.floor(Math.random() * ops.length)]
    let answer: number
    
    switch (op) {
      case '+': answer = a + b; break
      case '-': answer = a - b; break
      case '×': answer = a * b; break
    }
    
    return { type: 'math', question: `${a} ${op} ${b} = ?`, answer }
  }
  
  if (type === 'sequence') {
    const sequences = [
      { q: '2, 4, 6, 8, ?', a: '10' },
      { q: '1, 3, 5, 7, ?', a: '9' },
      { q: '3, 6, 9, 12, ?', a: '15' },
      { q: '5, 10, 15, 20, ?', a: '25' },
      { q: '1, 2, 4, 8, ?', a: '16' },
    ]
    const seq = sequences[Math.floor(Math.random() * sequences.length)]
    return { type: 'sequence', question: seq.q, answer: seq.a }
  }
  
  return { type: 'slider', question: 'Slide to the end', answer: 100 }
}

export default function VerifyPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [sliderValue, setSliderValue] = useState(0)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const router = useRouter()
  const { user, loading: authLoading, refresh } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    setChallenge(generateChallenge())
    setStartTime(Date.now())
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const checkAnswer = async () => {
    if (!challenge) return
    
    const timeTaken = Date.now() - startTime
    
    if (timeTaken < 1000) {
      setError(true)
      setTimeout(() => {
        setError(false)
        setChallenge(generateChallenge())
        setUserAnswer('')
        setSliderValue(0)
        setStartTime(Date.now())
      }, 1500)
      return
    }
    
    let isCorrect = false
    
    if (challenge.type === 'slider') {
      isCorrect = sliderValue >= 95
    } else {
      isCorrect = userAnswer.trim() === String(challenge.answer)
    }
    
    if (isCorrect) {
      setVerified(true)
      
      // Mark user as verified in database
      if (user) {
        await supabase
          .from('profiles')
          .update({ is_verified_human: true })
          .eq('id', user.id)
        refresh()
      }
      
      setTimeout(() => router.push('/feed'), 1500)
    } else {
      setError(true)
      setTimeout(() => {
        setError(false)
        setChallenge(generateChallenge())
        setUserAnswer('')
        setSliderValue(0)
        setStartTime(Date.now())
      }, 1500)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') checkAnswer()
  }

  if (!challenge) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-12">
          <Logo />
        </div>

        {!verified ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-rose-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Human Verification</p>
                <p className="text-xs text-gray-400">Complete to continue</p>
              </div>
            </div>

            {challenge.type === 'math' && (
              <div>
                <p className="text-3xl font-bold text-gray-900 text-center mb-4">
                  {challenge.question}
                </p>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 bg-white border border-rose-100 rounded-lg text-center text-xl font-semibold focus:outline-none focus:border-rose-300 transition-colors"
                  placeholder="?"
                  autoFocus
                />
              </div>
            )}

            {challenge.type === 'sequence' && (
              <div>
                <p className="text-xs text-gray-400 text-center mb-2">What comes next?</p>
                <p className="text-2xl font-bold text-gray-900 text-center mb-4">
                  {challenge.question}
                </p>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 bg-white border border-rose-100 rounded-lg text-center text-xl font-semibold focus:outline-none focus:border-rose-300 transition-colors"
                  placeholder="?"
                  autoFocus
                />
              </div>
            )}

            {challenge.type === 'slider' && (
              <div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Slide all the way to the right
                </p>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="w-full h-12 appearance-none bg-rose-100 rounded-lg cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-14 [&::-webkit-slider-thumb]:h-10 [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:bg-gray-900 [&::-webkit-slider-thumb]:cursor-grab"
                  />
                  {sliderValue >= 95 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500 text-center mt-4">Try again</p>
            )}

            <button
              onClick={checkAnswer}
              className="w-full mt-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Verify
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Verified</h1>
            <p className="text-gray-500 text-sm">Welcome to HumansOnly</p>
          </div>
        )}
      </div>
    </div>
  )
}
